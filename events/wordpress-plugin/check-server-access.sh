#!/bin/bash
# Check WordPress Server Access
# Tests connection to WordPress server

echo "=== WordPress Server Access Check ==="
echo ""

# Check if config exists
CONFIG_FILE="$(dirname "$0")/deploy-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "Please create it from deploy-config.json.example"
    exit 1
fi

# Load config
source <(cat "$CONFIG_FILE" | jq -r 'to_entries[] | "export \(.key)=\(.value)"')

echo "Configuration:"
echo "  Method: $DEPLOY_METHOD"
echo "  Server: $WORDPRESS_SERVER"
echo "  Path: $WORDPRESS_PATH"
echo ""

# Test SSH connection
if [ "$DEPLOY_METHOD" = "ssh" ]; then
    echo "Testing SSH connection..."
    if ssh -i "${SSH_KEY}" -o ConnectTimeout=5 "$WORDPRESS_SERVER" "echo 'SSH connection successful'" 2>/dev/null; then
        echo "✅ SSH connection works!"
        
        echo ""
        echo "Checking WordPress installation..."
        if ssh -i "${SSH_KEY}" "$WORDPRESS_SERVER" "test -d $WORDPRESS_PATH/wp-content/plugins" 2>/dev/null; then
            echo "✅ WordPress plugins directory exists"
            
            echo ""
            echo "Checking plugin directory..."
            PLUGIN_PATH="$WORDPRESS_PATH/wp-content/plugins/${PLUGIN_NAME}"
            if ssh -i "${SSH_KEY}" "$WORDPRESS_SERVER" "test -d $PLUGIN_PATH" 2>/dev/null; then
                echo "✅ Plugin directory exists: $PLUGIN_PATH"
                
                echo ""
                echo "Current plugin version on server:"
                ssh -i "${SSH_KEY}" "$WORDPRESS_SERVER" "grep 'Version:' $PLUGIN_PATH/localplus-event-engine.php 2>/dev/null | head -1" || echo "Could not read version"
            else
                echo "⚠️  Plugin directory does not exist (will be created on first deploy)"
            fi
        else
            echo "❌ WordPress plugins directory not found at: $WORDPRESS_PATH/wp-content/plugins"
            echo "Please check WORDPRESS_PATH in config"
        fi
    else
        echo "❌ SSH connection failed"
        echo "Please check:"
        echo "  - SSH key: $SSH_KEY"
        echo "  - Server: $WORDPRESS_SERVER"
        echo "  - Network connectivity"
    fi
else
    echo "⚠️  Deployment method '$DEPLOY_METHOD' not yet tested"
fi

echo ""
echo "=== Access Check Complete ==="

