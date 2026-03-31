// Quick script to update wp_term_mapping table with missing category IDs
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateMapping() {
  console.log('📦 Updating wp_term_mapping table...\n');
  
  // Read the mapping file
  const wpTerms = JSON.parse(readFileSync('wp-term-mapping.json', 'utf-8'));
  
  // Filter for the specific IDs we need
  const neededIds = [1832, 1829, 3990, 5622, 1827];
  const mappings = wpTerms
    .filter(term => neededIds.includes(parseInt(term.term_id)))
    .map(term => ({
      term_id: parseInt(term.term_id),
      name: term.name || '',
      slug: term.slug || null
    }));
  
  console.log(`Found ${mappings.length} mappings to update:`);
  mappings.forEach(m => console.log(`  ${m.term_id}: ${m.name}`));
  console.log('');
  
  // Upsert into Supabase
  const { data, error } = await supabase
    .from('wp_term_mapping')
    .upsert(mappings, { onConflict: 'term_id' });
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  console.log('✅ Successfully updated wp_term_mapping table!');
  console.log('   Refresh the Partner App to see category names.');
}

updateMapping().catch(console.error);

