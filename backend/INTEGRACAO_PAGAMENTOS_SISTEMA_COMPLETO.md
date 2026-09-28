# 🔗 INTEGRAÇÃO COMPLETA: PAGAMENTOS FLEXÍVEIS + SISTEMA ANTERIOR

## 📋 ÍNDICE

1. Como isto conecta com Admin Dashboard
2. Fluxo de dados ponto-a-ponto
3. Interações entre triggers antigos + novos
4. Timeline de implementação integrada
5. Matriz de conflitos e soluções

---

# 1️⃣ CONEXÃO COM ADMIN DASHBOARD

## Antes (Problemas do sistema anterior):
```
Admin veria: "R$ 0 pagamentos pendentes"

Motivo:
  - Hotel confirma booking
  - Sistema NÃO cria payment_references automaticamente
  - Admin Dashboard chamava: SELECT * FROM payment_references
  - Resultado: VAZIO ❌
```

## Depois (Com Pagamentos Flexíveis):
```
Admin Dashboard mostra:
  
📊 PAGAMENTOS PENDENTES:
  ├─ 🏨 Hotéis: R$ XXX
  │  ├─ Advance (Pré-pagamento): R$ 500 (2 bookings)
  │  └─ Deposits (Garantias): R$ 300 (pending)
  │
  ├─ 🚗 Rides: R$ YYY
  │  └─ Advance (Cliente não pagou): R$ 150
  │
  └─ 🎉 Events: R$ ZZZ
     └─ Advance + Balance: R$ 2000

📊 PAGAMENTOS RECEBIDOS (HOJE):
  ├─ 🏨 Hotéis: R$ 800 (4 bookings)
  ├─ 🚗 Rides: R$ 200 (completed)
  └─ 🎉 Events: R$ 1500 (advance paid)

💰 COMISSÕES (12%):
  ├─ Esperadas: R$ XXX (de XXX pagos)
  ├─ Já recebidas: R$ YYY
  └─ Pendentes: R$ ZZZ
```

## Modificação no `getPaymentsDashboard()`:

**ANTES:**
```typescript
async getPaymentsDashboard() {
  const refs = await db.query.payment_references.findMany({
    where: (table) => eq(table.status, 'pending')
  });
  
  // Retorna vazio porque ninguém criou payment_references ❌
  return refs;
}
```

**DEPOIS:**
```typescript
async getPaymentsDashboard() {
  // 1️⃣ Hotéis - Pré-pagamentos pendentes
  const hotelAdvances = await db.query.hotelBookings.findMany({
    where: (table) => and(
      eq(table.advance_payment_status, 'pending'),
      gt(table.advance_payment_amount, 0),
      lt(table.advance_payment_due, new Date())
    )
  });
  
  // 2️⃣ Hotéis - Depósitos pendentes
  const hotelDeposits = await db.query.hotelBookings.findMany({
    where: (table) => and(
      eq(table.deposit_status, 'pending'),
      gt(table.deposit_amount, 0),
      lt(table.deposit_due, new Date())
    )
  });
  
  // 3️⃣ Rides - Antecipado pendente
  const rideAdvances = await db.query.rides.findMany({
    where: (table) => and(
      eq(table.advance_payment_status, 'pending'),
      gt(table.advance_payment_amount, 0)
    )
  });
  
  // 4️⃣ Events - Antecipado pendente
  const eventAdvances = await db.query.eventBookings.findMany({
    where: (table) => and(
      eq(table.advance_payment_status, 'pending'),
      gt(table.advance_payment_amount, 0)
    )
  });
  
  // 5️⃣ Combinar TUDO
  const totalAdvance = [
    ...hotelAdvances,
    ...rideAdvances,
    ...eventAdvances
  ].reduce((sum, booking) => sum + (booking.advance_payment_amount || 0), 0);
  
  const totalDeposits = hotelDeposits
    .reduce((sum, booking) => sum + (booking.deposit_amount || 0), 0);
  
  const commission12Percent = (totalAdvance + totalDeposits) * 0.12;
  
  return {
    pending_advances: totalAdvance,
    pending_deposits: totalDeposits,
    total_pending: totalAdvance + totalDeposits,
    commission_12_percent: commission12Percent,
    by_type: {
      hotel_advances: hotelAdvances.length,
      hotel_deposits: hotelDeposits.length,
      ride_advances: rideAdvances.length,
      event_advances: eventAdvances.length
    }
  };
}
```

