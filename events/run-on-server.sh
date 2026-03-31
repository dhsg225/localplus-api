#!/bin/bash
# [2025-12-01] - Run this on the WordPress server via SSH
# Commands to export WordPress terms

# Change to home directory (writable)
cd ~

# Export WordPress terms for huahin site
wp term list event_type --url=huahin.discovertoday.com --format=json --fields=term_id,name,slug > wp-term-mapping.json

# Check if it worked
if [ -f wp-term-mapping.json ]; then
    echo "✅ Export successful!"
    echo "📄 File: ~/wp-term-mapping.json"
    echo "📊 Term count: $(cat wp-term-mapping.json | jq '. | length' 2>/dev/null || echo 'unknown')"
    echo ""
    echo "📋 Next: Copy this file to your local machine"
    echo "   From local machine, run:"
    echo "   scp dhsg@64.176.84.217:~/wp-term-mapping.json /Users/admin/Dropbox/Development/localplus-api/events/"
else
    echo "❌ Export failed"
fi

