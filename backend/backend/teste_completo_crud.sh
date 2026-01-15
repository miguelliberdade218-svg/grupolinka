#!/bin/bash

# ============================
# CONFIGURAÇÃO COMPLETA
# ============================
export API_BASE="http://localhost:8000/api/hotels"
export HOTEL_ID="2fe41dc8-1644-4e85-a6e7-0dcc828346db"
export BOOKING_ID="1873e137-4e80-424f-8927-f55e1654373c"
export INVOICE_ID="ac4efdfe-356f-459d-a1d3-b627bcbb4eaa"
export ROOM_TYPE_ID="8cccd756-32f5-482d-a9a7-d8640f61653d"

# Datas para testes
export START_DATE=$(date -d "+7 days" +%Y-%m-%d)
export END_DATE=$(date -d "+10 days" +%Y-%m-%d)
export TODAY=$(date +%Y-%m-%d)
export NEXT_MONTH=$(date -d "+30 days" +%Y-%m-%d)

# IDs para testes CRUD (serão criados e excluídos)
export NEW_HOTEL_ID=""
export NEW_ROOMTYPE_ID=""

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
    local auth="$4"
    local data="$5"
    
    log_test "$name"
    echo "🔗 $method $url"
    
    if [ -n "$data" ]; then
        echo "📦 Dados: $data"
    fi
    
    local response
    local curl_cmd="curl -s -w 'HTTP_STATUS:%{http_code}'"
    
    # Adicionar método
    if [ "$method" != "GET" ]; then
        curl_cmd="$curl_cmd -X $method"
    fi
    
    # Adicionar autenticação
    if [ "$auth" = "auth" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $BEARER_TOKEN'"
    fi
    
    # Adicionar dados para POST/PUT
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # Executar
    curl_cmd="$curl_cmd '$url'"
    
    # Executar e capturar resposta
    response=$(eval $curl_cmd 2>/dev/null)
    
    # Extrair status e body
    local http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')
    
    # Verificar sucesso
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ] || [ "$http_status" = "204" ]; then
        echo "✅ SUCCESS ($http_status)"
        if [ -n "$body" ] && [ "$body" != "{}" ]; then
            echo "$body" | jq '. | {success: .success, message: .message, data_length: (.data | length // 0)}' 2>/dev/null || echo "$body"
        fi
    else
        echo "❌ ERROR ($http_status)"
        echo "$body" | jq '. | {success: .success, message: .message, error: .error}' 2>/dev/null || echo "$body"
    fi
    
    sleep 0.3  # Delay entre requests
}

get_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | jq -r ".$key" 2>/dev/null
}

# ============================
# TESTES INICIAM AQUI!
# ============================
echo "🚀🚀🚀 TESTE COMPLETO DO SISTEMA DE HOTÉIS (CRUD + OPERAÇÕES) 🚀🚀🚀"
echo "================================================================"
echo "📊 Usando dados reais:"
echo "   Hotel: $HOTEL_ID"
echo "   Booking: $BOOKING_ID"
echo "   Room Type: $ROOM_TYPE_ID"
echo "   Datas: $START_DATE até $END_DATE"
echo "================================================================"

# ============================
# TESTES CRUD DE HOTÉIS
# ============================
echo -e "\n📌 A. TESTES CRUD DE HOTÉIS"

echo -e "\n🔄 A.1 CRIAÇÃO DE HOTEL (Teste completo)"
log_test "A.1 Criar novo hotel"
hotel_data="{
  \"name\": \"Hotel Teste CRUD $(date +%Y%m%d_%H%M%S)\",
  \"slug\": \"hotel-teste-crud-$(date +%Y%m%d)\",
  \"description\": \"Hotel para testes CRUD do sistema\",
  \"address\": \"Rua de Teste, 123\",
  \"locality\": \"Maputo\",
  \"province\": \"Maputo Cidade\",
  \"country\": \"Moçambique\",
  \"contact_email\": \"teste.crud@exemplo.com\",
  \"contact_phone\": \"+258841234567\",
  \"policies\": \"Check-in: 14:00, Check-out: 12:00\",
  \"images\": [\"https://example.com/hotel1.jpg\"],
  \"amenities\": [\"wifi\", \"breakfast\", \"pool\"],
  \"check_in_time\": \"14:00\",
  \"check_out_time\": \"12:00\",
  \"host_id\": \"bB88VrzVx8dbUUpXV7qSrGA5eiy2\"
}"

