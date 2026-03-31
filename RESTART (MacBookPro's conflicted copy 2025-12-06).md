# LocalPlus API - RESTART File

## Project Overview

LocalPlus API is a serverless API built on Google Cloud Functions (Gen2) that provides backend services for the LocalPlus platform. It handles authentication, bookings, restaurants, businesses, events, and notifications.

**Current Deployment:** Google Cloud Functions (Gen2) in `localplus-api` project  
**Region:** `us-central1`  
**Database:** Supabase (PostgreSQL)  
**Auth:** Supabase Auth with JWT (HS256) verification

---

## Recent Activity Log

- **[Jan 14, 2025]** Reviewed project documentation and deployment status. Project has 11 Cloud Functions deployed, migrated from Vercel to GCP to avoid function limits. API Gateway setup in progress for routing to `api.localplus.city`.

---

## Current Status

### ✅ Completed
- All 11 functions deployed to `localplus-api` GCP project
- JWT authentication implemented with HS256 verification
- Migration from Vercel to GCP complete
- Environment variables configured

### ⏳ In Progress
- API Gateway setup for custom domain (`api.localplus.city`)
- DNS configuration

### 📋 Pending
- Complete API Gateway routing
- Update frontend apps to use new API endpoints
- Testing all endpoints through gateway

---

## Function Endpoints

All functions are deployed at: `us-central1-localplus-api.cloudfunctions.net`

| Function | Endpoint |
|----------|----------|
| auth | `/localplus-api-auth` |
| bookings | `/localplus-api-bookings` |
| bookings-id | `/localplus-api-bookings-id` |
| restaurants | `/localplus-api-restaurants` |
| restaurants-search | `/localplus-api-restaurants-search` |
| businesses | `/localplus-api-businesses` |
| notifications | `/localplus-api-notifications` |
| events | `/localplus-api-events` |
| events-all | `/localplus-api-events-all` |
| events-id | `/localplus-api-events-id` |
| events-participants | `/localplus-api-events-participants` |

---

## Architecture

- **Runtime:** Node.js (Google Cloud Functions Gen2)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth with JWT (HS256)
- **Deployment:** Individual Cloud Functions per endpoint
- **Routing:** API Gateway (in setup)

---

## Key Documentation

- `AUTH_EVALUATION.md` - Authentication implementation details
- `DEPLOYMENT_OPTIONS_ANALYSIS.md` - Platform comparison and migration rationale
- `google-cloud-functions/DEPLOYMENT_STATUS.md` - Current deployment status
- `google-cloud-functions/API_GATEWAY_SETUP_COMPLETE.md` - Gateway setup guide
- `google-cloud-functions/PROJECT_SETUP.md` - Project configuration

---

## Environment Variables

All functions require:
- `SUPABASE_URL`: `https://joknprahhqdhvdhzmuwl.supabase.co`
- `SUPABASE_ANON_KEY`: (Set during deployment)
- `SUPABASE_SERVICE_ROLE_KEY`: (For admin operations)
- `SUPABASE_JWT_SECRET`: (For JWT verification)

---

## Quick Reference

### Test Function
```bash
curl https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events \
  -X GET
```

### Check Deployment Status
```bash
gcloud functions list --project=localplus-api --region=us-central1
```

### Check API Gateway Status
```bash
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1
```

---

## Notes

- Functions were migrated from Vercel to avoid 12 function limit
- Using GCP Gen2 functions for better cold start performance
- JWT verification uses HS256 algorithm (Supabase standard)
- API Gateway will route `api.localplus.city/api/*` to appropriate functions
