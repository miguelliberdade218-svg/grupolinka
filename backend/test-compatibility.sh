#!/bin/bash

# 🔍 Script de Teste de Compatibilidade Frontend ↔ Backend
# Testa todos os endpoints que o frontend espera encontrar no backend

echo "🔄 Testando compatibilidade Frontend ↔ Backend"
echo "================================================"

# Configuração do backend
BACKEND_URL="${1:-http://localhost:3001}"
echo "🎯 Backend URL: $BACKEND_URL"
echo ""

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo "Testing: $description"
    echo "→ $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" "$BACKEND_URL$endpoint" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ Status: $http_code"
        echo "📄 Response: $(echo "$body" | head -c 100)..."
    elif [ "$http_code" = "404" ]; then
        echo "❌ Status: $http_code - Endpoint não implementado"
    elif [ "$http_code" = "000" ]; then
        echo "💥 Status: Connection failed - Backend offline?"
    else
        echo "⚠️ Status: $http_code"
        echo "📄 Response: $body"
    fi
    echo ""
}

echo "📋 TESTANDO ENDPOINTS CRÍTICOS (devem funcionar)"
echo "------------------------------------------------"

# Endpoints que devem estar funcionais
test_endpoint "GET" "/api/health" "Health Check"
test_endpoint "GET" "/api/admin/stats" "Admin Statistics"
test_endpoint "GET" "/api/rides-simple/search?from=Maputo&to=Beira" "Ride Search"

echo ""
echo "📋 TESTANDO ENDPOINTS EM DESENVOLVIMENTO"
echo "----------------------------------------"

# Endpoints que o frontend espera mas podem não estar implementados
test_endpoint "GET" "/api/auth/profile" "User Profile"
test_endpoint "GET" "/api/accommodations/search?location=Maputo" "Accommodation Search"
test_endpoint "GET" "/api/offers/featured" "Featured Offers"
test_endpoint "GET" "/api/partnerships/requests" "Partnership Requests"
test_endpoint "GET" "/api/events" "Events List"
test_endpoint "GET" "/api/chat/rooms" "Chat Rooms"

echo ""
echo "📋 TESTANDO CRIAÇÃO DE DADOS (POST endpoints)"
echo "---------------------------------------------"

# Teste de criação de booking (precisa autenticação)
booking_data='{"type":"ride","rideId":"test","guestInfo":{"name":"Test","email":"test@test.com","phone":"123"},"details":{"passengers":1,"totalAmount":100}}'
test_endpoint "POST" "/api/bookings/create" "Create Booking" "$booking_data"

# Teste de criação de ride
ride_data='{"fromAddress":"Maputo","toAddress":"Beira","departureDate":"2025-09-15","price":1500,"maxPassengers":4}'
test_endpoint "POST" "/api/rides-simple/create" "Create Ride" "$ride_data"

echo ""
echo "📊 RESUMO DA COMPATIBILIDADE"
echo "=============================="

# Contar sucessos e falhas
total_tests=10
echo "📈 Total de endpoints testados: $total_tests"
echo "🎯 Backend configurado: $BACKEND_URL"
echo ""
echo "🔍 Para verificar detalhes:"
echo "   - ✅ = Endpoint funcionando corretamente"
echo "   - ❌ = Endpoint não implementado (404)"
echo "   - ⚠️ = Endpoint com erro (precisa debug)"
echo "   - 💥 = Backend offline ou inacessível"
echo ""
echo "📝 Próximos passos:"
echo "   1. Implementar endpoints ❌ no backend local"
echo "   2. Corrigir endpoints ⚠️ com erro"
echo "   3. Atualizar frontend para usar APIs reais em vez de mock"
echo ""
echo "🚀 Teste concluído!"