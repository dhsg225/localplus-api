#!/bin/bash
set -e
echo "🚀 Deploying locations Cloud Function..."

# [2025-12-01] - Deploy locations endpoint
ENV_VARS=""
[ ! -z "$SUPABASE_URL" ] && ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL},"

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "❌ ERROR: SUPABASE_ANON_KEY not set!"
  exit 1
else
  echo "✅ Using SUPABASE_ANON_KEY"
  ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY},"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not set (will use anon key + RLS)"
else
  echo "✅ Using SUPABASE_SERVICE_ROLE_KEY"
  ENV_VARS="${ENV_VARS}SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},"
fi

# Remove trailing comma
ENV_VARS=${ENV_VARS%,}

echo ""
echo "📦 Deploying function: localplus-api-locations"
echo "   Region: us-central1"
echo "   Runtime: nodejs20"
echo ""

gcloud functions deploy localplus-api-locations \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=handler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="${ENV_VARS}" \
  --timeout=60s \
  --memory=256MB

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function URL:"
gcloud functions describe localplus-api-locations \
  --gen2 \
  --region=us-central1 \
  --format='value(serviceConfig.uri)'

echo ""
echo "🧪 Test with:"
echo "   curl \$(gcloud functions describe localplus-api-locations --gen2 --region=us-central1 --format='value(serviceConfig.uri)')"

