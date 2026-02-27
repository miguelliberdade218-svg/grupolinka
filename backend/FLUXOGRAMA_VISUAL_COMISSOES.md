# 📊 FLUXOGRAMA VISUAL - SISTEMA DE COMISSÕES 12%

## FLUXO DE RIDE (MOTORISTA)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DE RIDE                           │
└─────────────────────────────────────────────────────────────────────┘

[1] PASSAGEIRO PAGA MOTORISTA
    ◆ Cash ou Mobile Money
    ◆ Fora da app (motorista e passageiro combinam)
    ◆ Motorista recebe MZN 2,500
    │
    ↓
[2] MOTORISTA CLICA "CONCLUIR RIDE"
    ◆ App mostra: "Confirmar conclusão?"
    ◆ Motorista confirma
    │
    ↓ POST /api/rides/:rideId/complete
    │
[3] SISTEMA CALCULA AUTOMATICAMENTE
    ◆ Lê pricePerSeat = MZN 2,500
    ◆ Calcula 12% = MZN 300
    ◆ Cria Payment Reference
    ◆ Define vencimento: Hoje + 7 dias
    ◆ Gera: refer = LINKA-RIDE-xxxxx
    ◆ Gera: entidade = DRIVER-yyyyyyy
    │
    ↓
[4] MOTORISTA RECEBE NOTIFICAÇÃO
    ┌──────────────────────────────┐
    │ ✅ Ride Concluída!           │
    │ 💰 Comissão: MZN 300         │
    │ 📅 Vencimento: 04/03/2026    │
    │ 📌 Ref: LINKA-RIDE-xxxxx     │
    │ [Ver em Meus Pagamentos]     │
    └──────────────────────────────┘
    │
    ↓
[5] MOTORISTA ENTRA NA LISTA "VALORES A LIQUIDAR"
    ┌─────────────────────────────────────────────┐
    │ 💰 MEUS PAGAMENTOS                          │
    ├─────────────────────────────────────────────┤
    │ Total a Pagar: MZN 4,500                   │
    │ Vencidos: 0                                │
    │                                             │
    │ Ride | MZN 300 | LINKA-RIDE-xxxxx | Pend. │
    │ Ride | MZN 250 | LINKA-RIDE-yyyyy | Pago  │
    │ ...                                         │
    └─────────────────────────────────────────────┘
    │
    ↓
[6] MOTORISTA TEM 7 DIAS PARA PAGAR
    ◆ 25/02 (hoje) - 04/03 (vencimento)
    ◆ Se não pagar: Status fica VENCIDO (vermelho)
    ◆ Se não pagar por muito tempo: Conta suspensa
    │
    ↓
[7] MOTORISTA CLICA "PAGAR"
    ◆ App mostra: "Como pagar?"
    ◆ Opções:
       - Transfer bancária (manual)
       - Boleto (gerar PDF)
       - Mpesa (automático - futuro)
    ◆ Escolhe: Transfer bancária
    ◆ App mostra dados para transfer:
       - Entidade: DRIVER-yyyyyyy
       - Referência: LINKA-RIDE-xxxxx
       - Valor: MZN 300
    ◆ Motorista transfers
    │
    ↓ POST /api/provider/payments/:paymentId/mark-paid
    │
[8] MOTORISTA MARCA COMO PAGO
    ◆ Enviou comprovativo (foto/PDF)
    ◆ Status: "pending_confirmation"
    ◆ Espera admin confirmar
    │
    ↓
[9] ADMIN RECEBE NOTIFICAÇÃO
    ┌──────────────────────────────┐
    │ 🔔 Pagamento Para Revisar    │
    │ Motorista: João Silva        │
    │ Valor: MZN 300               │
    │ Ref: LINKA-RIDE-xxxxx        │
    │ [Revisar Comprovativo]       │
    └──────────────────────────────┘
    │
    ↓
[10] ADMIN CONFIRMA EM /admin/payments
    ◆ Visualiza comprovativo
    ◆ Se OK: Clica "Confirmar"
    ◆ Se NOT OK: Clica "Rejeitar" + motivo
    │
    ↓ POST /api/admin/payments/:paymentId/confirm
    │
[11] MOTORISTA VÊ CONFIRMADO
    ┌──────────────────────────────┐
    │ ✅ PAGAMENTO CONFIRMADO      │
    │ Valor: MZN 300               │
    │ Data: 25/02/2026             │
    │ Status: PAGO                 │
    └──────────────────────────────┘
    │
    ↓ FIM
