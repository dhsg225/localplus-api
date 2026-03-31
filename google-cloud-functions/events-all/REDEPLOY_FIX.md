# Fix: "Invalid API key" Error

## Problem
The `events-all` function was deployed without `SUPABASE_ANON_KEY` environment variable, causing "Invalid API key" errors.

## Solution: Redeploy with Environment Variables

Run this command with all required environment variables:

```bash
cd /Users/admin/Dropbox/Development/localplus-api/google-cloud-functions/events-all

export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
export SUPABASE_JWT_SECRET="your_jwt_secret_here"

./deploy.sh
```

## Required Environment Variables

1. **SUPABASE_ANON_KEY** - Public anon key (found in codebase)
2. **SUPABASE_SERVICE_ROLE_KEY** - Service role key (from Supabase Dashboard)
3. **SUPABASE_JWT_SECRET** - JWT secret (from Supabase Dashboard → Settings → API → JWT Settings)

## Get Missing Keys

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **anon public** key (for SUPABASE_ANON_KEY)
   - **service_role** key (for SUPABASE_SERVICE_ROLE_KEY)
   - **JWT Secret** (scroll down to JWT Settings section)

## After Redeployment

The function will have all required environment variables and the "Invalid API key" error should be resolved.

