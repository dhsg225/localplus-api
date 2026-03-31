# LocalPlus API - Google Cloud API Gateway Setup Guide

**Date:** November 29, 2025  
**Purpose:** Route `api.localplus.city` to 11 Google Cloud Functions

---

## 📋 Overview

After deploying all GCF functions, we need to set up routing so that:
- `https://api.localplus.city/api/auth` → `localplus-api-auth` function
- `https://api.localplus.city/api/bookings` → `localplus-api-bookings` function
- etc.

**Two Options:**
1. **API Gateway** (Recommended) - Managed API gateway with custom domain support
2. **Cloud Load Balancer** - More complex, better for high traffic

We'll use **API Gateway** for simplicity.

---

## 🎯 Prerequisites

- ✅ All 11 functions deployed to GCF
- ✅ GCP project with billing enabled
- ✅ Domain `api.localplus.city` (or subdomain)
- ✅ DNS access to configure domain

---

## 📦 Step 1: Enable Required APIs

```bash
# Enable API Gateway API
gcloud services enable apigateway.googleapis.com
gcloud services enable servicemanagement.googleapis.com
gcloud services enable servicecontrol.googleapis.com
```

---

## 📝 Step 2: Create API Gateway Configuration

### 2.1 Create API Config File

Create `api-gateway-config.yaml`:

```yaml
swagger: '2.0'
info:
  title: LocalPlus API Gateway
  description: API Gateway for LocalPlus API endpoints
  version: 1.0.0
host: api.localplus.city
schemes:
  - https
produces:
  - application/json
paths:
  /api/auth:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-auth
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-auth
      responses:
        '200':
          description: Success
    delete:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-auth
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-auth
      responses:
        '200':
          description: Success

  /api/bookings:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings
      responses:
        '200':
          description: Success

  /api/bookings/{id}:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id
      responses:
        '200':
          description: Success
    put:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id
      responses:
        '200':
          description: Success

  /api/bookings/{id}/confirm:
    put:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id?action=confirm
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id
      responses:
        '200':
          description: Success

  /api/bookings/{id}/cancel:
    put:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id?action=cancel
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-bookings-id
      responses:
        '200':
          description: Success

  /api/restaurants:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-restaurants
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-restaurants
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-restaurants
      responses:
        '200':
          description: Success

  /api/restaurants/search:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-restaurants-search
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-restaurants-search
      responses:
        '200':
          description: Success

  /api/businesses:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-businesses
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-businesses
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-businesses
      responses:
        '200':
          description: Success

  /api/notifications:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-notifications
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-notifications
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-notifications
      responses:
        '200':
          description: Success

  /api/events:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events
      responses:
        '200':
          description: Success

  /api/events/all:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-all
      responses:
        '200':
          description: Success
    patch:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-all
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-all
      responses:
        '200':
          description: Success

  /api/events/{id}:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-id
      responses:
        '200':
          description: Success
    put:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-id
      responses:
        '200':
          description: Success
    delete:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-id
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-id
      responses:
        '200':
          description: Success

  /api/events/{id}/participants:
    get:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-participants
      responses:
        '200':
          description: Success
    post:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-participants
      responses:
        '200':
          description: Success
    put:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-participants
      responses:
        '200':
          description: Success
    delete:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-participants
      responses:
        '200':
          description: Success
    options:
      x-google-backend:
        address: https://us-central1-[PROJECT-ID].cloudfunctions.net/localplus-api-events-participants
      responses:
        '200':
          description: Success
```

**⚠️ Important:** Replace `[PROJECT-ID]` with your actual GCP project ID.

---

## 🚀 Step 3: Deploy API Gateway

### 3.1 Create API Config

```bash
# Get your project ID
PROJECT_ID=$(gcloud config get-value project)
echo "Project ID: $PROJECT_ID"

# Replace [PROJECT-ID] in config file
sed -i '' "s/\[PROJECT-ID\]/$PROJECT_ID/g" api-gateway-config.yaml

# Create API config
gcloud api-gateway api-configs create localplus-api-config \
  --api=localplus-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID \
  --backend-auth-service-account=[SERVICE-ACCOUNT-EMAIL]
```

### 3.2 Create API Gateway

```bash
# Create the API Gateway
gcloud api-gateway apis create localplus-api \
  --project=$PROJECT_ID \
  --display-name="LocalPlus API"
```

### 3.3 Create Gateway

```bash
# Create gateway (this takes a few minutes)
gcloud api-gateway gateways create localplus-api-gateway \
  --api=localplus-api \
  --api-config=localplus-api-config \
  --location=us-central1 \
  --project=$PROJECT_ID
```

**Wait 5-10 minutes** for the gateway to be created.

---

## 🌐 Step 4: Configure Custom Domain

### 4.1 Get Gateway IP Address

```bash
# Get the gateway IP
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --format='value(defaultHostname)'
```

This will return something like: `localplus-api-gateway-[hash]-uc.a.run.app`

### 4.2 Configure DNS

Add a CNAME record in your DNS provider:

```
Type: CNAME
Name: api
Value: localplus-api-gateway-[hash]-uc.a.run.app
TTL: 3600
```

