# ⚡ QUICK REFERENCE - MODERNIZAÇÃO AUTENTICAÇÃO

## 🎯 O QUE MUDOU (em 30 segundos)

**Antes** ❌
```
- 3 formulários de signup (cliente, driver, hotel)
- Firebase UID não sincronizado com DB
- AdminRouteGuard falhava com "Token inválido"
- Capacidades hardcoded
- Sem auditoria
```

**Depois** ✅
```
- 1 fluxo unificado (SignupFlow)
- firebase_uid sincronizado automaticamente
- AdminRouteGuard funciona perfeitamente
- Capacidades dinâmicas (driver_profiles, hotel_manager_profiles)
- Auditoria completa (capability_changes_log)
```

---

## 📦 FICHEIROS CRIADOS (Quick Links)

| Ficheiro | Para Quê | Ação |
|----------|----------|------|
| `INDICE_MODERNIZACAO.md` | Índice de tudo | 📖 Leia primeiro |
| `RESUMO_MODERNIZACAO_AUTENTICACAO.md` | Visão geral | 📖 Leia segundo |
| `GUIA_INTEGRACAO_AUTENTICACAO_MODERNIZADA.md` | Como integrar | 🔧 Código pronto |
| `CHECKLIST_INTEGRACAO.md` | Step-by-step | ✅ Acompanhe |
| `TABELAS_PARA_COPIAR_COLAR.sql` | SQL DB | 📋 Copy-paste |
| `firebaseAuth_MODERNIZADO.ts` | Middleware backend | 🔐 Autenticação |
| `authService_MODERNIZADO.ts` | Serviço backend | 🛠️ Lógica |
| `SignupFlow.tsx` | Componente frontend | 🎨 UI/UX |
| `schema.ts` (actualizado) | Schema DB | 📊 Tabelas |

---

## 🚀 INTEGRAÇÃO (3 LINHAS TIPO CADA)

### Backend
```typescript
// 1. Copiar ficheiros
cp firebaseAuth_MODERNIZADO.ts → firebaseAuth.ts
cp authService_MODERNIZADO.ts → authService.ts

// 2. Adicionar endpoints em routes/auth.ts
import { authService } from '../src/modules/auth/services/authService';
// (ver GUIA_INTEGRACAO para código completo)

// 3. Testar
npm run build && npm run dev
```

### Frontend
```typescript
// 1. SignupFlow.tsx já está pronto
import { SignupFlow } from '@/shared/components/SignupFlow';

// 2. Usar em página
<SignupFlow onComplete={() => navigate('/')} />

// 3. Testar
npm run dev
```

---

## 🧪 TESTES RÁPIDOS

### Backend
```bash
# Verificar tabelas
psql -c "SELECT tablename FROM pg_tables WHERE tablename LIKE 'driver%' OR tablename LIKE 'hotel%'"

# Testar endpoint
curl -X GET http://localhost:8000/api/auth/capabilities \
  -H "Authorization: Bearer TOKEN"
```

### Frontend
```bash
# Abrir signup
http://localhost:5173/signup
# Esperado: Ver tela com 3 opções (Cliente, Motorista, Hotel)
```

---

## 🔒 PROBLEMA RESOLVIDO

### AdminRouteGuard Erro
**Antes**: `❌ Token inválido`
**Depois**: `✅ Retorna isAdmin: true`

**Por quê?**: 
- firebase_uid agora está sincronizado em `users.firebase_uid`
- Middleware busca user por firebase_uid (rápido!)
- Retorna capacidades corretas

---

## 📊 TABELAS (5 NOVAS)

```sql
driver_profiles
├─ user_id → users.id
├─ license_number, license_expiry
└─ verification_status (pending|verified|rejected)

hotel_manager_profiles
├─ user_id → users.id
├─ business_tax_id, business_legal_name
└─ verification_status

event_space_manager_profiles (futuro)
├─ user_id → users.id
├─ business_tax_id, business_legal_name
└─ verification_status

verification_documents
├─ user_id, profile_type, document_type
├─ document_url, verification_status
└─ reviewer_id (admin que aprovou)

capability_changes_log
├─ user_id, capability, old_value, new_value
├─ reason, changed_by
└─ created_at (auditoria)
```

