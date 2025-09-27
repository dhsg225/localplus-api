// [2025-01-06 14:15 UTC] - Converting Express proxy to Vercel API route for production deployment

const GOOGLE_PLACES_API_KEY = 'AIzaSyCEMtUfl8yJzVZIcTaaEajKRtqEJZZ_G2Y';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const { lat, lng, radius = '3000', type = 'establishment' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing lat/lng parameters' });
    }

    console.log(`🔍 Server-side Google Places search: ${lat}, ${lng} (type: ${type})`);

    // Call Google Places API from server-side (no CORS issues)
    const googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${lat},${lng}&` +
      `radius=${radius}&` +
      `type=${type}&` +
      `key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      console.log(`✅ Found ${data.results?.length || 0} places for ${type}`);
      res.json(data);
    } else {
      console.log(`⚠️ Google API returned: ${data.status}`);
      res.status(400).json({ error: data.status, message: data.error_message });
    }

  } catch (error) {
    console.error('❌ Places API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 