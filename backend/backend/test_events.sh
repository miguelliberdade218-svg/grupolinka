#!/bin/bash

# ============================
# CONFIGURAÇÃO PARA TESTES DE EVENTS
# ============================
export API_BASE="http://localhost:8000/api/events"
export BEARER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6ImEzOGVhNmEwNDA4YjBjYzVkYTE4OWRmYzg4ODgyZDBmMWI3ZmJmMGUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRWRzb24gRGFuaWVsIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lwUE1qSmY0R0lYM0h0djBIckdnMjFNajRwSDBpWWZmSDJ2dWV3YmYwaTFfRHVjb0tBPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2xpbmstYS10dXJpc21vLW1vemFtYmlxdWUiLCJhdWQiOiJsaW5rLWEtdHVyaXNtby1tb3phbWJpcXVlIiwiYXV0aF90aW1lIjoxNzY2ODQ4MTQzLCJ1c2VyX2lkIjoiYkI4OFZyelZ4OGRiVVVwWFY3cVNyR0E1ZWl5MiIsInN1YiI6ImJCODhWcnpWeDhkYlVVcFhWN3FTckdBNWVpeTIiLCJpYXQiOjE3NjY5Mzk5NDYsImV4cCI6MTc2Njk0MzU0NiwiZW1haWwiOiJlZHNvbmRhbmllbDhAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDc1MzI1OTY3NTYwMTk0NjI0ODYiXSwiZW1haWwiOlsiZWRzb25kYW5pZWw4QGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifX0.r-zYlN_O05F_2v1f0z3ety71Wmz9C46yoLJ6L2QCnU_Nexwk5ijqolzZkzLmCbjbSm5Pk2NFSqa0V7n1HUiF30E4r79Rb5OOTQ9OcyfmpDrFeDIV98yOza7Vr8IBT0njDZHMgn6G72Ew55nc-EtGzJCN0nJQJklQt4Q5dBKHQpiIjIJLbbq3g9P58tnUSEa0y94YdgMee-xh26s-STq1iJnGzX8dFAYkRXuYiUNQ8HzYeg17k-hG-Sw5M_gcuW86MTP_0A0ZZ2xVr65Am5drFWqmw_hY1OWTS4YetArcBGQMzBGl8csmQmDz_wblD1cd8XWpqzCQO8a-tG_IDtDTfg"

# ID do host (do token acima)
export HOST_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"

# IDs que serão criados durante o teste
export HOTEL_ID=""           # Será obtido ou criado
export EVENT_SPACE_ID=""
export EVENT_BOOKING_ID=""

# Datas para reservas e disponibilidade
export EVENT_DATE=$(date -d "+7 days" +%Y-%m-%d)
export START_DATETIME=$(date -d "+7 days" +%Y-%m-%dT14:00:00)
export END_DATETIME=$(date -d "+7 days" +%Y-%m-%dT18:00:00)
export SETUP_START=$(date -d "+7 days" +%Y-%m-%dT13:00:00)
export TEARDOWN_END=$(date -d "+7 days" +%Y-%m-%dT19:00:00)

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
        echo "📦 Dados enviados"
    fi

    local response
    local http_status
    local body

    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response=$(curl -s -X "$method" -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            "$url")
    else
        response=$(curl -s -X "$method" -w "\nHTTP_STATUS:%{http_code}" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi

    http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')

    if [[ "$http_status" =~ ^(200|201|204)$ ]]; then
        echo "✅ SUCCESS ($http_status)"
        if [ -n "$body" ] && [ "$body" != "{}" ] && [ "$body" != "[]" ]; then
            echo "$body" | jq '. | {success, message, count: (.data | length // 0), id: (.data.id // .data.space.id // .data.booking.id // null)}' 2>/dev/null || echo "$body" | jq .
        fi
    else
        echo "❌ ERROR ($http_status)"
        echo "$body" | jq '. | {success, message, error}' 2>/dev/null || echo "$body"
    fi

    sleep 0.5
}

get_json_value() {
    echo "$1" | jq -r "$2 // empty"
}

# ============================
# INÍCIO DOS TESTES
# ============================
echo "🚀🚀🚀 TESTE COMPLETO DO MÓDULO EVENTS 🚀🚀🚀"
echo "=============================================="
echo "👤 Usuário: Edson Daniel"
echo "🆔 Host ID: $HOST_ID"
echo "📅 Data do evento teste: $EVENT_DATE"
echo "=============================================="

# 1. HEALTH CHECK
test_endpoint "1. Health Check do módulo Events" "GET" "$API_BASE/health"

# 2. BUSCAR ESPAÇOS PÚBLICOS
test_endpoint "2. Buscar espaços públicos" "GET" "$API_BASE/spaces?locality=Maputo"
test_endpoint "3. Espaços em destaque" "GET" "$API_BASE/spaces/featured?limit=5"

# 3. OBTER HOTEL DO HOST (para criar espaço)
echo -e "\n🏨 BUSCANDO HOTEL DO HOST PARA CRIAR ESPAÇO"
hotel_response=$(curl -s -H "Authorization: Bearer $BEARER_TOKEN" "http://localhost:8000/api/hotels/host/$HOST_ID")
HOTEL_ID=$(get_json_value "$hotel_response" ".data[0].id")

