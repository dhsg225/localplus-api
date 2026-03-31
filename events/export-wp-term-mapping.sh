#!/bin/bash
# [2025-12-01] - Export WordPress term_id -> name mapping for EventON categories
# Usage: ./export-wp-term-mapping.sh [site_url]

SITE_URL="${1:-huahin.discovertoday.com}"

echo "📦 Exporting WordPress term_id -> name mapping for: $SITE_URL"
echo ""

# Export EventON event_type taxonomy terms with term_id and name
wp term list event_type \
  --url="$SITE_URL" \
  --format=json \
  --fields=term_id,name,slug \
  > wp-term-mapping.json

if [ $? -eq 0 ]; then
  echo "✅ Exported to wp-term-mapping.json"
  echo ""
  echo "📊 Sample output:"
  head -20 wp-term-mapping.json
else
  echo "❌ Export failed"
  exit 1
fi

