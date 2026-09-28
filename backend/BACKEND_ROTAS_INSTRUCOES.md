# 🔧 INSTRUÇÕES PARA ADICIONAR ROTAS - BACKEND

## 📍 LOCALIZAÇÕES IMPORTANTES

Baseado na análise do seu projeto:
- Express server está em: `backend/server.js`
- Admin service está em: `backend/src/modules/admin/adminService.ts`
- Novos services criados:
  - `backend/src/modules/reviews/rideReviewService.ts` ✅
  - `backend/src/modules/payments/paymentPolicyService.ts` ✅
  - `backend/src/jobs/autoConfirmBookingsJob.ts` ✅

---

##  1️⃣ CRIAR: Ficheiro de Rotas para Reviews

**Local:** `backend/api/routes/reviews.ts` (NOVO FICHEIRO)

```typescript
import { Router } from 'express';
import { rideReviewService } from '../../src/modules/reviews/rideReviewService';
import { verifyFirebaseToken } from '../../middleware/auth'; // Ajuste path conforme necessário

const router = Router();

// POST: Criar review de passageiro
router.post('/rides/:rideId/reviews', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { rideId } = req.params;
    const passengerId = req.user.id;

    const result = await rideReviewService.createPassengerReview({
      ...req.body,
      ride_id: rideId,
      from_user_id: passengerId
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Criar review de motorista
router.post('/rides/:rideId/reviews/driver', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user.id;

    const result = await rideReviewService.createDriverReview({
      ...req.body,
      ride_id: rideId,
      from_driver_id: driverId
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Reviews de um motorista
router.get('/drivers/:driverId/reviews', async (req: any, res: any) => {
  try {
    const reviews = await rideReviewService.getDriverReviews(req.params.driverId);
    const stats = await rideReviewService.getDriverStats(req.params.driverId);
    res.json({ reviews, stats });
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

// GET: Reviews recebidas por passageiro
router.get('/passengers/:passengerId/reviews', async (req: any, res: any) => {
  try {
    const reviews = await rideReviewService.getPassengerReviews(req.params.passengerId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Resposta do motorista a um review
router.post('/reviews/:reviewId/respond', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { response } = req.body;
    await rideReviewService.respondToReview(req.params.reviewId, response);
    res.json({ success: true, message: 'Resposta adicionada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 2️⃣ CRIAR: Ficheiro de Rotas para Pagamentos

**Local:** `backend/api/routes/payments.ts` (NOVO FICHEIRO)

```typescript
import { Router } from 'express';
import { paymentPolicyService } from '../../src/modules/payments/paymentPolicyService';
import { verifyFirebaseToken } from '../../middleware/auth'; // Ajuste path
import { adminService } from '../../src/modules/admin/adminService';
import { db } from '../../db';
import { hotels, users, eventSpaces } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ==================== HOTEL PAYMENT POLICIES ====================