---

# 2️⃣ FLUXO DE DADOS PONTO-A-PONTO

## Cenário: Hóspede Reserva Hotel

### Timeline Completa:

```
[1] Cliente busca hotel
    GET /api/hotels/123/details
    ↓

[2] Sistema retorna hotel COM POLÍTICA
    {
      hotelId: "123",
      name: "São Paulo Plaza",
      ...
      paymentPolicy: {
        advance_payment_enabled: true,
        advance_payment_percentage: 30,
        advance_payment_required: true,
        deposit_enabled: true,
        deposit_percentage: 30,
        ...
      }
    }
    ↓

[3] Cliente confirma reserva
    POST /api/hotels/123/bookings
    {
      checkInDate: "2026-03-15",
      checkOutDate: "2026-03-20",
      roomId: "room-456",
      totalPrice: 1000.00
    }
    ↓

[4] Backend cria booking record
    INSERT INTO hotelBookings (...)
    {
      id: "booking-789",
      totalPrice: 1000.00,
      payment_policy_id: "policy-123"
    }
    ↓

[5] ⚡ TRIGGER: calculate_hotel_payment_amounts() DISPARA
    
    policy = SELECT * FROM hotel_payment_policies 
             WHERE id = "policy-123"
    
    advance_amount = 1000 * 30% = R$ 300
    advance_due = NOW + 3 days = 2026-03-12
    
    deposit_amount = 1000 * 30% = R$ 300
    deposit_due = NOW + 3 days = 2026-03-12
    
    balance_due = 1000 - 300 - 300 = R$ 400
    
    UPDATE hotelBookings SET
      advance_payment_amount = 300,
      advance_payment_due = '2026-03-12',
      deposit_amount = 300,
      deposit_due = '2026-03-12',
      balance_due = 400,
      payment_status = 'pending'
    ✅

[6] API retorna dados de pagamento
    {
      bookingId: "booking-789",
      totalPrice: 1000.00,
      payments: [
        {
          type: 'advance',
          amount: 300.00,
          due: '2026-03-12',
          required: true
        },
        {
          type: 'deposit',
          amount: 300.00,
          due: '2026-03-12',
          required: true
        },
        {
          type: 'balance',
          amount: 400.00,
          due: '2026-03-15' (check-in date)
        }
      ]
    }
    ↓

[7] Frontend mostra layout de pagamentos
    "Para confirmar reserva, você precisa pagar:"
    └─ 💰 Advance (30%): R$ 300 (OBRIGATÓRIO até 2026-03-12)
    └─ 💰 Deposit (30%): R$ 300 (OBRIGATÓRIO até 2026-03-12)
    └─ 💰 Balance: R$ 400 (até 2026-03-15)
    ↓

[8] Cliente paga primeiro pagamento (Advance)
    POST /api/payments/process
    {
      bookingId: "booking-789",
      paymentType: "advance",
      amount: 300.00,
      method: "card"
    }
    ↓

[9] ✅ STRIPE/GATEWAY processa
    → gatewayPaymentId = "ch_12345"
    ↓

[10] Backend registra no histórico
     INSERT INTO hotel_booking_payment_history
     {
       booking_id: "booking-789",
       payment_type: "advance",
       amount: 300.00,
       status: "completed",
       paid_date: NOW(),
       reference_number: "ADVANCE_HOTEL_2026_0001",
       gateway_payment_id: "ch_12345"
     }
     ↓

[11] Backend atualiza booking
     UPDATE hotelBookings SET
       advance_payment_status = "paid",
       advance_payment_paid_at = NOW(),
       total_paid = 300.00
     WHERE id = "booking-789"
     ↓

[12] Cliente notificado
     ✅ SMS/Email: "Pré-pagamento recebido! Falta depósito e saldo"
    ↓

[13] Cliente paga Deposit
     (mesmo flow que [8-11])
     ↓

[14] Backend atualiza
     deposit_payment_status = "paid"
     total_paid = 600.00
     ↓

[15] Cliente notificado
     ✅ SMS/Email: "Depósito recebido! Reserva confirmada"
     ↓

[16] 3 DIAS DEPOIS (2026-03-15) - CHECK-IN
     Hóspede faz check-in
     POST /api/hotels/123/bookings/789/check-in
     ↓

[17] Backend valida
     IF total_paid >= (advance + deposit) THEN
       status = "checked_in"
     ELSE
       status = "error_incomplete_payment"
     ↓

[18] ⚡ TRIGGER: auto_update_hotel_payment_status() 
     (triggered by UPDATE to status)
     
     IF status = "checked_in" AND
        advance_payment_status = "paid" AND
        deposit_status = "paid" THEN
       payment_status = "partial"  // Falta saldo
     
     // Admin segue para receber o resto
     ↓

[19] ADMIN DASHBOARD ATUALIZADO
     New entry em pending payments:
     {
       bookingId: "booking-789",
       type: "balance",
       amount: 400.00,
       due: "2026-03-15",
       status: "pending"
     }
     ↓

[20] API chamada para atualizar dashboard
     GET /api/admin/payments-dashboard
     
     Resultado inclui:
     - Advance paid: R$ 300 ✅
     - Deposit paid: R$ 300 ✅
     - Balance pending: R$ 400 ⏳
     - Commission 12%: R$ 84 (de 300+300)
     ↓

[21] CHECKOUT AUTOMÁTICO (Fase anterior)
     Scheduler job a cada 5 min:
       IF booking.checkOutDate <= TODAY AND
          booking.status = "checked_in" THEN
         booking.status = "checked_out"
     ↓

[22] ⚡ TRIGGER: auto_update_hotel_payment_status()
     IF status = "checked_out" AND
        advance_paid AND deposit_paid AND balance_paid THEN
       payment_status = "complete"
       
       // Criar payment_reference para comissão
       INSERT INTO payment_references
       {
         reference_number: "HOTEL_2026_789",
         booking_type: "hotel",
         gross_amount: 1000.00,
         fee_amount: 120.00,  // 12%
         status: "completed",
         hotel_id: "hotel-123"
       }
    ↓

[23] ADMIN DASHBOARD FINAL
     "Pagamento Recebido: R$ 1000"
     "Comissão: R$ 120"
     "Zero manual overhead! ✅"
```

