// [2024-12-19] - Vercel serverless API function for secure business fetching
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://joknprahhqdhvdhzmuwl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  // [2024-12-19] - Secure business fetching API for Vercel deployment
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔒 Secure business fetch request received');
    
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, partnership_status')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching businesses:', error);
      return res.status(500).json({ error: 'Failed to fetch businesses' });
    }
    
    console.log(`✅ Securely fetched ${data?.length || 0} businesses`);
    return res.status(200).json({ businesses: data || [] });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 