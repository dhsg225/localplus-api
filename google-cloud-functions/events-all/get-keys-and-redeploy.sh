#!/bin/bash
# [2025-12-01] - Helper script to get Supabase keys and redeploy
# This script guides you through getting the keys and redeploying

set -e

echo "🔑 Getting Supabase Keys for Redeployment"
echo "=========================================="
echo ""
echo "📋 You need to get these from Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select project: joknprahhqdhvdhzmuwl (LocalPlus)"
echo "3. Go to: Settings → API"
echo ""
echo "You'll need:"
echo "  ✅ service_role key (under 'Project API keys' → 'service_role')"
echo "  ✅ JWT Secret (scroll down to 'JWT Settings' section)"
echo ""
echo "Press Enter when you have both values ready..."
read -r

echo ""
echo "Enter your SUPABASE_SERVICE_ROLE_KEY:"
echo "(Paste the key and press Enter)"
read -r SERVICE_ROLE_KEY

echo ""
echo "Enter your SUPABASE_JWT_SECRET:"
echo "(Paste the JWT secret and press Enter)"
read -r JWT_SECRET

echo ""
echo "✅ Setting environment variables..."
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SUPABASE_JWT_SECRET="$JWT_SECRET"

echo ""
echo "🚀 Redeploying function with correct keys..."
./deploy.sh

echo ""
echo "✅ Done! The function should now work correctly."

