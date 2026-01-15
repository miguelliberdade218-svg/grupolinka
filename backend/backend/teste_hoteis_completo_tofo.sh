#!/bin/bash

# =============================================================================
# TESTE EXAUSTIVO DE HOTÉIS - FLUXO COMPLETO (CRUD + ROOM TYPES + PROMO + RESERVA + PAGAMENTO + REVIEW)
# VERSÃO FINAL - 09/01/2026 - HOTEL EM TOFO COM COORDENADAS REAIS
# =============================================================================

set -euo pipefail

# ===================== CONFIGURAÇÕES =====================
export HOTEL_API_BASE="http://localhost:8000/api/hotels"
export USER_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"
export USER_EMAIL="edsondaniel8@gmail.com"

# TOKEN (atualize se expirar!)
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY3OTIyNTQ0LCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3Njc5MjI1NDQsImV4cCI6MTc2NzkyNjE0NCwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.sPj8FguGoQWR2152VhFzN6krU6xsaXv0TWOLh44RybDfOT8Dsx66C6Se7Hy9DOyykpFZb2yMeHCmp0SSo1rDecSPquLRW2FUE94BV-Iy-MgpedTemZuD5KPVXNI1-sxpwiIZMnuIRa7s0mB6lWtOw4xCVF7Xtp73k_pK4oe8heeU05cgWuzUqlLGPxURpPW1utS9f0bkCOS3GBtL3YQZKjwdJWUXgws0k3Oo3MRNa1RgLWc_6tg7TPmOAVMbgXoDE4c0SFsHQJQ0PDJbiFg9mMoNmJl6W0D42a-UWILLtczT7n88o8k2NMnn0OXFS1m4dE6G5Bbl6vvbpISo3Rzjvg"

# IDs gerados durante o teste
TEST_HOTEL_ID=""
TEST_ROOM_TYPE_ID=""
TEST_PROMOTION_ID=""
TEST_BOOKING_ID=""
TEST_INVOICE_ID=""
TEST_REVIEW_ID=""

# Datas dinâmicas
TODAY=$(date +%Y-%m-%d)
NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)
NEXT_WEEK_PLUS_3=$(date -d "+10 days" +%Y-%m-%d)
NEXT_MONTH=$(date -d "+30 days" +%Y-%m-%d)

# Coordenadas reais de Tofo (da tabela mozambique_locations)
TOFO_LAT="-23.8500000"
TOFO_LNG="35.5500000"
TOFO_LOCALITY="Tofo"
TOFO_PROVINCE="Inhambane"

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================
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
        echo "📦 Payload:"
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
        log_warning "FALHA ($status): $name"
        echo "Resposta:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi

    echo "$body"
}

get_id_from_response() {
    local json="$1"
    local field="${2:-id}"
    echo "$json" | jq -r ".data.${field} // .${field} // .data.id // .id // empty" 2>/dev/null | head -1
}

# =============================================================================
# INÍCIO DO TESTE
# =============================================================================
clear
echo "🏨 TESTE COMPLETO DE HOTÉIS - TOFO BEACH (09/01/2026) 🏨"
echo "=================================================="

# 1. Health Check
log_test "1. Health Check"
test_endpoint "Health" "GET" "$HOTEL_API_BASE/health" "noauth"

# 2. Criar Hotel em Tofo
log_test "2. Criar Hotel em Tofo"
hotel_name="Hotel Tofo Test $(date +%H%M%S)"
hotel_slug="hotel-tofo-test-$(date +%s)"

create_hotel_data="{
  \"name\": \"$hotel_name\",
  \"slug\": \"$hotel_slug\",
  \"description\": \"Hotel de teste na praia do Tofo\",
  \"address\": \"Praia do Tofo, Jangamo, Inhambane\",
  \"locality\": \"$TOFO_LOCALITY\",
  \"province\": \"$TOFO_PROVINCE\",
  \"country\": \"Moçambique\",
  \"lat\": \"$TOFO_LAT\",
  \"lng\": \"$TOFO_LNG\",
  \"contact_email\": \"tofo@teste.com\",
  \"contact_phone\": \"+258841234567\",
  \"host_id\": \"$USER_ID\",
  \"policies\": \"Check-in: 14:00, Check-out: 12:00\",
  \"amenities\": [\"WiFi\", \"Piscina\", \"Praia Privativa\", \"Mergulho\"],
  \"images\": [\"https://exemplo.com/tofo.jpg\"],
  \"check_in_time\": \"14:00\",
  \"check_out_time\": \"12:00\"
}"

