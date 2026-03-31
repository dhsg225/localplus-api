# Event Engine: Attendance & Payment Extension - Implementation Summary

**Date**: 2026-01-21  
**Status**: ✅ Phase 1 Complete - Database & API Layer  
**Next**: Frontend UI Components

---

## 🎯 Objective

Extend the LocalPlus Event Engine to support attendance tracking, RSVP management, and payment-gated events, using a real supper club as the testbed.

---

## ✅ Completed Work

### 1. Database Schema Extension

**File**: `/Users/admin/Dropbox/Development/localplus-api/supabase/migrations/20260121143000_event_attendance_payments.sql`

#### Extended `events` Table
Added columns:
- `max_capacity` (INTEGER) - Maximum number of attendees
- `requires_payment` (BOOLEAN) - Whether payment is required
- `price_per_seat` (DECIMAL) - Price per attendee seat
- `payment_method` (VARCHAR) - Payment method ('bank_transfer', 'gateway')
- `rsvp_deadline` (TIMESTAMPTZ) - Deadline for RSVPs

#### Created `event_attendance` Table
New entity for tracking attendance with:
- `id` (UUID, PK)
- `event_id` (UUID, FK to events)
- `user_id` (UUID, FK to auth.users, nullable for guest checkout)
- `guest_name` (TEXT)
- `guest_email` (TEXT)
- `seats_reserved` (INTEGER, default 1)
- `status` (VARCHAR) - RSVP_SUBMITTED, AWAITING_CONFIRMATION, CONFIRMED, CANCELLED, NO_SHOW
- `payment_status` (VARCHAR) - NOT_REQUIRED, PENDING, RECEIVED, REJECTED
- `payment_proof_url` (TEXT) - URL to payment proof upload
- `metadata` (JSONB) - Flexible additional data
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### Indexes
- `idx_event_attendance_event_id`
- `idx_event_attendance_user_id`
- `idx_event_attendance_status`
- `idx_event_attendance_payment_status`

#### Row Level Security (RLS) Policies
**SELECT Policy**: Users can view:
- Their own attendance records
- Attendance for events they own/manage

**INSERT Policy**: Anyone can RSVP to published events

**UPDATE Policy**:
- Event owners/partners can update all fields (payment, confirmation)
- Regular users can only cancel their own RSVP

#### Trigger
- `update_event_attendance_updated_at` - Auto-updates `updated_at` timestamp

---

### 2. Backend API Implementation

**File**: `/Users/admin/Dropbox/Development/localplus-api/events/[id]/attendance/route.js`

#### Endpoints

**GET `/api/events/[id]/attendance`**
- Lists all attendance records for an event
- Requires view permissions (owner/partner/superuser)
- Returns array of attendance records

**POST `/api/events/[id]/attendance`**
- Submits RSVP for an event
- Validates:
  - Event is published
  - RSVP deadline hasn't passed
  - Capacity not exceeded
- Auto-sets status based on payment requirement:
  - `RSVP_SUBMITTED` if no payment required
  - `AWAITING_CONFIRMATION` if payment required
- Returns created attendance record

**PUT `/api/events/[id]/attendance`**
- Updates attendance status
- Event owners/partners can:
  - Update status (confirm, cancel, no-show)
  - Update payment_status
  - Auto-confirms when payment_status = RECEIVED
- Regular users can only cancel their own attendance

**DELETE `/api/events/[id]/attendance`**
- Cancels attendance
- Users can cancel their own
- Event owners can cancel any attendance

#### Business Logic
- **Capacity Checking**: Validates against `max_capacity` before allowing RSVP
- **RSVP Deadline**: Blocks RSVPs after deadline
- **Payment Flow**: Auto-sets initial status based on `requires_payment`
- **Auto-Confirmation**: When payment is marked RECEIVED, status auto-updates to CONFIRMED

---

### 3. Frontend Integration

#### Updated Components

**CreateEventModal.tsx**
- Added form fields:
  - Max Capacity (number input)
  - RSVP Deadline (datetime-local)
  - Requires Payment (checkbox)
  - Price per Seat (number input with ฿ symbol)
  - Payment Method (select: bank_transfer/gateway)
- Conditional display: Payment fields only show when "Requires Payment" is checked
- Form state extended with new fields
- Submit handler includes new fields in API payload

**EditEventModal.tsx**
- Added same form fields as CreateEventModal
- Extended EventRecord interface with new fields
- loadFullEvent() populates new fields from API
- handleSubmit() includes new fields in update payload

**apiService.ts**
- Added attendance management methods:
  - `getEventAttendance(eventId)` - Fetch attendance list
  - `submitRSVP(eventId, attendanceData)` - Submit RSVP
  - `updateAttendanceStatus(eventId, attendanceId, updates)` - Update status/payment
  - `cancelAttendance(eventId, attendanceId)` - Cancel attendance

---

## 🎨 UI Design Highlights

