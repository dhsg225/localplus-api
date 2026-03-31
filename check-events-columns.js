// Check events table columns
const { Client } = require('pg');

const client = new Client({
  host: 'db.joknprahhqdhvdhzmuwl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'rdctaeRVldHVvmxX',
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    return client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'events' 
      ORDER BY ordinal_position
    `);
  })
  .then(result => {
    console.log('Events table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    // Filter for image-related columns
    const imageCols = result.rows
      .filter(r => r.column_name.toLowerCase().includes('image') || 
                   r.column_name.toLowerCase().includes('url') ||
                   r.column_name.toLowerCase().includes('photo') ||
                   r.column_name.toLowerCase().includes('thumbnail'))
      .map(r => r.column_name);
    console.log('\nImage-related columns:');
    imageCols.forEach(col => console.log(`  ${col}`));
    client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
    client.end();
  });

