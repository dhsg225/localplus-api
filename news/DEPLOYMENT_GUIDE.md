# News Server Deployment Guide

## Current Status
✅ News endpoints exist as Vercel API routes:
- `news/[city].js` - Fetches WordPress posts for a city
- `news/[city]/categories.js` - Fetches WordPress categories for a city

✅ Added to `vercel.json` for deployment

## Deployment Steps

### 1. Deploy to Vercel

```bash
cd /Users/admin/Dropbox/Development/localplus-api
vercel deploy --prod
```

Or if you want to deploy just to test:
```bash
vercel deploy
```

### 2. Get Your Vercel Deployment URL

After deployment, Vercel will show you the deployment URL. It will be one of:
- `localplus-api-xxxxx.vercel.app` (automatic)
- Your custom domain if configured

You can also check:
```bash
vercel ls
```

### 3. Update Cloudflare Worker

1. Go to Cloudflare Dashboard → Workers & Pages
2. Find your `api.localplus.city` worker
3. Edit the code
4. Find this line:
   ```javascript
   const vercelUrl = 'localplus-api.vercel.app'; // UPDATE THIS
   ```
5. Replace with your actual Vercel deployment URL
6. Save and deploy

### 4. Test the News Endpoint

```bash
curl https://api.localplus.city/api/news/hua-hin
```

Should return WordPress posts for Hua Hin.

## Alternative: Deploy as Google Cloud Function

If you prefer to keep everything on GCF (like events, locations, etc.):

1. Create `google-cloud-functions/news/index.js`
2. Copy the logic from `news/[city].js`
3. Deploy to GCF
4. Add routing in Cloudflare Worker

This keeps everything consistent with your other endpoints.

## Current Configuration

- **WordPress Sites:**
  - `hua-hin` → `https://huahin.locality.guide`
  - `pattaya` → `https://pattaya.locality.guide`
  - `bangkok` → `https://huahin.locality.guide` (fallback)

- **Endpoints:**
  - `GET /api/news/:city` - Get posts for a city
  - `GET /api/news/:city/categories` - Get categories for a city

## Benefits of Vercel Deployment

✅ **Always Online** - Serverless, no need to keep a server running
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Free Tier** - Generous free tier for low-medium traffic
✅ **Fast** - Global CDN, low latency
✅ **Easy Updates** - Just `vercel deploy` to update

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update Cloudflare Worker with Vercel URL
3. ✅ Test endpoints
4. ✅ Update mobile app to use `https://api.localplus.city/api/news/hua-hin`

