# 📊 Análise: Sistema de Comissões & Pagamentos (12%)

## ✅ O Que Já Existe no Banco de Dados

### 1. **paymentReferences Table** ✓
```sql
- id: UUID (única)
- reference_number: VARCHAR (único)
- booking_id: UUID
- booking_type: 'hotel' | 'ride' | 'event'
- provider_user_id: UUID (motorista ou hotel)
- provider_entity_id: UUID (entidade contabilística)
- provider_entity_code: VARCHAR (código de entidade)
- client_user_id: UUID
- gross_amount: DECIMAL (valor bruto)
- fee_percentage: DECIMAL (default 12%)
- fee_amount: DECIMAL (calculado: 12% do gross_amount)
- net_amount: DECIMAL (gross_amount - fee_amount)
- service_date: DATE
- due_date: DATE
- status: 'pending' | 'paid' | 'cancelled'
- paid_at: TIMESTAMP
- payment_method: VARCHAR
- payment_proof_url: VARCHAR
- confirmed_by: UUID (admin que confirmou)
- notes: TEXT
- metadata: JSONB
```

### 2. **platformFeeConfig Table** ✓
```sql
- id: UUID
- fee_percentage: DECIMAL (default 12%)
- min_amount: DECIMAL
- max_amount: DECIMAL
- effective_date: DATE
- created_at: TIMESTAMP
```

### 3. **userEntities Table** ✓
```sql
- id: UUID
- user_id: UUID (única por utilizador!)
- entity_code: VARCHAR (código da entidade)
- entity_name: VARCHAR
- entity_type: 'individual' | 'company'
- status: 'active' | 'inactive'
- created_at: TIMESTAMP
```

### 4. **userBankAccounts Table** ✓
```sql
- id: UUID
- user_id: UUID
- account_number: VARCHAR
- bank_name: VARCHAR
- account_holder: VARCHAR
- iban: VARCHAR
- swift_code: VARCHAR
- is_default: BOOLEAN
```

### 5. **providerPayouts Table** ✓
```sql
- id: UUID
- provider_id: UUID
- total_amount: DECIMAL
- status: 'pending' | 'processing' | 'completed' | 'failed'
- reference_ids: JSONB (array de payment_reference IDs)
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

---

## 🎯 O Que Precisa Ser Criado/Melhorado

### 1. **Verificação de Status de Usuários**
  
**PROBLEMA IDENTIFICADO:**
```
Usuários mostram "⏳ Não" em Verificado, mas têm todas as capabilities:
- edsondaniel330@gmail.com: ✅ Motorista, ✅ Hotel, ✅ Cliente → ⏳ Não
- test.user@example.com: ✅ Hotel, ✅ Cliente → ⏳ Não
- miguelliberdade218@gmail.com: ✅ Motorista, ✅ Hotel, ✅ Cliente → ⏳ Não
- edsondaniel8@gmail.com: ✅ Motorista, ✅ Hotel, ✅ Cliente → ⏳ Não

SOLUÇÃO: O campo "Verificado" deve refletir se o utilizador tem ALL documentos validados para AS capabilities que possui.
```

### 2. **Dashboard de Provedores - Gestão de Comissões**

**Necessário para Motoristas/Hotéis:**
- Vista de todas as suas reservas
- Cálculo automático: 12% de comissão
- Código de Entidade + Referência de Pagamento
- Status de Pagamento (Pendente/Pago)
- Data de Vencimento
- Botão para Marcar como Pago

**Page a criar:** 
- `/provider/payments` ou `/driver/payments` + `/hotel/payments`

### 3. **Admin Dashboard - Gestão de Comissões**

**Já existe em `/admin/payments`:**
- ✓ Ver pagamentos por período
- ✓ Confirmar pagamentos
- ✓ Status de pagamentos
- ✓ Gerenciar taxas (fees)

**Melhorias sugeridas:**
- Dashboard de financeiro (receitas totais vs comissões)
- Relatório de payouts pendentes
- Integração com alertas

---

## 💡 Proposta de Solução - Fluxo Completo

### **Cenário: Hotel faz reserva com Sistema Moderno de Pagamentos**

```
1. CHECKOUT DA RESERVA
   Cliente confirma reserva = MZN 5,000
   Data/Hora: 25/02/2026 14:30
   ↓
