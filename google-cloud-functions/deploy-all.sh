#!/bin/bash
# Master deployment script for all LocalPlus API Cloud Functions
# [2025-11-29] - Created for LocalPlus API migration to GCF

set -e

echo "🚀 Deploying all LocalPlus API Cloud Functions..."
echo ""

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: Environment variables not set"
    echo "   Please set:"
    echo "   export SUPABASE_URL=your-url"
    echo "   export SUPABASE_ANON_KEY=your-key"
    echo ""
    read -p "Continue anyway? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# List of functions to deploy
FUNCTIONS=(
    "auth"
    "bookings"
    "bookings-id"
    "restaurants"
    "restaurants-search"
    "businesses"
    "notifications"
    "events"
    "events-all"
    "events-id"
    "events-participants"
)

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
    if [ -d "$func" ]; then
        echo "📦 Deploying $func..."
        cd "$func"
        if [ -f "deploy.sh" ]; then
            ./deploy.sh
        else
            echo "   ⚠️  No deploy.sh found, skipping..."
        fi
        cd ..
        echo ""
    else
        echo "   ⚠️  Directory $func not found, skipping..."
    fi
done

echo "✅ All functions deployed!"
echo ""
echo "📋 Next steps:"
echo "   1. Set up API Gateway or Cloud Load Balancer"
echo "   2. Route api.localplus.city to GCF endpoints"
echo "   3. Test all endpoints"
echo "   4. Update frontend API URLs if needed"

