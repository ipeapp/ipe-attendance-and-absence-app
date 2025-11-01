#!/bin/bash

echo "🚀 IPE Attendance System - Quick Deploy Script"
echo "=============================================="
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check for environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: Supabase environment variables not set!"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL='your_supabase_url'"
    echo "  export NEXT_PUBLIC_SUPABASE_ANON_KEY='your_supabase_anon_key'"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo ""

vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "Your app is now live!"
