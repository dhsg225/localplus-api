// [2025-01-XX] - Direct test of Sandy's role check
// Run with: node events/test-sandy-role-direct.cjs

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const sandyUserId = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

async function testRoleCheck() {
  console.log('🔍 Testing Sandy\'s role check directly...\n');
  console.log('Sandy User ID:', sandyUserId);
  console.log('Service role key present:', !!supabaseServiceRoleKey);
  console.log('Service role key length:', supabaseServiceRoleKey ? supabaseServiceRoleKey.length : 0);
  console.log('');

  if (!supabaseServiceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set!');
    console.error('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your_key"');
    process.exit(1);
  }

  // Test with service role (bypasses RLS)
  console.log('📋 Test: Query with service role key (bypasses RLS)');
  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const { data: serviceRoles, error: serviceError } = await serviceClient
    .from('user_roles')
    .select('role, is_active, user_id')
    .eq('user_id', sandyUserId)
    .eq('is_active', true);
  
  if (serviceError) {
    console.error('❌ Error querying with service role:', serviceError);
  } else {
    console.log('✅ Service role query result:', JSON.stringify(serviceRoles, null, 2));
    const hasEventsSuperuser = serviceRoles?.some(r => r.role === 'events_superuser');
    console.log('   Has events_superuser role:', hasEventsSuperuser);
  }
  console.log('');

  // Test isEventsSuperuser function
  console.log('📋 Test: Using isEventsSuperuser function');
  const { isEventsSuperuser } = require('./utils/rbac');
  const isSuperuser = await isEventsSuperuser(serviceClient, sandyUserId);
  console.log('✅ isEventsSuperuser result:', isSuperuser);
  console.log('');

  // Test isSuperAdmin function (from route.js)
  console.log('📋 Test: Checking super_admin role');
  const { data: adminRoles, error: adminError } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', sandyUserId)
    .eq('role', 'super_admin')
    .eq('is_active', true)
    .limit(1);
  console.log('✅ Super admin check:', adminRoles && adminRoles.length > 0);
  if (adminError) {
    console.error('❌ Error checking super_admin:', adminError);
  }
  console.log('');

  console.log('📊 Summary:');
  console.log('   - Sandy has events_superuser:', serviceRoles?.some(r => r.role === 'events_superuser') || false);
  console.log('   - Sandy has super_admin:', adminRoles && adminRoles.length > 0);
  console.log('   - isEventsSuperuser() returns:', isSuperuser);
  console.log('   - Should have access:', isSuperuser || (adminRoles && adminRoles.length > 0));
}

testRoleCheck().catch(console.error);

