# Cloudflare Workers Routes - Current UI Guide

## 📍 You're Here: Workers Routes Page

**Location:** Workers & Pages → Workers Routes

---

## 🎯 What You See

### Left Panel (Main Content)

**Top Section: "Workers Routes"**
- Heading: "Workers Routes"
- Description about mapping URL patterns to Workers
- Two buttons:
  - "Workers Routes documentation" (left)
  - "Manage Workers" (right)

**HTTP Routes Section (Gray Box)**
- Description: "Modify a site's HTTP requests and responses..."
- **Blue "Add route" button** ← **This is what you need!**
- Search and filter area:
  - "Search Routes" input field
  - "Search" button
  - "Worker" dropdown (shows "Show all")
- Table with columns:
  - **Route** (currently empty)
  - **Worker** (currently empty)
  - Message: "You do not have any routes configured. Add a route to get started."
- Pagination controls at bottom

**Workers KV Section (Gray Box)**
- Not needed for this setup
- Can be ignored

### Right Panel (Traffic Sequence)
- Shows request flow diagram
- Not needed for setup, just informational

---

## ✅ Step-by-Step: Add Route

### Step 1: Click "Add route" Button

**In the HTTP Routes section:**
1. Find the blue **"Add route"** button
2. Click it

### Step 2: Fill in Route Details

**A modal or form will appear:**
1. **Route field:** Enter `api.localplus.city/*`
2. **Worker dropdown:** Select your worker (`api-gateway-host-fix`)
3. Click **"Save"** or **"Add route"**

### Step 3: Verify

**The route should appear in the table:**
- **Route** column: `api.localplus.city/*`
- **Worker** column: `api-gateway-host-fix`

---

## 🔧 If Worker Doesn't Exist Yet

**Before adding a route, create the worker:**

**Option A: Use "Manage Workers" button (Easiest!)**
1. On the Workers Routes page, look at the top right
2. Click the blue **"Manage Workers"** button
3. This takes you to the Workers page
4. Click **"Create Worker"** button

**Option B: Use left sidebar**
1. Left sidebar → **Workers & Pages** → **Workers**
2. Click **"Create Worker"** button
3. Name: `api-gateway-host-fix`
4. Paste this code:

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

5. Click **"Save and Deploy"**
6. Then come back to **Workers Routes** to add the route

---

## 🧪 After Adding Route

**Wait 1-2 minutes, then test:**

```bash
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Should return:** JSON data with events

---

## 📋 Summary

**Current Page:** Workers Routes ✅
**Action:** Click "Add route" in HTTP Routes section
**Route:** `api.localplus.city/*`
**Worker:** Select `api-gateway-host-fix`
**Result:** Route appears in table, API works!

