#!/bin/bash

# ============================================
# SISTEMA DE TESTE COMPLETO DE HOTÉIS - NOVO
# ============================================
# Versão: 1.0.0 - Totalmente compatível
# Data: $(date)
# ============================================

# Configuração principal
readonly BASE_URL="http://localhost:8000/api/hotels"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly HOST_ID="bB88VrzVx8dbUUpXV7qSrGA5eiy2"

# IDs do sistema (seus dados reais)
readonly HOTEL_ID="2fe41dc8-1644-4e85-a6e7-0dcc828346db"
readonly BOOKING_ID="1873e137-4e80-424f-8927-f55e1654373c"
readonly ROOM_TYPE_ID="8cccd756-32f5-482d-a9a7-d8640f61653d"
readonly INVOICE_ID="ac4efdfe-356f-459d-a1d3-b627bcbb4eaa"

# Cores para output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# ============================================
# FUNÇÕES UTILITÁRIAS
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"
}

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $(date '+%H:%M:%S') $1"
}

# Função para fazer requisições HTTP
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    local full_url="${BASE_URL}${endpoint}"
    
    log_info "🔗 ${description}"
    echo "   Endpoint: ${method} ${full_url}"
    
    if [ -n "${data}" ] && [ "${data}" != "null" ] && [ "${data}" != "{}" ]; then
        echo "   Payload: ${data}" | jq -c . 2>/dev/null || echo "   Payload: ${data}"
    fi
    
    local response
    local http_status
    
    if [ "${method}" = "POST" ] || [ "${method}" = "PUT" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "${method}" "${full_url}" \
            -H "Content-Type: application/json" \
            -d "${data}" 2>&1)
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${full_url}" 2>&1)
    fi
    
    http_status=$(echo "${response}" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "${response}" | sed 's/HTTP_STATUS:[0-9]*//')
    
    if [[ "${http_status}" =~ ^2[0-9][0-9]$ ]]; then
        log_success "Status: ${http_status}"
        if [ -n "${body}" ] && [ "${body}" != "null" ]; then
            echo "   Response:"
            echo "${body}" | jq '.' 2>/dev/null || echo "   ${body}"
        fi
        return 0
    else
        log_error "Status: ${http_status}"
        if [ -n "${body}" ] && [ "${body}" != "null" ]; then
            echo "   Error:"
            echo "${body}" | jq '.' 2>/dev/null || echo "   ${body}"
        fi
        return 1
    fi
}

# Função para calcular datas
get_date() {
    local days="$1"
    date -d "+${days} days" +%Y-%m-%d
}

# ============================================
# TESTES INDIVIDUAIS
# ============================================

test_health_check() {
    echo ""
    log_info "🏥 TESTE 1: HEALTH CHECK"
    make_request "GET" "/health" "" "Verificar saúde do módulo"
}

test_create_hotel() {
    echo ""
    log_info "🏨 TESTE 2: CRIAR HOTEL"
    
    local hotel_name="Hotel Teste ${TIMESTAMP}"
    local hotel_slug="hotel-teste-${TIMESTAMP}"
    
    local hotel_data=$(cat <<EOF
{
  "name": "${hotel_name}",
  "slug": "${hotel_slug}",
  "description": "Hotel criado via teste automatizado",
  "address": "Rua Teste, 123",
  "locality": "Maputo",
  "province": "Maputo Cidade",
  "country": "Moçambique",
  "contact_email": "teste${TIMESTAMP}@exemplo.com",
  "contact_phone": "+258841234567",
  "policies": "Check-in 14h, Check-out 12h",
  "images": ["https://exemplo.com/foto1.jpg"],
  "amenities": ["wifi", "ar-condicionado", "piscina"],
  "check_in_time": "14:00",
  "check_out_time": "12:00",
  "host_id": "${HOST_ID}"
}
EOF
)
    
    make_request "POST" "" "${hotel_data}" "Criar novo hotel"
}

