// [2025-01-07 02:15 UTC] - Vercel API route for Google Places photos
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
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    console.log(`📸 Fetching photos for place: ${placeId}`);

    // Call Google Places API Place Details to get photos
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}&` +
      `fields=photos&` +
      `key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(googleUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      const photos = data.result?.photos || [];
      console.log(`📸 Found ${photos.length} photos for place ${placeId}`);
      
      // Return photos in the format expected by the frontend
      res.json({
        success: true,
        photos: photos.map(photo => ({
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width
        }))
      });
    } else {
      console.log(`⚠️ Google Places API returned: ${data.status} for place ${placeId}`);
      res.status(400).json({ 
        success: false,
        error: data.status, 
        message: data.error_message || 'Failed to fetch photos'
      });
    }

  } catch (error) {
    console.error('❌ Places Photos API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 