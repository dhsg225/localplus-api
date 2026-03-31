const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uakfsxlsmmmpqsjjhlnb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVha2ZzeGxzbW1tcHFzampobG5iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc5OTI3MiwiZXhwIjoyMDc1Mzc1MjcyfQ.7i62ZQIwPRqsxEGDgIQR4igPlvN11M5kEJXKE5Fe3UI');

async function onboard() {
    const { data: projects } = await supabase.from('projects')
        .select('id')
        .ilike('name', '%Administrative Templates%');

    let projectId;
    if (!projects || projects.length === 0) {
        console.log('Creating Administrative Templates project...');
        const { data: newProj, error: err } = await supabase.from('projects').insert({
            name: 'Administrative Templates',
            description: 'Global master templates for the platform',
            industry: 'agency',
            organization_id: '550e8400-e29b-41d4-a716-446655440000'
        }).select().single();
        if (err) {
            console.error('Project creation failed:', err.message);
            return;
        }
        projectId = newProj.id;
    } else {
        projectId = projects[0].id;
    }

    // Check if site already exists
    const { data: existing } = await supabase.from('wp_sites')
        .select('site_id')
        .eq('subdomain', 'midnight-vault.eatsthailand.com')
        .single();

    if (existing) {
        console.log('✅ Midnight Vault already onboarded.');
        return;
    }

    const { data, error } = await supabase.from('wp_sites').insert({
        project_id: projectId,
        subdomain: 'midnight-vault.eatsthailand.com',
        wordpress_url: 'https://midnight-vault.eatsthailand.com',
        theme_type: 'restaurant',
        deployment_status: 'live',
        dns_status: 'active'
    }).select();

    if (error) {
        console.error('Insert failed:', error.message);
    } else {
        console.log('✅ Success: Midnight Vault onboarded.');
    }
}
onboard();
