#!/bin/bash

echo "🚀 Mantendo Backend PostgreSQL rodando..."

while true; do
    echo "📡 Iniciando/Reiniciando Backend na porta 3001..."
    cd backend
    PORT=3001 NODE_ENV=development /home/runner/workspace/node_modules/.bin/tsx index.ts
    echo "⚠️ Backend parou. Reiniciando em 2 segundos..."
    sleep 2
done