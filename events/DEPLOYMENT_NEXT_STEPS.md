# Activities & Attractions - Deployment Next Steps

## ✅ What's Been Completed

### 1. API Endpoints Created
- ✅ `localplus-api/activities/route.js` - Vercel route for activities
- ✅ `localplus-api/attractions/route.js` - Vercel route for attractions
- ✅ `localplus-api/google-cloud-functions/activities/index.js` - GCF function for activities
- ✅ `localplus-api/google-cloud-functions/attractions/index.js` - GCF function for attractions
- ✅ `vercel.json` updated with new routes

### 2. Frontend Components Created
- ✅ `CreateActivityModal.tsx` - Modal for creating activities
- ✅ `CreateAttractionModal.tsx` - Modal for creating attractions
- ✅ `ActivitiesDashboard.tsx` - Updated to use real API
- ✅ `AttractionsDashboard.tsx` - Updated to use real API
- ✅ `apiService.ts` - Updated with working methods

### 3. Cloudflare Worker Updated
- ✅ Added routing for `/api/activities` and `/api/attractions`
- ⚠️ **Note**: Update GCF URLs in worker after deployment

## 🚀 Next Steps: Deploy GCF Functions

### Step 1: Deploy Activities Function

```bash
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/activities

# Set environment variables (if not already set)
export SUPABASE_URL="https://joknprahhqdhvdhzmuwl.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Deploy
./deploy.sh
```

After deployment, note the function URL (will be something like):
`https://localplus-api-activities-xxxxx-uc.a.run.app`

### Step 2: Deploy Attractions Function

```bash
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/attractions

# Same environment variables as above
./deploy.sh
```

After deployment, note the function URL (will be something like):
`https://localplus-api-attractions-xxxxx-uc.a.run.app`

### Step 3: Update Cloudflare Worker

1. Go to Cloudflare Dashboard → Workers & Pages
2. Edit the worker for `api.localplus.city`
3. Update the URLs in `COPY_PASTE_WORKER_CODE.txt`:
   - Replace `localplus-api-activities-jdyddatgcq-uc.a.run.app` with actual URL
   - Replace `localplus-api-attractions-jdyddatgcq-uc.a.run.app` with actual URL
4. Save and deploy the worker

### Step 4: Test the Endpoints

```bash
# Test Activities
curl https://api.localplus.city/api/activities

# Test Attractions
curl https://api.localplus.city/api/attractions
```

## 📝 Quick Deploy Commands

If you have environment variables set globally:

```bash
# Deploy both functions
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/activities && ./deploy.sh
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/attractions && ./deploy.sh
```

## ✅ Verification Checklist

- [ ] Activities GCF function deployed
- [ ] Attractions GCF function deployed
- [ ] Cloudflare Worker updated with correct URLs
- [ ] Test GET /api/activities returns data
- [ ] Test GET /api/attractions returns data
- [ ] Test creating activity from partner app
- [ ] Test creating attraction from partner app

## 🎯 What's Working Now

- Frontend pages are ready and connected to API
- Create modals are functional
- API endpoints are ready (just need deployment)
- Database tables exist (activities, attractions)
- Business types configured
- Menu system configured

Once GCF functions are deployed and Cloudflare Worker is updated, everything should work end-to-end!