2. SISTEMA CRIA AUTOMATICAMENTE:
   - HotelBooking (reserva)
   - PaymentReference (obrigação de pagamento)
   - UserEntity (código único do hotel)
   - Due Date = 25/02/2026 + 7 dias = 04/03/2026
   ↓
3. DADOS GERADOS AUTOMATICAMENTE:
   ✅ Código de Entidade: [HOTEL_007_USER_ID] ← Único por hotel
   ✅ Referência de Pagamento: [LINKA-2026-0025-001] ← Única por transação
   ✅ Comissão Devida: MZN 600 (12%)
   ✅ Data de Vencimento: 04/03/2026
   ✅ Comprovativo: Gerar boleto/fatura automática em PDF
   ↓
4. HOTEL RECEBE NOTIFICAÇÃO:
   "📌 Nova Comissão a Pagar!
    Valor: MZN 600 (12% de MZN 5,000)
    Vencimento: 04/03/2026 (7 dias)
    
    💳 Pagamento:
    Entidade: HOTEL_007_USER_ID
    Referência: LINKA-2026-0025-001
    
    📄 Download: Boleto/Fatura (PDF)"
   ↓
5. HOTEL ACESSA `/provider/payments` (ou `/hotel/payments`)
   VÊ TABELA MODERNA:
   ┌─────────┬──────────┬───────────┬──────────────┬──────────────┬────────────┐
   │ Reserva │ Comissão │ Entidade  │ Referência   │ Vencimento   │ Status     │
   ├─────────┼──────────┼───────────┼──────────────┼──────────────┼────────────┤
   │ RES-001 │ MZN 600  │ HOTEL-007 │ LINKA-26-001 │ 04/03/2026   │ ⏳ Pendente│
   │ RES-002 │ MZN 450  │ HOTEL-007 │ LINKA-26-002 │ 03/03/2026   │ ⏳ Pendente│
   │ RES-003 │ MZN 720  │ HOTEL-007 │ LINKA-26-003 │ 28/02/2026   │ ⚠️  Atrasado
   │ RES-004 │ MZN 300  │ HOTEL-007 │ LINKA-26-004 │ 01/03/2026   │ ✅ Pago    │
   └─────────┴──────────┴───────────┴──────────────┴──────────────┴────────────┘
   ↓
6. HOTEL TEM 3 OPÇÕES DE PAGAMENTO:
   
   A) PAGAMENTO AUTOMÁTICO (Moderno) 🎯
      - Clica "Pagar Agora"
      - Integra com Mpesa/Bank/Card
      - Confirmação automática
      - Ideal para grandes hotéis
   
   B) PAGAMENTO MANUAL (Simples) 💼
      - Transfer para entidade + referência
      - Upload comprovativo (foto/PDF)
      - Admin valida
      - Ideal para transferências bancárias
   
   C) DOWNLOAD BOLETO/FATURA (Profissional) 📄
      - Gera PDF com:
        * Código de Barras (boleto)
        * QR Code (para Mpesa/C2B)
        * Dados bancários
        * Entidade + Referência
      - Imprime e paga no banco
      - Upload comprovativo
   ↓
7. HOTEL ESCOLHE OPÇÃO B (Manual):
   - Transfere MZN 600
   - Para Entidade: HOTEL_007_USER_ID
   - Referência: LINKA-2026-0025-001
   - Upload comprovativo (foto do compr.)
   ↓
8. ADMIN RECEBE NOTIFICAÇÃO:
   "💰 Pagamento de Comissão Pendente de Revisão
    Hotel: Hotel XYZ
    Entidade: HOTEL_007_USER_ID
    Referência: LINKA-2026-0025-001
    Valor: MZN 600
    
    🔍 Ação: Revisar Comprovativo"
   ↓
9. ADMIN VERIFICA `/admin/payments`:
   VÊ TABELA COM:
   - Entidade Provider (identificação única)
   - Referência Único (identifica a transação)
   - Comprovativo Upload (visualiza foto)
   - Aprova/Rejeita
   ↓
10. ADMIN APROVA:
    Status: ✅ CONFIRMADO em 25/02/2026
    Nota: "Comprovativo OK, pagamento recebido"
    ↓
11. HOTEL VÊ CONFIRMADO:
    Status: ✅ Pago em 25/02/2026
    Comprovativo: Armazenado no sistema
    Histórico: Visível para futuros audits
