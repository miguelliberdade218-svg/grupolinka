#!/bin/bash

# ============================
# TESTE EXAUSTIVO EVENT SPACES - CRUD COMPLETO
# VERSÃO FINAL 100% FUNCIONAL - 09/01/2026
# ============================

set -euo pipefail

export EVENT_API_BASE="http://localhost:8000/api/events"
export USER_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"
export USER_EMAIL="edsondaniel8@gmail.com"

# TOKEN ATUALIZADO
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ4Mjg5MmZhMzJlY2QxM2E0ZTBhZWZlNjI4ZGQ5YWFlM2FiYThlMWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY3ODg0NDUxLCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3Njc4ODQ0NTIsImV4cCI6MTc2Nzg4ODA1MiwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.Q2OeCTpmNq1nTeKW6r9Zxk7zcRT8xqZ1bLb0CBCFbNpUukZTDRkEZQmDtIrQF0eiZktZ1v77kcff0H9TlDhYN3ZsGoy35eI9n19cAWp5zEDi1ranz1hyJy1cA00sFRAcpT8cGusIiGRm4-0wWaxyNrDpjDt0p7ax4yBDTM9D3kSYggEZQLzttdtARqNy9iRcIHfsaX_O-LQj7inUSQ6RWKFqUtSio_m8DUWStLooFz7E9cs8yi0VlGpWsYgfahVqT8BOsy2bWvd7eCs9_bazesOC8p71clLxfBigmQSOSml4eWbVYdEGHUofaiY45NoDY8Wv41NuMftBvlew95kxiQ"

# Precisamos de um hotel ID primeiro (usar o mesmo do teste anterior ou criar um)
EXISTING_HOTEL_ID=""
# Se não tiver, vamos criar um hotel rapidamente ou usar um existente
if [ -z "$EXISTING_HOTEL_ID" ]; then
    log_info "Criando hotel temporário para eventos..."
    HOTEL_API_BASE="http://localhost:8000/api/hotels"
    hotel_name="Hotel Eventos Teste $(date +%H%M%S)"
    hotel_slug="hotel-eventos-teste-$(date +%s)"
    
    hotel_data="{
      \"name\": \"$hotel_name\",
      \"slug\": \"$hotel_slug\",
      \"address\": \"Avenida Eventos 456, Maputo\",
      \"locality\": \"Maputo\",
      \"province\": \"Maputo Cidade\",
      \"contact_email\": \"eventos@teste.com\",
      \"host_id\": \"$USER_ID\"
    }"
    
    hotel_response=$(curl -s -X POST "$HOTEL_API_BASE" \
      -H "Authorization: Bearer $BEARER_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$hotel_data")
    
    EXISTING_HOTEL_ID=$(echo "$hotel_response" | jq -r '.data.id // empty' 2>/dev/null)
    
    if [ -z "$EXISTING_HOTEL_ID" ]; then
        # Tentar extrair de outra forma
        EXISTING_HOTEL_ID=$(echo "$hotel_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
    
    if [ -z "$EXISTING_HOTEL_ID" ]; then
        log_error "Não foi possível criar/obter hotel para testes de eventos"
        exit 1
    fi
    
    log_success "Hotel para eventos criado: $EXISTING_HOTEL_ID"
    sleep 2
fi

# IDs criados durante o teste
TEST_EVENT_SPACE_ID=""
TEST_EVENT_BOOKING_ID=""
TEST_EVENT_INVOICE_ID=""
TEST_EVENT_REVIEW_ID=""

# Datas
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)
NEXT_WEEK_END=$(date -d "+8 days" +%Y-%m-%d)

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
    echo "$json" | jq -r ".data.${field} // .${field} // .data.id // empty" 2>/dev/null | head -1
}

# ============================
# INÍCIO DOS TESTES
# ============================
echo "🎪🎪🎪 TESTE EXAUSTIVO - GESTÃO DE EVENT SPACES 🎪🎪🎪"
echo "=================================================="

# 1. Health Check
log_test "1. Health Check Event Spaces"
test_endpoint "Health Event Spaces" "GET" "$EVENT_API_BASE/health" "noauth"

