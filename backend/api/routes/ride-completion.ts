// backend/api/routes/ride-completion.ts
/**
 * Rotas para conclusão de rides
 * Ao marcar como concluído, sistema cria comissão automaticamente
 */

import express, { Request, Response } from "express";
import { db } from "../../server/db";
import { rides } from "../../shared/schema";
import { providerPaymentService } from "../../src/modules/payments/providerPaymentService";
import { verifyFirebaseToken } from "../middleware/auth";
import { eq } from "drizzle-orm";

const router = express.Router();

// Middleware: verificar autenticação
router.use(verifyFirebaseToken);

// ==================== MARCAR RIDE COMO COMPLETADO ====================
/**
 * POST /api/rides/:rideId/complete
 * Marca ride como completado e cria comissão automática
 * Body: { confirmationCode? }
 */
router.post("/:rideId/complete", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { rideId } = req.params;
    const { confirmationCode } = req.body;

    // 1. Verificar que ride existe e pertence ao motorista
    const rideData = await db
      .select()
      .from(rides)
      .where(eq(rides.id, rideId))
      .limit(1);

    if (!rideData.length) {
      return res.status(404).json({
        success: false,
        error: "Ride não encontrada",
      });
    }

    const ride = rideData[0];

    if (ride.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Você não é o motorista desta corrida",
      });
    }

    // 2. Atualizar status da ride
    await db
      .update(rides)
      .set({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .where(eq(rides.id, rideId));

    // 3. Criar comissão automaticamente
    const commission = await providerPaymentService.createRideCommission(
      rideId
    );

    console.log(
      `✅ [RIDE] Ride ${rideId} completada e comissão criada para motorista`
    );

    res.json({
      success: true,
      message: "Ride concluída com sucesso",
      rideId,
      commission: {
        referenceNumber: commission.paymentReference,
        amount: commission.amount,
        dueDate: commission.dueDate,
        message: `Você tem até ${commission.dueDate} para pagar MZN ${commission.amount.toFixed(2)} de comissão`,
      },
    });
  } catch (error: any) {
    console.error("Erro em POST /api/rides/:rideId/complete:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao concluir ride",
    });
  }
});

export default router;