**Or if using Cloudflare:**
1. Go to Cloudflare DNS settings
2. Add CNAME record: `api` → `localplus-api-gateway-[hash]-uc.a.run.app`
3. Enable "Proxy" (orange cloud) for SSL

---

## 🔐 Step 5: SSL Certificate (Automatic)

Google Cloud API Gateway automatically provisions SSL certificates for custom domains. Wait 10-15 minutes after DNS propagation.

---

## ✅ Step 6: Test Endpoints

### 6.1 Test Health Check

```bash
# Test auth endpoint
curl https://api.localplus.city/api/auth \
  -X GET \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test events endpoint
curl https://api.localplus.city/api/events \
  -X GET
```

### 6.2 Test All Endpoints

```bash
# Create test script
cat > test-endpoints.sh << 'EOF'
#!/bin/bash
BASE_URL="https://api.localplus.city"

echo "Testing LocalPlus API endpoints..."
echo ""

# Test each endpoint
ENDPOINTS=(
  "/api/auth"
  "/api/bookings?businessId=test"
  "/api/restaurants"
  "/api/businesses"
  "/api/notifications?businessId=test"
  "/api/events"
)

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing: $endpoint"
  curl -s -o /dev/null -w "  Status: %{http_code}\n" "$BASE_URL$endpoint" || echo "  ❌ Failed"
done

echo ""
echo "✅ Testing complete!"
EOF

chmod +x test-endpoints.sh
./test-endpoints.sh
```

---

## 🔧 Alternative: Cloud Load Balancer (Advanced)

If API Gateway doesn't meet your needs, use Cloud Load Balancer:

### Setup Steps:

1. **Create Backend Service**
```bash
gcloud compute backend-services create localplus-api-backend \
  --global \
  --protocol HTTP
```

2. **Add Function as Backend**
```bash
# For each function, add as backend
gcloud compute backend-services add-backend localplus-api-backend \
  --global \
  --network-endpoint-group=localplus-api-auth \
  --network-endpoint-group-region=us-central1
```

3. **Create URL Map**
```bash
gcloud compute url-maps create localplus-api-url-map \
  --default-service=localplus-api-backend
```

4. **Create HTTPS Proxy**
```bash
gcloud compute target-https-proxies create localplus-api-https-proxy \
  --url-map=localplus-api-url-map \
  --ssl-certificates=api-localplus-city-ssl-cert
```

5. **Create Forwarding Rule**
```bash
gcloud compute forwarding-rules create localplus-api-forwarding-rule \
  --global \
  --target-https-proxy=localplus-api-https-proxy \
  --ports=443
```

**Note:** Cloud Load Balancer is more complex but offers better performance and features.

---

## 📊 Step 7: Monitoring & Logging

### View API Gateway Logs

```bash
# View logs
gcloud logging read "resource.type=api_gateway" \
  --limit 50 \
  --format json
```

### Monitor Function Invocations

```bash
# View function logs
gcloud functions logs read localplus-api-auth \
  --gen2 \
  --region us-central1 \
  --limit 50
```

---

## 🐛 Troubleshooting

### Issue: 404 Not Found
- **Check:** API Gateway config is correct
- **Check:** Functions are deployed and accessible
- **Check:** DNS is pointing to correct gateway

### Issue: CORS Errors
- **Check:** Functions have CORS headers set
- **Check:** API Gateway isn't blocking CORS

### Issue: 502 Bad Gateway
- **Check:** Functions are deployed and running
- **Check:** Service account has correct permissions
- **Check:** Function URLs in config are correct

### Issue: SSL Certificate Not Provisioned
- **Wait:** 10-15 minutes after DNS change
- **Check:** DNS is correctly configured
- **Check:** Domain is verified in GCP

---

## 💰 Cost Estimate

**API Gateway:**
- Free tier: 1 million calls/month
- After: $3 per million calls

**Cloud Functions:**
- Free tier: 2 million invocations/month
- After: $0.40 per million invocations

**Estimated Monthly Cost:** $0-10 for typical usage

---

## 📝 Next Steps After Setup

1. ✅ Test all endpoints
2. ✅ Update frontend apps to use `https://api.localplus.city`
3. ✅ Set up monitoring alerts
4. ✅ Configure rate limiting (if needed)
5. ✅ Set up API keys (if needed for external access)

---

## 🔗 Useful Commands

```bash
# List all gateways
gcloud api-gateway gateways list

# Describe gateway
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1

# Update API config
gcloud api-gateway api-configs create localplus-api-config-v2 \
  --api=localplus-api \
  --openapi-spec=api-gateway-config.yaml

# Update gateway to use new config
gcloud api-gateway gateways update localplus-api-gateway \
  --api=localplus-api \
  --api-config=localplus-api-config-v2 \
  --location=us-central1
```

---

## ✅ Completion Checklist

- [ ] All functions deployed
- [ ] API Gateway APIs enabled
- [ ] API config file created
- [ ] API Gateway created
- [ ] Gateway deployed
- [ ] DNS configured
- [ ] SSL certificate provisioned
- [ ] All endpoints tested
- [ ] Frontend apps updated
- [ ] Monitoring configured

---

**Ready to proceed?** Start with Step 1 and work through each step sequentially.

