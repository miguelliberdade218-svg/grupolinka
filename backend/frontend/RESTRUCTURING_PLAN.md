# 🏗️ PLANO DE REORGANIZAÇÃO DO FRONTEND - Link-A App

## 📋 ESTRUTURA PROPOSTA

```
src/
├── apps/
│   ├── main-app/                      # App principal para usuários (clientes)
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   │
│   ├── drivers-app/                   # App para drivers (MANTER COMO ESTÁ ✅)
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.tsx
│   │
│   ├── hotels-app/                    # 🆕 CENTRALIZADO - Hotels + Events
│   │   ├── pages/
│   │   │   ├── hotel-management/
│   │   │   │   └── HotelManagerDashboard.tsx
│   │   │   ├── HotelCreationPage.tsx
│   │   │   ├── HotelSettingsPage.tsx
│   │   │   └── HotelDetailsPage.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── room-types/
│   │   │   │   ├── RoomTypesManagement.tsx  # ✅ Integrado com API real
│   │   │   │   ├── RoomTypeForm.tsx
│   │   │   │   └── RoomTypeCard.tsx
│   │   │   │
│   │   │   ├── event-spaces/
│   │   │   │   ├── EventSpacesManagement.tsx # ✅ Integrado com API real
│   │   │   │   ├── EventSpaceForm.tsx
│   │   │   │   └── EventSpaceCard.tsx
│   │   │   │
│   │   │   ├── bookings/
│   │   │   │   ├── BookingsManagement.tsx
│   │   │   │   ├── BookingsList.tsx
│   │   │   │   └── BookingDetails.tsx
│   │   │   │
│   │   │   ├── promotions/
│   │   │   │   ├── PromotionsManagement.tsx
│   │   │   │   ├── PromotionForm.tsx
│   │   │   │   └── PromotionCard.tsx
│   │   │   │
│   │   │   ├── reviews/
│   │   │   │   ├── ReviewsList.tsx
│   │   │   │   └── ReviewResponse.tsx
│   │   │   │
│   │   │   └── HotelsHeader.tsx         # Header atualizado
│   │   │
│   │   ├── App.tsx                    # App hotels-app
│   │   └── routes.tsx
│   │
│   └── admin-app/                     # Admin app (PARA GERENCIAMENTO DA APP)
│       ├── pages/
│       │   ├── dashboard.tsx
│       │   ├── users.tsx
│       │   ├── analytics.tsx
│       │   └── settings.tsx
│       │
│       ├── components/
│       │   ├── AdminHeader.tsx
│       │   └── AdminNav.tsx
│       │
│       ├── App.tsx
│       └── routes.tsx
│
├── services/                          # 🆕 Serviços atualizados
│   ├── hotelService.ts               # ✅ NOVO - Integração com API hotéis
│   ├── eventSpaceService.ts          # ✅ NOVO - Integração com API eventos
│   ├── api.ts                        # Cliente HTTP
│   ├── roomTypeService.ts            # Mantém-se compatível
│   ├── locationsService.ts           # Mantém-se
│   └── mockApi.ts                    # DEPRECAR em breve
│
└── shared/                            # Componentes compartilhados (MANTER)
    ├── components/
    ├── admin/
    ├── hooks/
    └── utils/
```

## 🎯 PRIORIDADES & STATUS

### ✅ FASE 1: ESTRUTURA & SERVIÇOS (COMPLETO)
- [x] Criar `hotelService.ts` com integração completa
- [x] Criar `eventSpaceService.ts` com integração completa
- [x] Criar estrutura de pastas em hotels-app
- [x] Atualizar `RoomTypesManagement.tsx` com API real
- [x] Atualizar `EventSpacesManagement.tsx` com API real
- [x] Criar `HotelManagerDashboard.tsx` novo

### ⏳ FASE 2: COMPONENTES ADICIONAIS (PRÓXIMO)
- [ ] Criar `RoomTypeForm.tsx` (criar/editar)
- [ ] Criar `EventSpaceForm.tsx` (criar/editar)
- [ ] Criar `BookingsManagement.tsx` integrado
- [ ] Criar `PromotionsManagement.tsx` integrado
- [ ] Criar componentes de Reviews

### ⏳ FASE 3: INTEGRAÇÃO (DEPOIS)
- [ ] Atualizar imports em hotels-app
- [ ] Remover componentes antigos do admin-app
- [ ] Testar fluxos completos
- [ ] Integrar com pagamentos
- [ ] Adicionar notificações

