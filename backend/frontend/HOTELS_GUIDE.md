# 🏨 Sistema de Gestão de Hotéis e Event Spaces - Documentação

## Visão Geral

Este módulo fornece uma app profissional e moderna para gerenciar hotéis, room types e event spaces, inspirada em plataformas como Booking.com e Airbnb.

## Estrutura de Pastas

```
src/
├── apps/
│   ├── main-app/
│   │   └── features/
│   │       ├── hotels/
│   │       │   ├── components/      # Componentes específicos (opcionais)
│   │       │   ├── pages/
│   │       │   │   ├── HotelsSearchPage.tsx       # Busca/listagem
│   │       │   │   └── HotelDetailPage.tsx        # Detalhes do hotel
│   │       │   └── hooks/
│   │       │       └── useHotels.ts               # Hooks de dados
│   │       └── event-spaces/
│   │           ├── components/
│   │           ├── pages/
│   │           │   ├── EventSpacesSearchPage.tsx
│   │           │   └── EventSpaceDetailPage.tsx
│   │           └── hooks/
│   │               └── useEventSpaces.ts
│   └── admin-app/
│       ├── pages/
│       │   └── hotel-management/
│       │       └── HotelManagerDashboard.tsx      # Dashboard principal
│       └── components/
│           └── hotel-management/
│               ├── RoomTypesManagement.tsx
│               ├── EventSpacesManagement.tsx
│               └── BookingsManagement.tsx
├── shared/
│   ├── components/
│   │   ├── hotels/
│   │   │   ├── HotelCard.tsx         # Card de hotel
│   │   │   ├── HotelSearch.tsx       # Busca sticky
│   │   │   ├── HotelGallery.tsx      # Galeria de fotos
│   │   │   └── RoomTypeCard.tsx      # Card de quarto
│   │   └── event-spaces/
│   │       └── EventSpaceCard.tsx    # Card de espaço
│   └── types/
│       ├── hotels.ts                 # Tipos para hotéis
│       └── event-spaces.ts           # Tipos para espaços
```

## Componentes Principais

### 1. **HotelsSearchPage**
Página de busca e listagem de hotéis com:
- Formulário de busca sticky (localização, datas, hóspedes)
- Grid de cards de hotéis
- Suporte a favoritos
- Filtros básicos

### 2. **HotelDetailPage**
Página de detalhes do hotel com:
- Galeria completa de fotos (hero image + miniaturas)
- Tabs: Fotos, Quartos, Comodidades, Avaliações, Informações
- Sticky booking widget (lateral em desktop, sticky bottom em mobile)
- Listagem de room types
- Reviews com opção de resposta (apenas para manager)
- **Contato do hotel bloqueado até confirmação de reserva**

### 3. **EventSpacesSearchPage**
Página similar a HotelsSearchPage mas para espaços de eventos com:
- Filtros: tipo de evento, capacidade mínima
- Cards com informações de capacidade e preço

### 4. **EventSpaceDetailPage**
Página de detalhes do espaço com:
- Informações detalhadas
- Preços por hora, meio-dia, dia completo
- Políticas e restrições
- Serviços inclusos
- Depósito de segurança (se aplicável)

### 5. **HotelManagerDashboard**
Dashboard principal para managers com tabs:
- **Resumo**: Métricas (ocupação, receita, reservas, ratings)
- **Quartos**: CRUD de room types com sub-tabs
  - Lista (cards editáveis)
  - Calendário de disponibilidade
  - Gestão de promoções
  - Reviews com respostas
- **Espaços de Eventos**: Similar aos quartos
- **Reservas**: Listagem unificada (rooms + spaces)
- **Reviews**: Avaliações unificadas
- **Pagamentos**: Gestão de pagamentos pendentes

## Tipos TypeScript

### Hotels.ts
```typescript
- Hotel (informações básicas do hotel)
- RoomType (tipos de quarto)
- HotelAvailability (disponibilidade)
- Promotion (promoções)
- HotelReview (avaliações)
- HotelBooking (reservas)
- HotelSearchParams (parâmetros de busca)
```

### Event-Spaces.ts
```typescript
- EventSpace (informações do espaço)
- EventSpaceAvailability (disponibilidade)
- EventSpaceReview (avaliações)
- EventSpaceBooking (reservas)
- EventSpaceSearchParams (parâmetros de busca)
```

## Hooks Customizados

### useHotels.ts
```typescript
- useHotels(params)                      // Buscar hotéis
- useHotelDetail(hotelId)                // Detalhes de um hotel
- useHotelAvailability(...)              // Verificar disponibilidade
- useCreateHotelBooking()                // Criar reserva
- useMyHotelBookings()                   // Minhas reservas
- useSubmitHotelReview()                 // Enviar review
- useHotelContactInfo()                  // Info de contato (após reserva)
- useNearbyHotels(...)                   // Hotéis próximos
- useHotelsByLocation(location)          // Hotéis por localização
```

