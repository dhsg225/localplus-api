# LocalPlus API - Google Cloud Functions (Gen2) Deployment

This directory contains Google Cloud Functions (Gen2) implementations for all LocalPlus API endpoints.

## Structure

Each function is in its own directory with:
- `index.js` - Function handler
- `package.json` - Dependencies
- `deploy.sh` - Deployment script

## Functions

1. **auth** - Authentication endpoints
2. **bookings** - Booking management
3. **bookings-id** - Individual booking operations (GET, PUT, confirm, cancel)
4. **restaurants** - Restaurant listings
5. **restaurants-search** - Restaurant search
6. **businesses** - Business management
7. **notifications** - Notification settings
8. **events** - Events CRUD
9. **events-all** - Superuser events endpoint
10. **events-id** - Individual event operations
11. **events-participants** - Event participants management

## Deployment

### Prerequisites
- Google Cloud SDK installed (`gcloud`)
- GCP project created
- Cloud Functions API enabled
- Environment variables set

### Deploy All Functions
```bash
./deploy-all.sh
```

### Deploy Individual Function
```bash
cd auth
./deploy.sh
```

## Environment Variables

Set these in GCP Console or via deployment script:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## API Gateway Setup

After deploying functions, set up Cloud Load Balancer or API Gateway to route:
- `https://api.localplus.city/api/*` → Individual GCF endpoints

## Migration from Vercel

This migration:
- ✅ Removes 12 function limit
- ✅ Unlimited scalability
- ✅ Pay-per-use pricing
- ✅ Better cost efficiency

