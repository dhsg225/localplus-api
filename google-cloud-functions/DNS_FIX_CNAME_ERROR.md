# Fix: "Content for CNAME record is invalid"

## ❌ The Problem

You're trying to update a **CNAME record** with an IP address (`34.8.225.222`), but:
- **CNAME records** can only point to **domain names** (like `example.com`)
- **A records** point to **IP addresses** (like `34.8.225.222`)

## ✅ The Solution

You need to **delete the CNAME** and **create an A record** instead.

---

## 📝 Step-by-Step Instructions

### In Cloudflare DNS:

**Step 1: Delete the CNAME Record**
1. Find the `api` CNAME record
2. Click **"Delete"** (or the trash icon)
3. Confirm deletion

**Step 2: Create a New A Record**
1. Click **"Add record"**
2. Select **Type: A** (NOT CNAME)
3. Fill in:
   - **Name:** `api`
   - **IPv4 address:** `34.8.225.222`
   - **Proxy status:** OFF (gray cloud - DNS only)
   - **TTL:** Auto
4. Click **"Save"**

---

## 📋 Correct Configuration

```
Type: A (NOT CNAME)
Name: api
IPv4 address: 34.8.225.222
Proxy: OFF (gray cloud)
TTL: Auto
```

---

## ⚠️ Important Notes

- **A record** = Points to IP address ✅
- **CNAME record** = Points to domain name ❌ (won't work with IP)

---

## 🧪 After Saving

Wait 5-30 minutes for DNS propagation, then test:

```bash
# Check DNS
dig api.localplus.city +short
# Should return: 34.8.225.222

# Test API (after SSL certificate is active - 10-60 minutes)
curl https://api.localplus.city/api/events?status=published&limit=5
```

---

## ✅ Success

Once the A record is created:
- DNS will resolve `api.localplus.city` to `34.8.225.222`
- Load Balancer will route to API Gateway
- SSL certificate will provision (10-60 minutes)
- Mobile app will work with `api.localplus.city`

