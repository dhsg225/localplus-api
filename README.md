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