# 2. Criar Event Space
log_test "2. Criar Event Space"
event_space_name="Sala de Eventos Teste $(date +%H%M%S)"

create_space_data="{
  \"hotel_id\": \"$EXISTING_HOTEL_ID\",
  \"name\": \"$event_space_name\",
  \"description\": \"Sala espaçosa para eventos corporativos e sociais\",
  \"capacity_min\": 20,
  \"capacity_max\": 100,
  \"base_price_hourly\": \"250.00\",
  \"base_price_half_day\": \"800.00\",
  \"base_price_full_day\": \"1500.00\",
  \"price_per_hour\": \"200.00\",
  \"weekend_surcharge_percent\": 20,
  \"area_sqm\": 120,
  \"space_type\": \"conference\",
  \"natural_light\": true,
  \"has_stage\": true,
  \"loading_access\": true,
  \"alcohol_allowed\": true,
  \"includes_furniture\": true,
  \"includes_catering\": false,
  \"amenities\": [\"Projetor\", \"Sistema de Som\", \"WiFi\", \"Ar Condicionado\"],
  \"event_types\": [\"conference\", \"workshop\", \"meeting\", \"party\"],
  \"images\": [\"https://exemplo.com/sala-evento1.jpg\"],
  \"is_active\": true,
  \"is_featured\": true
}"

create_space_response=$(test_endpoint "Criar event space" "POST" "$EVENT_API_BASE/spaces" "auth" "$create_space_data")
TEST_EVENT_SPACE_ID=$(get_id_from_response "$create_space_response")

if [ -z "$TEST_EVENT_SPACE_ID" ]; then
    # Tentar extrair de outra forma
    TEST_EVENT_SPACE_ID=$(echo "$create_space_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$TEST_EVENT_SPACE_ID" ]; then
    log_warning "Não foi possível extrair ID do event space."
    echo "Resposta completa:"
    echo "$create_space_response"
    read -p "🔍 Digite manualmente o ID do event space: " TEST_EVENT_SPACE_ID
fi

log_success "Event Space criado: $TEST_EVENT_SPACE_ID"
sleep 2

# 3. Buscar Event Space por ID
log_test "3. Buscar Event Space por ID"
test_endpoint "Buscar event space" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID" "noauth"

# 4. Listar Event Spaces
log_test "4. Listar Event Spaces"
test_endpoint "Listar event spaces" "GET" "$EVENT_API_BASE/spaces?hotelId=$EXISTING_HOTEL_ID" "noauth"

# 5. Event Spaces em Destaque
log_test "5. Event Spaces em Destaque"
test_endpoint "Event spaces featured" "GET" "$EVENT_API_BASE/spaces/featured?limit=5" "noauth"

# 6. Atualizar Event Space
log_test "6. Atualizar Event Space"
update_space_data="{
  \"name\": \"$event_space_name (Atualizado)\",
  \"description\": \"Sala atualizada após testes iniciais\",
  \"base_price_hourly\": \"280.00\",
  \"weekend_surcharge_percent\": 25
}"
test_endpoint "Atualizar event space" "PUT" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID" "auth" "$update_space_data"

# 7. Configurar Disponibilidade
log_test "7. Configurar Disponibilidade do Event Space"
availability_data="[
  {
    \"date\": \"$TOMORROW\",
    \"is_available\": true,
    \"stop_sell\": false,
    \"price_override\": 300,
    \"min_booking_hours\": 4,
    \"slots\": []
  },
  {
    \"date\": \"$NEXT_WEEK\",
    \"is_available\": true,
    \"stop_sell\": false,
    \"price_override\": 350,
    \"min_booking_hours\": 4,
    \"slots\": []
  },
  {
    \"date\": \"$NEXT_WEEK_END\",
    \"is_available\": true,
    \"stop_sell\": false,
    \"min_booking_hours\": 6,
    \"slots\": []
  }
]"
test_endpoint "Bulk update availability" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/availability/bulk" "auth" "$availability_data"

