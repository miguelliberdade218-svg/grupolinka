# 🎯 GUIA DE IMPLEMENTAÇÃO - Estrutura Limpa & Pronta

**Versão:** 15/01/2026  
**Para:** Equipa de Programadores  
**Tempo Leitura:** 5 minutos

---

## ✅ ESTADO ATUAL (15/01/2026)

### Código Implementado:
```
TIPOS:           1,294 linhas (4 ficheiros)
├─ hotels.ts           390 linhas
├─ event-spaces.ts     443 linhas  
├─ bookings.ts         253 linhas
└─ payments.ts         208 linhas

HOOKS:             712 linhas (2 ficheiros)
├─ useHotelsComplete.ts      342 linhas (15 operações)
└─ useEventSpacesComplete.ts 370 linhas (22 operações)

COMPONENTES:       700+ linhas (vários)
└─ HotelBookingModal + PaymentForm

DOCUMENTAÇÃO:    1,101 linhas
├─ ARCHITECTURE_HOTELS_EVENTSPACES.md (849 linhas)
└─ RESUMO_FINAL_ESTRUTURA.md (252 linhas)

TOTAL: 3,807 linhas de código profissional
```

---

## 🗂️ COMO USAR (DEVELOPER GUIDE)

### 1️⃣ Importar Tipos
```typescript
// ✅ CORRETO
import type { Hotel, RoomType } from '@/shared/types/hotels';
import type { HotelBooking } from '@/shared/types/bookings';
import type { HotelPayment } from '@/shared/types/payments';
import type { EventSpace } from '@/shared/types/event-spaces';

// ❌ ERRADO
import Hotel from '@/shared/types/hotels'; // (type não é default export)
import * as types from '...'; // (evitar wildcard imports)
```

### 2️⃣ Usar Hooks
```typescript
// Hotéis
import { 
  useHotels,
  useHotelDetail,
  useCreateHotelBooking,
  useHotelDashboard 
} from '@/apps/main-app/features/hotels/hooks/useHotelsComplete';

// Event Spaces
import {
  useEventSpaces,
  useCreateEventSpaceBooking,
  useConfirmEventSpaceBooking
} from '@/apps/main-app/features/event-spaces/hooks/useEventSpacesComplete';
```

### 3️⃣ Integrar Componentes
```typescript
import { HotelBookingModal } from '@/shared/components/hotels/HotelBookingModal';
import { PaymentForm } from '@/shared/components/payments/PaymentForm';
```

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO (RECOMENDADO)

### Semana 1: Search Pages
```
Day 1-2: HotelsSearchPage
├─ Import useHotels hook
├─ Add filters UI
├─ Map results to HotelCard
└─ Test filters

Day 3-4: HotelDetailPage
├─ Import useHotelDetail + useRoomTypes
├─ Show hotel info + photos
├─ Show room type grid
└─ Add "Reserve" button

Day 5: EventSpaces Pages (mesma lógica)
├─ Search page com filtros
├─ Detail page com info
└─ Button para booking
```

### Semana 2: Booking & Payment
```
Day 1-2: HotelBookingModal Integration
├─ Add <HotelBookingModal /> to HotelDetailPage
├─ Wire up onSuccess callback
├─ Redirect to payment page
└─ Test validação

Day 3-4: PaymentForm Integration
├─ Create new page /payment/:bookingId
├─ Show PaymentForm component
├─ Handle payment methods
└─ Test each method

Day 5: Event Space Booking (same pattern)
├─ EventSpaceBookingForm (may need custom)
├─ Approval workflow
└─ Payment integration
```

### Semana 3: Manager Dashboards
```
Day 1-2: Hotel Manager Dashboard
├─ Import useHotelDashboard
├─ Show metrics (occupancy, revenue, etc)
├─ Import useHotelBookings
├─ List reservations with status

Day 3-4: Check-in/out Functionality
├─ Add check-in button on booking row
├─ Use useCheckInBooking() mutation
├─ Update UI after success
├─ Same for check-out

Day 5: Event Space Dashboard
├─ Import useEventSpacesDashboard
├─ Show pending approvals
├─ Confirm/reject buttons
└─ Financial summary
```

### Semana 4: Payment Integration
```
Day 1: M-Pesa Integration
├─ Setup M-Pesa API
├─ Test webhook handling
└─ Confirm payment status

Day 2: Bank Transfer
├─ Manual confirmation flow
├─ Send payment instructions
└─ Admin approval UI

Day 3: Card Payment
├─ Integrate Stripe/PayTabs
├─ Secure token handling
└─ PCI compliance

Day 4-5: Testing & Polish
├─ Test all payment flows
├─ Error handling
├─ Email receipts
```

---

## 📋 CHECKLIST POR PÁGINA

### [ ] HotelsSearchPage
- [ ] Import useHotels
- [ ] Build filter UI (locality, dates, guests)
- [ ] Call hook with filters
- [ ] Display loading state
- [ ] Display error state
- [ ] Map hotels to HotelCard
- [ ] Handle empty state
- [ ] Test responsiveness

### [ ] HotelDetailPage
- [ ] Import useHotelDetail + useRoomTypes
- [ ] Show hotel header + photos
- [ ] Show amenities
- [ ] Show room types grid
- [ ] Add "Reserve Now" button
- [ ] Integrate HotelBookingModal
- [ ] Show reviews (useHotelReviews)
- [ ] Show pricing from RoomType

### [ ] PaymentPage (/payment/:bookingId)
- [ ] Load booking details
- [ ] Show PaymentForm
- [ ] Handle form submission
- [ ] Show success message
- [ ] Show payment receipt
- [ ] Send email confirmation
- [ ] Redirect after success

