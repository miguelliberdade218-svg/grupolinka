#!/bin/bash
# test-event-payments.sh

echo "=== TESTE DO SISTEMA DE PAGAMENTOS DE EVENTOS ==="
echo ""

# 1. Primeiro verificar se a API está funcionando
echo "1. Testando saúde da API..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/health" -H "$AUTH_HEADER")
if echo "$HEALTH_RESPONSE" | grep -q '"success":true'; then
  echo "✅ API de eventos está saudável"
else
  echo "❌ API de eventos não está respondendo"
  echo "Resposta: $HEALTH_RESPONSE"
  exit 1
fi

# 2. Criar um novo espaço de evento para teste
echo ""
echo "2. Criando espaço de evento para teste..."
SPACE_RESPONSE=$(curl -s -X POST "$BASE_URL/spaces" \
  -H "$AUTH_HEADER" \
  -H "$JSON_HEADER" \
  -d '{
    "hotel_id": "'"$HOTEL_ID"'",
    "name": "Espaço Teste Pagamentos 2026",
    "description": "Espaço criado para testar o novo sistema de pagamentos",
    "capacity_min": 15,
    "capacity_max": 40,
    "base_price_hourly": "400",
    "price_per_hour": "350",
    "price_per_day": "2000",
    "area_sqm": 50,
    "alcohol_allowed": true,
    "amenities": ["wifi","projetor","som"],
    "event_types": ["teste","workshop"],
    "is_active": true
  }')

echo "Resposta criação espaço:"
echo "$SPACE_RESPONSE" | jq '.'

# Extrair ID do espaço
EVENT_SPACE_ID=$(echo "$SPACE_RESPONSE" | jq -r '.data.id')
if [ "$EVENT_SPACE_ID" == "null" ] || [ -z "$EVENT_SPACE_ID" ]; then
  echo "❌ Falha ao criar espaço de evento"
  exit 1
fi
echo "✅ Espaço criado com ID: $EVENT_SPACE_ID"

# 3. Criar uma reserva
echo ""
echo "3. Criando reserva de evento..."
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/spaces/$EVENT_SPACE_ID/bookings" \
  -H "$AUTH_HEADER" \
  -H "$JSON_HEADER" \
  -d '{
    "organizer_name": "Testador Pagamentos",
    "organizer_email": "teste.pagamento@exemplo.com",
    "organizer_phone": "+258841234567",
    "event_title": "Workshop Teste Pagamentos 2026",
    "event_type": "workshop",
    "start_datetime": "2026-07-01T09:00:00Z",
    "end_datetime": "2026-07-01T17:00:00Z",
    "expected_attendees": 25,
    "special_requests": "Teste completo do sistema de pagamentos"
  }')

echo "Resposta criação reserva:"
echo "$BOOKING_RESPONSE" | jq '.'

# Extrair ID da reserva
EVENT_BOOKING_ID=$(echo "$BOOKING_RESPONSE" | jq -r '.data.id')
if [ "$EVENT_BOOKING_ID" == "null" ] || [ -z "$EVENT_BOOKING_ID" ]; then
  echo "❌ Falha ao criar reserva"
  exit 1
fi
echo "✅ Reserva criada com ID: $EVENT_BOOKING_ID"

# 4. Confirmar a reserva (como dono do hotel)
echo ""
echo "4. Confirmando reserva..."
CONFIRM_RESPONSE=$(curl -s -X POST "$BASE_URL/bookings/$EVENT_BOOKING_ID/confirm" \
  -H "$AUTH_HEADER" \
  -H "$JSON_HEADER" \
  -d '{
    "notes": "Confirmado para testes do sistema de pagamentos"
  }')

echo "Resposta confirmação:"
echo "$CONFIRM_RESPONSE" | jq '.'
if echo "$CONFIRM_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Reserva confirmada"
else
  echo "❌ Falha ao confirmar reserva"
fi

# 5. Testar endpoint de detalhes de pagamento
echo ""
echo "5. Testando endpoint de detalhes de pagamento..."
PAYMENT_DETAILS=$(curl -s -X GET "$BASE_URL/bookings/$EVENT_BOOKING_ID/payment" -H "$AUTH_HEADER")
echo "Resposta detalhes pagamento:"
echo "$PAYMENT_DETAILS" | jq '.'

