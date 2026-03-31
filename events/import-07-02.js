// [2026-02-07] - Import only NEW events from Eventon_events_07-02-26.csv
// Compares with Eventon_events_23-12-25.csv and imports only new events
// Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node import-07-02.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
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

// Sandy Beach user ID
const SANDY_BEACH_USER_ID = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

// Helper function to parse date and time
function parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;

    try {
        // Parse date (MM/DD/YYYY)
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const [month, day, year] = parts;

        // Parse time (HH:MM:AM/PM)
        let [time, period] = timeStr.split(/(AM|PM)/i);
        const [hours, minutes, seconds = '00'] = time.trim().split(':');
        let hour24 = parseInt(hours);

        if (period?.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period?.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
        }

        // Create ISO string with timezone offset (+07:00 for Bangkok)
        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}+07:00`;

        return isoString;
    } catch (error) {
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

// Helper to add hours
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

// Map row to schema
function mapEventRow(row) {
    const startTime = parseDateTime(row.event_start_date, row.event_start_time);
    const endTime = parseDateTime(row.event_end_date, row.event_end_time);

    if (!startTime || !endTime) return null;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    let adjustedEndTime = endTime;
    if (endDate <= startDate) {
        adjustedEndTime = addHours(startTime, 2);
    }

    const latitude = row.location_latitude ? parseFloat(row.location_latitude) : null;
    const longitude = row.location_longitude ? parseFloat(row.location_longitude) : null;

    const isRecurring = row.repeatevent === 'yes';

    let location = null;
    if (row.event_location) {
        location = cleanHtml(row.event_location);
    } else if (row.location_name) {
        location = cleanHtml(row.location_name);
    }

    // Map event_type (truncate to 50 chars for database schema limits)
    let eventType = row.event_type || 'general';
    if (eventType.length > 50) {
        eventType = eventType.substring(0, 50);
    }

    return {
        title: cleanHtml(row.event_name) || 'Untitled Event',
        description: cleanHtml(row.event_description) || null,
        subtitle: cleanHtml(row.evcal_subtitle) || null,
        created_by: SANDY_BEACH_USER_ID,
        event_type: eventType,
        status: row.publish_status === 'publish' ? 'published' : 'draft',
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
        theme_color_hex: row.color ? `#${row.color}` : null,
        timezone_id: row.evo_tz || 'Asia/Bangkok',
        hide_end_time_flag: row.hide_end_time === 'yes',
        is_year_round: row.yearlong === 'yes',
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? (row.frequency || null) : null,
        recurrence_count: row.repeats ? parseInt(row.repeats) : null,
        metadata: {
            eventon_id: row.event_id,
            organizer_name: cleanHtml(row.event_organizer) || null,
            organizer_contact: cleanHtml(row.evcal_org_contact) || null,
            organizer_address: cleanHtml(row.evcal_org_address) || null
        }
    };
}

async function run() {
    const newFile = path.join(__dirname, 'Eventon_events_07-02-26.csv');
    const oldFile = path.join(__dirname, 'Eventon_events_23-12-25.csv');

    console.log(`📂 Loading files...\nNew: ${path.basename(newFile)}\nOld: ${path.basename(oldFile)}`);

    const newCsv = fs.readFileSync(newFile, 'utf-8');
    const oldCsv = fs.readFileSync(oldFile, 'utf-8');

    const parseOptions = {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        relax_quotes: true,
        escape: '"',
        quote: '"',
        skip_records_with_error: true,
        bom: true
    };

    const newEvents = parse(newCsv, parseOptions);
    const oldEvents = parse(oldCsv, parseOptions);

    console.log(`📊 Total events: New file (${newEvents.length}), Old file (${oldEvents.length})`);

    const oldIds = new Set(oldEvents.map(e => e.event_id));
    const trulyNewRows = newEvents.filter(e => !oldIds.has(e.event_id));

    console.log(`✨ Identified ${trulyNewRows.length} potential new events by ID.`);

    if (trulyNewRows.length === 0) {
        console.log('✅ No new events to add.');
        return;
    }

    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of trulyNewRows) {
        const event = mapEventRow(row);
        if (!event) {
            skipped++;
            continue;
        }

        // Check DB just in case
        const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('external_event_key', event.external_event_key)
            .limit(1)
            .single();

        if (existing) {
            skipped++;
            continue;
        }

        const { error } = await supabase.from('events').insert([event]);
        if (error) {
            console.error(`❌ Error adding "${event.title}":`, error.message);
            errors++;
        } else {
            console.log(`✅ Added: ${event.title}`);
            added++;
        }
    }

    console.log(`\n🎉 Summary:\n- New events added: ${added}\n- Skipped (existing/invalid): ${skipped}\n- Errors: ${errors}`);
}

run().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
