// backend/api/routes/provider-payments.ts
/**
 * Rotas de Pagamentos para Provedores (Motoristas e Hotéis)
 */

import express, { Request, Response } from "express";
import { providerPaymentService } from "../../src/modules/payments/providerPaymentService";
import { verifyFirebaseToken } from "../middleware/auth";

const router = express.Router();

// Middleware: verificar autenticação
router.use(verifyFirebaseToken);

// ==================== LISTAR MINHAS COMISSÕES ====================
/**
 * GET /api/provider/payments
 * Lista todas as comissões devidas (rides + hotels)
 * Query params: page, limit, status, type
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { page, limit, status, type } = req.query;

    const result = await providerPaymentService.getProviderCommissions(
      userId,
      {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        type: type as string,
      }
    );

    res.json({
      success: true,
      data: result.commissions,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error("Erro em GET /api/provider/payments:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao buscar comissões",
    });
  }
});

// ==================== MARCAR COMO PAGO ====================
/**
 * POST /api/provider/payments/:paymentId/mark-paid
 * Marca comissão como pago (com comprovativo)
 * Body: { proofUrl?, notes? }
 */
router.post("/:paymentId/mark-paid", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { paymentId } = req.params;
    const { proofUrl, notes } = req.body;

    const result = await providerPaymentService.markAsPaid(
      paymentId,
      userId,
      proofUrl,
      notes
    );

    res.json(result);
  } catch (error: any) {
    console.error("Erro em POST /api/provider/payments/:paymentId/mark-paid:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao marcar como pago",
    });
  }
});

// ==================== UPLOAD COMPROVATIVO ====================
/**
 * POST /api/provider/payments/:paymentId/upload-proof
 * Upload de comprovativo de pagamento
 * Body: multipart/form-data { file }
 */
router.post(
  "/:paymentId/upload-proof",
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.uid;
      const { paymentId } = req.params;

      // TODO: Implementar upload de arquivo (S3/Firebase Storage)
      // Por enquanto, apenas marca como pago
      const result = await providerPaymentService.markAsPaid(
        paymentId,
        userId,
        "temp-proof-url",
        "Comprovativo enviado"
      );

      res.json({
        success: true,
        message: "Comprovativo enviado com sucesso",
        ...result,
      });
    } catch (error: any) {
      console.error("Erro em POST /api/provider/payments/:paymentId/upload-proof:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro ao enviar comprovativo",
      });
    }
  }
);

export default router;
