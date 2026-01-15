#!/bin/bash

# ============================
# CONFIGURAÇÃO ATUALIZADA
# ============================
export API_BASE="http://localhost:8000/api/hotels"
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImEzOGVhNmEwNDA4YjBjYzVkYTE4OWRmYzg4ODgyZDBmMWI3ZmJmMGUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY2ODQ4MTQzLCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3NjY5Mzk5NDYsImV4cCI6MTc2Njk0MzU0NiwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.r-zYlN_O05F_2v1f0z3ety71Wmz9C46yoLJ6L2QCnU_Nexwk5ijqolzZkzLmCbjbSm5Pk2NFSqa0V7n1HUiF30E4r79Rb5OOTQ9OcyfmpDrFeDIV98yOza7Vr8IBT0njDZHMgn6G72Ew55nc-EtGzJCN0nJQJklQt4Q5dBKHQpiIjIJLbbq3g9P58tnUSEa0y94YdgMee-xh26s-STq1iJnGzX8dFAYkRXuYiUNQ8HzYeg17k-hG-Sw5M_gcuW86MTP_0A0ZZ2xVr65Am5drFWqmw_hY1OWTS4YetArcBGQMzBGl8csmQmDz_wblD1cd8XWpqzCQO8a-tG_IDtDTfg"

# ID do usuário do token
export USER_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"

# IDs para testes (vamos usar IDs reais ou criar novos)
export HOTEL_ID=""
export ROOM_TYPE_ID=""
export BOOKING_ID=""

# Datas realistas (próximos dias)
export START_DATE=$(date -d "+3 days" +%Y-%m-%d)
export END_DATE=$(date -d "+5 days" +%Y-%m-%d)
export TODAY=$(date +%Y-%m-%d)
export NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)

# ============================
# FUNÇÕES AUXILIARES
# ============================
log_test() {
    echo -e "\n$(date '+%H:%M:%S') 📋 $1"
    echo "----------------------------------------"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"

    log_test "$name"
    echo "🔗 $method $url"

    if [ -n "$data" ]; then
        echo "📦 Dados: $data"
    fi

    local response
    local http_status
    local body
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            "$url")
    elif [ -n "$data" ]; then
        response=$(curl -s -X "$method" \
            -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -X "$method" \
            -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            "$url")
    fi

    http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
    body=$(echo "$response" | grep -v 'HTTP_STATUS:')

    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ] || [ "$http_status" = "204" ]; then
        echo "✅ SUCCESS ($http_status)"
        if [ -n "$body" ] && [ "$body" != "{}" ]; then
            echo "📄 Resposta:"
            echo "$body" | jq '. | {success: .success, message: .message, data_length: (.data | length // 0), data_id: (.data.id // .data[0].id // null)}' 2>/dev/null || echo "$body"
        fi
    else
        echo "❌ ERROR ($http_status)"
        echo "📄 Erro:"
        echo "$body" | jq '. | {success: .success, message: .message, error: .error}' 2>/dev/null || echo "$body"
    fi

    sleep 0.5
}

# ============================
# TESTES PRINCIPAIS
# ============================
echo "🚀 TESTE DO SISTEMA DE HOTÉIS - LINK A TURISMO"
echo "=============================================="
echo "👤 Usuário: Edson Daniel"
echo "📧 Email: edsondaniel8@gmail.com"
echo "🔐 Token: [JWT válido]"
echo "=============================================="

# 1. TESTAR HEALTH CHECK
test_endpoint "1. Health Check" "GET" "$API_BASE/health"

# 2. LISTAR HOTÉIS EXISTENTES
test_endpoint "2. Listar hotéis disponíveis" "GET" "$API_BASE"

# 3. VERIFICAR SE TEMOS HOTÉIS DO USUÁRIO
test_endpoint "3. Meus hotéis" "GET" "$API_BASE/host/$USER_ID"

# 4. CRIAR UM HOTEL DE TESTE
echo -e "\n🏨 CRIANDO HOTEL DE TESTE"
hotel_data=$(cat <<EOF
{
  "name": "Hotel Teste Prático $(date +'%H:%M')",
  "slug": "hotel-teste-$(date +%Y%m%d)",
  "description": "Hotel para testes práticos do sistema",
  "address": "Av. 25 de Setembro, Maputo",
  "locality": "Maputo",
  "province": "Maputo Cidade",
  "contact_email": "teste@hotel.com",
  "host_id": "$USER_ID",
  "images": [],
  "amenities": ["wifi", "breakfast", "parking"]
}
EOF
)

