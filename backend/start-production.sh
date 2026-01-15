#!/bin/bash

# Link-A Production Starter
# Script robusto para inicializar o servidor com limpeza automática de portas

set -e  # Sair em caso de erro

echo "🚀 Iniciando Link-A Production Server..."

# Função para matar processos em portas específicas
cleanup_ports() {
    echo "🧹 Limpando portas 5000 e 8000..."
    
    # Matar processos nas portas 5000 e 8000
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    
    echo "✅ Limpeza de portas concluída"
    sleep 1
}

# Função para compilar backend se necessário
build_if_needed() {
    if [ ! -d "backend/dist" ] || [ ! -f "backend/dist/index.js" ]; then
        echo "🔨 Compilando backend..."
        cd backend && npm run build && cd ..
        echo "✅ Backend compilado"
    else
        echo "✅ Backend já compilado"
    fi
}

# Função principal
main() {
    echo "🔍 Verificando ambiente..."
    
    # Limpar portas antes de iniciar
    cleanup_ports
    
    # Compilar se necessário
    build_if_needed
    
    # Aguardar um momento
    sleep 2
    
    # Iniciar servidor principal
    echo "🌐 Iniciando servidor Link-A..."
    exec node server.js
}

# Capturar sinais para shutdown elegante
trap 'echo "🛑 Encerrando servidor..."; cleanup_ports; exit 0' SIGINT SIGTERM

# Executar função principal
main

# Em caso de falha, tentar restart
echo "❌ Falha no servidor. Tentando restart em 5 segundos..."
sleep 5
exec $0  # Reiniciar script