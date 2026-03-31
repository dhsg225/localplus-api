# Quick Setup: Category Names Resolution

## Problem
Categories are showing as numbers (e.g., "1763", "1789") instead of names because the `wp_term_mapping` table doesn't exist yet.

## Quick Fix (2 Steps)

### Step 1: Create the Table in Supabase

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard
   - Select project: `joknprahhqdhvdhzmuwl`
   - Click: **SQL Editor** (left sidebar)
   - Click: **New Query**

2. **Run the SQL:**
   - The SQL is already copied to your clipboard! ✅
   - Or copy from: `create-term-mapping-table.sql`
   - Paste and click **Run**

### Step 2: Export and Import WordPress Terms

**Option A: If you have WP CLI access:**
```bash
cd /Users/admin/Dropbox/Development/localplus-api/events

# Export from WordPress
./export-wp-term-mapping.sh huahin.discovertoday.com

# Import into Supabase
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1MjcxMCwiZXhwIjoyMDY1MjI4NzEwfQ.8Esm5KMfVJAQxHoKrEV9exsMASEFTnHfKOdqSt5cDFk"
node create-and-import-mapping.js wp-term-mapping.json
```

**Option B: Manual export (if no WP CLI):**
1. SSH to WordPress server
2. Run: `wp term list event_type --format=json --fields=term_id,name,slug > wp-term-mapping.json`
3. Copy file to `/Users/admin/Dropbox/Development/localplus-api/events/`
4. Run: `node create-and-import-mapping.js wp-term-mapping.json`

## After Setup

Refresh the Superuser Events Dashboard - categories should now show names instead of numbers!

