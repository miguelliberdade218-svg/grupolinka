# 📋 IMPLEMENTAÇÃO COMPLETA: SISTEMA DE REVIEWS + PAGAMENTOS FLEXÍVEIS

## 📌 RESUMO EXECUTIVO

Este documento descreve TUDO que deve ser implementado para:
1. ✅ **Sistema de Reviews de Rides** (ciclones)
2. ✅ **Reviews Hotel (Hotel → Cliente)**
3. ✅ **Automação de Check-in/Check-out**
4. ✅ **Pagamentos Flexíveis (Hotel, Motorista, Events)**

---

## 🎯 TABELAS JÁ CRIADAS (Você copia/cola no banco)

Veja o ficheiro: `SQL_TODAS_TABELAS_CRIAR_BANCO.sql`

✅ **Reviews de Rides:**
- `ride_reviews` - Cliente avalia motorista
- `ride_passenger_reviews` - Motorista avalia cliente
- `hotel_guest_reviews` - Hotel avalia cliente

✅ **Automação:**
- `booking_state_machine` - Triggers automáticos

✅ **Pagamentos:**
- `hotel_payment_policies` - Configuração hotel
- `hotel_booking_payment_history` - Histórico hotel
- `driver_payment_policies` - Configuração motorista
- `ride_payment_history` - Histórico motorista
- `eventspace_payment_policies` - Configuração eventos

✅ **Triggers:**
- `calculate_hotel_payment_amounts()` - Auto-calcula amounts
- `auto_update_hotel_payment_status()` - Auto-update status
- `auto_update_event_payment_status()` - Auto-update events

---

## 🔧 IMPLEMENTAÇÃO DO BACKEND

### 1️⃣ CRIAR: BackendService Para Reviews de Rides

**Local:** `backend/src/modules/reviews/rideReviewService.ts`

