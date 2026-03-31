# Automated Category Names Setup

## Quick Start

```bash
cd /Users/admin/Dropbox/Development/localplus-api/events

# Set required environment variables
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
export SUPABASE_JWT_SECRET=your_jwt_secret

# Run automated setup
./setup-all.sh
```

## What It Does

1. **Exports WordPress mapping** (if WP CLI available)
2. **Prompts for SQL execution** (manual step in Supabase Dashboard)
3. **Imports mappings** automatically
4. **Deploys API function** automatically

## Prerequisites

- `SUPABASE_SERVICE_ROLE_KEY` - From Supabase Dashboard → Settings → API
- `SUPABASE_JWT_SECRET` - From Supabase Dashboard → Settings → API → JWT Settings
- WP CLI (optional, for automatic export)
- Node.js (for import script)
- gcloud CLI (for API deployment)

## Manual Steps

The script will pause at Step 2 for you to:
1. Open Supabase SQL Editor
2. Copy contents of `create-term-mapping-table.sql`
3. Run the SQL
4. Press Enter to continue

## Alternative: Step-by-Step

If you prefer to run steps manually:

```bash
# 1. Export (if WP CLI available)
./export-wp-term-mapping.sh huahin.discovertoday.com

# 2. Run SQL in Supabase Dashboard
# File: create-term-mapping-table.sql

# 3. Import
SUPABASE_SERVICE_ROLE_KEY=your_key node import-wp-term-mapping.js wp-term-mapping.json

# 4. Deploy
cd ../google-cloud-functions/events-all
SUPABASE_SERVICE_ROLE_KEY=your_key SUPABASE_JWT_SECRET=your_jwt ./deploy.sh
```

