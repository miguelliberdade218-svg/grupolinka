# 🚀 SISTEMA DE COMISSÕES 12% - IMPLEMENTAÇÃO COMPLETA

## ✅ O QUE FOI CRIADO

### **1. Serviço de Pagamentos** `src/modules/payments/providerPaymentService.ts`
- `createRideCommission()` - Cria comissão quando ride é concluída
- `createHotelCommission()` - Cria comissão quando hotel faz checkout
- `getProviderCommissions()` - Lista comissões do provedor
- `markAsPaid()` - Marca como pago (com comprovativo)
- `confirmPayment()` - Admin confirma pagamento
- `rejectPayment()` - Admin rejeita pagamento

### **2. Endpoints de API**

#### **Rotas do Provedor** `api/routes/provider-payments.ts`
```
GET  /api/provider/payments
- Lista minhas comissões
- Query: page, limit, status, type
- Retorna: commissions[], pagination, summary

POST /api/provider/payments/:paymentId/mark-paid
- Marca como pago
- Body: { proofUrl?, notes? }
- Status muda para "pending_confirmation"

POST /api/provider/payments/:paymentId/upload-proof
- Upload de comprovativo
- Body: multipart/form-data { file }
```

#### **Conclusão de Rides** `api/routes/ride-completion.ts`
```
POST /api/rides/:rideId/complete
- Marca ride como completada
- Cria comissão automaticamente
- Retorna: reference, amount, dueDate
```

#### **Checkout de Hotels** `api/routes/hotel-checkout.ts`
```
POST /api/hotel-bookings/:bookingId/checkout
- Marca hotel como completado
- Cria comissão automaticamente
- Retorna: reference, amount, dueDate
```

### **3. Frontend - Página de Provedores** `apps/provider-app/pages/payments.tsx`
- Dashboard moderno com resumo de comissões
- Tabela de comissões por transação
- Filtros: Pendentes, Vencidos, Pagos
- Status com cores (Verde=Pago, Amarelo=Pendente Conf, Vermelho=Vencido)
- Alertas de vencimento
- Botão "Pagar" para cada comissão

---

## 📊 FLUXO COMPLETO

### **Para Rides (Motorista)**

```
1️⃣ PASSAGEIRO PAGA AO MOTORISTA
   - Cash ou Mobile Money (fora da app)
   
2️⃣ MOTORISTA MARCA COMO CONCLUÍDO
   POST /api/rides/:rideId/complete
   
3️⃣ SISTEMA CRIA COMISSÃO AUTOMATICAMENTE
   - Lê valor da corrida
   - Calcula 12% de comissão
   - Cria payment_reference
   - Define vencimento = hoje + 7 dias
   - Cria entidade única (DRIVER_XXXXX)
   - Gera referência única (LINKA-RIDE-XXXXX)
   
4️⃣ MOTORISTA ENTRA NA LISTA "VALORES A LIQUIDAR"
   GET /api/provider/payments
   
5️⃣ TEM ATÉ 7 DIAS PARA PAGAR
   - Menu: /provider/payments
   - Vê tabela com: Commssão | Vencimento | Status
   - Clica "Pagar"
   - Upload comprovativo
   - Status muda para "pending_confirmation"
   
6️⃣ ADMIN CONFIRMA EM /admin/payments
   - Vê comprovativo
   - Aprova ou Rejeita
   - Status muda para "confirmed" ou "rejected"
```

### **Para Hotels**

