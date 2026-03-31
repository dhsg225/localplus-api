# Cloudflare Worker Setup - Modify Host Header (FREE)

## ✅ Why Workers?

**Transform Rules** requires Pro plan ($20/month) ❌
**Snippets** requires Pro/Business/Enterprise plan ❌
**Workers** is FREE and achieves the same result! ✅

**Workers Free Tier:**
- ✅ 100,000 requests per day
- ✅ Unlimited workers
- ✅ Perfect for our use case!

---

## 📋 Step-by-Step Setup

### Step 1: Create the Worker

**In Cloudflare Dashboard:**
1. Left sidebar → **"Workers & Pages"**
2. Click **"Workers"** tab (or "Create Worker" button if visible)
3. Click **"Create Worker"** button
4. You'll see the Worker editor

---

### Step 2: Create Worker

**Worker Name:** `api-gateway-host-fix` (or any name you like)

**Replace the default code with this:**

```javascript
export default {
  async fetch(request) {
    // Get the original URL
    const url = new URL(request.url);
    
    // Change the host to API Gateway
    url.hostname = 'localplus-api-gateway-101wrq78.uc.gateway.dev';
    
    // Create new headers with modified Host
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'localplus-api-gateway-101wrq78.uc.gateway.dev');
    
    // Create new request with modified URL and headers
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow'
    });
    
    // Forward request to API Gateway
    const response = await fetch(newRequest);
    
    // Return response
    return response;
  }
}
```

**Click "Save and Deploy"**

---

### Step 3: Add Route (Current UI - Workers Routes)

**After deploying the worker:**

1. Go to **Workers & Pages** → **Workers Routes** (in left sidebar)
2. You'll see the "Workers Routes" page with:
   - **HTTP Routes** section (top, gray box)
   - **Workers KV** section (bottom, gray box)
3. In the **HTTP Routes** section, click the blue **"Add route"** button
4. **Route:** Enter `api.localplus.city/*`
5. **Worker:** Select your worker from dropdown (`api-gateway-host-fix`)
6. Click **"Save"** or **"Add route"**

**The route will appear in the table:**
- **Route** column: `api.localplus.city/*`
- **Worker** column: `api-gateway-host-fix`

---

### Step 4: Test

**Wait 1-2 minutes, then test:**

```bash
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Should return:** `{"success":true,"data":[...]}`

---

## 🎯 What This Does

**Before Worker:**
```
Request: api.localplus.city/api/events
    ↓
Cloudflare (Host: api.localplus.city)
    ↓
API Gateway (rejects - wrong Host) → 404
```

**After Worker:**
```
Request: api.localplus.city/api/events
    ↓
Cloudflare Worker (changes Host header)
    ↓
API Gateway (accepts - correct Host) → 200 OK
```

---

## ✅ Benefits

- ✅ **FREE** (no cost)
- ✅ Works on Free plan
- ✅ Modifies Host header correctly
- ✅ Routes to API Gateway
- ✅ SSL included (Cloudflare)

---

## 🧪 Testing

**After setup:**

```bash
# Test API
curl https://api.localplus.city/api/events?status=published&limit=5

# Should return JSON data
```

---

## 🚨 Troubleshooting

### Worker Not Triggering

**Check:**
1. Route is correct: `api.localplus.city/*`
2. Worker is deployed
3. Wait 1-2 minutes for propagation

### Still Getting 404

**Check:**
1. Worker code is correct (copy-paste exactly)
2. Route is active
3. Test worker directly: Go to Workers → Your worker → Test

### 502 Bad Gateway

**Check:**
1. Gateway URL is correct in worker code
2. API Gateway is active
3. SSL/TLS mode is "Full"

---

## 📝 Summary

**Setup:**
1. Create Worker with code above
2. Add route: `api.localplus.city/*`
3. Deploy
4. Test

**Result:**
- ✅ `api.localplus.city` works
- ✅ SSL included
- ✅ FREE
- ✅ No Load Balancer needed

---

## 💡 Alternative: Simpler Worker Code

**If the above doesn't work, try this simpler version:**

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = 'localplus-api-gateway-101wrq78.uc.gateway.dev';
    
    return fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
}
```

This automatically forwards the Host header correctly.