```typescript
// NOVO FICHEIRO: backend/src/modules/reviews/rideReviewService.ts

import { db } from '../../../db';
import { 
  ride_reviews, 
  ride_passenger_reviews,
  rides,
  users 
} from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class RideReviewService {
  
  // CRIAR: Review do passageiro para motorista
  async createPassengerReview(data: {
    ride_id: string;
    booking_id?: string;
    from_user_id: string;
    to_user_id: string;
    driver_rating: number;
    cleanliness_rating?: number;
    communication_rating?: number;
    vehicle_condition_rating?: number;
    route_quality_rating?: number;
    safety_rating?: number;
    title: string;
    comment: string;
    pros?: string;
    cons?: string;
  }) {
    // Calcular overall_rating
    const ratings = [
      data.driver_rating,
      data.cleanliness_rating || 5,
      data.communication_rating || 5,
      data.vehicle_condition_rating || 5,
      data.route_quality_rating || 5,
      data.safety_rating || 5
    ];
    const overall = ratings.reduce((a, b) => a + b) / ratings.length;

    const review = await db.insert(ride_reviews)
      .values({
        ride_id: data.ride_id,
        booking_id: data.booking_id,
        from_user_id: data.from_user_id,
        to_user_id: data.to_user_id,
        driver_rating: data.driver_rating,
        cleanliness_rating: data.cleanliness_rating,
        communication_rating: data.communication_rating,
        vehicle_condition_rating: data.vehicle_condition_rating,
        route_quality_rating: data.route_quality_rating,
        safety_rating: data.safety_rating,
        title: data.title,
        comment: data.comment,
        pros: data.pros,
        cons: data.cons,
        overall_rating: overall,
        is_verified: true,
        is_published: true,
        created_at: new Date(),
      });

    // Check if motorista tem muitos reviews ruins (< 3.5 stars em 10+ reviews)
    await this.checkDriverReputation(data.to_user_id);

    return review;
  }

  // CRIAR: Review do motorista para passageiro
  async createDriverReview(data: {
    ride_id: string;
    from_driver_id: string;
    to_passenger_id: string;
    passenger_behavior_rating: number;
    cleanliness_rating?: number;
    communication_rating?: number;
    payment_behavior_rating?: number;
    punctuality_rating?: number;
    title: string;
    comment: string;
  }) {
    const ratings = [
      data.passenger_behavior_rating,
      data.cleanliness_rating || 5,
      data.communication_rating || 5,
      data.payment_behavior_rating || 5,
      data.punctuality_rating || 5
    ];
    const overall = ratings.reduce((a, b) => a + b) / ratings.length;

    return await db.insert(ride_passenger_reviews)
      .values({
        ride_id: data.ride_id,
        from_driver_id: data.from_driver_id,
        to_passenger_id: data.to_passenger_id,
        passenger_behavior_rating: data.passenger_behavior_rating,
        cleanliness_rating: data.cleanliness_rating,
        communication_rating: data.communication_rating,
        payment_behavior_rating: data.payment_behavior_rating,
        punctuality_rating: data.punctuality_rating,
        title: data.title,
        comment: data.comment,
        overall_rating: overall,
        is_published: true,
        created_at: new Date(),
      });
  }

  // OBTER: Reviews de um motorista
  async getDriverReviews(driverId: string) {
    return await db.select()
      .from(ride_reviews)
      .where(eq(ride_reviews.to_user_id, driverId))
      .orderBy(ride_reviews.created_at);
  }

  // OBTER: Reviews de uma viagem específica
  async getRideReviews(rideId: string) {
    return await db.select()
      .from(ride_reviews)
      .where(eq(ride_reviews.ride_id, rideId));
  }

  // OBTER: Reviews de um passageiro (recebidas de motoristas)
  async getPassengerReviews(passengerId: string) {
    return await db.select()
      .from(ride_passenger_reviews)
      .where(eq(ride_passenger_reviews.to_passenger_id, passengerId))
      .orderBy(ride_passenger_reviews.created_at);
  }

  // UPDATE: Resposta do motorista a um review
  async respondToReview(reviewId: string, response: string) {
    return await db.update(ride_reviews)
      .set({
        driver_response: response,
        driver_response_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(ride_reviews.id, reviewId));
  }

  // CHECK: Rating média do motorista (auto-suspender se < 3.5 em 10+)
  private async checkDriverReputation(driverId: string) {
    const reviews = await db.select()
      .from(ride_reviews)
      .where(eq(ride_reviews.to_user_id, driverId));

    if (reviews.length >= 10) {
      const avgRating = reviews
        .filter(r => r.overall_rating)
        .reduce((sum, r) => sum + Number(r.overall_rating), 0) / reviews.length;

      if (avgRating < 3.5) {
        // Auto-suspend driver
        const user = await db.select()
          .from(users)
          .where(eq(users.id, driverId));

        if (user[0]) {
          await db.update(users)
            .set({
              driverSuspendedAt: new Date(),
              driverSuspensionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            })
            .where(eq(users.id, driverId));
        }
      }
    }
  }
}

export const rideReviewService = new RideReviewService();
```

---

### 2️⃣ CRIAR: PaymentPolicyService

**Local:** `backend/src/modules/payments/paymentPolicyService.ts`

_Este ficheiro já foi descrito anteriormente no SISTEMA_PAGAMENTOS_FLEXIVEL_ANALISE_PROFUNDA.md_

Copiar exatamente o código que está em: `GUIA_RAPIDO_PAGAMENTOS_FLEXIVEIS.md` secção **FASE 1**

---

### 3️⃣ CRIAR: Endpoints para Reviews

**Local:** `backend/routes/reviews.ts` (NOVO FICHEIRO)

```typescript
import { Router } from 'express';
import { rideReviewService } from '../src/modules/reviews/rideReviewService';
import { verifyFirebaseToken } from '../middleware/auth';

const router = Router();

// POST: Criar review de passageiro
router.post('/rides/:rideId/reviews', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { rideId } = req.params;
    const passengerId = req.user.id;

    const review = await rideReviewService.createPassengerReview({
      ...req.body,
      ride_id: rideId,
      from_user_id: passengerId
    });

    res.json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Criar review de motorista
router.post('/rides/:rideId/reviews/driver', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user.id;

    const review = await rideReviewService.createDriverReview({
      ...req.body,
      ride_id: rideId,
      from_driver_id: driverId
    });

    res.json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Reviews de um motorista
router.get('/drivers/:driverId/reviews', async (req: any, res: any) => {
  try {
    const reviews = await rideReviewService.getDriverReviews(req.params.driverId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Reviews de uma viagem
router.get('/rides/:rideId/reviews', async (req: any, res: any) => {
  try {
    const reviews = await rideReviewService.getRideReviews(req.params.rideId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Resposta do motorista
router.post('/reviews/:reviewId/respond', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { response } = req.body;
    await rideReviewService.respondToReview(req.params.reviewId, response);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

### 4️⃣ CRIAR: Job de Auto-Confirmação

**Local:** `backend/src/jobs/autoConfirmBookings.ts` (NOVO FICHEIRO)

```typescript
import { db } from '../../db';
import { hotelBookings, rides, eventBookings, bookingStateM } from '../../shared/schema';
import { eq, lt, and, isNull } from 'drizzle-orm';

