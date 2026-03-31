// [2025-11-29] - Google Cloud Function for Authentication
// Migrated from Vercel serverless function
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.auth = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST /api/auth - Login
  if (req.method === 'POST') {
    try {
      // [2025-11-29] - Debug: Log request body for API Gateway troubleshooting
      console.log('[Auth] Request method:', req.method);
      console.log('[Auth] Request body type:', typeof req.body);
      console.log('[Auth] Request body:', JSON.stringify(req.body));
      console.log('[Auth] Content-Type:', req.headers['content-type']);
      
      // Handle both parsed JSON and raw body
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('[Auth] Failed to parse body as JSON:', e);
        }
      }
      
      const { email, password } = body || {};

      if (!email || !password) {
        console.error('[Auth] Missing email or password. Body:', body);
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(401).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: data.user,
          session: data.session
        }
      });

    } catch (error) {
      console.error('Auth POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/auth - Get session
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      return res.status(200).json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Auth GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/auth - Logout
  if (req.method === 'DELETE') {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        await supabase.auth.signOut();
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Auth DELETE error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

