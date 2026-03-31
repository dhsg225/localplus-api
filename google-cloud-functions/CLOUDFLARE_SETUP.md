# Cloudflare Setup for api.localplus.city

## 🎯 Goal

**YES - You Get the Clean URL!** ✅

Use Cloudflare's free proxy to:
- ✅ **Get clean URL: `api.localplus.city`** ← This is what you want!
- ✅ SSL certificate (automatic)
- ✅ FREE (no cost)
- ✅ DDoS protection bonus

**Result:** `api.localplus.city` works perfectly with SSL, completely FREE!

---

## 📋 Setup Steps

### Step 1: Update DNS in Cloudflare

**In Cloudflare Dashboard:**

1. Go to your domain: `localplus.city`
2. Navigate to **DNS** → **Records**
3. Find or create the `api` record:

**If CNAME exists:**
- Click **Edit** on the `api` CNAME record
- **Target:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
- **Proxy status:** **ON** (orange cloud) ⚠️ **IMPORTANT**
- **TTL:** Auto
- Click **Save**

**If A record exists:**
- **Delete** the A record
- **Create** new CNAME record:
  - **Type:** CNAME
  - **Name:** `api`
  - **Target:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
  - **Proxy status:** **ON** (orange cloud) ⚠️ **IMPORTANT**
  - **TTL:** Auto
  - Click **Save**

---

### Step 2: Verify Proxy is ON

**Critical:** Proxy must be **ON** (orange cloud) for:
- ✅ SSL to work
- ✅ Free features to work
- ✅ Custom domain to work

**Visual Check:**
- ✅ Orange cloud = Proxy ON (correct)
- ❌ Gray cloud = DNS only (won't work for free SSL)

---

### Step 3: Wait for DNS Propagation

- **Cloudflare:** Usually instant (1-2 minutes)
- **Global DNS:** 5-30 minutes

---

### Step 4: SSL Certificate (Automatic)

**Cloudflare automatically:**
- ✅ Provisions SSL certificate
- ✅ Enables HTTPS
- ✅ Usually takes 1-5 minutes

**Check SSL Status:**
- Go to **SSL/TLS** → **Overview**
- Should show: **Full (Strict)** or **Full**

---

### Step 5: Test

**After DNS propagates:**

```bash
# Test DNS
dig api.localplus.city +short
# Should return Cloudflare IPs (not gateway URL directly)

# Test API
curl https://api.localplus.city/api/events?status=published&limit=5
# Should return: {"success":true,"data":[...]}
```

---

## ⚙️ Cloudflare Settings

### SSL/TLS Mode

**Recommended:** **Full (Strict)**
- Go to **SSL/TLS** → **Overview**
- Set to: **Full (Strict)**
- This ensures end-to-end encryption

**If Full (Strict) doesn't work:**
- Try **Full** (less strict, but still secure)
- This allows Cloudflare to connect to API Gateway

---

### Page Rules (Optional)

**If you need specific routing:**
- Go to **Rules** → **Page Rules**
- Create rule for `api.localplus.city/*`
- Settings: Cache Level = Bypass (for APIs)

---

## 🧪 Testing Checklist

- [ ] DNS record created/updated
- [ ] Proxy is ON (orange cloud)
- [ ] DNS propagated (check with `dig`)
- [ ] SSL certificate active (check in Cloudflare dashboard)
- [ ] API endpoint works: `curl https://api.localplus.city/api/events`
- [ ] Mobile app can connect

---

## ✅ Success Indicators

1. ✅ DNS resolves to Cloudflare IPs
2. ✅ SSL certificate shows as "Active" in Cloudflare
3. ✅ `curl https://api.localplus.city/api/events` returns data
4. ✅ No SSL errors in browser/mobile app

---

## 🚨 Troubleshooting

### SSL Certificate Not Working

**Check:**
1. Proxy is ON (orange cloud) ✅
2. SSL/TLS mode is "Full" or "Full (Strict)"
3. Wait 5-10 minutes for certificate provisioning

**Fix:**
- Ensure proxy is ON
- Check SSL/TLS settings in Cloudflare dashboard

### 502 Bad Gateway

**Possible causes:**
- API Gateway might be down
- SSL/TLS mode too strict
- Cloudflare can't reach API Gateway

**Fix:**
- Test gateway URL directly: `https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events`
- If gateway works, try SSL/TLS mode "Full" instead of "Full (Strict)"

### DNS Not Resolving

**Check:**
- DNS record exists in Cloudflare
- Proxy is ON
- Wait for propagation (5-30 minutes)

**Fix:**
- Verify DNS record configuration
- Check Cloudflare dashboard shows record

---

## 📊 Architecture

```
Mobile App
    ↓
https://api.localplus.city/api/events
    ↓
Cloudflare Proxy (SSL termination)
    ↓
https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events
    ↓
API Gateway
    ↓
GCF Functions
```

---

## 💰 Cost

**Cloudflare:** FREE ✅
- Free tier includes:
  - SSL certificates
  - DDoS protection
  - Basic analytics
  - Unlimited requests

**No hidden costs!**

---

## 🎯 Next Steps

1. **Update DNS** in Cloudflare (proxy ON)
2. **Wait 5-10 minutes** for SSL certificate
3. **Test** the endpoint
4. **Update mobile app** (already using `api.localplus.city` - no change needed!)

---

## ✅ Benefits

- ✅ **FREE** (no monthly cost)
- ✅ **Clean URL** (`api.localplus.city`)
- ✅ **SSL included** (automatic)
- ✅ **DDoS protection** (bonus)
- ✅ **Easy setup** (just DNS change)
- ✅ **No infrastructure** to manage

---

## 📝 Summary

**Setup:**
1. Update DNS: CNAME → gateway URL, proxy ON
2. Wait for SSL (5-10 minutes)
3. Done! ✅

**Cost:** FREE forever ✅

**Result:** Clean URL with SSL, no Load Balancer needed!

