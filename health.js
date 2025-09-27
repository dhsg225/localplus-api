// [2025-01-06 14:15 UTC] - Health check endpoint for Vercel API routes

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.json({ 
    status: 'OK', 
    message: 'LocalPlus API routes are running',
    timestamp: new Date().toISOString(),
    endpoints: {
      places: '/api/places',
      news: '/api/news/:city',
      categories: '/api/news/:city/categories'
    }
  });
} 