# DNS Setup for API Gateway

## Gateway Information

**Gateway URL:** `localplus-api-gateway-101wrq78.uc.gateway.dev`  
**Target Domain:** `api.localplus.city`

---

## DNS Configuration

### Option 1: Cloudflare (if using Cloudflare DNS)

1. Log in to Cloudflare Dashboard
2. Select domain: `localplus.city`
3. Go to **DNS** → **Records**
4. Add/Edit CNAME record:
   - **Type:** CNAME
   - **Name:** `api`
   - **Target:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
   - **Proxy status:** 🟠 DNS only (gray cloud) - **Important!**
   - **TTL:** Auto

5. Save and wait 5-30 minutes for propagation

### Option 2: Vercel DNS (if using Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `api.localplus.city`
3. Configure DNS:
   - Add CNAME record: `api` → `localplus-api-gateway-101wrq78.uc.gateway.dev`

### Option 3: Other DNS Providers

Add CNAME record:
- **Host/Name:** `api`
- **Value/Target:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
- **TTL:** 3600

---

## Testing DNS

Once DNS is configured, test with:

```bash
# Check DNS resolution
dig api.localplus.city
# or
nslookup api.localplus.city

# Should return: localplus-api-gateway-101wrq78.uc.gateway.dev

# Test API endpoint
curl https://api.localplus.city/api/events?status=published&limit=5
```

---

## Verification

✅ **DNS Working:** `dig api.localplus.city` returns gateway URL  
✅ **API Working:** `curl https://api.localplus.city/api/events` returns data  
✅ **Mobile App:** Already updated to use `api.localplus.city`

---

## Troubleshooting

**DNS not resolving:**
- Wait 5-30 minutes for propagation
- Verify CNAME record is correct
- Check DNS provider status

**502/503 errors:**
- Gateway might be down (check GCP Console)
- DNS might not be fully propagated
- Try direct gateway URL: `https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events`

**SSL errors:**
- API Gateway provides SSL automatically
- If issues, verify DNS is pointing to correct gateway URL

