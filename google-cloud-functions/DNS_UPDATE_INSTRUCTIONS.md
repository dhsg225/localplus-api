# DNS Update Instructions - Fix API CNAME Record

## 🔍 Current Issue

Your `api` CNAME record is currently pointing to **Vercel**, but it needs to point to the **API Gateway**.

---

## ✅ Update Steps

### In Cloudflare DNS (or your DNS provider):

1. **Find the existing `api` CNAME record**
   - Currently points to: `8bfaa6339037e3d3.vercel-...`

2. **Click "Edit" on the `api` record**

3. **Update the Target field:**
   - **Old:** `8bfaa6339037e3d3.vercel-...`
   - **New:** `localplus-api-gateway-101wrq78.uc.gateway.dev`

4. **⚠️ CRITICAL: Turn OFF Proxy (DNS Only Mode)**
   - Toggle the "Proxy status" switch to **OFF** (gray cloud)
   - API Gateway requires **DNS only** mode (not proxied)
   - Proxied mode (orange cloud) will break API Gateway

5. **TTL:** Keep as "Auto" or set to 3600

6. **Click "Save"**

---

## 📋 Correct Configuration

```
Type: CNAME
Name: api
Target: localplus-api-gateway-101wrq78.uc.gateway.dev
Proxy: OFF (gray cloud - DNS only)
TTL: Auto
```

---

## ⏳ After Saving

1. **Wait 5-30 minutes** for DNS propagation

2. **Test DNS resolution:**
   ```bash
   dig api.localplus.city
   # Should return: localplus-api-gateway-101wrq78.uc.gateway.dev
   ```

3. **Test API endpoint:**
   ```bash
   curl https://api.localplus.city/api/events?status=published&limit=5
   # Should return events data
   ```

---

## 🚨 Why Turn Off Proxy?

- **API Gateway** requires direct DNS resolution
- **Cloudflare Proxy** (orange cloud) intercepts requests and can break API Gateway routing
- **DNS Only** (gray cloud) allows requests to go directly to API Gateway

---

## ✅ Verification

Once updated and propagated:

```bash
# Check DNS
nslookup api.localplus.city
# Should show: localplus-api-gateway-101wrq78.uc.gateway.dev

# Test API
curl https://api.localplus.city/api/events
# Should return: {"success":true,"data":[...]}
```

---

## 📝 Summary

**Change:**
- Target: `8bfaa6339037e3d3.vercel-...` → `localplus-api-gateway-101wrq78.uc.gateway.dev`
- Proxy: ON (orange) → OFF (gray)

**Result:**
- `api.localplus.city` will route to API Gateway
- Mobile app will use clean URL
- All API requests go through API Gateway

