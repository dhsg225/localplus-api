// [2024-09-26] - Notifications API for Partner app
// [2025-10-01] - Converted to Vercel serverless function format
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/notifications - Get notification preferences
  if (req.method === 'GET') {
    try {
      const { businessId } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('business_id', businessId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching notification preferences:', error);
        return res.status(500).json({ error: 'Failed to fetch notification preferences' });
      }

      // Return default preferences if none found
      const defaultPreferences = {
        business_id: businessId,
        email_enabled: true,
        sms_enabled: false,
        confirmation_template: 'Your booking at {{restaurant_name}} is confirmed for {{date}} at {{time}}.',
        cancellation_template: 'Your booking at {{restaurant_name}} has been cancelled.',
        reminder_template: 'Reminder: You have a booking at {{restaurant_name}} tomorrow at {{time}}.'
      };

      return res.status(200).json({
        success: true,
        data: preferences || defaultPreferences
      });

    } catch (error) {
      console.error('Notifications GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/notifications - Update notification preferences
  if (req.method === 'POST') {
    try {
      const preferences = req.body;
      
      const { data: updatedPreferences, error } = await supabase
        .from('notification_preferences')
        .upsert(preferences)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification preferences:', error);
        return res.status(500).json({ error: 'Failed to update notification preferences' });
      }

      return res.status(200).json({
        success: true,
        data: updatedPreferences
      });

    } catch (error) {
      console.error('Notifications POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
