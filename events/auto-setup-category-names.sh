#!/bin/bash
# [2025-12-01] - Fully automated category names setup
# Runs all steps automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Automated Category Names Setup"
echo "=================================="
echo ""

# Check for required environment variables
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not set"
    echo "   Please set it: export SUPABASE_SERVICE_ROLE_KEY=your_key"
    exit 1
fi

# Step 1: Export WordPress mapping (optional - will skip if WP CLI not available)
echo "📦 Step 1: Exporting WordPress term mapping..."
SITE_URL="${1:-huahin.discovertoday.com}"
EXPORT_FILE="wp-term-mapping.json"

if command -v wp &> /dev/null; then
    echo "   ✅ WP CLI found, attempting export..."
    if wp term list event_type --url="$SITE_URL" --format=json --fields=term_id,name,slug > "$EXPORT_FILE" 2>&1; then
        echo "   ✅ Export successful: $EXPORT_FILE"
    else
        echo "   ⚠️  Export failed, will try to continue with existing file if present"
    fi
else
    echo "   ⚠️  WP CLI not found locally"
    echo "   If you have wp-term-mapping.json, we'll use it"
fi

if [ ! -f "$EXPORT_FILE" ] || [ ! -s "$EXPORT_FILE" ]; then
    echo "   ⚠️  No export file found. Setup will continue but import will be skipped."
    echo "   You can export manually later and run: node import-wp-term-mapping.js $EXPORT_FILE"
    EXPORT_FILE=""
fi
echo ""

# Step 2: Create table in Supabase
echo "📋 Step 2: Creating mapping table in Supabase..."
echo "   Running SQL via Supabase client..."

# Try to run SQL automatically
node run-sql-in-supabase.js create-term-mapping-table.sql 2>&1 || {
    echo ""
    echo "   ⚠️  Automatic SQL execution not available"
    echo "   📋 Please run this SQL manually in Supabase SQL Editor:"
    echo "      File: create-term-mapping-table.sql"
    echo "      URL: https://supabase.com/dashboard → SQL Editor"
    echo ""
    echo "   Press Enter after you've run the SQL..."
    read -r
}
echo ""

# Step 3: Import mapping (if export file exists)
if [ -n "$EXPORT_FILE" ] && [ -f "$EXPORT_FILE" ] && [ -s "$EXPORT_FILE" ]; then
    echo "📤 Step 3: Importing term mapping..."
    node import-wp-term-mapping.js "$EXPORT_FILE" || {
        echo "   ❌ Import failed"
        exit 1
    }
    echo "   ✅ Import complete!"
else
    echo "📤 Step 3: Skipping import (no export file)"
    echo "   Run this later: node import-wp-term-mapping.js wp-term-mapping.json"
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
    echo "   Deployment will fail without this"
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

