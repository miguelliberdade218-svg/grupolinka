# ✅ CHECKLIST FINAL - TUDO QUE FAZER

## 🎯 RESUMO: O QUE JÁ FOI FEITO

✅ **SQL** - Ficheiro criado: `SQL_TODAS_TABELAS_CRIAR_BANCO.sql`
- 9 tabelas novas
- 3 triggers automáticos
- Colunas adicionadas às tabelas existentes

✅ **Backend Services** - Ficheiros criados:
- `backend/src/modules/reviews/rideReviewService.ts` ✅
- `backend/src/modules/payments/paymentPolicyService.ts` ✅
- `backend/src/jobs/autoConfirmBookingsJob.ts` ✅

✅ **Documentação**:
- `IMPLEMENTACAO_COMPLETA_TODOS_PROBLEMAS.md` - Guia completo
- `BACKEND_ROTAS_INSTRUCOES.md` - Como adicionar rotas

---

## 📋 CHECKLIST: O QUE VOCÊ PRECISA FAZER

### PASSO 1: BANCO DE DADOS (15 ministos)

**Ficheiro:** `SQL_TODAS_TABELAS_CRIAR_BANCO.sql`

```
✅ Abrir pgAdmin
✅ Conectar na base "linka2" (ou a sua base)
✅ Abrir SQL Editor
✅ Copiar TUDO do ficheiro SQL_TODAS_TABELAS_CRIAR_BANCO.sql
✅ Colar e executar
✅ Verificar que não há erros (deve aparecer "Sucesso" no final)
```

**Resultado esperado:**
```
✅ ride_reviews criada
✅ ride_passenger_reviews criada
✅ hotel_guest_reviews criada
✅ booking_state_machine criada
✅ hotel_payment_policies criada
✅ hotel_booking_payment_history criada
✅ driver_payment_policies criada
✅ ride_payment_history criada
✅ eventspace_payment_policies criada
✅ Todas as colunas adicionadas às tabelas existentes
✅ Todos os triggers criados
```

---

### PASSO 2: ADICIONAR ROTAS AO BACKEND (20 minutos)

**Ficheiro:** `BACKEND_ROTAS_INSTRUCOES.md`

```
✅ Criar ficheiro: `backend/api/routes/reviews.ts`
   (Copie o conteúdo inteiro da secção "1️⃣ CRIAR: Ficheiro de Rotas para Reviews")

✅ Criar ficheiro: `backend/api/routes/payments.ts`
   (Copie o conteúdo inteiro da secção "2️⃣ CRIAR: Ficheiro de Rotas para Pagamentos")

✅ Encontrar o ficheiro Express principal (procure por onde `app.use` é usado)
   (Pode ser: server.js, app.js, index.js, ou similar)

✅ Adicionar as imports no topo:
   import reviewsRouter from './api/routes/reviews.ts';
   import paymentsRouter from './api/routes/payments.ts';
   import { autoConfirmBookingsJob } from './src/jobs/autoConfirmBookingsJob.ts';

✅ Registar as rotas:
   app.use('/api', reviewsRouter);
   app.use('/api', paymentsRouter);

✅ Iniciar o job automático:
   setInterval(async () => {
     await autoConfirmBookingsJob.executeAutoConfirmations();
   }, 5 * 60 * 1000);
```

---

### PASSO 3: ATUALIZAR AdminService (10 minutos)

**Ficheiro:** `backend/src/modules/admin/adminService.ts`

```
✅ Abrir o ficheiro adminService.ts

✅ Procurar pelo método `getPaymentStats()` (está por volta da linha 550)

✅ Depois desse método, ADICIONE o novo método `getPaymentsSummary()`
   (Copie inteiro da secção "4️⃣ ATUALIZAR: AdminService - Pagamentos" do BACKEND_ROTAS_INSTRUCOES.md)

✅ Salvar o ficheiro
```

---

### PASSO 4: CRIAR FRONTEND - PAGES (30 minutos)

Estas páginas ainda não existem. Você precisa criar:

#### 4A. Página de Reviews de Ride

**Local:** `frontend/src/apps/rides-app/pages/ride-review.tsx`

Copie inteiro da secção **"🎨 IMPLEMENTAÇÃO DO FRONTEND"** → **"1️⃣ PÁGINA: Deixar Review de Ride"** do ficheiro `IMPLEMENTACAO_COMPLETA_TODOS_PROBLEMAS.md`

```
✅ Criar o ficheiro
✅ Salvar
```

#### 4B. Página de Ver Reviews do Motorista

**Local:** `frontend/src/apps/rides-app/pages/driver-profile-reviews.tsx`

Copie inteiro da secção **"2️⃣ PÁGINA: Ver Reviews de Motorista"** do ficheiro `IMPLEMENTACAO_COMPLETA_TODOS_PROBLEMAS.md`

```
✅ Criar o ficheiro
✅ Salvar
```

