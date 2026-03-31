# Superuser Events View - Implementation Guide

## ✅ Completed

### 1. Database Infrastructure
- ✅ **Performance Indexes** (`superuser-indexes.sql`)
  - Indexes on `start_time`, `created_at`, `business_id`, `status`, `event_type`
  - Composite indexes for common query patterns
  - Run in Supabase SQL Editor

- ✅ **Audit Logging** (`event-audit-logs-schema.sql`)
  - `event_audit_logs` table tracks all superuser actions
  - Logs: event_id, admin_user_id, action, previous_data, new_data, changed_fields, reason
  - RLS policy: Only super admins can view audit logs
  - Run in Supabase SQL Editor

### 2. API Endpoints
- ✅ **Dedicated Superuser Route** (`superuser-route.js`)
  - `GET /api/events/all` - List all events with filters, pagination, sorting
  - `PATCH /api/events/all?id=:id` - Superuser update with audit logging
  - Server-side filtering (never fetch all then filter)
  - Slim payload (only essential fields)
  - Super admin verification required

**Features:**
- Pagination (limit/offset)
- Filters: city, businessId, category, status, eventType, createdBy, startDate, endDate
- Toggles: onlyUpcoming, onlyScraped, needsReview
- Sorting: start_time, created_at, title (asc/desc)
- Audit logging on all updates

### 3. Frontend Components
- ✅ **SuperuserEventsDashboard** (`SuperuserEventsDashboard.tsx`)
  - Operations dashboard UI
  - Table view with columns: Title, Date/Time, Category, Status, Location, Created, Actions
  - Filter UI: Status, Category, Sort By, Order
  - Toggles: Only Upcoming, Only Scraped
  - Pagination controls
  - Status badges with color coding

- ✅ **Auto-Redirect** (`EventsDashboard.tsx`)
  - Automatically detects super admin
  - Redirects to SuperuserEventsDashboard
  - Regular partners see normal view

### 4. API Service
- ✅ **Superuser Methods** (`apiService.ts`)
  - `getSuperuserEvents(params)` - Fetch with all filters
  - `superuserUpdateEvent(eventId, updates, reason)` - Update with audit log

## 📋 Next Steps (To Complete)

### 1. Deploy Database Changes
```sql
-- Run these in Supabase SQL Editor:
1. superuser-indexes.sql
2. event-audit-logs-schema.sql
```

### 2. Wire Up API Route
- Add `superuser-route.js` to your API server routing
- Example for Vercel/Netlify: Create `/api/events/all/route.js` that imports `superuser-route.js`
- Or add to Express server: `app.use('/api/events/all', require('./events/superuser-route'))`

### 3. Add Missing Features

#### A. Event Actions (View/Edit/Delete)
- [ ] View event modal/detail page
- [ ] Edit event modal with validation
- [ ] Delete event with confirmation modal
- [ ] Publish/Unpublish toggle
- [ ] Flag/Approve scraped events

#### B. Additional Filters
- [ ] City filter (requires city_id column or location parsing)
- [ ] Business filter (dropdown with business names)
- [ ] Creator filter (dropdown with user names)
- [ ] Date range picker

#### C. Multi-City Support
- [ ] Add `city_id` column to events table
- [ ] Group events by city in UI
- [ ] City section headers when scrolling

#### D. Safety Safeguards
- [ ] Confirmation modals for destructive actions
- [ ] Soft delete (archive) instead of hard delete
- [ ] Rate limiting on API endpoints
- [ ] Secondary confirmation for delete

#### E. Scraper Support
- [ ] Add `source` column to events table
- [ ] Tag scraped events: `source = 'scraper'`
- [ ] Add `confidence_score` for matching
- [ ] Show potential duplicates
- [ ] Bulk approve scraped events

#### F. Data Integrity
- [ ] Strong input validation in update endpoint
- [ ] Prevent changing event owner accidentally
- [ ] Validate recurrence rules
- [ ] HTML sanitization for descriptions

#### G. Performance
- [ ] Implement cursor-based pagination (for very large datasets)
- [ ] Add caching layer (Redis) for frequent queries
- [ ] Lazy load event details (only load full data when clicked)

## 🔒 Security Checklist

- ✅ Server-side super admin verification
- ✅ RLS policies enforce super admin requirement
- ✅ Audit logging for all changes
- ✅ Separate endpoint to avoid permission conflicts
- ⏳ Rate limiting (TODO)
- ⏳ Input validation (TODO)
- ⏳ HTML sanitization (TODO)

## 📊 Performance Checklist

- ✅ Database indexes created
- ✅ Server-side filtering
- ✅ Slim payload (only essential fields)
- ✅ Pagination implemented
- ⏳ Cursor-based pagination (for 10k+ events)
- ⏳ Caching layer (TODO)

## 🎨 UX Checklist

- ✅ Operations dashboard feel
- ✅ Table view with all key columns
- ✅ Filter UI
- ✅ Pagination
- ✅ Status badges
- ⏳ Event detail modal
- ⏳ Edit modal
- ⏳ Confirmation modals
- ⏳ Multi-city grouping
- ⏳ Bulk actions

## 🚀 Deployment Steps

1. **Database:**
   ```bash
   # Run in Supabase SQL Editor:
   - superuser-indexes.sql
   - event-audit-logs-schema.sql
   ```

2. **API:**
   - Add `superuser-route.js` to your API server
   - Test endpoints: `GET /api/events/all`, `PATCH /api/events/all?id=:id`

3. **Frontend:**
   - Component already created: `SuperuserEventsDashboard.tsx`
   - Auto-redirects from `EventsDashboard.tsx`
   - Test with super admin account

4. **Verify:**
   - Super admin sees all events
   - Regular partners see only their events
   - Filters work correctly
   - Pagination works
   - Audit logs are created on updates

## 📝 Notes

- The superuser view automatically loads when a super admin visits `/events`
- Regular partners continue to see the filtered view
- All superuser actions are logged to `event_audit_logs` table
- The API uses slim payloads for performance (only essential fields)
- Server-side filtering ensures we never fetch all events then filter on client

