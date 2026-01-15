#!/bin/bash
echo "🔧 Configurando servidor unificado Link-A..."

# 1. Garantir que o frontend build existe
echo "📦 Verificando build do frontend..."
if [ ! -f "frontend/dist/index.html" ]; then
    echo "❌ Frontend não compilado. Compilando..."
    cd frontend && npm run build && cd ..
fi

# 2. Copiar frontend para backend/dist
echo "📁 Copiando frontend para backend/dist..."
cp -r frontend/dist/* backend/dist/

# 3. Verificar se os arquivos estão no lugar certo
echo "✅ Verificando arquivos:"
ls -la backend/dist/ | head -10

# 4. Iniciar servidor unificado
echo "🚀 Iniciando servidor unificado na porta 8080..."
node server.js