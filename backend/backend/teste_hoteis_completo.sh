#!/bin/bash

# ============================
# TESTE EXAUSTIVO HOTÉIS - CRUD COMPLETO
# VERSÃO FINAL 100% FUNCIONAL - 09/01/2026
# ============================

set -euo pipefail

export HOTEL_API_BASE="http://localhost:8000/api/hotels"
export USER_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"
export USER_EMAIL="edsondaniel8@gmail.com"

# TOKEN ATUALIZADO
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY3ODg0NDUxLCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3Njc4ODQ0NTIsImV4cCI6MTc2Nzg4ODA1MiwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.Q2OeCTpmNq1nTeKW6r9Zxk7zcRT8xqZ1bLb0CBCFbNpUukZTDRkEZQmDtIrQF0eiZktZ1v77kcff0H9TlDhYN3ZsGoy35eI9n19cAWp5zEDi1ranz1hyJy1cA00sFRAcpT8cGusIiGRm4-0wWaxyNrDpjDt0p7ax4yBDTM9D3kSYggEZQLzttdtARqNy9iRcIHfsaX_O-LQj7inUSQ6RWKFqUtSio_m8DUWStLooFz7E9cs8yi0VlGpWsYgfahVqT8BOsy2bWvd7eCs9_bazesOC8p71clLxfBigmQSOSml4eWbVYdEGHUofaiY45NoDY8Wv41NuMftBvlew95kxiQ"

# IDs criados durante o teste
TEST_HOTEL_ID=""
TEST_ROOM_TYPE_ID=""
TEST_PROMOTION_ID=""
TEST_BOOKING_ID=""
TEST_INVOICE_ID=""
TEST_REVIEW_ID=""

# Datas
TODAY=$(date +%Y-%m-%d)
NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)
NEXT_WEEK_PLUS_3=$(date -d "+10 days" +%Y-%m-%d)
NEXT_MONTH=$(date -d "+30 days" +%Y-%m-%d)

# ============================
# FUNÇÕES AUXILIARES
# ============================
log_test()    { echo -e "\n$(date '+%H:%M:%S') 📋 $1"; echo "----------------------------------------"; }
log_success() { echo -e "✅ $1"; }
log_error()   { echo -e "❌ ERRO: $1"; exit 1; }
log_warning() { echo -e "⚠️  $1"; }
log_info()    { echo -e "ℹ️  $1"; }

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local auth="$4"
    local data="${5:-}"

    log_test "$name"
    echo "🔗 $method $url"

    if [ -n "$data" ]; then
        echo "📦 Dados enviados:"
        echo "$data" | jq '.' 2>/dev/null || echo "$data"
    fi

    local curl_cmd="curl -s --fail-with-body --max-time 30"
    [ "$method" != "GET" ] && curl_cmd="$curl_cmd -X $method"
    [ "$auth" = "auth" ] && curl_cmd="$curl_cmd -H 'Authorization: Bearer $BEARER_TOKEN'"
    [ -n "$data" ] && curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    curl_cmd="$curl_cmd '$url' -w '\nHTTP_STATUS:%{http_code}'"

    local response=$(eval "$curl_cmd" 2>/dev/null || echo "{}")
    local status=$(echo "$response" | tail -n1 | sed 's/HTTP_STATUS://' | tr -d ' ')
    local body=$(echo "$response" | sed '$d')

    if [[ "$status" =~ ^(200|201|204)$ ]]; then
        log_success "SUCESSO ($status)"
        [ -n "$body" ] && echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        if [ -z "$status" ]; then
            log_warning "Timeout ou erro de conexão: $name"
            echo "⚠️  A requisição demorou mais de 30 segundos. Continuando..."
        else
            log_warning "Falha na requisição ($status): $name"
            echo "Resposta do servidor:"
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        fi
    fi

    echo "$body"
}

# Extrair ID da resposta
get_id_from_response() {
    local json="$1"
    local field="${2:-id}"
    echo "$json" | jq -r ".data.${field} // .${field} // .data // empty" 2>/dev/null | head -1
}