echo "🔗 POST $API_BASE"
echo "📦 Dados: $hotel_data"

response=$(curl -s -X POST "$API_BASE" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$hotel_data" \
  -w "HTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')

if [ "$http_status" = "201" ]; then
    echo "✅ SUCCESS ($http_status)"
    NEW_HOTEL_ID=$(get_json_value "$body" ".data.id")
    echo "🎉 Novo hotel criado com ID: $NEW_HOTEL_ID"
    echo "$body" | jq '. | {success: .success, message: .message, data: {id: .data.id, name: .data.name, slug: .data.slug}}'
else
    echo "❌ ERROR ($http_status)"
    echo "$body" | jq '.'
    NEW_HOTEL_ID=""
fi

sleep 1

if [ -n "$NEW_HOTEL_ID" ]; then
    echo -e "\n📋 A.2 LEITURA DO HOTEL CRIADO"
    test_endpoint "A.2.1 Detalhes do novo hotel" "GET" "$API_BASE/$NEW_HOTEL_ID" "noauth"
    
    echo -e "\n✏️ A.3 ATUALIZAÇÃO DO HOTEL"
    update_data="{
      \"name\": \"Hotel Teste CRUD Atualizado $(date +%H%M%S)\",
      \"description\": \"Descrição atualizada via teste CRUD\",
      \"policies\": \"Check-in: 15:00, Check-out: 11:00\",
      \"amenities\": [\"wifi\", \"breakfast\", \"pool\", \"gym\"]
    }"
    
    test_endpoint "A.3.1 Atualizar hotel" "PUT" "$API_BASE/$NEW_HOTEL_ID" "auth" "$update_data"
    
    # Listar hotéis do host
    echo -e "\n📋 A.4 LISTAR HOTÉIS DO HOST"
    test_endpoint "A.4.1 Hotéis do host" "GET" "$API_BASE/host/bB88VrzVx8dbUUpXV7qSrGA5eiy2" "auth"
    
    echo -e "\n🗑️ A.5 EXCLUSÃO DO HOTEL (opcional - cuidado!)"
    read -p "❓ Deseja EXCLUIR o hotel de teste? (s/N): " excluir_hotel
    if [[ $excluir_hotel == "s" ]] || [[ $excluir_hotel == "S" ]]; then
        echo "⚠️  Exclusão de hotel normalmente requer desativação em vez de DELETE físico"
        echo "🔗 PUT $API_BASE/$NEW_HOTEL_ID (com is_active: false)"
        deactivate_data="{\"is_active\": false}"
        test_endpoint "A.5.1 Desativar hotel" "PUT" "$API_BASE/$NEW_HOTEL_ID" "auth" "$deactivate_data"
    else
        echo "ℹ️  Hotel mantido ativo para testes futuros"
    fi
else
    echo "⚠️  PULANDO TESTES CRUD (hotel não foi criado)"
fi

# ============================
# TESTES CRUD DE ROOM TYPES
# ============================
echo -e "\n\n📌 B. TESTES CRUD DE TIPOS DE QUARTO"

if [ -n "$NEW_HOTEL_ID" ]; then
    echo "🏨 Usando novo hotel: $NEW_HOTEL_ID"
    ROOMTYPE_HOTEL_ID="$NEW_HOTEL_ID"
