#!/bin/bash
# Export WordPress terms via SSH
# Run this on the WordPress server

# Change to a writable directory
cd ~ || cd /tmp

# Export terms
wp term list event_type --format=json --fields=term_id,name,slug > wp-term-mapping.json 2>&1

if [ $? -eq 0 ] && [ -f wp-term-mapping.json ]; then
    echo "✅ Export successful!"
    echo "📄 File location: $(pwd)/wp-term-mapping.json"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the file content (cat wp-term-mapping.json)"
    echo "2. Save it to: /Users/admin/Dropbox/Development/localplus-api/events/wp-term-mapping.json"
    echo ""
    echo "Or use SCP from your local machine:"
    echo "scp user@server:~/wp-term-mapping.json /Users/admin/Dropbox/Development/localplus-api/events/"
else
    echo "❌ Export failed"
    cat wp-term-mapping.json 2>/dev/null || echo "Check WP CLI and permissions"
fi
