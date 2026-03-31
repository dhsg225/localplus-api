#!/bin/bash
# Automated API Gateway Setup Script
# [2025-11-29] - Created for LocalPlus API migration to GCF

set -e

echo "🚀 Setting up API Gateway for LocalPlus API..."
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"
echo ""

# Step 1: Enable APIs
echo "📦 Step 1: Enabling required APIs..."
gcloud services enable apigateway.googleapis.com --project=$PROJECT_ID
gcloud services enable servicemanagement.googleapis.com --project=$PROJECT_ID
gcloud services enable servicecontrol.googleapis.com --project=$PROJECT_ID
echo "✅ APIs enabled"
echo ""

# Step 2: Check if config file exists
if [ ! -f "api-gateway-config.yaml" ]; then
    echo "⚠️  Warning: api-gateway-config.yaml not found"
    echo "   Please create it first (see API_GATEWAY_SETUP.md)"
    exit 1
fi

# Replace PROJECT-ID in config
echo "📝 Step 2: Updating config with project ID..."
sed -i '' "s/\[PROJECT-ID\]/$PROJECT_ID/g" api-gateway-config.yaml
echo "✅ Config updated"
echo ""

# Step 3: Create API
echo "📦 Step 3: Creating API Gateway..."
if gcloud api-gateway apis describe localplus-api --project=$PROJECT_ID &>/dev/null; then
    echo "   API 'localplus-api' already exists, skipping..."
else
    gcloud api-gateway apis create localplus-api \
      --project=$PROJECT_ID \
      --display-name="LocalPlus API"
    echo "✅ API created"
fi
echo ""

# Step 4: Create API Config
echo "📦 Step 4: Creating API config..."
CONFIG_NAME="localplus-api-config-$(date +%s)"
gcloud api-gateway api-configs create $CONFIG_NAME \
  --api=localplus-api \
  --openapi-spec=api-gateway-config.yaml \
  --project=$PROJECT_ID
echo "✅ API config created: $CONFIG_NAME"
echo ""

# Step 5: Create Gateway
echo "📦 Step 5: Creating Gateway (this may take 5-10 minutes)..."
if gcloud api-gateway gateways describe localplus-api-gateway --location=us-central1 --project=$PROJECT_ID &>/dev/null; then
    echo "   Gateway already exists, updating to new config..."
    gcloud api-gateway gateways update localplus-api-gateway \
      --api=localplus-api \
      --api-config=$CONFIG_NAME \
      --location=us-central1 \
      --project=$PROJECT_ID
else
    gcloud api-gateway gateways create localplus-api-gateway \
      --api=localplus-api \
      --api-config=$CONFIG_NAME \
      --location=us-central1 \
      --project=$PROJECT_ID
fi
echo "✅ Gateway created/updated"
echo ""

# Step 6: Get Gateway URL
echo "📋 Step 6: Getting Gateway URL..."
GATEWAY_URL=$(gcloud api-gateway gateways describe localplus-api-gateway \
  --location=us-central1 \
  --project=$PROJECT_ID \
  --format='value(defaultHostname)')

echo ""
echo "✅ API Gateway Setup Complete!"
echo ""
echo "📋 Gateway URL: $GATEWAY_URL"
echo ""
echo "📝 Next Steps:"
echo "   1. Configure DNS CNAME:"
echo "      Type: CNAME"
echo "      Name: api"
echo "      Value: $GATEWAY_URL"
echo ""
echo "   2. Wait 10-15 minutes for SSL certificate"
echo ""
echo "   3. Test endpoint:"
echo "      curl https://api.localplus.city/api/auth"
echo ""