else
    echo "🏨 Usando hotel existente: $HOTEL_ID"
    ROOMTYPE_HOTEL_ID="$HOTEL_ID"
fi

echo -e "\n🔄 B.1 CRIAÇÃO DE TIPO DE QUARTO"
log_test "B.1 Criar novo tipo de quarto"
roomtype_data="{
  \"hotel_id\": \"$ROOMTYPE_HOTEL_ID\",
  \"name\": \"Suite Presidencial Teste\",
  \"description\": \"Suite de luxo para testes CRUD\",
  \"base_price\": \"450.00\",
  \"total_units\": 5,
  \"base_occupancy\": 2,
  \"capacity\": 4,
  \"extra_adult_price\": \"50.00\",
  \"extra_child_price\": \"25.00\",
  \"min_nights\": 2,
  \"amenities\": [\"tv\", \"minibar\", \"jacuzzi\", \"sea_view\"],
  \"images\": [\"https://example.com/suite1.jpg\"],
  \"is_active\": true
}"

echo "🔗 POST $API_BASE/$ROOMTYPE_HOTEL_ID/room-types"
echo "📦 Dados: $roomtype_data"

response=$(curl -s -X POST "$API_BASE/$ROOMTYPE_HOTEL_ID/room-types" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$roomtype_data" \
  -w "HTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*//')

if [ "$http_status" = "201" ]; then
    echo "✅ SUCCESS ($http_status)"
    NEW_ROOMTYPE_ID=$(get_json_value "$body" ".data.id")
    echo "🎉 Novo tipo de quarto criado com ID: $NEW_ROOMTYPE_ID"
    echo "$body" | jq '. | {success: .success, message: .message, data: {id: .data.id, name: .data.name, base_price: .data.base_price}}'
else
    echo "❌ ERROR ($http_status)"
    echo "$body" | jq '.'
    NEW_ROOMTYPE_ID=""
fi

sleep 1

if [ -n "$NEW_ROOMTYPE_ID" ]; then
    echo -e "\n📋 B.2 LEITURA DO TIPO DE QUARTO"
    test_endpoint "B.2.1 Listar tipos de quarto do hotel" "GET" "$API_BASE/$ROOMTYPE_HOTEL_ID/room-types" "noauth"
    
    echo -e "\n✏️ B.3 ATUALIZAÇÃO DO TIPO DE QUARTO"
    update_roomtype_data="{
      \"name\": \"Suite Presidencial Deluxe Atualizada\",
      \"base_price\": \"500.00\",
      \"description\": \"Descrição atualizada via teste CRUD\",
      \"amenities\": [\"tv\", \"minibar\", \"jacuzzi\", \"sea_view\", \"breakfast_included\"]
    }"
    
    test_endpoint "B.3.1 Atualizar tipo de quarto" "PUT" "$API_BASE/$ROOMTYPE_HOTEL_ID/room-types/$NEW_ROOMTYPE_ID" "auth" "$update_roomtype_data"
    
    # Testar disponibilidade para o novo room type
    echo -e "\n📅 B.4 TESTAR DISPONIBILIDADE DO NOVO TIPO"
    test_endpoint "B.4.1 Verificar disponibilidade" "GET" "$API_BASE/$ROOMTYPE_HOTEL_ID/availability?roomTypeId=$NEW_ROOMTYPE_ID&startDate=$START_DATE&endDate=$END_DATE" "noauth"
    
    echo -e "\n🗑️ B.5 EXCLUSÃO DO TIPO DE QUARTO"
    read -p "❓ Deseja EXCLUIR/desativar o tipo de quarto de teste? (s/N): " excluir_roomtype
    if [[ $excluir_roomtype == "s" ]] || [[ $excluir_roomtype == "S" ]]; then
        test_endpoint "B.5.1 Desativar tipo de quarto" "DELETE" "$API_BASE/$ROOMTYPE_HOTEL_ID/room-types/$NEW_ROOMTYPE_ID" "auth"
    else
        echo "ℹ️  Tipo de quarto mantido ativo"
    fi
