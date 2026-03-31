# Create Worker First - Step by Step

## 🚨 Problem: No Workers Available

**You're trying to add a route, but the Worker dropdown shows "None"**

**Solution:** Create the worker first, then add the route.

---

## ✅ Step-by-Step: Create Worker

### Step 1: Navigate to Workers

**You're currently on: Workers & Pages overview page**

**You see:**
- "No projects found" message
- Blue **"Create application"** button (top right)

### Step 2: Create New Worker

1. Click the blue **"Create application"** button (top right)
2. You'll see the "Ship something new" page with options
3. Click **"Start with Hello World!"** button (green globe icon)
4. This creates a basic Worker template
5. You'll see the Worker editor

### Step 3: Name the Worker

**In the Worker editor:**
1. Look for a name field (usually at the top or in settings)
2. Enter: `api-gateway-host-fix`
3. (Or any name you prefer - this is just for identification)

### Step 4: Replace Default Code

**The code should be editable in the "Worker preview" section:**

1. **Click directly on the code** in the "Worker preview" area
2. The code should become editable (cursor should appear)
3. **Select all** (Cmd+A or Ctrl+A)
4. **Delete** the default code
5. **Paste this code:**

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

### Step 5: Deploy

1. Click **"Save and Deploy"** button (usually bottom right)
2. Wait for deployment to complete (usually 10-30 seconds)
3. You should see a success message

---

## ✅ Step 6: Now Add the Route

**After the worker is deployed:**

1. Go back to **Workers & Pages** → **Workers Routes**
2. Click **"Add route"** button
3. **Route:** `api.localplus.city/*`
4. **Worker dropdown:** Now you should see `api-gateway-host-fix` in the list!
5. Select it
6. Click **"Save"**

---

## 🎯 What This Worker Does

**The worker:**
- Intercepts requests to `api.localplus.city`
- Changes the Host header to match API Gateway
- Forwards the request to Google Cloud API Gateway
- Returns the response

**Result:**
- ✅ Clean URL: `api.localplus.city`
- ✅ SSL included (Cloudflare)
- ✅ FREE
- ✅ Works with API Gateway

---

## 🧪 Test After Setup

**Wait 1-2 minutes after adding the route, then:**

```bash
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Should return:** JSON data with events

---

## 📋 Quick Checklist

- [ ] Go to Workers & Pages → Workers
- [ ] Click "Create Worker"
- [ ] Name: `api-gateway-host-fix`
- [ ] Paste the code above
- [ ] Save and Deploy
- [ ] Go back to Workers Routes
- [ ] Click "Add route"
- [ ] Route: `api.localplus.city/*`
- [ ] Select worker from dropdown
- [ ] Save
- [ ] Test!

---

## 💡 Why This Order?

**You can't add a route without a worker:**
- Route = URL pattern (`api.localplus.city/*`)
- Worker = Code that handles the request
- Route needs to point to a worker

**So:**
1. Create worker first ✅
2. Then add route that uses the worker ✅