```

---

## FLUXO DE HOTEL (GERENCIADOR)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FLUXO COMPLETO DE HOTEL                           │
└─────────────────────────────────────────────────────────────────────┘

[1] CLIENTE FAZ CHECK-IN NO HOTEL
    ◆ Fica 3 noites
    ◆ Total a pagar: MZN 5,000
    │
    ↓
[2] CLIENTE FAZ CHECKOUT
    ◆ Paga ao hotel (cash, card, mpesa)
    ◆ Hotel confirma pagamento
    │
    ↓
[3] HOTEL CLICA "FAZER CHECKOUT"
    ◆ App mostra: "Confirmar checkout?"
    ◆ Hotel confirma
    │
    ↓ POST /api/hotel-bookings/:bookingId/checkout
    │
[4] SISTEMA CALCULA AUTOMATICAMENTE
    ◆ Lê totalPrice = MZN 5,000
    ◆ Calcula 12% = MZN 600
    ◆ Cria Payment Reference
    ◆ Define vencimento: Hoje + 7 dias
    ◆ Gera: reference = LINKA-HOTEL-xxxxx
    ◆ Gera: entidade = HOTEL-yyyyyyy
    │
    ↓
[5] HOTEL RECEBE NOTIFICAÇÃO
    ┌──────────────────────────────┐
    │ ✅ Checkout Realizado!       │
    │ 💰 Comissão: MZN 600         │
    │ 📅 Vencimento: 04/03/2026    │
    │ 📌 Ref: LINKA-HOTEL-xxxxx    │
    │ [Ver Meus Pagamentos]        │
    └──────────────────────────────┘
    │
    ↓
[6] HOTEL ENTRA NA LISTA "VALORES A LIQUIDAR"
    ┌─────────────────────────────────────────────┐
    │ 💰 MEUS PAGAMENTOS                          │
    ├─────────────────────────────────────────────┤
    │ Total a Pagar: MZN 1,800                   │
    │ Vencidos: 0                                │
    │                                             │
    │ Hotel | MZN 600 | LINKA-HOTEL-xxxxx | Pend.│
    │ Hotel | MZN 720 | LINKA-HOTEL-yyyyy | Pago │
    │ ...                                         │
    └─────────────────────────────────────────────┘
    │
    ↓
[7] HOTEL TEM 7 DIAS PARA PAGAR
    ◆ 25/02 (hoje) - 04/03 (vencimento)
    ◆ Se não pagar: Fica "VENCIDO"
    ◆ Se não pagar muito tempo: Pode ser suspenso
    │
    ↓
[8] HOTEL CLICA "PAGAR"
    ◆ App mostra dados para transfer:
       - Entidade: HOTEL-yyyyyyy
       - Referência: LINKA-HOTEL-xxxxx
       - Valor: MZN 600
    ◆ Hotel transfers no banco
    │
    ↓ POST /api/provider/payments/:paymentId/mark-paid
    │
[9] HOTEL MARCA COMO PAGO
    ◆ Enviou comprovativo
    ◆ Status: "pending_confirmation"
    ◆ Espera admin validar
    │
    ↓
[10] ADMIN CONFIRMA
    ◆ Vê comprovativo na dashboard
    ◆ Valida se valor etc está correto
    ◆ Clica "Confirmar" ou "Rejeitar"
    │
    ↓
[11] HOTEL VÊ CONFIRMADO
    ┌──────────────────────────────┐
    │ ✅ PAGAMENTO CONFIRMADO      │
    │ Valor: MZN 600               │
    │ Data: 25/02/2026             │
    │ Status: PAGO                 │
    └──────────────────────────────┘
    │
    ↓ FIM
```

---

## CRONOGRAMA DE 7 DIAS

```
      Checkout/Conclusão
              ↓
    ┌─────────┴──────────────────────────┐
    │                                    │
    Day 1    Day 2    Day 3    Day 4    Day 5    Day 6    Day 7
   [25]     [26]     [27]     [28]     [01]     [02]     [03]
    │        │        │        │        │        │        │
    ◆        │        │        │        │        │       ⚠️❌ VENCIDO
    Criado   NORMAL   NORMAL   NORMAL   NORMAL  AVISO   (após este dia)
             (7 dias) (6 dias) (5 dias) (4 dias) (-1 dia)
                                                    └─→ Email alertando
    
    ┌────────────────PRAZO DE PAGAMENTO────────────────┐
    Motorista/Hotel pode pagar em QUALQUER DIA deste intervalo
```