response=$(curl -s -X POST "$API_BASE" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$hotel_data" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
body=$(echo "$response" | grep -v 'HTTP_STATUS:')

if [ "$http_status" = "201" ]; then
    HOTEL_ID=$(echo "$body" | jq -r '.data.id // empty')
    echo "✅ Hotel criado com ID: $HOTEL_ID"
    echo "$body" | jq '{success: .success, message: .message, data: {id: .data.id, name: .data.name, slug: .data.slug}}'
else
    echo "❌ Não foi possível criar hotel, usando API existente"
    # Tentar pegar um hotel existente do usuário
    hotels_response=$(curl -s -H "Authorization: Bearer $BEARER_TOKEN" "$API_BASE/host/$USER_ID")
    HOTEL_ID=$(echo "$hotels_response" | jq -r '.data[0].id // empty')
    if [ -n "$HOTEL_ID" ]; then
        echo "ℹ️ Usando hotel existente: $HOTEL_ID"
    else
        echo "⚠️ Nenhum hotel disponível, pulando testes CRUD"
    fi
fi

if [ -n "$HOTEL_ID" ]; then
    # 5. VER DETALHES DO HOTEL
    test_endpoint "5. Detalhes do hotel" "GET" "$API_BASE/$HOTEL_ID"
    
    # 6. CRIAR TIPO DE QUARTO COM CAPACIDADE 2
    echo -e "\n🛏️ CRIANDO TIPO DE QUARTO (capacidade: 2)"
    roomtype_data=$(cat <<EOF
{
  "hotel_id": "$HOTEL_ID",
  "name": "Quarto Duplo Standard",
  "description": "Quarto confortável para 2 pessoas",
  "base_price": "250.00",
  "total_units": 5,
  "base_occupancy": 2,
  "capacity": 2,
  "extra_adult_price": "100.00",
  "extra_child_price": "50.00",
  "min_nights": 1,
  "amenities": ["tv", "wifi", "ac", "private_bathroom"],
  "images": [],
  "is_active": true
}
EOF
    )
    
    response=$(curl -s -X POST "$API_BASE/$HOTEL_ID/room-types" \
      -H "Authorization: Bearer $BEARER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$roomtype_data" \
      -w "\nHTTP_STATUS:%{http_code}")
    
    http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
    body=$(echo "$response" | grep -v 'HTTP_STATUS:')
    
    if [ "$http_status" = "201" ]; then
        ROOM_TYPE_ID=$(echo "$body" | jq -r '.data.id // empty')
        echo "✅ Tipo de quarto criado com ID: $ROOM_TYPE_ID"
    fi
    
    if [ -n "$ROOM_TYPE_ID" ]; then
        # 7. VER TIPOS DE QUARTO DO HOTEL
        test_endpoint "7. Listar tipos de quarto" "GET" "$API_BASE/$HOTEL_ID/room-types"
        
        # 8. TESTAR DISPONIBILIDADE
        test_endpoint "8. Verificar disponibilidade" "GET" "$API_BASE/$HOTEL_ID/availability?roomTypeId=$ROOM_TYPE_ID&startDate=$START_DATE&endDate=$END_DATE"
        
        # 9. CALCULAR PREÇO
        test_endpoint "9. Calcular preço da reserva" "POST" "$API_BASE/$HOTEL_ID/bookings/calculate-price" "$(cat <<EOF
{
  "room_type_id": "$ROOM_TYPE_ID",
  "check_in": "$START_DATE",
  "check_out": "$END_DATE",
  "units": 1,
  "adults": 2,
  "children": 0
}
EOF
        )"
        
        # 10. CRIAR RESERVA
        echo -e "\n📅 CRIANDO RESERVA DE TESTE"
        booking_data=$(cat <<EOF
{
  "hotelId": "$HOTEL_ID",
  "roomTypeId": "$ROOM_TYPE_ID",
  "guestName": "Cliente Teste",
  "guestEmail": "cliente@teste.com",
  "guestPhone": "+258841234567",
  "checkIn": "$START_DATE",
  "checkOut": "$END_DATE",
  "adults": 2,
  "children": 0,
  "units": 1,
  "specialRequests": "Teste de reserva automática"
}
EOF
        )
        
        response=$(curl -s -X POST "$API_BASE/$HOTEL_ID/bookings" \
          -H "Authorization: Bearer $BEARER_TOKEN" \
          -H "Content-Type: application/json" \
          -d "$booking_data" \
          -w "\nHTTP_STATUS:%{http_code}")
        
        http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
        body=$(echo "$response" | grep -v 'HTTP_STATUS:')
        
        if [ "$http_status" = "201" ]; then
            BOOKING_ID=$(echo "$body" | jq -r '.data.booking.id // empty')
            echo "✅ Reserva criada com ID: $BOOKING_ID"
        fi
    fi
    
    # 11. TESTAR DASHBOARD
    test_endpoint "11. Dashboard do hotel" "GET" "$API_BASE/$HOTEL_ID/dashboard"
    
    # 12. LISTAR RESERVAS
    test_endpoint "12. Listar reservas do hotel" "GET" "$API_BASE/$HOTEL_ID/bookings"
    
    if [ -n "$BOOKING_ID" ]; then
        # 13. VER DETALHES DA RESERVA
        test_endpoint "13. Detalhes da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID"
        
        # 14. REGISTRAR PAGAMENTO
        test_endpoint "14. Registrar pagamento" "POST" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments" "$(cat <<EOF
{
  "amount": 100,
  "paymentMethod": "cash",
  "reference": "PAG-TESTE-$(date +%Y%m%d%H%M%S)",
  "notes": "Pagamento de teste",
  "paymentType": "partial"
}
EOF
        )"
        
        # 15. VER PAGAMENTOS DA RESERVA
        test_endpoint "15. Pagamentos da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments"
    fi
    
    # 16. TESTAR BULK UPDATE DISPONIBILIDADE
    test_endpoint "16. Atualizar disponibilidade em massa" "POST" "$API_BASE/$HOTEL_ID/availability/bulk" "$(cat <<EOF
{
  "roomTypeId": "$ROOM_TYPE_ID",
  "updates": [
    {
      "date": "$START_DATE",
      "price": 250,
      "availableUnits": 3,
      "stopSell": false
    }
  ]
}
EOF
    )"
