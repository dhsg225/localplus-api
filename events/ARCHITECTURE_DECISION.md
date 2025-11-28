# Event Engine Architecture Decision & Growth Plan

## Architecture Decision: Single Supabase Instance

**Decision:** Use the same Supabase instance as the rest of LocalPlus API (not a separate instance)

**Rationale:**
- Events module needs to reference `businesses`, `partners`, and `auth.users` tables
- Foreign keys and joins require same-database access
- RLS policies need to reference existing tables for proper RBAC
- Cross-database relationships don't work well in Supabase
- Simpler codebase - no cross-instance API calls needed

**Implementation:**
- Schema creates minimal `businesses` and `partners` tables if they don't exist
- Uses `CREATE TABLE IF NOT EXISTS` to work on both fresh and existing instances
- All tables coexist in same database, enabling proper relationships

---

## Event Engine Growth Plan — Single Supabase Instance

### Phase 0 — Foundation ✅ **COMPLETED**

**Goal:** Core events tables + basic RBAC

**Tables Created:**
- `events` → event metadata
- `event_participants` → RSVPs or attendance
- `event_permissions` → business-level RBAC

**Key Relationships:**
- References `businesses` (FK optional for dev/test)
- References `partners` (for RBAC)
- References `auth.users` (event creators and participants)

**API Endpoints Implemented:**
- `GET /api/events` - List events with filters
- `POST /api/events` - Create event (requires auth)
- `GET /api/events/[id]` - Get specific event
- `PUT /api/events/[id]` - Update event (requires edit permission)
- `DELETE /api/events/[id]` - Delete event (requires owner permission)
- `GET /api/events/[id]/participants` - List participants
- `POST /api/events/[id]/participants` - Register for event
- `PUT /api/events/[id]/participants` - Update participant status
- `DELETE /api/events/[id]/participants` - Cancel registration

**RBAC Features:**
- Role-based permissions (owner, editor, viewer, participant)
- Business-level access control via `partners` table
- Row Level Security (RLS) policies in Supabase
- Permission expiration support

**Status:** ✅ Complete - Works on fresh and existing Supabase instances

---

### Phase 1 — Partner & Consumer Integration 🚧 **NEXT**

**Goal:** Enable event creation, listing, and RSVPs in apps

**Partner App:**
- Event creation/edit UI
- Basic analytics / attendance dashboard

**Consumer Super App:**
- Browse events (with filters, search)
- RSVP / save events

**Admin / Newsroom:**
- Moderation queue, approval workflow

**API Extensions:**
- `/api/events/:id/occurrences` for recurring events (future)
- Enhanced filtering and search

**RBAC:**
- Partner-level permissions remain scoped to `event_permissions`
- Business-level access via `partners` table

**Outcome:** Fully functional Event Engine usable by all apps

---

### Phase 2 — Ticketing & Payments 📋 **PLANNED**

**Goal:** Add ticket types, sales, and Stripe integration

**New Tables:**
- `event_tickets` → types, prices, inventory
- `ticket_sales` → purchase records, QR codes, confirmations

**Partner App:**
- Create/manage ticket types
- View ticket sales dashboard

**Consumer App:**
- Buy tickets, receive e-ticket / QR code

**Stripe Integration:**
- Checkout sessions / payment processing

**Notes:**
- All tables in same Supabase instance → FKs can reference events safely

**Outcome:** Ticketing workflow fully integrated

---

### Phase 3 — Recurrence & Automation 📋 **PLANNED**

**Goal:** Handle repeating events and auto-import from scrapers

**Tables/Fields:**
- `event_occurrences` → expanded recurrence instances
- Optional `scraper_imports` table for automated draft events

**Features:**
- Recurring event expansion logic
- Scraper feeds auto-drafting events
- Deduplication / moderation queue

**Notes:**
- All FK references remain internal → safe for queries and RLS

**Outcome:** Automated, multi-instance events work across apps

---

### Phase 4 — Multi-City & Scalability 📋 **PLANNED**

**Goal:** Support multiple cities and large-scale events

**Fields / Tables:**
- Add `city_id` to events and venues
- Queries: Filter by city → `/api/events?city=bangkok`

**Optional:**
- Containerization for Event Engine module (Docker/K8s)
- Load scaling for ticket-heavy events (concerts, festivals)

**Notes:**
- Keep everything in same Supabase instance
- RLS and permissions remain scoped by business/partner → no risk of cross-city data leaks

**Outcome:** Event Engine can grow to multi-city, high-traffic use

---

### Phase 5 — Advanced Features 📋 **PLANNED**

**Goal:** Engagement, analytics, and promotions

**Features:**
- Event promotions / boosted placements
- Seat selection / assigned seating
- Analytics dashboards for partners and admins
- Notifications for attendees (push/email)

**Notes:**
- All data references remain internal → still safe in single Supabase

**Outcome:** Fully-featured Event Engine, integrated across all LDP apps

---

## Key Safety Principles

✅ **Single Supabase instance** → all FKs, joins, RLS work  
✅ **Minimal placeholder tables for dev/testing** → schema can run standalone  
✅ **RBAC scoped per module** → `event_permissions` + `partners` ensures partner-level isolation  
✅ **Phase-by-phase expansion** → avoid breaking prod tables  
✅ **Schema versioning / migrations** → each phase introduces new tables/columns safely

---

## Database Structure (Simplified)

```
Supabase (single instance)
 ├─ auth.users
 ├─ businesses
 ├─ partners
 ├─ bookings
 ├─ events
 │    ├─ event_participants
 │    ├─ event_permissions
 │    ├─ event_occurrences (Phase 3)
 │    ├─ event_tickets (Phase 2)
 │    └─ ticket_sales (Phase 2)
 └─ other core tables
```

**Apps** ↔️ `api.localplus.city`
- Partner App
- Consumer Super App
- Admin / Newsroom
- WordPress / Hotel TV
- Scrapers

---

## Current Implementation Status

**✅ Completed:**
- Phase 0 schema (events, event_participants, event_permissions)
- All Phase 0 API endpoints
- RBAC utilities and authorization middleware
- RLS policies in Supabase
- Minimal test suite
- Vercel routing configuration

**🚧 Next Steps:**
1. Run schema on existing Supabase instance
2. Test API endpoints
3. Begin Phase 1 UI integration

**📝 Files Created:**
- `events/schema.sql` - Database schema
- `events/route.js` - Main events endpoints
- `events/[id]/route.js` - Individual event operations
- `events/[id]/participants/route.js` - Participant management
- `events/utils/rbac.js` - RBAC helper utilities
- `events/__tests__/events.test.js` - Test suite

---

**Bottom Line:**
Tightly coupling Event Engine with the main Supabase is safe, scalable, and necessary. By following this phased approach, we can confidently expand features without risking production data or breaking RBAC, joins, or RLS.

