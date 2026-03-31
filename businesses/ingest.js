// [2026-03-21] - Ingestion API for Scraped Business Data
// Endpoint: POST /api/ingest/businesses
// Requirements:
// 1. Bulk processing up to 100 records.
// 2. Mapping of scraped fields (category array, rating, reviews, source_url).
// 3. Deduplication on (source, external_id) without relying on google_place_id.
// 4. Counts for created/updated.

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('../events/utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role for ingestion to bypass RLS and perform bulk upserts
const getSupabase = () => {
    return createClient(supabaseUrl, supabaseServiceRoleKey || supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Ingest Businesses] Request started');

    // 1. Authenticate User (Basic RBAC)
    const authHeader = req.headers.authorization ||
        req.headers['x-user-token'] ||
        req.headers['x-supabase-token'] ||
        req.headers['x-original-authorization'];

    try {
        const { user, error: authError } = await getAuthenticatedUser(authHeader);
        if (authError || !user) {
            console.error('[Ingest Businesses] Auth failed:', authError);
            return res.status(401).json({ error: authError || 'Authentication required' });
        }

        const data = req.body;

        // 2. Validate input is an array
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'Input must be an array of business objects' });
        }

        if (data.length > 100) {
            return res.status(400).json({ error: 'Maximum 100 records per request' });
        }

        const supabase = getSupabase();
        let count_created = 0;
        let count_updated = 0;
        const errors = [];
        const recordsToUpsert = [];

        // 3. Process and map records
        const externalIdentifiers = [];
        const processedRecords = data.filter((item, index) => {
            const { name, source, external_id } = item;

            // Simple validation
            if (!name || !source || !external_id) {
                errors.push({ index, message: 'Missing required fields: name, source, or external_id' });
                return false;
            }

            externalIdentifiers.push({ source, external_id });
            return true;
        });

        if (processedRecords.length === 0) {
            return res.status(200).json({
                success: true,
                count_created: 0,
                count_updated: 0,
                errors: errors.length > 0 ? errors : undefined
            });
        }

        // 4. Check for existing records to differentiate Created vs Updated
        // We'll perform one batch query to find existing matches
        const existingRecords = new Map();
        try {
            // Complex queries for multiple (source, external_id) pairs are tricky in Supabase/PostgREST.
            // For batch of 100, it's safer to match existing via the unique index after upsert 
            // but the user wants explicit counts. 
            // We'll use a string concat key approach for matching.
            
            // Build the query to find existing source/external_id pairs
            const { data: foundRecords, error: fetchErr } = await supabase
                .from('businesses')
                .select('id, source, external_id')
                .in('source', [...new Set(processedRecords.map(r => r.source))])
                .in('external_id', [...new Set(processedRecords.map(r => r.external_id))]);

            if (foundRecords) {
                foundRecords.forEach(r => {
                    const key = `${r.source}:${r.external_id}`;
                    existingRecords.set(key, r.id);
                });
            }
        } catch (fetchErr) {
            console.warn('[Ingest Businesses] Non-critical error fetching existing records:', fetchErr);
        }

        // 5. Build final records for bulk upsert
        const businessesToUpsert = processedRecords.map(item => {
            const key = `${item.source}:${item.external_id}`;
            const exists = existingRecords.has(key);
            
            if (exists) {
                count_updated++;
            } else {
                count_created++;
            }

            return {
                name: item.name,
                source: item.source,
                external_id: item.external_id,
                external_source_url: item.source_url || null,
                category: Array.isArray(item.category) ? item.category[0] || 'Unknown' : item.category || 'Unknown',
                business_type_tags: Array.isArray(item.category) ? item.category : (item.category ? [item.category] : []),
                google_rating: item.rating ? parseFloat(item.rating) : null,
                google_review_count: item.reviews ? parseInt(item.reviews) : 0,
                address: item.address || 'Unknown Address',
                latitude: item.latitude || 0,
                longitude: item.longitude || 0,
                phone: item.phone || null,
                email: item.email || null,
                website_url: item.website || null,
                description: item.description || null,
                partnership_status: 'pending' // Default for new ingestion
            };
        });

        // 6. Perform Bulk Upsert
        const { data: upsertResults, error: upsertError } = await supabase
            .from('businesses')
            .upsert(businessesToUpsert, { 
                onConflict: 'source,external_id',
                ignoreDuplicates: false 
            })
            .select('id');

        if (upsertError) {
            console.error('[Ingest Businesses] Upsert failed:', upsertError);
            return res.status(500).json({ 
                error: 'Ingestion failed', 
                message: upsertError.message,
                count_created: 0,
                count_updated: 0,
                errors: [{ message: upsertError.message }]
            });
        }

        // 7. Final Response
        console.log(`[Ingest Businesses] Success: ${count_created} created, ${count_updated} updated`);
        return res.status(200).json({
            success: true,
            count_created,
            count_updated,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (err) {
        console.error('[Ingest Businesses] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};
