# Cloudflare 404 Fix - Host Header Issue

## ✅ Configuration Verified

- ✅ CNAME target: `localplus-api-gateway-101wrq78.uc.gateway.dev` (correct)
- ✅ Page Rules: None (no interference)
- ✅ SSL/TLS: Full (correct)
- ✅ Proxy: ON (orange cloud)

## ❌ Still Getting 404

Since configuration is correct, the issue is likely:

---

## 🔍 Root Cause: Host Header Mismatch

**The Problem:**
- Cloudflare sends: `Host: api.localplus.city`
- API Gateway expects: `Host: localplus-api-gateway-101wrq78.uc.gateway.dev`
- Gateway rejects requests with wrong Host header → 404

**Why this happens:**
- API Gateway validates the Host header
- It only accepts requests with its own hostname
- Cloudflare changes the Host header to the custom domain

---

## 🔧 Solution: Transform Rule (Modify Host Header)

### Step 1: Create Transform Rule

**In Cloudflare Dashboard:**

1. Go to **Rules** → **Transform Rules** → **Modify Request Header**
2. Click **"Create rule"**
3. **Rule name:** `API Gateway Host Header`
4. **When incoming requests match:**
   - **Field:** Hostname
   - **Operator:** equals
   - **Value:** `api.localplus.city`
5. **Then:**
   - **Action:** Set static
   - **Header name:** `Host`
   - **Value:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
6. Click **Deploy**

---

### Step 2: Alternative - Purge Cache First

**Before creating Transform Rule, try this:**

1. Go to **Caching** → **Configuration**
2. Click **"Purge Everything"**
3. Wait 2-3 minutes
4. Test: `curl https://api.localplus.city/api/events`

**If still 404, then create the Transform Rule above.**

---

## 🧪 Testing

**After creating Transform Rule:**

```bash
# Should return 200 OK with JSON data
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Expected response:**
```json
{"success":true,"data":[...],"pagination":{...}}
```

---

## 📋 Step-by-Step: Create Transform Rule

### In Cloudflare Dashboard:

1. **Navigate to:** Rules → Transform Rules → Modify Request Header
2. **Click:** "Create rule"
3. **Rule name:** `API Gateway Host Header Fix`
4. **Matching condition:**
   ```
   Field: Hostname
   Operator: equals
   Value: api.localplus.city
   ```
5. **Action:**
   ```
   Action: Set static
   Header name: Host
   Value: localplus-api-gateway-101wrq78.uc.gateway.dev
   ```
6. **Click:** Deploy
7. **Wait:** 1-2 minutes
8. **Test:** `curl https://api.localplus.city/api/events`

---

## ✅ Verification

**After Transform Rule is created:**

1. **Test API:**
   ```bash
   curl https://api.localplus.city/api/events?status=published&limit=5
   ```
   Should return: `{"success":true,"data":[...]}`

2. **Check in Cloudflare:**
   - Go to **Rules** → **Transform Rules**
   - Verify rule is **Active**
   - Check it matches `api.localplus.city`

---

## 🎯 Why This Works

**Before Transform Rule:**
```
Request: Host: api.localplus.city
    ↓
Cloudflare Proxy
    ↓
API Gateway (rejects - wrong Host) → 404
```

**After Transform Rule:**
```
Request: Host: api.localplus.city
    ↓
Cloudflare Proxy
    ↓
Transform Rule: Changes Host to gateway URL
    ↓
API Gateway (accepts - correct Host) → 200 OK
```

---

## 📝 Summary

**Issue:** Host header mismatch
- Cloudflare sends custom domain
- Gateway expects gateway hostname

**Fix:** Transform Rule to modify Host header
- Changes `Host: api.localplus.city` → `Host: localplus-api-gateway-101wrq78.uc.gateway.dev`

**Result:** API Gateway accepts requests → 200 OK ✅

---

## 🚨 If Transform Rule Doesn't Work

**Alternative solutions:**

1. **Check API Gateway config:**
   - Verify gateway accepts requests from Cloudflare IPs
   - Check if there are IP restrictions

2. **Try "Full (Strict)" SSL mode:**
   - If gateway has valid cert, try "Full (Strict)"
   - Otherwise keep "Full"

3. **Contact Cloudflare support:**
   - If nothing works, might be a Cloudflare routing issue

---

## ✅ Expected Result

Once Transform Rule is active:
- ✅ `api.localplus.city` works
- ✅ SSL certificate valid
- ✅ API returns data
- ✅ Mobile app connects automatically
- ✅ FREE (no Load Balancer needed)

