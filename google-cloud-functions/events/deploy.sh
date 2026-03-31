#!/bin/bash
set -e
echo "🚀 Deploying events Cloud Function..."
ENV_VARS=""
[ ! -z "$SUPABASE_URL" ] && ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL},"
[ ! -z "$SUPABASE_ANON_KEY" ] && ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY},"
ENV_VARS=${ENV_VARS%,}
gcloud functions deploy localplus-api-events \
  --gen2 \
  --runtime nodejs20 \
  --region us-central1 \
  --source . \
  --entry-point events \
  --trigger-http \
  --allow-unauthenticated \
  ${ENV_VARS:+--set-env-vars "$ENV_VARS"} \
  --max-instances 10 \
  --timeout 60s \
  --memory 256MB
echo "✅ Deployment complete!"