### useEventSpaces.ts
```typescript
- useEventSpaces(params)                 // Buscar espaços
- useEventSpaceDetail(spaceId)           // Detalhes de um espaço
- useEventSpaceAvailability(...)         // Verificar disponibilidade
- useCreateEventSpaceBooking()           // Criar reserva
- useMyEventSpaceBookings()              // Minhas reservas
- useSubmitEventSpaceReview()            // Enviar review
- useFeatureEventSpaces()                // Espaços em destaque
```

## Fluxo de Uso - Clientes (Main App)

### 1. Busca de Hotéis
```
HotelsSearchPage
  → useHotels(searchParams)
  → GET /api/hotels?location=...&checkInDate=...
  → Grid de HotelCard
```

### 2. Detalhes do Hotel
```
HotelDetailPage
  → useHotelDetail(hotelId)
  → GET /api/hotels/:id
  → Mostra: galeria, quartos, comodidades, reviews
  → Contato bloqueado (mostra badge "Disponível após reserva")
```

### 3. Fazer Reserva
```
Clica "Reservar" → Preenche dados
  → useCreateHotelBooking()
  → POST /api/hotels/:id/bookings
  → Confirmação + voucher
  → Libera contato na página "Minhas Reservas"
```

### 4. Busca de Event Spaces
```
EventSpacesSearchPage
  → useEventSpaces(searchParams)
  → GET /api/spaces?eventType=...&capacityMin=...
  → Grid de EventSpaceCard
```

### 5. Detalhes do Event Space
```
EventSpaceDetailPage
  → useEventSpaceDetail(spaceId)
  → GET /api/spaces/:id
  → Mostra: fotos, capacidade, preços, equipamentos, reviews
  → Contato bloqueado (igual aos hotéis)
```

## Fluxo de Gestão - Managers (Admin App)

### 1. Dashboard Principal
```
HotelManagerDashboard
  → Resumo com métricas
  → Links rápidos para ações
  → Visualização de alertas
```

### 2. Gestão de Room Types
```
Tab "Quartos" → RoomTypesManagement
  → Lista (cards com foto, preço, ocupação)
  → Criar novo: Modal/página com wizard
  → Editar: Form com preview
  → Calendário: Bloquear datas, ajustar preços
  → Promoções: Criar/gerenciar promoções
  → Reviews: Responder avaliações
```

### 3. Gestão de Event Spaces
```
Tab "Espaços de Eventos" → EventSpacesManagement
  → Similar aos quartos
  → Suporte a preços por hora/dia/evento
  → Equipamentos customizáveis
```

### 4. Gestão de Reservas
```
Tab "Reservas" → BookingsManagement
  → Lista unificada (rooms + spaces)
  → Filtros por status/tipo
  → Ações: confirmar, processar pagamento, contatar hóspede
```

## Estética e Design

### Cores
- Primária (Amarelo): `hsl(45 100% 50%)`
- Secundária (Verde): `hsl(170.9 100% 33.1%)`
- Alerta (Laranja): `hsl(14.1 100% 56.9%)`
- Dark: `hsl(210 25% 13.3%)`

### Componentes
- Reutiliza Radix UI (tabs, dialog, forms, etc)
- Reutiliza componentes UI existentes
- Responsive design (mobile-first)
- Modo claro por padrão (dark mode opcional)

### Padrões
- Cards com shadow-sm para listagens
- Hero images com gradient overlay
- Badges para status/tags
- Botões com variantes (primary, outline, ghost)

## Integração com Rotas

### Main App Routes
```typescript
// Hotéis
/hotels                    → HotelsSearchPage
/hotels/:id               → HotelDetailPage
/hotels/:id/booking       → HotelBookingPage (a criar)

// Espaços de Eventos
/event-spaces            → EventSpacesSearchPage
/event-spaces/:id        → EventSpaceDetailPage
/event-spaces/:id/booking → EventSpaceBookingPage (a criar)

// Minhas Reservas (após login)
/my-bookings            → Página de minhas reservas
/my-bookings/hotels/:id → Detalhes da reserva
```

### Admin App Routes
```typescript
// Dashboard de Hotel Manager
/manager/hotels/:hotelId/dashboard    → HotelManagerDashboard

// Sub-rotas dentro do dashboard (via tabs)
/manager/hotels/:hotelId/rooms
/manager/hotels/:hotelId/spaces
/manager/hotels/:hotelId/bookings
/manager/hotels/:hotelId/payments
/manager/hotels/:hotelId/reviews
```

## Segurança e Fluxo de Contato

