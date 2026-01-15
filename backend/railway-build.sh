#!/bin/bash
echo "🚀 Railway: Building Link-A..."

# Build frontend
cd frontend && npm install && npm run build
cd ..

# Create backend/dist and copy
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

# Build backend  
cd backend && npm install && npm run build

echo "✅ Build completo!"