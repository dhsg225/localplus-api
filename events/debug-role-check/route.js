// [2025-01-XX] - Debug endpoint to check role verification
// GET /api/events/debug-role-check - Shows role check status without requiring auth

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, isEventsSuperuser } = require('../utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const { user, error: authError } = await getAuthenticatedUser(authHeader);
  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Invalid authentication' });
  }

  const authToken = authHeader.replace('Bearer ', '');
  const sandyUserId = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

  const debug = {
    userId: user.id,
    isSandy: user.id === sandyUserId,
    serviceRoleKeyPresent: !!supabaseServiceRoleKey,
    serviceRoleKeyLength: supabaseServiceRoleKey ? supabaseServiceRoleKey.length : 0,
  };

  // Test with service role if available
  if (supabaseServiceRoleKey) {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: serviceRoles, error: serviceError } = await serviceClient
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    debug.serviceRoleQuery = {
      success: !serviceError,
      error: serviceError ? serviceError.message : null,
      roles: serviceRoles || [],
      hasEventsSuperuser: serviceRoles?.some(r => r.role === 'events_superuser') || false,
      hasSuperAdmin: serviceRoles?.some(r => r.role === 'super_admin') || false,
    };

    // Test isEventsSuperuser function
    const isSuperuser = await isEventsSuperuser(serviceClient, user.id);
    debug.isEventsSuperuserCheck = isSuperuser;
  }

  // Test with anon client + session
  const anonClient = createClient(supabaseUrl, supabaseKey);
  try {
    await anonClient.auth.setSession({
      access_token: authToken,
      refresh_token: authToken
    });
    const { data: anonRoles, error: anonError } = await anonClient
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    debug.anonClientQuery = {
      success: !anonError,
      error: anonError ? anonError.message : null,
      roles: anonRoles || [],
      hasEventsSuperuser: anonRoles?.some(r => r.role === 'events_superuser') || false,
      hasSuperAdmin: anonRoles?.some(r => r.role === 'super_admin') || false,
    };
  } catch (err) {
    debug.anonClientQuery = {
      success: false,
      error: err.message,
    };
  }

  return res.status(200).json(debug);
};