### [ ] HotelManagerDashboard
- [ ] Import useHotelDashboard
- [ ] Display metrics (4 cards)
- [ ] Import useUpcomingCheckIns
- [ ] Show upcoming check-ins widget
- [ ] Import useHotelBookings
- [ ] List all reservations
- [ ] Add check-in/out buttons
- [ ] Add payment status column

---

## 🔧 PADRÕES DE CÓDIGO

### Hook Usage Pattern
```typescript
function MyComponent() {
  // Query hook
  const { data, isLoading, error } = useHotels(filters);
  
  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;
  
  // Mutation hook
  const { mutate, isPending } = useCreateHotelBooking();
  
  const handleSubmit = async (formData) => {
    mutate(
      { hotelId, booking: formData },
      {
        onSuccess: (booking) => {
          console.log('Booking criado:', booking.id);
          navigate(`/payment/${booking.id}`);
        },
        onError: (error) => {
          showToast({ type: 'error', message: error.message });
        }
      }
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Type Safety Pattern
```typescript
// ✅ TIPO-SEGURO
const handleBooking = async (booking: CreateHotelBookingRequest) => {
  const { data } = await mutate({ hotelId, booking });
  // data é HotelBooking (tipado)
  console.log(data.id); // ✅ autocomplete funciona
};

// ❌ NÃO SEGURO
const handleBooking = async (booking: any) => {
  const { data } = await mutate({ hotelId, booking });
  console.log(data.xyz); // ❌ sem validação
};
```

### Form Validation Pattern
```typescript
import { z } from 'zod';

const BookingSchema = z.object({
  guestName: z.string().min(3),
  checkIn: z.string().refine((date) => new Date(date) > new Date()),
  adults: z.number().min(1).max(6),
  children: z.number().min(0).max(5),
});

function BookingForm() {
  const form = useForm<z.infer<typeof BookingSchema>>({
    resolver: zodResolver(BookingSchema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('guestName')} />
      {form.formState.errors.guestName && (
        <span>{form.formState.errors.guestName.message}</span>
      )}
    </form>
  );
}
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Erro: "Cannot find module useHotelsComplete"
```bash
✓ Verificar caminho: 
  @/apps/main-app/features/hotels/hooks/useHotelsComplete
  
✓ Não usar:
  @/hooks/useHotels (não existe mais)
  @/useHotelsComplete (caminho errado)
```

### Erro: "Type 'any' is not assignable to type 'Hotel'"
```typescript
✓ Adicionar typo ao hook:
  const { data: hotels } = useHotels(filters);
  
✓ Não usar:
  const hotels = useHotels(filters);
```

### Erro: "Query invalidation não funciona"
```typescript
✓ Invalidar após mutation:
  onSuccess: (booking) => {
    queryClient.invalidateQueries({
      queryKey: HOTELS_QUERY_KEYS.bookings(booking.hotelId)
    });
  }

✓ Importar getQueryData se precisar:
  const bookings = queryClient.getQueryData(
    HOTELS_QUERY_KEYS.bookings(hotelId)
  );
```

### Erro: "Field name mismatch with backend"
```typescript
// Converter snake_case (backend) ↔ camelCase (frontend)
const request = {
  room_type_id: roomTypeId,    // backend espera snake_case
  check_in: checkIn,
  check_out: checkOut,
};

// APIService faz isso automaticamente!
// Mas se estiver a passar manual, cuidado com nomes
```

---

## 📊 QUERY KEY REFERENCE

### Hotels
```typescript
HOTELS_QUERY_KEYS = {
  all: ['hotels'],
  lists: () => [...all, 'list'],
  list: (filters) => [...lists(), filters],
  detail: (id) => [...all, 'detail', id],
  roomTypes: (hotelId) => [...all, 'roomTypes', hotelId],
  bookings: (hotelId) => [...all, 'bookings', hotelId],
  booking: (bookingId) => [...all, 'booking', bookingId],
  payments: (bookingId) => [...all, 'payments', bookingId],
  reviews: (hotelId) => [...all, 'reviews', hotelId],
  dashboard: (hotelId) => [...all, 'dashboard', hotelId],
}
```

### Event Spaces
```typescript
EVENT_SPACES_QUERY_KEYS = {
  all: ['event-spaces'],
  lists: () => [...all, 'list'],
  list: (filters) => [...lists(), filters],
  detail: (id) => [...all, 'detail', id],
  bookings: (spaceId) => [...all, 'bookings', spaceId],
  booking: (bookingId) => [...all, 'booking', bookingId],
  payments: (bookingId) => [...all, 'payments', bookingId],
  reviews: (spaceId) => [...all, 'reviews', spaceId],
  availability: (spaceId) => [...all, 'availability', spaceId],
  dashboard: (hotelId) => [...all, 'dashboard', hotelId],
}
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

| Documento | Conteúdo | Usar Para |
|-----------|----------|-----------|
| **ARCHITECTURE_HOTELS_EVENTSPACES.md** | Tipos, Hooks, Componentes | Referência técnica |
| **RESUMO_FINAL_ESTRUTURA.md** | Overview, checklist | Iniciar projecto |
| **Este ficheiro** | Implementação prática | Durante desenvolvimento |

---

## 🚀 PRÓXIMA FASE

Após terminar a integração:

1. **Testes**
   - Unit tests para componentes
   - Integration tests para hooks
   - E2E tests para fluxos

2. **Performance**
   - Lighthouse audit
   - React DevTools profiler
   - Network tab analysis

3. **Polimento**
   - Animations
   - Micro-interactions
   - Accessibility

---

**Sucesso! 🎉**

Estrutura está pronta. Documentação está completa.

Agora é só integrar e testar!

Qualquer dúvida, consultar ARCHITECTURE_HOTELS_EVENTSPACES.md