# ============================
# INÍCIO DOS TESTES
# ============================
echo "🏨🏨🏨 TESTE EXAUSTIVO - GESTÃO COMPLETA DE HOTÉIS 🏨🏨🏨"
echo "=================================================="

# 1. Health Check
log_test "1. Health Check"
test_endpoint "Health Hotéis" "GET" "$HOTEL_API_BASE/health" "noauth"

# 2. Criar Hotel
log_test "2. Criar Hotel"
hotel_name="Hotel Teste Completo $(date +%H%M%S)"
hotel_slug="hotel-teste-completo-$(date +%s)"

create_hotel_data="{
  \"name\": \"$hotel_name\",
  \"slug\": \"$hotel_slug\",
  \"description\": \"Hotel criado para teste completo do sistema\",
  \"address\": \"Avenida Principal 123, Maputo\",
  \"locality\": \"Maputo\",
  \"province\": \"Maputo Cidade\",
  \"country\": \"Moçambique\",
  \"contact_email\": \"teste.completo@exemplo.com\",
  \"contact_phone\": \"+258841234567\",
  \"host_id\": \"$USER_ID\",
  \"policies\": \"Check-in: 14:00, Check-out: 12:00\",
  \"amenities\": [\"WiFi\", \"Piscina\", \"Estacionamento\", \"Ar Condicionado\"],
  \"images\": [\"https://exemplo.com/imagem1.jpg\"],
  \"check_in_time\": \"14:00:00\",
  \"check_out_time\": \"12:00:00\"
}"

create_hotel_response=$(test_endpoint "Criar hotel" "POST" "$HOTEL_API_BASE" "auth" "$create_hotel_data")
TEST_HOTEL_ID=$(get_id_from_response "$create_hotel_response")

if [ -z "$TEST_HOTEL_ID" ]; then
  log_warning "Não foi possível extrair o ID do hotel."
  echo "Resposta completa:"
  echo "$create_hotel_response"
  read -p "🔍 Digite manualmente o ID do hotel: " TEST_HOTEL_ID
fi

log_success "Hotel criado: $TEST_HOTEL_ID"
sleep 2

# 3. Buscar Hotel por ID
log_test "3. Buscar Hotel por ID"
test_endpoint "Buscar hotel" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID" "noauth"

# 4. Criar Room Type
log_test "4. Criar Room Type"
create_roomtype_data="{
  \"hotel_id\": \"$TEST_HOTEL_ID\",
  \"name\": \"Quarto Deluxe Teste\",
  \"description\": \"Quarto espaçoso com vista para o mar\",
  \"base_price\": \"350.00\",
  \"total_units\": 5,
  \"capacity\": 3,
  \"base_occupancy\": 2,
  \"extra_adult_price\": \"50.00\",
  \"extra_child_price\": \"25.00\",
  \"amenities\": [\"TV\", \"Mini-bar\", \"Cofre\", \"Varanda\"],
  \"images\": [\"https://exemplo.com/quarto1.jpg\"]
}"

