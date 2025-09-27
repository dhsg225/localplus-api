// [2025-01-06 14:15 UTC] - Converting Express proxy to Vercel API route for production deployment

// WordPress site mappings
const WORDPRESS_SITES = {
  'hua-hin': 'https://huahin.locality.guide',
  'pattaya': 'https://pattaya.locality.guide',
  'bangkok': 'https://huahin.locality.guide', // Use Hua Hin as fallback for Bangkok
  // Add more as needed
};

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
    const { city } = req.query;

    const baseUrl = WORDPRESS_SITES[city];
    if (!baseUrl) {
      return res.status(400).json({ error: `Unsupported city: ${city}` });
    }

    console.log(`📂 Fetching categories for ${city} from ${baseUrl}`);

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/categories`);
    const categories = await response.json();

    console.log(`✅ Found ${categories.length} categories for ${city}`);
    res.json(categories);

  } catch (error) {
    console.error('❌ WordPress Categories API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 