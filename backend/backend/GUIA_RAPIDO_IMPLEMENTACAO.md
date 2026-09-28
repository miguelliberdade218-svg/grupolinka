# 🔑 SUMÁRIO EXECUTIVO: Gestão de Pagamentos de Comissões

## ✅ O QUE JÁ EXISTE NO BANCO

```
✅ payment_references (TABELA MÃEZINHA DE COMISSÕES)
   ├─ booking_id + booking_type ← Identifica a reserva (ride/hotel/event)
   ├─ provider_user_id ← Quem deve receber (driver/hotel/event_space)
   ├─ gross_amount ← Valor total da reserva
   ├─ fee_amount (12% já calculado) ← Comissão a pagar à app
   ├─ net_amount ← O que o provedor recebe
   ├─ status: 'pending' → 'paid' → confirmado
   ├─ payment_proof_url ← Comprovante do provedor
   └─ confirmed_by ← Admin que aprovou

✅ paymentReferences table
   └─ Schema 100% pronto: tudo o que precisas já está

✅ Admin confirmPayment() method
   └─ Já existe em adminService.ts
   └─ Apenas precisa ser exposto melhor em rotas
```

---

## 🔴 O QUE ESTÁ FALTANDO

### CRÍTICO (Bloqueia MVP)
```
❌ RIDES
   ├─ Sem trigger para gerar payment_references quando ride completa
   ├─ Driver não vê suas comissões
   ├─ Admin não consegue confirmar pagamentos de drivers
   └─ SOLUÇÃO: Trigger na tabela bookings quando status='completed'

❌ EVENTS
   ├─ Invoices são criados MAS payment_references não
   ├─ Event space owner não vê comissões
   ├─ Admin não controla pagamentos de eventos
   └─ SOLUÇÃO: Trigger em eventBookings quando status='completed'

❌ ENDPOINTS para Provedores
   ├─ Drivers NÃO têm endpoints para ver comissões
   ├─ Hotéis têm mas nome é /payments/pending (confuso
   ├─ Event spaces SEM endpoints
   └─ SOLUÇÃO: Criar GET/POST /api/providers/commissions para todos

❌ Comprovantes
   ├─ Campo payment_proof_url existe mas sem upload
   ├─ Provedores não podem anexar print/PDF/foto
   ├─ Admin vê URL vazia
   └─ SOLUÇÃO: Endpoint POST para upload em Firebase/S3
```

### IMPORTANTE (Melhora UX)
```
❌ Notificações
   ├─ Provedor NÃO sabe quando pagamento foi aprovado
   ├─ Admin NÃO sabe pagamento pendente
   └─ SOLUÇÃO: Tabela commission_notifications + integração

❌ Fluxo Claro de Status
   ├─ Confusão entre 'pending' vs 'awaiting_verification'
   ├─ Admin não vê comprovante para validar
   └─ SOLUÇÃO: Status workflow: pending → submitted → verified
```

---

## 🎯 PLANO MÍNIMO VIÁVEL (MVP)

### FASE 1: Base de Dados (1-2 dias)

```sql
-- 1. Trigger para Rides
CREATE TRIGGER trigger_create_payment_ride 
ON bookings AFTER UPDATE
WHEN status = 'completed'
→ INSERT INTO payment_references (booking_type='ride', ...)

-- 2. Trigger para Eventos  
CREATE TRIGGER trigger_create_payment_event
ON eventBookings AFTER UPDATE
WHEN status = 'completed'
→ INSERT INTO payment_references (booking_type='event', ...)

-- 3. Índices de Performance
CREATE INDEX idx_payment_ref_provider_status 
ON payment_references(provider_user_id, status)

-- 4. Notificações (tabela pequena)
CREATE TABLE commission_notifications (
  id UUID, payment_id UUID, provider_id TEXT,
  type TEXT, message TEXT, read BOOLEAN, created_at TIMESTAMP
)
```

### FASE 2: Backend APIs (3-4 dias)

```typescript
// 👁️ Provedores VÊM suas comissões
GET /api/providers/me/commissions
  ├─ Status: pending, awaiting_verification, verified, rejected
  ├─ Mostra: valor, data_vencimento, referência_da_reserva
  └─ Response: { id, invoice_number, amount, status, due_date, ... }

// 📤 Provedores SUBMETEM comprovante
POST /api/providers/me/commissions/:paymentId/submit
  ├─ Body: { payment_method, payment_reference, proof_image_file }
  ├─ Upload para Firebase Storage
  ├─ Update payment_references.payment_proof_url
  └─ Status: pending → submitted

// 🔍 Admin VÊ pagamentos para verificar
GET /api/admin/commissions?filter=pending_verification&type=ride
  ├─ Lista TODOS os pagamentos submetidos
  ├─ Mostra comprovante (imagem/PDF)
  └─ Response: [] com payment_proof_url visível

// ✅ Admin APROVA
POST /api/admin/commissions/:paymentId/verify
  ├─ Admin clica "Aprovar" após ver comprovante
  ├─ Status: submitted → verified
  └─ Notifica provedor ✅

// ❌ Admin REJEITA com motivo
POST /api/admin/commissions/:paymentId/reject
  ├─ Body: { reason: "Comprovante ilegível" }
  ├─ Status: submitted → pending (volta atrás)
  └─ Notifica provedor ❌ com motivo
```

