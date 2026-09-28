import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import * as eventBookingService from '../src/modules/events/eventBookingService';

const router = express.Router();

/**
 * POST /api/events/bookings/:bookingId/check-out
 * ✅ NOVA ROTA: Faz check-out de uma reserva de evento e cria automaticamente a comissão
 * - Atualiza status para 'completed'
 * - Cria comissão via providerPaymentService.createEventCommission (não bloqueante)
 */
router.post('/bookings/:bookingId/check-out', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const bookingId = req.params.bookingId;

    console.log(`🔗 [EVENT-CHECKOUT] Iniciando check-out da reserva de evento ${bookingId}`);

    // ✅ Usar o método checkOutEventBooking() do serviço (cria comissão automaticamente)
    const booking = await eventBookingService.checkOutEventBooking(bookingId, userId || 'system');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Reserva de evento não encontrada',
      });
    }

    console.log(`✅ [EVENT-CHECKOUT] Reserva de evento ${bookingId} completada com sucesso`);

    res.json({
      success: true,
      message: 'Check-out de evento realizado com sucesso. Comissão será processada.',
      bookingId: booking.id,
      status: booking.status,
    });
  } catch (error: any) {
    console.error('❌ [EVENT-CHECKOUT] Erro ao fazer check-out de evento:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fazer check-out de evento',
    });
  }
});

export default router;