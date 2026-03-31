# Quick Redeploy with Real Keys

## Problem
The function was deployed with placeholder values:
- `SUPABASE_SERVICE_ROLE_KEY: your_service_role_key` ❌
- `SUPABASE_JWT_SECRET: your_jwt_secret` ❌

## Solution: Get Real Keys and Redeploy

### Option 1: Use Helper Script (Easiest)

```bash
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/events-all
./get-keys-and-redeploy.sh
```

This will prompt you to paste the keys and redeploy automatically.

### Option 2: Manual Redeploy

1. **Get keys from Supabase:**
   - Go to: https://supabase.com/dashboard
   - Select project: `joknprahhqdhvdhzmuwl`
   - Go to: **Settings → API**
   - Copy:
     - **service_role** key (under "Project API keys")
     - **JWT Secret** (scroll down to "JWT Settings" section)

2. **Set environment variables and redeploy:**
   ```bash
   cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/events-all
   
   export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk"
   export SUPABASE_SERVICE_ROLE_KEY="paste_your_service_role_key_here"
   export SUPABASE_JWT_SECRET="paste_your_jwt_secret_here"
   
   ./deploy.sh
   ```

## Where to Find Keys in Supabase Dashboard

1. **Service Role Key:**
   - Settings → API
   - Under "Project API keys" section
   - Look for "service_role" (it's a long JWT starting with `eyJ...`)

2. **JWT Secret:**
   - Settings → API
   - Scroll down to "JWT Settings" section
   - Copy the "JWT Secret" (long string, usually 32+ characters)

## After Redeployment

The function will have the correct keys and the "Invalid API key" error should be resolved.