---

# 3️⃣ TRIGGERS COORDENADOS (Antigos + Novos)

## Mapa de Triggers:

### Triggers NOVOS (Pagamentos):

```sql
1️⃣ calculate_hotel_payment_amounts()
   QUANDO: INSERT/UPDATE hotelBookings
   O QUÊ: Calcula advance, deposit, balance
   RESULTADO: Colunas preenchidas automaticamente

2️⃣ auto_update_hotel_payment_status()
   QUANDO: UPDATE hotelBookings (status muda)
   O QUÊ: Valida pagamentos e atualiza payment_status
   RESULTADO: payment_status = 'partial'/'complete'
```

### Triggers ANTERIORES (do sistema anterior):

```sql
3️⃣ auto_update_check_in_check_out() [FASE ANTERIOR]
   QUANDO: Scheduler job (a cada 5 min)
   O QUÊ: Auto-transiciona status based em datas
   RESULTADO: checked_in → checked_out automaticamente

4️⃣ create_payment_references_on_completion() [FASE ANTERIOR]
   QUANDO: UPDATE hotelBookings (status = 'checked_out')
   O QUÊ: Cria payment_references se não existir
   RESULTADO: payment_references criada para comissão
```

## Ordem de Execução (CRÍTICA):

```
timeline:
  
  T0: Client reserva
      ↓
  T0+1ms: Trigger 1 dispara (calculate_hotel_payment_amounts)
          ✅ Amounts calculados
      ↓
  T1: Client paga advance
      ↓
  T1+1ms: Manual UPDATE (advance_payment_status = 'paid')
          ↓
  T1+2ms: Trigger 2 dispara (auto_update_hotel_payment_status)
          ✅ payment_status = 'pending' (falta deposit)
      ↓
  T2: Client paga deposit
      ↓
  T2+1ms: Manual UPDATE (deposit_payment_status = 'paid')
          ↓
  T2+2ms: Trigger 2 dispara NOVAMENTE
          ✅ payment_status = 'partial' (falta balance)
      ↓
  T3: Check-in
      ↓
  T3+1ms: Trigger 3 dispara (scheduler) se time is right:
          status = 'checked_in'
      ↓
  T4: Check-out (automático após X dias)
      ↓
  T4+1ms: Trigger 3 dispara
          status = 'checked_out'
      ↓
  T4+2ms: Trigger 2 dispara
          payment_status = 'complete'
      ↓
  T4+3ms: Trigger 4 dispara (create_payment_references)
          ✅ payment_references criada!
      ↓
  T4+4ms: Admin Dashboard mostra "Pagamento Recebido"
```

