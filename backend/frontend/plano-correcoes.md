# 📋 PLANO DE CORREÇÕES - FRONTEND HOTÉIS

## 🎯 OBJETIVO
Atualizar o frontend existente para usar o novo backend v2 (/api/v2/hotels)
mantendo ao máximo os componentes existentes.

## 🔍 SITUAÇÃO ATUAL (ASSUMIDA)
1. Temos pelo menos:
   - HotelSearch.vue (busca)
   - HotelList.vue (listagem)
   - HotelDetails.vue (detalhes)
   - BookingForm.vue (reserva)
   
2. API antiga: /api/hotels (schema antigo)
3. API nova: /api/v2/hotels (schema novo corrigido)

## 🚀 PLANO DE AÇÃO

### FASE 1: ANÁLISE E MAPEAMENTO (HOJE)
1. Identificar TODOS os componentes relacionados a hotéis
2. Identificar TODOS os serviços/API calls
3. Mapear endpoints antigos → novos

### FASE 2: ATUALIZAÇÃO DE SERVIÇOS (1-2 DIAS)
1. Criar/Corrigir hotel.service.ts com novos endpoints
2. Atualizar interfaces TypeScript
3. Manter compatibilidade durante transição

### FASE 3: ATUALIZAÇÃO DE COMPONENTES (2-3 DIAS)
1. HotelSearch.vue - Manter UI, atualizar chamadas API
2. HotelList/HotelCard - Ajustar para novo schema
3. HotelDetails - Mostrar nova estrutura de quartos
4. BookingForm - Usar novo endpoint de reserva

### FASE 4: TESTES E DEPLOY (1 DIA)
1. Testar fluxo completo
2. Verificar compatibilidade com rides
3. Deploy gradual

## 📊 PRIORIDADES
1. ✅ Busca de hotéis (funcionalidade crítica)
2. ✅ Detalhes do hotel
3. ✅ Reserva/Booking
4. ⚠️ Dashboard admin (se existir)
5. ⚠️ Reviews/rating (se existir, pode adiar)

## 🔧 ESTRATÉGIA DE MIGRAÇÃO
1. Manter endpoints antigos funcionando durante transição
2. Criar wrappers/adapters para compatibilidade
3. Migrar gradualmente componente por componente
4. Usar feature flags se necessário

