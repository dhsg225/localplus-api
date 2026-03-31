# LocalPlus API - GCP Project Setup

**Issue:** Functions were deployed to wrong project (`marketing-saas-ai` instead of LocalPlus project)

---

## ✅ Solution Options

### Option 1: Use Existing Project with Billing

If you have an existing LocalPlus GCP project with billing enabled:

```bash
# List all projects
gcloud projects list

# Set to your LocalPlus project
gcloud config set project YOUR_LOCALPLUS_PROJECT_ID

# Enable APIs
gcloud services enable cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  apigateway.googleapis.com \
  servicemanagement.googleapis.com \
  servicecontrol.googleapis.com
```

### Option 2: Create New Project + Link Billing

1. **Create project** (already done: `localplus-api`)
2. **Link billing account:**
   ```bash
   # List billing accounts
   gcloud billing accounts list
   
   # Link billing
   gcloud billing projects link localplus-api \
     --billing-account=YOUR_BILLING_ACCOUNT_ID
   ```
3. **Enable APIs:**
   ```bash
   gcloud services enable cloudfunctions.googleapis.com \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     apigateway.googleapis.com \
     servicemanagement.googleapis.com \
     servicecontrol.googleapis.com
   ```

### Option 3: Use Marketing SaaS Project (Temporary)

Keep using `marketing-saas-ai` for now, then migrate later.

---

## 🔄 Redeploy Functions to Correct Project

Once you have the correct project set up:

```bash
cd google-cloud-functions

# Set project
gcloud config set project YOUR_LOCALPLUS_PROJECT_ID

# Set environment variables
export SUPABASE_URL="https://joknprahhqdhvdhzmuwl.supabase.co"
export SUPABASE_ANON_KEY="your-key"

# Redeploy all functions
./deploy-all.sh
```

---

## 📋 Current Status

- ✅ Project created: `localplus-api`
- ⚠️  Billing: Needs to be linked
- ⏳ Functions: Need redeployment to correct project

---

## 🎯 Next Steps

1. **Choose project** (existing LocalPlus or new `localplus-api`)
2. **Enable billing** (if using new project)
3. **Enable APIs**
4. **Redeploy all 11 functions**
5. **Update API Gateway config** with correct project ID

