// [2025-01-XX] - Event Engine Phase 0 + Phase 1: Minimal tests for events endpoints
// These are basic integration tests that can be run manually or with a test runner

/**
 * Minimal test suite for Events API
 * 
 * To run these tests:
 * 1. Set up test environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
 * 2. Have a test user account and business set up
 * 3. Run: node events/__tests__/events.test.js
 * 
 * Or use with a test framework like Jest:
 * npm install --save-dev jest
 * Add to package.json: "test": "jest"
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk',
  testUserEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
  testUserPassword: process.env.TEST_USER_PASSWORD || 'testpassword123',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api'
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

// Test helpers
async function getAuthToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_CONFIG.testUserEmail,
    password: TEST_CONFIG.testUserPassword
  });
  
  if (error) throw new Error(`Auth failed: ${error.message}`);
  return data.session.access_token;
}

async function createTestEvent(token) {
  const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Test Event',
      description: 'Test event description',
      event_type: 'general',
      status: 'published',
      start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
      location: 'Test Location'
    })
  });
  
  return await response.json();
}

// Test cases
const tests = {
  async testListEvents() {
    console.log('Test: GET /api/events (list events)');
    try {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ PASS: List events');
        return true;
      } else {
        console.log('❌ FAIL: List events', data);
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: List events -', error.message);
      return false;
    }
  },

  async testCreateEvent() {
    console.log('Test: POST /api/events (create event)');
    try {
      const token = await getAuthToken();
      const result = await createTestEvent(token);
      
      if (result.success && result.data.id) {
        console.log('✅ PASS: Create event');
        return { success: true, eventId: result.data.id };
      } else {
        console.log('❌ FAIL: Create event', result);
        return { success: false };
      }
    } catch (error) {
      console.log('❌ FAIL: Create event -', error.message);
      return { success: false };
    }
  },

  async testGetEvent(eventId) {
    console.log('Test: GET /api/events/[id] (get event)');
    try {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events/${eventId}`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data.id === eventId) {
        console.log('✅ PASS: Get event');
        return true;
      } else {
        console.log('❌ FAIL: Get event', data);
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: Get event -', error.message);
      return false;
    }
  },

  async testUpdateEvent(eventId) {
    console.log('Test: PUT /api/events/[id] (update event)');
    try {
      const token = await getAuthToken();
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: 'Updated description'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ PASS: Update event');
        return true;
      } else {
        console.log('❌ FAIL: Update event', data);
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: Update event -', error.message);
      return false;
    }
  },

  async testRegisterParticipant(eventId) {
    console.log('Test: POST /api/events/[id]/participants (register)');
    try {
      const token = await getAuthToken();
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ PASS: Register participant');
        return { success: true, participantId: data.data.id };
      } else {
        console.log('❌ FAIL: Register participant', data);
        return { success: false };
      }
    } catch (error) {
      console.log('❌ FAIL: Register participant -', error.message);
      return { success: false };
    }
  },

  async testListParticipants(eventId) {
    console.log('Test: GET /api/events/[id]/participants (list participants)');
    try {
      const token = await getAuthToken();
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events/${eventId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ PASS: List participants');
        return true;
      } else {
        console.log('❌ FAIL: List participants', data);
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: List participants -', error.message);
      return false;
    }
  },

  async testRBACUnauthorizedAccess() {
    console.log('Test: RBAC - Unauthorized access blocked');
    try {
      // Try to access without auth token
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Unauthorized Event',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString()
        })
      });
      
      if (response.status === 401) {
        console.log('✅ PASS: RBAC blocks unauthorized access');
        return true;
      } else {
        console.log('❌ FAIL: RBAC should block unauthorized access');
        return false;
      }
    } catch (error) {
      console.log('❌ FAIL: RBAC test -', error.message);
      return false;
    }
  }
};

// Run tests
async function runTests() {
  console.log('🚀 Starting Event Engine Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0
  };

  // Run basic tests
  const listResult = await tests.testListEvents();
  results[listResult ? 'passed' : 'failed']++;

  const createResult = await tests.testCreateEvent();
  results[createResult.success ? 'passed' : 'failed']++;
  
  if (createResult.success && createResult.eventId) {
    const eventId = createResult.eventId;
    
    const getResult = await tests.testGetEvent(eventId);
    results[getResult ? 'passed' : 'failed']++;
    
    const updateResult = await tests.testUpdateEvent(eventId);
    results[updateResult ? 'passed' : 'failed']++;
    
    const registerResult = await tests.testRegisterParticipant(eventId);
    results[registerResult.success ? 'passed' : 'failed']++;
    
    if (registerResult.success) {
      const listParticipantsResult = await tests.testListParticipants(eventId);
      results[listParticipantsResult ? 'passed' : 'failed']++;
    }
  }

  const rbacResult = await tests.testRBACUnauthorizedAccess();
  results[rbacResult ? 'passed' : 'failed']++;

  console.log(`\n📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  
  return results.failed === 0;
}

// Export for use with test frameworks
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { tests, runTests };

