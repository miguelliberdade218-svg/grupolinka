// Commission Routes - Endpoints para sistema de comissões

import express from 'express';
import { requireAuth, requireAdminAuth } from '../../shared/middleware/auth';
import CommissionService from './commissionService';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/commission-proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, WebP ou PDF.'));
    }
  }
});

// ==================== ENDPOINTS PARA PROVEDORES ====================

/**
 * GET /api/providers/commissions
 * Lista comissões do provedor autenticado
 */
router.get('/providers/commissions', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;
    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const filters = {
      provider_id: providerId,
      provider_type: req.query.provider_type as 'hotel' | 'driver' | 'event_space',
      status: req.query.status as 'pending' | 'verified' | 'rejected',
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await CommissionService.getCommissions(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao listar comissões:', error);
    res.status(500).json({ 
      error: 'Erro ao listar comissões', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/providers/commissions/:commissionId/submit-proof
 * Provedor submete comprovante de pagamento
 */
router.post('/providers/commissions/:commissionId/submit-proof', 
  requireAuth, 
  upload.single('proof_image'), 
  async (req, res) => {
    try {
      const providerId = req.user?.uid;
      const { commissionId } = req.params;
      
      if (!providerId) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Comprovante de pagamento é obrigatório' });
      }

      const proofImageUrl = `/uploads/commission-proofs/${req.file.filename}`;
      
      const result = await CommissionService.submitPaymentProof(
        commissionId,
        providerId,
        {
          payment_method: req.body.payment_method,
          payment_reference: req.body.payment_reference,
          proof_image_url: proofImageUrl,
          notes: req.body.notes,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('❌ Erro ao submeter comprovante:', error);
      res.status(500).json({ 
        error: 'Erro ao submeter comprovante', 
        details: (error as Error).message 
      });
    }
  }
);

/**
 * GET /api/providers/commissions/notifications
 * Obtém notificações do provedor
 */
router.get('/providers/commissions/notifications', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;
    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const unreadOnly = req.query.unread_only === 'true';
    const result = await CommissionService.getProviderNotifications(providerId, unreadOnly);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao obter notificações:', error);
    res.status(500).json({ 
      error: 'Erro ao obter notificações', 
      details: (error as Error).message 
    });
  }
});

/**
 * PUT /api/providers/commissions/notifications/:notificationId/read
 * Marca notificação como lida
 */
router.put('/providers/commissions/notifications/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;
    const { notificationId } = req.params;
    
    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const result = await CommissionService.markNotificationAsRead(notificationId, providerId);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
    res.status(500).json({ 
      error: 'Erro ao marcar notificação como lida', 
      details: (error as Error).message 
    });
  }
});

// ==================== ENDPOINTS PARA ADMINISTRADORES ====================

/**
 * GET /api/admin/commissions
 * Lista todas as comissões (admin)
 */
router.get('/admin/commissions', requireAuth, requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      provider_type: req.query.provider_type as 'hotel' | 'driver' | 'event_space',
      status: req.query.status as 'pending' | 'verified' | 'rejected',
      start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
      end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await CommissionService.getCommissions(filters);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao listar comissões (admin):', error);
    res.status(500).json({ 
      error: 'Erro ao listar comissões', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/admin/commissions/:commissionId/approve
 * Admin aprova pagamento
 */
router.post('/admin/commissions/:commissionId/approve', requireAuth, requireAdminAuth, async (req, res) => {
  try {
    const adminId = req.user?.uid;
    const { commissionId } = req.params;
    const { notes } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const result = await CommissionService.approvePayment(commissionId, adminId, notes);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao aprovar pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao aprovar pagamento', 
      details: (error as Error).message 
    });
  }
});

/**
 * POST /api/admin/commissions/:commissionId/reject
 * Admin rejeita pagamento
 */
router.post('/admin/commissions/:commissionId/reject', requireAuth, requireAdminAuth, async (req, res) => {
  try {
    const adminId = req.user?.uid;
    const { commissionId } = req.params;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
    }

    const result = await CommissionService.rejectPayment(commissionId, adminId, reason);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao rejeitar pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao rejeitar pagamento', 
      details: (error as Error).message 
    });
  }
});

// ==================== ENDPOINTS PÚBLICOS (UTILITÁRIOS) ====================

/**
 * POST /api/commissions/generate-from-invoices
 * Gera comissões a partir de invoices pendentes (execução manual)
 */
router.post('/commissions/generate-from-invoices', requireAuth, requireAdminAuth, async (req, res) => {
  try {
    const result = await CommissionService.generateCommissionsFromPendingInvoices();
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao gerar comissões:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar comissões', 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/commissions/stats
 * Estatísticas gerais do sistema de comissões
 */
router.get('/commissions/stats', requireAuth, requireAdminAuth, async (req, res) => {
  try {
    // Estatísticas por status
    const pendingResult = await CommissionService.getCommissions({ status: 'pending' });
    const verifiedResult = await CommissionService.getCommissions({ status: 'verified' });
    const rejectedResult = await CommissionService.getCommissions({ status: 'rejected' });

    // Estatísticas por tipo de provedor
    const hotelResult = await CommissionService.getCommissions({ provider_type: 'hotel' });
    const driverResult = await CommissionService.getCommissions({ provider_type: 'driver' });
    const eventResult = await CommissionService.getCommissions({ provider_type: 'event_space' });

    const stats = {
      totals: {
        pending: pendingResult.pagination.total,
        verified: verifiedResult.pagination.total,
        rejected: rejectedResult.pagination.total,
        total: pendingResult.pagination.total + verifiedResult.pagination.total + rejectedResult.pagination.total,
      },
      amounts: {
        pending: pendingResult.summary.pendingAmount,
        overdue: pendingResult.summary.overdueAmount,
        total_pending: pendingResult.summary.pendingAmount + pendingResult.summary.overdueAmount,
      },
      by_provider_type: {
        hotel: hotelResult.pagination.total,
        driver: driverResult.pagination.total,
        event_space: eventResult.pagination.total,
      },
      overdue: {
        count: pendingResult.summary.overdueCount,
        amount: pendingResult.summary.overdueAmount,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao obter estatísticas', 
      details: (error as Error).message 
    });
  }
});

export default router;