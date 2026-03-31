# Why Do We Have a Load Balancer?

## 🔍 Short Answer

**The Load Balancer did NOT come from GCF.** We added it specifically to enable custom domain support (`api.localplus.city`) with SSL certificates.

---

## 📊 Architecture Breakdown

### What GCF Provides (Out of the Box):

1. **Google Cloud Functions** ✅
   - 11 functions deployed and working
   - Direct URLs: `https://us-central1-localplus-api.cloudfunctions.net/localplus-api-*`

2. **API Gateway** ✅
   - Routes requests to functions
   - Default hostname: `localplus-api-gateway-101wrq78.uc.gateway.dev`
   - SSL certificate included (for default hostname only)

### What GCF Does NOT Provide:

1. **Custom Domain Support** ❌
   - API Gateway v1 doesn't natively support custom domains
   - Can't directly use `api.localplus.city` with API Gateway

2. **SSL Certificates for Custom Domains** ❌
   - Default hostname has SSL automatically
   - Custom domains need additional setup

---

## 🎯 Why We Added Load Balancer

**Goal:** Use `api.localplus.city` instead of the long gateway URL

**Solution:** Cloud Load Balancer acts as a "middleman" that:
1. Receives requests at `api.localplus.city`
2. Provides SSL certificate for the custom domain
3. Routes to API Gateway
4. API Gateway routes to GCF functions

---

## 📋 Architecture Flow

### Without Load Balancer (What We Had):
```
Mobile App
    ↓
https://localplus-api-gateway-101wrq78.uc.gateway.dev/api/events
    ↓
API Gateway
    ↓
GCF Functions
```
✅ Works, but uses long technical URL

### With Load Balancer (What We Have Now):
```
Mobile App
    ↓
https://api.localplus.city/api/events  ← Clean, branded URL
    ↓
Cloud Load Balancer (SSL termination)
    ↓
API Gateway
    ↓
GCF Functions
```
✅ Clean URL with SSL certificate

---

## 💰 Cost Consideration

**Load Balancer Costs:**
- **Free tier:** First 5 forwarding rules are free
- **After free tier:** ~$18/month per forwarding rule
- **Data transfer:** Standard egress pricing

**Alternative (No Load Balancer):**
- Use gateway URL directly: `localplus-api-gateway-101wrq78.uc.gateway.dev`
- ✅ Free
- ✅ Works perfectly
- ❌ Long technical URL

---

## 🤔 Do We Actually Need It?

**Option 1: Keep Load Balancer** (Current Setup)
- ✅ Clean URL: `api.localplus.city`
- ✅ Professional setup
- ❌ Additional cost (~$18/month)
- ❌ More complex architecture

**Option 2: Remove Load Balancer** (Simpler)
- ✅ Free
- ✅ Simpler architecture
- ✅ Gateway URL works perfectly
- ❌ Long technical URL: `localplus-api-gateway-101wrq78.uc.gateway.dev`

---

## 📝 Recommendation

**For Development/Testing:**
- Use gateway URL directly (no Load Balancer needed)
- Update mobile app to: `https://localplus-api-gateway-101wrq78.uc.gateway.dev`

**For Production:**
- Keep Load Balancer for clean branded URL
- Worth the cost for professional appearance

---

## 🔄 If You Want to Remove Load Balancer

We can:
1. Delete Load Balancer components
2. Update mobile app to use gateway URL directly
3. Save ~$18/month

The gateway URL works perfectly and has valid SSL - it's just longer.

---

## ✅ Summary

- **Load Balancer:** Added by us, not from GCF
- **Purpose:** Enable custom domain (`api.localplus.city`) with SSL
- **Alternative:** Use gateway URL directly (free, works now)
- **Your choice:** Keep for clean URL, or remove to save costs