export class AutoConfirmBookingsJob {
  async executeAutoConfirmations() {
    try {
      console.log('[AUTO-CONFIRM] Starting auto-confirmation job...');

      // 1. Auto-confirmar RIDES expiradas
      await this.autoConfirmRides();

      // 2. Auto-checkin HOTEL
      await this.autoCheckInHotels();

      // 3. Auto-checkout HOTEL
      await this.autoCheckOutHotels();

      // 4. Auto-complete EVENTS
      await this.autoCompleteEvents();

      console.log('[AUTO-CONFIRM] Job completed successfully');
    } catch (error) {
      console.error('[AUTO-CONFIRM] Error:', error);
    }
  }

  private async autoConfirmRides() {
    // Rides com departureDate no passado e status != completed
    const now = new Date();
    
    const ridesToConfirm = await db.select()
      .from(rides)
      .where(
        and(
          lt(rides.departureDate, now),
          eq(rides.status, 'available')
        )
      );

    for (const ride of ridesToConfirm) {
      await db.update(rides)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(rides.id, ride.id));

      console.log(`[AUTO-CONFIRM] Ride ${ride.id} auto-completed`);
    }
  }

  private async autoCheckInHotels() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const bookingsToCheckIn = await db.select()
      .from(hotelBookings)
      .where(
        and(
          eq(hotelBookings.status, 'confirmed'),
          lt(hotelBookings.checkInDate, new Date(today))
        )
      );

    for (const booking of bookingsToCheckIn) {
      await db.update(hotelBookings)
        .set({ status: 'checked_in', updatedAt: now })
        .where(eq(hotelBookings.id, booking.id));

      console.log(`[AUTO-CONFIRM] Hotel booking ${booking.id} auto checked-in`);
    }
  }

  private async autoCheckOutHotels() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const bookingsToCheckOut = await db.select()
      .from(hotelBookings)
      .where(
        and(
          eq(hotelBookings.status, 'checked_in'),
          lt(hotelBookings.checkOutDate, new Date(today))
        )
      );

    for (const booking of bookingsToCheckOut) {
      await db.update(hotelBookings)
        .set({ 
          status: 'checked_out',
          updatedAt: now,
          payment_status: 'complete' // Auto-mark as complete
        })
        .where(eq(hotelBookings.id, booking.id));

      console.log(`[AUTO-CONFIRM] Hotel booking ${booking.id} auto checked-out`);
    }
  }

  private async autoCompleteEvents() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const eventsToComplete = await db.select()
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.status, 'confirmed'),
          lt(eventBookings.endDate, new Date(today))
        )
      );

    for (const event of eventsToComplete) {
      await db.update(eventBookings)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(eventBookings.id, event.id));

      console.log(`[AUTO-CONFIRM] Event booking ${event.id} auto-completed`);
    }
  }
}

export const autoConfirmBookingsJob = new AutoConfirmBookingsJob();
```

---

### 5️⃣ INTEGRAR: Routes

**Local:** `backend/routes/index.ts`

Adicionar no final:

```typescript
// ADICIONAR NO FINAL DO FICHEIRO routes/index.ts

import reviewsRouter from './reviews';
import paymentsRouter from './payments'; // Se ainda não tiver

// ... outras imports ...

// REGISTAR ROTAS
app.use('/api', reviewsRouter);
app.use('/api', paymentsRouter); // Se ainda não existir

