#!/bin/bash
# [2025-12-01] - Complete automated setup for category names
# This script does everything possible automatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Category Names Setup - Automated"
echo "===================================="
echo ""

# Check prerequisites
MISSING_VARS=()

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$SUPABASE_JWT_SECRET" ]; then
    MISSING_VARS+=("SUPABASE_JWT_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Missing environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📋 To get these:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project → Settings → API"
    echo "   3. Copy 'service_role' key for SUPABASE_SERVICE_ROLE_KEY"
    echo "   4. Scroll to 'JWT Settings' for SUPABASE_JWT_SECRET"
    echo ""
    echo "   Then run:"
    echo "   export SUPABASE_SERVICE_ROLE_KEY=your_key"
    echo "   export SUPABASE_JWT_SECRET=your_jwt_secret"
    echo "   ./setup-all.sh"
    echo ""
    exit 1
fi

echo "✅ All environment variables set"
echo ""

# Step 1: Export (optional)
echo "📦 Step 1/4: Export WordPress mapping..."
SITE_URL="${1:-huahin.discovertoday.com}"
EXPORT_FILE="wp-term-mapping.json"

if command -v wp &> /dev/null; then
    echo "   Attempting export via WP CLI..."
    if wp term list event_type --url="$SITE_URL" --format=json --fields=term_id,name,slug > "$EXPORT_FILE" 2>&1; then
        echo "   ✅ Exported to $EXPORT_FILE"
        HAS_EXPORT=true
    else
        echo "   ⚠️  Export failed (will continue)"
        HAS_EXPORT=false
    fi
else
    echo "   ⚠️  WP CLI not found (skipping export)"
    HAS_EXPORT=false
    if [ -f "$EXPORT_FILE" ]; then
        echo "   ✅ Found existing $EXPORT_FILE (will use it)"
        HAS_EXPORT=true
    fi
fi
echo ""

# Step 2: Create table (manual SQL required)
echo "📋 Step 2/4: Create mapping table..."
echo "   ⚠️  SQL execution requires manual step in Supabase Dashboard"
echo "   📄 SQL file: create-term-mapping-table.sql"
echo "   🔗 URL: https://supabase.com/dashboard → SQL Editor"
echo ""
echo "   Quick copy command:"
echo "   cat create-term-mapping-table.sql | pbcopy"
echo ""
echo "   Press Enter after running the SQL in Supabase..."
read -r
echo ""

# Step 3: Import
if [ "$HAS_EXPORT" = true ] && [ -f "$EXPORT_FILE" ] && [ -s "$EXPORT_FILE" ]; then
    echo "📤 Step 3/4: Importing mappings..."
    node import-wp-term-mapping.js "$EXPORT_FILE" && {
        echo "   ✅ Import complete!"
    } || {
        echo "   ❌ Import failed"
        exit 1
    }
else
    echo "📤 Step 3/4: Skipping import (no export file)"
    echo "   Run later: node import-wp-term-mapping.js wp-term-mapping.json"
fi
echo ""

# Step 4: Deploy
echo "🚀 Step 4/4: Deploying API function..."
cd "../google-cloud-functions/events-all"

if [ ! -f "deploy.sh" ]; then
    echo "   ❌ deploy.sh not found"
    exit 1
fi

chmod +x deploy.sh
./deploy.sh && {
    echo ""
    echo "✅ All steps complete!"
    echo ""
    echo "🧪 Next: Refresh the Superuser Events Dashboard to see category names!"
} || {
    echo "   ❌ Deployment failed"
    exit 1
}

