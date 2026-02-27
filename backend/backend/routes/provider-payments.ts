import express from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import providerPaymentService from '../src/modules/payments/providerPaymentService';

const router = express.Router();

/**
 * GET /api/provider/payments
 * Lista todas as comissões do provedor autenticado
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;

    const result = await providerPaymentService.getProviderCommissions(userId, {
      page,
      limit,
      status,
      type,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Erro ao listar comissões:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar comissões',
      details: error.message,
    });
  }
});

/**
 * POST /api/provider/payments/:paymentId/mark-paid
 * Marca uma comissão como paga (aguardando confirmação do admin)
 */
router.post('/:paymentId/mark-paid', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const paymentId = parseInt(req.params.paymentId);
    const { proofUrl, notes } = req.body;

    const result = await providerPaymentService.markAsPaid(
      paymentId,
      userId,
      proofUrl,
      notes
    );

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao marcar como pago:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao marcar como pago',
      details: error.message,
    });
  }
});

/**
 * POST /api/provider/payments/:paymentId/upload-proof
 * Faz upload da prova de pagamento (comprovativo)
 */
router.post('/:paymentId/upload-proof', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const paymentId = parseInt(req.params.paymentId);
    const { proofUrl, notes } = req.body;

    // TODO: Integrar upload de arquivo (S3/Firebase Storage)
    // Por enquanto, apenas armazenar URL

    const result = await providerPaymentService.markAsPaid(
      paymentId,
      userId,
      proofUrl,
      notes
    );

    res.json({
      success: true,
      message: 'Comprovativa de pagamento enviado com sucesso',
      ...result,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de comprovativa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload de comprovativa',
      details: error.message,
    });
  }
});

export default router;
