#!/bin/bash

echo "🚀 Deploying CourierOS to Firebase..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
npx firebase deploy --only hosting:chat-app-6dfa7-2a6bf

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app is live at: https://chat-app-6dfa7-2a6bf.web.app"
else
    echo "❌ Deployment failed."
    exit 1
fi