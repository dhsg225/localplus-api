# Update Cloudflare Worker - Add News Routing

## 🎯 Goal
Add `/api/news` routing to the existing Cloudflare Worker so news endpoints work via `api.localplus.city`

## 📋 Steps

### 1. Open Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com
2. Select domain: `localplus.city`
3. Left sidebar → **Workers & Pages**
4. Click on your worker (likely named something like `api-gateway-host-fix` or `api-localplus-city`)

### 2. Edit Worker Code
1. Click **"Edit code"** or **"Quick edit"** button
2. **Replace ALL the code** with the code from `COPY_PASTE_WORKER_CODE.txt`

The updated code includes:
- ✅ `/api/locations` → Direct to GCF
- ✅ `/api/organizers` → Direct to GCF
- ✅ `/api/venues` → Direct to GCF
- ✅ `/api/activities` → Direct to GCF
- ✅ `/api/attractions` → Direct to GCF
- ✅ `/api/news` → Direct to GCF (NEW!)
- ✅ All other endpoints → API Gateway

3. Click **"Save and Deploy"** button

### 3. Wait & Test
1. Wait 30-60 seconds for deployment
2. Test:
   ```bash
   curl https://api.localplus.city/api/news/hua-hin
   # Should return WordPress posts JSON
   ```

## ✅ What This Does

**Before:**
- `/api/news/hua-hin` → API Gateway → 404 (not in config)

**After:**
- `/api/news/hua-hin` → Direct to GCF → 200 OK ✅
- `/api/news/hua-hin/categories` → Direct to GCF → 200 OK ✅
- All other endpoints → API Gateway (as before)

## 🧪 Testing

```bash
# Test news posts
curl https://api.localplus.city/api/news/hua-hin

# Test news categories
curl https://api.localplus.city/api/news/hua-hin/categories

# Test other endpoints (should still work)
curl https://api.localplus.city/api/events/all
```

## 📝 Full Code (for reference)

See `COPY_PASTE_WORKER_CODE.txt` for the complete updated code.

