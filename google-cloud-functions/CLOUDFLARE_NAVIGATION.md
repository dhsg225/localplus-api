# Cloudflare Navigation - Workers Routes Setup

## 📍 Current Location

You're at: **Workers & Pages → Workers Routes**

## 🎯 What You're Looking At

**Workers Routes Page:**
- **HTTP Routes** section (top) - This is where you add routes
- **Workers KV** section (bottom) - Not needed for this setup
- **Add route** button (blue button in HTTP Routes section)

---

## 🗺️ Step-by-Step: Adding a Route

### You're Already in the Right Place!

**Current Page: Workers Routes**

### Step 1: Create Worker First (if not done)

**If you haven't created the worker yet:**
1. Go to **Workers & Pages** → **Workers** (in left sidebar)
2. Click **"Create Worker"** button
3. Name: `api-gateway-host-fix`
4. Paste the worker code (see below)
5. Click **"Save and Deploy"**

### Step 2: Add Route (You're Here!)

**On the Workers Routes page:**

1. In the **HTTP Routes** section, click the blue **"Add route"** button
2. **Route field:** Enter `api.localplus.city/*`
3. **Worker dropdown:** Select your worker (`api-gateway-host-fix`)
4. Click **"Save"** or **"Add route"**

**The route will appear in the table below:**
- **Route** column: Shows `api.localplus.city/*`
- **Worker** column: Shows your worker name

---

## 💡 Worker Code (if you need it)

```javascript
export default {
  async fetch(request) {
    // Clone the request
    const url = new URL(request.url);
    
    // Change the host header
    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', 'localplus-api-gateway-101wrq78.uc.gateway.dev');
    
    // Create new request with modified headers
    const newRequest = new Request(url, {
      method: request.method,
      headers: newHeaders,
      body: request.body
    });
    
    // Forward to API Gateway
    return fetch(newRequest);
  }
}
```

4. Deploy the worker
5. Go to **Workers Routes** (where you are now)
6. Click **"Add route"** in HTTP Routes section
7. Route: `api.localplus.city/*`
8. Worker: Select your worker
9. Save

---

## 📋 Quick Checklist

- [x] You're on Workers Routes page ✅
- [ ] Worker created and deployed
- [ ] Click "Add route" in HTTP Routes section
- [ ] Enter route: `api.localplus.city/*`
- [ ] Select worker from dropdown
- [ ] Save route
- [ ] Test: `curl https://api.localplus.city/api/events`

---

## 🎯 Current UI Elements

**What you see:**
- **HTTP Routes** section (top) - This is where routes are managed
- **"Add route"** button (blue, in HTTP Routes section)
- **Table** with columns: "Route" and "Worker" (currently empty)
- **Workers KV** section (bottom) - Not needed for this

**What to do:**
1. Click **"Add route"** button
2. Fill in the route and select worker
3. Save

