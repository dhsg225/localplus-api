#!/bin/bash
# [2025-12-01] - Automated setup for category names mapping
# This script automates all steps: export, create table, import, deploy

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Automated Category Names Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Export WordPress term mapping
echo -e "${YELLOW}Step 1: Exporting WordPress term mapping...${NC}"
echo ""

SITE_URL="${1:-huahin.discovertoday.com}"
EXPORT_FILE="wp-term-mapping.json"

# Check if WP CLI is available
if command -v wp &> /dev/null; then
    echo "✅ WP CLI found locally, exporting..."
    wp term list event_type \
      --url="$SITE_URL" \
      --format=json \
      --fields=term_id,name,slug \
      > "$EXPORT_FILE" 2>&1 || {
        echo -e "${RED}❌ WP CLI export failed. Trying alternative method...${NC}"
        # Try without --url if it's a local site
        wp term list event_type \
          --format=json \
          --fields=term_id,name,slug \
          > "$EXPORT_FILE" 2>&1 || {
            echo -e "${RED}❌ WP CLI export failed. Please run manually:${NC}"
            echo "   ./export-wp-term-mapping.sh $SITE_URL"
            exit 1
        }
    }
else
    echo -e "${YELLOW}⚠️  WP CLI not found locally.${NC}"
    echo "   Please run this manually on your WordPress server:"
    echo "   ./export-wp-term-mapping.sh $SITE_URL"
    echo ""
    echo "   Or if you already have wp-term-mapping.json, press Enter to continue..."
    read -r
fi

if [ ! -f "$EXPORT_FILE" ] || [ ! -s "$EXPORT_FILE" ]; then
    echo -e "${RED}❌ Export file not found or empty: $EXPORT_FILE${NC}"
    echo "   Please export manually first."
    exit 1
fi

echo -e "${GREEN}✅ Export file created: $EXPORT_FILE${NC}"
echo ""

# Step 2: Create mapping table in Supabase
echo -e "${YELLOW}Step 2: Creating mapping table in Supabase...${NC}"
echo ""
echo "   Please run this SQL in Supabase SQL Editor:"
echo "   File: create-term-mapping-table.sql"
echo ""
echo "   Or press Enter to continue (assuming table already exists)..."
read -r

# Step 3: Import term mapping
echo -e "${YELLOW}Step 3: Importing term mapping into Supabase...${NC}"
echo ""

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not set.${NC}"
    echo "   Please set it:"
    echo "   export SUPABASE_SERVICE_ROLE_KEY=your_key_here"
    echo ""
    echo "   Or enter it now (will not be displayed):"
    read -s SUPABASE_SERVICE_ROLE_KEY
    export SUPABASE_SERVICE_ROLE_KEY
    echo ""
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY is required${NC}"
    exit 1
fi

echo "📤 Importing mappings..."
node import-wp-term-mapping.js "$EXPORT_FILE" || {
    echo -e "${RED}❌ Import failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ Import complete!${NC}"
echo ""

# Step 4: Deploy API function
echo -e "${YELLOW}Step 4: Deploying updated API function...${NC}"
echo ""

API_FUNCTION_DIR="../google-cloud-functions/events-all"

if [ ! -d "$API_FUNCTION_DIR" ]; then
    echo -e "${RED}❌ API function directory not found: $API_FUNCTION_DIR${NC}"
    exit 1
fi

cd "$API_FUNCTION_DIR"

if [ ! -f "deploy.sh" ]; then
    echo -e "${RED}❌ deploy.sh not found in $API_FUNCTION_DIR${NC}"
    exit 1
fi

echo "🚀 Deploying events-all function..."
chmod +x deploy.sh
./deploy.sh || {
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ All steps complete!${NC}"
echo ""
echo "📋 Summary:"
echo "   ✅ WordPress term mapping exported"
echo "   ✅ Mapping table created (if SQL was run)"
echo "   ✅ Term mappings imported"
echo "   ✅ API function deployed"
echo ""
echo "🧪 Next: Refresh the Superuser Events Dashboard to see category names!"

