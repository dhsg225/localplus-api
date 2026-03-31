// [2025-11-26] - Import EventON events from CSV into Supabase events table
// Usage: node import-events.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'your_key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('📋 How to get your Service Role Key:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Select your project');
  console.error('   3. Go to Settings → API');
  console.error('   4. Copy the "service_role" key (NOT the anon key)');
  console.error('');
  console.error('🔧 Then run:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here node import-events.js');
  console.error('');
  console.error('⚠️  WARNING: Service role key has full database access. Keep it secret!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sandy Beach user ID
const SANDY_BEACH_USER_ID = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc';

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
    // Asia/Bangkok is UTC+7
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
  // Convert back to ISO string with timezone offset
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

// Map EventON CSV row to our events schema
function mapEventRow(row) {
  const startTime = parseDateTime(row.event_start_date, row.event_start_time, row.evo_tz);
  const endTime = parseDateTime(row.event_end_date, row.event_end_time, row.evo_tz);
  
  if (!startTime || !endTime) {
    console.warn(`⚠️  Skipping event ${row.event_id}: Invalid date/time`);
    return null;
  }
  
  // Auto-fix invalid time ranges: if end_time <= start_time, set end_time to start_time + 2 hours
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  let adjustedEndTime = endTime;
  if (endDate <= startDate) {
    adjustedEndTime = addHours(startTime, 2);
    console.log(`🔧 Auto-fixing event ${row.event_id}: End time adjusted from ${endTime} to ${adjustedEndTime} (start_time + 2 hours)`);
  }
  
  // Map publish_status to our status (max 50 chars)
  let status = 'draft';
  if (row.publish_status === 'publish') {
    status = 'published';
  }
  // Ensure status doesn't exceed 50 chars
  status = status.substring(0, 50);
  
  // Map event_type (first one, max 50 chars)
  let eventType = row.event_type || 'general';
  // Truncate if longer than 50 characters
  if (eventType.length > 50) {
    eventType = eventType.substring(0, 50);
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
  
  const event = {
    title: cleanHtml(row.event_name) || 'Untitled Event',
    description: cleanHtml(row.event_description) || null,
    subtitle: cleanHtml(row.evcal_subtitle) || null,
    created_by: SANDY_BEACH_USER_ID,
    event_type: eventType,
    status: status,
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
    business_id: null, // No business association for now
    metadata: {
      eventon_id: row.event_id,
      eventon_location_id: row.evo_location_id,
      eventon_organizer_id: row.evo_organizer_id,
      // [2025-12-01] - Add organizer details for ViewEventModal
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
  
  return event;
}

async function importEvents() {
  try {
    console.log('📂 Reading CSV file...');
    const csvPath = path.join(__dirname, 'Eventon_events_29-11-25.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('📊 Parsing CSV...');
    const records = parse(csvContent, {
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
    
    console.log(`✅ Found ${records.length} events in CSV`);
    
    // Verify Sandy Beach user exists
    console.log(`\n🔍 Verifying Sandy Beach user (${SANDY_BEACH_USER_ID})...`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', SANDY_BEACH_USER_ID)
      .single();
    
    if (userError || !user) {
      throw new Error(`Sandy Beach user not found: ${userError?.message || 'User not found'}`);
    }
    
    console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    
    // Check which events already exist (by external_event_key)
    console.log(`\n🔍 Checking for existing events...`);
    const { data: existingEvents } = await supabase
      .from('events')
      .select('external_event_key')
      .not('external_event_key', 'is', null);
    
    const existingKeys = new Set(existingEvents?.map(e => e.external_event_key) || []);
    console.log(`✅ Found ${existingKeys.size} existing events in database`);
    
    // Process events in batches
    const batchSize = 50;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let duplicates = 0;
    
    console.log(`\n📥 Importing events in batches of ${batchSize}...`);
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const eventsToInsert = [];
      
      for (const row of batch) {
        // Skip if already imported
        const eventKey = row.event_id ? `eventon_${row.event_id}` : null;
        if (eventKey && existingKeys.has(eventKey)) {
          duplicates++;
          continue;
        }
        
        const event = mapEventRow(row);
        if (event) {
          eventsToInsert.push(event);
        } else {
          skipped++;
        }
      }
      
      if (eventsToInsert.length > 0) {
        // Insert one-by-one to identify which events fail
        let batchImported = 0;
        let batchErrors = 0;
        
        for (const event of eventsToInsert) {
          const { data, error } = await supabase
            .from('events')
            .insert([event])
            .select('id, title');
          
          if (error) {
            console.warn(`⚠️  Skipped "${event.title?.substring(0, 50)}": ${error.message}`);
            batchErrors++;
          } else {
            batchImported++;
          }
        }
        
        imported += batchImported;
        errors += batchErrors;
        
        if (batchImported > 0) {
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batchImported}/${eventsToInsert.length} events (${imported}/${records.length - skipped})`);
        }
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`   Total events in CSV: ${records.length}`);
    console.log(`   Already in database: ${duplicates}`);
    console.log(`   Successfully imported: ${imported}`);
    console.log(`   Skipped (invalid data): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log(`\n📋 All events assigned to: ${user.first_name} ${user.last_name} (${user.email})`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importEvents();