# Verificar se há erro específico
if echo "$PAYMENT_DETAILS" | grep -q '"success":false'; then
  ERROR_MSG=$(echo "$PAYMENT_DETAILS" | jq -r '.message')
  echo "❌ Erro no endpoint de pagamento: $ERROR_MSG"
  
  # Tentativa alternativa com curl detalhado para ver o erro completo
  echo ""
  echo "=== DEBUG: Chamada detalhada ==="
  curl -v -X GET "$BASE_URL/bookings/$EVENT_BOOKING_ID/payment" -H "$AUTH_HEADER"
else
  echo "✅ Endpoint de pagamentos funcionando"
fi

# 6. Testar cálculo de depósito
echo ""
echo "6. Testando cálculo de depósito..."
DEPOSIT_RESPONSE=$(curl -s -X GET "$BASE_URL/bookings/$EVENT_BOOKING_ID/deposit" -H "$AUTH_HEADER")
echo "Resposta cálculo depósito:"
echo "$DEPOSIT_RESPONSE" | jq '.'

# 7. Registrar pagamento manual
echo ""
echo "7. Registrando pagamento manual..."
MANUAL_PAYMENT=$(curl -s -X POST "$BASE_URL/bookings/$EVENT_BOOKING_ID/payments" \
  -H "$AUTH_HEADER" \
  -H "$JSON_HEADER" \
  -d '{
    "amount": 1500,
    "payment_method": "cash",
    "reference": "PAY-TEST-2026-001",
    "notes": "Pagamento de teste do novo sistema",
    "payment_type": "manual_event_payment"
  }')

echo "Resposta registro pagamento:"
echo "$MANUAL_PAYMENT" | jq '.'

if echo "$MANUAL_PAYMENT" | grep -q '"success":true'; then
  echo "✅ Pagamento registrado com sucesso"
  
  # Extrair payment ID se disponível
  PAYMENT_ID=$(echo "$MANUAL_PAYMENT" | jq -r '.data.payment_id // .data.id // ""')
  if [ -n "$PAYMENT_ID" ] && [ "$PAYMENT_ID" != "null" ]; then
    echo "Payment ID: $PAYMENT_ID"
  fi
else
  echo "❌ Falha ao registrar pagamento"
fi

# 8. Verificar detalhes de pagamento atualizados
echo ""
echo "8. Verificando detalhes de pagamento atualizados..."
UPDATED_PAYMENT=$(curl -s -X GET "$BASE_URL/bookings/$EVENT_BOOKING_ID/payment" -H "$AUTH_HEADER")
echo "Detalhes atualizados:"
echo "$UPDATED_PAYMENT" | jq '.'

# 9. Testar geração de recibo
echo ""
echo "9. Testando geração de recibo..."
RECEIPT_RESPONSE=$(curl -s -X GET "$BASE_URL/bookings/$EVENT_BOOKING_ID/receipt" -H "$AUTH_HEADER")
echo "Resposta recibo:"
echo "$RECEIPT_RESPONSE" | jq '.'

# 10. Testar opções de pagamento do espaço
echo ""
echo "10. Testando opções de pagamento do espaço..."
PAYMENT_OPTIONS=$(curl -s -X GET "$BASE_URL/spaces/$EVENT_SPACE_ID/payment-options" -H "$AUTH_HEADER")
echo "Opções de pagamento:"
echo "$PAYMENT_OPTIONS" | jq '.'

# 11. Testar dashboard financeiro
echo ""
echo "11. Testando dashboard financeiro do hotel..."
FINANCIAL_SUMMARY=$(curl -s -X GET "$BASE_URL/hotel/$HOTEL_ID/financial-summary" -H "$AUTH_HEADER")
echo "Resumo financeiro:"
echo "$FINANCIAL_SUMMARY" | jq '.'

echo ""
echo "=== TESTE CONCLUÍDO ==="
echo "Resumo:"
echo "- Espaço criado: $EVENT_SPACE_ID"
echo "- Reserva criada: $EVENT_BOOKING_ID"
echo "- Endpoints testados: 11"
echo ""
echo "Para limpar os dados de teste:"
echo "curl -X POST \"$BASE_URL/bookings/$EVENT_BOOKING_ID/cancel\" -H \"$AUTH_HEADER\" -H \"$JSON_HEADER\" -d '{\"reason\":\"Teste concluído\"}'"