## ⚠️ CONFLITOS POSSÍVEIS:

| Conflito | Causa | Solução |
|----------|-------|--------|
| Trigger 2 executa sem Trigger 1 ter rodado | User UPDATE manual sem INSERT | Add check no UPDATE: `IF payment_policy_id IS NULL` |
| Payment registrado mas status não atualiza | Trigger 2 não triggered | Ensure AFTER UPDATE trigger |
| Double payment_references criadas | Trigger 4 roda 2x | Add UNIQUE constraint + ON CONFLICT DO NOTHING |
| Balance payment não registrado | Hotel não edita manually | Só webhook de pagamento atualiza |

---

# 4️⃣ TIMELINE DE IMPLEMENTAÇÃO INTEGRADA

## Semana 1-2: PAGAMENTOS BÁSICOS
```
MON: Setup BD (Fase 0: 1h)
TUE-WED: Backend Service + Endpoints (Fase 1: 4h)
THU: Frontend Hotel Settings (Fase 2: 3h)
FRI: Frontend Driver Settings (Fase 3: 2h)
    └─ Total: 10h = 1.25 dias

RESULTADO: Hotel/Motorista configura política, sistema calcula amounts ✅
```

## Semana 3: INTEGRAÇÃO COM ADMIN

```
MON: Update getPaymentsDashboard() (1h)
     ├─ Incluir hotel advances
     ├─ Incluir hotel deposits
     ├─ Incluir ride advances
     └─ Calcular comissão 12%

TUE: Admin Dashboard component (2h)
     ├─ Mostrar pagamentos por tipo
     ├─ Mostrar pending vs received
     └─ Botão para marcar como "payment received"

WED: Webhook integrations (2h)
     ├─ Stripe webhook para capturar sucesso
     ├─ Update payment status automaticamente
     └─ SMS/Email notifications

RESULTADO: Admin vê consolidado, zero manual work ✅
```

## Semana 4: AUTOMAÇÃO + TESTES

```
MON: Scheduler job para auto-checkout (2h)
     └─ Trigger auto-status-update

TUE: Auto payment_references creation (1h)
     └─ Trigger on checkout completion

WED-THU: E2E testing (3h)
         ├─ Fazer reserva completa
         ├─ Verificar payments criados
         ├─ Checkout automático
         └─ Comissão criada

FRI: Deploy + monitoring (1h)

RESULTADO: Sistema 100% automático ✅
```

---

# 5️⃣ MATRIZ FINAL: COMO TUDO SE CONECTA

## Antes (Problemas):

```
Cliente Reserva
    ↓
Status = 'confirmed'
    ↓
❌ Payment_references VAZIO
    ↓
Admin vê: "R$ 0 payments"
    ↓
Hotel atualiza MANUALMENTE
    ↓
❌ Carga manual no hotel
❌ Sem flexibilidade
❌ Admin não vê nada
```

