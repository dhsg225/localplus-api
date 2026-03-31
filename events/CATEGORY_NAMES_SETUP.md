# Category Names Setup Guide

## Problem
The `event_type` field in the `events` table stores comma-separated WordPress term IDs (e.g., "1827,3975,3765,") instead of readable category names.

## Solution
1. Export WordPress term_id → name mapping
2. Import into Supabase `wp_term_mapping` table
3. API resolves term IDs to names automatically
4. Frontend displays resolved names

## Steps

### 1. Export WordPress Term Mapping

SSH to your WordPress server and run:

```bash
cd /Users/admin/Dropbox/Development/localplus-api/events
./export-wp-term-mapping.sh huahin.discovertoday.com
```

This creates `wp-term-mapping.json` with term_id → name mappings.

### 2. Create Mapping Table in Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Run: create-term-mapping-table.sql
```

This creates:
- `wp_term_mapping` table
- `resolve_event_type_names()` function (for future use)

### 3. Import Term Mapping

```bash
cd /Users/admin/Dropbox/Development/localplus-api/events
SUPABASE_SERVICE_ROLE_KEY=your_key node import-wp-term-mapping.js wp-term-mapping.json
```

### 4. Deploy Updated API

The API (`events-all/index.js`) now automatically resolves term IDs to names:
- Fetches all unique term IDs from events
- Looks up names in `wp_term_mapping` table
- Adds `event_type_names` field to each event
- Frontend displays `event_type_names` instead of `event_type`

### 5. Test

1. Refresh the Superuser Events Dashboard
2. Category column should now show names like "Music, Food, Art" instead of "1827,3975,3765"

## Files Created

- `export-wp-term-mapping.sh` - Exports WP term mapping
- `create-term-mapping-table.sql` - Creates mapping table and function
- `import-wp-term-mapping.js` - Imports mapping into Supabase
- `CATEGORY_NAMES_SETUP.md` - This guide

## API Changes

The `/api/events/all` endpoint now:
1. Fetches events as before
2. Extracts all unique term IDs from `event_type` fields
3. Queries `wp_term_mapping` table for names
4. Adds `event_type_names` field to each event response

## Frontend Changes

The `SuperuserEventsDashboard` component now:
- Displays `event.event_type_names` instead of `event.event_type`
- Falls back to `event.event_type` if names not resolved
- Falls back to "general" if neither exists