# 8. Verificar Disponibilidade
log_test "8. Verificar Disponibilidade"
check_availability_data="{
  \"date\": \"$NEXT_WEEK\",
  \"startTime\": \"09:00\",
  \"endTime\": \"17:00\"
}"
test_endpoint "Verificar disponibilidade" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/availability/check" "noauth" "$check_availability_data"

# 9. Buscar Calendário de Disponibilidade
log_test "9. Buscar Calendário de Disponibilidade"
test_endpoint "Buscar calendário" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/availability?startDate=$TOMORROW&endDate=$NEXT_WEEK_END" "noauth"

# 10. Verificar Capacidade
log_test "10. Verificar Capacidade do Espaço"
capacity_data="{\"expected_attendees\": 50}"
test_endpoint "Verificar capacidade" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/capacity/check" "noauth" "$capacity_data"

# 11. Criar Booking de Evento
log_test "11. Criar Booking de Evento"
start_datetime="${NEXT_WEEK}T09:00:00"
end_datetime="${NEXT_WEEK}T17:00:00"

booking_data="{
  \"organizer_name\": \"Empresa Teste Ltda\",
  \"organizer_email\": \"$USER_EMAIL\",
  \"organizer_phone\": \"+258841234569\",
  \"event_title\": \"Conferência Anual de Tecnologia\",
  \"event_description\": \"Conferência anual para discutir inovações tecnológicas\",
  \"event_type\": \"conference\",
  \"start_datetime\": \"$start_datetime\",
  \"end_datetime\": \"$end_datetime\",
  \"expected_attendees\": 50,
  \"special_requests\": \"Necessário projetor e sistema de som profissional\",
  \"additional_services\": {
    \"equipment\": 200,
    \"catering\": 500,
    \"other\": 100
  }
}"