## Depois (Fluxo Completo):

```
┌─── CLIENTE APP ───┐
│                   │
│ 1. Busca Hotel    │
│ 2. Vê Política    │
│ 3. Reserva        │
│ 4. Paga Advance   │
│ 5. Paga Deposit   │
│ 6. Check-in       │
│ 7. Check-out      │
└─────────┬─────────┘
          │
          ↓
┌─── DATABASE ──────┐
│                   │
│ Trigger 1:        │
│ Calcula Amounts   │
│                   │
│ Trigger 2:        │
│ Atualiza Status   │
│                   │
│ Trigger 3:        │
│ Auto Check-out    │
│                   │
│ Trigger 4:        │
│ Cria Comissão     │
└─────────┬─────────┘
          │
          ↓
┌─── ADMIN DASHBOARD ─┐
│                     │
│ Pagamentos Esperados│
│ Pagamentos Recebidos│
│ Comissão 12%        │
│ Por Status          │
│ Histórico Completo  │
│                     │
│ ✅ ZERO MANUAL      │
└─────────────────────┘
```

## Indicadores de Sucesso:

```
✅ Hotel nunca precisa de manual update
✅ Admin vê todos pagamentos em dashboard
✅ Comissão é calculada automaticamente
✅ Check-in/out automático
✅ Status sempre correto
✅ Sem conflicts entre triggers
✅ Email/SMS notifications automáticas
✅ Motorista configura 1x, automático depois
✅ EventSpace com regras próprias
```

---

# 🎯 PRÓXIMOS PASSOS SEQUENCIADOS

## DIA 1-2 (Semana 1):
- [ ] Executar SQL Fase 0 (1h)
- [ ] Criar PaymentPolicyService.ts (2h)
- [ ] Adicionar Endpoints (2h)
- **Checkpoint**: POST /api/hotels/:id/payment-policy funciona ✅

## DIA 3-4 (Semana 2):
- [ ] Frontend Hotel Settings (3h)
- [ ] Integrar com Admin GetPaymentDashboard (2h)
- **Checkpoint**: Admin vê advances/deposits ✅

## DIA 5-6 (Semana 2):
- [ ] Frontend Driver Settings (2h)
- [ ] Frontend EventSpace Settings (2h)
- **Checkpoint**: Todos podem configurar ✅

## DIA 7-8 (Semana 3):
- [ ] Admin Dashboard atualizado (2h)
- [ ] Webhook Stripe (2h)
- **Checkpoint**: Pagamentos automáticos funcionam ✅

## DIA 9-10 (Semana 4):
- [ ] Scheduler job auto-checkout (1h)
- [ ] Auto payment_references (1h)
- [ ] Testes E2E (3h)
- **Checkpoint**: Sistema 100% automático ✅

---

# 🚀 RESULTADO FINAL

Quando tudo estiver integrado:

```
🏨 HOTEL MANAGER:
  ✅ Configura política (advance %, deposit %, prazos)
  ✅ Clientes pagam conforme política
  ✅ Sistema calcula automaticamente
  ✅ Após check-out, status = "complete" automaticamente
  ✅ Comissão calculada sem intervenção

🚗 MOTORISTA:
  ✅ Configura se quer % antecipado + desconto
  ✅ Ou aceita pagamento no local
  ✅ Sistema cobra conforme política
  ✅ Histórico de pagamentos visível
  
👨‍⚖️ ADMIN:
  ✅ Dashboard mostra TUDO consolidado
  ✅ Pagamentos esperados vs recebidos
  ✅ Comissão 12% automática
  ✅ Zero manual work
  ✅ Relatórios prontos

💰 ECONOMIA DE TEMPO:
  - ANTES: Hotel atualiza manualmente cada booking → 10min/dia
  - DEPOIS: Sistema automático → 0 min/dia
  - ECONOMIA: 5h/semana por hotel!
```

🎉 **Sistema completo, moderno, automático e flexível!**