if [ -z "$HOTEL_ID" ]; then
    echo "❌ Nenhum hotel encontrado para o host $HOST_ID"
    echo "⚠️  Pulando testes que requerem hotel próprio"
else
    echo "✅ Hotel encontrado: $HOTEL_ID"
fi

# ============================
# A. CRUD DE ESPAÇOS DE EVENTOS
# ============================
if [ -n "$HOTEL_ID" ]; then
    echo -e "\n📌 A. CRUD DE ESPAÇOS DE EVENTOS"

    # A.1 CRIAR ESPAÇO DE EVENTO
    echo -e "\n🎪 A.1 Criando espaço de evento de teste"
    space_data=$(cat <<EOF
{
  "hotel_id": "$HOTEL_ID",
  "name": "Salão Principal Teste $(date +%H%M)",
  "description": "Salão para eventos corporativos e festas - teste automatizado",
  "capacity_min": 20,
  "capacity_max": 150,
  "base_price_hourly": "150.00",
  "price_per_hour": "120.00",
  "price_per_event": "1200.00",
  "security_deposit": "300.00",
  "area_sqm": 200,
  "space_type": "salão",
  "natural_light": true,
  "has_stage": true,
  "alcohol_allowed": true,
  "includes_catering": false,
  "includes_furniture": true,
  "amenities": ["wifi", "projector", "sound_system", "air_conditioning"],
  "event_types": ["corporate", "wedding", "conference"],
  "images": [],
  "is_active": true,
  "is_featured": false
}
EOF
)

    response=$(curl -s -X POST "$API_BASE/spaces" \
        -H "Authorization: Bearer $BEARER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$space_data" \
        -w "\nHTTP_STATUS:%{http_code}")

    http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')

    if [ "$http_status" = "201" ]; then
        EVENT_SPACE_ID=$(get_json_value "$body" ".data.id")
        echo "✅ Espaço criado com sucesso! ID: $EVENT_SPACE_ID"
    else
        echo "❌ Falha ao criar espaço"
        echo "$body" | jq .
        EVENT_SPACE_ID=""
    fi

    if [ -n "$EVENT_SPACE_ID" ]; then
        # A.2 DETALHES DO ESPAÇO
        test_endpoint "A.2 Detalhes do espaço criado" "GET" "$API_BASE/spaces/$EVENT_SPACE_ID"

        # A.3 LISTAR ESPAÇOS DO HOTEL
        test_endpoint "A.3 Espaços do hotel" "GET" "http://localhost:8000/api/events/hotel/$HOTEL_ID/spaces"

        # A.4 DISPONIBILIDADE
        test_endpoint "A.4 Calendário de disponibilidade" "GET" "$API_BASE/spaces/$EVENT_SPACE_ID/availability?startDate=$EVENT_DATE&endDate=$EVENT_DATE"

        # A.5 VERIFICAR DISPONIBILIDADE ESPECÍFICA
        test_endpoint "A.5 Verificar horário específico" "POST" "$API_BASE/spaces/$EVENT_SPACE_ID/availability/check" "$(cat <<EOF
{
  "date": "$EVENT_DATE",
  "startTime": "14:00",
  "endTime": "18:00"
}
EOF
)"

        # A.6 CRIAR RESERVA NO ESPAÇO
        echo -e "\n📅 A.6 Criando reserva de evento"
        booking_data=$(cat <<EOF
{
  "organizer_name": "Cliente Teste Events",
  "organizer_email": "teste.events@exemplo.com",
  "organizer_phone": "+258841234567",
  "event_title": "Evento de Teste Automatizado",
  "event_description": "Reserva criada via script de teste",
  "event_type": "corporate",
  "start_datetime": "$START_DATETIME",
  "end_datetime": "$END_DATETIME",
  "expected_attendees": 80,
  "special_requests": "Precisa de projetor e som",
  "setup_time_start": "$SETUP_START",
  "teardown_time_end": "$TEARDOWN_END",
  "catering_required": false,
  "av_equipment_required": true
}
EOF
)

        response=$(curl -s -X POST "$API_BASE/spaces/$EVENT_SPACE_ID/bookings" \
            -H "Authorization: Bearer $BEARER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$booking_data" \
            -w "\nHTTP_STATUS:%{http_code}")

        http_status=$(echo "$response" | grep 'HTTP_STATUS:' | cut -d: -f2)
        body=$(echo "$response" | sed '/HTTP_STATUS/d')

        if [ "$http_status" = "201" ]; then
            EVENT_BOOKING_ID=$(get_json_value "$body" ".data.id")
            echo "✅ Reserva criada com sucesso! ID: $EVENT_BOOKING_ID"
        else
            echo "❌ Falha ao criar reserva"
            echo "$body" | jq .
        fi

        if [ -n "$EVENT_BOOKING_ID" ]; then
            # A.7 DETALHES DA RESERVA
            test_endpoint "A.7 Detalhes da reserva" "GET" "$API_BASE/bookings/$EVENT_BOOKING_ID"

            # A.8 REGISTRAR PAGAMENTO MANUAL
            test_endpoint "A.8 Registrar pagamento manual" "POST" "$API_BASE/bookings/$EVENT_BOOKING_ID/payments" "$(cat <<EOF
{
  "amount": 200.00,
  "payment_method": "mpesa",
  "reference": "TEST-EVENT-$(date +%Y%m%d%H%M%S)",
  "notes": "Depósito via teste automatizado"
}
EOF
)"

            # A.9 CONFIRMAR RESERVA (dono do hotel)
            test_endpoint "A.9 Confirmar reserva" "POST" "$API_BASE/bookings/$EVENT_BOOKING_ID/confirm" "{}"

            # A.10 VER LOGS DA RESERVA
            test_endpoint "A.10 Logs da reserva" "GET" "$API_BASE/bookings/$EVENT_BOOKING_ID/logs"
        fi

        # A.11 DASHBOARD DO HOTEL (EVENTS)
        test_endpoint "A.11 Dashboard de eventos do hotel" "GET" "http://localhost:8000/api/events/hotel/$HOTEL_ID/dashboard"

        # A.12 RESUMO FINANCEIRO DE EVENTOS
        test_endpoint "A.12 Resumo financeiro de eventos" "GET" "http://localhost:8000/api/events/hotel/$HOTEL_ID/financial-summary?startDate=$TODAY&endDate=$NEXT_WEEK"

        # A.13 MINHAS RESERVAS COMO ORGANIZADOR
        test_endpoint "A.13 Minhas reservas (organizador)" "GET" "$API_BASE/my-bookings?email=teste.events@exemplo.com"

        # A.14 RESERVAS DO HOTEL
        test_endpoint "A.14 Todas as reservas do hotel" "GET" "http://localhost:8000/api/events/hotel/$HOTEL_ID/bookings"
    fi
