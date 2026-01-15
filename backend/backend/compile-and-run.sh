#!/bin/bash
cd /home/runner/workspace/backend
echo "🔧 Compilando backend..."
npm run build
echo "🚀 Iniciando backend..."
NODE_ENV=production node dist/index.js