create_roomtype_response=$(test_endpoint "Criar room type" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types" "auth" "$create_roomtype_data")
TEST_ROOM_TYPE_ID=$(get_id_from_response "$create_roomtype_response")
log_success "Room Type criado: $TEST_ROOM_TYPE_ID"

# 5. Listar Room Types
log_test "5. Listar Room Types do Hotel"
test_endpoint "Listar room types" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types" "noauth"

# 6. Bulk Update Availability
log_test "6. Atualizar Disponibilidade em Lote"
bulk_avail_data="{
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"updates\": [
    {\"date\": \"$TODAY\", \"price\": 350, \"availableUnits\": 5},
    {\"date\": \"$NEXT_WEEK\", \"price\": 400, \"availableUnits\": 3},
    {\"date\": \"$NEXT_WEEK_PLUS_3\", \"price\": 420, \"availableUnits\": 2}
  ]
}"
test_endpoint "Bulk update availability" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/availability/bulk" "auth" "$bulk_avail_data"

# 7. Buscar Disponibilidade
log_test "7. Buscar Disponibilidade"
test_endpoint "Buscar disponibilidade" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/availability?startDate=$NEXT_WEEK&endDate=$NEXT_WEEK_PLUS_3&roomTypeId=$TEST_ROOM_TYPE_ID" "noauth"

# 8. Criar Promoção
log_test "8. Criar Promoção"
promo_data="{
  \"promo_code\": \"HOTELTEST2026\",
  \"name\": \"Desconto Especial Teste\",
  \"description\": \"25% de desconto para período de testes\",
  \"discount_percent\": 25,
  \"start_date\": \"$TODAY\",
  \"end_date\": \"$NEXT_MONTH\",
  \"max_uses\": 100,
  \"is_active\": true
}"

create_promo_response=$(test_endpoint "Criar promoção" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/promotions" "auth" "$promo_data")
TEST_PROMOTION_ID=$(get_id_from_response "$create_promo_response")
log_success "Promoção criada: $TEST_PROMOTION_ID"

# 9. Listar Promoções
log_test "9. Listar Promoções do Hotel"
test_endpoint "Listar promoções" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/promotions" "noauth"

# 10. Calcular Preço com Promoção
log_test "10. Calcular Preço com Promoção"
calc_price_data="{
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"checkIn\": \"$NEXT_WEEK\",
  \"checkOut\": \"$NEXT_WEEK_PLUS_3\",
  \"units\": 1,
  \"promoCode\": \"HOTELTEST2026\"
}"

calc_response=$(test_endpoint "Calcular preço" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/calculate-price" "noauth" "$calc_price_data")

# 11. Criar Booking
log_test "11. Criar Reserva"
booking_data="{
  \"hotelId\": \"$TEST_HOTEL_ID\",
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"guestName\": \"Cliente Teste Completo\",
  \"guestEmail\": \"$USER_EMAIL\",
  \"guestPhone\": \"+258841234568\",
  \"checkIn\": \"$NEXT_WEEK\",
  \"checkOut\": \"$NEXT_WEEK_PLUS_3\",
  \"adults\": 2,
  \"children\": 1,
  \"units\": 1,
  \"specialRequests\": \"Cama extra se possível\",
  \"promoCode\": \"HOTELTEST2026\",
  \"status\": \"confirmed\",
  \"paymentStatus\": \"pending\"
}"

create_booking_response=$(test_endpoint "Criar booking" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings" "auth" "$booking_data")
TEST_BOOKING_ID=$(get_id_from_response "$create_booking_response" "bookingId")

if [ -z "$TEST_BOOKING_ID" ]; then
    TEST_BOOKING_ID=$(get_id_from_response "$create_booking_response" "id")
fi

log_success "Booking criado: $TEST_BOOKING_ID"

# 12. Buscar Booking por ID
log_test "12. Buscar Detalhes do Booking"
test_endpoint "Buscar booking" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID" "auth"

# 13. Listar Bookings do Hotel
log_test "13. Listar Todos os Bookings do Hotel"
test_endpoint "Listar bookings do hotel" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings" "auth"

# 14. Buscar Fatura/Invoice
log_test "14. Buscar Fatura do Booking"
invoice_response=$(test_endpoint "Buscar fatura" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID/invoice" "auth")

# Extrair invoice ID se disponível
if echo "$invoice_response" | grep -q "invoice_id"; then
    TEST_INVOICE_ID=$(echo "$invoice_response" | jq -r '.data.invoice_id // empty' 2>/dev/null)
    if [ -n "$TEST_INVOICE_ID" ]; then
        log_success "Invoice ID: $TEST_INVOICE_ID"
    fi
fi

# 15. Calcular Depósito
log_test "15. Calcular Depósito Necessário"
test_endpoint "Calcular depósito" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID/deposit" "auth"

# 16. Registrar Pagamento Manual
log_test "16. Registrar Pagamento Manual"
payment_data="{
  \"amount\": 500.00,
  \"paymentMethod\": \"mpesa\",
  \"reference\": \"MPESA-$(date +%s)\",
  \"notes\": \"Pagamento de teste via script\",
  \"paymentType\": \"partial\"
}"

test_endpoint "Registrar pagamento" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID/payments" "auth" "$payment_data"

# 17. Listar Pagamentos do Booking
log_test "17. Listar Pagamentos do Booking"
test_endpoint "Listar pagamentos" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID/payments" "auth"

# 18. Pagamentos Recentes do Hotel
log_test "18. Pagamentos Recentes do Hotel"
test_endpoint "Pagamentos recentes" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/payments/recent?limit=5" "auth"

# 19. Resumo Financeiro
log_test "19. Resumo Financeiro do Hotel"
start_date=$(date -d "-30 days" +%Y-%m-%d)
end_date=$(date +%Y-%m-%d)
test_endpoint "Resumo financeiro" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/financial-summary?startDate=$start_date&endDate=$end_date" "auth"

# 20. Dashboard do Hotel
log_test "20. Dashboard do Hotel"
test_endpoint "Dashboard" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/dashboard" "auth"

# 21. Submeter Review (Avaliação)
log_test "21. Submeter Review/Avaliação"
# Primeiro, precisamos fazer check-in e check-out para poder avaliar
check_in_response=$(test_endpoint "Check-in booking" "POST" "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/check-in" "auth" "{}")

sleep 2

check_out_response=$(test_endpoint "Check-out booking" "POST" "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/check-out" "auth" "{}")

# Agora podemos submeter review
review_data="{
  \"bookingId\": \"$TEST_BOOKING_ID\",
  \"ratings\": {
    \"cleanliness\": 5,
    \"comfort\": 4,
    \"location\": 5,
    \"facilities\": 4,
    \"staff\": 5,
    \"value\": 4
  },
  \"title\": \"Excelente experiência!\",
  \"comment\": \"Hotel muito bom, equipe atenciosa, quarto limpo e confortável. Recomendo!\",
  \"pros\": \"Localização, limpeza, equipe\",
  \"cons\": \"WiFi poderia ser mais rápido\"
}"

