// [2025-12-02] - Extract unique venues from events table and populate venues table

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

console.log('🔑 Using Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function extractVenues() {
  try {
    // Verify venues table exists
    console.log('🔍 Verifying venues table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('venues')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.error('❌ Venues table does not exist!');
      console.error('   Please run venues-schema.sql in Supabase SQL Editor first');
      process.exit(1);
    } else if (tableError) {
      console.warn('⚠️  Warning checking table:', tableError.message);
    } else {
      console.log('✅ Venues table exists');
    }
    
    console.log('📂 Fetching events with venue data...');
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('venue_area, venue_latitude, venue_longitude, venue_map_url, created_by')
      .not('venue_area', 'is', null);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    console.log(`✅ Found ${events?.length || 0} events with venue data`);

    if (!events || events.length === 0) {
      console.log('⚠️  No events with venue data found');
      return;
    }

    // Get existing venues
    const { data: existingVenues } = await supabase
      .from('venues')
      .select('name, address, latitude, longitude');

    const existingKeys = new Set();
    if (existingVenues) {
      existingVenues.forEach(venue => {
        const key = `${venue.name || ''}|${venue.latitude || ''}|${venue.longitude || ''}`;
        existingKeys.add(key);
      });
    }

    console.log(`📊 Found ${existingKeys.size} existing venues in database`);

    // Extract unique venues
    const venueMap = new Map();
    
    for (const event of events) {
      if (!event.venue_area) continue;

      const key = `${event.venue_area}|${event.venue_latitude || ''}|${event.venue_longitude || ''}`;
      
      if (venueMap.has(key) || existingKeys.has(key)) {
        continue;
      }

      venueMap.set(key, {
        name: event.venue_area.trim(),
        address: event.venue_area.trim(),
        latitude: event.venue_latitude || null,
        longitude: event.venue_longitude || null,
        map_url: event.venue_map_url || null,
        image_url: null,
        venue_type: null, // Can be categorized later
        capacity: null,
        created_by: event.created_by || null
      });
    }

    const uniqueVenues = Array.from(venueMap.values());
    console.log(`\n📦 Extracted ${uniqueVenues.length} unique venues from events`);

    if (uniqueVenues.length === 0) {
      console.log('✅ No new venues to import');
      return;
    }

    // Insert venues in batches
    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    console.log(`\n📥 Importing venues in batches of ${batchSize}...`);

    for (let i = 0; i < uniqueVenues.length; i += batchSize) {
      const batch = uniqueVenues.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('venues')
        .insert(batch)
        .select('id, name');

      if (error) {
        console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
        errors += batch.length;
      } else if (data && data.length > 0) {
        imported += data.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Imported ${data.length}/${batch.length} venues`);
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Total unique venues extracted: ${uniqueVenues.length}`);
    console.log(`   Successfully imported: ${imported}`);
    console.log(`   Errors: ${errors}`);

  } catch (err) {
    console.error('❌ Error extracting venues:', err);
    process.exit(1);
  }
}

extractVenues();

