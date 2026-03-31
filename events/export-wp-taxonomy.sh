#!/bin/bash
# [2025-11-30] - Export WordPress event categories using WP CLI
# Usage: ./export-wp-taxonomy.sh [taxonomy_name]
# Default taxonomy: event_category (common for event plugins like EventON)

TAXONOMY="${1:-event_category}"
OUTPUT_FILE="wp-taxonomy-export.json"

echo "📦 Exporting WordPress taxonomy: $TAXONOMY"
echo ""

# Check if WP CLI is available
if ! command -v wp &> /dev/null; then
    echo "❌ WP CLI not found. Please install it first:"
    echo "   curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar"
    echo "   chmod +x wp-cli.phar"
    echo "   sudo mv wp-cli.phar /usr/local/bin/wp"
    exit 1
fi

# Export taxonomy terms with full details
echo "🔍 Fetching taxonomy terms..."
wp term list $TAXONOMY \
    --format=json \
    --fields=term_id,term_taxonomy_id,name,slug,description,parent,count \
    > $OUTPUT_FILE

if [ $? -eq 0 ]; then
    TERM_COUNT=$(cat $OUTPUT_FILE | jq '. | length' 2>/dev/null || echo "0")
    echo "✅ Exported $TERM_COUNT terms to $OUTPUT_FILE"
    echo ""
    echo "📋 Sample output:"
    cat $OUTPUT_FILE | jq '.[0:3]' 2>/dev/null || cat $OUTPUT_FILE | head -20
    echo ""
    echo "💡 Next steps:"
    echo "   1. Review the exported data: cat $OUTPUT_FILE | jq"
    echo "   2. Run the import script: node import-wp-taxonomy.js $OUTPUT_FILE"
else
    echo "❌ Failed to export taxonomy. Check:"
    echo "   - Are you in the WordPress root directory?"
    echo "   - Does the taxonomy '$TAXONOMY' exist?"
    echo "   - Try: wp term list --help"
    exit 1
fi