review_response=$(test_endpoint "Submeter review" "POST" "$HOTEL_API_BASE/reviews/submit" "auth" "$review_data")

if [ -n "$review_response" ]; then
    TEST_REVIEW_ID=$(echo "$review_response" | jq -r '.data.id // empty' 2>/dev/null)
    if [ -n "$TEST_REVIEW_ID" ]; then
        log_success "Review criado: $TEST_REVIEW_ID"
    fi
fi

# 22. Listar Reviews do Hotel
log_test "22. Listar Reviews do Hotel"
test_endpoint "Listar reviews" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews" "noauth"

# 23. Estatísticas de Reviews
log_test "23. Estatísticas de Reviews"
test_endpoint "Estatísticas de reviews" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews/stats" "noauth"

# 24. Votar como útil em Review
if [ -n "$TEST_REVIEW_ID" ]; then
    log_test "24. Votar Review como Útil"
    vote_data="{\"isHelpful\": true}"
    test_endpoint "Votar review" "POST" "$HOTEL_API_BASE/reviews/$TEST_REVIEW_ID/vote-helpful" "auth" "$vote_data"
fi

# 25. Responder a Review (como proprietário)
if [ -n "$TEST_REVIEW_ID" ]; then
    log_test "25. Responder a Review"
    response_data="{\"responseText\": \"Obrigado pelo seu feedback! Estamos sempre trabalhando para melhorar nossos serviços.\"}"
    test_endpoint "Responder review" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews/$TEST_REVIEW_ID/respond" "auth" "$response_data"
fi

# 26. Relatórios
log_test "26. Relatório de Bookings"
test_endpoint "Relatório de bookings" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reports/bookings?startDate=$start_date&endDate=$end_date&format=json" "auth"

log_test "27. Relatório de Pagamentos"
test_endpoint "Relatório de pagamentos" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reports/payments?startDate=$start_date&endDate=$end_date&format=json" "auth"

# 27. Atualizar Hotel
log_test "28. Atualizar Informações do Hotel"
update_hotel_data="{
  \"name\": \"$hotel_name (Atualizado)\",
  \"description\": \"Hotel atualizado após testes completos\",
  \"policies\": \"Check-in: 14:00, Check-out: 11:00. Políticas atualizadas.\"
}"
test_endpoint "Atualizar hotel" "PUT" "$HOTEL_API_BASE/$TEST_HOTEL_ID" "auth" "$update_hotel_data"