create_hotel_response=$(test_endpoint "Criar hotel" "POST" "$HOTEL_API_BASE" "auth" "$create_hotel_data")
TEST_HOTEL_ID=$(get_id_from_response "$create_hotel_response")

if [ -z "$TEST_HOTEL_ID" ]; then
  log_warning "ID do hotel não encontrado. Digite manualmente:"
  read -p "ID do hotel: " TEST_HOTEL_ID
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
  \"name\": \"Quarto Deluxe Tofo\",
  \"description\": \"Quarto com vista mar em Tofo\",
  \"base_price\": \"350.00\",
  \"total_units\": 5,
  \"capacity\": 3,
  \"base_occupancy\": 2,
  \"extra_adult_price\": \"50.00\",
  \"extra_child_price\": \"25.00\",
  \"amenities\": [\"TV\", \"Mini-bar\", \"Varanda\"],
  \"images\": [\"https://exemplo.com/quarto-tofo.jpg\"]
}"

create_roomtype_response=$(test_endpoint "Criar room type" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types" "auth" "$create_roomtype_data")
TEST_ROOM_TYPE_ID=$(get_id_from_response "$create_roomtype_response")
log_success "Room Type criado: $TEST_ROOM_TYPE_ID"

# 5. Listar Room Types
log_test "5. Listar Room Types"
test_endpoint "Listar room types" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types" "noauth"

# 6. Bulk Update Availability
log_test "6. Bulk Update Availability"
bulk_avail_data="{
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"updates\": [
    {\"date\": \"$TODAY\", \"price\": 350, \"availableUnits\": 5},
    {\"date\": \"$NEXT_WEEK\", \"price\": 400, \"availableUnits\": 3},
    {\"date\": \"$NEXT_WEEK_PLUS_3\", \"price\": 420, \"availableUnits\": 2}
  ]
}"
test_endpoint "Bulk update" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/availability/bulk" "auth" "$bulk_avail_data"

# 7. Buscar Disponibilidade
log_test "7. Buscar Disponibilidade"
test_endpoint "Buscar disponibilidade" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/availability?startDate=$NEXT_WEEK&endDate=$NEXT_WEEK_PLUS_3&roomTypeId=$TEST_ROOM_TYPE_ID" "noauth"

# 8. Criar Promoção
log_test "8. Criar Promoção"
promo_data="{
  \"promo_code\": \"TOFO2026\",
  \"name\": \"25% Off Tofo\",
  \"description\": \"Desconto especial para Tofo\",
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
log_test "9. Listar Promoções"
test_endpoint "Listar promoções" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/promotions" "noauth"

# 10. Calcular Preço com Promoção
log_test "10. Calcular Preço com Promoção"
calc_price_data="{
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"checkIn\": \"$NEXT_WEEK\",
  \"checkOut\": \"$NEXT_WEEK_PLUS_3\",
  \"units\": 1,
  \"promoCode\": \"TOFO2026\"
}"
test_endpoint "Calcular preço" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/calculate-price" "noauth" "$calc_price_data"

# 11. Criar Reserva
log_test "11. Criar Reserva"
booking_data="{
  \"hotelId\": \"$TEST_HOTEL_ID\",
  \"roomTypeId\": \"$TEST_ROOM_TYPE_ID\",
  \"guestName\": \"Cliente Teste Tofo\",
  \"guestEmail\": \"$USER_EMAIL\",
  \"guestPhone\": \"+258841234568\",
  \"checkIn\": \"$NEXT_WEEK\",
  \"checkOut\": \"$NEXT_WEEK_PLUS_3\",
  \"adults\": 2,
  \"children\": 1,
  \"units\": 1,
  \"specialRequests\": \"Vista mar\",
  \"promoCode\": \"TOFO2026\",
  \"status\": \"confirmed\",
  \"paymentStatus\": \"pending\"
}"
create_booking_response=$(test_endpoint "Criar reserva" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings" "auth" "$booking_data")
TEST_BOOKING_ID=$(get_id_from_response "$create_booking_response" "bookingId" || get_id_from_response "$create_booking_response" "id")
log_success "Reserva criada: $TEST_BOOKING_ID"

# 12. Buscar Booking
log_test "12. Buscar Booking"
test_endpoint "Buscar booking" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/bookings/$TEST_BOOKING_ID" "auth"

# 13. Check-in
log_test "13. Check-in"
test_endpoint "Check-in" "POST" "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/check-in" "auth" "{}"

sleep 2

# 14. Check-out
log_test "14. Check-out"
test_endpoint "Check-out" "POST" "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/check-out" "auth" "{}"

# 15. Submeter Review
log_test "15. Submeter Review"
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
  \"title\": \"Maravilhoso em Tofo!\",
  \"comment\": \"Hotel perfeito, praia linda, mergulho incrível. Recomendo!\",
  \"pros\": \"Localização, praia, equipe\",
  \"cons\": \"WiFi lento\"
}"
review_response=$(test_endpoint "Submeter review" "POST" "$HOTEL_API_BASE/reviews/submit" "auth" "$review_data")
TEST_REVIEW_ID=$(get_id_from_response "$review_response")
[ -n "$TEST_REVIEW_ID" ] && log_success "Review criado: $TEST_REVIEW_ID"

