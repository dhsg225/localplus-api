# API Gateway Setup - In Progress

**Status:** Gateway is being created (takes 5-10 minutes)

---

## ✅ Completed Steps

1. ✅ Enabled API Gateway APIs
2. ✅ Created API Gateway API: `localplus-api`
3. ✅ Created API Config: `localplus-api-config-simple-*`
4. ⏳ Creating Gateway: `localplus-api-gateway` (in progress)

---

## 📋 Next Steps

### Step 1: Get Gateway URL

```bash
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --format='value(defaultHostname)'
```

This will return something like: `localplus-api-gateway-xxxxx-uc.a.run.app`

### Step 2: Update DNS

**In your DNS provider (Cloudflare/Vercel/etc):**

1. Go to DNS settings for `localplus.city`
2. Add/Update CNAME record:
   - **Type:** CNAME
   - **Name:** `api`
   - **Value:** `[GATEWAY_URL_FROM_STEP_1]`
   - **TTL:** 3600 (or Auto)

3. Wait for DNS propagation (5-30 minutes)

### Step 3: Test Gateway

Once DNS propagates:

```bash
# Test events endpoint
curl https://api.localplus.city/api/events?status=published&limit=5
```

Should return events data.

### Step 4: Update Mobile App

Update `localplus-mobile/src/services/eventsService.ts`:

```typescript
// Change from:
const EVENTS_API_BASE_URL = 'https://us-central1-localplus-api.cloudfunctions.net';

// To:
const EVENTS_API_BASE_URL = 'https://api.localplus.city';

// And update endpoint:
// From: /localplus-api-events
// To:   /api/events
```

---

## 🔍 Check Gateway Status

```bash
# Check if gateway is ready
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --format='table(name,state,defaultHostname)'
```

**States:**
- `CREATING` - Still provisioning (wait 5-10 minutes)
- `ACTIVE` - Ready to use ✅
- `FAILED` - Check errors

---

## 🧪 Testing

Once DNS is set up:

```bash
# Test events
curl https://api.localplus.city/api/events?status=published&limit=5

# Should return:
# {"success":true,"data":[...],"pagination":{...}}
```

---

## 📝 Notes

- Gateway provisioning takes 5-10 minutes
- DNS propagation takes 5-30 minutes
- The simplified config only includes `/api/events` endpoint
- To add more endpoints, update `api-gateway-config-simple.yaml` and redeploy

---

## 🚨 Troubleshooting

**Gateway not ready:**
- Wait 5-10 minutes after creation
- Check status: `gcloud api-gateway gateways describe localplus-api-gateway --location=us-central1`

**DNS not working:**
- Verify CNAME record is correct
- Wait for DNS propagation
- Test with: `dig api.localplus.city` or `nslookup api.localplus.city`

**502/503 errors:**
- Gateway might still be provisioning
- Check gateway status
- Verify GCF functions are active