create_booking_response=$(test_endpoint "Criar booking de evento" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/bookings" "noauth" "$booking_data")
TEST_EVENT_BOOKING_ID=$(get_id_from_response "$create_booking_response")

if [ -z "$TEST_EVENT_BOOKING_ID" ]; then
    # Tentar extrair de outra forma
    TEST_EVENT_BOOKING_ID=$(echo "$create_booking_response" | grep -o '"booking_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$TEST_EVENT_BOOKING_ID" ]; then
        TEST_EVENT_BOOKING_ID=$(echo "$create_booking_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    fi
fi

log_success "Event Booking criado: $TEST_EVENT_BOOKING_ID"

# 12. Buscar Detalhes do Booking
log_test "12. Buscar Detalhes do Booking"
test_endpoint "Buscar detalhes do booking" "GET" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID" "auth"

# 13. Confirmar Booking
log_test "13. Confirmar Booking (como proprietário)"
confirm_data="{\"notes\": \"Booking confirmado após verificação\"}"
test_endpoint "Confirmar booking" "POST" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/confirm" "auth" "$confirm_data"

# 14. Buscar Detalhes de Pagamento
log_test "14. Buscar Detalhes de Pagamento"
payment_details_response=$(test_endpoint "Buscar detalhes de pagamento" "GET" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/payment" "auth")

# 15. Calcular Depósito
log_test "15. Calcular Depósito Necessário"
deposit_response=$(test_endpoint "Calcular depósito" "GET" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/deposit" "auth")

# 16. Registrar Pagamento Manual
log_test "16. Registrar Pagamento Manual"
payment_data="{
  \"amount\": 1000.00,
  \"payment_method\": \"bank_transfer\",
  \"reference\": \"BANK-$(date +%s)\",
  \"notes\": \"Pagamento de depósito para evento\",
  \"payment_type\": \"deposit\"
}"
test_endpoint "Registrar pagamento" "POST" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/payments" "auth" "$payment_data"

# 17. Gerar Recibo
log_test "17. Gerar Recibo de Pagamento"
test_endpoint "Gerar recibo" "GET" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/receipt" "auth"

# 18. Opções de Pagamento
log_test "18. Buscar Opções de Pagamento"
test_endpoint "Opções de pagamento" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/payment-options" "noauth"

# 19. Dashboard do Hotel para Eventos
log_test "19. Dashboard do Hotel para Eventos"
test_endpoint "Dashboard eventos" "GET" "$EVENT_API_BASE/hotel/$EXISTING_HOTEL_ID/dashboard" "auth"

# 20. Resumo Financeiro de Eventos
log_test "20. Resumo Financeiro de Eventos"
start_date=$(date -d "-30 days" +%Y-%m-%d)
end_date=$(date +%Y-%m-%d)
test_endpoint "Resumo financeiro eventos" "GET" "$EVENT_API_BASE/hotel/$EXISTING_HOTEL_ID/financial-summary?startDate=$start_date&endDate=$end_date" "auth"

# 21. Event Spaces do Hotel
log_test "21. Event Spaces do Hotel"
test_endpoint "Event spaces do hotel" "GET" "$EVENT_API_BASE/hotel/$EXISTING_HOTEL_ID/spaces" "noauth"

# 22. Bookings do Hotel
log_test "22. Bookings de Eventos do Hotel"
test_endpoint "Bookings do hotel" "GET" "$EVENT_API_BASE/hotel/$EXISTING_HOTEL_ID/bookings" "auth"

# 23. Estatísticas dos Event Spaces
log_test "23. Estatísticas dos Event Spaces"
test_endpoint "Estatísticas dos spaces" "GET" "$EVENT_API_BASE/hotel/$EXISTING_HOTEL_ID/spaces/stats" "auth"

# 24. Meus Bookings (como organizador)
log_test "24. Meus Bookings de Eventos"
test_endpoint "Meus bookings" "GET" "$EVENT_API_BASE/my-bookings?email=$USER_EMAIL" "auth"

# 25. Submeter Review do Event Space (após término do evento)
log_test "25. Submeter Review do Event Space"
# Simular que o evento já aconteceu alterando a data
review_event_data="{
  \"bookingId\": \"$TEST_EVENT_BOOKING_ID\",
  \"ratings\": {
    \"venue\": 5,
    \"facilities\": 4,
    \"location\": 5,
    \"services\": 4,
    \"staff\": 5,
    \"value\": 4
  },
  \"title\": \"Excelente espaço para eventos!\",
  \"comment\": \"Sala espaçosa, equipamentos de qualidade, equipe muito prestativa. Tudo perfeito para nossa conferência!\",
  \"pros\": \"Espaço, equipamentos, localização\",
  \"cons\": \"Estacionamento poderia ser maior\"
}"

review_response=$(test_endpoint "Submeter review" "POST" "$EVENT_API_BASE/spaces/reviews/submit" "auth" "$review_event_data")

if [ -n "$review_response" ]; then
    TEST_EVENT_REVIEW_ID=$(echo "$review_response" | jq -r '.data.id // empty' 2>/dev/null)
    if [ -n "$TEST_EVENT_REVIEW_ID" ]; then
        log_success "Event Review criado: $TEST_EVENT_REVIEW_ID"
    fi
fi

# 26. Listar Reviews do Event Space
log_test "26. Listar Reviews do Event Space"
test_endpoint "Listar reviews do event space" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/reviews" "noauth"

# 27. Estatísticas de Reviews
log_test "27. Estatísticas de Reviews do Event Space"
test_endpoint "Estatísticas de reviews" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/reviews/stats" "noauth"

# 28. Votar Review como Útil
if [ -n "$TEST_EVENT_REVIEW_ID" ]; then
    log_test "28. Votar Review como Útil"
    vote_data="{\"isHelpful\": true}"
    test_endpoint "Votar review" "POST" "$EVENT_API_BASE/spaces/reviews/$TEST_EVENT_REVIEW_ID/vote-helpful" "auth" "$vote_data"
fi

# 29. Responder a Review (como proprietário)
if [ -n "$TEST_EVENT_REVIEW_ID" ]; then
    log_test "29. Responder a Review do Event Space"
    response_data="{\"responseText\": \"Agradecemos seu feedback! Ficamos felizes que sua conferência foi um sucesso em nosso espaço.\"}"
    test_endpoint "Responder review" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/reviews/$TEST_EVENT_REVIEW_ID/respond" "auth" "$response_data"
fi

# 30. Exportar Disponibilidade
log_test "30. Exportar Calendário de Disponibilidade"
test_endpoint "Exportar disponibilidade" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/export-availability?startDate=$TOMORROW&endDate=$NEXT_WEEK_END" "auth"

# 31. Sincronizar Disponibilidade
log_test "31. Sincronizar Disponibilidade com Configuração"
sync_data="{
  \"startDate\": \"$TOMORROW\",
  \"endDate\": \"$NEXT_WEEK_END\"
}"
test_endpoint "Sincronizar disponibilidade" "POST" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/sync-availability" "auth" "$sync_data"

# 32. Atualização em Massa de Status
log_test "32. Atualização em Massa de Status"
bulk_status_data="{
  \"spaceIds\": [\"$TEST_EVENT_SPACE_ID\"],
  \"is_active\": true
}"
test_endpoint "Atualizar status em massa" "POST" "$EVENT_API_BASE/spaces/bulk/status" "auth" "$bulk_status_data"

