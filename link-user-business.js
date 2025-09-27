// [2024-12-19] - Vercel serverless API function for secure user-business linking
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
  // [2024-12-19] - Secure user-business linking API for Vercel deployment
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId, businessId, role = 'owner' } = req.body;
    
    if (!userId || !businessId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔒 Secure user-business link request received:', { userId, businessId, role });
    
    const { error } = await supabase
      .from('partners')
      .insert({
        user_id: userId,
        business_id: businessId,
        role: role,
        is_active: true,
        accepted_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ Error linking user to business:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to link user to business' 
      });
    }
    
    console.log('✅ User linked to business successfully via secure API');
    return res.status(200).json({ success: true });
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
} 