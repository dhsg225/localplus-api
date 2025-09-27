// [2025-01-07 02:15 UTC] - Vercel API route for Google Places photo URLs
const GOOGLE_PLACES_API_KEY = 'AIzaSyCEMtUfl8yJzVZIcTaaEajKRtqEJZZ_G2Y';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { photo_reference, maxwidth = 600, maxheight = 400 } = req.query;

    if (!photo_reference) {
      return res.status(400).json({ error: 'Photo reference is required' });
    }

    console.log(`📸 Serving photo: ${photo_reference} (${maxwidth}x${maxheight})`);

    // Construct Google Places Photo URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?` +
      `maxwidth=${maxwidth}&` +
      `maxheight=${maxheight}&` +
      `photo_reference=${photo_reference}&` +
      `key=${GOOGLE_PLACES_API_KEY}`;

    // Redirect to the actual Google Places photo URL
    // This allows the frontend to load the image directly while bypassing CORS
    res.redirect(302, photoUrl);

  } catch (error) {
    console.error('❌ Places Photo URL error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 