#### 4C. Página de Payment Settings - Hotel

**Local:** `frontend/src/apps/hotels-app/pages/payment-settings.tsx`

Copie inteiro do ficheiro `GUIA_RAPIDO_PAGAMENTOS_FLEXIVEIS.md` (secção **"FASE 2"** do frontend)

```
✅ Criar o ficheiro
✅ Salvar
```

#### 4D. Página de Payment Settings - Driver

**Local:** `frontend/src/apps/drivers-app/pages/payment-settings.tsx`

Copie inteiro do ficheiro `GUIA_RAPIDO_PAGAMENTOS_FLEXIVEIS.md` (secção **"FASE 3"** do frontend)

```
✅ Criar o ficheiro
✅ Salvar
```

#### 4E. Atualizar Admin Dashboard - Payments

**Local:** `frontend/src/apps/admin-app/pages/payments.tsx`

Atualize a página de payments com o novo código (veja secção **"5️⃣ UPDATE: Admin Dashboard"** em `IMPLEMENTACAO_COMPLETA_TODOS_PROBLEMAS.md`)

```
✅ Atualizar a página existente
✅ Salvar
```

---

## 🧪 TESTES BÁSICOS

Após fazer tudo acima:

### Teste 1: Reviews de Rides

```
✅ Abrir app de rides
✅ Completar uma viagem
✅ Deixar review do motorista
✅ Verificar que aparece em: /drivers/[driverId]/reviews
✅ Testar resposta do motorista
```

### Teste 2: Payment Settings

```
✅ Abrir hotel app
✅ Ir para "Configurações de Pagamento"
✅ Alterar: advance_payment_percentage = 30%
✅ Clique on "Salvar"
✅ Verificar que foi salvo (fazer refresh)

✅ Abrir driver app
✅ Ir para "Minha Política de Pagamento"
✅ Ativar: advance_payment_enabled = true
✅ Clique em "Salvar"
✅ Verificar que foi salvo
```

### Teste 3: Admin Dashboard

```
✅ Abrir admin app
✅ Ir para "Gestão de Pagamentos"
✅ Deverá mostrar:
   - Receita Total
   - Comissão (12%)
   - Reservas Pendentes
   - Breakdown por tipo
```

### Teste 4: Auto-Confirmação

```
✅ Criar uma viagem com departureDate = hoje
✅ Aguardar 5 minutos (ou forçar job manualmente)
✅ Verificar que a viagem foi auto-completada
```

---

## 📞 ESTRUTURA FINAL

```
backend/
├── SQL_TODAS_TABELAS_CRIAR_BANCO.sql ✅ (EXECUTAR NO BANCO)
├── IMPLEMENTACAO_COMPLETA_TODOS_PROBLEMAS.md ✅ (Referência)
├── BACKEND_ROTAS_INSTRUCOES.md ✅ (Como adicionar rotas)
│
├── src/
│   ├── modules/
│   │   ├── admin/
│   │   │   └── adminService.ts (ATUALIZAR - adicionar getPaymentsSummary)
│   │   ├── reviews/
│   │   │   └── rideReviewService.ts ✅ (CRIAR)
│   │   └── payments/
│   │       └── paymentPolicyService.ts ✅ (CRIAR)
│   │
│   └── jobs/
│       └── autoConfirmBookingsJob.ts ✅ (CRIAR)
│
├── api/
│   └── routes/
│       ├── reviews.ts (CRIAR)
│       └── payments.ts (CRIAR)
│
└── server.js (ATUALIZAR - registar rotas + job)

frontend/
├── src/
│   └── apps/
│       ├── rides-app/
│       │   └── pages/
│       │       ├── ride-review.tsx (CRIAR)
│       │       └── driver-profile-reviews.tsx (CRIAR)
│       │
│       ├── hotels-app/
│       │   └── pages/
│       │       └── payment-settings.tsx (CRIAR)
│       │
│       ├── drivers-app/
│       │   └── pages/
│       │       └── payment-settings.tsx (CRIAR)
│       │
│       └── admin-app/
│           └── pages/
│               └── payments.tsx (ATUALIZAR)
```

---

## ⏱️ TEMPO TOTAL ESTIMADO

- **BD (SQL):** 15 minutos ⏱️
- **Backend Rotas:** 20 minutos ⏱️
- **AdminService:** 10 minutos ⏱️
- **Frontend Pages:** 30 minutos ⏱️
- **Testes:** 15 minutos ⏱️

**TOTAL: ~90 minutos** (1h 30m)

---

## 🚀 PRÓXIMO PASSO

**COMECE AQUI:**
1. Copiar/colar SQL ao banco
2. Criar os ficheiros backend
3. Criar os ficheiros frontend
4. Testes básicos

**DEPOIS (opcional):**
- Deploy a staging
- Testes E2E completos
- Deploy a produção

---

**Última atualização:** 27/02/2026
**Status:** Pronto para implementação
