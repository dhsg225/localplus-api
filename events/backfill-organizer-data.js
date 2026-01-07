// [2025-12-01] - Backfill organizer data into existing events metadata
// Updates events that were imported without organizer details

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
    .trim() || null;
}

// Read CSV
const csvFile = join(__dirname, 'Eventon_events_29-11-25.csv');
console.log('📄 Reading CSV file...');
const csvContent = readFileSync(csvFile, 'utf-8');

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  skip_records_with_error: true
});

console.log(`✅ Loaded ${records.length} events from CSV`);
console.log('');

// Create a map of event_id -> organizer data
const organizerMap = new Map();

records.forEach(row => {
  const eventId = row.event_id;
  const organizerName = cleanHtml(row.event_organizer);
  const organizerDesc = cleanHtml(row.organizer_description);
  const organizerContact = cleanHtml(row.evcal_org_contact);
  const organizerAddress = cleanHtml(row.evcal_org_address);
  const organizerImage = row.evo_org_img && row.evo_org_img !== 'Array' ? row.evo_org_img : null;
  
  // Only add if there's at least one organizer field
  if (organizerName || organizerDesc || organizerContact || organizerAddress || organizerImage) {
    organizerMap.set(`eventon_${eventId}`, {
      organizer_name: organizerName,
      organizer_description: organizerDesc,
      organizer_contact: organizerContact,
      organizer_address: organizerAddress,
      organizer_image: organizerImage
    });
  }
});

console.log(`📊 Found ${organizerMap.size} events with organizer data`);
console.log('');

// Fetch all events with external_event_key
console.log('📥 Fetching events from database...');
const { data: events, error: fetchError } = await supabase
  .from('events')
  .select('id, external_event_key, metadata')
  .not('external_event_key', 'is', null);

if (fetchError) {
  console.error('❌ Error fetching events:', fetchError);
  process.exit(1);
}

console.log(`✅ Found ${events.length} events in database`);
console.log('');

// Update events with organizer data
let updated = 0;
let skipped = 0;
let errors = 0;

for (const event of events) {
  const organizerData = organizerMap.get(event.external_event_key);
  
  if (!organizerData) {
    skipped++;
    continue;
  }

  // Merge organizer data into existing metadata
  const currentMetadata = event.metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    ...organizerData
  };

  const { error: updateError } = await supabase
    .from('events')
    .update({ metadata: updatedMetadata })
    .eq('id', event.id);

  if (updateError) {
    console.error(`❌ Error updating event ${event.id}:`, updateError.message);
    errors++;
  } else {
    updated++;
    if (updated % 10 === 0) {
      process.stdout.write(`\r   ✅ Updated ${updated}/${organizerMap.size} events...`);
    }
  }
}

console.log('');
console.log('');

if (errors === 0) {
  console.log(`✅ Backfill complete!`);
  console.log(`   - Updated: ${updated} events with organizer data`);
  console.log(`   - Skipped: ${skipped} events (no organizer data in CSV)`);
  console.log('');
  console.log('🧪 Next: Refresh the View Event modal to see organizer details!');
} else {
  console.log(`⚠️  Backfill completed with errors`);
  console.log(`   - Updated: ${updated} events`);
  console.log(`   - Errors: ${errors} events`);
}

