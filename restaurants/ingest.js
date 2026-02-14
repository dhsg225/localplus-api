// [2026-02-13] - Restaurant Menu Ingestion API
// Uses OpenRouter (Vision AI) to parse menu images into structured JSON
const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('../events/utils/rbac');
const Busboy = require('busboy');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

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

    console.log('[Ingest] Request started');

    // 1. Authenticate User
    const authHeader = req.headers.authorization ||
        req.headers['x-user-token'] ||
        req.headers['x-supabase-token'] ||
        req.headers['x-original-authorization'];

    // Log headers (careful with secrets)
    console.log('[Ingest] Headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
    });

    const { user, error: authError } = await getAuthenticatedUser(authHeader);
    if (authError || !user) {
        console.error('[Ingest] Auth failed:', authError);
        return res.status(401).json({ error: authError || 'Authentication required' });
    }

    if (!openRouterApiKey) {
        console.error('[Ingest] OPENROUTER_API_KEY is not set');
        return res.status(500).json({ error: 'AI processing service is not configured' });
    }

    // 2. Process Multipart Upload
    return new Promise((resolve) => {
        try {
            const busboy = Busboy({ headers: req.headers });
            let fileBuffer = null;
            let mimeType = '';
            let businessId = '';

            busboy.on('file', (fieldname, file, info) => {
                console.log(`[Ingest] File received: ${fieldname}`);
                const { mimeType: rawMimeType } = info;
                mimeType = rawMimeType;
                const chunks = [];
                file.on('data', (data) => chunks.push(data));
                file.on('end', () => {
                    fileBuffer = Buffer.concat(chunks);
                    console.log(`[Ingest] File buffered: ${fileBuffer.length} bytes`);
                });
            });

            busboy.on('field', (fieldname, val) => {
                console.log(`[Ingest] Field received: ${fieldname} = ${val}`);
                if (fieldname === 'business_id') businessId = val;
            });

            busboy.on('finish', async () => {
                console.log('[Ingest] Busboy finished parsing');
                try {
                    if (!fileBuffer) {
                        console.error('[Ingest] No file buffer');
                        res.status(400).json({ error: 'No image provided' });
                        return resolve();
                    }

                    if (!businessId) {
                        console.error('[Ingest] No business_id');
                        res.status(400).json({ error: 'business_id is required' });
                        return resolve();
                    }

                    // 3. Call OpenRouter Vision API
                    console.log('[Ingest] Calling OpenRouter...');
                    const base64Image = fileBuffer.toString('base64');

                    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
                    const aiResponse = await fetch(openRouterUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${openRouterApiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://localplus.city',
                            'X-Title': 'LocalPlus Menu Ingest'
                        },
                        body: JSON.stringify({
                            model: 'google/gemini-2.0-flash-001',
                            messages: [
                                {
                                    role: 'user',
                                    content: [
                                        {
                                            type: 'text',
                                            text: `Extract all menu items from this image. Group them by category.
                                            Format the response as a strict JSON object:
                                            {
                                              "categories": [
                                                {
                                                  "name": "Category Name",
                                                  "items": [
                                                    { "name": "Item Name", "price": 150.00, "description": "Short description if available" }
                                                  ]
                                                }
                                              ]
                                            }
                                            Return ONLY the JSON object, absolutely no other text.`
                                        },
                                        {
                                            type: 'image_url',
                                            image_url: {
                                                url: `data:${mimeType};base64,${base64Image}`
                                            }
                                        }
                                    ]
                                }
                            ],
                            response_format: { type: 'json_object' }
                        })
                    });

                    if (!aiResponse.ok) {
                        const errText = await aiResponse.text();
                        console.error('[Ingest] OpenRouter error status:', aiResponse.status);
                        console.error('[Ingest] OpenRouter error text:', errText);
                        res.status(500).json({ error: `AI Error (${aiResponse.status}): ${errText}` });
                        return resolve();
                    }

                    const aiData = await aiResponse.json();

                    if (!aiData.choices || !aiData.choices[0]) {
                        console.error('[Ingest] Unexpected AI response:', JSON.stringify(aiData));
                        res.status(500).json({ error: 'AI returned empty choices' });
                        return resolve();
                    }

                    let structuredData;
                    try {
                        const content = aiData.choices[0].message.content.trim();
                        // Clean markdown formatting if present
                        const jsonStr = content.startsWith('```json') ? content.replace(/^```json\n|\n```$/g, '') : content;
                        structuredData = JSON.parse(jsonStr);
                    } catch (parseErr) {
                        console.error('[Ingest] JSON parse error:', aiData.choices[0].message.content);
                        res.status(500).json({ error: 'AI returned invalid data format' });
                        return resolve();
                    }

                    // 4. Return structured data
                    res.status(200).json({
                        success: true,
                        business_id: businessId,
                        menu: structuredData
                    });
                    resolve();

                } catch (err) {
                    console.error('[Ingest] Processing error:', err);
                    res.status(500).json({ error: `Processing error: ${err.message}` });
                    resolve();
                }
            });

            busboy.on('error', (err) => {
                console.error('[Ingest] Busboy error:', err);
                res.status(500).json({ error: `Upload error: ${err.message}` });
                resolve();
            });

            req.pipe(busboy);
        } catch (err) {
            console.error('[Ingest] Setup error:', err);
            res.status(500).json({ error: `Failed to initiate ingest: ${err.message}` });
            resolve();
        }
    });
};
