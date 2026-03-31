// [2025-11-29] - Test script for superuser events endpoint
// Usage: node events/test-superuser-endpoint.js

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || ''; // Set your super admin token here

async function testSuperuserEndpoint() {
  console.log('🧪 Testing Superuser Events Endpoint\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  if (!TEST_TOKEN) {
    console.log('⚠️  No TEST_TOKEN provided. Set it with:');
    console.log('   export TEST_TOKEN=your_super_admin_token');
    console.log('   node events/test-superuser-endpoint.js\n');
    console.log('Or get token from browser localStorage after logging in as super admin\n');
    return;
  }

  try {
    // Test GET /api/events/all
    console.log('1️⃣  Testing GET /api/events/all...');
    const response = await fetch(`${API_BASE_URL}/api/events/all?limit=10&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log(`   Total events: ${data.pagination?.total || 0}`);
      console.log(`   Returned: ${data.data?.length || 0} events`);
      console.log(`   Has more: ${data.pagination?.hasMore || false}`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n   Sample event:');
        const event = data.data[0];
        console.log(`   - Title: ${event.title}`);
        console.log(`   - Status: ${event.status}`);
        console.log(`   - Start: ${event.start_time}`);
        console.log(`   - Type: ${event.event_type}`);
      }
    } else {
      console.log('❌ Error:', data.error || response.statusText);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }

    // Test with filters
    console.log('\n2️⃣  Testing GET /api/events/all with filters...');
    const filteredResponse = await fetch(`${API_BASE_URL}/api/events/all?limit=5&status=published&sortBy=start_time&sortOrder=asc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const filteredData = await filteredResponse.json();
    
    if (filteredResponse.ok) {
      console.log('✅ Success!');
      console.log(`   Filtered events: ${filteredData.data?.length || 0}`);
    } else {
      console.log('❌ Error:', filteredData.error || filteredResponse.statusText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Make sure the API server is running: npm run dev');
  }
}

testSuperuserEndpoint();

