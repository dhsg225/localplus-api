// [2025-12-02] - News API Google Cloud Function
// GET /api/news/:city - Fetch WordPress posts for a city
// GET /api/news/:city/categories - Fetch WordPress categories for a city

// WordPress site mappings
const WORDPRESS_SITES = {
  'hua-hin': 'https://huahin.locality.guide',
  'pattaya': 'https://pattaya.locality.guide',
  'bangkok': 'https://huahin.locality.guide', // Use Hua Hin as fallback for Bangkok
  // Add more as needed
};

exports.handler = async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract city from path: /api/news/:city or /api/news/:city/categories
    // GCF receives full path from Cloudflare Worker: /api/news/hua-hin or /api/news/hua-hin/categories
    const path = req.path || req.url || '';
    const pathParts = path.split('/').filter(p => p);
    
    // Find 'news' in path and get city after it
    const newsIndex = pathParts.indexOf('news');
    let city, isCategories;
    
    if (newsIndex === -1 || newsIndex === pathParts.length - 1) {
      // Try query param as fallback
      city = req.query?.city;
      isCategories = path.includes('categories');
    } else {
      city = pathParts[newsIndex + 1];
      isCategories = pathParts[newsIndex + 2] === 'categories';
    }

    if (!city) {
      return res.status(400).json({ error: 'City parameter required. Path: ' + path });
    }

    const baseUrl = WORDPRESS_SITES[city];
    if (!baseUrl) {
      return res.status(400).json({ error: `Unsupported city: ${city}` });
    }

    if (isCategories) {
      // Fetch categories
      console.log(`📂 Fetching categories for ${city} from ${baseUrl}`);
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/categories`);
      const categories = await response.json();
      console.log(`✅ Found ${categories.length} categories for ${city}`);
      return res.status(200).json(categories);
    } else {
      // Fetch posts
      const { per_page = 10, categories, search } = req.query || {};
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
      return res.status(200).json(postsWithImages);
    }

  } catch (error) {
    console.error('❌ WordPress API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};