---

## ESTRUTURA DE DADOS

```
Quando Motorista/Hotel concluem transação:

┌─────────────────────────────────────────────────────┐
│              PAYMENT_REFERENCE                      │
├─────────────────────────────────────────────────────┤
│ id                   UUID (único)                   │
│ reference_number     LINKA-RIDE-2025-xxxxx         │
│ booking_id           ride_123 (ou hotel_456)       │
│ booking_type         'ride' ou 'hotel'             │
│ provider_user_id     user_id (motorista/hotel)     │
│ provider_entity_code DRIVER-xxxxx ou HOTEL-xxxxx   │
│ gross_amount         2500 (valor transação)        │
│ fee_percentage       12 (sempre 12%)               │
│ fee_amount           300 (12% de 2500)             │
│ net_amount           2200 (2500 - 300)             │
│ service_date         2026-02-25                    │
│ due_date             2026-03-04 (hoje + 7 dias)   │
│ status               'pending' → 'confirmed'       │
│ paid_at              NULL (até pagar)              │
│ payment_proof_url    URL do comprovativo           │
│ confirmed_by         user_id do admin (aprov.)     │
│ notes                Motivo se rejeitado           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              USER_ENTITIES                          │
├─────────────────────────────────────────────────────┤
│ id                   entity_123                     │
│ user_id              motorista_id                  │
│ entity_code          DRIVER-user_id                │
│ entity_name          Driver Entity Sistema         │
│ entity_type          'individual' ou 'company'     │
│ status               'active'                      │
│ created_at           2026-02-25T14:00:00Z         │
└─────────────────────────────────────────────────────┘
```

---

## STATUS STATES

```
PENDING
  ↓
PENDING_CONFIRMATION (motorista marcou como pago, aguarda admin)
  ↙                    ↘
CONFIRMED              REJECTED
(Pago ✅)              (Rejeitado ❌)
```

---

## CORES E BADGES

```
Status         Cor      Badge
─────────────────────────────────
pending        AZUL     ⏳ Pendente
pending_conf   AMARELO  ⏳ Aguardando Confirmação
confirmed      VERDE    ✅ Pago
rejected       VERMELHO ❌ Rejeitado
overdue        VERMELHO ⚠️ VENCIDO
```

---

## APIS CHAMADAS

```
┌──────────────────────────────────────────────────┐
│        SEQUÊNCIA DE CHAMADAS API                 │
└──────────────────────────────────────────────────┘

1️⃣ Motorista marca ride como concluída:
   POST /api/rides/:rideId/complete
   → Cria PaymentReference automaticamente

2️⃣ Hotel faz checkout:
   POST /api/hotel-bookings/:bookingId/checkout
   → Cria PaymentReference automaticamente

3️⃣ Provedor vê suas comissões:
   GET /api/provider/payments?page=1&limit=20

4️⃣ Provedor marca como pago:
   POST /api/provider/payments/:paymentId/mark-paid
   → Status muda para pending_confirmation

5️⃣ Admin confirma em dashboard:
   POST /api/admin/payments/:paymentId/confirm
   → Status muda para confirmed ✅

6️⃣ Ou admin rejeita:
   POST /api/admin/payments/:paymentId/reject
   → Status muda para rejected ❌
```

---

## DASHBOARD VIEWS

```
MOTORISTA/HOTEL VÊ:

/provider/payments
├─ Total a Pagar: MZN 4,500
├─ Vencidos: 2 (MZN 1,200)
│
└─ Tabela de Comissões:
   ├─ Ride | MZN 300 | LINKA-RIDE-xxx | 04/03 | ⏳ Pendente
   ├─ Hotel| MZN 600 | LINKA-HOTEL-yyy| 03/03 | ⏳ Pendente
   ├─ Ride | MZN 250 | LINKA-RIDE-zzz | 28/02 | ⚠️ VENCIDO
   └─ ...


ADMIN VÊ:

/admin/payments
├─ Pendentes Revisão: 5 (MZN 2,100)
├─ Confirmados: 127 (MZN 45,200)
├─ Rejeitados: 3 (MZN 450)
│
└─ Tabela com:
   ├─ Motorista João | MZN 300 | DRIVER-xxx | [Comprovativo]
   ├─ Hotel XYZ     | MZN 600 | HOTEL-yyy  | [Comprovativo]
   └─ [Confirmar] [Rejeitar] [Aprovar]
```

---

**Diagrama pronto! Use como referência visual durante a implementação.** 🎯
