# Testing DNS Propagation for api.localplus.city

## 🎯 What We're Checking

Verify that `api.localplus.city` resolves to:
```
localplus-api-gateway-101wrq78.uc.gateway.dev
```

---

## 🧪 Test Methods

### Method 1: Using `dig` (Most Detailed)

```bash
dig api.localplus.city +short
```

**Expected Output:**
```
localplus-api-gateway-101wrq78.uc.gateway.dev
```

**If you see the Vercel URL instead:**
```
8bfaa6339037e3d3.vercel-...
```
→ DNS hasn't propagated yet, or update wasn't saved

---

### Method 2: Using `nslookup`

```bash
nslookup api.localplus.city
```

**Expected Output:**
```
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
Name:	api.localplus.city
Address: [IP address or CNAME chain]
```

Look for the CNAME pointing to `localplus-api-gateway-101wrq78.uc.gateway.dev`

---

### Method 3: Using `host`

```bash
host api.localplus.city
```

**Expected Output:**
```
api.localplus.city is an alias for localplus-api-gateway-101wrq78.uc.gateway.dev
```

---

### Method 4: Direct API Test (Best Test!)

```bash
curl https://api.localplus.city/api/events?status=published&limit=5
```

**Expected Output:**
```json
{"success":true,"data":[...],"pagination":{...}}
```

**If you get:**
- `200 OK` with JSON data → ✅ DNS is working!
- `502 Bad Gateway` → DNS propagated but gateway issue
- `Could not resolve host` → DNS hasn't propagated yet
- `404 Not Found` → DNS points to wrong target

---

### Method 5: Check Different DNS Servers

**Google DNS (8.8.8.8):**
```bash
dig @8.8.8.8 api.localplus.city +short
```

**Cloudflare DNS (1.1.1.1):**
```bash
dig @1.1.1.1 api.localplus.city +short
```

**Your ISP DNS:**
```bash
dig api.localplus.city +short
```

If all return the same result, DNS has propagated globally.

---

## ✅ Quick Test Script

```bash
#!/bin/bash
echo "Testing DNS for api.localplus.city..."
echo ""

echo "1. DNS Resolution:"
RESULT=$(dig api.localplus.city +short)
echo "   $RESULT"
echo ""

if [[ "$RESULT" == *"localplus-api-gateway"* ]]; then
    echo "✅ DNS is pointing to API Gateway!"
else
    echo "❌ DNS is NOT pointing to API Gateway"
    echo "   Current: $RESULT"
    echo "   Expected: localplus-api-gateway-101wrq78.uc.gateway.dev"
fi

echo ""
echo "2. API Test:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.localplus.city/api/events?status=published&limit=5)
echo "   HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ API is working!"
else
    echo "❌ API returned $HTTP_CODE"
fi
```

---

## 📊 Expected Results

| Test | Expected Result | Status |
|------|----------------|--------|
| `dig api.localplus.city` | `localplus-api-gateway-101wrq78.uc.gateway.dev` | ✅ |
| `curl https://api.localplus.city/api/events` | `200 OK` with JSON | ✅ |
| `nslookup api.localplus.city` | Shows CNAME to gateway | ✅ |

---

## ⏳ Propagation Timeline

- **Immediate:** Your DNS provider's servers (if you just updated)
- **5-15 minutes:** Major DNS servers (Google, Cloudflare)
- **30-60 minutes:** Global propagation
- **Up to 48 hours:** Some edge cases (rare)

---

## 🚨 Troubleshooting

**DNS still shows Vercel:**
- Check if you saved the DNS record
- Verify proxy is OFF (gray cloud)
- Wait 5-15 more minutes

**DNS shows gateway but API returns 502:**
- Gateway might be down (check GCP Console)
- SSL certificate issue
- Try direct gateway URL: `https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events`

**DNS shows gateway but API returns 404:**
- Check API Gateway config
- Verify endpoint path: `/api/events`
- Check gateway logs in GCP Console

---

## 🎯 Quick Command

```bash
# One-liner to test everything
echo "DNS: $(dig api.localplus.city +short)" && echo "API: $(curl -s -o /dev/null -w '%{http_code}' https://api.localplus.city/api/events)"
```

