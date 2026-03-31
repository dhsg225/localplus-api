#!/bin/bash
set -e
echo "🚀 Deploying activities Cloud Function..."

# Environment variables for Supabase client
ENV_VARS=""
[ ! -z "$SUPABASE_URL" ] && ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL}," || (echo "❌ ERROR: SUPABASE_URL not set!" && exit 1)
[ ! -z "$SUPABASE_ANON_KEY" ] && ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}," || (echo "❌ ERROR: SUPABASE_ANON_KEY not set!" && exit 1)
[ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ] && ENV_VARS="${ENV_VARS}SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}," || (echo "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set!" && exit 1)

# Remove trailing comma if any
ENV_VARS=$(echo "$ENV_VARS" | sed 's/,$//')

# Deploy the function
gcloud functions deploy localplus-api-activities \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=handler \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="$ENV_VARS" \
  --project=localplus-api \
  --max-instances=77 \
  --memory=256MB \
  --timeout=60s

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function URL:"
gcloud functions describe localplus-api-activities --gen2 --region=us-central1 --format='value(serviceConfig.uri)'

echo ""
echo "🧪 Test with:"
echo "   curl \$(gcloud functions describe localplus-api-activities --gen2 --region=us-central1 --format='value(serviceConfig.uri)')"

