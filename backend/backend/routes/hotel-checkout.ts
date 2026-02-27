import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import { db } from '../db';
import { hotelBookings, hotels } from '../shared/schema';
import { eq } from 'drizzle-orm';
import providerPaymentService from '../src/modules/payments/providerPaymentService';

const router = express.Router();

/**
 * POST /api/hotel-bookings/:bookingId/checkout
 * Faz checkout de uma reserva de hotel e cria automaticamente a comissão
 */
router.post('/:bookingId/checkout', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const bookingId = req.params.bookingId;

    // Buscar a booking
    const bookingData = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (!bookingData || bookingData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Booking de hotel não encontrada',
      });
    }

    const booking = bookingData[0];

    // Buscar hotel para verificar acesso
    const hotelData = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, booking.hotel_id))
      .limit(1);

    if (!hotelData || hotelData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado',
      });
    }

    const hotel = hotelData[0];

    // Verificar se o usuário é o gerente do hotel ou admin
    // (Simplificado - idealmente verificar se é admin ou manager do hotel)
    if (hotel.manager_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado: você não é o gerente deste hotel',
      });
    }

    // Atualizar status da booking
    await db.update(hotelBookings)
      .set({
        status: 'checked_out',
        payment_status: 'completed',
        checked_out_at: new Date(),
      })
      .where(eq(hotelBookings.id, bookingId));

    console.log(`✅ Hotel booking ${bookingId} marcada como checked-out`);

    // Criar comissão automaticamente
    const commission = await providerPaymentService.createHotelCommission(bookingId);

    res.json({
      success: true,
      message: 'Checkout realizado com sucesso',
      bookingId,
      commission,
    });
  } catch (error: any) {
    console.error('Erro ao fazer checkout de hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer checkout de hotel',
      details: error.message,
    });
  }
});

export default router;