### FASE 3: Frontend (2-3 dias)

```
📱 Driver App
├─ Nova página: "Minhas Comissões"
│  ├─ Lista cards com cada comissão
│  ├─ Card mostra: valor, data_vencimento, status
│  └─ Botão: "Submeter Comprovante"
│
├─ Modal: "Pagar Comissão"
│  ├─ Dropdown: Método pagamento (Bank Transfer, M-Pesa, Cash)
│  ├─ Input: Referência (#12345, M-Pesa phone)
│  ├─ Upload: Imagem do comprovante
│  └─ Botão: "Enviar" (POST /api/drivers/commissions/:id/submit)
│
└─ Status Badge
   ├─ 🔴 pending = "Pagamento pendente"
   ├─ ⏳ submitted = "Aguardando verificação"
   ├─ ✅ verified = "Pago ✓"
   └─ ❌ rejected = "Rejeitado - Reenviar"

🏨 Hotel App
├─ Renomear "/payments/pending" → "/commissions"
├─ Idem driver app (mesmo UI)

🎉 Event Space App
├─ Nova página: "Minhas Comissões"
├─ Idem driver app

🛠️ Admin Dashboard
└─ Novo widget: "Pagamentos Aguardando Verificação"
   ├─ Filtra por provider_type (driver/hotel/event_space)
   ├─ Card por pagamento com:
   │  ├─ Provedor: Nome + Email
   │  ├─ Reserva: Cliente + Referência (RID-123, HB-456)
   │  ├─ Valor: 12,000 MZN
   │  ├─ Método: Bank Transfer, M-Pesa, Cash
   │  ├─ Comprovante: [Ver Imagem] [Baixar PDF]
   │  ├─ Botão: [✅ Aprovar] [❌ Rejeitar com motivo]
   │  └─ Data: Submetido há 2 dias
```

---

## 📊 Diagrama de Fluxo

```
1️⃣ RESERVA COMPLETA
   Driver completa ride
   │
   └─→ TRIGGER ON bookings.status='completed'
       INSERT INTO payment_references (
         booking_type='ride',
         status='pending'
       )

2️⃣ DRIVER VÊ COMISSÃO
   GET /api/drivers/me/commissions
   └─→ "Você tem 12,500 MZN para receber"
       "Prazo: 30 dias"
       [Submeter Comprovante]

3️⃣ DRIVER SUBMETE PROVA
   POST /api/drivers/commissions/:id/submit
   └─→ Upload comprovante
       Status: pending → submitted
       Notifica admin ↓

4️⃣ ADMIN VÊ NO DASHBOARD
   GET /api/admin/commissions?filter=submitted
   └─→ New item com comprovante visível
       Card com botões [Aprovar] [Rejeitar]

5️⃣ ADMIN APROVA
   POST /api/admin/commissions/:id/verify
   └─→ Status: submitted → verified
       confirmed_by = admin_id
       paid_at = NOW()
       Notifica driver ✅

6️⃣ DRIVER RECEBE NOTIFICAÇÃO
   Email/SMS: "Pagamento de 12,500 MZN foi verificado!"
```

---

## 📝 SQL Scripts Prontos para EXECUTAR

```sql
-- 🟢 PASSO 1: Criar tabela de notificações
CREATE TABLE IF NOT EXISTS commission_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payment_references(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 🟢 PASSO 2: Índices
CREATE INDEX idx_notifications_provider ON commission_notifications(provider_id, read);
CREATE INDEX idx_payment_ref_provider_status ON payment_references(provider_user_id, status);

-- 🟢 PASSO 3: Trigger Rides
CREATE OR REPLACE FUNCTION create_payment_reference_for_ride()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO payment_references (
            booking_id, booking_type, provider_user_id,
            gross_amount, fee_percentage, service_date, status
        ) VALUES (
            NEW.id, 'ride', NEW."driverId"::text,
            NEW.total_price::numeric, 12.00,
            CURRENT_DATE, 'pending'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_payment_ride
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION create_payment_reference_for_ride();

-- 🟢 PASSO 4: Trigger Eventos
CREATE OR REPLACE FUNCTION create_payment_reference_for_event()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id TEXT;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT u.id INTO v_owner_id
        FROM event_spaces es
        JOIN users u ON es.owner_id = u.id
        WHERE es.id = NEW."eventSpaceId";
        
        IF v_owner_id IS NOT NULL THEN
            INSERT INTO payment_references (
                booking_id, booking_type, provider_user_id,
                gross_amount, fee_percentage, service_date, status
            ) VALUES (
                NEW.id, 'event', v_owner_id,
                NEW."totalPrice"::numeric, 12.00,
                NEW."startDate"::date, 'pending'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_payment_event
AFTER UPDATE ON "eventBookings"
FOR EACH ROW EXECUTE FUNCTION create_payment_reference_for_event();

-- 🟢 VERIFICAR (Rodar para confirmar tudo OK)
SELECT COUNT(*) FROM payment_references WHERE status = 'pending';
SELECT COUNT(*) FROM commission_notifications;
SELECT * FROM information_schema.triggers WHERE table_name IN ('bookings', 'eventBookings');
```

