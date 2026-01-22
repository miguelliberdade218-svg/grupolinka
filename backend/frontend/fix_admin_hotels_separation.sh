#!/bin/bash

# 🔧 Script para LIMPAR e CORRIGIR a separação Admin vs Hotels App
# Execução: bash fix_admin_hotels_separation.sh

echo "🚀 Iniciando limpeza de admin-app (remover hotel management)..."
echo ""

# 1. Remover diretório hotel-management de admin-app
if [ -d "src/apps/admin-app/pages/hotel-management" ]; then
    echo "❌ Removendo: src/apps/admin-app/pages/hotel-management/"
    rm -rf src/apps/admin-app/pages/hotel-management
    echo "✅ Removido!"
else
    echo "⚠️  Diretório não encontrado: src/apps/admin-app/pages/hotel-management/"
fi

if [ -d "src/apps/admin-app/components/hotel-management" ]; then
    echo "❌ Removendo: src/apps/admin-app/components/hotel-management/"
    rm -rf src/apps/admin-app/components/hotel-management
    echo "✅ Removido!"
else
    echo "⚠️  Diretório não encontrado: src/apps/admin-app/components/hotel-management/"
fi

echo ""
echo "🚀 Renomeando ficheiros corrigidos em hotels-app..."
echo ""

# 2. Renomear RoomTypesManagement
if [ -f "src/apps/hotels-app/components/room-types/RoomTypesManagement_Corrected.tsx" ]; then
    echo "📝 Renomeando RoomTypesManagement..."
    mv src/apps/hotels-app/components/room-types/RoomTypesManagement_Corrected.tsx \
       src/apps/hotels-app/components/room-types/RoomTypesManagement.tsx
    echo "✅ RoomTypesManagement.tsx pronto!"
else
    echo "⚠️  Ficheiro não encontrado: RoomTypesManagement_Corrected.tsx"
fi

# 3. Renomear EventSpacesManagement
if [ -f "src/apps/hotels-app/components/event-spaces/EventSpacesManagement_Corrected.tsx" ]; then
    echo "📝 Renomeando EventSpacesManagement..."
    mv src/apps/hotels-app/components/event-spaces/EventSpacesManagement_Corrected.tsx \
       src/apps/hotels-app/components/event-spaces/EventSpacesManagement.tsx
    echo "✅ EventSpacesManagement.tsx pronto!"
else
    echo "⚠️  Ficheiro não encontrado: EventSpacesManagement_Corrected.tsx"
fi

echo ""
echo "✅ ✅ ✅ LIMPEZA CONCLUÍDA! ✅ ✅ ✅"
echo ""
echo "📋 Próximas ações:"
echo "1. npm run dev"
echo "2. Navegar para http://localhost:5000/hotels/manage"
echo "3. Verificar se HotelsApp carrega (não AdminApp)"
echo "4. Testar botões e verificar logs no console"
echo ""
