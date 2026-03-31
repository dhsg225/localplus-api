# Google Cloud Load Balancer Pricing

## 💰 Pricing (No Free Tier)

**Forwarding Rules:**
- 💵 **$0.025 per hour** per forwarding rule
- 💵 **~$18/month** per forwarding rule (24/7 operation)
- 💵 First 5 rules: Same rate, no discount

**Data Processing:**
- 💵 **$0.008 per GB** (inbound)
- 💵 **$0.008 per GB** (outbound)
- 💵 No free tier for data processing

**Data Transfer:**
- 💵 Standard Google Cloud egress pricing
- 💵 Varies by region and amount

---

## 💰 Our Current Setup Cost

**What We Have:**
- 1 forwarding rule (`api-gateway-forwarding-rule`)
- Low traffic (development/testing)

**Estimated Cost:**
- **Forwarding rule:** **~$18/month** (24/7 operation)
- **Data processing:** Minimal (~$0.01-0.10/month for low traffic)
- **Data transfer:** Minimal (standard egress pricing)
- **Total: ~$18-20/month** for low use

---

## 📊 Pricing Details

### Forwarding Rules
- **Free tier:** First 5 forwarding rules
- **After free tier:** $18/month per forwarding rule
- **Our usage:** 1 rule = **FREE** ✅

### Data Processing
- **Free tier:** First 5 GB/month
- **After free tier:** $0.025 per GB
- **Our usage:** Likely under 5 GB = **FREE** ✅

### Data Transfer (Egress)
- **Standard Google Cloud egress pricing**
- Varies by region and amount
- Usually minimal for low traffic

---

## 🎯 Cost Comparison

### Option 1: Keep Load Balancer
- **Cost:** FREE (low use) or ~$18/month (if we exceed free tier)
- **Benefit:** Clean URL (`api.localplus.city`)
- **Best for:** Production, professional setup

### Option 2: Use Gateway URL Directly
- **Cost:** FREE (always)
- **Benefit:** No additional infrastructure
- **URL:** `localplus-api-gateway-101wrq78.uc.gateway.dev`
- **Best for:** Development, cost-sensitive

---

## ⚠️ When Costs Kick In

**You'll start paying if:**
1. **More than 5 forwarding rules** → $18/month per additional rule
2. **More than 5 GB data processing/month** → $0.025 per GB
3. **High data transfer** → Standard egress pricing

**For low use (like development/testing):**
- ✅ Likely **FREE** or very low cost (< $1/month)

---

## 📝 Summary

**For Low Use:**
- ✅ **FREE** (within free tier limits)
- ✅ First 5 forwarding rules: FREE
- ✅ First 5 GB data processing: FREE
- ✅ Low data transfer: Minimal cost

**For Production/High Traffic:**
- 💵 ~$18/month for forwarding rule (after free tier)
- 💵 Plus data processing and transfer costs
- 💰 Still reasonable for production use

---

## 🎯 Recommendation

**For your current setup (low use):**
- ✅ **Load Balancer is FREE** (within free tier)
- ✅ Keep it for clean URL
- ✅ Monitor usage to stay within free tier

**If traffic grows:**
- Monitor costs in GCP Console
- Consider if $18/month is worth the clean URL
- Or switch to gateway URL if cost becomes an issue

---

## 🔍 How to Monitor Costs

**In GCP Console:**
1. Go to **Billing** → **Reports**
2. Filter by service: **Cloud Load Balancing**
3. Check forwarding rule and data processing costs

**Set up billing alerts:**
- Get notified if costs exceed threshold
- Recommended: $10/month alert

---

## ✅ Bottom Line

**For low use: Load Balancer is FREE!** ✅

You're well within the free tier limits, so there's no additional cost for the Load Balancer setup.