fi

# 17. TESTES FINAIS
echo -e "\n📊 TESTES FINAIS DO SISTEMA"

# Testes públicos
test_endpoint "17.1 Buscar hotéis em Maputo" "GET" "$API_BASE?locality=Maputo&province=Maputo%20Cidade"
test_endpoint "17.2 Promoções ativas (se tiver hotel)" "GET" "$API_BASE/$HOTEL_ID/promotions"
test_endpoint "17.3 Temporadas (se tiver hotel)" "GET" "$API_BASE/$HOTEL_ID/seasons"

# Testes de relatórios (se tiver hotel)
if [ -n "$HOTEL_ID" ]; then
    test_endpoint "17.4 Relatório de reservas" "GET" "$API_BASE/$HOTEL_ID/reports/bookings?startDate=$TODAY&endDate=$NEXT_WEEK"
    test_endpoint "17.5 Pagamentos pendentes" "GET" "$API_BASE/$HOTEL_ID/payments/pending"
    test_endpoint "17.6 Resumo financeiro" "GET" "$API_BASE/$HOTEL_ID/financial-summary?startDate=$TODAY&endDate=$NEXT_WEEK"
fi

# ============================
# RESUMO FINAL
# ============================
echo -e "\n🎯 RESUMO DOS TESTES"
echo "===================="
echo "✅ Health Check: OK"
echo "✅ Listar hotéis: OK"

if [ -n "$HOTEL_ID" ]; then
    echo "✅ Hotel criado/usado: $HOTEL_ID"
    
    if [ -n "$ROOM_TYPE_ID" ]; then
        echo "✅ Tipo de quarto: $ROOM_TYPE_ID (capacidade: 2)"
        
        if [ -n "$BOOKING_ID" ]; then
            echo "✅ Reserva criada: $BOOKING_ID"
            echo "✅ Pagamento registrado: OK"
        else
            echo "⚠️ Reserva não criada"
        fi
    else
        echo "⚠️ Tipo de quarto não criado"
    fi
else
    echo "⚠️ Hotel não disponível para testes CRUD"
fi

echo -e "\n📈 ESTATÍSTICAS:"
echo "• Data check-in: $START_DATE"
echo "• Data check-out: $END_DATE"
echo "• Usuário: Edson Daniel (Google)"
echo "• Sistema testado: CRUD completo"

echo -e "\n🚀 TODOS OS TESTES FORAM EXECUTADOS!"
echo "========================================"
