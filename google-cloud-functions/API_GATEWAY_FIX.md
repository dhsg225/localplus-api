# API Gateway Configuration Fix

**Issue:** Google Cloud API Gateway requires API keys to be configured before creating the gateway config.

**Status:** All 11 functions are deployed and working. API Gateway needs API keys set up first.

---

## ✅ Option 1: Create API Keys in Console (Recommended)

### Step 1: Create API Key

1. Go to [GCP Console - Credentials](https://console.cloud.google.com/apis/credentials?project=marketing-saas-ai)
2. Click **"Create Credentials"** > **"API Key"**
3. Copy the API key (you'll need it later)
4. (Optional) Restrict the key to "API Gateway" only

### Step 2: Create API Config

```bash
cd google-cloud-functions
PROJECT_ID=$(gcloud config get-value project)

# Create config (should work now with API keys existing)
CONFIG_NAME="localplus-api-config-$(date +%s)"
gcloud api-gateway api-configs create $CONFIG_NAME \
  --api=localplus-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID
```

### Step 3: Create Gateway

```bash
gcloud api-gateway gateways create localplus-api-gateway \
  --api=localplus-api \
  --api-config=$CONFIG_NAME \
  --location=us-central1 \
  --project=$PROJECT_ID
```

### Step 4: Get Gateway URL

```bash
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --format='value(defaultHostname)'
```

### Step 5: Configure DNS

Add CNAME record:
- **Type:** CNAME
- **Name:** api
- **Value:** [gateway-url-from-step-4]
- **TTL:** 3600

---

## ✅ Option 2: Use Functions Directly (Simplest)

**No API Gateway needed!** Use function URLs directly:

### Update Frontend API Service

```typescript
// apiService.ts
const API_BASE = 'https://us-central1-marketing-saas-ai.cloudfunctions.net';

export const API_ENDPOINTS = {
  auth: `${API_BASE}/localplus-api-auth`,
  bookings: `${API_BASE}/localplus-api-bookings`,
  bookingsById: (id: string) => `${API_BASE}/localplus-api-bookings-id?id=${id}`,
  bookingsConfirm: (id: string) => `${API_BASE}/localplus-api-bookings-id?action=confirm&id=${id}`,
  bookingsCancel: (id: string) => `${API_BASE}/localplus-api-bookings-id?action=cancel&id=${id}`,
  restaurants: `${API_BASE}/localplus-api-restaurants`,
  restaurantsSearch: `${API_BASE}/localplus-api-restaurants-search`,
  businesses: `${API_BASE}/localplus-api-businesses`,
  notifications: `${API_BASE}/localplus-api-notifications`,
  events: `${API_BASE}/localplus-api-events`,
  eventsAll: `${API_BASE}/localplus-api-events-all`,
  eventsById: (id: string) => `${API_BASE}/localplus-api-events-id?id=${id}`,
  eventsParticipants: (id: string) => `${API_BASE}/localplus-api-events-participants?id=${id}`,
};
```

**Pros:**
- ✅ Works immediately
- ✅ No API Gateway setup needed
- ✅ Simpler architecture

**Cons:**
- ❌ URLs are different from `api.localplus.city`
- ❌ No single domain routing

---

## ✅ Option 3: Cloud Load Balancer (Advanced)

See `API_GATEWAY_SETUP.md` for Cloud Load Balancer setup instructions.

---

## 🧪 Testing Functions (Current Setup)

All functions are **ACTIVE** and ready to test:

```bash
# Test auth
curl https://us-central1-marketing-saas-ai.cloudfunctions.net/localplus-api-auth \
  -X GET \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test events
curl https://us-central1-marketing-saas-ai.cloudfunctions.net/localplus-api-events \
  -X GET

# Test superuser events
curl https://us-central1-marketing-saas-ai.cloudfunctions.net/localplus-api-events-all \
  -X GET \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

---

## 📋 Recommendation

**For immediate use:** Use **Option 2** (functions directly)
- Update frontend URLs
- Works right now
- No additional setup

**For production:** Use **Option 1** (API Gateway with API keys)
- Single domain (`api.localplus.city`)
- Better for production
- Requires API key setup

---

## 🔗 Quick Links

- **GCP Console - Credentials:** https://console.cloud.google.com/apis/credentials?project=marketing-saas-ai
- **GCP Console - API Gateway:** https://console.cloud.google.com/api-gateway?project=marketing-saas-ai
- **Function URLs:** All listed in `DEPLOYMENT_STATUS.md`