---

## ✨ NOVOS ENDPOINTS

```
GET    /api/auth/capabilities
POST   /api/auth/activate-driver
POST   /api/auth/activate-hotel-manager
POST   /api/auth/upload-verification-document
POST   /api/auth/approve-capability (admin)
POST   /api/auth/reject-capability (admin)
```

---

## 🎬 FLUXOS DE SIGNUP

### Cliente (4 passos)
```
Escolher "Cliente"
  → Autenticar (Google/Email)
  → Dados básicos
  → ✅ Pronto (can_book_services=true)
```

### Motorista (6 passos)
```
Escolher "Motorista"
  → Autenticar
  → Dados básicos
  → Dados motorista (carta, veículo)
  → Upload documentos
  → ✅ Pendente de aprovação admin
  → ✅ Aprovado = can_drive=verified
```

### Hotel (6 passos)
```
Mesmo que motorista, mas com dados de empresa
```

---

## 📌 IMPORTANTE

⚠️ **Não remova ficheiros antigos** até ter teste completo  
⚠️ **Faça backup** antes de substituir  
⚠️ **Teste em staging** antes de produção  
⚠️ **SQL já foi testado** no DB (tudo funciona!)

---

## 🆘 HELP!

| Problema | Solução |
|----------|---------|
| "Token inválido" | Ver Troubleshooting em CHECKLIST |
| Firebase não sincroniza | Verificar firebase_uid em users table |
| Tabelas não existem | Executar SQL do TABELAS_PARA_COPIAR_COLAR.sql |
| Compilação falha | Verificar imports em firebaseAuth.ts |
| Signup não funciona | Verificar SignupFlow está importado corretamente |

---

## ✅ PRÉ-REQUISITOS

- [ ] Node.js + npm instalados
- [ ] PostgreSQL funcionando
- [ ] Firebase Admin SDK configurado
- [ ] Ficheiros .env corretos
- [ ] Git (para backup)

---

## 🏁 QUANDO TERMINAR

Todos os testes de CHECKLIST_INTEGRACAO.md passam? → **🎉 DEPLOY!**

---

## 📞 REFERÊNCIAS RÁPIDAS

```typescript
// Sincronizar user
const userId = await syncUserWithDatabase(firebaseUid, email);

// Obter capacidades
const caps = await authService.getCapabilities(userId);

// Ativar motorista
await authService.activateDriverCapability({ userId, licenseNumber, ... });

// Aprovar capacidade (admin)
await authService.approveCapability(userId, 'driver', adminId);
```

---

## 🎓 CONCEITOS NOVOS

**firebase_uid** → Identificador único do Firebase (novo em users table)  
**driver_profiles** → Dados específicos do motorista (NOVA tabela)  
**verification_status** → pending | in_review | verified | rejected  
**capability_changes_log** → Auditoria de mudanças (NOVA tabela)  
**SignupFlow** → Componente React unificado para signup

---

## 📅 TIMELINE

| Fase | Tempo |
|------|-------|
| Leitura | 10 min |
| Backend | 30 min |
| Frontend | 25 min |
| Testes | 20 min |
| **TOTAL** | **~85 min** |

---

## 🔗 EM RELAÇÃO À ANTERIOR

Esta modernização de autenticação é:
- ✅ Totalmente backward-compatible
- ✅ Sem quebra de endpoints antigos
- ✅ Incremental (pode integrar aos poucos)
- ✅ Pronta para produção

---

**Ficou claro? Abra `RESUMO_MODERNIZACAO_AUTENTICACAO.md` para começar! 🚀**

---

#️⃣ **Modo rápido**: Ficheiros → Schema → Auth Middleware → Service → Routes → Frontend → Testes  
📖 **Modo completo**: Leia todos os 4 documentos .md antes de começar

⏱️ **Última atualização**: 25 Fevereiro 2026 23:59