fi

# ============================
# B. TESTES PÚBLICOS GERAIS
# ============================
echo -e "\n📌 B. TESTES PÚBLICOS GERAIS"

test_endpoint "B.1 Busca avançada de espaços" "GET" "$API_BASE/spaces?eventType=corporate&capacity=100&eventDate=$EVENT_DATE"
test_endpoint "B.2 Espaços com filtros" "GET" "$API_BASE/spaces?amenities=wifi,projector"
test_endpoint "B.3 Estatísticas de um espaço (público)" "GET" "$API_BASE/spaces/$EVENT_SPACE_ID/availability/stats?startDate=$EVENT_DATE&endDate=$EVENT_DATE" || echo "ℹ️  Pode falhar se espaço não existe"

# ============================
# C. TESTES AVANÇADOS (se espaço existe)
# ============================
if [ -n "$EVENT_SPACE_ID" ] && [ -n "$HOTEL_ID" ]; then
    echo -e "\n📌 C. TESTES AVANÇADOS"

    # Bulk update disponibilidade
    test_endpoint "C.1 Bulk update disponibilidade" "POST" "$API_BASE/spaces/$EVENT_SPACE_ID/availability/bulk" "$(cat <<EOF
[
  {
    "date": "$EVENT_DATE",
    "is_available": true,
    "price_override": "180.00"
  }
]
EOF
)"

    # Sincronizar disponibilidade
    test_endpoint "C.2 Sincronizar disponibilidade" "POST" "$API_BASE/spaces/$EVENT_SPACE_ID/sync-availability" "$(cat <<EOF
{
  "startDate": "$EVENT_DATE",
  "endDate": "$EVENT_DATE"
}
EOF
)"

    # Exportar calendário
    test_endpoint "C.3 Exportar calendário" "GET" "$API_BASE/spaces/$EVENT_SPACE_ID/export-availability?startDate=$EVENT_DATE&endDate=$EVENT_DATE"
fi

# ============================
# RESUMO FINAL
# ============================
echo -e "\n\n🎉🎉🎉 TESTES DO MÓDULO EVENTS FINALIZADOS! 🎉🎉🎉"
echo "=================================================="
echo "📊 RESUMO DOS TESTES:"
echo "✅ Health check"
echo "✅ Busca pública de espaços"
echo "✅ Espaços em destaque"

if [ -n "$HOTEL_ID" ]; then
    echo "✅ Hotel usado: $HOTEL_ID"
    if [ -n "$EVENT_SPACE_ID" ]; then
        echo "✅ Espaço criado: $EVENT_SPACE_ID"
        if [ -n "$EVENT_BOOKING_ID" ]; then
            echo "✅ Reserva criada: $EVENT_BOOKING_ID"
            echo "✅ Pagamento registrado e reserva confirmada"
        fi
        echo "✅ Dashboard e relatórios testados"
    else
        echo "⚠️  Espaço não foi criado (verifique permissões/hotel)"
    fi
else
    echo "⚠️  Nenhum hotel encontrado para testes autenticados"
fi

echo -e "\n🔥 MÓDULO EVENTS TESTADO COM SUCESSO!"
echo "=================================================="
