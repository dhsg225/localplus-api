// [2025-12-14] - Import only NEW events from Eventon_events_14-12-25.csv
// Compares with Eventon_events_29-11-25.csv and imports only new events
// Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node import-new-events.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Supabase configuration
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

// Sandy Beach user ID (corrected)
const SANDY_BEACH_USER_ID = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

// Helper function to parse date and time
function parseDateTime(dateStr, timeStr, timezone = 'Asia/Bangkok') {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Parse date (MM/DD/YYYY)
    const [month, day, year] = dateStr.split('/');
    
    // Parse time (HH:MM:AM/PM)
    let [time, period] = timeStr.split(/(AM|PM)/i);
    const [hours, minutes, seconds = '00'] = time.trim().split(':');
    let hour24 = parseInt(hours);
    
    if (period?.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period?.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    // Create ISO string with timezone offset
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}+07:00`;
    
    return isoString;
  } catch (error) {
    console.warn(`Failed to parse date/time: ${dateStr} ${timeStr}`, error);
    return null;
  }
}

// Helper to clean HTML entities
function cleanHtml(text) {
  if (!text) return null;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Helper to add hours to an ISO datetime string
function addHours(isoString, hours) {
  const date = new Date(isoString);
  date.setHours(date.getHours() + hours);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

// Map publish_status to our status (max 50 chars)
function mapStatus(publishStatus) {
  let status = 'draft';
  if (publishStatus === 'publish') {
    status = 'published';
  }
  return status.substring(0, 50);
}

// Map event_type - keep full length for comma-separated IDs
function mapEventType(eventType) {
  return eventType || 'general';
}

// Map EventON CSV row to our events schema (matching import-events.js structure)
function mapEventRow(row) {
  const startTime = parseDateTime(row.event_start_date, row.event_start_time, row.evo_tz || 'Asia/Bangkok');
  const endTime = parseDateTime(row.event_end_date, row.event_end_time, row.evo_tz || 'Asia/Bangkok');
  
  if (!startTime || !endTime) {
    return null; // Skip events without valid dates
  }
  
  // Auto-fix invalid time ranges: if end_time <= start_time, set end_time to start_time + 2 hours
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  let adjustedEndTime = endTime;
  if (endDate <= startDate) {
    adjustedEndTime = addHours(startTime, 2);
    console.log(`🔧 Auto-fixing event ${row.event_id}: End time adjusted from ${endTime} to ${adjustedEndTime}`);
  }
  
  // Parse location coordinates
  const latitude = row.location_latitude ? parseFloat(row.location_latitude) : null;
  const longitude = row.location_longitude ? parseFloat(row.location_longitude) : null;
  
  // Determine if recurring
  const isRecurring = row.repeatevent === 'yes';
  const recurrenceInterval = isRecurring ? (row.frequency || null) : null;
  
  // Build location string
  let location = null;
  if (row.event_location) {
    location = cleanHtml(row.event_location);
  } else if (row.location_name) {
    location = cleanHtml(row.location_name);
  }
  
  // Build event data (matching import-events.js structure)
  const eventData = {
    title: cleanHtml(row.event_name) || 'Untitled Event',
    description: cleanHtml(row.event_description) || null,
    subtitle: cleanHtml(row.evcal_subtitle) || null,
    created_by: SANDY_BEACH_USER_ID,
    event_type: mapEventType(row.event_type),
    status: mapStatus(row.publish_status),
    start_time: startTime,
    end_time: adjustedEndTime,
    location: location,
    venue_area: cleanHtml(row.location_name) || null,
    venue_latitude: latitude,
    venue_longitude: longitude,
    venue_map_url: row.location_link || null,
    hero_image_url: row.image_url || null,
    learn_more_url: row['learnmore link'] || null,
    external_event_key: row.event_id ? `eventon_${row.event_id}` : null,
    external_source_url: null,
    theme_color_hex: row.color ? `#${row.color}` : null,
    timezone_id: row.evo_tz || 'Asia/Bangkok',
    hide_end_time_flag: row.hide_end_time === 'yes',
    is_year_round: row.yearlong === 'yes',
    is_recurring: isRecurring,
    recurrence_interval: recurrenceInterval,
    recurrence_count: row.repeats ? parseInt(row.repeats) : null,
    business_id: null,
    metadata: {
      eventon_id: row.event_id,
      eventon_location_id: row.evo_location_id,
      eventon_organizer_id: row.evo_organizer_id,
      organizer_name: cleanHtml(row.event_organizer) || null,
      organizer_description: cleanHtml(row.organizer_description) || null,
      organizer_contact: cleanHtml(row.evcal_org_contact) || null,
      organizer_address: cleanHtml(row.evcal_org_address) || null,
      organizer_image: row.evo_org_img || null,
      original_data: {
        event_type_slug: row.event_type_slug,
        event_type_2: row.event_type_2,
        event_type_2_slug: row.event_type_2_slug
      }
    }
  };
  
  return eventData;
}

