#!/bin/bash
# [2025-12-01] - Fully automated category names setup
# Runs all steps automatically where possible

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Automated Category Names Setup"
echo "=================================="
echo ""

# Step 1: Try to export WordPress mapping
echo "📦 Step 1: Exporting WordPress term mapping..."
SITE_URL="${1:-huahin.discovertoday.com}"
EXPORT_FILE="wp-term-mapping.json"

if command -v wp &> /dev/null; then
    echo "   ✅ WP CLI found, attempting export..."
    wp term list event_type --url="$SITE_URL" --format=json --fields=term_id,name,slug > "$EXPORT_FILE" 2>&1 || {
        echo "   ⚠️  Export via WP CLI failed, checking for existing file..."
    }
fi

if [ ! -f "$EXPORT_FILE" ] || [ ! -s "$EXPORT_FILE" ]; then
    echo "   ⚠️  Export file not found. You may need to:"
    echo "      1. SSH to WordPress server"
    echo "      2. Run: ./export-wp-term-mapping.sh $SITE_URL"
    echo "      3. Copy wp-term-mapping.json to this directory"
    echo ""
    echo "   For now, we'll continue with other steps..."
else
    echo "   ✅ Export file found: $EXPORT_FILE"
fi
echo ""

# Step 2: Create table in Supabase (requires manual SQL execution)
echo "📋 Step 2: Creating mapping table in Supabase..."
echo "   ⚠️  This requires manual SQL execution in Supabase Dashboard"
echo "   📄 SQL file: create-term-mapping-table.sql"
echo "   🔗 Go to: https://supabase.com/dashboard → SQL Editor"
echo "   📋 Copy and run the contents of create-term-mapping-table.sql"
echo ""
echo "   Press Enter after you've run the SQL..."
read -r
echo ""

# Step 3: Import mapping
echo "📤 Step 3: Importing term mapping..."
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "   ⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
    echo "   Please set it: export SUPABASE_SERVICE_ROLE_KEY=your_key"
    exit 1
fi

if [ -f "$EXPORT_FILE" ] && [ -s "$EXPORT_FILE" ]; then
    node import-wp-term-mapping.js "$EXPORT_FILE" || {
        echo "   ❌ Import failed"
        exit 1
    }
    echo "   ✅ Import complete!"
else
    echo "   ⚠️  Skipping import (no export file)"
fi
echo ""

# Step 4: Deploy API function
echo "🚀 Step 4: Deploying API function..."
cd "../google-cloud-functions/events-all"

if [ ! -f "deploy.sh" ]; then
    echo "   ❌ deploy.sh not found"
    exit 1
fi

# Check for required env vars
if [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo "   ⚠️  SUPABASE_JWT_SECRET not set"
    echo "   Please set it: export SUPABASE_JWT_SECRET=your_jwt_secret"
    exit 1
fi

chmod +x deploy.sh
./deploy.sh || {
    echo "   ❌ Deployment failed"
    exit 1
}

echo ""
echo "✅ Setup complete!"
echo ""
echo "🧪 Next: Refresh the Superuser Events Dashboard to see category names!"

