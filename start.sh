#!/bin/bash

echo "==================================="
echo "  Mindmap App Deployment Script"
echo "==================================="

echo ""
echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building and starting the server..."
npm run dev

echo ""
echo "==================================="
echo "  Deployment finished."
echo "  You can now access the app at the URL provided above."
echo "==================================="

