const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing connection to Supabase...');
    try {
        const { count, error } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error querying events table:', error.message);
            console.error('Code:', error.code);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
        } else {
            console.log('Successfully connected to events table. Total count:', count);
        }

        const { data: rows, error: selectError } = await supabase
            .from('events')
            .select('id, title, status')
            .limit(5);

        if (selectError) {
            console.error('Error selecting rows:', selectError.message);
        } else {
            console.log('Sample data:', rows);
        }

        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        if (storageError) {
            console.error('Error listing buckets:', storageError.message);
        } else {
            console.log('Buckets:', buckets.map(b => b.name));
        }

    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

test();
