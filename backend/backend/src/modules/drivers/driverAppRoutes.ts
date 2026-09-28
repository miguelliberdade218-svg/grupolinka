import express from 'express';
import { verifyFirebaseToken } from '../../shared/firebaseAuth';
import { db } from '../../../db';
import { rides, users, commission_payments } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = express.Router();

// Dashboard do motorista
router.get('/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, req.params.userId)).limit(1);
    if (!user.length) return res.status(404).json({ success: false });
    res.json({ success: true, data: user[0] });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.get('/:userId/routes', verifyFirebaseToken, async (req, res) => {
  try {
    const q = [eq(rides.driverId, req.params.userId)];
    if (req.query.status) q.push(eq(rides.status, req.query.status));
    const rows = await db.select().from(rides).where(and(...q)).orderBy(desc(rides.departureDate));
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.get('/:userId/earnings', verifyFirebaseToken, async (req, res) => {
  try {
    const rows = await db.select().from(rides).where(and(eq(rides.driverId, req.params.userId), eq(rides.status, 'completed')));
    const total = rows.reduce((s, x) => s + parseFloat(x.pricePerSeat || '0') * (x.maxPassengers || 4), 0);
    res.json({ success: true, data: { total, ridesCount: rows.length } });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.get('/:userId/reviews', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM ride_reviews WHERE to_user_id = ${req.params.userId} ORDER BY created_at DESC`);
    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

// Gestao de viagens
router.get('/rides/my-rides/:driverId', verifyFirebaseToken, async (req, res) => {
  try {
    const q = [eq(rides.driverId, req.params.driverId)];
    if (req.query.status && req.query.status !== 'all') q.push(eq(rides.status, req.query.status));
    const rows = await db.select().from(rides).where(and(...q)).orderBy(desc(rides.departureDate));
    res.json({ success: true, total: rows.length, rides: rows });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.patch('/rides/:rideId/start', verifyFirebaseToken, async (req, res) => {
  try {
    const ride = await db.select().from(rides).where(eq(rides.id, req.params.rideId)).limit(1);
    if (!ride.length) return res.status(404).json({ success: false, error: 'Viagem nao encontrada' });
    if (ride[0].status !== 'active') return res.status(400).json({ success: false, error: 'Viagem nao pode ser iniciada' });
    await db.update(rides).set({ status: 'in_progress', updatedAt: new Date() }).where(eq(rides.id, req.params.rideId));
    res.json({ success: true, message: 'Corrida iniciada' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

// ⚠️ DEPRECATED: Este endpoint usava taxa fixa de 15% e gravava em commission_payments.
// Agora delega no providerPaymentService (taxa dinâmica de platformFeeConfig, tabela payment_references).
router.post('/rides/:rideId/complete-with-commission', verifyFirebaseToken, async (req, res) => {
  try {
    const ride = await db.select().from(rides).where(eq(rides.id, req.params.rideId)).limit(1);
    if (!ride.length) return res.status(404).json({ success: false, error: 'Viagem nao encontrada' });

    await db.update(rides).set({ status: 'completed', updatedAt: new Date() }).where(eq(rides.id, req.params.rideId));

    const providerPaymentService = (await import('../payments/providerPaymentService')).default;
    const commission = await providerPaymentService.createRideCommission(req.params.rideId);

    res.json({
      success: true,
      message: 'Corrida completa! Comissao gerada.',
      commission,
    });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

// Comissoes
router.get('/ride', verifyFirebaseToken, async (req, res) => {
  try {
    if (!req.query.driverId) return res.status(400).json({ success: false, error: 'driverId obrigatorio' });
    const q = [eq(commission_payments.provider_id, req.query.driverId)];
    if (req.query.status) q.push(eq(commission_payments.status, req.query.status));
    const rows = await db.select().from(commission_payments).where(and(...q)).orderBy(desc(commission_payments.created_at));
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.get('/ride/all', verifyFirebaseToken, async (req, res) => {
  try {
    const q = [];
    if (req.query.status) q.push(eq(commission_payments.status, req.query.status));
    if (req.query.driverId) q.push(eq(commission_payments.provider_id, req.query.driverId));
    const rows = await db.select().from(commission_payments).where(q.length ? and(...q) : undefined).orderBy(desc(commission_payments.created_at));
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.post('/ride/:commissionId/pay', verifyFirebaseToken, async (req, res) => {
  try {
    const commission = await db.select().from(commission_payments).where(eq(commission_payments.id, req.params.commissionId)).limit(1);
    if (!commission.length) return res.status(404).json({ success: false, error: 'Comissao nao encontrada' });
    if (commission[0].status !== 'pending') return res.status(400).json({ success: false, error: 'Comissao ja processada' });
    await db.update(commission_payments).set({ status: 'verified', updated_at: new Date() }).where(eq(commission_payments.id, req.params.commissionId));
    res.json({ success: true, message: 'Comprovativo enviado! Aguardando confirmacao.' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.patch('/ride/:commissionId/confirm', verifyFirebaseToken, async (req, res) => {
  try {
    const commission = await db.select().from(commission_payments).where(eq(commission_payments.id, req.params.commissionId)).limit(1);
    if (!commission.length) return res.status(404).json({ success: false, error: 'Comissao nao encontrada' });
    await db.update(commission_payments).set({ status: 'verified', verified_at: new Date(), updated_at: new Date() }).where(eq(commission_payments.id, req.params.commissionId));
    res.json({ success: true, message: 'Pagamento confirmado!' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

router.patch('/ride/:commissionId/reject', verifyFirebaseToken, async (req, res) => {
  try {
    if (!req.body.reason) return res.status(400).json({ success: false, error: 'Motivo da rejeicao obrigatorio' });
    const commission = await db.select().from(commission_payments).where(eq(commission_payments.id, req.params.commissionId)).limit(1);
    if (!commission.length) return res.status(404).json({ success: false, error: 'Comissao nao encontrada' });
    await db.update(commission_payments).set({ status: 'rejected', notes: req.body.reason, verified_at: new Date(), updated_at: new Date() }).where(eq(commission_payments.id, req.params.commissionId));
    res.json({ success: true, message: 'Pagamento rejeitado' });
  } catch (e) { res.status(500).json({ success: false, error: String(e) }); }
});

export default router;
