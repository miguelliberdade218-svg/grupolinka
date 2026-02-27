// ========================================================================
// GUIA COMPLETO DE INTEGRAÇÃO - Autenticação Modernizada (25 Fevereiro 2026)
// ========================================================================

## 📋 FICHEIROS CRIADOS

### Backend
1. **schema.ts** (ATUALIZADO)
   - ✅ Adicionadas 5 novas tabelas:
     - driver_profiles
     - hotel_manager_profiles
     - event_space_manager_profiles
     - verification_documents
     - capability_changes_log

2. **firebaseAuth_MODERNIZADO.ts** (NOVO)
   - ✅ Sincronização Firebase UID → users.firebase_uid
   - ✅ Middleware verifyFirebaseToken melhorado
   - ✅ Suporte a múltiplas capacidades
   - Localização: /backend/backend/src/shared/firebaseAuth_MODERNIZADO.ts

3. **authService_MODERNIZADO.ts** (NOVO)
   - ✅ Gerenciamento de contas
   - ✅ Ativação de capacidades
   - ✅ Upload de documentos
   - ✅ Auditoria de mudanças
   - Localização: /backend/backend/src/modules/auth/services/authService_MODERNIZADO.ts

### Frontend
4. **SignupFlow.tsx** (NOVO)
   - ✅ Componente unificado para signup
   - ✅ Step-by-step wizard com 6 etapas
   - ✅ Suporta Cliente, Motorista e Gestor de Hotel
   - ✅ Integração Firebase + Backend
   - Localização: /frontend/src/shared/components/SignupFlow.tsx

---

## 🔧 PASSOS DE INTEGRAÇÃO

### PASSO 1: Copiar ficheiros novo backend

```bash
# Fazer backup dos ficheiros antigas (opcionais)
cp src/shared/firebaseAuth.ts src/shared/firebaseAuth.ts.backup
cp src/modules/auth/services/authService.ts src/modules/auth/services/authService.ts.backup

# Copiar os ficheiros novos
cp src/shared/firebaseAuth_MODERNIZADO.ts src/shared/firebaseAuth.ts
cp src/modules/auth/services/authService_MODERNIZADO.ts src/modules/auth/services/authService.ts

# OU apenas actualizar os imports nos routes se preferir manter filenames
```

### PASSO 2: Actualizar imports nos routes

**Ficheiro: /backend/backend/routes/auth.ts**

```typescript
// REMOVER ESTA LINHA:
// import { verifyFirebaseToken } from '../src/shared/firebaseAuth';

// ADICIONAR ESTÁ:
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';  // Agora aponta ao ficheiro modernizado
import { authService } from '../src/modules/auth/services/authService';

// REMOVER/SUBSTITUIR endpoints antigos (drivers-only, hotels-only)
// JÁ NÃO SÃO NECESSÁRIOS - usar apenas SignupFlow unificado
```

### PASSO 3: Adicionar novo endpoint de capacidades

**Ficheiro: /backend/backend/routes/auth.ts** (ADICIONAR)

```typescript
// ✅ Novo endpoint unificado para capacidades
router.get('/capabilities', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    const capabilities = await authService.getCapabilities(userId);
    
    res.json(createApiResponse(capabilities, 'Capacidades obtidas'));
  } catch (error) {
    console.error('Erro ao obter capacidades:', error);
    res.status(500).json(createApiError('Erro interno', 'INTERNAL_ERROR'));
  }
});

// ✅ Endpoint para ativar capacidade de motorista
router.post('/activate-driver', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { licenseNumber, licenseExpiry, vehicleType, yearsExperience } = req.body;

    const profile = await authService.activateDriverCapability({
      userId: authReq.user.id,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      yearsExperience,
    });

    res.json(createApiResponse(profile, 'Capacidade de motorista ativada'));
  } catch (error) {
    res.status(400).json(createApiError(error instanceof Error ? error.message : 'Erro desconhecido', 'ACTIVATION_ERROR'));
  }
});

// ✅ Endpoint para ativar capacidade de hotel
router.post('/activate-hotel-manager', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { businessTaxId, businessLegalName, businessAddress, businessPhone, businessEmail } = req.body;

    const profile = await authService.activateHotelManagerCapability({
      userId: authReq.user.id,
      businessTaxId,
      businessLegalName,
      businessAddress,
      businessPhone,
      businessEmail,
    });

    res.json(createApiResponse(profile, 'Capacidade de gestor de hotel ativada'));
  } catch (error) {
    res.status(400).json(createApiError(error instanceof Error ? error.message : 'Erro desconhecido', 'ACTIVATION_ERROR'));
  }
});

// ✅ Endpoint para upload de documento de verificação
router.post('/upload-verification-document', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { profileType, documentType, documentUrl, documentNumber, expiryDate } = req.body;

    const doc = await authService.uploadVerificationDocument(
      authReq.user.id,
      profileType,
      documentType,
      documentUrl,
      documentNumber,
      expiryDate
    );

    res.json(createApiResponse(doc, 'Documento registrado para verificação'));
  } catch (error) {
    res.status(400).json(createApiError(error instanceof Error ? error.message : 'Erro desconhecido', 'UPLOAD_ERROR'));
  }
});
```

