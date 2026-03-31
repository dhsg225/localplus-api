# Events Superuser Fix Summary

## Problem
`SuperuserEventsDashboard` was returning `false` for super admin check, while `EventsDashboard` correctly returned `true` for the same user. This prevented Sandy from accessing the superuser events dashboard.

## Root Cause
`SuperuserEventsDashboard` had incomplete session handling compared to `EventsDashboard`. The session wasn't being properly verified before querying `user_roles` table.

## Solution

### 1. Fixed Session Handling in SuperuserEventsDashboard
**File:** `localplus-partner/src/pages/SuperuserEventsDashboard.tsx`

**Key changes to match EventsDashboard pattern:**
- Added 100ms delay after `setSession()` to ensure session propagation
- Added double-check of session with `getUser()` to verify session is still valid
- Added test query (all roles) before filtered query to verify RLS is working
- Added comprehensive debug logging matching EventsDashboard

**Critical code pattern:**
```typescript
// Set session
const { data: { session }, error: sessionError } = await supabase.auth.setSession({
  access_token: token,
  refresh_token: token
} as any);

// Wait for session propagation
await new Promise(resolve => setTimeout(resolve, 100));

// Double-check session is still valid
const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();

// Test query first (all roles)
const { data: allRoles, error: allRolesError } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', supabaseUser.id);

// Then filtered query
const { data: roles, error } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', supabaseUser.id)
  .in('role', ['super_admin', 'events_superuser'])
  .eq('is_active', true)
  .limit(1);
```

### 2. Fixed Image Display
**File:** `localplus-api/events/all/route.js`

**Problem:** Events were showing generic placeholder images instead of actual event covers.

**Solution:** Added `hero_image_url` and `metadata` to the SELECT query:
```javascript
.select(`
  id,
  title,
  status,
  start_time,
  end_time,
  event_type,
  business_id,
  created_by,
  created_at,
  updated_at,
  location,
  venue_area,
  hero_image_url,  // Added
  metadata         // Added
`)
```

**Why both fields:**
- `hero_image_url` is the primary image field
- `metadata` contains fallback image fields (`featured_image_url`, `image_url`, etc.)
- Frontend checks both in this order: `hero_image_url` → `metadata.featured_image_url` → `metadata.image_url` → placeholder

## Verification Steps

1. **Check SuperuserEventsDashboard logs:**
   - Should show: `[SuperuserEventsDashboard] Super admin check result: true`
   - Should show: `[SuperuserEventsDashboard] Roles found: [{…}]`

2. **Check API response:**
   - Events should include `hero_image_url` and `metadata` fields
   - Images should display correctly in the dashboard

3. **If it breaks again:**
   - Compare `SuperuserEventsDashboard.tsx` with `EventsDashboard.tsx` - they should have identical session handling
   - Check if `hero_image_url` and `metadata` are still in the API query
   - Verify RLS policies on `user_roles` table haven't changed

## Key Files Modified

1. `localplus-partner/src/pages/SuperuserEventsDashboard.tsx` - Fixed session handling
2. `localplus-api/events/all/route.js` - Added image fields to query

## Schema Reference

**Events table columns (verified via `supabase db pull`):**
- `hero_image_url` (text) - Primary image field
- `metadata` (jsonb) - Contains fallback image fields

**User roles check:**
- Query `user_roles` table for `role IN ('super_admin', 'events_superuser')`
- Must have `is_active = true`
- Requires proper session setup for RLS to work

