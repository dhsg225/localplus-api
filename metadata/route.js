// Unified Metadata API Endpoint to save serverless function slots
// Handles: /api/locations, /api/categories
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper to get Supabase client
const getClient = (useServiceRole = false, authToken = null) => {
    if (useServiceRole && supabaseServiceRoleKey) {
        return createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
    }
    const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
    if (authToken) {
        // We can't easily set session synchronously on a new client without async, 
        // but for RLS we usually need it. 
        // The original code used `supabase.auth.getUser(token)` then `setSession`.
        // We'll handle this in the handler.
    }
    return client;
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type, search } = req.query; // 'type' injected via vercel.json rewrite

    try {
        // --- 1. CATEGORIES (GET only) ---
        if (type === 'categories') {
            if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

            const client = getClient(true); // Use service role for categories (public/mapping)
            let query = client.from('wp_term_mapping').select('term_id, name, slug').order('name', { ascending: true });

            if (search && search.trim()) {
                query = query.ilike('name', `%${search.trim()}%`);
            }
            query = query.limit(50);

            const { data, error } = await query;
            if (error) throw error;
            return res.status(200).json({ success: true, data: data || [] });
        }

        // --- 2. LOCATIONS (GET & POST) ---
        if (type === 'locations') {
            const authHeader = req.headers.authorization || req.headers['x-user-token'];
            const token = authHeader?.replace('Bearer ', '');

            // GET Locations
            if (req.method === 'GET') {
                const client = getClient(true); // Service role for public read
                let query = client.from('locations').select('*');
                if (search && search.trim()) {
                    query = query.ilike('name', `%${search.trim()}%`);
                }
                query = query.order('name', { ascending: true }).limit(50);

                const { data, error } = await query;
                if (error) throw error;
                return res.status(200).json({ success: true, data: data || [] });
            }

            // POST Locations
            if (req.method === 'POST') {
                // Needs auth
                const supabase = getClient(false);
                let user = null;
                if (token) {
                    const { data: { user: u }, error: uErr } = await supabase.auth.getUser(token);
                    if (u && !uErr) user = u;
                }

                // Use service role for insert to bypass RLS/ensure consistency if needed, 
                // or use authenticated client. Original used service role for insert but created_by from user?
                // Original used: `const client = supabaseAdmin || supabase;` -> Admin preferred.
                const client = getClient(true);

                const { name, description, address, latitude, longitude, map_url, image_url, facebook_url } = req.body;
                if (!name || !name.trim()) return res.status(400).json({ error: 'Location name is required' });

                const { data, error } = await client.from('locations').insert({
                    name: name.trim(),
                    description: description || null,
                    address: address || null,
                    latitude: latitude || null,
                    longitude: longitude || null,
                    map_url: map_url || null,
                    image_url: image_url || null,
                    facebook_url: facebook_url || null,
                    created_by: user?.id || null
                }).select().single();

                if (error) throw error;
                return res.status(201).json({ success: true, data });
            }

            return res.status(405).json({ error: 'Method not allowed' });
        }

        return res.status(400).json({ error: 'Invalid resource type' });

    } catch (err) {
        console.error(`[Metadata API] Error handling ${type}:`, err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
};
