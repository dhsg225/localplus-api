// [2025-12-01] - Extract unique locations from events table and populate locations table
// This script reads location data from events (venue_area, venue_latitude, venue_longitude, venue_map_url)
// and creates corresponding records in the locations table

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('   Set it in .env file or as environment variable');
  console.error('   Example: export SUPABASE_SERVICE_ROLE_KEY="your-key-here"');
  process.exit(1);
}

console.log('🔑 Using Supabase URL:', supabaseUrl);
console.log('🔑 Service role key present:', supabaseServiceRoleKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function extractLocations() {
  try {
    // First, verify the locations table exists
    console.log('🔍 Verifying locations table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('locations')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.error('❌ Locations table does not exist!');
      console.error('   Please run locations-schema.sql in Supabase SQL Editor first');
      process.exit(1);
    } else if (tableError) {
      console.warn('⚠️  Warning checking table:', tableError.message);
    } else {
      console.log('✅ Locations table exists');
    }
    
    console.log('📂 Fetching events with location data...');
    
    // Get all events that have location data
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('venue_area, venue_latitude, venue_longitude, venue_map_url, created_by')
      .not('venue_area', 'is', null)
      .or('venue_latitude.not.is.null,venue_longitude.not.is.null,venue_map_url.not.is.null');

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    console.log(`✅ Found ${events?.length || 0} events with location data`);

    if (!events || events.length === 0) {
      console.log('⚠️  No events with location data found');
      return;
    }

    // Get existing locations to avoid duplicates
    const { data: existingLocations } = await supabase
      .from('locations')
      .select('name, address, latitude, longitude');

    const existingKeys = new Set();
    if (existingLocations) {
      existingLocations.forEach(loc => {
        // Create a unique key based on name, address, and coordinates
        const key = `${loc.name || ''}|${loc.address || ''}|${loc.latitude || ''}|${loc.longitude || ''}`;
        existingKeys.add(key);
      });
    }

    console.log(`📊 Found ${existingKeys.size} existing locations in database`);

    // Extract unique locations
    const locationMap = new Map();
    
    for (const event of events) {
      if (!event.venue_area) continue;

      // Create unique key
      const key = `${event.venue_area}|${event.venue_latitude || ''}|${event.venue_longitude || ''}`;
      
      // Skip if already processed or exists
      if (locationMap.has(key) || existingKeys.has(key)) {
        continue;
      }

      locationMap.set(key, {
        name: event.venue_area.trim(),
        address: event.venue_area.trim(), // Use venue_area as address if no separate address field
        latitude: event.venue_latitude || null,
        longitude: event.venue_longitude || null,
        map_url: event.venue_map_url || null,
        image_url: null,
        created_by: event.created_by || null
      });
    }

    const uniqueLocations = Array.from(locationMap.values());
    console.log(`\n📦 Extracted ${uniqueLocations.length} unique locations from events`);

    if (uniqueLocations.length === 0) {
      console.log('✅ No new locations to import');
      return;
    }

    // Insert locations in batches
    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    console.log(`\n📥 Importing locations in batches of ${batchSize}...`);

    for (let i = 0; i < uniqueLocations.length; i += batchSize) {
      const batch = uniqueLocations.slice(i, i + batchSize);
      
      console.log(`\n📝 Batch ${Math.floor(i / batchSize) + 1}: Inserting ${batch.length} locations...`);
      console.log(`   Sample location:`, JSON.stringify(batch[0], null, 2));
      
      const { data, error } = await supabase
        .from('locations')
        .insert(batch)
        .select('id, name');

      if (error) {
        console.error(`❌ Error importing batch ${Math.floor(i / batchSize) + 1}:`, error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        console.error('   Error hint:', error.hint);
        errors += batch.length;
      } else if (data && data.length > 0) {
        imported += data.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Imported ${data.length}/${batch.length} locations`);
      } else {
        console.warn(`⚠️  Batch ${Math.floor(i / batchSize) + 1}: No data returned (but no error)`);
        errors += batch.length;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Total unique locations extracted: ${uniqueLocations.length}`);
    console.log(`   Successfully imported: ${imported}`);
    console.log(`   Errors: ${errors}`);

  } catch (err) {
    console.error('❌ Error extracting locations:', err);
    process.exit(1);
  }
}

extractLocations();

