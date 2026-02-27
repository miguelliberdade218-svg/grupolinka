# ✅ CHECKLIST DE INTEGRAÇÃO - AUTENTICAÇÃO MODERNIZADA

## 📊 Fase 1: Preparação (5 min)

### Base de Dados
- [x] SQL criado e tabelas no DB
  - [x] firebase_uid adicionado a users
  - [x] driver_profiles criada
  - [x] hotel_manager_profiles criada
  - [x] event_space_manager_profiles criada
  - [x] verification_documents criada
  - [x] capability_changes_log criada
- [ ] Verificar se todas as tabelas existem
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname='public' 
  AND tablename IN ('driver_profiles', 'hotel_manager_profiles', ...) 
  ORDER BY tablename;
  ```

---

## 🔧 Fase 2: Backend (30 min)

### Step 1: Copiar Ficheiros Modernizados
- [ ] Fazer backup dos ficheiros antigos
  ```bash
  cp backend/src/shared/firebaseAuth.ts backend/src/shared/firebaseAuth.ts.backup
  cp backend/src/modules/auth/services/authService.ts backend/src/modules/auth/services/authService.ts.backup
  ```

- [ ] Copiar ficheiros novos
  ```bash
  cp backend/src/shared/firebaseAuth_MODERNIZADO.ts → backend/src/shared/firebaseAuth.ts
  cp backend/src/modules/auth/services/authService_MODERNIZADO.ts → backend/src/modules/auth/services/authService.ts
  ```

- [ ] OU: Actualizar imports (se preferir manter filenames)
  ```typescript
  import { firebaseAuth_MODERNIZADO } from '../firebaseAuth_MODERNIZADO';
  ```

### Step 2: Atualizar Routes
- [ ] Ficheiro: `/backend/backend/routes/auth.ts`
- [ ] Importar autService modernizado
  ```typescript
  import { authService } from '../src/modules/auth/services/authService';
  ```

- [ ] Adicionar novos endpoints (copiar do GUIA_INTEGRACAO):
  - [ ] `GET /api/auth/capabilities`
  - [ ] `POST /api/auth/activate-driver`
  - [ ] `POST /api/auth/activate-hotel-manager`
  - [ ] `POST /api/auth/upload-verification-document`

### Step 3: Atualizar Middleware
- [ ] Ficheiro: `/backend/backend/middleware/role-auth.ts`
- [ ] Importar novo firebaseAuth
  ```typescript
  import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
  ```

### Step 4: Compilar e Testar
- [ ] Compilar TypeScript
  ```bash
  npm run build
  # ou
  tsc
  ```

- [ ] Corrigir erros de tipo (se houver)

### Step 5: Testar Backend Endpoints
- [ ] Teste 1: Obter capacidades
  ```bash
  curl -X GET http://localhost:8000/api/auth/capabilities \
    -H "Authorization: Bearer YOUR_TOKEN"
  # Esperado: 200 OK com { success: true, data: {...} }
  ```

- [ ] Teste 2: Sincronização Firebase
  ```bash
  curl -X POST http://localhost:8000/api/auth/sync-firebase \
    -H "Authorization: Bearer YOUR_TOKEN"
  # Esperado: firebase_uid sincronizado
  ```

- [ ] Teste 3: Ativar motorista
  ```bash
  curl -X POST http://localhost:8000/api/auth/activate-driver \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "licenseNumber": "TL123",
      "licenseExpiry": "2027-12-31",
      "vehicleType": "economy",
      "yearsExperience": 2
    }'
  # Esperado: 200 OK com driver_profiles criada
  ```

---

## 🎨 Fase 3: Frontend (25 min)

### Step 1: Adicionar Componente
- [ ] Ficheiro: `/frontend/src/shared/components/SignupFlow.tsx`
- [ ] Componente já criado
- [ ] Verificar imports:
  ```typescript
  import { signUpWithEmail, signInWithGoogle } from '@/shared/lib/firebaseConfig';
  ```

### Step 2: Actualizar Página de Signup
- [ ] Ficheiro: `/frontend/src/pages/signup-unified.tsx`
- [ ] Substituir conteúdo antigo
  ```typescript
  import { SignupFlow } from '@/shared/components/SignupFlow';
  
  export default function SignupUnifiedPage() {
    return (
      <SignupFlow 
        onComplete={() => navigate('/')}
        onCancel={() => navigate(-1)}
      />
    );
  }
  ```

### Step 3: Atualizar Router
- [ ] Ficheiro: `/frontend/src/AppRouter.tsx`
- [ ] Manter rotas:
  - [x] `/signup` → SignupFlow (unificado)
  - [x] `/signup-unified` → SignupFlow (alternativa)
  
- [ ] REMOVER rotas antigas (quando estiver confiante):
  - [ ] `❌ /drivers-signup` (mover para archive)
  - [ ] `❌ /hotels-signup` (mover para archive)
  - [ ] `❌ /signup-client` (se existir, mover para archive)

### Step 4: Testar Frontend
- [ ] Teste 1: Abrir signup
  ```
  http://localhost:5173/signup
  Esperado: SignupFlow com tela de escolher papel
  ```

- [ ] Teste 2: Fluxo cliente
  - [ ] Escolher "Cliente"
  - [ ] Escolher "Google" ou "Email"
  - [ ] Preencher dados básicos
  - [ ] Clicar "Continuar"
  - [ ] Ver confirmação

- [ ] Teste 3: Fluxo motorista
  - [ ] Escolher "Motorista"
  - [ ] Autenticar
  - [ ] Preencher dados básicos
  - [ ] Preencher dados motorista
  - [ ] Upload documentos (se implementado)
  - [ ] Ver confirmação

- [ ] Teste 4: Fluxo hotel
  - [ ] Escolher "Gestor de Hotel"
  - [ ] Autenticar
  - [ ] Preencher dados básicos
  - [ ] Preencher dados de empresa
  - [ ] Upload documentos
  - [ ] Ver confirmação

### Step 5: Atualizar AdminRouteGuard
- [ ] Ficheiro: `/frontend/src/shared/components/AdminRouteGuardEmergency.tsx`
- [ ] Verificar se /api/auth/capabilities retorna corretamente
  ```typescript
  const response = await fetch('/api/auth/capabilities', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  // Agora deve funcionar! (firebase_uid mapeado corretamente)
  ```

- [ ] Testar acesso de admin:
  - [ ] Login como admin (edsondaniel8@gmail.com)
  - [ ] Verificar se AdminRouteGuard NÃO força relogin
  - [ ] Acessar admin dashboard

---

## 🔍 Fase 4: Validação (20 min)

### Testes de Integração
- [ ] Test 1: Criar conta cliente via Google
  - [ ] [ ] Signup completo
  - [ ] [ ] User criado em DB
  - [ ] [ ] firebase_uid sincronizado
  - [ ] [ ] can_book_services = true
  - [ ] [ ] Login automático funciona
  - [ ] [ ] Dashboard acessível

- [ ] Test 2: Criar motorista com email
  - [ ] [ ] Signup email+password
  - [ ] [ ] driver_profiles criada
  - [ ] [ ] can_drive = true (pending)
  - [ ] [ ] Documentos podem ser uploaded
  - [ ] [ ] Admin consegue aprovar

- [ ] Test 3: Criar gestor de hotel
  - [ ] [ ] Mesmo que motorista
  - [ ] [ ] can_manage_hotels = true (pending)
  - [ ] [ ] Pode criar hotéis após aprovação

- [ ] Test 4: Sincronização Firebase
  - [ ] [ ] Login com Firebase
  - [ ] [ ] /api/auth/capabilities retorna dados corretos
  - [ ] [ ] firebase_uid está em users table
  - [ ] [ ] Nenhum erro de token inválido

### Testes de Admin
- [ ] Test 1: Admin consegue ver capacidades
  - [ ] [ ] Login como admin
  - [ ] [ ] /api/auth/capabilities retorna isAdmin=true
  - [ ] [ ] AdminRouteGuard NÃO redireciona

- [ ] Test 2: Admin consegue aprovar capacidades
  - [ ] [ ] Ver lista de drivers pending
  - [ ] [ ] Aprovar driver → driverVerificationStatus=verified
  - [ ] [ ] Driver recebe notificação (se implementado)

- [ ] Test 3: Admin consegue rejeitar capacidades
  - [ ] [ ] Rejeitar com motivo
  - [ ] [ ] Motivo registrado em auditoria

### Testes de Auditoria
- [ ] Verificar capability_changes_log
  - [ ] [ ] Consultar tabela:
    ```sql
    SELECT * FROM capability_changes_log 
    ORDER BY created_at DESC LIMIT 10;
    ```
  - [ ] [ ] Deve ter registros de mudanças

- [ ] Verificar verification_documents
  - [ ] [ ] Documents são registrados
  - [ ] [ ] Status atualizado quando approve/reject

---

## 🐛 Fase 5: Troubleshooting (se necessário)

### Problema: "Token inválido" no AdminRouteGuard
- [ ] Verificar firebase_uid foi sincronizado
  ```sql
  SELECT id, email, firebase_uid, is_admin FROM users 
  WHERE email = 'admin@example.com';
  ```
- [ ] Se NULL, executar sync manual
- [ ] Verificar Firebase Admin SDK inicializa corretamente

### Problema: Erro ao criar user
- [ ] Verificar email não é duplicado
- [ ] Verificar autService importado corretamente
- [ ] Verificar tabelas existem em DB
- [ ] Ver logs do backend

### Problema: driver_profiles não criada
- [ ] Verificar arcuitecture do authService (usuário deve ter ID)
- [ ] Verificar user_id é válido
- [ ] Verificar foreign key constraint

### Problema: Dados não salvam no backend
- [ ] Verificar DATABASE_URL está correto
- [ ] Verificar conexão DB funciona
- [ ] Verificar schema.ts tem tabelas exportadas
- [ ] Verificar db.execute() chamadas


---

## 📋 Fase 6: Limpeza (10 min)

### Depois de Tudo Funcionar Perfeitamente
- [ ] Remover ficheiros `.backup` (opcional)
- [ ] Arquivar pages antigas (drivers-signup.tsx, hotels-signup.tsx)
- [ ] Documentar no README
- [ ] Commit para Git
- [ ] Deploy para staging
- [ ] Deploy para produção

---

## 📊 RESUMO FINAL

| Fase | Tempo Est. | Status |
|------|-----------|--------|
| Preparação DB | 5 min | ✅ COMPLETO |
| Backend | 30 min | ⏳ EMA PROGRESSO |
| Frontend | 25 min | ⏳ EMA PROGRESSO |
| Validação | 20 min | ⏳ EMA PROGRESSO |
| Troubleshooting | 10 min | ⏳ PRONTO |
| Limpeza | 10 min | ⏳ PRONTO |
| **TOTAL** | **~100 min** | **EMA PROGRESSO** |

---

## ✅ QUANDO CONSIDERAR COMPLETO

- [ ] Todas as checkboxes marcadas
- [ ] Todos os testes passam
- [ ] Nenhuma consulta SQL retorna erro
- [ ] AdminRouteGuard funciona sem forçar relogin
- [ ] Novo signup path funciona para Cliente, Motorista e Hotel
- [ ] DB contém dados sincronizados (firebase_uid, documentos, etc)
- [ ] Admin consegue aprovar/rejeitar capacidades
- [ ] Auditoria registra todas as mudanças

---

🎉 **PRONTO PARA COMEÇAR!**

Siga cada etapa na ordem. Se encontrar problemas, verifique o troubleshooting.

**Sucesso! 🚀**
