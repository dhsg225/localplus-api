# Installation Instructions - Timeout Fix Update

**Version**: 1.2.9.0 → 1.2.9.1  
**Date**: 2025-01-XX  
**Fix**: Increased API timeout from 15s to 30s + improved error handling

---

## Step 1: Update Version Number

**Before uploading**, update the version number in the plugin:

1. Open `localplus-event-engine.php` in a text editor
2. Find line 6: `Version: 1.2.9.0`
3. Change to: `Version: 1.2.9.1`
4. Find line 24: `define('LOCALPLUS_EVENTS_VERSION', '1.2.9.0');`
5. Change to: `define('LOCALPLUS_EVENTS_VERSION', '1.2.9.1');`

**Quick Find & Replace:**
- Find: `1.2.9.0`
- Replace: `1.2.9.1`
- Replace in file: `localplus-event-engine.php` (2 occurrences)

---

## Step 2: Upload Plugin Files

### Option A: Upload via WordPress Admin (Recommended)

1. **Extract the zip file** on your computer
2. **Rename the folder** from `wordpress-plugin` to `localplus-event-engine` (if needed)
3. **Upload via FTP/SFTP** to:
   ```
   /wp-content/plugins/localplus-event-engine/
   ```
4. **Replace existing files** when prompted

### Option B: Upload via WordPress Admin Plugin Installer

1. Go to **WordPress Admin > Plugins > Add New**
2. Click **Upload Plugin**
3. Select `wordpress-plugin-timeout-fix.zip`
4. Click **Install Now**
5. **Important**: Choose **"Replace current version"** when prompted
6. Click **Activate Plugin**

---

## Step 3: Clear Cache

### Clear Plugin Cache:

**Method 1: Via WordPress Admin**
1. Go to **LocalPlus Events > Settings**
2. Look for "Clear Cache" button and click it
3. OR go to **Plugins > Installed Plugins**
4. **Deactivate** "LocalPlus Event Engine"
5. **Reactivate** "LocalPlus Event Engine"

**Method 2: Via Database** (if you have access)
```sql
DELETE FROM wp_options 
WHERE option_name LIKE '_transient_localplus_events_%' 
   OR option_name LIKE '_transient_timeout_localplus_events_%';
```

**Method 3: Via WP-CLI** (if available)
```bash
wp transient delete --all --pattern=localplus_events_*
```

### Clear Browser Cache:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## Step 4: Verify Installation

1. Go to **WordPress Admin > Plugins > Installed Plugins**
2. Find "LocalPlus Event Engine"
3. **Check version number** shows: `1.2.9.1`
4. Go to **LocalPlus Events > Settings**
5. Verify API settings are still configured
6. Create/edit a test page with shortcode: `[localplus_events limit="10"]`
7. **View the page** - events should load without timeout errors

---

## What Changed?

### Files Modified:
- ✅ `includes/class-api-client.php` - Timeout increased to 30s
- ✅ `includes/class-shortcode.php` - Better error messages
- ✅ `public/assets/js/frontend.js` - Defensive null checks

### Improvements:
- ⏱️ API timeout increased: 15 seconds → 30 seconds
- 💬 Better error messages for timeout scenarios
- 🛡️ Defensive JavaScript to prevent null reference errors
- 🔒 Added SSL verification flag

---

## Troubleshooting

### Version Not Updating?
- Make sure you updated BOTH version numbers in `localplus-event-engine.php`
- Clear browser cache
- Check WordPress plugin list shows new version

### Still Getting Timeout Errors?
- Verify files were uploaded correctly
- Clear plugin cache (see Step 3)
- Check API URL and key in settings
- Test API endpoint directly: `https://api.localplus.city/api/events?limit=10`

### Events Not Loading?
- Check browser console (F12) for errors
- Verify API settings in **LocalPlus Events > Settings**
- Test API endpoint is accessible
- Check server PHP version (requires 7.4+)

---

## Rollback Instructions

If you need to rollback to previous version:

1. **Deactivate** the plugin
2. **Delete** the plugin folder: `/wp-content/plugins/localplus-event-engine/`
3. **Upload** previous version zip file
4. **Activate** plugin
5. **Clear cache** (see Step 3)

---

## Support

For issues or questions:
- Check `TESTING_TIMEOUT_FIX.md` for detailed testing guide
- Review error messages in browser console (F12)
- Check WordPress debug log if enabled

---

**Note**: This update fixes timeout issues when loading events. The plugin will now wait up to 30 seconds for API responses, giving more time for processing recurring events.

