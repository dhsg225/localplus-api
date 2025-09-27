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
    const { per_page = 10, categories, search } = req.query;

    const baseUrl = WORDPRESS_SITES[city];
    if (!baseUrl) {
      return res.status(400).json({ error: `Unsupported city: ${city}` });
    }

    console.log(`📰 Fetching news for ${city} from ${baseUrl}`);

    // Build WordPress API URL with _embed to get featured images
    let wpUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=${per_page}&_embed`;
    if (categories) wpUrl += `&categories=${categories}`;
    if (search) wpUrl += `&search=${encodeURIComponent(search)}`;

    const response = await fetch(wpUrl);
    const posts = await response.json();

    // Extract featured images from embedded data
    const postsWithImages = posts.map((post) => {
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        post.featured_image_url = post._embedded['wp:featuredmedia'][0].source_url;
      }
      return post;
    });

    console.log(`✅ Found ${postsWithImages.length} posts for ${city}`);
    res.json(postsWithImages);

  } catch (error) {
    console.error('❌ WordPress API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 