# Event Engine Phase 0 - Deployment Checklist

## ✅ Implementation Status

**Phase 0 is fully implemented and ready for deployment.**

### Files Created/Updated:
- ✅ `events/schema.sql` - Complete database schema with RLS policies
- ✅ `events/route.js` - Main events endpoints (GET, POST)
- ✅ `events/[id]/route.js` - Individual event operations (GET, PUT, DELETE)
- ✅ `events/[id]/participants/route.js` - Participant management
- ✅ `events/utils/rbac.js` - RBAC helper utilities
- ✅ `events/__tests__/events.test.js` - Test suite
- ✅ `events/ARCHITECTURE_DECISION.md` - Architecture documentation
- ✅ `vercel.json` - Routes configured
- ✅ `README.md` - API documentation updated

---

## 🚀 Deployment Steps

### 1. Supabase Setup

**Run the schema in your Supabase SQL Editor:**
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of `events/schema.sql`
4. Execute the SQL script

**What this creates:**
- `businesses` table (if doesn't exist)
- `partners` table (if doesn't exist)
- `events` table
- `event_participants` table
- `event_permissions` table
- All indexes and RLS policies

**Verify:**
- Check that all tables were created successfully
- Verify RLS is enabled on events tables
- Test that policies are working

---

### 2. Environment Variables

**Ensure these are set in your Vercel project:**

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** The code has fallback values, but you should set these properly in production.

**To set in Vercel:**
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY`
4. Redeploy if needed

---

### 3. API Endpoints Verification

**All endpoints are configured in `vercel.json`:**

- ✅ `GET /api/events` → `events/route.js`
- ✅ `POST /api/events` → `events/route.js`
- ✅ `GET /api/events/:id` → `events/[id]/route.js`
- ✅ `PUT /api/events/:id` → `events/[id]/route.js`
- ✅ `DELETE /api/events/:id` → `events/[id]/route.js`
- ✅ `GET /api/events/:id/participants` → `events/[id]/participants/route.js`
- ✅ `POST /api/events/:id/participants` → `events/[id]/participants/route.js`
- ✅ `PUT /api/events/:id/participants` → `events/[id]/participants/route.js`
- ✅ `DELETE /api/events/:id/participants` → `events/[id]/participants/route.js`

---

### 4. Testing

**Run the test suite:**
```bash
# Set test environment variables
export TEST_USER_EMAIL=your_test_user@example.com
export TEST_USER_PASSWORD=your_test_password
export API_BASE_URL=http://localhost:3000/api
export SUPABASE_URL=your_supabase_url
export SUPABASE_ANON_KEY=your_supabase_key

# Run tests
node events/__tests__/events.test.js
```

**Manual API Testing:**
1. Start local dev server: `npm run dev`
2. Test endpoints using Postman, curl, or your API client
3. Verify authentication works
4. Test RBAC permissions

---

### 5. Integration Checklist

**Before going to production:**

- [ ] Schema deployed to Supabase
- [ ] Environment variables set in Vercel
- [ ] All endpoints tested locally
- [ ] RBAC permissions verified
- [ ] RLS policies tested
- [ ] Error handling verified
- [ ] CORS configured correctly
- [ ] API documentation reviewed

---

## 📋 Phase 0 Features Summary

**✅ Completed:**
- Core events CRUD operations
- Participant registration and management
- Event filtering (businessId, status, eventType, date range)
- Pagination support
- Role-Based Access Control (RBAC)
- Permission management (owner, editor, viewer, participant)
- Row Level Security (RLS) policies
- Business-level access control
- Authentication integration

**🚧 Next (Phase 1):**
- UI integration in Partner App
- UI integration in Consumer Super App
- Admin moderation queue
- Enhanced search and filtering

---

## 🔍 Verification Commands

**Check if schema is deployed:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'event_participants', 'event_permissions', 'businesses', 'partners');
```

**Check RLS policies:**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('events', 'event_participants', 'event_permissions');
```

**Test API endpoint:**
```bash
curl https://api.localplus.city/api/events
```

---

## 🆘 Troubleshooting

**Schema errors:**
- Ensure you're using the correct Supabase instance
- Check that `auth.users` table exists (Supabase built-in)
- Verify SQL syntax is correct

**API errors:**
- Check environment variables are set
- Verify Supabase URL and keys are correct
- Check Vercel deployment logs
- Ensure CORS is configured

**RBAC issues:**
- Verify `partners` table exists and has data
- Check RLS policies are enabled
- Test with authenticated requests
- Verify user has proper permissions

---

## 📚 Documentation

- **Architecture:** See `events/ARCHITECTURE_DECISION.md`
- **API Docs:** See main `README.md`
- **Schema:** See `events/schema.sql` comments

---

**Status:** ✅ Phase 0 Complete - Ready for Deployment

