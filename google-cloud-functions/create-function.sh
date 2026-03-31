#!/bin/bash
# Helper script to create a GCF function from a route file
# Usage: ./create-function.sh <function-name> <entry-point> <source-route>

FUNC_NAME=$1
ENTRY_POINT=$2
SOURCE_ROUTE=$3

if [ -z "$FUNC_NAME" ] || [ -z "$ENTRY_POINT" ] || [ -z "$SOURCE_ROUTE" ]; then
    echo "Usage: ./create-function.sh <function-name> <entry-point> <source-route>"
    exit 1
fi

echo "Creating function: $FUNC_NAME"
mkdir -p "$FUNC_NAME"
cd "$FUNC_NAME"

# Copy and convert route file
cp "../../$SOURCE_ROUTE" index.js

# Convert module.exports to exports.entryPoint
sed -i '' "s/module.exports = async/exports.$ENTRY_POINT = async/g" index.js

# Convert res.setHeader to res.set
sed -i '' "s/res\.setHeader(/res.set(/g" index.js

# Create package.json
cat > package.json <<EOF
{
  "name": "localplus-api-$FUNC_NAME",
  "version": "1.0.0",
  "description": "Google Cloud Function for LocalPlus API - $FUNC_NAME",
  "main": "index.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.86.0"
  },
  "engines": {
    "node": "20"
  }
}
EOF

# Create deploy.sh
cat > deploy.sh <<EOF
#!/bin/bash
# Deployment script for $FUNC_NAME Cloud Function
# [2025-11-29] - Created for LocalPlus API migration to GCF

set -e

echo "🚀 Deploying $FUNC_NAME Cloud Function..."

# Check if environment variables are provided
if [ -z "\$SUPABASE_URL" ] || [ -z "\$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: Environment variables not set"
    echo "   Required variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_ANON_KEY"
    echo ""
    read -p "Continue with deployment? (You'll need to set env vars manually) [y/N]: " -n 1 -r
    echo
    if [[ ! \$REPLY =~ ^[Yy]\$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Build env vars string
ENV_VARS=""
if [ ! -z "\$SUPABASE_URL" ]; then
    ENV_VARS="\${ENV_VARS}SUPABASE_URL=\${SUPABASE_URL},"
fi
if [ ! -z "\$SUPABASE_ANON_KEY" ]; then
    ENV_VARS="\${ENV_VARS}SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY},"
fi

# Remove trailing comma
ENV_VARS=\${ENV_VARS%,}

# Deploy function
echo "📦 Deploying to Google Cloud Functions (Gen2)..."
gcloud functions deploy localplus-api-$FUNC_NAME \\
  --gen2 \\
  --runtime nodejs20 \\
  --region us-central1 \\
  --source . \\
  --entry-point $ENTRY_POINT \\
  --trigger-http \\
  --allow-unauthenticated \\
  \${ENV_VARS:+--set-env-vars "\$ENV_VARS"} \\
  --max-instances 10 \\
  --timeout 60s \\
  --memory 256MB

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function URL:"
gcloud functions describe localplus-api-$FUNC_NAME --gen2 --region us-central1 --format='value(serviceConfig.uri)' 2>/dev/null || echo "   Run: gcloud functions describe localplus-api-$FUNC_NAME --gen2 --region us-central1 --format='value(serviceConfig.uri)'"
EOF

chmod +x deploy.sh
cd ..

echo "✅ Created $FUNC_NAME function"

