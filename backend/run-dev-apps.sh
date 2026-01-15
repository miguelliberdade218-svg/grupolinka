#!/bin/bash

# Script para executar múltiplas apps em desenvolvimento
# Uso: ./run-dev-apps.sh [app_name]

echo "🚀 Link-A - Executar Apps em Desenvolvimento"
echo "============================================="

if [ -z "$1" ]; then
    echo "Apps disponíveis:"
    echo "  client  - App principal (porta 5000)"
    echo "  driver  - App motoristas (porta 5001)"
    echo "  hotel   - App hotéis (porta 5002)"
    echo "  event   - App eventos (porta 5003)"
    echo "  admin   - App administração (porta 5004)"
    echo ""
    echo "Uso: ./run-dev-apps.sh [app_name]"
    echo "Exemplo: ./run-dev-apps.sh driver"
    exit 1
fi

APP_NAME=$1

case $APP_NAME in
    "client")
        PORT=5000
        APP_DIR="frontend/client-app"
        ;;
    "driver")
        PORT=5001
        APP_DIR="frontend/driver-app"
        ;;
    "hotel")
        PORT=5002
        APP_DIR="frontend/hotel-app"
        ;;
    "event")
        PORT=5003
        APP_DIR="frontend/event-app"
        ;;
    "admin")
        PORT=5004
        APP_DIR="frontend/admin-app"
        ;;
    *)
        echo "❌ App '$APP_NAME' não encontrada!"
        echo "Apps disponíveis: client, driver, hotel, event, admin"
        exit 1
        ;;
esac

if [ ! -d "$APP_DIR" ]; then
    echo "❌ Diretório $APP_DIR não encontrado!"
    exit 1
fi

echo "🚀 Iniciando $APP_NAME app na porta $PORT..."
echo "📁 Diretório: $APP_DIR"
echo "🌐 URL: http://localhost:$PORT"
echo ""

cd $APP_DIR
npm install 2>/dev/null || echo "Dependências já instaladas"
npm run dev -- --port $PORT