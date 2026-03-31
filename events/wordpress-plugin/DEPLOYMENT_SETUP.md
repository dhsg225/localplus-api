# WordPress Plugin Deployment Setup

This guide helps you set up direct deployment to your WordPress server.

## Quick Setup

### Step 1: Create Deployment Config

Copy the example config and edit with your server details:

```bash
cd /Users/admin/Dropbox/Development/localplus-api/events/wordpress-plugin
cp deploy-config.json.example deploy-config.json
```

Edit `deploy-config.json` with your WordPress server details.

### Step 2: Test Connection

Test SSH access (if using SSH method):

```bash
ssh -i ~/.ssh/id_ed25519 user@your-server.com "echo 'Connection successful'"
```

### Step 3: Deploy

Run the deployment script:

```bash
./deploy.sh
```

---

## Configuration Options

### Method 1: SSH Deployment (Recommended)

**Requirements:**
- SSH access to WordPress server
- SSH key configured
- Server path to WordPress installation

**Config:**
```json
{
  "DEPLOY_METHOD": "ssh",
  "WORDPRESS_SERVER": "user@your-server.com",
  "WORDPRESS_PATH": "/var/www/html",
  "PLUGIN_NAME": "localplus-event-engine",
  "SSH_KEY": "~/.ssh/id_ed25519"
}
```

**How it works:**
- Uses `rsync` to sync files
- Automatically sets correct permissions
- Excludes unnecessary files (.git, .DS_Store, etc.)

### Method 2: FTP Deployment

**Requirements:**
- FTP/SFTP credentials
- FTP access to WordPress plugins directory

**Config:**
```json
{
  "DEPLOY_METHOD": "ftp",
  "FTP_HOST": "ftp.your-server.com",
  "FTP_USER": "ftp_username",
  "FTP_PASS": "ftp_password",
  "FTP_PATH": "/wp-content/plugins"
}
```

### Method 3: WordPress REST API

**Requirements:**
- WordPress Application Password
- WordPress REST API enabled

**Config:**
```json
{
  "DEPLOY_METHOD": "wp-api",
  "WP_URL": "https://your-wordpress-site.com",
  "WP_USERNAME": "admin",
  "WP_PASSWORD": "application_password"
}
```

---

## Finding Your WordPress Server Details

### WordPress Site URL
Check which WordPress site hosts the events plugin:
- Look in WordPress Admin > Plugins
- Check the site URL in browser address bar
- Common: `https://thailand.localplus.city` or `https://huahin.localplus.city`

### Server Path
Common WordPress installation paths:
- `/var/www/html` (Ubuntu/Debian)
- `/home/username/public_html` (cPanel)
- `/var/www/wordpress` (Custom)
- `/srv/www/wordpress` (Some setups)

**Find it:**
```bash
# On WordPress server
wp core path
# Or
pwd  # If you're in WordPress root
```

### SSH Access
If you have SSH access, test it:
```bash
ssh user@your-server.com
```

If you need to set up SSH key:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server.com
```

---

## Deployment Process

1. **Make changes** to plugin files locally
2. **Run deploy script**: `./deploy.sh`
3. **Activate plugin** in WordPress Admin (if needed)
4. **Clear cache** (deactivate/reactivate plugin)

---

## Troubleshooting

### SSH Connection Failed
- Check SSH key permissions: `chmod 600 ~/.ssh/id_ed25519`
- Verify server address and username
- Test connection manually: `ssh -i ~/.ssh/id_ed25519 user@server`

### Permission Denied
- Check file permissions on server
- Ensure www-data (or web server user) owns files
- Script should set permissions automatically

### Files Not Updating
- Clear WordPress cache
- Deactivate and reactivate plugin
- Check file timestamps on server

### Wrong Path
- Verify WordPress installation path
- Check `wp-config.php` location
- Plugin should be in `wp-content/plugins/`

---

## Security Notes

- **Never commit** `deploy-config.json` to git (it's in .gitignore)
- Use SSH keys instead of passwords when possible
- Use Application Passwords for WordPress API (not regular passwords)
- Keep SSH keys secure (chmod 600)

---

## Next Steps

Once configured, you can:
- Deploy changes instantly with `./deploy.sh`
- Test changes on live server quickly
- Iterate faster on plugin development

