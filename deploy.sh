#!/bin/bash
echo "🔨 Building application..."
npm run build

echo "📦 Copying static assets..."
mkdir -p .next/standalone/.next
mkdir -p .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "✅ Build complete! Ready to deploy."