// [2025-01-XX] - Simple test endpoint to verify token decoding and role checks
// GET /api/events/test-auth

const { getAuthenticatedUser, isEventsSuperuser } = require('../utils/rbac');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  null;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Test 1: Decode token
  let decoded = null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      decoded = JSON.parse(Buffer.from(base64, 'base64').toString());
    }
  } catch (err) {
    decoded = { error: err.message };
  }

  // Test 2: getAuthenticatedUser
  const { user, error: authError } = await getAuthenticatedUser(authHeader);
  
  // Test 3: Role check with service role
  let roleCheckResult = null;
  if (user && supabaseServiceRoleKey) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: allRoles, error: rolesError } = await serviceClient
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    roleCheckResult = {
      allRoles: allRoles || [],
      rolesError: rolesError ? rolesError.message : null,
      isEventsSuperuser: await isEventsSuperuser(serviceClient, user.id)
    };
  }

  return res.status(200).json({
    success: true,
    tests: {
      tokenDecoded: decoded,
      getAuthenticatedUser: {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError
      },
      roleCheck: roleCheckResult,
      serviceRoleKeyPresent: !!supabaseServiceRoleKey
    }
  });
};