### Bloqueio de Contato Até Reserva

**Backend:**
- GET `/api/hotels/:id/contact` - Requer bookingId ou auth_token com reserva confirmada
- GET `/api/spaces/:id/contact` - Similar

**Frontend:**
- HotelDetailPage: Mostra badge "Contacto disponível após reserva confirmada"
- Após reserva confirmada: Libera contato na página "Minhas Reservas" e email

**Vantagens:**
- ✅ Protege dados dos parceiros
- ✅ Aumenta conversão (força conclusão da reserva)
- ✅ Reduz spam/contato direto
- ✅ Padrão de mercado (Booking.com, Airbnb)

## Endpoint API Esperados

### Hotéis
```
GET  /api/hotels?location=...&checkInDate=...
GET  /api/hotels/:id
POST /api/hotels/:id/bookings
GET  /api/hotels/my-bookings
POST /api/hotels/reviews/submit
POST /api/hotels/:id/reviews/:reviewId/respond
GET  /api/hotels/:id/contact (com auth)
GET  /api/hotels/search/nearby?lat=...&long=...
GET  /api/hotels/locality/:location
```

### Espaços de Eventos
```
GET  /api/spaces?eventType=...&capacityMin=...
GET  /api/spaces/:id
POST /api/spaces/:id/bookings
GET  /api/spaces/my-bookings
POST /api/spaces/reviews/submit
POST /api/spaces/:id/reviews/:reviewId/respond
GET  /api/spaces/:id/contact (com auth)
GET  /api/spaces/featured
```

### Manager (Hotel Management)
```
GET    /api/hotels/:hotelId/room-types
POST   /api/hotels/:hotelId/room-types
PUT    /api/hotels/:hotelId/room-types/:roomTypeId
DELETE /api/hotels/:hotelId/room-types/:roomTypeId

GET    /api/hotels/:hotelId/spaces
POST   /api/hotels/:hotelId/spaces
PUT    /api/hotels/:hotelId/spaces/:spaceId
DELETE /api/hotels/:hotelId/spaces/:spaceId

GET    /api/hotels/:hotelId/bookings
GET    /api/hotels/:hotelId/payments

POST   /api/hotels/:hotelId/promotions
PUT    /api/hotels/:hotelId/promotions/:promotionId
DELETE /api/hotels/:hotelId/promotions/:promotionId

POST   /api/hotels/:hotelId/availability/bulk
GET    /api/spaces/:spaceId/availability
```

## Próximos Passos (Phase 2)

### MVP Completo
- [ ] Página de reserva com confirmação (3-4 passos)
- [ ] Checkout com múltiplas formas de pagamento
- [ ] Integração com TanStack Query para cache
- [ ] Notificações em tempo real (novos bookings)

### Melhorias de UX
- [ ] Mapa interativo (Mapbox/Leaflet)
- [ ] DateRangePicker bonito (react-big-calendar)
- [ ] Filtros avançados com drawer mobile
- [ ] Infinite scroll em listagens
- [ ] Dark mode completo

### Manager Features
- [ ] Bulk upload de fotos (drag-and-drop)
- [ ] Calendar com visualização mensal/semanal
- [ ] Integração com OTAs (Booking.com, Airbnb)
- [ ] Reports e analytics avançados
- [ ] Chat com hóspede (via WhatsApp Business)

## Desenvolvimento

### Instalar Dependências Necessárias
```bash
npm install react-big-calendar react-calendar react-date-range
npm install chart.js react-chartjs-2  # Para gráficos
npm install axios                      # Já instalado
```

### Como Testar Localmente

1. **Substituir dados mockados por API real**
   - Editar hooks para chamar apiService em vez de mockados

2. **Integrar com routing**
   - Adicionar rotas em AppRouter.tsx
   - Conectar links de navegação

3. **Teste funcional**
   - Testar busca com parâmetros
   - Testar detalhes + galeria
   - Testar formulário de reserva
   - Testar dashboard manager (com dados mockados)

## Sugestões para Melhorias Futuras

1. **Performance**
   - Lazy loading de imagens
   - Pagination vs infinite scroll
   - Cache agressivo com React Query

2. **Monetização**
   - Taxa de comissão por reserva
   - Promoções patrocinadas (featured listings)
   - Analytics premium para managers

3. **Social**
   - Compartilhar no WhatsApp/Telegram
   - Reviews com fotos obrigatórias
   - Sistema de recomendações

4. **Internacionalização**
   - i18n para PT/EN
   - Conversão de moedas automática

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação do backend: `backend/docs/HOTELS_API.md`
- Tipos TypeScript: `src/shared/types/hotels.ts` e `event-spaces.ts`
- Componentes Radix UI: [radix-ui.com](https://www.radix-ui.com)
