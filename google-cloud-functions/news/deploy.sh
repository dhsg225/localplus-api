#!/bin/bash
set -e
echo "🚀 Deploying news Cloud Function..."

# [2025-12-02] - Deploy news endpoint (no Supabase needed, just WordPress proxy)

echo ""
echo "📦 Deploying function: localplus-api-news"
echo "   Region: us-central1"
echo "   Runtime: nodejs20"
echo ""

gcloud functions deploy localplus-api-news \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=handler \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=60s \
  --memory=256MB

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function URL:"
gcloud functions describe localplus-api-news \
  --gen2 \
  --region=us-central1 \
  --format='value(serviceConfig.uri)'

echo ""
echo "🧪 Test with:"
echo "   curl \$(gcloud functions describe localplus-api-news --gen2 --region=us-central1 --format='value(serviceConfig.uri)')/api/news/hua-hin"

