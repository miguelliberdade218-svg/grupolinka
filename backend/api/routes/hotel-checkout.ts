// backend/api/routes/hotel-checkout.ts
/**
 * Rotas para checkout de reservas de hotel
 * Ao fazer checkout, sistema cria comissão automaticamente
 */

import express, { Request, Response } from "express";
import { db } from "../../server/db";
import { hotelBookings } from "../../shared/schema";
import { providerPaymentService } from "../../src/modules/payments/providerPaymentService";
import { verifyFirebaseToken } from "../middleware/auth";
import { eq } from "drizzle-orm";

const router = express.Router();

// Middleware: verificar autenticação
router.use(verifyFirebaseToken);

// ==================== MARCAR HOTEL CHECKOUT ====================
/**
 * POST /api/hotel-bookings/:bookingId/checkout
 * Marca reserva como completada/paga e cria comissão automática
 * Body: { paymentMethod?, paymentReference?, amount? }
 */
router.post("/:bookingId/checkout", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { bookingId } = req.params;
    const { paymentMethod, paymentReference, amount } = req.body;

    // 1. Verificar que booking existe
    const bookingData = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (!bookingData.length) {
      return res.status(404).json({
        success: false,
        error: "Reserva não encontrada",
      });
    }

    const booking = bookingData[0];

    // 2. Verificar que é o hotel manager ou admin
    if (booking.userId !== userId && !(req as any).user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para fazer checkout desta reserva",
      });
    }

    // 3. Atualizar status da reserva
    await db
      .update(hotelBookings)
      .set({
        status: "checked_out", // ou "completed"
        paymentStatus: "completed",
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
        checkedOutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(hotelBookings.id, bookingId));

    // 4. Criar comissão automaticamente
    const commission = await providerPaymentService.createHotelCommission(
      bookingId
    );

    console.log(
      `✅ [HOTEL] Checkout realizado para reserva ${bookingId} e comissão criada`
    );

    res.json({
      success: true,
      message: "Checkout realizado com sucesso",
      bookingId,
      commission: {
        referenceNumber: commission.paymentReference,
        amount: commission.amount,
        dueDate: commission.dueDate,
        message: `Você tem até ${commission.dueDate} para pagar MZN ${commission.amount.toFixed(2)} de comissão`,
      },
    });
  } catch (error: any) {
    console.error("Erro em POST /api/hotel-bookings/:bookingId/checkout:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao realizar checkout",
    });
  }
});

export default router;
