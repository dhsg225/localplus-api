# LocalPlus API - GCF Deployment Status

**Project:** `localplus-api`  
**Region:** `us-central1`  
**Status:** ✅ All functions redeployed to correct project

---

## ✅ Deployed Functions (11 total)

All functions are deployed to: `us-central1-localplus-api.cloudfunctions.net`

| Function | URL |
|----------|-----|
| **auth** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-auth` |
| **bookings** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-bookings` |
| **bookings-id** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-bookings-id` |
| **restaurants** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-restaurants` |
| **restaurants-search** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-restaurants-search` |
| **businesses** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-businesses` |
| **notifications** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-notifications` |
| **events** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events` |
| **events-all** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events-all` |
| **events-id** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events-id` |
| **events-participants** | `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events-participants` |

---

## 🔄 Migration Complete

**Previous:** Functions in `marketing-saas-ai` project  
**Current:** Functions in `localplus-api` project  
**Status:** ✅ All redeployed

---

## 📋 Next Steps

1. ✅ **Functions deployed** - All 11 functions active
2. ⏳ **API Gateway** - Config updated, needs API keys (see `API_GATEWAY_FIX.md`)
3. ⏳ **DNS** - Update `api.localplus.city` to point to gateway (once created)

---

## 🧪 Testing

```bash
# Test auth
curl https://us-central1-localplus-api.cloudfunctions.net/localplus-api-auth \
  -X GET \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test events
curl https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events \
  -X GET

# Test superuser events
curl https://us-central1-localplus-api.cloudfunctions.net/localplus-api-events-all \
  -X GET \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 📝 Environment Variables

All functions use:
- `SUPABASE_URL`: `https://joknprahhqdhvdhzmuwl.supabase.co`
- `SUPABASE_ANON_KEY`: Set during deployment

---

## 🔗 Related Docs

- `API_GATEWAY_FIX.md` - API Gateway setup guide
- `PROJECT_SETUP.md` - Project configuration
- `MIGRATION_GUIDE.md` - Migration details
