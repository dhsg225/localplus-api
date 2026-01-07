// [2026-01-07] - Media Library API route
// Handles image uploads to Bunny.net and metadata storage in Supabase

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('../events/utils/rbac');
const Busboy = require('busboy');
const fetch = require('node-fetch');
const cors = require('cors')({
    origin: true, // Reflect request origin
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200, // For legacy browser support
    allowedHeaders: [
        'Content-Type', 'Authorization', 'x-user-token', 'x-supabase-token', 'x-original-authorization',
        'X-User-Token', 'X-Supabase-Token', 'X-Original-Authorization',
        'Access-Control-Allow-Origin', 'Origin', 'Accept', 'X-Requested-With'
    ]
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const bunnyApiKey = process.env.BUNNY_STORAGE_API_KEY || 'ca559c3a-87f0-49f0-be016fd32ece-1031-4d38';
const bunnyStorageZone = 'localplus-photos';
const bunnyHostname = 'sg.storage.bunnycdn.com';
const bunnyCdnUrl = process.env.BUNNY_CDN_URL || 'https://localplus-photos.b-cdn.net';

async function getSupabaseClient(authToken = null) {
    const clientOptions = {
        auth: { persistSession: false },
        global: authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
    };
    return createClient(supabaseUrl, supabaseKey, clientOptions);
}

module.exports = async (req, res) => {
    // Run CORS middleware
    await runMiddleware(req, res, cors);

    // Authentication
    const authHeader = req.headers.authorization ||
        req.headers['x-user-token'] ||
        req.headers['x-supabase-token'] ||
        req.headers['x-original-authorization'];

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
                throw error;
            }

            return res.status(200).json({
                success: true,
                media,
                count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } catch (error) {
            console.error('Error in GET /media:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // POST /api/media - Upload media
    if (req.method === 'POST') {
        return new Promise((resolve) => {
            try {
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

                        // Generate unique filename
                        const timestamp = Date.now();
                        const cleanFilename = filename.replace(/[^a-zA-Z0-9.]/g, '_');
                        const finalFilename = `${timestamp}_${cleanFilename}`;
                        const datePath = new Date().toISOString().slice(0, 7); // YYYY-MM
                        const bunnyPath = `event-photos/${datePath}/${finalFilename}`;

                        // Upload to Bunny.net
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

                        // Save to Supabase
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
                        }

                        res.status(200).json({
                            success: true,
                            data: mediaRecord || mediaData
                        });
                        resolve();
                    } catch (err) {
                        console.error('[Media API] Upload processing error:', err);
                        res.status(500).json({ error: 'Internal server error during upload' });
                        resolve();
                    }
                });

                busboy.on('error', (err) => {
                    console.error('[Media API] Busboy error:', err);
                    res.status(500).json({ error: 'File upload failed' });
                    resolve();
                });

                req.pipe(busboy);

            } catch (err) {
                console.error('[Media API] Setup error:', err);
                res.status(500).json({ error: 'Failed to setup upload' });
                resolve();
            }
        });
    }

    // DELETE /api/media/:id - Delete media
    if (req.method === 'DELETE') {
        try {
            // Extract media ID: prefer query param (from rewrite), fallback to URL parsing
            let mediaId = req.query.id;

            if (!mediaId) {
                const urlParts = req.url.split('/');
                const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                if (lastPart && lastPart !== 'media') {
                    mediaId = lastPart;
                }
            }

            if (!mediaId) {
                return res.status(400).json({ error: 'Media ID required' });
            }

            // Get media record
            const { data: mediaRecord, error: fetchError } = await supabaseClient
                .from('event_media')
                .select('*')
                .eq('id', mediaId)
                .single();

            if (fetchError || !mediaRecord) {
                console.error('[Media API] Media not found:', fetchError);
                return res.status(404).json({ error: 'Media not found' });
            }

            // Permission Check
            if (mediaRecord.uploaded_by !== user.id) {
                const { data: userRoles } = await supabaseClient
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .in('role', ['super_admin', 'events_superuser'])
                    .eq('is_active', true)
                //.limit(1); // limit not always needed here if using .in

                const hasRole = userRoles && userRoles.length > 0;
                if (!hasRole) {
                    return res.status(403).json({ error: 'Permission denied' });
                }
            }

            // Delete from Bunny.net
            const bunnyUrl = `https://${bunnyHostname}/${bunnyStorageZone}/${mediaRecord.bunny_path}`;
            console.log(`[Media API] Deleting from Bunny: ${bunnyUrl}`);

            const bunnyResponse = await fetch(bunnyUrl, {
                method: 'DELETE',
                headers: { 'AccessKey': bunnyApiKey }
            });

            if (!bunnyResponse.ok) {
                console.warn('[Media API] Bunny delete warning:', bunnyResponse.status);
            }

            // Delete from Database
            const { error: deleteError } = await supabaseClient
                .from('event_media')
                .delete()
                .eq('id', mediaId);

            if (deleteError) {
                console.error('[Media API] Database delete error:', deleteError);
                return res.status(500).json({ error: 'Failed to delete media record' });
            }

            return res.status(200).json({
                success: true,
                message: 'Media deleted successfully'
            });

        } catch (err) {
            console.error('[Media API] Delete error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
