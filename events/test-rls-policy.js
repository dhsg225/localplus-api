// [2025-01-XX] - Test RLS policy for user_roles table
// This simulates what the frontend does to check if Sandy can see her role

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const sandyUserId = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

async function testRLSPolicy() {
  console.log('🔍 Testing RLS Policy for user_roles table\n');
  console.log('Sandy User ID:', sandyUserId);
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  // Step 1: Check current policies (requires service role or direct DB access)
  console.log('📋 Step 1: Checking RLS policies...');
  console.log('(This requires direct database access - run in Supabase SQL Editor)');
  console.log('');

  // Step 2: Test query WITHOUT auth (should fail)
  console.log('📋 Step 2: Testing query WITHOUT authentication...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: rolesNoAuth, error: errorNoAuth } = await supabaseAnon
    .from('user_roles')
    .select('role')
    .eq('user_id', sandyUserId)
    .in('role', ['super_admin', 'events_superuser'])
    .eq('is_active', true);

  if (errorNoAuth) {
    console.log('❌ Error (expected):', errorNoAuth.message);
  } else {
    console.log('⚠️  Unexpected: Query succeeded without auth');
    console.log('Roles found:', rolesNoAuth);
  }
  console.log('');

  // Step 3: Test query WITH auth token (simulating frontend)
  console.log('📋 Step 3: Testing query WITH authentication...');
  console.log('⚠️  Note: This requires a valid auth token from Sandy\'s session');
  console.log('   To get the token:');
  console.log('   1. Open browser DevTools');
  console.log('   2. Go to Application/Storage → Local Storage');
  console.log('   3. Find auth_token key');
  console.log('   4. Copy the token value');
  console.log('   5. Run: SUPABASE_AUTH_TOKEN=your_token_here node test-rls-policy.js');
  console.log('');

  const authToken = process.env.SUPABASE_AUTH_TOKEN;
  
  if (authToken) {
    console.log('✅ Auth token provided, testing query...');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    });

    // Set session (like frontend does)
    const { data: { session }, error: sessionError } = await supabaseAuth.auth.setSession({
      access_token: authToken,
      refresh_token: authToken
    });

    if (sessionError) {
      console.log('❌ Error setting session:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('❌ No session after setSession');
      return;
    }

    console.log('✅ Session set successfully');
    console.log('User ID from session:', session.user.id);
    console.log('');

    // Now test the query
    const { data: roles, error } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', sandyUserId)
      .in('role', ['super_admin', 'events_superuser'])
      .eq('is_active', true);

    if (error) {
      console.log('❌ Error querying user_roles:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error);
    } else {
      console.log('✅ Query succeeded!');
      console.log('Roles found:', roles);
      if (roles && roles.length > 0) {
        console.log('🎉 SUCCESS: Sandy can see her events_superuser role!');
      } else {
        console.log('⚠️  WARNING: Query succeeded but returned empty array');
        console.log('   This suggests RLS policy is blocking the query');
      }
    }
  } else {
    console.log('⏭️  Skipping authenticated test (no token provided)');
  }

  console.log('');
  console.log('📋 Step 4: SQL Query to check policies (run in Supabase SQL Editor):');
  console.log(`
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
  `);
}

testRLSPolicy().catch(console.error);

