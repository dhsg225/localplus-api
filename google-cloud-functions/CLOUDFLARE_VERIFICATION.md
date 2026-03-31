# Cloudflare Setup Verification

## ✅ What to Check

After updating DNS in Cloudflare, verify:

1. **DNS Resolution** ✅
   - Should resolve to Cloudflare IPs or gateway URL
   - Check: `dig api.localplus.city +short`

2. **SSL Certificate** ✅
   - Should be valid and active
   - Check: `curl -I https://api.localplus.city/api/events`

3. **API Endpoint** ✅
   - Should return data
   - Check: `curl https://api.localplus.city/api/events`

---

## 🧪 Test Commands

```bash
# 1. Check DNS
dig api.localplus.city +short

# 2. Test API
curl https://api.localplus.city/api/events?status=published&limit=5

# 3. Check HTTP status
curl -I https://api.localplus.city/api/events

# 4. Check SSL
echo | openssl s_client -connect api.localplus.city:443 -servername api.localplus.city 2>/dev/null | grep "Verify return code"
```

---

## ✅ Success Indicators

- ✅ DNS resolves (to Cloudflare IPs or gateway)
- ✅ HTTP 200 response from API
- ✅ SSL certificate valid
- ✅ JSON data returned

---

## 🚨 Common Issues

### DNS Not Resolving
- Wait 5-30 minutes for propagation
- Verify CNAME record in Cloudflare
- Check proxy is ON (orange cloud)

### SSL Certificate Not Working
- Wait 5-10 minutes for Cloudflare to provision
- Verify proxy is ON (orange cloud)
- Check SSL/TLS mode in Cloudflare dashboard

### 502 Bad Gateway
- Test gateway URL directly
- Check SSL/TLS mode (try "Full" instead of "Full (Strict)")
- Verify API Gateway is active

---

## 📝 Next Steps

Once verified:
1. ✅ Mobile app will work automatically (already using `api.localplus.city`)
2. ✅ Can delete GCP Load Balancer (save $18/month)
3. ✅ Everything works with Cloudflare (FREE)

