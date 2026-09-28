# 📊 ANÁLISE COMPLETA: Sistema de Gestão de Pagamentos de Comissões

**Data**: 5 de Abril de 2026  
**Status**: Revisão do Sistema Atual + Recomendações de Implementação

---

## 📌 RESUMO EXECUTIVO

O sistema de pagamentos da app **JÁ POSSUI** uma infraestrutura sólida com tabelas, campos e métodos implementados. O foco deve ser em:

1. ✅ **MELHORAR** o fluxo atual de confirmação de pagamentos
2. ✅ **ESTENDER** para que provedores (drivers, hotéis, espaços) possam gerenciar seus pagamentos
3. ⚠️ **OTIMIZAR** a integração rides + invoices (faltando implementação)
4. ❌ **SIMPLIFICAR** - evitar tabelas duplicadas e redundâncias

---

## 🔍 ANÁLISE DO SISTEMA ATUAL

### 1️⃣ O QUE JÁ EXISTE

#### Tabelas Base
```
✅ paymentReferences (payment_references)
   - Comissões a pagar aos provedores
   - Fee: 12% (default) ← JÁ CONFIGURADO
   - Status: pending, paid, processing, failed, refunded, cancelled, expired, partial
   - Campos: provider_id, booking_id, booking_type, gross_amount, net_amount, fee_amount
   - Campos de validação: confirmed_by (admin), paid_at, payment_proof_url

✅ providerPayouts (provider_payouts)
   - Pagamentos aos provedores por período
   - Status: pending, processing, paid, failed
   - Relação 1:N com payment_references

✅ invoices (tabela principal de faturas)
   - Fatura para cliente de hotel/evento
   - Relaciona com hotel_booking_id, booking_id
   - Gerada automaticamente por trigger para hotelBookings

✅ hotelPayments + hotelBookings
   - Sistema de pagamento específico para hotéis (já implementado)
```

#### Endpoints já implementados
```
✅ GET /api/admin/commissions -- lista pagamentos pendentes
✅ POST /api/admin/commissions/:paymentId/approve -- aprova pagamento
✅ POST /api/admin/commissions/:paymentId/reject -- rejeita pagamento
   (método: confirmPayment em adminService.ts)

✅ GET /api/hotels/:id/payments/pending -- hotéis veem pagamentos pendentes
✅ POST /api/hotels/:id/bookings/:bookingId/payments -- registra pagamento
✅ GET /api/hotels/:id/financial-summary -- sumário financeiro
```

#### Admin Dashboard
```
✅ Estatísticas de pagamentos pendentes
✅ Valor total pendente (pending_amount em MZN)
✅ Listagem de payment_references com filtros
```

---

### 2️⃣ O QUE ESTÁ INCOMPLETO

#### ⚠️ Rides (Motoristas)
```
❌ Invoices NÃO são geradas automaticamente para rides
❌ Comissões de drivers NÃO criam payment_references
❌ Sistema de pagamento para drivers ESTÁ VAZIO

PROBLEMA: 
- Tabela 'bookings' existe mas não gera invoices
- Não há trigger para criar payment_references quando ride é confirmada
- Driver não vê suas comissões pendentes
- Admin não consegue confirmar pagamentos de drivers
```

#### ⚠️ Event Spaces (Espaços de Evento)
```
✅ Invoices SÃO criados (função: createEventInvoice)
❌ MAS payment_references NÃO são criados
❌ Comissões de event spaces NÃO rastreadas
❌ Admin não vê estadísticas de pagamentos de eventos
```

#### ⚠️ Notificações
```
❌ Sistema de notificações para provedores FALTA
❌ Sem alertas quando pagamento é aprovado/rejeitado
❌ Sem reminders de comissões pendentes
```

#### ⚠️ Comprovantes de Pagamento
```
❌ Provedores NÃO podem enviar comprovantes (print, PDF, foto)
❌ Campo payment_proof_url existe mas sem UI para upload
❌ Admin não vê comprovantes para validar
```

---

## 🎯 RECOMENDAÇÕES FINAIS: O QUE IMPLEMENTAR

### ✅ FASE 1: CORRETOR RIDES (CRÍTICO)

