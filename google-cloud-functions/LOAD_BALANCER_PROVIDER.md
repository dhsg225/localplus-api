# Who Provides the Load Balancer?

## ✅ Answer: Google Cloud Platform (GCP)

**Service:** Google Cloud Load Balancer  
**Product:** Cloud Load Balancing (part of Compute Engine)  
**Provider:** Google Cloud Platform

---

## 📊 Service Breakdown

### 1. Google Cloud Functions (GCF)
- **Provider:** Google Cloud Platform
- **What it provides:** Serverless function execution
- **What we use:** 11 deployed functions
- **NOT providing:** Load Balancer

### 2. API Gateway
- **Provider:** Google Cloud Platform
- **What it provides:** Request routing to functions
- **What we use:** Routes requests to GCF functions
- **NOT providing:** Load Balancer

### 3. Google Cloud Load Balancer
- **Provider:** Google Cloud Platform
- **Service:** Cloud Load Balancing (Compute Engine)
- **What we created:** 
  - Forwarding rule: `api-gateway-forwarding-rule`
  - Backend service: `api-gateway-backend`
  - SSL certificate: `api-localplus-ssl`
  - Static IP: `34.8.225.222`
- **Purpose:** Custom domain support + SSL

---

## 🔧 How We Created It

**Using Google Cloud CLI:**
```bash
gcloud compute forwarding-rules create ...
gcloud compute backend-services create ...
gcloud compute ssl-certificates create ...
```

**These commands use:**
- **API:** Google Cloud Compute Engine API
- **Service:** Cloud Load Balancing
- **Provider:** Google Cloud Platform

---

## 💰 Billing

**All three services bill to:**
- **Project:** `localplus-api`
- **Account:** Your Google Cloud account
- **Provider:** Google Cloud Platform

**Cost breakdown:**
- GCF Functions: Pay per invocation
- API Gateway: Free tier available
- Load Balancer: ~$18/month (after free tier)

---

## 📋 Summary

| Component | Provider | Service | We Created? |
|-----------|----------|---------|-------------|
| GCF Functions | Google Cloud | Cloud Functions | ✅ Yes |
| API Gateway | Google Cloud | API Gateway | ✅ Yes |
| Load Balancer | Google Cloud | Cloud Load Balancing | ✅ Yes |

**All are Google Cloud Platform services, but:**
- **Different products** (Functions vs Gateway vs Load Balancing)
- **Different APIs** (functions.googleapis.com vs apigateway.googleapis.com vs compute.googleapis.com)
- **Different billing** (separate line items)

---

## 🎯 Key Point

**The Load Balancer is:**
- ✅ Provided by **Google Cloud Platform**
- ✅ Part of **Cloud Load Balancing** service
- ✅ Created by **us** (not automatic from GCF)
- ✅ Separate from GCF and API Gateway

**It's all Google Cloud, but different services working together!**

