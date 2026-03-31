const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkPartners() {
    console.log('--- Partners & Businesses ---');
    const { data: partners, error } = await supabase
        .from('partners')
        .select('*, businesses(*)');
    
    if (error) {
        console.error('Error fetching partners:', error);
        return;
    }

    console.log(JSON.stringify(partners, null, 2));

    console.log('\n--- Recent Menu Items ---');
    const { data: items, error: itemError } = await supabase
        .from('restaurant_menu_items')
        .select('*')
        .limit(5);

    if (itemError) {
        console.error('Error fetching menu items:', itemError);
    } else {
        console.log(JSON.stringify(items, null, 2));
    }
}

checkPartners();