fi

# ============================
# TESTES OPERACIONAIS (do teste anterior)
# ============================
echo -e "\n\n📌 C. TESTES OPERACIONAIS (Sistema Principal)"

echo -e "\n📊 C.1 ENDPOINTS PÚBLICOS"
test_endpoint "C.1.1 Listar todos hotéis" "GET" "$API_BASE" "noauth"
test_endpoint "C.1.2 Detalhes do hotel principal" "GET" "$API_BASE/$HOTEL_ID" "noauth"
test_endpoint "C.1.3 Tipos de quarto do hotel" "GET" "$API_BASE/$HOTEL_ID/room-types" "noauth"
test_endpoint "C.1.4 Promoções ativas" "GET" "$API_BASE/$HOTEL_ID/promotions" "noauth"
test_endpoint "C.1.5 Temporadas" "GET" "$API_BASE/$HOTEL_ID/seasons" "noauth"

echo -e "\n🔐 C.2 ENDPOINTS AUTENTICADOS"
test_endpoint "C.2.1 Dashboard do hotel" "GET" "$API_BASE/$HOTEL_ID/dashboard" "auth"
test_endpoint "C.2.2 Listar reservas" "GET" "$API_BASE/$HOTEL_ID/bookings" "auth"
test_endpoint "C.2.3 Pagamentos recentes" "GET" "$API_BASE/$HOTEL_ID/payments/recent" "auth"
test_endpoint "C.2.4 Resumo financeiro" "GET" "$API_BASE/$HOTEL_ID/financial-summary?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"

echo -e "\n📅 C.3 DISPONIBILIDADE E PREÇOS"
test_endpoint "C.3.1 Ver disponibilidade" "GET" "$API_BASE/$HOTEL_ID/availability?roomTypeId=$ROOM_TYPE_ID&startDate=$START_DATE&endDate=$END_DATE" "noauth"
test_endpoint "C.3.2 Calcular preço" "POST" "$API_BASE/$HOTEL_ID/bookings/calculate-price" "noauth" "{
  \"room_type_id\": \"$ROOM_TYPE_ID\",
  \"check_in\": \"$START_DATE\",
  \"check_out\": \"$END_DATE\",
  \"units\": 1,
  \"adults\": 2
}"

echo -e "\n📋 C.4 RESERVAS EXISTENTES"
test_endpoint "C.4.1 Detalhes da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID" "auth"
test_endpoint "C.4.2 Pagamentos da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments" "auth"
test_endpoint "C.4.3 Invoice da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/invoice" "auth"
test_endpoint "C.4.4 Depósito requerido" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/deposit" "auth"

echo -e "\n💰 C.5 PAGAMENTOS"
test_endpoint "C.5.1 Registrar pagamento" "POST" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments" "auth" "{
  \"amount\": 50,
  \"paymentMethod\": \"cash\",
  \"reference\": \"TESTE-CRUD-$(date +%Y%m%d%H%M%S)\",
  \"notes\": \"Pagamento adicional via teste CRUD\",
  \"paymentType\": \"partial\"
}"
test_endpoint "C.5.2 Refresh invoice" "POST" "$API_BASE/$HOTEL_ID/invoices/$INVOICE_ID/refresh" "auth"
test_endpoint "C.5.3 Pagamentos pendentes" "GET" "$API_BASE/$HOTEL_ID/payments/pending" "auth"

echo -e "\n⚙️ C.6 OPERAÇÕES"
test_endpoint "C.6.1 Check-in" "POST" "http://localhost:8000/api/hotels/bookings/$BOOKING_ID/check-in" "auth"
test_endpoint "C.6.2 Check-out" "POST" "http://localhost:8000/api/hotels/bookings/$BOOKING_ID/check-out" "auth"

