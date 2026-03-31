const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mode-Aware Pre-processing
 */
function preProcessContent(content, mode) {
    if (mode === 'facebook') {
        // Lighter cleanup: rely on AI extraction
        return content.trim();
    }
    
    if (mode === 'ocr') {
        // Strip noise/artifacts common in OCR
        return content.replace(/[|I\[\]]/g, '').replace(/\s+/g, ' ').trim();
    }

    if (mode === 'terry') {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let currentVenue = null;
        const processedLines = [];
        for (let line of lines) {
            const isVenueOnly = !line.includes(':') && !/\d+(am|pm|:)/i.test(line) && line.length < 50;
            if (isVenueOnly) { currentVenue = line; continue; }
            if (currentVenue && !line.toLowerCase().includes(currentVenue.toLowerCase())) {
                processedLines.push(`${currentVenue} - ${line}`);
            } else { processedLines.push(line); }
        }
        return processedLines.join('\n');
    }

    return content.trim();
}

/**
 * Standard rounding for 15 min buckets to help deduplication
 */
function roundTimeTo15(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    const ms = 1000 * 60 * 15; 
    const rounded = new Date(Math.round(date.getTime() / ms) * ms);
    return rounded.toISOString();
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function similarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const distance = (function(s1, s2) {
        s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
        let costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    })(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Normalizes time strings (e.g. 5p, 9, 7p-8p) to ISO
 */
function normalizeTime(timeStr, dateContext) {
    if (!timeStr) return { start: null, end: null, isInferred: true };
    
    // Default to 'p' if a bare number like '9' is provided
    let cleanStr = timeStr.toLowerCase().trim();
    if (/^\d+$/.test(cleanStr)) cleanStr += 'p';
    
    // Match patterns like '7p-8p' or '19:00 - 21:00'
    const parts = cleanStr.split(/[-–—/]/).map(p => p.trim());
    
    const parseSingle = (s) => {
        // Simple manual expansion. Better: use a library in a full build.
        let hours = 0;
        const match = s.match(/(\d+)(?::(\d+))?\s*(a|p)?m?/);
        if (!match) return null;
        hours = parseInt(match[1]);
        const mins = match[2] ? parseInt(match[2]) : 0;
        const period = match[3];
        
        if (period === 'p' && hours < 12) hours += 12;
        if (period === 'a' && hours === 12) hours = 0;
        if (!period && hours > 0 && hours < 12) hours += 12; // Inferred PM
        
        const d = new Date(dateContext);
        d.setHours(hours, mins, 0, 0);
        return d;
    };

    const start = parseSingle(parts[0]);
    let end = parts[1] ? parseSingle(parts[1]) : null;
    let isInferred = false;

    if (start && !end) {
        end = new Date(start);
        end.setHours(end.getHours() + 2); // Default 2hr duration
        isInferred = true;
    }

    return { 
        start: start ? start.toISOString() : null, 
        end: end ? end.toISOString() : null, 
        isInferred 
    };
}

exports.dataIngest = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const endpoint = req.query?.endpoint || req.body?.endpoint;

    try {
        // --- 1. PARSE (POST) ---
        if (req.method === 'POST' && endpoint === 'parse') {
            const { organization_id, source_name, raw_content, global_date, mode = 'terry' } = req.body;
            if (!organization_id || !raw_content) throw new Error('Missing org or content');
            
            // 🎯 Source Profile Determination (Backward Compatible)
            const profileMap = {
                terry: 'terry_structured_v1', facebook: 'fb_raw_dump_v1',
                ocr: 'ocr_noisy_v1', manual: 'manual_blank_v1'
            };
            const source_profile = profileMap[mode] || 'default_v1';

            const dateContext = global_date || new Date().toISOString().split('T')[0];
            const cleanedContent = preProcessContent(raw_content, mode);

            // Create Batch (Store Mode + Profile)
            const { data: batch, error: batchError } = await supabase
                .from('ingestion_batches')
                .insert([{ organization_id, source_name, raw_content: cleanedContent, global_date: dateContext, mode, source_profile, status: 'processing' }])
                .select().single();
            if (batchError) throw batchError;

            let extractedEvents = [];

            if (mode === 'manual') {
                // BYPASS AI for Manual Mode
                extractedEvents = [{
                    raw_title: 'Manual Entry', raw_performer: 'Draft Performer',
                    raw_venue: 'Draft Venue', raw_date: dateContext, raw_time: '19:00',
                    raw_snippet: 'Created manually.'
                }];
            } else {
                // 🔐 JSON Parsing Safety Layer (Stability Fix)
                let aiRawText = '';
                try {
                    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
                        body: JSON.stringify({
                            model: 'claude-3-5-sonnet-20240620', max_tokens: 4000,
                            system: `Output JSON events. Mode: ${mode}. Profile: ${source_profile}. Rule: One act per object. Use Date: ${dateContext} if missing.`,
                            messages: [{ role: 'user', content: `Ingest: """${cleanedContent}"""` }]
                        })
                    });

                    const aiData = await aiResponse.json();
                    aiRawText = aiData.content[0].text;
                    const parsed = JSON.parse(aiRawText);
                    extractedEvents = parsed.events || [];
                } catch (parseErr) {
                    // Fail Gracefully, no silent crashes
                    await supabase.from('ingestion_batches')
                        .update({ status: 'failed', metadata: { raw_ai_response: aiRawText, error: parseErr.message }})
                        .eq('id', batch.id);
                    return res.status(200).json({ success: false, error: 'AI Parsing Failed. Raw response saved to logs.', batchId: batch.id });
                }
            }

            // 📍 Venue Matching with Alias Foundation
            const allVenues = (await supabase.from('venues').select('id, name')).data || [];
            const allAliases = (await supabase.from('venue_aliases').select('venue_id, alias_name')).data || [];
            
            // Build a searchable map of target names
            const lookupTargets = [
                ...allVenues.map(v => ({ id: v.id, name: v.name })),
                ...allAliases.map(a => ({ id: a.venue_id, name: a.alias_name }))
            ];

            const queueItems = [];
            const venueDayGroups = new Map();

            for (const item of extractedEvents) {
                // Improved logic: Search against canonical names AND aliases
                const simResults = lookupTargets.map(t => ({ id: t.id, similarity: similarity(item.raw_venue, t.name) }))
                    .sort((a,b) => b.similarity - a.similarity);
                
                const best = simResults[0];
                let matched_venue_id = null;
                let conf = best ? best.similarity : 0;

                // Mode-Specific Confidence Rules
                const targetConfidence = (mode === 'ocr') ? 0.95 : 0.90;
                if (conf >= targetConfidence) matched_venue_id = best.id;
                else if (conf >= 0.70 && mode !== 'ocr') matched_venue_id = best.id;

                const { start, end, isInferred } = normalizeTime(item.raw_time, item.raw_date || dateContext);
                const groupKey = `${matched_venue_id || item.raw_venue}-${item.raw_date || dateContext}`;
                if (!venueDayGroups.has(groupKey)) venueDayGroups.set(groupKey, crypto.randomUUID());

                const fingerprint = crypto.createHash('sha256').update(
                    `${matched_venue_id}-${item.raw_date}-${roundTimeTo15(start)}-${item.raw_performer}`
                ).digest('hex');

                const { data: existing } = await supabase.from('event_instances')
                    .select('id').eq('dedupe_fingerprint', fingerprint).is('deleted_at', null).limit(1).single();

                queueItems.push({
                    batch_id: batch.id, ingestion_group_id: venueDayGroups.get(groupKey),
                    raw_date: item.raw_date || dateContext, raw_time: item.raw_time,
                    raw_venue: item.raw_venue, raw_performer: item.raw_performer,
                    extracted_title: item.raw_title, start_time: start, end_time: end,
                    is_inferred_duration: isInferred, matched_venue_id, matching_confidence: conf * 100,
                    dedupe_fingerprint: fingerprint, duplicate_warning: !!existing, existing_instance_id: existing?.id || null,
                    raw_snippet_context: item.raw_snippet
                });
            }

            await supabase.from('ingestion_queues').insert(queueItems);
            await supabase.from('ingestion_batches').update({ status: 'pending_validation', total_items: queueItems.length }).eq('id', batch.id);

            return res.status(200).json({ success: true, batchId: batch.id });
        }

        // --- 2. GET BATCHES ---
        if (req.method === 'GET' && endpoint === 'batches') {
            const { organizationId } = req.query;
            const { data, error } = await supabase.from('ingestion_batches')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // --- 3. GET QUEUE ---
        if (req.method === 'GET' && endpoint === 'queue') {
            const { batchId } = req.query;
            const { data, error } = await supabase.from('ingestion_queues')
                .select('*')
                .eq('batch_id', batchId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // --- 4. UPDATE QUEUE ITEM ---
        if (req.method === 'PUT' && endpoint === 'update-row') {
            const { id, updates } = req.body;
            const { data, error } = await supabase.from('ingestion_queues')
                .update(updates)
                .eq('id', id)
                .select().single();
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        }

        // --- 5. COMMIT BATCH (Phase I2) ---
        if (req.method === 'POST' && endpoint === 'commit') {
            const { batchId } = req.body;
            const { data: approvedRows } = await supabase.from('ingestion_queues')
                .select('*')
                .eq('batch_id', batchId)
                .eq('validation_status', 'approved');

            if (!approvedRows || approvedRows.length === 0) throw new Error('No approved rows to commit');

            // Find a system organization_id for these events
            const { data: batch } = await supabase.from('ingestion_batches').select('organization_id').eq('id', batchId).single();

            // Transform into event_instances
            const instances = approvedRows.map(row => ({
                event_id: null, // We'll link to a placeholder event strategy or create one
                start_time: row.start_time,
                end_time: row.end_time,
                source_type: 'ingested',
                metadata: {
                    ingestion_batch_id: batchId,
                    raw_snippet: row.raw_snippet_context,
                    venue_name: row.raw_venue,
                    performer: row.raw_performer,
                    title: row.extracted_title
                }
            }));
            
            // SECURITY: No mutation of strategies. We create a generic "Ingested Contents" strategy if missing.
            let { data: strategy } = await supabase.from('events').select('id')
                .eq('organization_id', batch.organization_id)
                .eq('title', 'Ingested Content Reservoir')
                .single();
            
            if (!strategy) {
                const { data: newStrategy } = await supabase.from('events').insert([{
                    organization_id: batch.organization_id,
                    title: 'Ingested Content Reservoir',
                    status: 'published',
                    event_type: 'general'
                }]).select().single();
                strategy = newStrategy;
            }

            const commitPayload = instances.map(i => ({ ...i, event_id: strategy.id }));
            const { error: commitError } = await supabase.from('event_instances').insert(commitPayload);
            if (commitError) throw commitError;

            await supabase.from('ingestion_batches').update({ status: 'completed' }).eq('id', batchId);
            return res.status(200).json({ success: true });
        }

        // --- 6. ROLLBACK BATCH ---
        if (req.method === 'POST' && endpoint === 'rollback') {
            const { batchId } = req.body;
            const { error } = await supabase.from('event_instances')
                .delete()
                .eq('metadata->>ingestion_batch_id', batchId);
            if (error) throw error;
            
            await supabase.from('ingestion_batches').update({ status: 'pending_validation' }).eq('id', batchId);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('[Ingest] Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
