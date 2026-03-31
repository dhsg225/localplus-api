const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

async function run() {
  const csvFile = path.join(__dirname, 'Eventon_events_07-02-26.csv');
  const csv = fs.readFileSync(csvFile, 'utf-8');

  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
    skip_records_with_error: true
  });

  const expected = [];
  for (const row of records) {
    if (row.publish_status) {
      expected.push({
        key: `eventon_${row.event_id}`,
        status: row.publish_status === 'publish' ? 'published' : 'draft'
      });
    }
  }

  // Output TypeScript code for the verify status function
  const projectRoot = path.join(__dirname, '..', 'localplus-api');
  const funcDir = path.join(projectRoot, 'supabase', 'functions', 'verify-statuses');

  if (!fs.existsSync(funcDir)) {
    fs.mkdirSync(funcDir, { recursive: true });
  }

  const tsContent = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Array of { key, status }
const expectedStatuses = ${JSON.stringify(expected)};

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // We can't query all keys at once efficiently in one simple call due to URL length limits if we used '.in()',
  // but we can chunk them or, more simply, just query *all* events matching our source (created_by Sandy Beach)
  // Or query by external_event_key.in(...) in chunks.
  
  // Let's try to query by chunks of 100
  const limit = 100;
  const mismatches = [];
  let checkedCount = 0;
  let missingCount = 0;

  for (let i = 0; i < expectedStatuses.length; i += limit) {
    const chunk = expectedStatuses.slice(i, i + limit);
    const keys = chunk.map(item => item.key);

    const { data: events, error } = await supabase
      .from('events')
      .select('external_event_key, status')
      .in('external_event_key', keys);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const eventMap = new Map();
    events?.forEach(e => eventMap.set(e.external_event_key, e.status));

    for (const item of chunk) {
      if (eventMap.has(item.key)) {
        const actualStatus = eventMap.get(item.key);
        if (actualStatus !== item.status) {
          mismatches.push({
            event_id: item.key,
            expected: item.status,
            actual: actualStatus
          });
        }
        checkedCount++;
      } else {
        missingCount++;
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      message: 'Verification complete', 
      total_checked: checkedCount,
      missing_in_db: missingCount,
      mismatches_count: mismatches.length,
      mismatches: mismatches.slice(0, 50) // limit output
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
`;

  fs.writeFileSync(path.join(funcDir, 'index.ts'), tsContent);
  console.log(`Generated verification function at ${path.join(funcDir, 'index.ts')}`);
}

run().catch(console.error);
