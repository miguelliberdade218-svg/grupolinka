# 🚀 GUIA DE USO DOS SERVIÇOS - Link-A App

## 📖 Como Usar `hotelService` e `eventSpaceService`

### 1️⃣ IMPORTAR O SERVIÇO

```tsx
import { hotelService } from '@/services/hotelService';
import { eventSpaceService } from '@/services/eventSpaceService';
```

---

## 🏨 HOTELSERVICE - Gerenciamento de Hotéis

### ✅ Buscar Hotéis

```tsx
// Com filtros
const response = await hotelService.searchHotels({
  query: 'Hotel Luxo',
  locality: 'Maputo',
  province: 'Gaza',
  checkIn: '2026-02-01',
  checkOut: '2026-02-05',
  guests: 2
});

if (response.success) {
  console.log(response.data);        // Array<Hotel>
  console.log(response.count);       // Total de resultados
} else {
  console.log(response.error);       // Mensagem de erro
}
```

### ✅ Obter Hotel por ID

```tsx
const response = await hotelService.getHotelById('hotel-uuid-123');

if (response.success) {
  const hotel = response.data;
  console.log(hotel.name, hotel.address);
}
```

### ✅ Criar Novo Hotel

```tsx
const response = await hotelService.createHotel({
  name: 'Hotel Paradise',
  address: 'Rua Principal 123',
  locality: 'Maputo',
  province: 'Gaza',
  country: 'Moçambique',
  contact_email: 'info@paradise.com',
  contact_phone: '+258-21-123456',
  amenities: ['WiFi', 'Piscina', 'Ginásio'],
  images: ['url-image-1', 'url-image-2']
});

if (response.success) {
  alert('Hotel criado: ' + response.data?.id);
}
```

### ✅ Atualizar Hotel

```tsx
const response = await hotelService.updateHotel('hotel-uuid-123', {
  name: 'Hotel Paradise Updated',
  amenities: ['WiFi', 'Piscina', 'Ginásio', 'Spa']
});

if (!response.success) {
  alert('Erro: ' + response.error);
}
```

---

## 🛏️ GERENCIAMENTO DE ROOM TYPES (QUARTOS)

### ✅ Listar Room Types do Hotel

```tsx
const response = await hotelService.getRoomTypesByHotel('hotel-uuid-123');

if (response.success) {
  response.data.forEach(room => {
    console.log(`${room.name} - ${room.capacity} pessoas`);
  });
}
```

### ✅ Criar Room Type

```tsx
const response = await hotelService.createRoomType('hotel-uuid-123', {
  name: 'Quarto Standard',
  description: 'Quarto confortável com vista para o mar',
  capacity: 2,
  base_price: '2500',              // Em MZN
  total_units: 10,                 // Total de unidades
  base_occupancy: 2,               // Ocupação base
  min_nights: 1,                   // Mínimo de noites
  extra_adult_price: '500',        // Adicional adulto
  extra_child_price: '250',        // Adicional criança
  amenities: ['WiFi', 'TV', 'Ar-condicionado'],
  images: ['url-image-1']
});

if (response.success) {
  console.log('Room type criado:', response.data?.id);
}
```

### ✅ Atualizar Room Type

```tsx
const response = await hotelService.updateRoomType('hotel-uuid-123', 'room-uuid-456', {
  base_price: '3000',
  amenities: ['WiFi', 'TV', 'Ar-condicionado', 'Minibar']
});
```

### ✅ Deletar Room Type

```tsx
const response = await hotelService.deleteRoomType('hotel-uuid-123', 'room-uuid-456');

if (response.success) {
  alert('Tipo de quarto deletado com sucesso');
}
```

---

## 📅 GERENCIAMENTO DE RESERVAS

### ✅ Criar Reserva

```tsx
const response = await hotelService.createBooking('hotel-uuid-123', {
  roomTypeId: 'room-uuid-456',
  guestName: 'João Silva',
  guestEmail: 'joao@email.com',
  guestPhone: '+258-84-123456',
  checkIn: '2026-02-01',
  checkOut: '2026-02-05',
  adults: 2,
  children: 1,
  units: 1,                        // Número de unidades
  specialRequests: 'Cama king-size com vista para o mar',
  promoCode: 'WELCOME10',          // Código de promoção
  status: 'confirmed',
  paymentStatus: 'pending'
});

if (response.success) {
  console.log('Reserva criada:', response.data?.id);
} else {
  alert('Erro ao criar reserva: ' + response.error);
}
```