// GET: Política de pagamento de um hotel
router.get('/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { hotelId } = req.params;
    
    // Verificar propriedade (opcional, pode ser público)
    const policy = await paymentPolicyService.getHotelPaymentPolicy(hotelId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Atualizar política de pagamento de um hotel
router.post('/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { hotelId } = req.params;
    const policyData = req.body;

    // Validar propriedade
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);
    
    if (!hotel[0] || hotel[0].host_id !== req.user.id) {
      return res.status(403).json({ error: 'Não tem permissão' });
    }

    // Validar percentagens
    if (policyData.advance_payment_percentage > 100 || policyData.advance_payment_percentage < 0) {
      return res.status(400).json({ error: 'Percentagem de pré-pagamento inválida' });
    }
    if (policyData.deposit_percentage > 100 || policyData.deposit_percentage < 0) {
      return res.status(400).json({ error: 'Percentagem de depósito inválida' });
    }

    await paymentPolicyService.updateHotelPaymentPolicy(hotelId, policyData);
    
    const updatedPolicy = await paymentPolicyService.getHotelPaymentPolicy(hotelId);
    res.json({
      success: true,
      message: 'Política de pagamento atualizada',
      policy: updatedPolicy
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DRIVER PAYMENT POLICIES ====================

// GET: Política de pagamento de um motorista
router.get('/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { driverId } = req.params;

    // Verificar se é o próprio motorista ou admin
    if (driverId !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Não tem permissão' });
    }

    const policy = await paymentPolicyService.getDriverPaymentPolicy(driverId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Atualizar política de pagamento de um motorista
router.post('/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { driverId } = req.params;
    const policyData = req.body;

    // Verificar se é o próprio motorista
    if (driverId !== req.user.id) {
      return res.status(403).json({ error: 'Não tem permissão' });
    }

    // Validações
    if (policyData.advance_payment_percentage && policyData.advance_payment_percentage > 100) {
      return res.status(400).json({ error: 'Percentagem não pode ser > 100%' });
    }

    await paymentPolicyService.updateDriverPaymentPolicy(driverId, policyData);
    
    const updatedPolicy = await paymentPolicyService.getDriverPaymentPolicy(driverId);
    res.json({
      success: true,
      message: 'Sua política de pagamento foi atualizada',
      policy: updatedPolicy
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENT SPACE PAYMENT POLICIES ====================

// GET: Política de pagamento de um event space
router.get('/event-spaces/:eventSpaceId/payment-policy', async (req: any, res: any) => {
  try {
    const { eventSpaceId } = req.params;
    const policy = await paymentPolicyService.getEventSpacePaymentPolicy(eventSpaceId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Atualizar política de pagamento de um event space
router.post('/event-spaces/:eventSpaceId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const { eventSpaceId } = req.params;
    const policyData = req.body;

    // Verificar propriedade (gestor do event space)
    const eventSpace = await db.select()
      .from(eventSpaces)
      .where(eq(eventSpaces.id, eventSpaceId))
      .limit(1);
    
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, eventSpace[0]?.hotel_id))
      .limit(1);

    if (!hotel[0] || (hotel[0].host_id !== req.user.id && !req.user.is_admin)) {
      return res.status(403).json({ error: 'Não tem permissão' });
    }

    await paymentPolicyService.updateEventSpacePaymentPolicy(eventSpaceId, policyData);
    
    const updatedPolicy = await paymentPolicyService.getEventSpacePaymentPolicy(eventSpaceId);
    res.json({
      success: true,
      message: 'Política de pagamento atualizada',
      policy: updatedPolicy
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// GET: Summary de pagamentos para admin
router.get('/admin/payments/summary', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    // Verificar se é admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Apenas admins podem acessar' });
    }

    const stats = await adminService.getPaymentStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 3️⃣ REGISTAR ROTAS NO SERVIDOR

Você precisa adicionar as rotas ao seu servidor Express.

**Procure por um ficheiro que configure Express (pode ser `server.js`, `app.js`, ou similar)** e adicione:

```javascript
// No topo do ficheiro, com as outras imports:
import reviewsRouter from './api/routes/reviews.ts';
import paymentsRouter from './api/routes/payments.ts';

// Depois, onde as rotas são registadas (procure por `app.use`):
app.use('/api', reviewsRouter);
app.use('/api', paymentsRouter);

// IMPORTANTE: Registar o job de auto-confirmação a cada 5 minutos
import { autoConfirmBookingsJob } from './src/jobs/autoConfirmBookingsJob.ts';

setInterval(async () => {
  await autoConfirmBookingsJob.executeAutoConfirmations();
}, 5 * 60 * 1000); // 5 minutos
```

---

## 4️⃣ ATUALIZAR: AdminService - Pagamentos

**Local:** `backend/src/modules/admin/adminService.ts`

Adicione um NOVO método ao `adminService` (no final do objeto):

```typescript
// Adicione DEPOIS do método getPaymentStats():

async getPaymentsSummary() {
  try {
    // Buscar hotel bookings confirmados não pagos
    const hotelBookingsPending = await db.select({
      id: hotelBookings.id,
      type: sql`'hotel'`,
      guestId: hotelBookings.guestId,
      hotelId: hotelBookings.hotel_id,
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

    // Buscar event bookings não cancelados e não pagos
    const eventBookingsPending = await db.select({
      id: eventBookings.id,
      type: sql`'event'`,
      guestId: eventBookings.guestId,
      totalPrice: eventBookings.totalPrice,
      status: eventBookings.status,
      paymentStatus: eventBookings.payment_status
    })
      .from(eventBookings)
      .where(
        and(
          ne(eventBookings.status, 'cancelled'),
          ne(eventBookings.payment_status, 'complete')
        )
      );

    // Buscar rides completados (comissões a cobrar)
    const ridesPending = await db.select({
      id: rides.id,
      type: sql`'ride'`,
      driverId: rides.driver_id,
      totalPrice: rides.totalAmount,
      status: rides.status
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
      summary: {
        total_gross: allReservations.reduce((sum, r) => sum + Number(r.totalPrice), 0),
        total_commission: allReservations.reduce((sum, r) => sum + Number(r.commission), 0),
        total_items: allReservations.length,
        by_type: {
          hotels: hotelBookingsPending.length,
          events: eventBookingsPending.length,
          rides: ridesPending.length
        }
      },
      pendingReservations: allReservations
    };
  } catch (error: any) {
    console.error('Erro em getPaymentsSummary:', error);
    return { summary: {}, pendingReservations: [] };
  }
},
```

---

## ✅ VERIFICAÇÃO

Após fazer as mudanças acima:

1. **Verificar SQL** - Você já criou as tabelas ✅
2. **Verificar Backend Services** - Você já criou os ficheiros ✅
   - `backend/src/modules/reviews/rideReviewService.ts`
   - `backend/src/modules/payments/paymentPolicyService.ts`
   - `backend/src/jobs/autoConfirmBookingsJob.ts`
3. **Adicionar Rotas** - Você precisa fazer isto ⏳
   - Criar `backend/api/routes/reviews.ts`
   - Criar `backend/api/routes/payments.ts`
   - Registar no servidor Express
4. **Atualizar AdminService** - Você precisa fazer isto ⏳
   - Adicionar o método `getPaymentsSummary()`

---

**Documentação gerada:** 27/02/2026
