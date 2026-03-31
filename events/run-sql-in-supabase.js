// [2025-12-01] - Run SQL in Supabase using service role key
// Usage: node run-sql-in-supabase.js <sql-file>

const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join, resolve } = require('path');
// Node 18+ has global fetch, but if using older node or to be safe with deps:
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  console.log('Using global fetch');
  fetch = global.fetch;
}

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

const sqlFile = process.argv[2] || 'create-term-mapping-table.sql';
// Handle both absolute and relative paths
const sqlPath = resolve(process.cwd(), sqlFile);

console.log(`📄 Reading SQL file: ${sqlFile}`);
console.log(`   Resolved path: ${sqlPath}`);
console.log('');

let sql;
try {
  sql = readFileSync(sqlPath, 'utf-8');
} catch (err) {
  console.error(`❌ Failed to read ${sqlPath}:`, err.message);
  process.exit(1);
}

console.log('🚀 Executing SQL in Supabase...');
console.log('');

// Execute SQL via Supabase REST API (rpc call to execute SQL)
// Note: Supabase doesn't have a direct SQL execution endpoint via REST API
// We need to use the PostgREST API or Management API

(async () => {
  // Split SQL by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length === 0) {
      continue;
    }

    try {
      // Try using rpc if it's a function, otherwise use direct query
      if (statement.toUpperCase().includes('CREATE FUNCTION') || statement.toUpperCase().includes('CREATE OR REPLACE FUNCTION')) {
        // For functions, we need to execute via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          throw new Error(`RPC exec_sql failed with status ${response.status}`);
        }
      } else {
        // For CREATE TABLE and other DDL, the JS client doesn't support raw SQL easily.
        // We will TRY to use the 'pg' library pattern if we had connection string, but here we only have REST.
        // ACTUALLY: The best way to run raw SQL via REST with service key is using the `/rest/v1/` endpoint 
        // IF there is a stored procedure `exec_sql` or similar exposed. 
        // By default there isn't.

        // HOWEVER: The user wants me to run this.
        // Supabase JS client v2 has `rpc` method.
        // Let's assume there is an `exec_sql` function or similar, OR we fall back to:
        // Using the `pg` driver directly is not possible without connection string.

        // Wait, the previous script tried to use `fetch` to `exec_sql`.
        // Let's try to use the `rpc` method if available, or just fail gracefully.

        // Alternative: Use `supabase-js`'s  `rpc` if the project has a `exec_sql` function.
        // If not, we can't run DDL via REST easily.

        // UPDATE: The user said "Run the SQL in your Supabase SQL Editor".
        // They might EXPECT me to fail if I can't do it via script.
        // But let's try to be helpful.
        // Many Supabase projects have a helper function for running SQL.

        // Let's try to execute via a standard Postgres query if we can? No.

        // Let's try using `v1/query` if available (pg_graphql?) No.

        // Okay, let's keep the logic simple: try to execute.
        // If it fails, we tell the user to run it manually.

        console.log(`   ⚠️  Statement ${i + 1}: Executing...`);
        // We can't really execute raw DDL (CREATE TABLE) via standard Supabase JS client
        // unless we have a specific RPC function.
        // The previous script had logic for functions but skipped TABLES.
        // Since I'm stuck with REST, I will log that I can't run it automatically 
        // and tell the user to run it manually.
        // BUT, I can try to use `rpc('exec_sql', { sql: statement })` if it exists.

        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // If exec_sql doesn't exist, we can't do much.
          console.error(`   ❌ Failed to execute via RPC: ${error.message}`);
          throw error;
        }
      }

      successCount++;
      process.stdout.write(`\r   ✅ Executed ${successCount}/${statements.length} statements...`);
    } catch (error) {
      errorCount++;
      console.error(`\n   ❌ Error in statement ${i + 1}:`, error.message);
    }
  }

  console.log('');
  console.log('');

  if (errorCount === 0 && successCount > 0) {
    console.log(`✅ SQL execution complete! (${successCount} statements)`);
  } else {
    console.log('⚠️  Could not execute SQL automatically via script.');
    console.log('   The `exec_sql` RPC function likely does not exist.');
    console.log('   Please run the SQL manually in Supabase SQL Editor:');
    console.log(`   File: ${sqlFile}`);
  }

})();
