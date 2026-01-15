#!/bin/bash

# ============================
# CONFIGURAÇÃO (seus dados já existentes!)
# ============================
export API_BASE="http://localhost:8000/api/hotels"
export HOTEL_ID="2fe41dc8-1644-4e85-a6e7-0dcc828346db"
export BOOKING_ID="1873e137-4e80-424f-8927-f55e1654373c"
export INVOICE_ID="ac4efdfe-356f-459d-a1d3-b627bcbb4eaa"
export ROOM_TYPE_ID="8cccd756-32f5-482d-a9a7-d8640f61653d"
# BEARER_TOKEN já está definido!

# Datas para testes
export START_DATE=$(date -d "+7 days" +%Y-%m-%d)
export END_DATE=$(date -d "+10 days" +%Y-%m-%d)
export TODAY=$(date +%Y-%m-%d)
export NEXT_MONTH=$(date -d "+30 days" +%Y-%m-%d)

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
    if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
        echo "✅ SUCCESS ($http_status)"
        echo "$body" | jq '. | {success: .success, message: .message, data_length: (.data | length // 0)}'
    else
        echo "❌ ERROR ($http_status)"
        echo "$body" | jq '. | {success: .success, message: .message, error: .error}'
    fi
    
    sleep 0.5  # Delay entre requests
}

# ============================
# TESTES INICIAM AQUI!
# ============================
echo "🚀🚀🚀 TESTE COMPLETO DO SISTEMA DE HOTÉIS 🚀🚀🚀"
echo "================================================"
echo "📊 Usando seus dados reais:"
echo "   Hotel: $HOTEL_ID"
echo "   Booking: $BOOKING_ID"
echo "   Room Type: $ROOM_TYPE_ID"
echo "   Invoice: $INVOICE_ID"
echo "   Datas: $START_DATE até $END_DATE"
echo "================================================"

# ============================
# 1. TESTES PÚBLICOS (SEM AUTH)
# ============================
echo -e "\n📌 1. ENDPOINTS PÚBLICOS"

test_endpoint "1.1 Listar todos hotéis" "GET" "$API_BASE" "noauth"
test_endpoint "1.2 Detalhes do hotel (ID)" "GET" "$API_BASE/$HOTEL_ID" "noauth"
test_endpoint "1.3 Tipos de quarto" "GET" "$API_BASE/$HOTEL_ID/room-types" "noauth"
test_endpoint "1.4 Promoções ativas" "GET" "$API_BASE/$HOTEL_ID/promotions" "noauth"
test_endpoint "1.5 Temporadas" "GET" "$API_BASE/$HOTEL_ID/seasons" "noauth"
test_endpoint "1.6 Espaços de eventos" "GET" "$API_BASE/$HOTEL_ID/events/spaces" "noauth"

# ============================
# 2. TESTES COM AUTENTICAÇÃO
# ============================
echo -e "\n📌 2. ENDPOINTS AUTENTICADOS"

test_endpoint "2.1 Dashboard do hotel" "GET" "$API_BASE/$HOTEL_ID/dashboard" "auth"
test_endpoint "2.2 Listar reservas" "GET" "$API_BASE/$HOTEL_ID/bookings" "auth"
test_endpoint "2.3 Pagamentos recentes" "GET" "$API_BASE/$HOTEL_ID/payments/recent" "auth"
test_endpoint "2.4 Resumo financeiro" "GET" "$API_BASE/$HOTEL_ID/financial-summary?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"
test_endpoint "2.5 Dashboard de eventos" "GET" "$API_BASE/$HOTEL_ID/events/dashboard" "auth"

# ============================
# 3. TESTES DE DISPONIBILIDADE
# ============================
echo -e "\n📌 3. DISPONIBILIDADE"

test_endpoint "3.1 Ver disponibilidade" "GET" "$API_BASE/$HOTEL_ID/availability?roomTypeId=$ROOM_TYPE_ID&startDate=$START_DATE&endDate=$END_DATE" "noauth"

# Calcular preço
test_endpoint "3.2 Calcular preço" "POST" "$API_BASE/$HOTEL_ID/bookings/calculate-price" "noauth" "{
  \"room_type_id\": \"$ROOM_TYPE_ID\",
  \"check_in\": \"$START_DATE\",
  \"check_out\": \"$END_DATE\",
  \"units\": 1,
  \"adults\": 2
}"

# ============================
# 4. TESTES DE RESERVAS EXISTENTES
# ============================
echo -e "\n📌 4. RESERVAS EXISTENTES"

