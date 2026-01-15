# 🔄 Workflow de Sincronização Frontend ↔ Backend

## 🎯 **Estratégia de Sincronização**

Para manter o frontend (Replit) e backend (local) sempre compatíveis, seguir este fluxo:

## 📋 **1. Antes de Fazer Alterações**

### **Frontend (Replit)**
```bash
# 1. Documentar mudanças pretendidas
echo "Vou adicionar endpoint X para funcionalidade Y" >> CHANGES.md

# 2. Verificar APIs atuais
grep -r "apiService\." frontend/src/apps/
grep -r "api\." frontend/src/

# 3. Listar novos endpoints necessários
```

### **Backend (Local)**
```bash
# 1. Verificar rotas atuais
ls -la backend/routes/
grep -r "app\." backend/routes/

# 2. Documentar endpoints implementados
curl -s http://localhost:3001/api/health
```

## 📝 **2. Documentar Alterações**

### **Template de Mudança**
```markdown
## Mudança: [Nome da funcionalidade]
**Data**: [Data]
**Local**: [Frontend/Backend/Ambos]

### Frontend Changes:
- Endpoint esperado: `GET/POST /api/example`
- Schema esperado: `{ id: string, name: string }`
- Localização: `frontend/src/apps/[app]/[file].tsx`

### Backend Changes:
- Endpoint implementado: `✅/❌ /api/example`
- Schema retornado: `{ id: string, name: string }`
- Localização: `backend/routes/[file].ts`

### Status:
- [ ] Frontend implementado
- [ ] Backend implementado
- [ ] Testado em desenvolvimento
- [ ] Documentação atualizada
```

## 🔄 **3. Processo de Sincronização**

### **Quando Frontend Avança (Replit)**
1. **Documentar** novos endpoints necessários
2. **Usar dados mock** temporariamente
3. **Criar issue** para backend implementar
4. **Testar** com fallbacks quando API falha

### **Quando Backend Avança (Local)**
1. **Documentar** novos endpoints disponíveis
2. **Testar** endpoints com curl/Postman
3. **Criar issue** para frontend consumir
4. **Versionar** mudanças na API

## 🧪 **4. Testes de Compatibilidade**

### **Script de Verificação**
```bash
#!/bin/bash
# test-compatibility.sh

echo "🔍 Testando compatibilidade Frontend ↔ Backend"

# URLs do backend
BACKEND_URL="http://localhost:3001"  # Local
# BACKEND_URL="https://link-amzapp-production.up.railway.app"  # Produção

# Testar endpoints críticos
echo "✅ Testing health..."
curl -s "$BACKEND_URL/api/health" | jq .

echo "✅ Testing admin stats..."
curl -s "$BACKEND_URL/api/admin/stats" | jq .

echo "✅ Testing rides search..."
curl -s "$BACKEND_URL/api/rides-simple/search?from=Maputo&to=Beira" | jq .

# Testar endpoints que podem falhar
echo "⚠️ Testing user profile..."
curl -s "$BACKEND_URL/api/auth/profile" || echo "❌ Not implemented"

echo "⚠️ Testing accommodations..."
curl -s "$BACKEND_URL/api/accommodations/search" || echo "❌ Not implemented"

echo "⚠️ Testing featured offers..."
curl -s "$BACKEND_URL/api/offers/featured" || echo "❌ Not implemented"

echo "🎯 Compatibility test completed!"
```

## 📋 **5. Checklist de Sincronização**

### **Antes de Cada Deploy**
- [ ] Todas as APIs do frontend têm backend correspondente
- [ ] Schemas de dados coincidem
- [ ] Testes de compatibilidade passam
- [ ] Documentação atualizada
- [ ] Variáveis de ambiente configuradas

### **Workflow Recomendado**
```
1. Frontend faz mudança → 
2. Documenta endpoint necessário → 
3. Usa mock data temporariamente → 
4. Backend implementa endpoint → 
5. Frontend conecta API real → 
6. Ambos testados juntos → 
7. Deploy sincronizado
```

## 🔧 **6. Ferramentas de Sincronização**

### **API Contract Testing**
```typescript
// contract-tests.ts
interface ApiContract {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestSchema?: object;
  responseSchema: object;
  implemented: boolean;
}

const API_CONTRACTS: ApiContract[] = [
  {
    endpoint: '/api/bookings/create',
    method: 'POST',
    requestSchema: { /* BookingRequest */ },
    responseSchema: { /* BookingResponse */ },
    implemented: true
  },
  {
    endpoint: '/api/auth/profile',
    method: 'GET',
    responseSchema: { /* UserProfile */ },
    implemented: false  // ← Precisa implementar!
  }
];
```

### **Environment Sync**
```bash
# .env.development
VITE_API_URL=http://localhost:3001

# .env.production  
VITE_API_URL=https://link-amzapp-production.up.railway.app

# .env.staging (para testes)
VITE_API_URL=https://link-amzapp-staging.up.railway.app
```

## 🎯 **7. Comunicação Entre Ambientes**

### **Estado Atual**
```
Frontend (Replit):
├── ✅ Componentes especializados criados
├── ✅ API service centralizado
├── ⚠️ Alguns endpoints usando mock data
└── 🔄 Aguarda endpoints do backend

Backend (Local):
├── ✅ Endpoints básicos funcionais
├── ✅ Sistema de bookings completo
├── ⚠️ Alguns endpoints em falta
└── 🔄 Aguarda sincronização
```

### **Plano de Sincronização**
1. **Implementar endpoints críticos** no backend local
2. **Atualizar frontend** para usar APIs reais
3. **Testar compatibilidade** end-to-end
4. **Deploy coordenado** de ambas as partes

Este workflow garante que nunca tenhamos incompatibilidades! 🚀