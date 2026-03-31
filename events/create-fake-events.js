// [2025-12-03] - Create 20 fake events for testing
// Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node create-fake-events.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'your_key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sandy Beach user ID (or use any user ID you want)
const USER_ID = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc';

// Create 20 fake events with dates spread over the next 2 months
async function createFakeEvents() {
  try {
    const now = new Date();
    const events = [];

    for (let i = 1; i <= 20; i++) {
      // Spread events over next 60 days
      const daysOffset = Math.floor((i - 1) / 2); // 2 events per day
      const hoursOffset = (i % 2) * 3; // 3 hours apart
      
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + daysOffset);
      startDate.setHours(14 + hoursOffset, 0, 0, 0); // Start at 2 PM or 5 PM
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2); // 2 hour duration
      
      // Format as ISO strings with timezone
      const startTime = startDate.toISOString().replace('Z', '+07:00');
      const endTime = endDate.toISOString().replace('Z', '+07:00');
      
      // Rotate through event types
      const eventTypes = ['music', 'food', 'art', 'wellness', 'general'];
      const eventType = eventTypes[(i - 1) % eventTypes.length];
      
      // Rotate through locations
      const locations = [
        'Hua Hin Beach',
        'Hua Hin Night Market',
        'Cicada Market',
        'Bluport Mall',
        'Hua Hin Railway Station'
      ];
      const location = locations[(i - 1) % locations.length];
      
      events.push({
        title: `Fake Event ${i}`,
        subtitle: `Test event number ${i} for development`,
        description: `This is a fake event created for testing purposes. Event number ${i}.`,
        created_by: USER_ID,
        event_type: eventType,
        status: 'published',
        start_time: startTime,
        end_time: endTime,
        location: location,
        venue_area: location,
        timezone_id: 'Asia/Bangkok',
        metadata: {
          is_fake: true,
          created_for: 'testing',
          note: 'This event can be safely deleted'
        }
      });
    }

    console.log(`📥 Creating ${events.length} fake events...`);
    
    const { data, error } = await supabase
      .from('events')
      .insert(events)
      .select('id, title, start_time');

    if (error) {
      console.error('❌ Error creating events:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully created ${data.length} fake events:`);
    data.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} - ${new Date(event.start_time).toLocaleDateString()}`);
    });
    
    console.log(`\n🗑️  To delete these events later, run:`);
    console.log(`   DELETE FROM events WHERE metadata->>'is_fake' = 'true';`);
    
  } catch (error) {
    console.error('❌ Failed to create fake events:', error);
    process.exit(1);
  }
}

createFakeEvents();

