# Testing Superuser Events Endpoint

## ✅ Prerequisites Completed
- ✅ SQL migrations run (superuser-indexes.sql, event-audit-logs-schema.sql)
- ✅ RLS policies in place (super admins can view/update/delete all events)

## 🚀 Local Testing Steps

### 1. Start API Server

```bash
cd /Users/admin/Dropbox/Development/localplus-api
npm run dev
```

The server will start on `http://localhost:3000` (or the port Vercel assigns)

### 2. Test via Command Line

```bash
# Get your super admin token from browser localStorage after logging in
# Then run:
cd /Users/admin/Dropbox/Development/localplus-api
TEST_TOKEN=your_token_here node events/test-superuser-endpoint.js
```

### 3. Test via Partner App

1. **Start Partner App** (if not already running):
   ```bash
   cd /Users/admin/Dropbox/Development/localplus-partner
   npm run dev
   ```

2. **Configure API URL** (if needed):
   - Create `.env.local` file in `localplus-partner/`:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   ```
   - Or the app will use production URL: `https://api.localplus.city`

3. **Login as Super Admin**:
   - Visit `http://localhost:9003`
   - Login with Shannon's credentials (super admin)

4. **Visit Events Page**:
   - Navigate to `http://localhost:9003/events`
   - Should automatically show `SuperuserEventsDashboard`
   - You should see all events (Sandy Beach's 614+ events)

### 4. Test Features

#### Filters
- ✅ Status filter (All, Published, Draft, Scraped Draft, Cancelled)
- ✅ Category filter
- ✅ Sort By (Start Time, Created Date, Title)
- ✅ Sort Order (Ascending, Descending)
- ✅ Toggle: Only Upcoming
- ✅ Toggle: Only Scraped

#### Pagination
- ✅ Previous/Next buttons
- ✅ Shows "Showing X to Y of Z events"
- ✅ Disabled when at start/end

#### Table View
- ✅ Title column
- ✅ Date & Time column
- ✅ Category column (with badge)
- ✅ Status column (with color-coded badge)
- ✅ Location column
- ✅ Created date column
- ✅ Actions column (View, Edit buttons)

## 🔍 Debugging

### Check Browser Console
- Look for `[SuperuserEventsDashboard]` logs
- Should see API response with event count
- Check for any errors

### Check API Server Logs
- Look for `[Superuser API]` logs
- Should see super admin check result
- Should see query results

### Common Issues

1. **"Super admin access required" error**
   - Verify you're logged in as super admin
   - Check `user_roles` table has `super_admin` role for your user

2. **Empty events array**
   - Check API server logs for errors
   - Verify RLS policies are correct
   - Check if events exist: Run `check-events-count.sql` in Supabase

3. **CORS errors**
   - API should handle CORS automatically
   - Check API server is running

4. **API not found (404)**
   - Verify `vercel.json` has the route configured
   - Check `events/all/route.js` exists
   - Restart API server

## 📊 Expected Results

### Super Admin View
- Should see ALL events (not filtered by business)
- Should see events with any status (published, draft, etc.)
- Should see Sandy Beach's 614+ events
- Should see pagination working
- Should see filters working

### Regular Partner View
- Should only see events for their business
- Should only see published events (or their own drafts)
- Should NOT see other partners' events

## ✅ Success Criteria

- [ ] Super admin can see all events
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Sorting works
- [ ] Status badges show correct colors
- [ ] Table displays all columns correctly
- [ ] No console errors
- [ ] API returns correct data structure

