# Cloudflare Setup - Troubleshooting 404 Error

## ✅ What's Working

- ✅ **DNS:** Resolving to Cloudflare IPs (104.21.8.44, 172.67.156.212)
- ✅ **SSL Certificate:** Valid (Google Trust Services)
- ✅ **Cloudflare Proxy:** Active

## ❌ Issue: 404 Not Found

The API endpoint is returning 404, which suggests:
- Cloudflare is connecting ✅
- But the request isn't reaching the API Gateway correctly ⚠️

---

## 🔧 Troubleshooting Steps

### Step 1: Verify CNAME Target

**In Cloudflare Dashboard:**
1. Go to **DNS** → **Records**
2. Check the `api` CNAME record:
   - **Target should be:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
   - **Proxy:** ON (orange cloud) ✅

**Common mistakes:**
- ❌ Missing `.dev` at the end
- ❌ Wrong gateway name
- ❌ Extra spaces or characters

---

### Step 2: Check SSL/TLS Mode

**In Cloudflare Dashboard:**
1. Go to **SSL/TLS** → **Overview**
2. Check the mode:
   - ✅ **Full** (recommended)
   - ✅ **Full (Strict)** (if gateway has valid cert)
   - ❌ **Flexible** (won't work - no encryption to origin)
   - ❌ **Off** (won't work)

**If it's "Flexible" or "Off":**
- Change to **Full**
- Wait 1-2 minutes
- Test again

---

### Step 3: Test Gateway URL Directly

```bash
curl https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events?status=published&limit=5
```

**If this works:**
- Gateway is fine ✅
- Issue is with Cloudflare routing ⚠️

**If this doesn't work:**
- Gateway might be down ❌
- Check API Gateway status in GCP Console

---

### Step 4: Clear Cloudflare Cache

**In Cloudflare Dashboard:**
1. Go to **Caching** → **Configuration**
2. Click **Purge Everything**
3. Wait 1-2 minutes
4. Test again

**Or via API:**
```bash
# If you have Cloudflare API token
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

### Step 5: Check Page Rules

**In Cloudflare Dashboard:**
1. Go to **Rules** → **Page Rules**
2. Check if any rules are affecting `api.localplus.city`
3. If caching is enabled, disable it for APIs:
   - Pattern: `api.localplus.city/*`
   - Setting: Cache Level = Bypass

---

### Step 6: Wait for Full Propagation

**Timeline:**
- DNS: Usually instant (1-2 minutes)
- SSL: 5-10 minutes
- Full routing: 10-15 minutes

**If it's been less than 15 minutes:**
- Wait a bit longer
- Test again

---

## 🧪 Diagnostic Commands

```bash
# 1. Check DNS
dig api.localplus.city +short
# Should return Cloudflare IPs

# 2. Check SSL
echo | openssl s_client -connect api.localplus.city:443 -servername api.localplus.city 2>/dev/null | grep "Verify return code"
# Should return: Verify return code: 0 (ok)

# 3. Test API with headers
curl -v https://api.localplus.city/api/events?status=published&limit=5
# Check the response headers

# 4. Test gateway directly
curl https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events?status=published&limit=5
# Should work if gateway is fine
```

---

## ✅ Expected Configuration

**DNS Record:**
```
Type: CNAME
Name: api
Target: localplus-api-gateway-101wrq78.uc.gateway.dev
Proxy: ON (orange cloud)
TTL: Auto
```

**SSL/TLS Mode:**
- **Full** or **Full (Strict)**

**Page Rules:**
- None, or Cache Level = Bypass for `api.localplus.city/*`

---

## 🎯 Most Likely Fixes

1. **SSL/TLS mode wrong** → Change to "Full"
2. **CNAME target incorrect** → Verify exact gateway URL
3. **Cache issue** → Purge Cloudflare cache
4. **Propagation delay** → Wait 10-15 minutes

---

## 📝 After Fix

Once working:
- ✅ `api.localplus.city` will work
- ✅ Mobile app will connect automatically
- ✅ Can delete GCP Load Balancer (save $18/month)

