# Cloud Load Balancer Setup for api.localplus.city

## ✅ Setup Complete

**Components Created:**
1. ✅ Serverless NEG: `api-gateway-neg`
2. ✅ Backend Service: `api-gateway-backend`
3. ✅ URL Map: `api-gateway-url-map`
4. ✅ SSL Certificate: `api-localplus-ssl` (Google-managed)
5. ✅ HTTPS Target Proxy: `api-gateway-https-proxy`
6. ✅ Static IP: `api-gateway-ip`
7. ✅ Forwarding Rule: `api-gateway-forwarding-rule`

---

## 📋 Next Steps

### Step 1: Get Load Balancer IP

```bash
gcloud compute addresses describe api-gateway-ip \
  --global \
  --format='value(address)'
```

### Step 2: Update DNS

**In Cloudflare DNS:**

1. **Delete the existing CNAME record** for `api`
2. **Create a new A record:**
   - **Type:** A
   - **Name:** `api`
   - **IPv4 address:** `[LOAD_BALANCER_IP]`
   - **Proxy status:** OFF (gray cloud - DNS only)
   - **TTL:** Auto

**OR keep CNAME but verify it's correct:**
- If using CNAME, it should point to the Load Balancer hostname (if available)

### Step 3: Wait for DNS Propagation

- **5-15 minutes:** Major DNS servers
- **30-60 minutes:** Global propagation

### Step 4: Wait for SSL Certificate Provisioning

Google-managed SSL certificates take **10-60 minutes** to provision.

Check status:
```bash
gcloud compute ssl-certificates describe api-localplus-ssl \
  --global \
  --format='value(managed.status)'
```

Status should be: `ACTIVE`

### Step 5: Test

```bash
# Test DNS
dig api.localplus.city +short
# Should return: [LOAD_BALANCER_IP]

# Test API
curl https://api.localplus.city/api/events?status=published&limit=5
# Should return: {"success":true,"data":[...]}
```

---

## 🔍 Verification Commands

**Check Load Balancer Status:**
```bash
gcloud compute forwarding-rules describe api-gateway-forwarding-rule \
  --global \
  --format='table(name,IPAddress,status)'
```

**Check SSL Certificate:**
```bash
gcloud compute ssl-certificates describe api-localplus-ssl \
  --global \
  --format='table(name,managed.domains,managed.status)'
```

**Check Backend Service:**
```bash
gcloud compute backend-services describe api-gateway-backend \
  --global \
  --format='table(name,backends[].group)'
```

---

## ⏳ Timeline

- **Load Balancer Setup:** ✅ Complete (5 minutes)
- **DNS Update:** 2 minutes
- **DNS Propagation:** 5-30 minutes
- **SSL Certificate Provisioning:** 10-60 minutes
- **Total Time:** ~15-90 minutes

---

## 🚨 Troubleshooting

**SSL Certificate Not Active:**
- Wait 10-60 minutes for Google to provision
- Verify DNS is pointing to Load Balancer IP
- Check certificate status: `gcloud compute ssl-certificates describe api-localplus-ssl --global`

**502 Bad Gateway:**
- Verify NEG is correctly configured
- Check API Gateway is active
- Verify backend service health

**DNS Not Resolving:**
- Verify A record is correct
- Wait for DNS propagation
- Check with: `dig api.localplus.city`

---

## 📊 Architecture

```
api.localplus.city (DNS A record)
    ↓
Load Balancer IP
    ↓
HTTPS Target Proxy (SSL termination)
    ↓
URL Map
    ↓
Backend Service
    ↓
Serverless NEG
    ↓
API Gateway (localplus-api-gateway)
    ↓
GCF Functions
```

---

## ✅ Success Indicators

1. ✅ DNS resolves to Load Balancer IP
2. ✅ SSL certificate status: ACTIVE
3. ✅ `curl https://api.localplus.city/api/events` returns 200 OK
4. ✅ Mobile app can connect to `api.localplus.city`