```
1️⃣ CLIENTE FAZ CHECKOUT IN HOTEL APP
   - Confirma pagamento
   
2️⃣ HOTEL FAZ CHECKOUT NA APP
   POST /api/hotel-bookings/:bookingId/checkout
   
3️⃣ SISTEMA CRIA COMISSÃO AUTOMATICAMENTE
   - Lê valor total da reserva
   - Calcula 12% de comissão
   - Cria payment_reference
   - Define vencimento = hoje + 7 dias
   - Cria entidade única (HOTEL_XXXXX)
   - Gera referência única (LINKA-HOTEL-XXXXX)
   
4️⃣ HOTEL RECEBE NOTIFICAÇÃO
   "Você tem 7 dias para pagar MZN XXX"
   
5️⃣ HOTEL ENTRA NA LISTA "VALORES A LIQUIDAR"
   GET /api/provider/payments
   
6️⃣ TEM ATÉ 7 DIAS PARA PAGAR
   - Menu: /provider/payments
   - Vê tabela com: Comissão | Vencimento | Status
   - Clica "Pagar"
   - Transfer para Entidade do hotel
   - Reference: LINKA-HOTEL-XXXXX
   - Upload comprovativo
   
7️⃣ ADMIN CONFIRMA EM /admin/payments
   - Vê comprovativo
   - Aprova ou Rejeita
   - Status muda para "confirmed" ou "rejected"
```

---

## 🔧 INTEGRAÇÃO - O QUE FALTA FAZER

### **1. Conectar os Endpoints ao Server**

No seu `server.js` ou Express app, adicione:

```javascript
import providerPaymentsRouter from "./api/routes/provider-payments.ts";
import rideCompletionRouter from "./api/routes/ride-completion.ts";
import hotelCheckoutRouter from "./api/routes/hotel-checkout.ts";

app.use("/api/provider/payments", providerPaymentsRouter);
app.use("/api/rides", rideCompletionRouter);
app.use("/api/hotel-bookings", hotelCheckoutRouter);
```

### **2. Adicionar Página ao Provider App**

No seu `ProviderApp.tsx` ou routing:

```typescript
import ProviderPayments from "./apps/provider-app/pages/payments";

// Adicione ao router:
<Route path="/provider/payments" component={ProviderPayments} />
```

### **3. Adicionar Botão "Pagar" na Ride Completa**

Após ride ser completada, mostrar notificação:

```typescript
const response = await fetch(`/api/rides/${rideId}/complete`, { method: "POST" });
const data = await response.json();

// Mostrar alerta ao motorista
toast.success(`
  Ride concluída! 
  Comissão a pagar: MZN ${data.commission.amount}
  Vencimento: ${data.commission.dueDate}
  Referência: ${data.commission.referenceNumber}
`);
```

### **4. Adicionar Botão "Checkout" em Hotel**

Após cliente pagar, hotel faz:

```typescript
const response = await fetch(`/api/hotel-bookings/${bookingId}/checkout`, {
  method: "POST",
  body: JSON.stringify({ paymentMethod: "cash" })
});

const data = await response.json();

// Notificar hotel
toast.success(`
  Checkout realizado!
  Comissão a pagar: MZN ${data.commission.amount}
  Vencimento: ${data.commission.dueDate}
  Acesse seu dashboard de pagamentos para mais detalhes
`);
```

---

## 📋 DADOS NA API

