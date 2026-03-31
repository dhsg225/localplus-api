#!/bin/bash
# Create API Gateway with API keys (optional but recommended)
# [2025-11-29] - Created for LocalPlus API

set -e

PROJECT_ID=$(gcloud config get-value project)
echo "🔑 Setting up API Gateway with API keys..."
echo ""

# Step 1: Create API key (if not exists)
echo "Step 1: Creating API key..."
API_KEY_NAME="localplus-api-key"
if gcloud alpha services api-keys describe $API_KEY_NAME --project=$PROJECT_ID &>/dev/null; then
    echo "   API key already exists"
else
    echo "   Creating new API key..."
    gcloud alpha services api-keys create \
      --display-name="LocalPlus API Key" \
      --project=$PROJECT_ID 2>&1 | grep -E "(keyString|name)" || echo "   Note: Create API key in Console if this fails"
fi
echo ""

# Step 2: Create API config with API key requirement
echo "Step 2: Creating API config..."
CONFIG_NAME="localplus-api-config-$(date +%s)"
gcloud api-gateway api-configs create $CONFIG_NAME \
  --api=localplus-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID 2>&1 | tail -3
echo ""

# Step 3: Create/Update Gateway
echo "Step 3: Creating Gateway..."
if gcloud api-gateway gateways describe localplus-api-gateway --location=us-central1 --project=$PROJECT_ID &>/dev/null; then
    gcloud api-gateway gateways update localplus-api-gateway \
      --api=localplus-api \
      --api-config=$CONFIG_NAME \
      --location=us-central1 \
      --project=$PROJECT_ID 2>&1 | tail -3
else
    gcloud api-gateway gateways create localplus-api-gateway \
      --api=localplus-api \
      --api-config=$CONFIG_NAME \
      --location=us-central1 \
      --project=$PROJECT_ID 2>&1 | tail -5
fi