test_list_hotels() {
    echo ""
    log_info "📋 TESTE 3: LISTAR HOTÉIS"
    make_request "GET" "" "" "Listar todos hotéis"
}

test_get_hotel_details() {
    echo ""
    log_info "🔍 TESTE 4: DETALHES DO HOTEL"
    make_request "GET" "/${HOTEL_ID}" "" "Obter detalhes do hotel principal"
}

test_create_room_type() {
    echo ""
    log_info "🛏️ TESTE 5: CRIAR TIPO DE QUARTO"
    
    local room_type_data=$(cat <<EOF
{
  "hotel_id": "${HOTEL_ID}",
  "name": "Quarto Executivo Teste",
  "description": "Quarto para testes com capacidade maior",
  "capacity": 4,
  "base_price": "350.00",
  "total_units": 3,
  "base_occupancy": 2,
  "min_nights": 1,
  "extra_adult_price": "40.00",
  "extra_child_price": "20.00",
  "amenities": ["tv", "frigobar", "vista-mar"],
  "images": ["https://exemplo.com/quarto1.jpg"],
  "is_active": true
}
EOF
)
    
    make_request "POST" "/${HOTEL_ID}/room-types" "${room_type_data}" "Criar tipo de quarto"
}

test_list_room_types() {
    echo ""
    log_info "📊 TESTE 6: LISTAR TIPOS DE QUARTO"
    make_request "GET" "/${HOTEL_ID}/room-types" "" "Listar tipos de quarto do hotel"
}

test_check_availability() {
    echo ""
    log_info "📅 TESTE 7: VERIFICAR DISPONIBILIDADE"
    
    local start_date=$(get_date 7)
    local end_date=$(get_date 10)
    
    make_request "GET" "/${HOTEL_ID}/availability?roomTypeId=${ROOM_TYPE_ID}&startDate=${start_date}&endDate=${end_date}" "" "Verificar disponibilidade"
}

test_calculate_price() {
    echo ""
    log_info "💰 TESTE 8: CALCULAR PREÇO"
    
    local start_date=$(get_date 7)
    local end_date=$(get_date 10)
    
    local price_data=$(cat <<EOF
{
  "room_type_id": "${ROOM_TYPE_ID}",
  "check_in": "${start_date}",
  "check_out": "${end_date}",
  "units": 1,
  "adults": 2
}
EOF
)
    
    make_request "POST" "/${HOTEL_ID}/bookings/calculate-price" "${price_data}" "Calcular preço da reserva"
}

test_create_booking() {
    echo ""
    log_info "📝 TESTE 9: CRIAR RESERVA"
    
    local start_date=$(get_date 7)
    local end_date=$(get_date 10)
    
    log_warning "⚠️  Room type tem capacidade 2, usando 2 adultos, 0 crianças"
    
    local booking_data=$(cat <<EOF
{
  "hotel_id": "${HOTEL_ID}",
  "room_type_id": "${ROOM_TYPE_ID}",
  "guest_name": "Hóspede Teste ${TIMESTAMP}",
  "guest_email": "hospede${TIMESTAMP}@exemplo.com",
  "check_in": "${start_date}",
  "check_out": "${end_date}",
  "adults": 2,
  "children": 0,
  "units": 1,
  "special_requests": "Teste automatizado do sistema"
}
EOF
)
    
    make_request "POST" "/${HOTEL_ID}/bookings" "${booking_data}" "Criar nova reserva"
}

test_get_booking_details() {
    echo ""
    log_info "🔍 TESTE 10: DETALHES DA RESERVA"
    make_request "GET" "/${HOTEL_ID}/bookings/${BOOKING_ID}" "" "Obter detalhes da reserva existente"
}

