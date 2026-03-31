#!/bin/bash
# WordPress Plugin Deployment Script
# Uploads plugin files directly to WordPress server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration file
CONFIG_FILE="$(dirname "$0")/deploy-config.json"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    if command -v jq >/dev/null 2>&1; then
        eval $(cat "$CONFIG_FILE" | jq -r 'to_entries[] | "export \(.key)=\(.value)"')
    else
        # Fallback: simple JSON parsing (requires jq or manual export)
        echo "Warning: jq not found. Please install jq or set environment variables manually."
        export DEPLOY_METHOD=$(grep -o '"DEPLOY_METHOD": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
        export WORDPRESS_SERVER=$(grep -o '"WORDPRESS_SERVER": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
        export WORDPRESS_PATH=$(grep -o '"WORDPRESS_PATH": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
        export PLUGIN_NAME=$(grep -o '"PLUGIN_NAME": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
        export SSH_KEY=$(grep -o '"SSH_KEY": "[^"]*' "$CONFIG_FILE" | cut -d'"' -f4)
    fi
else
    echo -e "${YELLOW}Configuration file not found: $CONFIG_FILE${NC}"
    echo "Creating template..."
    cat > "$CONFIG_FILE" << 'EOF'
{
  "DEPLOY_METHOD": "ssh",
  "WORDPRESS_SERVER": "user@server.example.com",
  "WORDPRESS_PATH": "/var/www/html",
  "PLUGIN_NAME": "localplus-event-engine",
  "SSH_KEY": "~/.ssh/id_ed25519"
}
EOF
    echo -e "${GREEN}Template created. Please edit $CONFIG_FILE with your server details.${NC}"
    exit 1
fi

# Plugin directory
PLUGIN_DIR="$(dirname "$0")"
PLUGIN_NAME="${PLUGIN_NAME:-localplus-event-engine}"
WP_PLUGIN_PATH="${WORDPRESS_PATH}/wp-content/plugins/${PLUGIN_NAME}"

echo -e "${GREEN}=== WordPress Plugin Deployment ===${NC}"
echo "Plugin: $PLUGIN_NAME"
echo "Method: $DEPLOY_METHOD"
echo "Server: $WORDPRESS_SERVER"
echo "Path: $WP_PLUGIN_PATH"
echo ""

# Function to deploy via SSH
deploy_ssh() {
    echo -e "${YELLOW}Deploying via SSH...${NC}"
    
    # Create remote directory if it doesn't exist
    ssh -4 -i "${SSH_KEY}" "$WORDPRESS_SERVER" "mkdir -p $WP_PLUGIN_PATH"
    
    # Check current owner
    REMOTE_OWNER=$(ssh -4 -i "${SSH_KEY}" "$WORDPRESS_SERVER" "stat -c '%U:%G' $WP_PLUGIN_PATH 2>/dev/null || stat -f '%Su:%Sg' $WP_PLUGIN_PATH 2>/dev/null || echo 'unknown'")
    echo "Current plugin owner: $REMOTE_OWNER"
    
    # Sync files to temp location first (to avoid permission issues)
    TEMP_PATH="/tmp/localplus-event-engine-$$"
    echo "Uploading to temp location: $TEMP_PATH"
    
    # Sync files (exclude .git, .DS_Store, deploy files, etc.)
    rsync -avz --no-times \
        --exclude='.git' \
        --exclude='.DS_Store' \
        --exclude='*.zip' \
        --exclude='deploy-config.json' \
        --exclude='deploy.sh' \
        --exclude='check-server-access.sh' \
        --exclude='deploy-config.json.example' \
        --exclude='DEPLOYMENT_SETUP.md' \
        -e "ssh -4 -i ${SSH_KEY}" \
        "$PLUGIN_DIR/" "$WORDPRESS_SERVER:$TEMP_PATH/"
    
    echo -e "${GREEN}✓ Files uploaded to temp location${NC}"
    
    # Move files to final location with sudo (if needed)
    echo "Moving files to final location..."
    ssh -4 -i "${SSH_KEY}" "$WORDPRESS_SERVER" "
        if [ -d '$WP_PLUGIN_PATH' ]; then
            # Backup existing files
            BACKUP_DIR='/tmp/localplus-event-engine-backup-$$'
            mkdir -p \$BACKUP_DIR
            cp -r $WP_PLUGIN_PATH/* \$BACKUP_DIR/ 2>/dev/null || true
            echo 'Backup created at: '\$BACKUP_DIR
        fi
        
        # Copy files from temp to final location
        sudo cp -r $TEMP_PATH/* $WP_PLUGIN_PATH/ 2>/dev/null || cp -r $TEMP_PATH/* $WP_PLUGIN_PATH/
        
        # Set permissions
        sudo chmod -R 755 $WP_PLUGIN_PATH 2>/dev/null || chmod -R 755 $WP_PLUGIN_PATH
        
        # Set ownership (try to match existing owner or use www-data)
        if [ '$REMOTE_OWNER' != 'unknown' ]; then
            OWNER_USER=\$(echo '$REMOTE_OWNER' | cut -d: -f1)
            OWNER_GROUP=\$(echo '$REMOTE_OWNER' | cut -d: -f2)
            sudo chown -R \$OWNER_USER:\$OWNER_GROUP $WP_PLUGIN_PATH 2>/dev/null || true
        else
            sudo chown -R www-data:www-data $WP_PLUGIN_PATH 2>/dev/null || sudo chown -R u1_staging:u1_staging $WP_PLUGIN_PATH 2>/dev/null || true
        fi
        
        # Cleanup temp directory
        rm -rf $TEMP_PATH
    "
    
    echo -e "${GREEN}✓ Files deployed successfully${NC}"
    echo -e "${GREEN}✓ Permissions set${NC}"
}

# Function to deploy via FTP
deploy_ftp() {
    echo -e "${YELLOW}Deploying via FTP...${NC}"
    echo -e "${RED}FTP deployment not yet implemented${NC}"
    echo "Please use SSH method or upload manually"
    exit 1
}

# Function to deploy via WordPress REST API
deploy_wp_api() {
    echo -e "${YELLOW}Deploying via WordPress REST API...${NC}"
    echo -e "${RED}WordPress REST API file upload not yet implemented${NC}"
    echo "Please use SSH method or upload manually"
    exit 1
}

# Main deployment
case "$DEPLOY_METHOD" in
    ssh)
        deploy_ssh
        ;;
    ftp)
        deploy_ftp
        ;;
    wp-api)
        deploy_wp_api
        ;;
    *)
        echo -e "${RED}Unknown deployment method: $DEPLOY_METHOD${NC}"
        echo "Supported methods: ssh, ftp, wp-api"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Next steps:"
echo "1. Go to WordPress Admin > Plugins"
echo "2. Deactivate and reactivate 'LocalPlus Event Engine'"
echo "3. Clear cache if needed"

