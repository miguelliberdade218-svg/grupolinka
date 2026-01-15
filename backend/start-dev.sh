#!/bin/bash

# Script para iniciar frontend e backend simultaneamente
echo "🚀 Iniciando Link-A Development Server..."

# Iniciar backend em background
echo "📡 Iniciando Backend na porta 3001..."
cd backend && PORT=3001 npm run dev &
BACKEND_PID=$!

# Aguardar o backend inicializar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando Frontend na porta 5000..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Função para cleanup ao sair
cleanup() {
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Configurar trap para cleanup
trap cleanup SIGINT SIGTERM

# Aguardar ambos os processos
wait