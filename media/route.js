// [2026-01-07] - Media Library API route
// Handles image uploads to Bunny.net and metadata storage in Supabase

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('../events/utils/rbac');
const Busboy = require('busboy');
const fetch = require('node-fetch'); // Ensure node-fetch is available if Node < 18

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const bunnyApiKey = process.env.BUNNY_STORAGE_API_KEY || 'ca559c3a-87f0-49f0-be016fd32ece-1031-4d38';
const bunnyStorageZone = 'localplus-photos';
const bunnyHostname = 'sg.storage.bunnycdn.com';
const bunnyCdnUrl = process.env.BUNNY_CDN_URL || 'https://photos.localplus.city';

async function getSupabaseClient(authToken = null) {
    const clientOptions = {
        auth: { persistSession: false },
        global: authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
    };
    return createClient(supabaseUrl, supabaseKey, clientOptions);
}

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { user, error: authError } = await getAuthenticatedUser(authHeader);
    if (authError || !user) {
        return res.status(401).json({ error: authError || 'Invalid authentication' });
    }

    const authToken = authHeader.replace('Bearer ', '');
    const supabaseClient = await getSupabaseClient(authToken);

    // GET /api/media - List media
    if (req.method === 'GET') {
        try {
            const { limit = 50, offset = 0 } = req.query;

            const { data: media, error, count } = await supabaseClient
                .from('event_media')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (error) {
                console.error('[Media API] Error fetching media:', error);
                return res.status(500).json({ error: 'Failed to fetch media' });
            }

            return res.status(200).json({
                success: true,
                data: media,
                pagination: {
                    total: count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < count
                }
            });
        } catch (err) {
            console.error('[Media API] List error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/media/upload - Handle file upload
    if (req.method === 'POST') {
        return new Promise((resolve) => {
            const busboy = Busboy({ headers: req.headers });
            let fileBuffer = null;
            let filename = '';
            let mimeType = '';
            let fields = {};

            busboy.on('file', (fieldname, file, info) => {
                const { filename: rawFilename, mimeType: rawMimeType } = info;
                filename = rawFilename;
                mimeType = rawMimeType;

                const chunks = [];
                file.on('data', (data) => chunks.push(data));
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                });
            });

            busboy.on('field', (fieldname, val) => {
                fields[fieldname] = val;
            });

            busboy.on('finish', async () => {
                try {
                    if (!fileBuffer) {
                        res.status(400).json({ error: 'No file uploaded' });
                        return resolve();
                    }

                    // Generate unique filename to avoid collisions
                    const timestamp = Date.now();
                    const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
                    const finalFilename = `${timestamp}_${cleanFilename}`;
                    const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM
                    const bunnyPath = `event-photos/${datePath}/${finalFilename}`;

                    // Upload to Bunny.net Storage
                    const bunnyUrl = `https://${bunnyHostname}/${bunnyStorageZone}/${bunnyPath}`;

                    console.log(`[Media API] Uploading to Bunny: ${bunnyUrl}`);

                    const bunnyResponse = await fetch(bunnyUrl, {
                        method: 'PUT',
                        headers: {
                            'AccessKey': bunnyApiKey,
                            'Content-Type': mimeType,
                        },
                        body: fileBuffer
                    });

                    if (!bunnyResponse.ok) {
                        const errorText = await bunnyResponse.text();
                        console.error('[Media API] Bunny upload failed:', bunnyResponse.status, errorText);
                        res.status(500).json({ error: 'Failed to upload to storage provider' });
                        return resolve();
                    }

                    // Save metadata to Supabase
                    const cdn_url = `${bunnyCdnUrl}/${bunnyPath}`;
                    const mediaData = {
                        filename: finalFilename,
                        bunny_path: bunnyPath,
                        cdn_url: cdn_url,
                        uploaded_by: user.id,
                        mime_type: mimeType,
                        filesize: fileBuffer.length,
                        business_id: fields.business_id || null
                    };

                    const { data: mediaRecord, error: dbError } = await supabaseClient
                        .from('event_media')
                        .insert([mediaData])
                        .select()
                        .single();

                    if (dbError) {
                        console.error('[Media API] Database error:', dbError);
                        // Even if DB fails, the file is on Bunny. We return success but log error.
                        // Or we could try to delete from Bunny, but usually better to have the file.
                    }

                    res.status(200).json({
                        success: true,
                        data: mediaRecord || mediaData
                    });
                    resolve();
                } catch (err) {
                    console.error('[Media API] Upload processing error:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    resolve();
                }
            });

            req.pipe(busboy);
        });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
