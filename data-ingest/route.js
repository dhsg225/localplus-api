const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
 * Mode-Aware Pre-processing
 */
function preProcessContent(content, mode) {
    if (mode === 'facebook') return content.trim();
    if (mode === 'ocr') return content.replace(/[|I\[\]]/g, '').replace(/\s+/g, ' ').trim();
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
 * Normalizes time strings
 */
function normalizeTime(timeStr, dateContext) {
    if (!timeStr) return { start: null, end: null, isInferred: true };
    let cleanStr = timeStr.toLowerCase().trim();
    if (/^\d+$/.test(cleanStr)) cleanStr += 'p';
    const parts = cleanStr.split(/[-–—/]/).map(p => p.trim());
    const parseSingle = (s) => {
        let hours = 0;
        const match = s.match(/(\d+)(?::(\d+))?\s*(a|p)?m?/);
        if (!match) return null;
        hours = parseInt(match[1]);
        const mins = match[2] ? parseInt(match[2]) : 0;
        const period = match[3];
        if (period === 'p' && hours < 12) hours += 12;
        if (period === 'a' && hours === 12) hours = 0;
        if (!period && hours > 0 && hours < 12) hours += 12;
        const d = new Date(dateContext);
        d.setHours(hours, mins, 0, 0);
        return d;
    };
    const start = parseSingle(parts[0]);
    let end = parts[1] ? parseSingle(parts[1]) : null;
    let isInferred = false;
    if (start && !end) {
        end = new Date(start);
        end.setHours(end.getHours() + 2);
        isInferred = true;
    }
    return { 
        start: start ? start.toISOString() : null, 
        end: end ? end.toISOString() : null, 
        isInferred 
    };
}

/**
 * Simple Levenshtein distance
 */
function similarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
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
    })(longer, (s1.length > s2.length ? s2 : s1));
    return (longer.length - distance) / longer.length;
}

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const endpoint = req.query?.endpoint || req.body?.endpoint;

    try {
        // --- 1. PARSE (POST) ---
        if (req.method === 'POST' && endpoint === 'parse') {
            const { organization_id, source_name, raw_content, global_date, mode = 'terry' } = req.body;
            if (!organization_id || !raw_content) throw new Error('Missing org or content');
            
            const profileMap = { terry: 'terry_structured_v1', facebook: 'fb_raw_dump_v1', ocr: 'ocr_noisy_v1', manual: 'manual_blank_v1' };
            const source_profile = profileMap[mode] || 'default_v1';
            const dateContext = global_date || new Date().toISOString().split('T')[0];
            const cleanedContent = preProcessContent(raw_content, mode);

            const { data: batch, error: batchError } = await supabase.from('ingestion_batches')
                .insert([{ organization_id, source_name, raw_content: cleanedContent, global_date: dateContext, mode, source_profile, status: 'processing' }])
                .select().single();
            if (batchError) throw batchError;

            let extractedEvents = [];
            if (mode === 'manual') {
                extractedEvents = [{ raw_title: 'Manual Entry', raw_performer: 'Draft Performer', raw_venue: 'Draft Venue', raw_date: dateContext, raw_time: '19:00', raw_snippet: 'Manual' }];
            } else {
                let aiRawText = '';
                try {
                    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
                        body: JSON.stringify({
                            model: 'claude-3-5-sonnet-20240620', max_tokens: 4000,
                            system: `Output JSON. Mode: ${mode}. Profile: ${source_profile}. Rule: One act per object.`,
                            messages: [{ role: 'user', content: `Ingest: """${cleanedContent}"""` }]
                        })
                    });
                    const aiData = await aiResponse.json();
                    if (aiData.error) throw new Error(aiData.error.message);
                    aiRawText = aiData.content[0].text;
                    const parsed = JSON.parse(aiRawText);
                    extractedEvents = parsed.events || [];
                } catch (pErr) {
                    await supabase.from('ingestion_batches').update({ status: 'failed', metadata: { raw: aiRawText, err: pErr.message }}).eq('id', batch.id);
                    return res.status(200).json({ success: false, error: 'AI Error', batchId: batch.id });
                }
            }

            const allVenues = (await supabase.from('venues').select('id, name')).data || [];
            const allAliases = (await supabase.from('venue_aliases').select('venue_id, alias_name')).data || [];
            const targets = [...allVenues.map(v=>({id:v.id,name:v.name})), ...allAliases.map(a=>({id:a.venue_id,name:a.alias_name}))];
            const queueItems = [];
            const groups = new Map();

            for (const item of extractedEvents) {
                const results = targets.map(t=>({id:t.id,sim:similarity(item.raw_venue, t.name)})).sort((a,b)=>b.sim-a.sim);
                const best = results[0];
                let vId = null;
                let conf = best ? best.sim : 0;
                if (conf >= ((mode==='ocr')?0.95:0.90)) vId = best.id;
                else if (conf >= 0.70 && mode !== 'ocr') vId = best.id;

                const { start, end, isInferred } = normalizeTime(item.raw_time, item.raw_date || dateContext);
                const gKey = `${vId || item.raw_venue}-${item.raw_date || dateContext}`;
                if (!groups.has(gKey)) groups.set(gKey, crypto.randomUUID());

                const fp = crypto.createHash('sha256').update(`${vId}-${item.raw_date}-${roundTimeTo15(start)}-${item.raw_performer}`).digest('hex');
                const { data: ex } = await supabase.from('event_instances').select('id').eq('dedupe_fingerprint', fp).is('deleted_at', null).limit(1).single();

                queueItems.push({
                    batch_id: batch.id, ingestion_group_id: groups.get(gKey),
                    raw_date: item.raw_date || dateContext, raw_time: item.raw_time, raw_venue: item.raw_venue, raw_performer: item.raw_performer,
                    extracted_title: item.raw_title, start_time: start, end_time: end, is_inferred_duration: isInferred,
                    matched_venue_id: vId, matching_confidence: conf * 100, dedupe_fingerprint: fp, duplicate_warning: !!ex, existing_instance_id: ex?.id || null,
                    raw_snippet_context: item.raw_snippet
                });
            }
            await supabase.from('ingestion_queues').insert(queueItems);
            await supabase.from('ingestion_batches').update({ status: 'pending_validation', total_items: queueItems.length }).eq('id', batch.id);
            return res.status(200).json({ success: true, batchId: batch.id });
        }

        // --- GET / PUT handlers (Simplified Proxy) ---
        if (req.method === 'GET' && endpoint === 'batches') {
            const { data } = await supabase.from('ingestion_batches').select('*').eq('organization_id', req.query.organizationId).order('created_at', { ascending: false });
            return res.status(200).json({ success: true, data });
        }
        if (req.method === 'GET' && endpoint === 'queue') {
            const { data } = await supabase.from('ingestion_queues').select('*').eq('batch_id', req.query.batchId).order('created_at', { ascending: true });
            return res.status(200).json({ success: true, data });
        }
        if (req.method === 'PUT' && endpoint === 'update-row') {
            const { data } = await supabase.from('ingestion_queues').update(req.body.updates).eq('id', req.body.id).select().single();
            return res.status(200).json({ success: true, data });
        }
        if (req.method === 'POST' && endpoint === 'commit') {
            const { data: rows } = await supabase.from('ingestion_queues').select('*').eq('batch_id', req.body.batchId).eq('validation_status', 'approved');
            const { data: batch } = await supabase.from('ingestion_batches').select('organization_id').eq('id', req.body.batchId).single();
            let { data: st } = await supabase.from('events').select('id').eq('organization_id', batch.organization_id).eq('title', 'Ingested Content Reservoir').single();
            if (!st) st = (await supabase.from('events').insert([{ organization_id: batch.organization_id, title: 'Ingested Content Reservoir', status: 'published', event_type: 'general' }]).select().single()).data;
            const commitPayload = rows.map(r => ({ event_id: st.id, start_time: r.start_time, end_time: r.end_time, source_type: 'ingested', metadata: { ingestion_batch_id: req.body.batchId, venue: r.raw_venue, performer: r.raw_performer, title: r.extracted_title }}));
            await supabase.from('event_instances').insert(commitPayload);
            await supabase.from('ingestion_batches').update({ status: 'completed' }).eq('id', req.body.batchId);
            return res.status(200).json({ success: true });
        }
        if (req.method === 'POST' && endpoint === 'rollback') {
            await supabase.from('event_instances').delete().eq('metadata->>ingestion_batch_id', req.body.batchId);
            await supabase.from('ingestion_batches').update({ status: 'pending_validation' }).eq('id', req.body.batchId);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('[Ingest] Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
