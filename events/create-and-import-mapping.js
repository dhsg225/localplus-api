// [2025-12-01] - Create wp_term_mapping table and import WordPress term mapping
// Usage: node create-and-import-mapping.js [wp-term-mapping.json]

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk';

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

console.log('🚀 Setting up WordPress term mapping...');
console.log('');

// Step 1: Create the table using raw SQL via REST API
console.log('📋 Step 1: Creating wp_term_mapping table...');

// Use Supabase REST API to execute SQL
// Note: We'll use the Management API endpoint for SQL execution
const createTableSQL = `
CREATE TABLE IF NOT EXISTS wp_term_mapping (
  term_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wp_term_mapping_name ON wp_term_mapping(name);
`;

try {
  // Try to execute via REST API (this may not work, but worth trying)
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql: createTableSQL })
  });

  if (!response.ok) {
    // If exec_sql doesn't exist, we need manual SQL execution
    console.log('   ⚠️  Automatic SQL execution not available');
    console.log('   📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   🔗 https://supabase.com/dashboard → SQL Editor');
    console.log('');
    console.log('   SQL to run:');
    console.log('   ──────────────────────────────────────────');
    const sqlFile = join(__dirname, 'create-term-mapping-table.sql');
    if (existsSync(sqlFile)) {
      const sql = readFileSync(sqlFile, 'utf-8');
      console.log(sql);
    } else {
      console.log(createTableSQL);
    }
    console.log('   ──────────────────────────────────────────');
    console.log('');
    console.log('   Press Enter after running the SQL...');
    // In a real script, we'd use readline, but for now just continue
    console.log('   (Continuing with import step...)');
  } else {
    console.log('   ✅ Table created successfully');
  }
} catch (error) {
  console.log('   ⚠️  Could not execute SQL automatically');
  console.log('   📋 Please run create-term-mapping-table.sql in Supabase SQL Editor');
  console.log('   (Continuing with import step...)');
}

console.log('');

// Step 2: Import term mapping
const mappingFile = process.argv[2] || 'wp-term-mapping.json';
const mappingPath = join(__dirname, mappingFile);

if (!existsSync(mappingPath)) {
  console.log('📤 Step 2: Importing term mapping...');
  console.log(`   ⚠️  Mapping file not found: ${mappingFile}`);
  console.log('');
  console.log('   To create the mapping file:');
  console.log('   1. SSH to WordPress server');
  console.log('   2. Run: wp term list event_type --format=json --fields=term_id,name,slug > wp-term-mapping.json');
  console.log('   3. Copy the file to this directory');
  console.log('');
  console.log('   Or run: ./export-wp-term-mapping.sh huahin.discovertoday.com');
  process.exit(1);
}

console.log('📤 Step 2: Importing term mapping...');
console.log(`   Reading: ${mappingFile}`);

let wpTerms;
try {
  const fileContent = readFileSync(mappingPath, 'utf-8');
  wpTerms = JSON.parse(fileContent);
} catch (err) {
  console.error(`   ❌ Failed to read ${mappingFile}:`, err.message);
  process.exit(1);
}

if (!Array.isArray(wpTerms) || wpTerms.length === 0) {
  console.error('   ❌ No terms found in export file');
  process.exit(1);
}

console.log(`   ✅ Found ${wpTerms.length} WordPress terms`);
console.log('');

// Prepare batch insert
const mappings = wpTerms.map(term => ({
  term_id: parseInt(term.term_id),
  name: term.name || '',
  slug: term.slug || null
}));

console.log('   📤 Inserting term mappings into Supabase...');

// Insert in batches of 100
const batchSize = 100;
let inserted = 0;
let errors = 0;

for (let i = 0; i < mappings.length; i += batchSize) {
  const batch = mappings.slice(i, i + batchSize);
  
  const { data, error } = await supabase
    .from('wp_term_mapping')
    .upsert(batch, { onConflict: 'term_id' });
  
  if (error) {
    console.error(`   ❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`\r   ✅ Inserted ${inserted}/${mappings.length} mappings...`);
  }
}

console.log('');
console.log('');

if (errors === 0) {
  console.log(`✅ Setup complete!`);
  console.log(`   - Inserted/Updated: ${inserted} mappings`);
  console.log('');
  console.log('🧪 Next: Refresh the Superuser Events Dashboard to see category names!');
} else {
  console.log(`⚠️  Setup completed with errors`);
  console.log(`   - Inserted: ${inserted} mappings`);
  console.log(`   - Errors: ${errors} batches`);
}