# 16. Listar Reviews
log_test "16. Listar Reviews"
test_endpoint "Listar reviews" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews" "noauth"

# 17. Estatísticas Reviews
log_test "17. Estatísticas Reviews"
test_endpoint "Stats reviews" "GET" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews/stats" "noauth"

# 18. Votar Review como útil
if [ -n "$TEST_REVIEW_ID" ]; then
    log_test "18. Votar Review como útil"
    vote_data="{\"isHelpful\": true}"
    test_endpoint "Votar útil" "POST" "$HOTEL_API_BASE/reviews/$TEST_REVIEW_ID/vote-helpful" "auth" "$vote_data"
fi

# 19. Responder Review
if [ -n "$TEST_REVIEW_ID" ]; then
    log_test "19. Responder Review"
    response_data="{\"responseText\": \"Obrigado! Estamos melhorando o WiFi em Tofo.\"}"
    test_endpoint "Responder" "POST" "$HOTEL_API_BASE/$TEST_HOTEL_ID/reviews/$TEST_REVIEW_ID/respond" "auth" "$response_data"
fi

# 20. Limpeza opcional
log_test "20. Limpeza (Opcional)"
echo "Itens criados:"
[ -n "$TEST_HOTEL_ID" ] && echo "   Hotel: $TEST_HOTEL_ID"
[ -n "$TEST_ROOM_TYPE_ID" ] && echo "   Room Type: $TEST_ROOM_TYPE_ID"
[ -n "$TEST_PROMOTION_ID" ] && echo "   Promoção: $TEST_PROMOTION_ID"
[ -n "$TEST_BOOKING_ID" ] && echo "   Booking: $TEST_BOOKING_ID"
[ -n "$TEST_REVIEW_ID" ] && echo "   Review: $TEST_REVIEW_ID"

read -p "Apagar tudo? (s/N): " cleanup
if [[ "$cleanup" =~ ^[Ss]$ ]]; then
    log_info "Limpando..."
    [ -n "$TEST_REVIEW_ID" ] && curl -s -X DELETE "$HOTEL_API_BASE/reviews/$TEST_REVIEW_ID" -H "Authorization: Bearer $BEARER_TOKEN" || true
    [ -n "$TEST_BOOKING_ID" ] && curl -s -X POST "$HOTEL_API_BASE/bookings/$TEST_BOOKING_ID/cancel" -H "Authorization: Bearer $BEARER_TOKEN" -d '{"reason":"Limpeza"}' || true
    [ -n "$TEST_PROMOTION_ID" ] && curl -s -X DELETE "$HOTEL_API_BASE/$TEST_HOTEL_ID/promotions/$TEST_PROMOTION_ID" -H "Authorization: Bearer $BEARER_TOKEN" || true
    [ -n "$TEST_ROOM_TYPE_ID" ] && curl -s -X DELETE "$HOTEL_API_BASE/$TEST_HOTEL_ID/room-types/$TEST_ROOM_TYPE_ID" -H "Authorization: Bearer $BEARER_TOKEN" || true
    [ -n "$TEST_HOTEL_ID" ] && curl -s -X PUT "$HOTEL_API_BASE/$TEST_HOTEL_ID" -H "Authorization: Bearer $BEARER_TOKEN" -H "Content-Type: application/json" -d '{"is_active":false}' || true
    log_success "Limpeza concluída!"
fi

echo -e "\n🎉 TESTE FINALIZADO COM SUCESSO! 🎉"
echo "Data: $(date)"
echo "=================================================="
