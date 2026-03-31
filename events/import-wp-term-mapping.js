// [2025-12-01] - Import WordPress term_id -> name mapping into Supabase
// Usage: node import-wp-term-mapping.js wp-term-mapping.json

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('📋 How to get your Service Role Key:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Select your project');
  console.error('   3. Go to Settings → API');
  console.error('   4. Copy the "service_role" key (NOT the anon key)');
  console.error('');
  console.error('🔧 Then run:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_key node import-wp-term-mapping.js wp-term-mapping.json');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read WP term mapping export file
const inputFile = process.argv[2] || 'wp-term-mapping.json';

console.log(`📦 Importing WordPress term mapping from: ${inputFile}`);
console.log('');

let wpTerms;
try {
  const fileContent = readFileSync(inputFile, 'utf-8');
  wpTerms = JSON.parse(fileContent);
} catch (err) {
  console.error(`❌ Failed to read ${inputFile}:`, err.message);
  process.exit(1);
}

if (!Array.isArray(wpTerms) || wpTerms.length === 0) {
  console.error('❌ No terms found in export file');
  process.exit(1);
}

console.log(`✅ Found ${wpTerms.length} WordPress terms`);
console.log('');

// Prepare batch insert
const mappings = wpTerms.map(term => ({
  term_id: parseInt(term.term_id),
  name: term.name || '',
  slug: term.slug || null
}));

console.log('📤 Inserting term mappings into Supabase...');
console.log('');

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
    console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`\r✅ Inserted ${inserted}/${mappings.length} mappings...`);
  }
}

console.log('');
console.log('');
console.log(`✅ Import complete!`);
console.log(`   - Inserted/Updated: ${inserted} mappings`);
if (errors > 0) {
  console.log(`   - Errors: ${errors} batches`);
}

