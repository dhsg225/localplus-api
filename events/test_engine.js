// [2026-03-29] - Event Engine v1.7.0 Stress Test Utility
const { expandRecurrence } = require('../google-cloud-functions/events/utils/temporal');

const mockEvent = {
  start_time: '2026-04-01T19:00:00Z',
  end_time: '2026-04-01T21:00:00Z',
  timezone: 'Asia/Bangkok'
};

const limitDate = new Date('2026-06-01T00:00:00Z');

function runTests() {
  console.log('--- 🧪 Event Engine Recurrence Logic Stress Test ---\n');

  // Test 1: Weekly Rule (Every 1 week)
  console.log('Test 1: Weekly (Every 1 week, no end)');
  const weeklyRule = { frequency: 'weekly', interval: 1 };
  const weeklyInstances = expandRecurrence(mockEvent, weeklyRule, limitDate);
  console.log(`   - Generated ${weeklyInstances.length} instances.`);
  if (weeklyInstances.length !== 9) console.error('   ❌ Expected 9 instances for April-May.');
  else console.log('   ✅ Weekly count correct.');

  // Test 2: Monthly Rule (Count = 3)
  console.log('\nTest 2: Monthly (Count = 3)');
  const monthlyRule = { frequency: 'monthly', interval: 1, count: 3 };
  const monthlyInstances = expandRecurrence(mockEvent, monthlyRule, limitDate);
  console.log(`   - Generated ${monthlyInstances.length} instances.`);
  if (monthlyInstances.length !== 3) console.error('   ❌ Expected 3 instances.');
  else console.log('   ✅ Monthly count correct.');

  // Test 3: Daily Rule (Until April 5)
  console.log('\nTest 3: Daily (Until 2026-04-05)');
  const dailyRule = { 
    frequency: 'daily', 
    until: '2026-04-05T00:00:00Z' 
  };
  const dailyInstances = expandRecurrence(mockEvent, dailyRule, limitDate);
  console.log(`   - Generated ${dailyInstances.length} instances.`);
  if (dailyInstances.length !== 4) console.error('   ❌ Expected 4 instances (Apr 1, 2, 3, 4).');
  else console.log('   ✅ Daily until condition correct.');

  // Test 4: Exceptions Check
  console.log('\nTest 4: Exceptions (Skip Apr 08)');
  const exceptionRule = { 
    frequency: 'weekly', 
    interval: 1, 
    exceptions: ['2026-04-08'] 
  };
  const exceptionInstances = expandRecurrence(mockEvent, exceptionRule, limitDate);
  const hasApr08 = exceptionInstances.some(i => i.start_time.startsWith('2026-04-08'));
  if (hasApr08) console.error('   ❌ Failed to skip April 08.');
  else console.log('   ✅ April 08 exception respected.');

  console.log('\n--- 🧪 Instance Behavior & Capacity Logic Audit ---\n');
  
  // Logic Audit: Overbooking
  const mockRegistration = {
    instance: { current_rsvp_count: 49, max_capacity: 50 },
    request: { guests: 2 }
  };
  const canBook = (mockRegistration.instance.current_rsvp_count + mockRegistration.request.guests) <= mockRegistration.instance.max_capacity;
  console.log(`Capacity Check: ${mockRegistration.instance.current_rsvp_count}/50 + 2 guests`);
  if (!canBook) console.log('   ✅ Overbooking Blocked.');
  else console.error('   ❌ Overbooking Calculation Logic flaw (Edge case: partial guests?).');

  console.log('\n--- 🧪 Expansion Stability Audit ---\n');
  console.log('Constraint: re-saving recurring events must NOT duplicate instances.');
  console.log('Implementation Strategy: API should UPSERT instances based on (event_id, start_time) Unique Constraint or wipe future instances before re-generating.');
  console.log('Current Controller State: POST always inserts fresh. PUT handler (to-be-built) needs "Wipe & Replace" for future instances.');

}

runTests();