test_register_payment() {
    echo ""
    log_info "💳 TESTE 11: REGISTRAR PAGAMENTO"
    
    local payment_data=$(cat <<EOF
{
  "amount": 100.50,
  "paymentMethod": "cash",
  "reference": "PGTO-TESTE-${TIMESTAMP}",
  "notes": "Pagamento de teste automatizado",
  "paymentType": "partial"
}
EOF
)
    
    make_request "POST" "/${HOTEL_ID}/bookings/${BOOKING_ID}/payments" "${payment_data}" "Registrar pagamento manual"
}

test_check_in_out() {
    echo ""
    log_info "🚪 TESTE 12: CHECK-IN E CHECK-OUT (simulação)"
    log_warning "⚠️  Estes endpoints requerem autenticação JWT"
    log_warning "⚠️  Execução simulada - requisições não serão enviadas"
    
    echo "   Para testar check-in manualmente:"
    echo "   curl -X POST '${BASE_URL}/bookings/${BOOKING_ID}/check-in'"
    echo "   Para testar check-out manualmente:"
    echo "   curl -X POST '${BASE_URL}/bookings/${BOOKING_ID}/check-out'"
}

test_reports() {
    echo ""
    log_info "📈 TESTE 13: RELATÓRIOS"
    
    local start_date=$(get_date -30)  # 30 dias atrás
    local end_date=$(get_date 30)     # 30 dias no futuro
    
    make_request "GET" "/${HOTEL_ID}/reports/bookings?startDate=${start_date}&endDate=${end_date}" "" "Relatório de reservas"
    make_request "GET" "/${HOTEL_ID}/reports/payments?startDate=${start_date}&endDate=${end_date}" "" "Relatório de pagamentos"
}

test_additional_endpoints() {
    echo ""
    log_info "🌐 TESTE 14: ENDPOINTS ADICIONAIS"
    
    make_request "GET" "/province/Maputo%20Cidade" "" "Hotéis por província"
    make_request "GET" "/locality/Maputo" "" "Hotéis por localidade"
    
    # Testar busca por slug (usando slug conhecido)
    make_request "GET" "/slug/hotel-exemplo" "" "Buscar hotel por slug"
}

# ============================================
# TESTE COMPLETO DO SISTEMA
# ============================================

run_complete_test() {
    echo ""
    echo "=========================================="
    echo "🚀 INICIANDO TESTE COMPLETO DO SISTEMA 🚀"
    echo "=========================================="
    echo "Data/Hora: $(date)"
    echo "URL Base: ${BASE_URL}"
    echo "Hotel ID: ${HOTEL_ID}"
    echo "Room Type ID: ${ROOM_TYPE_ID} (capacidade: 2)"
    echo "=========================================="
    echo ""
    
    # Executar todos os testes
    test_health_check
    test_create_hotel
    test_list_hotels
    test_get_hotel_details
    test_create_room_type
    test_list_room_types
    test_check_availability
    test_calculate_price
    test_create_booking
    test_get_booking_details
    test_register_payment
    test_check_in_out
    test_reports
    test_additional_endpoints
    
    echo ""
    echo "=========================================="
    echo "✅ TESTE COMPLETO FINALIZADO"
    echo "=========================================="
}

# ============================================
# TESTE RÁPIDO (apenas funcionalidades básicas)
# ============================================

run_quick_test() {
    echo ""
    echo "⚡ INICIANDO TESTE RÁPIDO ⚡"
    echo ""
    
    test_health_check
    test_list_hotels
    test_get_hotel_details
    test_list_room_types
    test_check_availability
    test_calculate_price
    test_get_booking_details
}

# ============================================
# TESTE DE CRIAÇÃO DE RESERVA (foco no problema)
# ============================================

