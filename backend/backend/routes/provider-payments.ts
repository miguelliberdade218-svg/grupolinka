import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import providerPaymentService from '../src/modules/payments/providerPaymentService';

const router = express.Router();

// ✅ Multer: upload de comprovativos para disco
const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'commission-proofs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo nao permitido. Use JPG, PNG, WebP ou PDF.'));
  },
});

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
router.post('/:paymentId/mark-paid', verifyFirebaseToken, uploadProof.single('proofFile'), async (req, res) => {
  try {
    const userId = req.user?.uid;
        const paymentId = req.params.paymentId; // UUID string (NÃO usar parseInt)
    const notes = req.body?.notes;
    // ✅ URL do comprovativo: ficheiro enviado OU URL no body (fallback)
    const proofUrl = req.file
      ? `/uploads/commission-proofs/${req.file.filename}`
      : (req.body?.proofUrl || req.body?.proof_image_url);

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
router.post('/:paymentId/upload-proof', verifyFirebaseToken, uploadProof.single('proofFile'), async (req, res) => {
  try {
    const userId = req.user?.uid;
        const paymentId = req.params.paymentId; // UUID string (NÃO usar parseInt)
    const notes = req.body?.notes;
    // ✅ URL do comprovativo: ficheiro enviado OU URL no body (fallback)
    const proofUrl = req.file
      ? `/uploads/commission-proofs/${req.file.filename}`
      : (req.body?.proofUrl || req.body?.proof_image_url);

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