---

## 🎯 Ficheiros a MODIFICAR/CRIAR

```
src/modules/
├─ admin/
│  ├─ adminService.ts (EXISTENTE - expandir métodos)
│  │  ├─ ✅ confirmPayment() ← JÁ EXISTE
│  │  ├─ ❌ rejectPayment() ← CRIAR
│  │  ├─ ❌ getPendingVerifications() ← CRIAR
│  │  └─ ❌ getAllProviderCommissions() ← CRIAR
│  │
│  └─ index.ts (rotas admin - EXPANDIR)
│     ├─ GET /api/admin/commissions ← EXPANDIR
│     ├─ POST /api/admin/commissions/:id/verify ← CRIAR
│     └─ POST /api/admin/commissions/:id/reject ← CRIAR
│
├─ providers/ (NOVA PASTA)
│  ├─ providerCommissionService.ts (CRIAR)
│  │  ├─ getProviderCommissions(providerId, type)
│  │  ├─ submitCommissionPayment(paymentId, data)
│  │  └─ uploadPaymentProof(paymentId, file)
│  │
│  └─ index.ts (rotas provedores)
│     ├─ GET /api/providers/me/commissions
│     ├─ POST /api/providers/me/commissions/:id/submit
│     └─ POST /api/providers/me/commissions/:id/proof/upload
│
├─ notifications/ (NOVA PASTA)
│  ├─ notificationService.ts (CRIAR)
│  │  ├─ sendCommissionNotification(type, providerId, message)
│  │  ├─ getProviderNotifications(providerId)
│  │  └─ markAsRead()
│  │
│  └─ index.ts (rotas notificações)
│
└─ files/ (PARA UPLOAD)
   ├─ fileService.ts (criar ou expandir)
   └─ uploadHandler()

📂 shared/
├─ schema.ts (JÁ BEM COMPLETO)
│  └─ ✅ paymentReferences (completo)
│  └─ ✅ providerPayouts (completo)
│  └─ ✅ invoices (completo)
│  └─ ❌ commission_notifications (CRIAR EXPORT)
│
└─ types.ts (expandir se needed)
```

---

## 🚨 CHECKLIST PRÉ-IMPLEMENTAÇÃO

- [ ] Backup do banco de dados FEITO
- [ ] SQL scripts testados em staging
- [ ] Triggers testadas com dados reais (rides + eventos)
- [ ] payment_references tem dados de hotéis + rides + eventos
- [ ] Índices criados e com EXPLAIN ANALYZE
- [ ] Confirmado que booking.status pode ser 'completed'
- [ ] Confirmado que eventBookings.status pode ser 'completed'
- [ ] Schema.ts exporta commission_notifications
- [ ] Firebase Storage ou S3 preparado para upload
- [ ] EmailService ou SMS provider escolhido para notificações

---

## ⏱️ TIMELINE ESTIMADA

| Fase | Tarefas | Dias |
|------|---------|------|
| BD | Triggers + Notificações + Índices | 1-2 |
| Backend | Services + Admin APIs + Provider APIs | 3-4 |
| Frontend | UI em cada app + Upload | 2-3 |
| Testes | E2E + stress testing | 1-2 |
| **TOTAL** | **MVP Completo** | **7-11 dias** |

---

## 🎓 TL;DR - O ESSENCIAL

```
JÁ TEM:
  ✅ payment_references table com 12% fee
  ✅ confirmPayment() no admin
  ✅ invoices para hotéis

PRECISA:
  1. Triggers para rides e eventos criarem payment_references
  2. Endpoints /api/providers/me/commissions
  3. Upload de comprovantes
  4. Admin endpoints para aprovar/rejeitar
  5. Notificações para provedores

PRÓXIMA AÇÃO:
  1. Executar SQL scripts
  2. Testar triggers com dados reais
  3. Criar services de comissão
  4. Expor endpoints em rotas
```

---

✅ Ficou claro? Comeca pelo SQL!