run_booking_test() {
    echo ""
    echo "🎯 TESTE ESPECÍFICO: CRIAÇÃO DE RESERVA"
    echo ""
    
    log_info "Testando com room type de capacidade 2"
    echo ""
    
    # Teste 1: Dentro da capacidade (deve funcionar)
    log_info "Cenário 1: 2 adultos (dentro da capacidade)"
    local start_date=$(get_date 14)
    local end_date=$(get_date 17)
    
    local booking_data_1=$(cat <<EOF
{
  "hotel_id": "${HOTEL_ID}",
  "room_type_id": "${ROOM_TYPE_ID}",
  "guest_name": "Teste Capacidade OK",
  "guest_email": "teste.ok@exemplo.com",
  "check_in": "${start_date}",
  "check_out": "${end_date}",
  "adults": 2,
  "children": 0,
  "units": 1
}
EOF
)
    
    make_request "POST" "/${HOTEL_ID}/bookings" "${booking_data_1}" "Reserva com 2 adultos"
    
    echo ""
    log_warning "Nota: Para testar com mais hóspedes, atualize a capacidade:"
    echo "UPDATE room_types SET capacity = 4 WHERE id = '${ROOM_TYPE_ID}';"
}

# ============================================
# MENU PRINCIPAL
# ============================================

show_menu() {
    echo ""
    echo "=========================================="
    echo "🧪 SISTEMA DE TESTE DE HOTÉIS"
    echo "=========================================="
    echo "1. Teste Completo do Sistema"
    echo "2. Teste Rápido"
    echo "3. Teste de Criação de Reserva"
    echo "4. Teste de Health Check"
    echo "5. Teste Individual"
    echo "6. Sair"
    echo "=========================================="
    echo ""
}

run_individual_test() {
    echo ""
    echo "🔧 TESTES INDIVIDUAIS DISPONÍVEIS:"
    echo "1. Health Check"
    echo "2. Criar Hotel"
    echo "3. Listar Hotéis"
    echo "4. Detalhes do Hotel"
    echo "5. Criar Room Type"
    echo "6. Listar Room Types"
    echo "7. Verificar Disponibilidade"
    echo "8. Calcular Preço"
    echo "9. Criar Reserva"
    echo "10. Detalhes da Reserva"
    echo "11. Registrar Pagamento"
    echo "12. Relatórios"
    echo ""
    
    read -p "Selecione o teste (1-12): " choice
    
    case $choice in
        1) test_health_check ;;
        2) test_create_hotel ;;
        3) test_list_hotels ;;
        4) test_get_hotel_details ;;
        5) test_create_room_type ;;
        6) test_list_room_types ;;
        7) test_check_availability ;;
        8) test_calculate_price ;;
        9) test_create_booking ;;
        10) test_get_booking_details ;;
        11) test_register_payment ;;
        12) test_reports ;;
        *) log_error "Opção inválida" ;;
    esac
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

main() {
    # Verificar se o jq está instalado
    if ! command -v jq &> /dev/null; then
        log_error "jq não está instalado. Instale com: sudo apt-get install jq"
        exit 1
    fi
    
    # Verificar se o curl está instalado
    if ! command -v curl &> /dev/null; then
        log_error "curl não está instalado. Instale com: sudo apt-get install curl"
        exit 1
    fi
    
    # Verificar conexão com a API
    log_info "Verificando conexão com a API..."
    if curl -s --head "${BASE_URL}/health" | grep "200" > /dev/null; then
        log_success "API está respondendo"
    else
        log_warning "API pode não estar disponível em ${BASE_URL}"
        read -p "Continuar mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 1
        fi
    fi
    
    while true; do
        show_menu
        read -p "Selecione uma opção (1-6): " main_choice
        
        case $main_choice in
            1) run_complete_test ;;
            2) run_quick_test ;;
            3) run_booking_test ;;
            4) test_health_check ;;
            5) run_individual_test ;;
            6) 
                log_info "Saindo..."
                exit 0
                ;;
            *) 
                log_error "Opção inválida"
                ;;
        esac
        
        echo ""
        read -p "Pressione Enter para continuar..."
    done
}

# Executar o script
main "$@"
