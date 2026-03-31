# Testing Timeout Fix - WordPress Plugin

**Date**: 2025-01-XX  
**Issue**: cURL timeout errors (15 seconds) when loading events  
**Fix**: Increased timeout to 30 seconds + improved error handling

---

## Quick Start: Update & Test

### Step 1: Upload Updated Files
Since you've already updated the files locally, you need to upload them to your WordPress server:

**Files Changed:**
- `includes/class-api-client.php` - Timeout increased to 30s
- `includes/class-shortcode.php` - Better error messages
- `public/assets/js/frontend.js` - Defensive null checks

**Upload Method:**
1. **Via FTP/SFTP**: Upload the 3 files to your WordPress installation:
   ```
   /wp-content/plugins/localplus-event-engine/includes/class-api-client.php
   /wp-content/plugins/localplus-event-engine/includes/class-shortcode.php
   /wp-content/plugins/localplus-event-engine/public/assets/js/frontend.js
   ```

2. **Via WordPress Admin** (if using file manager plugin):
   - Navigate to Plugins > Editor
   - Select "LocalPlus Event Engine"
   - Edit each file and paste the updated code

### Step 2: Clear WordPress Cache
**Important**: Clear plugin cache to ensure fresh API calls:

**Option A: Via WordPress Admin**
1. Go to **LocalPlus Events > Settings**
2. Look for "Clear Cache" button (if available)
3. Or go to **Plugins > Installed Plugins**
4. Deactivate and reactivate "LocalPlus Event Engine"

**Option B: Via Database (if you have access)**
Run this SQL query:
```sql
DELETE FROM wp_options 
WHERE option_name LIKE '_transient_localplus_events_%' 
   OR option_name LIKE '_transient_timeout_localplus_events_%';
```

**Option C: Via WP-CLI** (if available)
```bash
wp transient delete --all --pattern=localplus_events_*
```

### Step 3: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

---

## Testing the Timeout Fix

### Test 1: Basic Shortcode Load
**Goal**: Verify events load without timeout errors

1. Create or edit a test page in WordPress
2. Add this shortcode:
   ```
   [localplus_events limit="10"]
   ```
3. **View the page** (frontend)
4. **Check for errors**:
   - ✅ **Success**: Events display correctly
   - ❌ **Timeout Error**: Yellow error box saying "timed out"
   - ❌ **Other Error**: Check error message

**Expected Result**: Events should load within 30 seconds (or show better error message)

---

### Test 2: Large Date Range
**Goal**: Test with a wide date range that might trigger timeout

1. Add shortcode with date range:
   ```
   [localplus_events start_date="2024-01-01" end_date="2025-12-31" limit="50"]
   ```
2. **View the page**
3. **Monitor browser console** (F12 > Console tab)
4. **Check for**:
   - Network requests timing out
   - JavaScript errors
   - API response time

**Expected Result**: 
- Should load successfully (up to 30 seconds)
- OR show helpful error message: "The request timed out. This may happen when processing many events. Please try again or reduce the date range."

---

### Test 3: Multiple Shortcodes
**Goal**: Test multiple shortcodes on same page

1. Add multiple shortcodes to test page:
   ```
   [localplus_events display_method="lightbox" limit="5"]
   
   [localplus_events display_method="gridview" grid_count="4" limit="8"]
   
   [localplus_events display_method="slide-down" limit="10"]
   ```
2. **View the page**
3. **Check browser console** for JavaScript errors
4. **Test each display method**:
   - Click lightbox cards → modal should open
   - Click gridview cards → modal should open
   - Click slide-down cards → panel should expand

**Expected Result**: All shortcodes load without errors, no JavaScript null reference errors

---

### Test 4: Error Handling
**Goal**: Verify improved error messages

**Simulate timeout** (if possible):
1. Temporarily set API URL to invalid endpoint in settings
2. Or reduce server timeout (if you have server access)
3. Load page with shortcode
4. **Check error message**:
   - Should show: "Unable to connect to the events server. Please check your API URL and try again."
   - Should NOT show: Generic "cURL error 28"

**Expected Result**: Clear, user-friendly error messages

---

### Test 5: API Connection
**Goal**: Verify API is accessible

1. Go to **LocalPlus Events > Settings**
2. Verify:
   - **API URL**: `https://api.localplus.city` (or your API endpoint)
   - **API Key**: Valid Supabase API key
3. Click "Save Settings"
4. Go to **LocalPlus Events > All Events** (admin)
5. **Check if events load** in admin interface

**Expected Result**: Events should load in admin interface

---

## Debugging Checklist

If events still don't load:

### ✅ Check Plugin Files
- [ ] Files uploaded correctly
- [ ] File permissions are correct (644 for files, 755 for directories)
- [ ] No syntax errors in PHP files

### ✅ Check WordPress
- [ ] Plugin is activated
- [ ] No other plugins conflicting
- [ ] WordPress version compatible (5.8+)
- [ ] PHP version compatible (7.4+)

### ✅ Check API Settings
- [ ] API URL is correct
- [ ] API Key is valid
- [ ] API endpoint is accessible (test in browser: `https://api.localplus.city/api/events`)

### ✅ Check Server
- [ ] PHP `allow_url_fopen` enabled
- [ ] cURL extension enabled
- [ ] No firewall blocking outbound requests
- [ ] Server can reach API endpoint

### ✅ Check Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for JavaScript errors
- [ ] Check Network tab for failed requests
- [ ] Look for timeout errors (status 504 or timeout messages)

---

## Expected Behavior After Fix

### Before Fix:
- ❌ Timeout after 15 seconds
- ❌ Generic error: "cURL error 28: Operation timed out"
- ❌ No helpful guidance

### After Fix:
- ✅ Timeout increased to 30 seconds
- ✅ Better error messages: "The request timed out. This may happen when processing many events. Please try again or reduce the date range."
- ✅ More time for API to process recurring events
- ✅ Defensive JavaScript prevents null reference errors

---

## Quick Test Commands

### Test API Endpoint Directly (from server)
```bash
# Test if API is reachable
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://api.localplus.city/api/events?limit=10" \
     --max-time 30
```

### Check WordPress Transients (via WP-CLI)
```bash
# List all LocalPlus transients
wp transient list | grep localplus_events

# Clear all LocalPlus transients
wp transient delete --all --pattern=localplus_events_*
```

---

## Success Criteria

✅ **Plugin loads without errors**  
✅ **Events display correctly**  
✅ **No timeout errors (or helpful timeout message if it occurs)**  
✅ **Multiple shortcodes work on same page**  
✅ **JavaScript console shows no errors**  
✅ **Error messages are user-friendly**

---

## Next Steps if Issues Persist

1. **Check API server logs** - Is the API endpoint responding?
2. **Reduce date range** - Try smaller date ranges in shortcode
3. **Reduce limit** - Try `limit="5"` instead of `limit="50"`
4. **Check server resources** - Is the server overloaded?
5. **Contact API team** - If API is consistently slow, may need API optimization

---

## Notes

- **No plugin reactivation needed** - PHP files are loaded dynamically
- **Cache clearing is important** - Old cached errors might persist
- **Browser cache matters** - JavaScript files are cached by browser
- **30 seconds is reasonable** - For processing recurring events with many occurrences