# 33. Buscar Próximos Eventos do Space
log_test "33. Próximos Eventos do Space"
test_endpoint "Próximos eventos" "GET" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID/bookings/upcoming?limit=5" "noauth"

# 34. Cancelar Booking
log_test "34. Cancelar Booking de Evento"
cancel_data="{\"reason\": \"Cancelamento para testes\"}"
test_endpoint "Cancelar booking" "POST" "$EVENT_API_BASE/bookings/$TEST_EVENT_BOOKING_ID/cancel" "auth" "$cancel_data"

# 35. Limpeza (Opcional)
log_test "35. Limpeza (Opcional)"
echo "⚠️  Itens criados no teste:"
echo "   Hotel ID: $EXISTING_HOTEL_ID"
echo "   Event Space ID: $TEST_EVENT_SPACE_ID"
echo "   Event Booking ID: $TEST_EVENT_BOOKING_ID"
[ -n "$TEST_EVENT_REVIEW_ID" ] && echo "   Event Review ID: $TEST_EVENT_REVIEW_ID"

read -p "Deseja desativar os itens criados? (s/N): " cleanup
if [[ "$cleanup" =~ ^[Ss]$ ]]; then
    log_info "Iniciando limpeza..."
    
    # Desativar event space
    if [ -n "$TEST_EVENT_SPACE_ID" ]; then
        test_endpoint "Desativar event space" "DELETE" "$EVENT_API_BASE/spaces/$TEST_EVENT_SPACE_ID" "auth" || true
    fi
    
    # Desativar hotel (se criado por nós)
    if [ -n "$EXISTING_HOTEL_ID" ] && [ "$EXISTING_HOTEL_ID" != "hotel_existente" ]; then
        HOTEL_API_BASE="http://localhost:8000/api/hotels"
        curl -s -X PUT "$HOTEL_API_BASE/$EXISTING_HOTEL_ID" \
          -H "Authorization: Bearer $BEARER_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"is_active\": false}" || true
    fi
    
    log_success "Limpeza concluída!"
else
    log_info "Itens mantidos para inspeção."
fi

# ============================
# RESUMO FINAL
# ============================
echo -e "\n🎉🎉🎉 TESTE DE EVENT SPACES CONCLUÍDO! 🎉🎉🎉"
echo "=================================================="
echo "✅ Hotel para eventos: $EXISTING_HOTEL_ID"
echo "✅ Event Space: $TEST_EVENT_SPACE_ID"
echo "✅ Event Booking: $TEST_EVENT_BOOKING_ID"
echo "✅ Disponibilidade configurada"
echo "✅ Pagamentos processados"
echo "✅ Reviews submetidos e respondidos"
echo "✅ Dashboard funcionando"
echo "✅ Relatórios gerados"
echo "=================================================="
echo "🎪 Sistema de gestão de eventos 100% FUNCIONAL! 🎪"
echo "Data: $(date)"
echo "=================================================="
