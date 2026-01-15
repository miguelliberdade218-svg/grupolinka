#!/bin/bash

echo "🚀 Iniciando Link-A Full Stack..."

# Função para cleanup ao interromper
cleanup() {
    echo "🛑 Parando todos os serviços..."
    pkill -f "tsx index.ts" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    exit 0
}

# Configurar trap
trap cleanup SIGINT SIGTERM

# Parar processos anteriores se existirem
pkill -f "tsx index.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "📡 Iniciando Backend PostgreSQL na porta 3001..."
cd backend
PORT=3001 NODE_ENV=development /home/runner/workspace/node_modules/.bin/tsx index.ts &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 5

echo "🎨 Iniciando Frontend com Proxy na porta 5000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Ambos os serviços iniciados!"
echo "🌐 Frontend: http://localhost:5000"
echo "🔌 Backend: http://localhost:3001"
echo "📊 Health Check: http://localhost:3001/api/health"

# Aguardar ambos os processos
wait