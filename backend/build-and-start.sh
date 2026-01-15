#!/bin/bash
echo "🚀 Link-A: Build completo e inicialização..."

# 1. Build do frontend React
echo "📦 Compilando frontend React..."
cd frontend
npm run build
cd ..

# 2. Criar pasta backend/dist e copiar build
echo "📁 Criando pasta backend/dist e copiando build..."
mkdir -p backend/dist
rm -rf backend/dist/*
cp -r frontend/dist/* backend/dist/

# 3. Build do backend
echo "⚙️ Compilando backend..."
cd backend
npm run build
cd ..

# 4. Verificar estrutura final
echo "✅ Estrutura final backend/dist:"
ls -la backend/dist/

# 5. Iniciar servidor
echo "🌐 Iniciando servidor unificado..."
node server.js