# Fixing Cloudflare 404 Error (SSL Mode Already Correct)

## ✅ What's Already Correct

- ✅ SSL/TLS Mode: **Full** (correct)
- ✅ DNS: Resolving to Cloudflare
- ✅ SSL Certificate: Valid
- ✅ Gateway URL: Works directly

## ❌ Issue: 404 Through Cloudflare

The API returns 404 when accessed through `api.localplus.city`, but works directly via gateway URL.

---

## 🔍 Most Likely Causes

### 1. CNAME Target Incorrect

**Check in Cloudflare:**
- Go to **DNS** → **Records**
- Find the `api` CNAME record
- **Target must be EXACTLY:** `localplus-api-gateway-101wrq78.uc.gateway.dev`

**Common mistakes:**
- ❌ Missing `.dev` at the end
- ❌ Extra spaces before/after
- ❌ Trailing slash
- ❌ Wrong gateway name
- ❌ Typo in the URL

**Fix:**
- Edit the CNAME record
- Copy-paste the exact gateway URL
- Save and wait 2-5 minutes

---

### 2. Cloudflare Caching 404

**If Cloudflare cached a 404 response:**
- It will keep returning 404 even after fixing DNS

**Fix:**
1. Go to **Caching** → **Configuration**
2. Click **"Purge Everything"**
3. Wait 1-2 minutes
4. Test again

**Or create Page Rule:**
- Pattern: `api.localplus.city/*`
- Setting: Cache Level = **Bypass**

---

### 3. Page Rules Interfering

**Check:**
1. Go to **Rules** → **Page Rules**
2. Look for any rules matching `api.localplus.city` or `*.localplus.city`
3. If found, either:
   - Delete the rule
   - Or modify to exclude API paths

**Common problematic rules:**
- Caching rules
- Redirect rules
- Security rules that block APIs

---

### 4. Host Header Issue

**API Gateway might be checking the Host header:**
- Cloudflare sends: `Host: api.localplus.city`
- Gateway expects: `Host: localplus-api-gateway-101wrq78.uc.gateway.dev`

**Fix (if this is the issue):**
- Create Transform Rule in Cloudflare:
  - Go to **Rules** → **Transform Rules** → **Modify Request Header**
  - Pattern: `api.localplus.city/*`
  - Action: Set Host header to `localplus-api-gateway-101wrq78.uc.gateway.dev`

---

### 5. Propagation Delay

**If you just made changes:**
- Wait 10-15 minutes
- DNS changes can take time
- Cloudflare routing can take time

---

## 🧪 Diagnostic Steps

### Step 1: Verify CNAME Target

```bash
# Check what DNS resolves to
dig api.localplus.city +short

# Should show Cloudflare IPs, not gateway URL
# (Because proxy is ON)
```

### Step 2: Test Gateway Directly

```bash
# This should work
curl https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events?status=published&limit=5
```

### Step 3: Check Cloudflare Logs

**In Cloudflare Dashboard:**
1. Go to **Analytics** → **Logs**
2. Look for requests to `api.localplus.city`
3. Check the response codes
4. See if there are any errors

---

## 🔧 Step-by-Step Fix

### Fix 1: Verify and Fix CNAME

1. **Cloudflare Dashboard** → **DNS** → **Records**
2. Find `api` CNAME record
3. Click **Edit**
4. **Target field:** Verify it's exactly:
   ```
   localplus-api-gateway-101wrq78.uc.gateway.dev
   ```
5. **No trailing slash, no spaces**
6. Click **Save**
7. Wait 2-5 minutes

### Fix 2: Purge Cache

1. **Cloudflare Dashboard** → **Caching** → **Configuration**
2. Click **"Purge Everything"**
3. Wait 1-2 minutes
4. Test again

### Fix 3: Create Bypass Rule (Optional)

1. **Cloudflare Dashboard** → **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. **URL pattern:** `api.localplus.city/*`
4. **Settings:**
   - Cache Level: **Bypass**
5. Click **Save and Deploy**
6. Wait 1-2 minutes

---

## ✅ Verification

After fixes, test:

```bash
# Should return 200 OK with JSON data
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Expected response:**
```json
{"success":true,"data":[...],"pagination":{...}}
```

---

## 🎯 Most Common Fix

**90% of the time, it's one of these:**

1. **CNAME target has a typo** → Fix the target
2. **Cloudflare cached 404** → Purge cache
3. **Just changed, needs time** → Wait 10-15 minutes

---

## 📝 Checklist

- [ ] CNAME target is exactly: `localplus-api-gateway-101wrq78.uc.gateway.dev`
- [ ] No trailing slash or spaces
- [ ] Proxy is ON (orange cloud)
- [ ] SSL/TLS mode is "Full" ✅ (already correct)
- [ ] Cache purged
- [ ] No interfering Page Rules
- [ ] Waited 10-15 minutes after changes

---

## 🚨 If Still Not Working

**Check API Gateway status:**
```bash
gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --format='value(state)'
```

**Should return:** `ACTIVE`

**If gateway is down:**
- Check GCP Console for errors
- Verify gateway is deployed correctly

