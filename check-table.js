const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking event_media table...');
    const { data, error } = await supabase
        .from('event_media')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying event_media table:', error.message);
        console.error('Code:', error.code);
    } else {
        console.log('event_media table exists! Rows found:', data.length);
    }
}

checkTable();