### PASSO 4: Substituir página de signup no Frontend

**Ficheiro: /frontend/src/pages/signup-unified.tsx** (ACTUALIZAR)

```typescript
import { useState } from 'react';
import { useLocation } from 'wouter';
import { SignupFlow } from '@/shared/components/SignupFlow';

export default function SignupUnifiedPage() {
  const [, setLocation] = useLocation();
  
  const handleComplete = () => {
    setTimeout(() => {
      setLocation('/');
    }, 2000);
  };

  const handleCancel = () => {
    setLocation('/');
  };

  return (
    <SignupFlow 
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
```

### PASSO 5: Atualizar AppRouter para usar novo signup

**Ficheiro: /frontend/src/AppRouter.tsx** (ACTUALIZAR)

```typescript
// Remover rotas antigas
// ❌ DELETE: /drivers-signup
// ❌ DELETE: /hotels-signup
// ❌ DELETE: /signup

// Manter apenas:
// ✅ /signup (que agora usa SignupFlow unificado)
// ou /signup-unified (conforme sua estrutura)
```

### PASSO 6: Atualizar componente AdminRouteGuard

**Ficheiro: /frontend/src/shared/components/AdminRouteGuardEmergency.tsx** (ACTUALIZAR)

```typescript
// A sincronização agora funciona automaticamente no middleware
// O endpoint /api/auth/capabilities retorna capacidades corretas

const response = await fetch('/api/auth/capabilities', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// data.success === true agora é garantido
// data.data.isAdmin === true/false baseado em users.is_admin
if (data.success && data.data.isAdmin) {
  setHasAccess(true);
}
```

---

## ✅ FLUXO DE SIGNUP NOVO

### Cliente (Individual/Empresa)
```
1. Escolher "Cliente"
   ↓
2. Autenticar (Google ou Email)
   ↓
3. Preencher dados básicos
   ↓
4. ✅ Conta criada com can_book_services=true
```

### Motorista
```
1. Escolher "Motorista"
   ↓
2. Autenticar (Google ou Email)
   ↓
3. Preencher dados básicos
   ↓
4. Preencher dados do motorista (carta, veículo)
   ↓
5. Upload de documentos
   ↓
6. ✅ Perfil criado com can_drive=true (pending review)
   ↓
7. Admin aprova → can_drive=verified
```

### Gestor de Hotel
```
Mesmo fluxo que motorista, mas com dados de hotel
```

---

## 🔑 VARIÁVEIS DE AMBIENTE

Nenhuma mudança necessária! Os ficheiros modernizados usam as mesmas variáveis:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- DATABASE_URL

---

## 🧪 TESTES RÁPIDOS

### 1. Testar Sincronização Firebase
```bash
# No backend, executar:
curl -X POST http://localhost:8000/api/auth/sync-firebase \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"

# Resultado esperado: firebase_uid sincronizado com users.firebase_uid
```

### 2. Testar Capacidades
```bash
curl -X GET http://localhost:8000/api/auth/capabilities \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Resultado esperado:
# {
#   "success": true,
#   "data": {
#     "canBookServices": true,
#     "canDrive": false,
#     "canManageHotels": false,
#     "isAdmin": true,
#     "driverVerificationStatus": null,
#     "hotelManagerVerificationStatus": null
#   }
# }
```

### 3. Testar Ativação de Motorista
```bash
curl -X POST http://localhost:8000/api/auth/activate-driver \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseNumber": "TL1234567",
    "licenseExpiry": "2027-12-31",
    "vehicleType": "economy",
    "yearsExperience": 5
  }'
```

---

## 📊 ESTRUTURA DE DADOS

### users table (enhanced)
```sql
firebase_uid VARCHAR(255) UNIQUE  -- ← NOVO! Sincronizado automaticamente
can_book_services BOOLEAN         -- true por default
can_drive BOOLEAN                 -- false, ativado via driver_profiles
can_manage_hotels BOOLEAN         -- false, ativado via hotel_manager_profiles
is_admin BOOLEAN                  -- false, only by admin
```

### driver_profiles (NOVA)
```sql
id UUID PK
user_id TEXT FK → users.id
license_number VARCHAR(50) NOT NULL
license_expiry DATE NOT NULL
vehicle_type VARCHAR(100)
verification_status TEXT (pending|in_review|verified|rejected)
documents JSONB
created_at TIMESTAMP
```

### Mesmo para hotel_manager_profiles, event_space_manager_profiles, etc.

---

## 🎯 BENEFÍCIOS

✅ **Unificado**: 1 fluxo de signup (não 3 formulários diferentes)
✅ **Sincronizado**: Firebase UID mapeado diretamente no banco
✅ **Seguro**: Verificação em 2 camadas (frontend + backend)
✅ **Flexível**: User pode ter múltiplas capacidades
✅ **Profissional**: Dados organizados, auditoria completa
✅ **Escalável**: Pronto para novos tipos de usuários

---

## ⚠️ CUIDADOS

- Não remova as rotas antigas até testar completamente o fluxo novo
- Faça testes com Gmail e email+senha
- Verifique se os documentos são capturados corretamente
- Teste admin approval de capacidades

---

📝 **Ficou com dúvidas? Avise!**
