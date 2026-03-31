# Events Superuser Role Setup

## Overview
Created a new role called `events_superuser` that grants Sandy (user ID: `950a7fcb-d40f-4c33-aabb-44cc3fdd51eb`, email: `sandybeachthailand@gmail.com`) full CRUD access to ALL events, regardless of ownership or business association.

## Changes Made

### 1. Database Schema Updates
- **File**: `add-events-superuser-role.sql`
  - Updates `user_roles` table constraint to allow `events_superuser` role
  - Grants Sandy the `events_superuser` role
  - Includes verification query

- **Files**: 
  - `localplus-admin/shared/database/unified-auth-schema.sql`
  - `localplus-partner/shared/database/unified-auth-schema.sql`
  - Updated role constraint to include `events_superuser`

### 2. RLS Policy Updates
- **File**: `update-rls-for-events-superuser.sql`
  - Updates all events table RLS policies to allow `events_superuser` to bypass restrictions
  - Policies updated: SELECT, INSERT, UPDATE, DELETE

### 3. API Route Updates
- **Files**:
  - `events/route.js` (GET and POST endpoints)
  - `events/[id]/route.js` (PUT and DELETE endpoints use authorizeRequest which now checks for events_superuser)
  - `google-cloud-functions/events/index.js` (GET and POST endpoints)

- **Changes**:
  - GET `/api/events`: Events superuser can see ALL events (no status filter)
  - POST `/api/events`: Events superuser can create events for any business (bypasses business_id check)
  - PUT `/api/events/[id]`: Events superuser can update ANY event (handled by authorizeRequest)
  - DELETE `/api/events/[id]`: Events superuser can delete ANY event (handled by authorizeRequest)

### 4. RBAC Utility Updates
- **Files**:
  - `events/utils/rbac.js`
  - `google-cloud-functions/events/utils/rbac.js`

- **New Function**: `isEventsSuperuser(supabase, userId)`
  - Checks if a user has the `events_superuser` role

- **Updated Functions**:
  - `checkEventPermission()`: Checks for events_superuser first, grants full access if found
  - `authorizeRequest()`: Bypasses all permission checks for events_superuser

## Setup Instructions

### Step 1: Update Database Schema
Run the SQL script in Supabase SQL Editor:
```sql
-- Run: add-events-superuser-role.sql
```

This will:
1. Update the `user_roles` table constraint
2. Grant Sandy the `events_superuser` role
3. Verify the role was granted

### Step 2: Update RLS Policies
Run the SQL script in Supabase SQL Editor:
```sql
-- Run: update-rls-for-events-superuser.sql
```

This will update all events table RLS policies to allow `events_superuser` full access.

### Step 3: Deploy API Changes
The API code changes are already in place. Deploy the updated routes:
- `events/route.js`
- `events/[id]/route.js`
- `events/utils/rbac.js`
- `google-cloud-functions/events/index.js`
- `google-cloud-functions/events/utils/rbac.js`

## Verification

After setup, verify Sandy can:
1. ✅ See ALL events (including drafts, cancelled, etc.)
2. ✅ Create events for any business
3. ✅ Update any event
4. ✅ Delete any event

## Testing

Test with Sandy's account:
```bash
# Get Sandy's auth token
# Then test GET /api/events - should see all events
# Test POST /api/events - should be able to create events for any business_id
# Test PUT /api/events/[id] - should be able to update any event
# Test DELETE /api/events/[id] - should be able to delete any event
```

## Notes
- The `events_superuser` role is separate from `super_admin`
- Sandy can have both roles if needed
- The role check happens at both API level and RLS policy level for security

