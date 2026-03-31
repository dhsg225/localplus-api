# WordPress Taxonomy Import Guide

This guide shows how to export event categories from WordPress and import them into LocalPlus's hierarchical taxonomy system.

## Prerequisites

1. **WP CLI installed** on your WordPress server
2. **SSH access** to your WordPress site
3. **Node.js** installed locally (for import script)

## Step 1: Export from WordPress

### Option A: Using WP CLI via SSH

```bash
# SSH to your WordPress server
ssh user@your-wp-site.com

# Navigate to WordPress root directory
cd /path/to/wordpress

# Export event categories (common taxonomy names)
wp term list event_category --format=json --fields=term_id,name,slug,description,parent,count > wp-taxonomy-export.json

# Or try these common taxonomy names if event_category doesn't work:
# wp term list event_type --format=json --fields=term_id,name,slug,description,parent,count > wp-taxonomy-export.json
# wp term list event_category --format=json --fields=term_id,name,slug,description,parent,count > wp-taxonomy-export.json
# wp term list category --format=json --fields=term_id,name,slug,description,parent,count > wp-taxonomy-export.json

# Download the file to your local machine
# (Use scp or copy the content)
```

### Option B: Using the Export Script

```bash
# On your WordPress server
chmod +x export-wp-taxonomy.sh
./export-wp-taxonomy.sh event_category

# This will create wp-taxonomy-export.json
```

### Finding the Correct Taxonomy Name

If you're not sure what taxonomy name WordPress uses:

```bash
# List all taxonomies
wp taxonomy list

# List terms for a specific taxonomy
wp term list event_category

# Get detailed info about a term
wp term get event_category <term_id>
```

## Step 2: Transfer File to Local Machine

```bash
# From your local machine, use SCP to download
scp user@your-wp-site.com:/path/to/wordpress/wp-taxonomy-export.json ./wp-taxonomy-export.json

# Or copy the JSON content manually and save it to a file
```

## Step 3: Import into LocalPlus

### Setup

```bash
# Navigate to events directory
cd localplus-api/events

# Set Supabase credentials
export SUPABASE_URL="https://joknprahhqdhvdhzmuwl.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Make sure taxonomy schema is applied
# Run taxonomy-schema.sql in Supabase SQL editor first!
```

### Run Import

```bash
# Import the taxonomy
node import-wp-taxonomy.js wp-taxonomy-export.json
```

## Step 4: Verify in UI

1. Open the Partner app
2. Navigate to "Categories" tab
3. You should see all imported categories with their hierarchy

## Common Taxonomy Names

Different WordPress event plugins use different taxonomy names:

- **EventON**: `event_category`, `event_type`
- **The Events Calendar**: `tribe_events_cat`
- **Event Organiser**: `event-category`
- **Custom**: Check with `wp taxonomy list`

## Troubleshooting

### WP CLI Not Found

```bash
# Install WP CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
```

### Taxonomy Not Found

```bash
# List all taxonomies to find the right one
wp taxonomy list

# Check if it's a custom post type taxonomy
wp post-type list
wp taxonomy list --post_type=event
```

### Import Errors

- **Duplicate key errors**: Categories already exist, script will skip them
- **Parent not found**: Make sure parent categories are imported first (script handles this)
- **RLS policy errors**: Use service role key, not anon key

### Manual Mapping

If automatic import fails, you can manually map:

1. Export to JSON
2. Review the structure
3. Manually create categories in the Taxonomy Manager UI
4. Or edit the import script to match your WP structure

## Example Output

```json
[
  {
    "term_id": 1,
    "name": "Music",
    "slug": "music",
    "description": "Music events",
    "parent": 0,
    "count": 15
  },
  {
    "term_id": 2,
    "name": "Jazz",
    "slug": "jazz",
    "description": "Jazz concerts",
    "parent": 1,
    "count": 5
  }
]
```

This will create:
- Level 1: Music
  - Level 2: Jazz

## Next Steps

After import:
1. Review categories in Taxonomy Manager
2. Adjust colors, icons, and sort order
3. Link events to categories using `primary_type_id` or `secondary_type_id`
4. Update event forms to use the new taxonomy