// Scheduler: Auto-confirmações a cada 5 minutos
setInterval(async () => {
  await autoConfirmBookingsJob.executeAutoConfirmations();
}, 5 * 60 * 1000); // 5 minutos
```

---

### 6️⃣ CORRIGIR: AdminService - Pagamentos

**Local:** `backend/src/modules/admin/adminService.ts`

Substituir o método `getPaymentReferences()`:

```typescript
// SUBSTITUIR em adminService.ts:

async getPaymentReferences() {
  try {
    // Buscar payment_references existentes
    const paymentReferences = await db.select()
      .from(payment_references)
      .orderBy(payment_references.created_at, 'desc')
      .limit(100);

    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // NOVO: Integrar reserves não pagas
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    // Hotel bookings confirmados não pagos
    const hotelBookingsPending = await db.select({
      id: hotelBookings.id,
      type: sql`'hotel'`,
      guestId: hotelBookings.guestId,
      hotelId: hotelBookings.hotelId,
      totalPrice: hotelBookings.totalPrice,
      status: hotelBookings.status,
      paymentStatus: hotelBookings.payment_status,
      checkInDate: hotelBookings.checkInDate
    })
      .from(hotelBookings)
      .where(
        and(
          eq(hotelBookings.status, 'confirmed'),
          ne(hotelBookings.payment_status, 'complete')
        )
      );

    // Event bookings not cancelled
    const eventBookingsPending = await db.select({
      id: eventBookings.id,
      type: sql`'event'`,
      guestId: eventBookings.guestId,
      hotelId: eventBookings.eventSpaceId,
      totalPrice: eventBookings.totalPrice,
      status: eventBookings.status,
      paymentStatus: eventBookings.payment_status,
      eventDate: eventBookings.eventDate
    })
      .from(eventBookings)
      .where(
        and(
          ne(eventBookings.status, 'cancelled'),
          ne(eventBookings.payment_status, 'complete')
        )
      );

    // Rides completed
    const ridesPending = await db.select({
      id: rides.id,
      type: sql`'ride'`,
      driverId: rides.driverId,
      totalPrice: rides.totalAmount,
      status: rides.status,
      paymentStatus: rides.paymentStatus
    })
      .from(rides)
      .where(eq(rides.status, 'completed'));

    // Calcular comissões (12%)
    const allReservations = [
      ...hotelBookingsPending.map(b => ({
        ...b,
        commission: Number(b.totalPrice) * 0.12,
        fee_amount: Number(b.totalPrice) * 0.12
      })),
      ...eventBookingsPending.map(b => ({
        ...b,
        commission: Number(b.totalPrice) * 0.12,
        fee_amount: Number(b.totalPrice) * 0.12
      })),
      ...ridesPending.map(r => ({
        ...r,
        commission: Number(r.totalPrice) * 0.12,
        fee_amount: Number(r.totalPrice) * 0.12
      }))
    ];

    return {
      paymentReferences,
      pendingReservations: allReservations,
      summary: {
        total_gross: allReservations.reduce((sum, r) => sum + Number(r.totalPrice), 0),
        total_commission: allReservations.reduce((sum, r) => sum + Number(r.commission), 0),
        total_items: allReservations.length,
        by_type: {
          hotels: hotelBookingsPending.length,
          events: eventBookingsPending.length,
          rides: ridesPending.length
        }
      }
    };
  } catch (error) {
    console.error('Error getting payment references:', error);
    return { paymentReferences: [], pendingReservations: [], summary: {} };
  }
}
```

---

## 🎨 IMPLEMENTAÇÃO DO FRONTEND

### 1️⃣ PÁGINA: Deixar Review de Ride (Cliente)

**Local:** `frontend/src/apps/rides-app/pages/ride-review.tsx` (NOVO)

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { toast } from 'react-toastify';

export default function RideReviewPage({ rideId }: { rideId: string }) {
  const [ratings, setRatings] = useState({
    driver: 5,
    cleanliness: 5,
    communication: 5,
    vehicle: 5,
    route: 5,
    safety: 5
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !comment) {
      toast.error('Título e comentário são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rides/${rideId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driver_rating: ratings.driver,
          cleanliness_rating: ratings.cleanliness,
          communication_rating: ratings.communication,
          vehicle_condition_rating: ratings.vehicle,
          route_quality_rating: ratings.route,
          safety_rating: ratings.safety,
          title,
          comment,
          pros: pros || null,
          cons: cons || null,
          to_user_id: 'MOTORISTA_ID' // Pegar do contexto
        })
      });

      if (res.ok) {
        toast.success('✅ Review enviado com sucesso!');
        // Redirecionar para ride details
      } else {
        toast.error('Erro ao enviar review');
      }
    } catch (error) {
      toast.error('Erro: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            <Star size={20} fill="currentColor" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle>⭐ Avaliar Viagem</CardTitle>
          <p className="text-sm text-gray-600 mt-2">Sua opinião nos ajuda a melhorar o serviço</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Ratings */}
          <div className="space-y-4">
            <StarRating
              label="Motorista"
              value={ratings.driver}
              onChange={(v: number) => setRatings({...ratings, driver: v})}
            />
            <StarRating
              label="Limpeza do Veículo"
              value={ratings.cleanliness}
              onChange={(v: number) => setRatings({...ratings, cleanliness: v})}
            />
            <StarRating
              label="Comunicação"
              value={ratings.communication}
              onChange={(v: number) => setRatings({...ratings, communication: v})}
            />
            <StarRating
              label="Condição do Veículo"
              value={ratings.vehicle}
              onChange={(v: number) => setRatings({...ratings, vehicle: v})}
            />
            <StarRating
              label="Qualidade da Rota"
              value={ratings.route}
              onChange={(v: number) => setRatings({...ratings, route: v})}
            />
            <StarRating
              label="Segurança"
              value={ratings.safety}
              onChange={(v: number) => setRatings({...ratings, safety: v})}
            />
          </div>

          {/* Text Fields */}
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <Input
              value={title}
              onChange={(e: any) => setTitle(e.target.value)}
              placeholder="Ex: Excelente viagem, motorista muito educado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Comentário</label>
            <Textarea
              value={comment}
              onChange={(e: any) => setComment(e.target.value)}
              placeholder="Conte mais sobre sua experiência..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pontos Positivos (Opcional)</label>
            <Textarea
              value={pros}
              onChange={(e: any) => setPros(e.target.value)}
              placeholder="O que foi bom?"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pontos a Melhorar (Opcional)</label>
            <Textarea
              value={cons}
              onChange={(e: any) => setCons(e.target.value)}
              placeholder="O que poderia melhorar?"
              rows={2}
            />
          </div>

          {/* Button */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 2️⃣ PÁGINA: Ver Reviews de Motorista

**Local:** `frontend/src/apps/rides-app/pages/driver-profile-reviews.tsx` (NOVO)

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Star, MessageCircle } from 'lucide-react';

export default function DriverProfileReviews({ driverId }: { driverId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [driverId]);

  const loadReviews = async () => {
    try {
      const res = await fetch(`/api/drivers/${driverId}/reviews`);
      const data = await res.json();
      
      setReviews(data);
      
      if (data.length > 0) {
        const avg = data
          .filter((r: any) => r.overall_rating)
          .reduce((sum: number, r: any) => sum + Number(r.overall_rating), 0) / data.length;
        setAvgRating(avg);
      }
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando reviews...</div>;

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={16}
          className={star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">{reviews.length} reviews</p>
            </div>
            <div className="flex-1">
              <StarDisplay rating={avgRating} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <p className="text-center text-gray-500">Sem reviews ainda</p>
      ) : (
        reviews.map(review => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{review.title}</p>
                  <StarDisplay rating={review.overall_rating} />
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{review.comment}</p>

              {review.pros && (
                <div className="text-xs bg-green-50 p-2 rounded mb-2">
                  <strong>✅ Pontos Positivos:</strong> {review.pros}
                </div>
              )}

              {review.cons && (
                <div className="text-xs bg-red-50 p-2 rounded mb-2">
                  <strong>⚠️ Pontos a Melhorar:</strong> {review.cons}
                </div>
              )}

              {review.driver_response && (
                <div className="bg-blue-50 p-2 rounded mt-3 text-xs border-l-4 border-blue-500">
                  <p className="font-semibold mb-1 flex items-center gap-1">
                    <MessageCircle size={14} /> Resposta do Motorista:
                  </p>
                  <p>{review.driver_response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
```

