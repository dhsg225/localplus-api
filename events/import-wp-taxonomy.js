// [2025-11-30] - Import WordPress taxonomy into LocalPlus event_types table
// Usage: node import-wp-taxonomy.js wp-taxonomy-export.json

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY required');
  console.error('   Set it as: export SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read WP taxonomy export file
const inputFile = process.argv[2] || 'wp-taxonomy-export.json';

console.log(`📦 Importing WordPress taxonomy from: ${inputFile}`);
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

// [2025-11-30] - Clean HTML from descriptions
function cleanHtml(html) {
  if (!html) return null;
  // Remove HTML tags and decode entities
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
    || null;
}

// Map WP term to our event_types structure
function mapWPTermToEventType(wpTerm, parentMap) {
  // Generate URL-friendly key from slug
  const key = wpTerm.slug || wpTerm.name.toLowerCase().replace(/\s+/g, '-');
  
  // Determine level based on parent
  let level = 1;
  let parentId = null;
  
  // Handle parent - can be number, string number, or 0
  const parentTermId = wpTerm.parent ? String(wpTerm.parent) : null;
  
  if (parentTermId && parentTermId !== '0' && parentTermId !== 'null' && parentMap[parentTermId]) {
    const parent = parentMap[parentTermId];
    level = parent.level + 1;
    parentId = parent.id;
  }

  return {
    key: key,
    label: wpTerm.name,
    description: cleanHtml(wpTerm.description),
    color: null, // Will use default
    icon: null,
    level: level,
    parent_id: parentId,
    sort_order: wpTerm.term_id || 0, // Use WP term_id as sort order
    is_active: true
  };
}

// Build parent map first (we need to create parents before children)
const parentMap = {};
const termsByParent = {};

// Group terms by parent
wpTerms.forEach(term => {
  // Normalize parent ID (can be number, string, or 0)
  const parentId = term.parent && String(term.parent) !== '0' ? String(term.parent) : null;
  if (!termsByParent[parentId]) {
    termsByParent[parentId] = [];
  }
  termsByParent[parentId].push(term);
});

// Import function
async function importTaxonomy() {
  const imported = [];
  const errors = [];

  // First pass: Import top-level terms (no parent)
  console.log('📥 Importing top-level categories...');
  for (const term of termsByParent[null] || []) {
    try {
      const eventType = mapWPTermToEventType(term, parentMap);
      
      const { data, error } = await supabase
        .from('event_types')
        .insert([eventType])
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          console.log(`   ⚠️  "${term.name}" already exists, skipping...`);
          // Try to get existing record
          const { data: existing } = await supabase
            .from('event_types')
            .select('id, level')
            .eq('key', eventType.key)
            .single();
          
          if (existing) {
            parentMap[String(term.term_id)] = { id: existing.id, level: existing.level };
          }
          continue;
        }
        throw error;
      }

      parentMap[String(term.term_id)] = { id: data.id, level: data.level };
      imported.push({ wp_term: term.name, localplus_id: data.id, level: data.level });
      console.log(`   ✅ "${term.name}" (Level ${data.level})`);
    } catch (err) {
      errors.push({ term: term.name, error: err.message });
      console.error(`   ❌ "${term.name}":`, err.message);
    }
  }

  // Second pass: Import level 2 (sub-categories)
  console.log('');
  console.log('📥 Importing sub-categories (Level 2)...');
  for (const term of wpTerms) {
    // Skip if already processed or no parent
    if (parentMap[String(term.term_id)] || !term.parent || String(term.parent) === '0') {
      continue;
    }
    
    // Check if parent exists in our map
    const parentKey = String(term.parent);
    if (parentMap[parentKey] && parentMap[parentKey].level === 1) {
      try {
        const eventType = mapWPTermToEventType(term, parentMap);
        
        const { data, error } = await supabase
          .from('event_types')
          .insert([eventType])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            console.log(`   ⚠️  "${term.name}" already exists, skipping...`);
            const { data: existing } = await supabase
              .from('event_types')
              .select('id, level')
              .eq('key', eventType.key)
              .single();
            
            if (existing) {
              parentMap[term.term_id] = { id: existing.id, level: existing.level };
            }
            continue;
          }
          throw error;
        }

        parentMap[String(term.term_id)] = { id: data.id, level: data.level };
        imported.push({ wp_term: term.name, localplus_id: data.id, level: data.level });
        console.log(`   ✅ "${term.name}" (Level ${data.level})`);
      } catch (err) {
        errors.push({ term: term.name, error: err.message });
        console.error(`   ❌ "${term.name}":`, err.message);
      }
    }
  }

  // Third pass: Import level 3 (sub-sub-categories)
  console.log('');
  console.log('📥 Importing sub-sub-categories (Level 3)...');
  for (const term of wpTerms) {
    // Skip if already processed or no parent
    if (parentMap[String(term.term_id)] || !term.parent || String(term.parent) === '0') {
      continue;
    }

    // Check if parent exists in our map (must be level 2)
    const parentKey = String(term.parent);
    if (parentMap[parentKey] && parentMap[parentKey].level === 2) {
      try {
        const eventType = mapWPTermToEventType(term, parentMap);
        
        const { data, error } = await supabase
          .from('event_types')
          .insert([eventType])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            console.log(`   ⚠️  "${term.name}" already exists, skipping...`);
            continue;
          }
          throw error;
        }

        parentMap[String(term.term_id)] = { id: data.id, level: data.level };
        imported.push({ wp_term: term.name, localplus_id: data.id, level: data.level });
        console.log(`   ✅ "${term.name}" (Level ${data.level})`);
      } catch (err) {
        errors.push({ term: term.name, error: err.message });
        console.error(`   ❌ "${term.name}":`, err.message);
      }
    }
  }

  // Summary
  console.log('');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('');
    console.log('❌ Errors:');
    errors.forEach(err => {
      console.log(`   - ${err.term}: ${err.error}`);
    });
  }

  if (imported.length > 0) {
    console.log('');
    console.log('✅ Import complete! Categories are now available in the Taxonomy Manager.');
  }
}

// Run import
importTaxonomy().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