**O QUE IMPLEMENTAR:**

1. **Trigger para gerar payment_references em rides**
```sql
QUANDO: Uma ride é marcada como 'completed' (após serviço realizado)
CRIA: Um registro em payment_references com:
  - booking_type = 'ride'
  - booking_id = ride.id
  - provider_user_id = ride.driver_id
  - gross_amount = ride.total_price
  - fee_percentage = 12
  - fee_amount = gross_amount * 0.12
  - net_amount = gross_amount - fee_amount
  - service_date = ride.completed_date
  - status = 'pending'
```

2. **Endpoints para Drivers (Provider App)**
```
GET /api/drivers/me/commissions
  - Lista todas as comissões (pending, paid, rejected)
  - Mostra: invoice_number, amount, due_date, status, payment_method

POST /api/drivers/me/commissions/:paymentId/pay
  - Driver marca pagamento como feito
  - Envia: payment_method, payment_reference, proof_image_url
  - Status muda: pending → "awaiting_verification"

GET /api/drivers/me/commissions/:paymentId
  - Detalhes de uma comissão com histórico de status
```

3. **Endpoints para Admin**
```
GET /api/admin/commissions?filter=pending_verification
  - Lista TODOS os pagamentos aguardando (drivers, hotéis, events)

POST /api/admin/commissions/:paymentId/verify
  - Admin aprova pagamento
  - Envia: notes (opcional)
  - Status: "awaiting_verification" → "verified"/"rejected"

POST /api/admin/commissions/:paymentId/reject
  - Admin rejeita com motivo
  - Driver recebe notificação
```

---

### ✅ FASE 2: ESTENDER EVENTS

**O QUE IMPLEMENTAR:**

1. **Trigger para gerar payment_references em eventos**
```sql
QUANDO: Um evento é marcado como 'completed' ou 'checked_out'
CRIA: Um registro em payment_references com:
  - booking_type = 'event'
  - booking_id = eventBooking.id
  - provider_user_id = eventSpace.owner_id
  - gross_amount = eventBooking.total_price
  - service_date = eventBooking.event_date
```

2. **Endpoints para Event Space Owners**
```
GET /api/event-spaces/me/commissions
  - Mesmo padrão de drivers

POST /api/event-spaces/me/commissions/:paymentId/pay
  - Idem drivers
```

---

### ✅ FASE 3: MELHORAR HOTÉIS

**O QUE IMPLEMENTAR:**

1. **Adaptar payment_references para hotéis**
   - Atualmente usam tabela separada `hotelPayments`
   - RECOMENDAÇÃO: Unificar com `payment_references` para consistência

2. **Endpoints unificados para hotéis**
```
GET /api/hotels/me/commissions (em vez de /payments/pending)
POST /api/hotels/me/commissions/:paymentId/pay
```

---

### ✅ FASE 4: COMPROVANTES E NOTIFICAÇÕES

**O QUE IMPLEMENTAR:**

1. **Upload de Comprovantes**
```typescript
POST /api/providers/commissions/:paymentId/proof
  - Accepts: multipart/form-data (file + notes)
  - Storages: Firebase Storage ou S3
  - Updates: payment_proof_url + status
```

2. **Notificações**
```typescript
// Em cada status update
- payment_requested → Notifica admin
- payment_verified → Notifica provider (aprovado ✅)
- payment_rejected → Notifica provider com motivo (❌)
- payment_pending_reminder → 7 dias antes do vencimento
```

3. **Tabela de Notificações**
```sql
commission_notifications (
  id UUID,
  payment_id UUID,
  provider_id TEXT,
  type TEXT (payment_requested, payment_verified, payment_rejected),
  message TEXT,
  read BOOLEAN,
  created_at TIMESTAMP
)
```

---

## ❌ O QUE NÃO IMPLEMENTAR (E POR QUÊ)

### ❌ 1. Tabela de payment_status com estados específicos
**Motivo**: 
- Já existe em `paymentReferences.status` 
- Estados: pending → paid ✅
- Admin pode usar `confirmed_by` para saber quem aprovou

### ❌ 2. Tabela separada `commission_payments`
**Motivo**:
- REDUNDA com `paymentReferences`
- Sistema já segue: provider edita status → admin confirma
- Adicionar nova tabela = duplicação de código + confusão

