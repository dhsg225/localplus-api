# Update Cloudflare Worker for Locations Endpoint

## 🎯 Goal
Add `/api/locations` and `/api/organizers` routing to the existing Cloudflare Worker

## 📋 Steps

### 1. Open Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com
2. Select domain: `localplus.city`
3. Left sidebar → **Workers & Pages**
4. Click on your worker: `api-gateway-host-fix` (or whatever you named it)

### 2. Edit Worker Code
1. Click **"Edit code"** or **"Quick edit"** button
2. **Replace ALL the code** with this updated version:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // [2025-12-01] - Route /api/locations and /api/organizers directly to GCF
    // These are not yet in the API Gateway config
    if (path.startsWith('/api/locations')) {
      url.hostname = 'localplus-api-locations-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/locations', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    if (path.startsWith('/api/organizers')) {
      url.hostname = 'localplus-api-organizers-jdyddatgcq-uc.a.run.app';
      url.pathname = path.replace('/api/organizers', '');
      if (url.pathname === '') url.pathname = '/';
      
      return fetch(url.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // All other requests go to API Gateway
    url.hostname = 'localplus-api-gateway-101wrq78.uc.gateway.dev';
    
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'localplus-api-gateway-101wrq78.uc.gateway.dev');
    
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow'
    });
    
    return fetch(newRequest);
  }
}
```

3. Click **"Save and Deploy"** button

### 3. Wait & Test
1. Wait 30-60 seconds for deployment
2. Test:
   ```bash
   curl https://api.localplus.city/api/locations
   # Should return: {"success":true,"data":[...170 locations...]}
   ```

## ✅ What This Does

**Before:**
- `/api/locations` → API Gateway → 404 (not in config)

**After:**
- `/api/locations` → Direct to GCF → 200 OK ✅
- `/api/organizers` → Direct to GCF → 200 OK ✅
- All other endpoints → API Gateway (as before)

## 🧪 Testing

```bash
# Test locations
curl https://api.localplus.city/api/locations

# Test organizers
curl https://api.localplus.city/api/organizers

# Test events (via API Gateway)
curl https://api.localplus.city/api/events/all
```

All should return `{"success":true,"data":[...]}`