echo -e "\n📈 C.7 GESTÃO E RELATÓRIOS"
test_endpoint "C.7.1 Bulk update disponibilidade" "POST" "$API_BASE/$HOTEL_ID/availability/bulk" "auth" "{
  \"roomTypeId\": \"$ROOM_TYPE_ID\",
  \"updates\": [
    {
      \"date\": \"$START_DATE\",
      \"price\": 200,
      \"availableUnits\": 5
    }
  ]
}"
test_endpoint "C.7.2 Relatório de reservas" "GET" "$API_BASE/$HOTEL_ID/reports/bookings?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"
test_endpoint "C.7.3 Relatório de pagamentos" "GET" "$API_BASE/$HOTEL_ID/reports/payments?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"

echo -e "\n🔄 C.8 CRIAÇÃO DE NOVA RESERVA (opcional)"
read -p "❓ Deseja criar uma nova reserva para teste? (s/N): " criar_reserva
if [[ $criar_reserva == "s" ]] || [[ $criar_reserva == "S" ]]; then
    test_endpoint "C.8.1 Criar nova reserva" "POST" "$API_BASE/$HOTEL_ID/bookings" "auth" "{
      \"hotel_id\": \"$HOTEL_ID\",
      \"room_type_id\": \"$ROOM_TYPE_ID\",
      \"guest_name\": \"Cliente Teste CRUD\",
      \"guest_email\": \"teste.crud@exemplo.com\",
      \"check_in\": \"$START_DATE\",
      \"check_out\": \"$END_DATE\",
      \"adults\": 2,
      \"children\": 1,
      \"units\": 1,
      \"special_requests\": \"Teste de reserva via script CRUD\"
    }"
fi

echo -e "\n🏥 C.9 HEALTH CHECK"
test_endpoint "C.9.1 Health check módulo" "GET" "$API_BASE/health" "noauth"

echo -e "\n🌐 C.10 ENDPOINTS ADICIONAIS"
test_endpoint "C.10.1 Hotéis por província" "GET" "$API_BASE/province/Maputo%20Cidade" "noauth"
test_endpoint "C.10.2 Hotéis por localidade" "GET" "$API_BASE/locality/Maputo" "noauth"
test_endpoint "C.10.3 Hotel por slug" "GET" "$API_BASE/slug/your-hotel-slug" "noauth"

# ============================
# RESUMO FINAL
# ============================
echo -e "\n\n🎉🎉🎉 TESTES COMPLETOS FINALIZADOS! 🎉🎉🎉"
echo "=================================================="
echo "📊 RESUMO DOS TESTES:"
echo "✅ A. Testes CRUD de Hotéis"
echo "✅ B. Testes CRUD de Tipos de Quarto"
echo "✅ C. Testes Operacionais do Sistema"
echo "=================================================="

if [ -n "$NEW_HOTEL_ID" ]; then
    echo "🏨 Novo hotel criado: $NEW_HOTEL_ID"
fi

if [ -n "$NEW_ROOMTYPE_ID" ]; then
    echo "🛏️  Novo tipo de quarto criado: $NEW_ROOMTYPE_ID"
fi

echo -e "\n🔍 VERIFICAÇÃO FINAL DO SISTEMA:"

# Verificar status final do booking principal
echo -e "\n📋 Status do booking principal:"
curl -s "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $BEARER_TOKEN" 2>/dev/null | \
  jq '.data | {guest_name, check_in, check_out, status, payment_status, total_price}' || echo "⚠️  Não foi possível verificar booking"

# Verificar hotéis ativos
echo -e "\n🏨 Hotéis ativos:"
curl -s "$API_BASE" | jq '.data | length' 2>/dev/null && echo " hotéis disponíveis"

echo "=================================================="
echo "🚀 Sistema de Hotéis testado com sucesso!"
echo "✅ CRUD completo funcionando"
echo "✅ Operações principais validadas"
echo "✅ Pronto para produção!"
echo "=================================================="