**RECOMENDAÇÃO**: Use APENAS `payment_references`

### ❌ 3. Sistema de "provider inicia pagamento na app"
**Motivo**:
- Este modelo NÃO é comum em plataformas
- Causa: Providers podem FALSIFICAR transferências
- **MELHOR**: Admin automatiza/integra com PagSeguro, Stripe, M-Pesa

**RECOMENDAÇÃO**: 
- Admin transfere manualmente (ou via integrações bancárias)
- Provider submete comprovante APÓS transferência ser feita
- System é: Admin paga → Provider confirma na app

---

## 🗄️ ESTRUTURA FINAL DE TABELAS

```sql
-- 1. REFERÊNCIA DE PAGAMENTO (UNIFORME PARA TODOS)
payment_references (
  id, booking_id, booking_type ('ride','hotel','event'),
  provider_user_id, provider_type ('driver','hotel','event_space'),
  gross_amount, fee_percentage (12%), fee_amount, net_amount,
  service_date, due_date, status ('pending','paid','rejected'),
  payment_method, payment_proof_url,
  confirmed_by (admin_id), paid_at,
  created_at, updated_at
)

-- 2. NOTIFICAÇÕES
commission_notifications (
  id, payment_id, provider_id, type, message, read, created_at
)

-- MANTER:
invoices (para clientes)
hotelPayments (compatibilidade)
hotelBookings (trigger gera invoices)
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Criar trigger para rides: `completed` → payment_references
- [ ] Criar trigger para eventos: `completed` → payment_references  
- [ ] Tabela `commission_notifications`
- [ ] Adicionar índices em payment_references (provider_id, status, due_date)

### Backend Services

**Drivers/Ride Module**
- [ ] Service: getRideCommissions()
- [ ] Service: submitRidePayment(paymentId, proofUrl, method, reference)
- [ ] Routes: GET/POST /api/drivers/me/commissions*

**Event Spaces Module**
- [ ] Service: getEventCommissions()
- [ ] Service: submitEventPayment()
- [ ] Routes: GET/POST /api/event-spaces/me/commissions*

**Admin Module**
- [ ] Endpoint: GET /api/admin/commissions (filtro: provider_type)
- [ ] Endpoint: POST /api/admin/commissions/:id/verify
- [ ] Dashboard: estatísticas por provider_type

**Notifications**
- [ ] Service: sendCommissionNotification()
- [ ] Integração com Firebase/SendGrid

**File Upload**
- [ ] Service: uploadPaymentProof()
- [ ] Validar tipos (JPG, PNG, PDF, máx 5MB)
- [ ] Salvar em Firebase Storage

### Frontend (Provider Apps)

**Hotel App**
- [ ] Página: "Minhas Comissões"
- [ ] UI: Listar comissões com status
- [ ] Modal: "Pagar Comissão" + upload

**Driver App**
- [ ] Página: "Minhas Comissões"
- [ ] Idem hotel app

**Event Space App**
- [ ] Página: "Minhas Comissões"
- [ ] Idem hotel app

### Admin Dashboard
- [ ] Widget: "Pagamentos Aguardando Verificação"
- [ ] Filtros: provider_type, status, data
- [ ] Ação: Aprovar/Rejeitar com comprovante visível

---

## 💾 Adições Manuais ao Banco de Dados

Antes de começar programação, execute:

```sql
-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS commission_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payment_references(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_requested', 'payment_verified', 'payment_rejected')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_provider ON commission_notifications(provider_id, read);
CREATE INDEX idx_notifications_type ON commission_notifications(type);

-- 2. Adicionar índices em payment_references
CREATE INDEX idx_payment_ref_provider_status 
ON payment_references(provider_user_id, status);

CREATE INDEX idx_payment_ref_booking_type 
ON payment_references(booking_type, status);

-- 3. Trigger para rides
CREATE OR REPLACE FUNCTION create_payment_reference_for_ride()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO payment_references (
        booking_id, booking_type, provider_user_id,
        gross_amount, fee_percentage, service_date,
        status
    ) VALUES (
        NEW.id, 'ride', NEW."driverId",
        NEW.total_price::numeric, 12.00,
        NEW."completedDate"::date,
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se trigger já existe antes de criar
DROP TRIGGER IF EXISTS trigger_create_payment_ride ON bookings;
CREATE TRIGGER trigger_create_payment_ride
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION create_payment_reference_for_ride();

-- 4. Trigger para eventos
CREATE OR REPLACE FUNCTION create_payment_reference_for_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO payment_references (
        booking_id, booking_type, provider_user_id,
        gross_amount, fee_percentage, service_date,
        status
    ) 
    SELECT
        NEW.id, 'event', u.id,
        NEW."totalPrice"::numeric, 12.00,
        NEW."startDate"::date,
        'pending'
    FROM event_spaces es
    JOIN users u ON es.owner_id = u.id
    WHERE es.id = NEW."eventSpaceId";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_payment_event ON "eventBookings";
CREATE TRIGGER trigger_create_payment_event
AFTER UPDATE ON "eventBookings"
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION create_payment_reference_for_event();

-- 5. Verificar tabela bookings tem status='completed'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "completedDate" TIMESTAMP;
```

---

## 🚀 IMPLEMENTAÇÃO SUGERIDA

### Sprint 1 (BD + Triggers)
- Criar tabela de notificações
- Adicionar índices
- Criar triggers para rides e eventos
- Testar com dados reais

### Sprint 2 (Backend Services)
- Criar service methods para cada provider type
- Endpoints GET (listar comissões)
- Endpoints POST (submit payment)
- Admin endpoints para verificação

### Sprint 3 (Notificações + Upload)
- Implementar sistema de notificações
- Upload de comprovantes
- Validações de arquivo

### Sprint 4 (Frontend)
- Páginas de comissões em cada app
- Modals de pagamento
- Admin dashboard

---

## 📊 Fluxo de Estados Proposto

```
PROVEDOR
┌─────────────────────┐
│ payment_references  │ status = 'pending'
│ - Criada pelo admin │
│ - Espera aprovação  │
└──────────┬──────────┘
           │ Provedor submete pagamento
           ↓
┌─────────────────────────────────────┐
│ AWAITING_VERIFICATION               │
│ - Comprovante enviado               │
│ - Admin recebe notificação          │
└──────────┬──────────────────────────┘
           │
        ┌──┴──────────────────┐
        │                     │
        ↓                     ↓
    VERIFIED            REJECTED
    status='paid'      status='pending'
    ✅ Concluído      ❌ Reenviar
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Não modifique payment_references status values sem testar triggers**
   - Muitos triggers dependem deles

2. **Mantenha 12% como fee_percentage default**
   - Já configurado, não mude aleatoriamente

3. **Certifique-se que booking_type é sempre preenchido**
   - CRÍTICO para filtros de admin

4. **Use provider_type enum (driver, hotel, event_space)**
   - Não use strings soltas

5. **Sempre preencha service_date**
   - É essencial para cálculos de vencimento

---

## 📞 Dúvidas Comuns

**P: Por que não criar nova tabela commission_payments?**  
R: Já temos payment_references que cobre 100% do caso de uso. Nova tabela = duplicação.

**P: Como checar pagamentos? Relatórios?**  
R: Fazer query em payment_references com filtros por provider_id + date range.

**P: E se admin cometer erro ao confirmar?**  
R: Deixar revert de 'paid' para 'pending' se necessário (adicionar endpoint /reverse).

**P: Provedores podem cancelar ou desistir?**  
R: Sim, status pode ir 'paid' → 'cancelled' se necessário (motivo em notes).

---

## ✅ CONCLUSÃO

**IMPLEMENTAR:**
- ✅ Triggers para rides e eventos
- ✅ Endpoints para provedores gerenciarem comissões
- ✅ Sistema de notificações
- ✅ Upload de comprovantes
- ✅ Admin dashboard unificado

**NÃO DUPLICAR:**
- ❌ Não criar commission_payments (use payment_references)
- ❌ Não criar outro sistema de stati (use status enum)
- ❌ Não separar hotéis de drivers de eventos (unificar)

**RESULTADO FINAL:**
Sistema único, consistente, reutilizável para todos os provedores.