```

---

## 🎯 **FLUXO RESUMIDO - Sistema Híbrido Proposto**

| Fase | O Que Acontece | Dados Gerados |
|------|---|---|
| **1. Checkout** | Cliente confirma reserva | Reservation ID, Amount, Date |
| **2. Auto-ref** | Sistema gera referências | Entity Code (hotel), Payment Ref (unique) |
| **3. Notif** | Hotel recebe alertas | Email + In-app notification |
| **4. Dashboard** | Hotel vê pagamentos| Tabela com status, vencimento, comissão |
| **5. Pagar** | Hotel transfere ou clica botão | Payment Method (Manual/Auto) |
| **6. Comprovativo** | Upload ou confirmação automática | Proof Image + Payment Status |
| **7. Admin** | Admin revisa na dashboard | Payment Status + Entity + Proof |
| **8. Aprovação** | Admin marca como pago | Confirmed By, Confirmed At, Notes |
| **9. Histórico** | Ambos veem no histórico | Full audit trail |

---

## ✨ **Melhorias Implementadas**

### 1. ✅ **Entidade Específica do Provedor**
```sql
Cada hotel/motorista tem UMA entidade:
- userEntities.entity_code = "HOTEL_007" (estático)
- paymentReferences.provider_entity_code = "HOTEL_007" (referência)
- Admin recebe: "Quem pagou? → Olha a entidade!"
```

### 2. ✅ **Referência Única por Transação**
```sql
Cada pagamento tem referência única:
- paymentReferences.reference_number = "LINKA-2026-0025-001"
- Corresponde a reserva específica
- Admin identifica: "Qual reserva pagou? → LINKA-2026-0025-001"
```

### 3. ✅ **Data de Vencimento (7 Dias)**
```
- checkout_date: 25/02/2026
- payment_due_date: 25/02/2026 + 7 DIAS = 04/03/2026
- After +1 day vencido: Status = "OVERDUE"
- Admin alerta: "Pagamento vencido há 1 dia!"
```

### 4. ✅ **Sistema Híbrido de Pagamentos**
```
Opção 1: MANUAL (Simples)
  - Transfer bancária com entidade + referência
  - Upload comprovativo
  - Admin aprova

Opção 2: AUTOMÁTICO (Moderno)
  - Integra Mpesa/Bank/Card
  - Confirmação instantânea
  - Sem precisa de comprovativo

Opção 3: BOLETO (Profissional)
  - Gera PDF com código de barras
  - Hotel imprime e paga no banco
  - Upload comprovativo depois
