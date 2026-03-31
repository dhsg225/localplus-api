const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('../events/utils/rbac');
const fetch = require('node-fetch');
const crypto = require('crypto');
const Busboy = require('busboy');

// Environment Config
const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

const getSupabase = (useServiceRole = false) => {
    return createClient(supabaseUrl, useServiceRole ? supabaseServiceRoleKey : supabaseKey);
};

// --- HELPER LOGIC FOR EVENTS ---
function roundTimeTo15(isoString) {
    if (!isoString) return null;
    const date = new Date(isoString);
    const ms = 1000 * 60 * 15; 
    const rounded = new Date(Math.round(date.getTime() / ms) * ms);
    return rounded.toISOString();
}

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
    return { start: start ? start.toISOString() : null, end: end ? end.toISOString() : null, isInferred };
}

function similarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    const editDistance = (s1, s2) => {
        s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
        let costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0) costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    };
    return (longer.length - editDistance(s1, s2)) / longer.length;
}

// --- MAIN UNIFIED HANDLER ---
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    console.log(`[Unified Ingest] Request: ${req.method} ${req.url}`);

    // Auth is required for all ingestion logic
    const authHeader = req.headers.authorization || req.headers['x-user-token'] || req.headers['x-supabase-token'] || req.headers['x-original-authorization'];
    const { user, error: authError } = await getAuthenticatedUser(authHeader);
    if (authError || !user) {
        return res.status(401).json({ error: authError || 'Authentication required' });
    }

    // Determine Ingest Target from Path or Parameter
    const path = req.url.split('?')[0];
    const isRestaurant = path.includes('/restaurants/ingest') || req.headers['content-type']?.includes('multipart');
    const isBusiness = path.includes('/ingest/businesses');
    const isEvents = path.includes('/data-ingest');

    try {
        const supabase = getSupabase(isBusiness); // Business needs Service Role for bulk upserts

        // 🍕 TARGET 1: RESTAURANT MENUS (Multipart/Images)
        if (isRestaurant) {
            return new Promise((resolve) => {
                const busboy = Busboy({ headers: req.headers });
                let fileBuffer = null; let mimeType = ''; let businessId = '';
                busboy.on('file', (fieldname, file, info) => {
                    mimeType = info.mimeType;
                    const chunks = [];
                    file.on('data', (d) => chunks.push(d));
                    file.on('end', () => fileBuffer = Buffer.concat(chunks));
                });
                busboy.on('field', (name, val) => { if (name === 'business_id') businessId = val; });
                busboy.on('finish', async () => {
                    if (!fileBuffer || !businessId) { res.status(400).json({ error: 'Missing file or business_id' }); return resolve(); }
                    const base64Image = fileBuffer.toString('base64');
                    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST', headers: { 'Authorization': `Bearer ${openRouterApiKey}`, 'Content-Type': 'application/json', 'X-Title': 'LocalPlus Menu Ingest' },
                        body: JSON.stringify({
                            model: 'google/gemini-2.0-flash-001',
                            messages: [{ role: 'user', content: [{ type: 'text', text: 'Extract menu items into JSON: { "categories": [{ "name": "...", "items": [{ "name": "...", "price": 0.0 }] }] }' }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }] }],
                            response_format: { type: 'json_object' }
                        })
                    });
                    const aiData = await aiResponse.json();
                    const structuredData = JSON.parse(aiData.choices[0].message.content);
                    res.status(200).json({ success: true, business_id: businessId, menu: structuredData });
                    resolve();
                });
                req.pipe(busboy);
            });
        }

        // 💼 TARGET 2: BUSINESS DIRECTORY (Bulk JSON)
        if (isBusiness) {
            const data = req.body;
            if (!Array.isArray(data)) return res.status(400).json({ error: 'Input must be an array' });
            let count_c = 0; let count_u = 0;
            const existing = new Set();
            const found = await supabase.from('businesses').select('source, external_id').in('source', [...new Set(data.map(d=>d.source))]);
            if (found.data) found.data.forEach(r => existing.add(`${r.source}:${r.external_id}`));
            
            const records = data.map(dim => {
                const key = `${dim.source}:${dim.external_id}`;
                if (existing.has(key)) count_u++; else count_c++;
                return { name: dim.name, source: dim.source, external_id: dim.external_id, category: dim.category?.[0] || 'Unknown', google_rating: dim.rating, address: dim.address || 'Unknown' };
            });
            await supabase.from('businesses').upsert(records, { onConflict: 'source,external_id' });
            return res.status(200).json({ success: true, count_created: count_c, count_updated: count_u });
        }

        // 📅 TARGET 3: EVENTS ENGINE (Messy Text / AI Parsing)
        if (isEvents) {
            const endpoint = req.query?.endpoint || req.body?.endpoint;
            
            if (req.method === 'POST' && endpoint === 'parse') {
                const { organization_id, source_name, raw_content, global_date, mode = 'terry' } = req.body;
                const profileMap = { terry: 'terry_structured_v1', facebook: 'fb_raw_dump_v1', ocr: 'ocr_noisy_v1', manual: 'manual_blank_v1' };
                const source_profile = profileMap[mode] || 'default_v1';
                const dateContext = global_date || new Date().toISOString().split('T')[0];
                const cleanedContent = preProcessContent(raw_content, mode);
                const { data: batch } = await supabase.from('ingestion_batches').insert([{ organization_id, source_name, raw_content: cleanedContent, global_date: dateContext, mode, source_profile, status: 'processing' }]).select().single();

                let extracted = [];
                const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
                    body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 4000, system: `JSON output. Mode: ${mode}.`, messages: [{ role: 'user', content: `Ingest: "${cleanedContent}"` }] })
                });
                const aiData = await aiRes.json();
                extracted = JSON.parse(aiData.content[0].text).events || [];

                const venues = (await supabase.from('venues').select('id, name')).data || [];
                const aliases = (await supabase.from('venue_aliases').select('venue_id, alias_name')).data || [];
                const targets = [...venues.map(v=>({id:v.id,name:v.name})), ...aliases.map(a=>({id:a.venue_id,name:a.alias_name}))];
                const queueItems = []; const groups = new Map();

                for (const item of extracted) {
                    const results = targets.map(t=>({id:t.id,sim:similarity(item.raw_venue, t.name)})).sort((a,b)=>b.sim-a.sim);
                    const best = results[0]; let vId = null; let conf = best ? best.sim : 0;
                    if (conf >= ((mode==='ocr')?0.95:0.90)) vId = best.id; else if (conf >= 0.70 && mode !== 'ocr') vId = best.id;
                    const { start, end, isInferred } = normalizeTime(item.raw_time, item.raw_date || dateContext);
                    const gKey = `${vId || item.raw_venue}-${item.raw_date || dateContext}`;
                    if (!groups.has(gKey)) groups.set(gKey, crypto.randomUUID());
                    const fp = crypto.createHash('sha256').update(`${vId}-${item.raw_date}-${roundTimeTo15(start)}-${item.raw_performer}`).digest('hex');
                    const { data: ex } = await supabase.from('event_instances').select('id').eq('dedupe_fingerprint', fp).is('deleted_at', null).limit(1).single();
                    queueItems.push({ batch_id: batch.id, ingestion_group_id: groups.get(gKey), raw_date: item.raw_date || dateContext, raw_time: item.raw_time, raw_venue: item.raw_venue, raw_performer: item.raw_performer, extracted_title: item.raw_title, start_time: start, end_time: end, is_inferred_duration: isInferred, matched_venue_id: vId, matching_confidence: conf * 100, dedupe_fingerprint: fp, duplicate_warning: !!ex, existing_instance_id: ex?.id || null, raw_snippet_context: item.raw_snippet });
                }
                await supabase.from('ingestion_queues').insert(queueItems);
                await supabase.from('ingestion_batches').update({ status: 'pending_validation', total_items: queueItems.length }).eq('id', batch.id);
                return res.status(200).json({ success: true, batchId: batch.id });
            }

            // Simple GET Proxy Logic for Dashboard
            if (req.method === 'GET' && endpoint === 'batches') {
                const { data } = await supabase.from('ingestion_batches').select('*').eq('organization_id', req.query.organizationId).order('created_at', { ascending: false });
                return res.status(200).json({ success: true, data });
            }
            if (req.method === 'GET' && endpoint === 'queue') {
                const { data } = await supabase.from('ingestion_queues').select('*').eq('batch_id', req.query.batchId).order('created_at', { ascending: true });
                return res.status(200).json({ success: true, data });
            }
            // Commit/Rollback handlers... (same logic as before, consolidated)
            if (req.method === 'POST' && endpoint === 'commit') {
                const { data: rows } = await supabase.from('ingestion_queues').select('*').eq('batch_id', req.body.batchId).eq('validation_status', 'approved');
                const { data: batch } = await supabase.from('ingestion_batches').select('organization_id').eq('id', req.body.batchId).single();
                let { data: st } = await supabase.from('events').select('id').eq('organization_id', batch.organization_id).eq('title', 'Ingested Content Reservoir').single();
                if (!st) st = (await supabase.from('events').insert([{ organization_id: batch.organization_id, title: 'Ingested Content Reservoir', status: 'published', event_type: 'general' }]).select().single()).data;
                const pl = rows.map(r => ({ event_id: st.id, start_time: r.start_time, end_time: r.end_time, source_type: 'ingested', metadata: { ingestion_batch_id: req.body.batchId, venue: r.raw_venue, performer: r.raw_performer, title: r.extracted_title }}));
                await supabase.from('event_instances').insert(pl);
                await supabase.from('ingestion_batches').update({ status: 'completed' }).eq('id', req.body.batchId);
                return res.status(200).json({ success: true });
            }
        }

        return res.status(405).json({ error: 'Endpoint or Method mismatch' });
    } catch (err) {
        console.error('[Unified Ingest] Error:', err);
        return res.status(500).json({ error: err.message });
    }
};
