#!/bin/bash
set -e
echo "🚀 Deploying events-all Cloud Function..."

# [2025-11-30] - OPTION 3: Add SUPABASE_JWT_SECRET for proper JWT signature verification
# JWT secret is required to verify token signatures with HS256 algorithm
ENV_VARS=""
[ ! -z "$SUPABASE_URL" ] && ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL},"

# [2025-12-01] - SUPABASE_ANON_KEY is required for Supabase client initialization
if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ ERROR: SUPABASE_ANON_KEY not set!"
  echo "   Supabase client initialization will fail"
  echo "   To get your anon key:"
  echo "   1. Go to https://supabase.com/dashboard"
  echo "   2. Select your project → Settings → API"
  echo "   3. Copy the 'anon' or 'public' key"
  echo "   4. Set it as: export SUPABASE_ANON_KEY=your_anon_key_here"
  echo ""
  echo "   ⚠️  Without anon key, API calls will fail!"
  exit 1
else
  echo "✅ Using SUPABASE_ANON_KEY for Supabase client"
  ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY},"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set!"
  echo "   Admin operations may fail"
  echo "   To get your service role key:"
  echo "   1. Go to https://supabase.com/dashboard"
  echo "   2. Select your project → Settings → API"
  echo "   3. Copy the 'service_role' key (NOT the anon key)"
  echo "   4. Set it as: export SUPABASE_SERVICE_ROLE_KEY=your_key_here"
  echo ""
else
  echo "✅ Using SUPABASE_SERVICE_ROLE_KEY for admin operations"
  ENV_VARS="${ENV_VARS}SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},"
fi

if [ -z "$SUPABASE_JWT_SECRET" ]; then
  echo "❌ ERROR: SUPABASE_JWT_SECRET not set!"
  echo "   JWT signature verification will fail"
  echo "   To get your JWT secret:"
  echo "   1. Go to https://supabase.com/dashboard"
  echo "   2. Select your project → Settings → API"
  echo "   3. Scroll down to 'JWT Settings' section"
  echo "   4. Copy the 'JWT Secret' (it's a long string)"
  echo "   5. Set it as: export SUPABASE_JWT_SECRET=your_jwt_secret_here"
  echo ""
  echo "   ⚠️  Without JWT secret, token validation will fail!"
  exit 1
else
  echo "✅ Using SUPABASE_JWT_SECRET for JWT signature verification"
  ENV_VARS="${ENV_VARS}SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET},"
fi

ENV_VARS=${ENV_VARS%,}

gcloud functions deploy localplus-api-events-all \
  --gen2 \
  --runtime nodejs20 \
  --region us-central1 \
  --source . \
  --entry-point eventsAll \
  --trigger-http \
  --allow-unauthenticated \
  ${ENV_VARS:+--set-env-vars "$ENV_VARS"} \
  --max-instances 10 \
  --timeout 60s \
  --memory 256MB \
  --project=localplus-api

echo "✅ Deployment complete!"