```

### 5. ✅ **Por Vencimento Individual**
```
Cada reserva = Uma comissão = Um vencimento
- Reserva 1: Vence 04/03/2026
- Reserva 2: Vence 03/03/2026
- Reserva 3: Vence 28/02/2026
- Admin vê lista com VDs ordenadas (próximas a vencer primeiro)
```

---

## 📱 Implementação Proposta

### **FASE 1: Correção (1-2 horas)**
1. ✅ Corrigir campo "Verificado" na dashboard dos utilizadores
2. ✅ Garantir que paymentReferences são criadas corretamente
3. ✅ Validar cálculo de comissão (12%)

### **FASE 2: Dashboard do Provedor (3-4 horas)**
1. Criar página `/hotel/payments` com:
   - Tabela de reservas + comissões devidas
   - Código de Entidade (constante por utilizador)
   - Referência de Pagamento (única por transação)
   - Status de Pagamento
   - Data de Vencimento
   - Botão "Marcar como Pago"

2. Criar página `/driver/payments` com:
   - Tabela de corridas + comissões devidas
   - Código de Entidade
   - Referência de Pagamento
   - Status
   - Data de Vencimento
   - Botão "Marcar como Pago"

### **FASE 3: Melhorias da Dashboard Admin (2-3 horas)**
1. Widget de "Comissões Pendentes" (MZN)
2. Relatório de "Provedores com Pagamentos Vencidos"
3. Gráfico de Tendência de Comissões
4. Export de Relatório de Comissões em CSV/PDF

### **FASE 4: Automações (2-3 horas)**
1. Notificações automáticas de vencimento (-1 dia)
2. Alertas para Admin de pagamentos atrasados
3. Auto-reminders cada 3 dias

---

## 🎨 Alternativas & Discussão

### **Option 1: SISTEMA ATUAL (Proposto)**
- Código de Entidade estático por utilizador
- Referência de Pagamento única por transação
- Transferência bancária manual com comprovativo
- Admin aprova depois

**Vantagens:**
✓ Simples de implementar
✓ Funciona com qualquer banco
✓ Usuário tem controlo total
✓ Fácil auditoria

**Desvantagens:**
✗ Requer manual do utilizador (transferência)
✗ Pode ter atrasos
✗ Requer comprovativo

---

### **Option 2: INTEGRAÇÃO COM PAYMENT GATEWAY**
- Usar Stripe, PayPal, ou Mpesa direto
- Desconto automático da comissão
- Usuário vê em tempo real

**Vantagens:**
✓ Automático
✓ Instantâneo
✓ Menos fraude

**Desvantagens:**
✗ Mais complexo de integrar
✗ Custos adicionais
✗ Dependência de API
✗ Requer mais tempo

---

### **Option 3: GERAÇÃO DE BOLETOS/FATURAS**
- Gerar boleto ou fatura automática
- Usuário imprime e paga
- Sistema valida comprovativo

**Vantagens:**
✓ Profissional
✓ Auditável
✓ Documentação clara

**Desvantagens:**
✗ Mais complexo
✗ Requer integração com provedores
✗ Mais passos para usuário

---

### **Option 4: PIX (Se Brasil/PT)**
- Integrar PIX para pagamentos instantâneos
- QR Code dinâmico com referência
- Confirmação automática

**Vantagens:**
✓ Muito rápido
✓ Sem custos
✓ Popular

**Desvantagens:**
✗ Só funciona em Brasil/Portugal (nem sempre)
✗ Requer API de banco

---

## 📋 **Gestão de Documentos de Usuários (Novo)**

### **Fluxo de Documentos**

```
1. USUÁRIO ATIVA CAPABILITY (Ex: "Quero ser Motorista")
   ↓
2. SISTEMA PEDE DOCUMENTOS OBRIGATÓRIOS:
   - Para Motorista: CNH, Comprovante de Residência, Foto 3x4
   - Para Hotel: Cartório Registro, RNC, Foto do Estabelecimento
   ↓
3. USUÁRIO UPLOAD DOCUMENTOS:
   - A cada upload: DATA + VERSÃO registrada
   - Exemplo: CNH v1 (25/02/2026), CNH v2 (26/02/2026)
   - Histórico COMPLETO mantido
   ↓
4. ADMIN REVISA (/admin/documents):
   - Vê TODOS os documentos (antigos + novos)
   - Visualiza cada versão com data
   - Aprova ou Rejeita com motivo
   ↓
5. SE APROVADO:
   - Status: ✅ VERIFICADO
   - Data: 26/02/2026
   - Admin pode ainda ver histórico (todas as versões anteriores)
   ↓
6. SE USUÁRIO ATUALIZA DOCUMENTOS DEPOIS:
   - Upload nova versão
   - Admin recebe notificação
   - Pode revisar nova versão mantendo histórico anterior
   - Sistema guarda TODAS as versões com datas
```

### **Banco de Dados - Tabela userDocuments (Nova)**

```sql
CREATE TABLE user_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  document_type VARCHAR (CNH, CARTORIO, RNC, RESIDENCIA, SELFIE, etc),
  file_url VARCHAR,
  file_name VARCHAR,
  status VARCHAR ('pending', 'verified', 'rejected', 'resubmitted'),
  uploaded_at TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  rejection_reason VARCHAR,
  version INT (1, 2, 3...) ← IMPORTANTE!
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

Exemplo:
- user: edsondaniel8@gmail.com
  * CNH v1: pending → verified (25/02/2026)
  * CNH v2: uploaded (26/02/2026, atualização simples)
  * CNH v3: pending (27/02/2026, reenvio solicitado)
  ← Admin vê TODAS as versões com datas!
```

### **Dashboard Admin - Documentos**

```
URL: /admin/documents

VISUALIZAÇÃO:
┌──────────────────────────────────────────────────┐
│ Pesquisar: [edsondaniel8@gmail.com]              │
└──────────────────────────────────────────────────┘

