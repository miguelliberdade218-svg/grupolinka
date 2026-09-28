import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import { rideService } from '../src/services/rideService';

const router = express.Router();

/**
 * POST /api/rides/:rideId/complete
 * Marca uma ride como completa e cria automaticamente a comissão
 */
router.post('/:rideId/complete', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const rideId = req.params.rideId;

    // Validar usuário
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária',
      });
    }

    // ✅ Usar o método do serviço que já tem validações + gancho de comissão
    const ride = await rideService.completeRide(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Ride não encontrada',
      });
    }

    console.log(`✅ Ride ${rideId} completada via rideService.completeRide()`);

    res.json({
      success: true,
      message: 'Ride completada com sucesso',
      rideId,
    });
  } catch (error: any) {
    console.error('Erro ao completar ride:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao completar ride',
    });
  }
});

export default router;
