# Final DNS Update for Load Balancer

## ✅ Load Balancer Setup Complete!

**Load Balancer IP:** `34.8.225.222`

---

## 📝 DNS Update Instructions

### In Cloudflare DNS:

1. **Delete the existing CNAME record** for `api`
   - Currently: CNAME → `localplus-api-gateway-101wrq78.uc.gateway.dev`

2. **Create a new A record:**
   - **Type:** A
   - **Name:** `api`
   - **IPv4 address:** `34.8.225.222`
   - **Proxy status:** OFF (gray cloud - DNS only)
   - **TTL:** Auto

3. **Click "Save"**

---

## ⏳ Timeline

- **DNS Update:** 2 minutes
- **DNS Propagation:** 5-30 minutes
- **SSL Certificate Provisioning:** 10-60 minutes
- **Total:** ~15-90 minutes

---

## 🧪 Testing

### After DNS Update:

**1. Check DNS:**
```bash
dig api.localplus.city +short
# Should return: 34.8.225.222
```

**2. Check SSL Certificate Status:**
```bash
gcloud compute ssl-certificates describe api-localplus-ssl \
  --global \
  --format='value(managed.status)'
# Should be: ACTIVE (after 10-60 minutes)
```

**3. Test API:**
```bash
curl https://api.localplus.city/api/events?status=published&limit=5
# Should return: {"success":true,"data":[...]}
```

---

## ✅ Success Indicators

1. ✅ DNS resolves to `34.8.225.222`
2. ✅ SSL certificate status: `ACTIVE`
3. ✅ `curl https://api.localplus.city/api/events` returns `200 OK`
4. ✅ Mobile app can connect to `api.localplus.city`

---

## 🚨 Troubleshooting

**SSL Certificate Still Provisioning:**
- Wait 10-60 minutes
- Verify DNS A record is correct
- Check: `gcloud compute ssl-certificates describe api-localplus-ssl --global`

**502 Bad Gateway:**
- Verify NEG is added to backend service
- Check API Gateway is active
- Verify backend service health

**DNS Not Resolving:**
- Verify A record is correct
- Wait for DNS propagation
- Check: `dig api.localplus.city`

