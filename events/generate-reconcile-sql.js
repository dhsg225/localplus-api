const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

async function run() {
    const csvFile = path.join(__dirname, 'Eventon_events_07-02-26.csv');
    const csv = fs.readFileSync(csvFile, 'utf-8');

    // Parse CSV with BOM handling
    const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        relax_column_count: true,
        relax_quotes: true,
        skip_records_with_error: true
    });

    console.log(`-- Reconciling statuses for ${records.length} records`);
    console.log('BEGIN;');

    let count = 0;
    for (const row of records) {
        // Only care about published events (since they were wrongly imported as draft)
        if (row.publish_status === 'publish') {
            const externalKey = `eventon_${row.event_id}`;
            // Use safe value interpolation if possible, but for simple status update string concat is okay for this internal script
            // escaping single quotes in key if any (though eventon IDs are usually numeric)
            const safeKey = externalKey.replace(/'/g, "''");

            console.log(`UPDATE events SET status = 'published' WHERE external_event_key = '${safeKey}' AND status = 'draft';`);
            count++;
        }
    }

    console.log('COMMIT;');
    console.log(`-- Generated updates for ${count} published events`);
}

run().catch(console.error);
