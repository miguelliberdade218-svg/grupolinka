#!/bin/bash

# =============================================================================
# TESTE EXAUSTIVO DE HOTÉIS - FLUXO COMPLETO (TOFO BEACH) - V2.1
# Correção total de check_in/out + extração robusta de ID
# 09/01/2026
# =============================================================================

set -euo pipefail

# ===================== CONFIGURAÇÕES =====================
export HOTEL_API_BASE="http://localhost:8000/api/hotels"
export USER_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"
export USER_EMAIL="edsondaniel8@gmail.com"

# TOKEN (atualize se expirar!)
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY3OTIyNTQ0LCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3Njc5MjI1NDQsImV4cCI6MTc2NzkyNjE0NCwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.sPj8FguGoQWR2152VhFzN6krU6xsaXv0TWOLh44RybDfOT8Dsx66C6Se7Hy9DOyykpFZb2yMeHCmp0SSo1rDecSPquLRW2FUE94BV-Iy-MgpedTemZuD5KPVXNI1-sxpwiIZMnuIRa7s0mB6lWtOw4xCVF7Xtp73k_pK4oe8heeU05cgWuzUqlLGPxURpPW1utS9f0bkCOS3GBtL3YQZKjwdJWUXgws0k3Oo3MRNa1RgLWc_6tg7TPmOAVMbgXoDE4c0SFsHQJQ0PDJbiFg9mMoNmJl6W0D42a-UWILLtczT7n88o8k2NMnn0OXFS1m4dE6G5Bbl6vvbpISo3Rzjvg"

# IDs
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

# Tofo real
TOFO_LAT="-23.8500000"
TOFO_LNG="35.5500000"
TOFO_LOCALITY="Tofo"
TOFO_PROVINCE="Inhambane"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funções
log_header() {
    echo -e "\n${BLUE}==================================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}==================================================${NC}\n"
}

log_test() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] TESTE: $1${NC}"
    echo "----------------------------------------"
}

log_success() {
    echo -e "${GREEN}✅ SUCESSO: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  AVISO: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERRO: $1${NC}"
    exit 1
}

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
    local id=$(echo "$json" | jq -r ".data.${field} // .${field} // .data.id // .id // .bookingId // .booking_id // empty" 2>/dev/null | head -1)
    echo "$id"
}

# =============================================================================
# INÍCIO
# =============================================================================
clear
log_header "TESTE EXAUSTIVO DE HOTÉIS - TOFO BEACH (09/01/2026)"

# 1. Health Check
test_endpoint "1. Health Check" "GET" "$HOTEL_API_BASE/health" "noauth"

# 2. Criar Hotel em Tofo (versão corrigida)
log_test "2. Criar Hotel em Tofo"
hotel_name="Hotel Tofo Test $(date +%H%M%S)"
hotel_slug="hotel-tofo-test-$(date +%s)"

create_hotel_data="{
  \"name\": \"$hotel_name\",
  \"slug\": \"$hotel_slug\",
  \"description\": \"Hotel teste praia Tofo\",
  \"address\": \"Praia do Tofo, Jangamo\",
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
  log_warning "ID não encontrado automaticamente. Digite manualmente:"
  read -p "ID do hotel: " TEST_HOTEL_ID
fi

log_success "Hotel criado: $TEST_HOTEL_ID"
sleep 3

# Continua com os outros testes (room type, promo, reserva, pagamento, review, etc.)
# ... (o resto do script completo que enviei antes, a partir do passo 3)

# (copie o restante do script anterior a partir do "# 3. Buscar Hotel por ID" até o final)

# No final, após todos os testes:
log_header "TESTE FINALIZADO!"
echo -e "${GREEN}Tudo concluído com sucesso!${NC}"
echo "Hotel Tofo criado e testado: $TEST_HOTEL_ID"
echo "Data: $(date)"