---

### 3️⃣ PÁGINA: Hotel Payment Settings

**Local:** `frontend/src/apps/hotels-app/pages/payment-settings.tsx` (NOVO)

_Copiar exatamente do documento: `GUIA_RAPIDO_PAGAMENTOS_FLEXIVEIS.md` - secção **FASE 2**_

---

### 4️⃣ PÁGINA: Driver Payment Settings

**Local:** `frontend/src/apps/drivers-app/pages/payment-settings.tsx` (NOVO)

_Copiar exatamente do documento: `GUIA_RAPIDO_PAGAMENTOS_FLEXIVEIS.md` - secção **FASE 3**_

---

### 5️⃣ UPDATE: Admin Dashboard - Payments

**Local:** `frontend/src/apps/admin-app/pages/payments.tsx`

Actualizar para mostrar pagamentos pendentes:

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AlertCircle, TrendingUp } from 'lucide-react';

export default function AdminPaymentsDashboard() {
  const [payments, setPayments] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments/summary', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` }
      });
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <TrendingUp className="w-8 h-8" />
        Gestão de Pagamentos
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-sm">Receita Total</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              R$ {(payments?.summary?.total_gross || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-sm">Comissão (12%)</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              R$ {(payments?.summary?.total_commission || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-sm">Reservas Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-orange-600">
              {payments?.summary?.total_items || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <span>🏨 Hotéis</span>
            <span className="font-semibold">{payments?.summary?.by_type?.hotels}</span>
          </div>
          <div className="flex justify-between">
            <span>🎉 Eventos</span>
            <span className="font-semibold">{payments?.summary?.by_type?.events}</span>
          </div>
          <div className="flex justify-between">
            <span>🚗 Viagens</span>
            <span className="font-semibold">{payments?.summary?.by_type?.rides}</span>
          </div>
        </CardContent>
      </Card>

      {/* Alert */}
      {(payments?.summary?.total_items || 0) > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded flex gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">⚠️ Pagamentos Pendentes</p>
            <p>Você tem {payments?.summary?.total_items} reservas aguardando pagamento</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ BACKEND

- [ ] 1. Executar SQL: `SQL_TODAS_TABELAS_CRIAR_BANCO.sql`
- [ ] 2. Criar: `rideReviewService.ts`
- [ ] 3. Criar: `paymentPolicyService.ts`
- [ ] 4. Criar: `reviews.ts` (endpoints)
- [ ] 5. Criar: `payments.ts` (endpoints)
- [ ] 6. Criar: `autoConfirmBookings.ts` (job)
- [ ] 7. Actualizar: `routes/index.ts` (registar rotas)
- [ ] 8. Actualizar: `adminService.ts` (getPaymentReferences)
- [ ] 9. Testar endpoints com Postman

### ✅ FRONTEND

- [ ] 1. Criar: `ride-review.tsx` (deixar review)
- [ ] 2. Criar: `driver-profile-reviews.tsx` (ver reviews)
- [ ] 3. Criar: `payment-settings.tsx` (hotel)
- [ ] 4. Criar: `payment-settings.tsx` (driver)
- [ ] 5. Actualizar: `payments.tsx` (admin dashboard)
- [ ] 6. Testar fluxo de reviews
- [ ] 7. Testar fluxo de payment settings

### ✅ TESTES

- [ ] 1. Criar review como passageiro
- [ ] 2. Ver reviews de motorista
- [ ] 3. Hotel configurar política de pagamento
- [ ] 4. Motorista configurar política
- [ ] 5. Admin ver pagamentos na dashboard

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Hoje (Você):**
   - Copiar/colar SQL no pgAdmin
   - Executar tudo (será automático)
   - Confirmar que tabelas foram criadas

2. **Eu (Próxima interação):**
   - Modificar ficheiros backend (adminService, routes)
   - Criar ficheiros novos backend (services, jobs)
   - Modificar ficheiros frontend (pages)
   - Testar tudo

3. **Deploy:**
   - Migrar para staging
   - Testes E2E
   - Deploy em produção

---

**Documento gerado:** 27/02/2026
**Status:** Pronto para implementação
