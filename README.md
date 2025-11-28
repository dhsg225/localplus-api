# LocalPlus API

Shared API services for all LocalPlus applications.

## Deployment

- **Production URL**: https://api.localplus.city
- **Vercel Project**: localplus-api

## API Endpoints

### Authentication
- `POST /api/auth` - Login
- `GET /api/auth` - Get session
- `DELETE /api/auth` - Logout

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/[id]/confirm` - Confirm booking
- `PUT /api/bookings/[id]/cancel` - Cancel booking

### Restaurants
- `GET /api/restaurants` - List restaurants
- `GET /api/restaurants/search` - Search restaurants

### Businesses
- `GET /api/businesses` - List businesses

### Notifications
- `GET /api/notifications` - Get notification settings
- `POST /api/notifications` - Update notification settings

### Events (Phase 0 + Phase 1)
- `GET /api/events` - List events (supports filters: businessId, status, eventType, startDate, endDate)
- `POST /api/events` - Create event (requires authentication)
- `GET /api/events/[id]` - Get specific event
- `PUT /api/events/[id]` - Update event (requires edit permission)
- `DELETE /api/events/[id]` - Delete event (requires owner permission)
- `GET /api/events/[id]/participants` - List event participants
- `POST /api/events/[id]/participants` - Register for event (requires authentication)
- `PUT /api/events/[id]/participants` - Update participant status
- `DELETE /api/events/[id]/participants` - Cancel registration

## Environment Variables

```bash
SUPABASE_URL=https://joknprahhqdhvdhzmuwl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Development

```bash
npm install
npm run dev
```

## Events Module

**📋 See [events/ARCHITECTURE_DECISION.md](./events/ARCHITECTURE_DECISION.md) for full architecture decisions and growth plan.**

The Events module implements Phase 0 (basic CRUD) and Phase 1 (RBAC) features:

### Phase 0 Features
- Event CRUD operations
- Participant registration
- Event filtering and pagination

### Phase 1 Features
- Role-Based Access Control (RBAC)
- Permission management (owner, editor, viewer, participant)
- Row Level Security (RLS) policies in Supabase
- Business-level access control

### Database Schema

Run the SQL schema file to set up the events tables:
```bash
# In Supabase SQL Editor, run:
events/schema.sql
```

This creates:
- `events` table - Core event data
- `event_participants` table - Participant tracking
- `event_permissions` table - RBAC permissions
- RLS policies for secure access

### Testing

Minimal tests are available in `events/__tests__/events.test.js`:
```bash
node events/__tests__/events.test.js
```

Set environment variables:
- `TEST_USER_EMAIL` - Test user email
- `TEST_USER_PASSWORD` - Test user password
- `API_BASE_URL` - API base URL (default: http://localhost:3000/api)
