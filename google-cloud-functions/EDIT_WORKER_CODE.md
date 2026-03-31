# How to Edit Worker Code in Cloudflare

## 🚨 Problem: Code Seems Unchangeable

**You're on the Worker creation page, but can't edit the code**

---

## ✅ Solutions to Try

### Option 1: Click on the Code (Most Common)

1. **Click directly on the code** in the "Worker preview" section
2. The code should become editable
3. You should see a blinking cursor
4. Select all (Cmd+A / Ctrl+A)
5. Delete and paste new code

### Option 2: Look for Edit Button

1. Look for an **"Edit"** button or **pencil icon** near the code
2. Click it to enable editing
3. Then edit the code

### Option 3: Use Template Instead

**If the preview is truly read-only:**

1. Click **"Back"** button
2. Click **"Select a template"** instead
3. Choose a **blank** or **empty** template
4. This should give you an editable code editor

### Option 4: Deploy First, Then Edit

**Sometimes you need to deploy first:**

1. Click **"Deploy"** with the default code
2. After deployment, go to the Worker dashboard
3. Click on your worker name
4. You should see an editable code editor
5. Edit the code there
6. Save and deploy again

---

## 📋 Recommended Approach

**Try this order:**

1. **First:** Click directly on the code in "Worker preview"
2. **If that doesn't work:** Look for Edit button
3. **If still not working:** Deploy first, then edit after

---

## 💡 What You Should See

**When code is editable:**
- ✅ Cursor appears when you click
- ✅ Text highlights when you select
- ✅ You can type/delete
- ✅ Code editor looks active

**If code is read-only:**
- ❌ No cursor
- ❌ Can't select text
- ❌ Looks like a preview/image

---

## 🎯 After Code is Editable

**Replace with this code:**

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

**Then:**
1. Click **"Deploy"** button
2. Wait for deployment
3. Go to Workers Routes
4. Add route: `api.localplus.city/*`