async function importNewEvents() {
  console.log('📦 Comparing EventON CSV files to find new events...\n');
  
  // Read both CSV files
  const newFile = 'Eventon_events_14-12-25.csv';
  const oldFile = 'Eventon_events_29-11-25.csv';
  
  if (!fs.existsSync(newFile)) {
    console.error(`❌ File not found: ${newFile}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(oldFile)) {
    console.error(`❌ File not found: ${oldFile}`);
    process.exit(1);
  }
  
  // Parse CSV files (using same options as import-events.js)
  const newCsvContent = fs.readFileSync(newFile, 'utf-8');
  const oldCsvContent = fs.readFileSync(oldFile, 'utf-8');
  
  const newEvents = parse(newCsvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    escape: '"',
    quote: '"',
    skip_records_with_error: true,
    on_record: (record, context) => {
      // Clean up any malformed fields
      const cleaned = {};
      for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === 'string') {
          // Remove any unescaped quotes or newlines that might cause issues
          cleaned[key] = value.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
  });
  
  const oldEvents = parse(oldCsvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    escape: '"',
    quote: '"',
    skip_records_with_error: true,
    on_record: (record, context) => {
      // Clean up any malformed fields
      const cleaned = {};
      for (const [key, value] of Object.entries(record)) {
        if (value && typeof value === 'string') {
          cleaned[key] = value.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }
  });
  
  console.log(`📊 Old file: ${oldEvents.length} events`);
  console.log(`📊 New file: ${newEvents.length} events`);
  
  // Create set of old event IDs for quick lookup
  const oldEventIds = new Set(oldEvents.map(e => e.event_id));
  
  // Find new events (events in new file but not in old file)
  const newEventsOnly = newEvents.filter(e => !oldEventIds.has(e.event_id));
  
  console.log(`\n✨ Found ${newEventsOnly.length} new events to import\n`);
  
  if (newEventsOnly.length === 0) {
    console.log('✅ No new events to import!');
    return;
  }
  
  // Show new events
  newEventsOnly.forEach((event, idx) => {
    console.log(`${idx + 1}. Event ID: ${event.event_id} - ${event.event_name || 'Untitled'}`);
  });
  
  console.log('\n📤 Importing new events...\n');
  
  // Map and import new events
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of newEventsOnly) {
    const eventData = mapEventRow(row);
    
    if (!eventData) {
      console.warn(`⚠️  Skipping event ${row.event_id}: Invalid date/time`);
      skipped++;
      continue;
    }
    
    try {
      // Check if event already exists in database (by external_event_key)
      const { data: existing } = await supabase
        .from('events')
        .select('id, external_event_key')
        .eq('external_event_key', eventData.external_event_key)
        .single();
      
      if (existing) {
        console.log(`⏭️  Event ${row.event_id} already exists in database (${existing.id}), skipping...`);
        skipped++;
        continue;
      }
      
      // Insert new event
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error importing event ${row.event_id}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Imported: ${eventData.title} (${row.event_id})`);
        imported++;
      }
    } catch (err) {
      console.error(`❌ Exception importing event ${row.event_id}:`, err.message);
      errors++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('='.repeat(50));
}

importNewEvents().catch(console.error);