### ✅ Obter Reservas do Hotel

```tsx
// Filtrar por status
const response = await hotelService.getBookingsByHotel('hotel-uuid-123', ['confirmed', 'checked_in']);

if (response.success) {
  console.log(`Total de ${response.count} reservas confirmadas`);
}
```

### ✅ Check-in

```tsx
const response = await hotelService.checkInBooking('booking-uuid-789');

if (response.success) {
  console.log('Check-in realizado');
} else {
  alert('Erro: ' + response.error);
}
```

### ✅ Check-out

```tsx
const response = await hotelService.checkOutBooking('booking-uuid-789');
```

### ✅ Cancelar Reserva

```tsx
const response = await hotelService.cancelBooking('booking-uuid-789', 'Motivo do cancelamento');
```

### ✅ Calcular Preço

```tsx
const response = await hotelService.calculateBookingPrice('hotel-uuid-123', {
  roomTypeId: 'room-uuid-456',
  checkIn: '2026-02-01',
  checkOut: '2026-02-05',
  units: 1,
  promoCode: 'WELCOME10'
});

if (response.success) {
  console.log('Preço total:', response.data?.totalPrice);
  console.log('Preço base:', response.data?.basePrice);
  console.log('Impostos:', response.data?.taxes);
}
```

---

## 🎉 GERENCIAMENTO DE PROMOÇÕES

### ✅ Listar Promoções

```tsx
const response = await hotelService.getPromotionsByHotel('hotel-uuid-123');

if (response.success) {
  response.data.forEach(promo => {
    console.log(`${promo.name} (${promo.promo_code})`);
  });
}
```

### ✅ Criar Promoção

```tsx
const response = await hotelService.createPromotion('hotel-uuid-123', {
  promo_code: 'WELCOME10',
  name: 'Boas-vindas 10% de desconto',
  description: 'Desconto para primeiros hóspedes',
  discount_percent: 10,
  start_date: '2026-01-15',
  end_date: '2026-03-15',
  max_uses: 100,
  is_active: true
});

if (response.success) {
  console.log('Promoção criada:', response.data?.id);
}
```

### ✅ Atualizar Promoção

```tsx
const response = await hotelService.updatePromotion('hotel-uuid-123', 'promo-uuid-789', {
  discount_percent: 15,
  max_uses: 150
});
```

---

## ⭐ GERENCIAMENTO DE REVIEWS

### ✅ Listar Reviews

```tsx
const response = await hotelService.getReviewsByHotel('hotel-uuid-123', 10, 0);

if (response.success) {
  response.data.forEach(review => {
    console.log(`${review.title} - ${review.ratings.comfort}/5`);
  });
}
```

### ✅ Estatísticas de Reviews

```tsx
const response = await hotelService.getReviewStats('hotel-uuid-123');

if (response.success) {
  const stats = response.data;
  console.log(`Average: ${stats.average_rating}`);
  console.log(`Total: ${stats.total_reviews}`);
}
```

---

## 🎪 EVENT SPACE SERVICE - Espaços de Eventos

### ✅ Buscar Espaços

```tsx
const response = await eventSpaceService.searchEventSpaces({
  query: 'Salão de Conferência',
  locality: 'Maputo',
  capacity: 100,
  eventType: 'Conferência',
  maxPrice: 50000
});

if (response.success) {
  console.log(`Encontrados ${response.count} espaços`);
}
```

### ✅ Criar Espaço de Evento

```tsx
const response = await eventSpaceService.createEventSpace('hotel-uuid-123', {
  name: 'Salão Grand',
  description: 'Espaço de primeira classe para eventos',
  capacity_min: 50,
  capacity_max: 500,
  base_price_hourly: '5000',
  base_price_half_day: '20000',
  base_price_full_day: '40000',
  area_sqm: 2000,
  has_stage: true,
  includes_catering: true,
  includes_furniture: true,
  alcohol_allowed: true,
  amenities: ['WiFi', 'Ar-condicionado', 'Projetores'],
  event_types: ['Conferência', 'Casamento', 'Festa corporativa'],
  images: ['url-image-1']
});

if (response.success) {
  console.log('Espaço criado:', response.data?.id);
}
```