### Attendance & Payments Section
- **Visual Separation**: Border-top divider with section heading
- **Grid Layout**: 2-column responsive grid for Max Capacity and RSVP Deadline
- **Payment Toggle**: Blue-highlighted box with checkbox
- **Conditional Fields**: Smooth animation when payment fields appear
- **Currency Symbol**: Thai Baht (฿) symbol positioned in price input
- **Future-Ready**: Payment gateway option shown as disabled (Future)

---

## 📋 Next Steps (Not Yet Implemented)

### Phase 2: Partner Attendance Management UI

1. **Attendance List View** (New Component)
   - Display table of all RSVPs for an event
   - Columns: Guest Name, Email, Seats, Status, Payment Status
   - Filters: By status, by payment status
   - Actions: Confirm, Mark Payment Received, Cancel, Mark No-Show

2. **Event Details Enhancement**
   - Show capacity stats: "15/20 confirmed"
   - Display payment summary: "12 paid, 3 pending"
   - Quick actions for attendance management

3. **ViewEventModal.tsx Updates**
   - Display attendance & payment info
   - Show "Manage Attendance" button for owners
   - Display capacity/RSVP deadline info

### Phase 3: Consumer RSVP Flow (Future)

1. **Event Detail Page (Consumer)**
   - "Attend" button
   - Seat selection (if capacity available)
   - Guest info form (name, email)
   - Payment instructions (if required)
   - Proof of payment upload

2. **RSVP Confirmation**
   - Success message with RSVP details
   - Email confirmation (future)
   - Calendar invite (future)

### Phase 4: Advanced Features (Deferred)

- Online payment gateway integration
- QR code tickets
- Automated refunds
- Floor plan/seating charts
- POS integration
- Waitlist management

---

## 🔧 Migration Instructions

### To Apply Database Changes:

```bash
# Navigate to API directory
cd /Users/admin/Dropbox/Development/localplus-api

# Apply migration via Supabase CLI
supabase db push

# OR apply directly via SQL
psql $DATABASE_URL < supabase/migrations/20260121143000_event_attendance_payments.sql
```

### To Deploy API Changes:

The new attendance endpoint is at:
```
/Users/admin/Dropbox/Development/localplus-api/events/[id]/attendance/route.js
```

Ensure your API gateway/router recognizes this path pattern.

### To Test Frontend Changes:

```bash
# Navigate to partner app
cd /Users/admin/Dropbox/Development/localplus-partner

# Install dependencies (if needed)
npm install

# Run dev server
npm run dev
```

---

## 🧪 Testing Checklist

### Database
- [ ] Migration applies without errors
- [ ] RLS policies work correctly
- [ ] Indexes are created
- [ ] Trigger updates `updated_at`

### API
- [ ] GET attendance returns correct records
- [ ] POST RSVP validates capacity
- [ ] POST RSVP respects deadline
- [ ] PUT auto-confirms on payment received
- [ ] DELETE works for own attendance
- [ ] Permissions enforced correctly

### Frontend
- [ ] Create event shows new fields
- [ ] Edit event loads existing values
- [ ] Payment fields toggle correctly
- [ ] Form validation works
- [ ] API calls succeed

---

## 📊 Data Flow Example

### Paid Event Flow:

1. **Event Creation** (Partner)
   - Partner creates event with `requires_payment = true`, `price_per_seat = 500`, `max_capacity = 20`

2. **RSVP Submission** (Consumer)
   - Consumer submits RSVP with name, email, seats
   - Status: `AWAITING_CONFIRMATION`
   - Payment Status: `PENDING`

3. **Payment Proof Upload** (Consumer)
   - Consumer uploads bank transfer screenshot
   - `payment_proof_url` updated

4. **Payment Confirmation** (Partner)
   - Partner views attendance list
   - Marks payment as `RECEIVED`
   - Status auto-updates to `CONFIRMED`

5. **Event Day**
   - Partner can mark as `NO_SHOW` if needed

---

## 🎯 Design Principles Followed

✅ **Incremental**: Extends existing schema without breaking changes  
✅ **Non-Breaking**: All new fields are nullable/optional  
✅ **Thailand-Friendly**: Bank transfer as primary payment method  
✅ **Future-Ready**: Payment gateway option prepared but disabled  
✅ **Flexible**: JSONB metadata for extensibility  
✅ **Secure**: RLS policies enforce proper access control  
✅ **User-Friendly**: Clear status enums, intuitive UI  

---

## 📝 Notes

- **Guest Checkout**: `user_id` is nullable to support non-registered guests
- **Payment Methods**: Currently only 'bank_transfer', 'gateway' prepared for future
- **Status Transitions**: System auto-manages status based on payment updates
- **Capacity Logic**: Counts only CONFIRMED seats, not pending RSVPs
- **Deadline Enforcement**: API-level validation prevents late RSVPs

---

**Implementation Time**: ~2 hours  
**Files Modified**: 5  
**Files Created**: 2  
**Lines of Code**: ~800  

**Ready for**: Database migration and initial testing  
**Blocked on**: None  
**Dependencies**: Existing Event Engine, Supabase, RLS utilities