USUÁRIO SELECIONADO:
├─ Nome: Edson Daniel
├─ Email: edsondaniel8@gmail.com
├─ Capabilities: 🚗 Motorista ✅ | 🏨 Hotel ✅
│
└─ DOCUMENTOS (Histórico Completo):
   
   📋 CNH - Carteira de Motorista
   ├─ v1: uploaded 25/02/2026 14:20
   │  └─ Status: ✅ VERIFICADO em 25/02/2026 16:00 por Admin
   │  └─ [Visualizar] [Download] [Histórico]
   │
   ├─ v2: uploaded 26/02/2026 10:15
   │  └─ Status: ✅ VERIFICADO em 26/02/2026 11:00 por Admin
   │  └─ Nota: "Mais clara que v1"
   │  └─ [Visualizar] [Download] [Histórico]
   │
   └─ v3: uploaded 27/02/2026 09:30
      └─ Status: ⏳ PENDENTE
      └─ [Visualizar] [Download] [Aprovar] [Rejeitar + Motivo]

   📋 Comprovante de Residência
   ├─ v1: uploaded 25/02/2026 14:25
   │  └─ Status: ❌ REJEITADO em 25/02/2026 16:10
   │  └─ Motivo: "Documento muito escuro, não conseguimos ler"
   │  └─ [Visualizar] [Download]
   │
   └─ v2: uploaded 27/02/2026 08:50
      └─ Status: ⏳ PENDENTE
      └─ [Visualizar] [Download] [Aprovar] [Rejeitar + Motivo]

   📷 Foto 3x4
   └─ v1: uploaded 25/02/2026 14:30
      └─ Status: ✅ VERIFICADO em 25/02/2026 16:15 por Admin
      └─ [Visualizar] [Download]
```

### **Funcionalidades**

✅ ADMIN PODE:
- Visualizar todos os documentos
- Ver todas as versões com datas
- Aprovar individualmente
- Rejeitar com motivo (notifica usuário)
- Download dos arquivos
- Histórico completo para auditoria

✅ USUÁRIO VÊ:
- Status de cada documento
- Motivo de rejeição
- Poder fazer resubmissão
- Histórico de uploads (versões)

✅ SISTEMA REGISTRA:
- Data de upload
- Data de verificação
- Quem verificou (Admin)
- Versão do documento
- Motivo de rejeição
- Todos os cambios

---

## 🚀 **PACOTE DE IMPLEMENTAÇÃO COMPLETO**

### **FASE 1: Correcções Imediatas (1 hora)**
✅ Nomes de campos em camelCase no backend
✅ Lógica de isVerified baseada em capabilities
✅ Entidade e Referência personalizadas por provedor

### **FASE 2: Endpoints de Payment References (2 horas)**
🔄 GET `/api/provider/payments` - Lista de comissões
🔄 GET `/api/provider/payments/:referenceId` - Detalhe da comissão
🔄 POST `/api/provider/payments/:referenceId/mark-paid` - Marcar como pago manualmente
🔄 POST `/api/provider/payments/:referenceId/upload-proof` - Upload de comprovativo
🔄 GET `/api/admin/payments/by-entity` - Admin vê pagamentos por entidade do provedor

### **FASE 3: Endpoints de Documentos (1.5 horas)**
🔄 GET `/api/provider/documents` - Meus documentos (usuário vê seus docs)
🔄 POST `/api/provider/documents/upload` - Enviar novo documento
🔄 GET `/api/admin/documents` - Admin vê todos os documentos de todos os usuários
🔄 POST `/api/admin/documents/:docId/approve` - Aprovar documento
🔄 POST `/api/admin/documents/:docId/reject` - Rejeitar documento com motivo
🔄 GET `/api/admin/documents/:userId/versions` - Ver histórico de todas as versões

### **FASE 4: Frontend - Provider Dashboard (2.5 horas)**
🔄 `/provider/payments` - Tabela moderna de comissões por reserva
🔄 `/provider/document-upload` - Enviar documentos quando ativa capability
🔄 `/provider/documents` - Ver meus documentos e status
🔄 Notificações de vencimento (email + in-app)
🔄 Opções de pagamento (Manual / Automático / Boleto)

### **FASE 5: Frontend - Admin Dashboard (2.5 horas)**
🔄 `/admin/documents` - Revisa documentos com histórico completo
🔄 `/admin/payments-by-entity` - Pagamentos por entidade do provedor
🔄 `/admin/payments-overdue` - Alertas de vencimento
🔄 Relatório de provedores com pagamentos pendentes
🔄 Download de comprovativas

### **FASE 6: Testes & Validações (1 hora)**
🔄 Testar fluxo completo de comissões
🔄 Validar cálculos de datas (7 dias)
🔄 Testar upload e armazenamento de documentos
🔄 Validar notificações
🔄 Testes de segurança e permissões

---

## ⏱️ **CRONOGRAMA REALISTA**

```
TOTAL: ~11-13 horas de desenvolvimento

