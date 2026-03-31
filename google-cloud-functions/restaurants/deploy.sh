#!/bin/bash
# Deployment script for restaurants Cloud Function
# [2025-11-29] - Created for LocalPlus API migration to GCF

set -e

echo "🚀 Deploying restaurants Cloud Function..."

# Check if environment variables are provided
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: Environment variables not set"
    echo "   Required variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
    read -p "Continue with deployment? (You'll need to set env vars manually) [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Build env vars string
ENV_VARS=""
if [ ! -z "$SUPABASE_URL" ]; then
    ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL},"
fi
if [ ! -z "$SUPABASE_ANON_KEY" ]; then
    ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY},"
fi

# Remove trailing comma
ENV_VARS=${ENV_VARS%,}

# Deploy function
echo "📦 Deploying to Google Cloud Functions (Gen2)..."
gcloud functions deploy localplus-api-restaurants \
  --gen2 \
  --runtime nodejs20 \
  --region us-central1 \
  --source . \
  --entry-point restaurants \
  --trigger-http \
  --allow-unauthenticated \
  ${ENV_VARS:+--set-env-vars "$ENV_VARS"} \
  --max-instances 10 \
  --timeout 60s \
  --memory 256MB

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function URL:"
gcloud functions describe localplus-api-restaurants --gen2 --region us-central1 --format='value(serviceConfig.uri)' 2>/dev/null || echo "   Run: gcloud functions describe localplus-api-restaurants --gen2 --region us-central1 --format='value(serviceConfig.uri)'"