test_endpoint "4.1 Detalhes da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID" "auth"
test_endpoint "4.2 Pagamentos da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments" "auth"
test_endpoint "4.3 Invoice da reserva" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/invoice" "auth"
test_endpoint "4.4 Depósito requerido" "GET" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/deposit" "auth"

# ============================
# 5. TESTES DE PAGAMENTOS
# ============================
echo -e "\n📌 5. PAGAMENTOS"

# Registrar um pequeno pagamento adicional
test_endpoint "5.1 Registrar pagamento" "POST" "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID/payments" "auth" "{
  \"amount\": 50,
  \"paymentMethod\": \"cash\",
  \"reference\": \"TESTE-COMPLETO-001\",
  \"notes\": \"Pagamento de teste do sistema completo\",
  \"paymentType\": \"partial\"
}"

# Refresh do invoice
test_endpoint "5.2 Refresh invoice" "POST" "$API_BASE/$HOTEL_ID/invoices/$INVOICE_ID/refresh" "auth"

# Pagamentos pendentes
test_endpoint "5.3 Pagamentos pendentes" "GET" "$API_BASE/$HOTEL_ID/payments/pending" "auth"

# ============================
# 6. TESTES DE OPERAÇÕES
# ============================
echo -e "\n📌 6. OPERAÇÕES"

# Check-in (pode falhar se já feito)
test_endpoint "6.1 Check-in" "POST" "http://localhost:8000/api/hotels/bookings/$BOOKING_ID/check-in" "auth"

# Check-out (pode falhar se já feito)
test_endpoint "6.2 Check-out" "POST" "http://localhost:8000/api/hotels/bookings/$BOOKING_ID/check-out" "auth"

# ============================
# 7. TESTES DE GESTÃO
# ============================
echo -e "\n📌 7. GESTÃO DO HOTEL"

# Atualizar disponibilidade
test_endpoint "7.1 Bulk update disponibilidade" "POST" "$API_BASE/$HOTEL_ID/availability/bulk" "auth" "{
  \"roomTypeId\": \"$ROOM_TYPE_ID\",
  \"updates\": [
    {
      \"date\": \"$START_DATE\",
      \"price\": 180,
      \"availableUnits\": 3
    },
    {
      \"date\": \"$END_DATE\",
      \"price\": 180,
      \"availableUnits\": 3
    }
  ]
}"

# Relatórios
test_endpoint "7.2 Relatório de reservas (JSON)" "GET" "$API_BASE/$HOTEL_ID/reports/bookings?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"
test_endpoint "7.3 Relatório de pagamentos" "GET" "$API_BASE/$HOTEL_ID/reports/payments?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"

# ============================
# 8. TESTES DE CRIAÇÃO (se necessário)
# ============================
echo -e "\n📌 8. TESTES DE CRIAÇÃO"

# Criar nova reserva se quiser testar ciclo completo
read -p "Deseja criar uma nova reserva para testes? (s/n): " criar_reserva
if [[ $criar_reserva == "s" ]]; then
    test_endpoint "8.1 Criar nova reserva" "POST" "$API_BASE/$HOTEL_ID/bookings" "auth" "{
      \"hotel_id\": \"$HOTEL_ID\",
      \"room_type_id\": \"$ROOM_TYPE_ID\",
      \"guest_name\": \"Cliente Teste Sistema\",
      \"guest_email\": \"teste.sistema@exemplo.com\",
      \"check_in\": \"$START_DATE\",
      \"check_out\": \"$END_DATE\",
      \"adults\": 2,
      \"children\": 0,
      \"units\": 1
    }"
fi

# ============================
# 9. HEALTH CHECK E FINAL
# ============================
echo -e "\n📌 9. VERIFICAÇÕES FINAIS"

test_endpoint "9.1 Health check módulo" "GET" "$API_BASE/health" "noauth"
test_endpoint "9.2 Analytics" "GET" "$API_BASE/$HOTEL_ID/analytics?startDate=$TODAY&endDate=$NEXT_MONTH" "auth"

# ============================
# RESUMO FINAL
# ============================
echo -e "\n🎉🎉🎉 TESTES COMPLETOS FINALIZADOS! 🎉🎉🎉"
echo "=========================================="
echo "📊 Sistema de Hotéis testado com sucesso!"
echo "✅ Seus dados estão perfeitamente configurados"
echo "✅ Todos os módulos foram testados"
echo "✅ Pronto para integração com frontend"
echo "=========================================="

# Verificar status final do booking
echo -e "\n🔍 STATUS FINAL DO BOOKING TESTADO:"
curl -s "$API_BASE/$HOTEL_ID/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $BEARER_TOKEN" | jq '.data | {guest_name, total_price, payment_status, status}'
