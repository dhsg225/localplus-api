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

    const updates = [];
    for (const row of records) {
        if (row.publish_status === 'publish') {
            updates.push(`eventon_${row.event_id}`);
        }
    }

    // Output TypeScript code for the function
    const projectRoot = path.join(__dirname, '..');
    const funcDir = path.join(projectRoot, 'supabase', 'functions', 'fix-statuses');

    if (!fs.existsSync(funcDir)) {
        fs.mkdirSync(funcDir, { recursive: true });
    }

    const tsContent = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const keysToUpdate = ${JSON.stringify(updates, null, 2)};

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let updatedCount = 0;
  let errorCount = 0;
  const results = [];

  for (const key of keysToUpdate) {
    const { error } = await supabase
      .from('events')
      .update({ status: 'published' })
      .eq('external_event_key', key)
      .eq('status', 'draft');

    if (error) {
      errorCount++;
      results.push({ key, status: 'error', message: error.message });
    } else {
      updatedCount++;
    }
  }

  return new Response(
    JSON.stringify({ 
      message: 'Reconciliation complete', 
      updated: updatedCount, 
      errors: errorCount,
      details: results 
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
`;

    fs.writeFileSync(path.join(funcDir, 'index.ts'), tsContent);
    console.log(`Generated function with ${updates.length} updates at ${path.join(funcDir, 'index.ts')}`);
}

run().catch(console.error);
