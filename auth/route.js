// [2024-09-26] - Authentication API for all LocalPlus apps
// [2025-10-01] - Converted to Vercel serverless function format
// [2026-02-01] - Merged registration logic to stay under Vercel Hobby limits
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Determine if this is a registration request
  // (We'll route /api/auth/register to this file in vercel.json)
  const isRegister = req.url.includes('/register');

  // POST /api/auth/register - User registration
  if (isRegister && req.method === 'POST') {
    try {
      const { email, password, business_type, business_name } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      if (!business_type) {
        return res.status(400).json({ error: 'Business type is required' });
      }

      if (!business_name || !business_name.trim()) {
        return res.status(400).json({ error: 'Business name is required' });
      }

      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_type,
            business_name
          }
        }
      });

      if (authError) {
        console.error('[Register] Auth error:', authError);
        return res.status(400).json({ error: authError.message });
      }

      if (!authData.user) {
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      const userId = authData.user.id;

      // Step 2: Get business type ID
      const { data: businessTypeData, error: typeError } = await supabase
        .from('business_types')
        .select('id')
        .eq('key', business_type)
        .eq('is_active', true)
        .single();

      if (typeError || !businessTypeData) {
        console.warn(`[Register] Business type '${business_type}' not found`);
      }

      // Step 3: Create business record
      const businessData = {
        name: business_name.trim(),
        business_type_id: businessTypeData?.id || null,
        created_by: userId,
        is_active: true
      };

      const { data: businessRecord, error: businessError } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();

      // Step 4: Create partner record
      let partnerRecord = null;
      if (businessRecord) {
        const { data: partnerDataResult, error: partnerError } = await supabase
          .from('partners')
          .insert([{
            user_id: userId,
            business_id: businessRecord.id,
            role: 'owner',
            is_active: true,
            accepted_at: new Date().toISOString(),
            permissions: ['view_bookings', 'manage_bookings', 'view_analytics', 'manage_business']
          }])
          .select()
          .single();

        partnerRecord = partnerDataResult;
      }

      return res.status(200).json({
        success: true,
        user: authData.user,
        session: authData.session,
        business: businessRecord || null,
        partner: partnerRecord || null
      });

    } catch (error) {
      console.error('[Register] Registration error:', error);
      return res.status(500).json({ error: 'Internal server error during registration' });
    }
  }

  // POST /api/auth - User login
  if (!isRegister && req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
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
        user: data.user,
        session: data.session
      });

    } catch (error) {
      console.error('Auth login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/auth - Get current user
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
      }

      const token = authHeader.replace('Bearer ', '');

      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          return res.status(401).json({ error: 'Invalid token format' });
        }

        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }

        const payloadStr = Buffer.from(base64, 'base64').toString();
        const payload = JSON.parse(payloadStr);
        const userId = payload.sub;
        const userEmail = payload.email || 'unknown@example.com';

        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          return res.status(401).json({ error: 'Invalid token: User ID is not a valid UUID' });
        }

        return res.status(200).json({
          success: true,
          user: {
            id: userId,
            email: userEmail
          }
        });
      } catch (decodeError) {
        return res.status(401).json({ error: `Invalid token: ${decodeError.message}` });
      }

    } catch (error) {
      console.error('Auth me error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/auth - User logout
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Auth logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