### **Exemplo: GET /api/provider/payments**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment_1708876842000_ride123",
      "referenceNumber": "LINKA-RIDE-1708876842000-ride1234",
      "bookingType": "ride",
      "bookingId": "ride123",
      "grossAmount": "5000",
      "feeAmount": "600",
      "status": "pending",
      "dueDate": "2026-03-04",
      "serviceDate": "2026-02-25",
      "paidAt": null,
      "daysUntilDue": 7,
      "isOverdue": false
    },
    {
      "id": "payment_1708876843000_hotel456",
      "referenceNumber": "LINKA-HOTEL-1708876843000-hotel456",
      "bookingType": "hotel",
      "bookingId": "hotel456",
      "grossAmount": "8000",
      "feeAmount": "960",
      "status": "pending",
      "dueDate": "2026-03-04",
      "serviceDate": "2026-02-25",
      "paidAt": null,
      "daysUntilDue": 7,
      "isOverdue": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "pages": 1
  },
  "summary": {
    "pendingAmount": "1560",
    "overdueCount": 0,
    "overdueAmount": "0"
  }
}
```

### **Exemplo: POST /api/rides/:rideId/complete**

Request:
```json
{
  "confirmationCode": "ABC123"
}
```

Response:
```json
{
  "success": true,
  "message": "Ride concluída com sucesso",
  "rideId": "ride123",
  "commission": {
    "referenceNumber": "LINKA-RIDE-1708876842000-ride1234",
    "amount": 600,
    "dueDate": "2026-03-04",
    "message": "Você tem até 2026-03-04 para pagar MZN 600.00 de comissão"
  }
}
```

---

## 💾 DADOS NO BANCO

### **Tabela: payment_references**

Após motorista concluir ride OU hotel fazer checkout:

```sql
INSERT INTO payment_references (
  id,
  reference_number,      -- LINKA-RIDE-XXXXX ou LINKA-HOTEL-XXXXX
  booking_id,           -- ID da ride ou hotel booking
  booking_type,         -- 'ride' ou 'hotel'
  provider_user_id,     -- ID do motorista ou hotel manager
  provider_entity_code, -- DRIVER_XXXXX ou HOTEL_XXXXX
  gross_amount,         -- Valor da transação
  fee_percentage,       -- 12
  fee_amount,          -- 12% do gross_amount
  net_amount,          -- gross_amount - fee_amount
  service_date,        -- Data da ride/check-in
  due_date,            -- Data atual + 7 dias
  status,               -- 'pending'
  created_at,
  updated_at
) VALUES (...);
```

### **Tabela: userEntities**

Criada automaticamente quando primeiro pagamento:

```sql
INSERT INTO userEntities (
  id,
  user_id,              -- ID do motorista ou hotel
  entity_code,          -- DRIVER_XXXXX ou HOTEL_XXXXX
  entity_name,
  entity_type,          -- 'individual' ou 'company'
  status,               -- 'active'
  created_at
) VALUES (...);
```

---

## 🔔 NOTIFICAÇÕES

### **Quando é Criada uma Comissão**

Para Motorista:
```
Título: 🏁 Ride Concluída!
Mensagem: Sua comissão de MZN 600 vence em 7 dias (04/03/2026)
Referência: LINKA-RIDE-...
Ação: "Ver em Meus Pagamentos"
```

Para Hotel:
```
Título: ✅ Checkout Realizado!
Mensagem: Sua comissão de MZN 960 vence em 7 dias (04/03/2026)
Referência: LINKA-HOTEL-...
Ação: "Ver em Meus Pagamentos"
```

### **Quando Falta 1 Dia Para Vencer**

```
Título: ⚠️ Pagamento Vence Amanhã!
Mensagem: Você tem MZN 600 a pagar AMANHÃ (04/03/2026)
Ação: "Pagar Agora"
```

### **Quando Passa Vencimento**

```
Título: 🚨 PAGAMENTO VENCIDO!
Mensagem: Você tem MZN 600 VENCIDO (desde 04/03/2026)
Aviso: Sua conta pode ser suspensa!
Ação: "Pagar Imediatamente"
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Conectar endpoints ao servidor
- [ ] Adicionar página `/provider/payments` ao app
- [ ] Adicionar rota de pagamentos ao provider router
- [ ] Testar fluxo completo de ride
- [ ] Testar fluxo completo de hotel
- [ ] Testar cálculo de 12%
- [ ] Testar data de vencimento (7 dias)
- [ ] Testar referência única
- [ ] Testar entidade única
- [ ] Testar notificações
- [ ] Testar upload de comprovativo
- [ ] Integrar com admin dashboard

---

## 🎯 PRÓXIMOS PASSOS

### Imediatamente:
1. Conectar endpoints ao servidor
2. Testar com dados reais

### Próxima Semana:
1. Implementar upload de arquivos (S3/Firebase)
2. Adicionar notificações por email
3. Criar admin dashboard para confirmar pagamentos
4. Implementar alertas de vencimento

### Futuro:
1. Integração com Mpesa/Bank automático
2. Geração de boletos/faturas em PDF
3. Webhooks para confirmação automática
4. Relatórios de financeiro

---

## 📞 SUPORTE

Se tiver dúvidas sobre:
- **Endpoints**: Veja `api/routes/`
- **Lógica**: Veja `src/modules/payments/providerPaymentService.ts`
- **Frontend**: Veja `apps/provider-app/pages/payments.tsx`
- **BD**: Veja schema de `payment_references` e `userEntities`

Tudo está documentado e pronto para integrar! 🚀