Opção 1: TEMPO COMPLETO
- 1 dia full-stack (8-10 horas + QA)
- Entrega: Amanhã + testes

Opção 2: EM ETAPAS
- Dia 1: Fases 1-2 (3 horas)
- Dia 2: Fases 3-4 (4.5 horas)
- Dia 3: Fase 5-6 (3-4 horas)
- Entrega: 3 dias

Opção 3: PRIORIZZADA
- Semana 1: Fases 1-3 (4.5 horas) → Documentos funcionando
- Semana 2: Fases 4-5 (5 horas) → Dashboards dos provedores
- Semana 3: Fase 6 (1 hora) → QA e Deploy
```

---

## ❓ PERGUNTAS PARA DISCUSSÃO

1. **Entidade e Referência:**
   - ✅ Entidade = Código único do provedor (ex: HOTEL-007) ← CONFIRMADO
   - ✅ Referência = Única por transação (ex: LINKA-2026-0025-001) ← CONFIRMADO
   - ✅ Admin identifica "quem pagou" pela entidade ← CONFIRMADO

2. **Data de Vencimento:**
   - ✅ 7 dias após checkout da reserva ← CONFIRMADO
   - ✅ Por vencimento individual por reserva ← CONFIRMADO
   - Alerta de vencimento: Deve ser -1 dia? -3 dias? Ou quando passa vencimento?

3. **Documentos de Usuários:**
   - ✅ Upload obrigatório ao ativar capability ← CONFIRMADO
   - ✅ Admin vê TODOS os documentos, mesmo após verificados ← CONFIRMADO
   - ✅ Histórico completo com versões e datas ← CONFIRMADO
   - Precisamos de cloud storage (S3/Firebase) ou armazenar localmente?

4. **Sistema de Pagamentos Híbrido:**
   - Opção 1: MANUAL (Transfer + Comprovativo) ← Vamos com isto!
   - Opção 2: AUTOMÁTICO (Integração Mpesa/Bank) ← Para depois
   - Opção 3: BOLETO/FATURA (PDF) ← Implementar agora?
   - Qual das 3 vamos implementar PRIMEIRO?

5. **Notificações:**
   - Email quando vencimento se aproxima?
   - In-app notifications?
   - SMS?
   - Tudo?

---

## 🎯 **RECOMENDAÇÃO FINAL ATUALIZADA**

**Vamos com SISTEMA HÍBRIDO MODERNO:**

### ✅ Implementar Agora (TOP PRIORITY):
1. Entidade única + Referência única por transação
2. Data de vencimento (7 dias)
3. Documentos com histórico completo
4. Pagamento MANUAL sim comprovativo
5. Tabela moderna de comissões para provedor

### 🔄 Implementar Depois (FASE 2):
1. Pagamento automático (Mpesa/Bank)
2. Geração de boleto/fatura em PDF
3. Notificações por email
4. Alertas de vencimento automáticos
5. Export de relatórios

### 🚀 Começar Implementação?

**Se confirmares que quer:**
1. Entidade + Referência personalizadas ✓
2. Datas de vencimento de 7 dias ✓
3. Documentos com histórico na admin ✓
4. Pagamento manual com comprovativo ✓
5. Tabelas modernas para provedores ✓

**Então vou começar AGORA com:**
- FASE 1: Correcções nos campos (30 min)
- FASE 2: Endpoints de pagamentos (2 horas)
- FASE 3: Endpoints de documentos (1.5 horas)
- FASE 4-5: Frontend (5 horas)
- TOTAL: ~9 horas

**Conseguimos até amanhã! ⚡**

---

**PRÓXIMO PASSO:**
Confirma que quer isto tudo assim e começamos a código agora? 🚀