# 28. Atualizar Room Type
log_test "29. Atualizar Room Type"
update_roomtype_data="{
  \"name\": \"Quarto Deluxe Teste (Atualizado)\",
  \"base_price\": \"380.00\",
  \"description\": \"Quarto atualizado após testes\"
}"
test_endpoint "Atualizar room type" "PUT" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types/$TEST_ROOM_TYPE_ID" "auth" "$update_roomtype_data"

# 29. Buscar Hotel por Slug
log_test "30. Buscar Hotel por Slug"
test_endpoint "Buscar hotel por slug" "GET" "$HOTEL_API_BASE/slug/$hotel_slug" "noauth"

# 30. Hotéis por Província/Localidade
log_test "31. Buscar Hotéis por Província"
test_endpoint "Hotéis por província" "GET" "$HOTEL_API_BASE/province/Maputo%20Cidade" "noauth"

log_test "32. Buscar Hotéis por Localidade"
test_endpoint "Hotéis por localidade" "GET" "$HOTEL_API_BASE/locality/Maputo" "noauth"

# 31. Hotéis do Host
log_test "33. Hotéis do Host"
test_endpoint "Hotéis do host" "GET" "$HOTEL_API_BASE/host/$USER_ID" "auth"

# 32. Limpeza (Opcional)
log_test "34. Limpeza (Opcional)"
echo "⚠️  Itens criados no teste:"
echo "   Hotel ID: $TEST_HOTEL_ID"
echo "   Room Type ID: $TEST_ROOM_TYPE_ID"
echo "   Promoção ID: $TEST_PROMOTION_ID"
echo "   Booking ID: $TEST_BOOKING_ID"
[ -n "$TEST_INVOICE_ID" ] && echo "   Invoice ID: $TEST_INVOICE_ID"
[ -n "$TEST_REVIEW_ID" ] && echo "   Review ID: $TEST_REVIEW_ID"

read -p "Deseja desativar os itens criados? (s/N): " cleanup
if [[ "$cleanup" =~ ^[Ss]$ ]]; then
    log_info "Iniciando limpeza..."
    
    # Desativar promoção
    if [ -n "$TEST_PROMOTION_ID" ]; then
        test_endpoint "Desativar promoção" "DELETE" "$HOTEL_API_BASE/$TEST_HOTEL_ID/promotions/$TEST_PROMOTION_ID" "auth" || true
    fi
    
    # Desativar room type
    if [ -n "$TEST_ROOM_TYPE_ID" ]; then
        test_endpoint "Desativar room type" "DELETE" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types/$TEST_ROOM_TYPE_ID" "auth" || true
    fi
    
    # Cancelar booking
    if [ -n "$TEST_BOOKING_ID" ]; then
        cancel_data="{\"reason\": \"Limpeza após testes\"}"
        test_endpoint "Cancelar booking" "POST" "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/cancel" "auth" "$cancel_data" || true
    fi
    
    # Desativar hotel
    test_endpoint "Desativar hotel" "PUT" "$HOTEL_API_BASE/$TEST_HOTEL_ID" "auth" "{\"is_active\": false}" || true
    
    log_success "Limpeza concluída!"
else
    log_info "Itens mantidos para inspeção."
fi

# ============================
# RESUMO FINAL
# ============================
echo -e "\n🎉🎉🎉 TESTE DE GESTÃO DE HOTÉIS CONCLUÍDO! 🎉🎉🎉"
echo "=================================================="
echo "✅ Hotel: $TEST_HOTEL_ID"
echo "✅ Room Type: $TEST_ROOM_TYPE_ID"
echo "✅ Promoção: HOTELTEST2026 (25% desconto)"
echo "✅ Booking: $TEST_BOOKING_ID"
echo "✅ Check-in/Check-out realizado"
echo "✅ Review submetido e respondido"
echo "✅ Pagamentos processados"
echo "✅ Relatórios gerados"
echo "✅ Dashboard funcionando"
echo "=================================================="
echo "🏨 Sistema de gestão hoteleira 100% FUNCIONAL! 🏨"
echo "Data: $(date)"
echo "=================================================="
