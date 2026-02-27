import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import { db } from '../db';
import { rides } from '../shared/schema';
import { eq } from 'drizzle-orm';
import providerPaymentService from '../src/modules/payments/providerPaymentService';

const router = express.Router();

/**
 * POST /api/rides/:rideId/complete
 * Marca uma ride como completa e cria automaticamente a comissão
 */
router.post('/:rideId/complete', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const rideId = req.params.rideId;

    // Buscar a ride
    const rideData = await db
      .select()
      .from(rides)
      .where(eq(rides.id, rideId))
      .limit(1);

    if (!rideData || rideData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ride não encontrada',
      });
    }

    const ride = rideData[0];

    // Verificar se o usuário é o driver
    if (ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado: você não é o driver desta ride',
      });
    }

    // Atualizar status da ride
    await db.update(rides)
      .set({
        status: 'completed',
        completed_at: new Date(),
      })
      .where(eq(rides.id, rideId));

    console.log(`✅ Ride ${rideId} marcada como completa`);

    // Criar comissão automaticamente
    const commission = await providerPaymentService.createRideCommission(rideId);

    res.json({
      success: true,
      message: 'Ride completada com sucesso',
      rideId,
      commission,
    });
  } catch (error: any) {
    console.error('Erro ao completar ride:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao completar ride',
      details: error.message,
    });
  }
});

export default router;
