const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

// Try to get service role key from env or args
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!serviceRoleKey || serviceRoleKey === 'your_key') {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required to run migrations.');
    console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_actual_key node run-media-migration.js');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    console.log('🚀 Running Media Manager migration...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20260107190000_create_event_media.sql');
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📖 Read SQL file: ${sqlPath}`);
    console.log(`Requesting execution via Postgres function (if available)...`);

    // Note: Supabase JS doesn't support raw SQL execution without a helper function.
    // However, if the user has a "exec_sql" function defined (common in some setups), we can use it.
    // If not, we instruct the user.

    try {
        // Attempt to verify if 'exec_sql' exists or similar mechanism
        // For now, we print instructions if we can't do it directly.

        console.log('\n⚠️  AUTOMATIC MIGRATION NOT POSSIBLE VIA JS CLIENT WITHOUT RPC ⚠️');
        console.log('Per security best practices, the JS client cannot run raw DDL (CREATE TABLE).');
        console.log('You must run the SQL manually in the Supabase Dashboard SQL Editor.');

        console.log('\nCopy and paste this SQL into the Supabase SQL Editor:');
        console.log('----------------------------------------------------');
        console.log(sqlContent);
        console.log('----------------------------------------------------');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

runMigration();
