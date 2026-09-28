import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import * as hotelBookingService from '../src/modules/hotels/hotelBookingService';

const router = express.Router();

/**
 * POST /api/hotel-bookings/:bookingId/checkout
 * Faz checkout de uma reserva de hotel e cria automaticamente a comissão
 */
router.post('/:bookingId/checkout', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const bookingId = req.params.bookingId;

    // Validar usuário
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação necessária',
      });
    }

    // ✅ Usar o método checkOutBooking() do serviço (já tem gancho de comissão)
    const booking = await hotelBookingService.checkOutBooking(bookingId, userId || 'system');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking não encontrado',
      });
    }

    console.log(`✅ Hotel booking ${bookingId} checked out via hotelBookingService.checkOutBooking()`);

    res.json({
      success: true,
      message: 'Checkout realizado com sucesso',
      bookingId,
    });
  } catch (error: any) {
    console.error('Erro ao fazer checkout de hotel:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fazer checkout de hotel',
    });
  }
});

export default router;
