# 🔄 Auditoria de Compatibilidade Frontend ↔ Backend

## 📊 Status Atual da Compatibilidade

### ✅ **Endpoints Funcionais (Implementados em ambos)**

| Endpoint Frontend | Endpoint Backend | Status | Notas |
|-------------------|------------------|--------|-------|
| `POST /api/bookings/create` | ✅ `backend/routes/bookings.ts` | ✅ Compatível | Schema validado |
| `GET /api/bookings/user` | ✅ `backend/routes/bookings.ts` | ✅ Compatível | Autenticação OK |
| `GET /api/rides-simple/search` | ✅ `backend/routes/drizzle-api.ts` | ✅ Compatível | Query params OK |
| `POST /api/rides-simple/create` | ✅ `backend/routes/drizzle-api.ts` | ✅ Compatível | Schema validado |
| `GET /api/admin/stats` | ✅ `backend/routes/index.ts` | ✅ Compatível | Dados mock OK |
| `GET /api/health` | ✅ `backend/routes/shared/health.ts` | ✅ Compatível | Sistema OK |

### ⚠️ **Endpoints Não Implementados no Backend**

| Endpoint Frontend | Status Backend | Prioridade | Ação Necessária |
|-------------------|----------------|------------|-----------------|
| `GET /api/auth/profile` | ❌ Falta | Alta | Implementar em `auth.ts` |
| `PUT /api/auth/profile` | ❌ Falta | Alta | Implementar em `auth.ts` |
| `GET /api/accommodations/search` | ❌ Falta | Alta | Criar rota dedicada |
| `POST /api/accommodations/create` | ❌ Falta | Média | Para hotels app |
| `GET /api/offers/featured` | ❌ Falta | Média | Criar sistema de ofertas |
| `POST /api/partnerships/create` | ❌ Falta | Baixa | Para parcerias |
| `GET /api/partnerships/requests` | ❌ Falta | Baixa | Para parcerias |
| `GET /api/events` | ❌ Falta | Baixa | Para eventos |
| `POST /api/events/create` | ❌ Falta | Baixa | Para eventos |
| `GET /api/chat/rooms` | ✅ Existe | Baixa | Em `chat.ts` |
| `GET /api/chat/messages/:roomId` | ✅ Existe | Baixa | Em `chat.ts` |
| `POST /api/chat/messages/:roomId` | ✅ Existe | Baixa | Em `chat.ts` |

### 🔍 **Dados Mock Detectados**

| Componente | Localização | Deve Conectar API? |
|------------|-------------|-------------------|
| `FeaturedOffers` | `frontend/src/apps/main-app/components/FeaturedOffers.tsx` | ✅ Sim - criar `/api/offers/featured` |
| `DriversHome` | `frontend/src/apps/drivers-app/pages/home.tsx` | ✅ Sim - usar `/api/rides-simple` |
| `HotelsHome` | `frontend/src/apps/hotels-app/pages/home.tsx` | ✅ Sim - criar `/api/accommodations` |
| `AdminHome` | `frontend/src/apps/admin-app/pages/home.tsx` | ✅ Sim - expandir `/api/admin/*` |

## 🚀 **Plano de Sincronização**

### **Fase 1: Endpoints Críticos (Prioridade Alta)**
1. **Auth Profile API** - Implementar perfil do utilizador
2. **Accommodations API** - Para hotels app funcionar
3. **Featured Offers API** - Para ofertas dinâmicas

### **Fase 2: Funcionalidades Avançadas (Prioridade Média)**
4. **Partnerships API** - Para parcerias entre motoristas/hotéis
5. **Events API** - Para sistema de eventos

### **Fase 3: Expansões (Prioridade Baixa)**
6. **Admin APIs expandidas** - Gestão completa
7. **Chat APIs** - Já existem, mas podem ser melhoradas

## 📝 **Schemas de Dados para Sincronizar**

### **User Profile Schema**
```typescript
// Frontend espera:
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles: string[];
  isVerified: boolean;
}

// Backend deve retornar este formato em /api/auth/profile
```

### **Accommodation Schema**
```typescript
// Frontend espera:
interface Accommodation {
  id: string;
  name: string;
  type: string;
  pricePerNight: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  address: string;
}

// Backend deve implementar em /api/accommodations/*
```

### **Featured Offers Schema**
```typescript
// Frontend espera:
interface FeaturedOffer {
  id: string;
  type: 'ride' | 'accommodation';
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  location: string;
  rating: number;
  validUntil: string;
  provider: string;
}

// Backend deve implementar em /api/offers/featured
```

## 🔧 **Scripts de Verificação**

### **Script de Teste de Endpoints**
```bash
# Para testar endpoints no seu backend local:
curl -X GET "http://localhost:3001/api/health"
curl -X GET "http://localhost:3001/api/admin/stats"
curl -X GET "http://localhost:3001/api/rides-simple/search?from=Maputo&to=Beira"

# Endpoints que devem falhar (não implementados):
curl -X GET "http://localhost:3001/api/auth/profile"
curl -X GET "http://localhost:3001/api/accommodations/search"
curl -X GET "http://localhost:3001/api/offers/featured"
```

## 📋 **Checklist de Compatibilidade**

### ✅ **Já Validado**
- [x] Sistema de autenticação Firebase
- [x] API de bookings completa
- [x] Busca de rides funcional
- [x] Criação de rides funcional
- [x] Stats do admin básico

### 🔄 **Para Implementar Localmente**
- [ ] User profile endpoints
- [ ] Accommodations CRUD
- [ ] Featured offers system
- [ ] Partnerships system
- [ ] Events system
- [ ] Admin endpoints expandidos

## 🎯 **Próximos Passos Recomendados**

1. **Implementar endpoints em falta** (auth/profile, accommodations)
2. **Substituir dados mock** por chamadas reais à API
3. **Validar schemas** entre frontend/backend
4. **Criar testes automatizados** de compatibilidade
5. **Documentar contratos** de API claramente

Esta auditoria garante que ambas as partes (Replit + local) fiquem sincronizadas! 🔄