### ✅ Listar Espaços do Hotel

```tsx
const response = await eventSpaceService.getEventSpacesByHotel('hotel-uuid-123');

if (response.success) {
  response.data.forEach(space => {
    console.log(`${space.name} - ${space.capacity_min}-${space.capacity_max} pessoas`);
  });
}
```

### ✅ Atualizar Espaço

```tsx
const response = await eventSpaceService.updateEventSpace('space-uuid-456', {
  base_price_hourly: '6000',
  is_featured: true
});
```

### ✅ Deletar Espaço

```tsx
const response = await eventSpaceService.deleteEventSpace('space-uuid-456');
```

---

## 📋 RESERVAS DE EVENTOS

### ✅ Criar Reserva de Evento

```tsx
const response = await eventSpaceService.createEventBooking('space-uuid-456', {
  organizer_name: 'Maria Santos',
  organizer_email: 'maria@email.com',
  organizer_phone: '+258-84-654321',
  event_title: 'Conferência de Tecnologia 2026',
  event_description: 'Encontro anual de TI',
  event_type: 'Conferência',
  start_datetime: '2026-03-15T09:00:00Z',
  end_datetime: '2026-03-15T18:00:00Z',
  expected_attendees: 250,
  special_requests: 'Necessário setup de microfones'
});

if (response.success) {
  console.log('Reserva criada:', response.data?.id);
}
```

### ✅ Listar Reservas

```tsx
const response = await eventSpaceService.getEventBookingsBySpace('space-uuid-456', ['confirmed', 'pending_approval']);

console.log(`Total de ${response.count} reservas`);
```

### ✅ Confirmar Reserva

```tsx
const response = await eventSpaceService.confirmEventBooking('booking-uuid-789');
```

### ✅ Rejeitar Reserva

```tsx
const response = await eventSpaceService.rejectEventBooking('booking-uuid-789', 'Motivo da rejeição');
```

### ✅ Cancelar Reserva

```tsx
const response = await eventSpaceService.cancelEventBooking('booking-uuid-789', 'Motivo do cancelamento');
```

---

## 📊 DASHBOARDS

### ✅ Dashboard do Hotel

```tsx
const response = await hotelService.getHotelDashboard('hotel-uuid-123');

if (response.success) {
  const dashboard = response.data;
  console.log(`Total de bookings: ${dashboard.total_bookings}`);
  console.log(`Receita: ${dashboard.total_revenue}`);
  console.log(`Ocupação: ${dashboard.occupancy_rate}%`);
}
```

### ✅ Dashboard de Eventos

```tsx
const response = await eventSpaceService.getEventDashboard('hotel-uuid-123');

if (response.success) {
  console.log(response.data);
}
```

---

## 🎯 PADRÕES & BOAS PRÁTICAS

### 1. Sempre Verificar `response.success`

```tsx
const response = await hotelService.getHotelById('id');

if (response.success && response.data) {
  // Trabalhar com response.data
} else {
  // Mostrar erro
  console.error(response.error);
}
```

### 2. Usar Try-Catch para Erros de Rede

```tsx
try {
  const response = await hotelService.searchHotels();
  // ...
} catch (error) {
  console.error('Erro de rede:', error);
}
```

### 3. Implementar Loading States

```tsx
const [loading, setLoading] = useState(false);

const load = async () => {
  setLoading(true);
  try {
    const response = await hotelService.getHotelById('id');
    if (response.success) {
      setData(response.data);
    }
  } finally {
    setLoading(false);
  }
};
```

### 4. Tratar Erros com Toast/Alert

```tsx
if (!response.success) {
  alert(`Erro: ${response.error}`);
  // ou usar Toast notification
}
```

---

## 📞 SUPORTE

Para dúvidas ou problemas, consulte:
- Backend: `/api/v2/health` (health check)
- Documentação: `RESTRUCTURING_PLAN.md`
- Controllers: Backend em `src/modules/hotels/` e `src/modules/events/`
