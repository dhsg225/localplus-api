// [2026-02-08] - Reconcile event statuses from Eventon_events_07-02-26.csv
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const csvFile = path.join(__dirname, 'Eventon_events_07-02-26.csv');
    const csv = fs.readFileSync(csvFile, 'utf-8');

    const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        relax_column_count: true
    });

    console.log(`🔍 Checking ${records.length} records...`);

    let updated = 0;
    let alreadyCorrect = 0;
    let notInDb = 0;

    for (const row of records) {
        const externalKey = `eventon_${row.event_id}`;
        const csvStatus = row.publish_status === 'publish' ? 'published' : 'draft';

        const { data: event, error } = await supabase
            .from('events')
            .select('id, status, title')
            .eq('external_event_key', externalKey)
            .single();

        if (error || !event) {
            notInDb++;
            continue;
        }

        if (event.status !== csvStatus) {
            console.log(`Updating "${event.title}" (${externalKey}): ${event.status} -> ${csvStatus}`);
            const { error: updateError } = await supabase
                .from('events')
                .update({ status: csvStatus })
                .eq('id', event.id);

            if (updateError) {
                console.error(`❌ Error updating ${event.title}:`, updateError.message);
            } else {
                updated++;
            }
        } else {
            alreadyCorrect++;
        }
    }

    console.log(`\n🎉 Reconciliation Summary:\n- Updated: ${updated}\n- Already correct: ${alreadyCorrect}\n- Not found in DB: ${notInDb}`);
}

run().catch(console.error);