### ⏳ FASE 4: POLIMENTO (FINAL)
- [ ] Adicionar validações cliente
- [ ] Melhorar UX/UI
- [ ] Otimizar performance
- [ ] Testes unitários

## 📦 ENDPOINTS DO BACKEND IMPLEMENTADOS

### Hotéis
```
GET    /api/v2/hotels                              - Buscar hotéis
GET    /api/v2/hotels/:id                          - Obter hotel
POST   /api/v2/hotels                              - Criar hotel
PUT    /api/v2/hotels/:id                          - Atualizar hotel
GET    /api/v2/hotels/:id/dashboard                - Dashboard do hotel
GET    /api/v2/hotels/:id/room-types               - Listar room types
POST   /api/v2/hotels/:id/room-types               - Criar room type
PUT    /api/v2/hotels/:id/room-types/:roomTypeId   - Atualizar room type
DELETE /api/v2/hotels/:id/room-types/:roomTypeId   - Deletar room type
GET    /api/v2/hotels/:id/bookings                 - Listar reservas
POST   /api/v2/hotels/:id/bookings                 - Criar reserva
GET    /api/v2/hotels/:id/promotions               - Listar promoções
POST   /api/v2/hotels/:id/promotions               - Criar promoção
GET    /api/v2/hotels/:id/reviews                  - Listar reviews
GET    /api/v2/hotels/:id/reviews/stats            - Estatísticas de reviews
```

### Espaços de Eventos
```
GET    /api/v2/events/spaces                       - Buscar espaços
GET    /api/v2/events/spaces/:id                   - Obter espaço
POST   /api/v2/events/spaces                       - Criar espaço
PUT    /api/v2/events/spaces/:id                   - Atualizar espaço
DELETE /api/v2/events/spaces/:id                   - Deletar espaço
GET    /api/v2/events/hotel/:hotelId/spaces        - Espaços do hotel
GET    /api/v2/events/spaces/:id/bookings          - Reservas do espaço
POST   /api/v2/events/spaces/:id/bookings          - Criar reserva
GET    /api/v2/events/bookings/:bookingId          - Detalhes da reserva
POST   /api/v2/events/bookings/:bookingId/confirm  - Confirmar
POST   /api/v2/events/bookings/:bookingId/reject   - Rejeitar
POST   /api/v2/events/bookings/:bookingId/cancel   - Cancelar
GET    /api/v2/events/spaces/:id/reviews           - Listar reviews
GET    /api/v2/events/spaces/:id/reviews/stats     - Estatísticas de reviews
```

## 🔄 PADRÃO DE USO DOS SERVIÇOS

### Exemplo: RoomTypesManagement.tsx
```tsx
import { hotelService } from '@/services/hotelService';

// Carregar dados
const response = await hotelService.getRoomTypesByHotel(hotelId);
if (response.success) {
  setRoomTypes(response.data);
} else {
  setError(response.error);
}

// Criar
const result = await hotelService.createRoomType(hotelId, roomData);

// Atualizar
const result = await hotelService.updateRoomType(hotelId, roomTypeId, updates);

// Deletar
const result = await hotelService.deleteRoomType(hotelId, roomTypeId);
```

## 🚀 PRÓXIMOS PASSOS

1. **Completar FASE 2** - Criar formulários para CRUD
2. **Testar endpoints** - Validar conexão com backend
3. **Integrar autenticação** - Verificar tokens
4. **Adicionar loading states** - UX melhorada
5. **Validações** - Usar Zod ou similar
6. **Tratamento de erros** - Toast notifications

## 📌 NOTAS IMPORTANTES

- ✅ Services retornam sempre `{ success, data, error }`
- ✅ API é chamada apenas uma vez ao montar componentes
- ✅ Erros são tratados e mostrados ao usuário
- ✅ Loading states implementados
- ✅ Compatível com TypeScript
- ✅ Reutilizável em toda aplicação

## 🔗 DEPENDÊNCIAS

```json
{
  "@tanstack/react-query": "^5.60.5",    // Cache e sincronização
  "zod": "^3.x.x",                       // Validação
  "@hookform/resolvers": "^3.10.0",      // Forms
  "lucide-react": "latest"               // Ícones
}
```

---

**Status**: ✅ **ESTRUTURA COMPLETA**
**Última Atualização**: 18 Janeiro 2026
**Próximo Marco**: Implementar formulários (FASE 2)
