// src/modules/admin/index.ts - ⭐ ROUTES ÚNICO para admin
// Todas as operações admin passam por aqui

import { Router, Request, Response } from "express";
import { verifyFirebaseToken } from "../../shared/firebaseAuth.js";
import type { AuthenticatedRequest } from "../../../shared/types.js";
import { adminService } from "./adminService";
import { db } from "../../../db";
import { users } from "../../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

// ==================== MIDDLEWARE ====================

const adminOnly = async (req: Request, res: Response, next: Function) => {
  const authReq = req as AuthenticatedRequest;
  try {
    // 1️⃣ Verificar se usuário está autenticado
    const userId = authReq.user?.id;
    const firebaseUid = authReq.user?.uid;
    
    if (!userId || !firebaseUid) {
      console.warn('⚠️ [AdminOnly] Usuário não autenticado - missing userId/uid', { userId, firebaseUid });
      return res.status(401).json({ success: false, message: "Não autenticado", code: "NO_AUTH" });
    }

    // 2️⃣ Verificar capacidades já calculadas pelo verifyFirebaseToken
    const isAdmin = authReq.userCapabilities?.isAdmin;
    console.log(`🔍 [AdminOnly] Verificando admin access:`, { 
      userId, 
      firebaseUid, 
      isAdmin,
      capabilities: authReq.userCapabilities
    });

    if (!isAdmin) {
      console.warn(`⚠️ [AdminOnly] Acesso negado - não é admin: ${userId} (isAdmin: ${isAdmin})`);
      return res.status(401).json({ success: false, message: "Sem permissão de administrador", code: "NOT_ADMIN" });
    }

    // 3️⃣ Buscar dados completos do user para adicionar ao request
    const userFromDb = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userFromDb.length) {
      console.warn(`⚠️ [AdminOnly] Usuário não encontrado no banco: ${userId}`);
      return res.status(401).json({ success: false, message: "Usuário não encontrado", code: "USER_NOT_FOUND" });
    }

    // Adicionar admin ao request
    (req as any).admin = userFromDb[0];
    console.log(`✅ [AdminOnly] Acesso concedido a admin: ${userId}`);
    next();
  } catch (error) {
    console.error("❌ Erro na autenticação admin:", error);
    res.status(401).json({ success: false, message: "Erro na autenticação", code: "AUTH_ERROR" });
  }
};

// ==================== DEBUG & STATUS ====================

// Status do usuário autenticado (sem restrição admin)
router.get(
  "/auth-status",
  verifyFirebaseToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const firebaseUid = authReq.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Não autenticado" });
      }

      // Buscar usuário
      const userFromDb = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!userFromDb.length) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      const user = userFromDb[0];

      res.json({
        success: true,
        data: {
          userId: user.id,
          firebaseUid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          canBookServices: user.canBookServices,
          canDrive: user.canDrive,
          canManageHotels: user.canManageHotels,
          capabilities: authReq.userCapabilities,
        }
      });
    } catch (error) {
      console.error("Erro em /auth-status:", error);
      res.status(500).json({ success: false, message: "Erro ao obter status" });
    }
  }
);

// ==================== ADMIN SETUP (DEV ONLY) ====================

// Promover usuário a admin (endpoint de setup, sem auth admin necessária)
router.post(
  "/setup/promote-admin",
  verifyFirebaseToken,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: "Não autenticado" });
      }

      // Verificar se database já tem algum admin
      const existingAdmins = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.isAdmin, true));

      const adminCount = Object.values(existingAdmins[0])[0] as number;

      // Permitir primeira pessoa ou via env var
      const ADMIN_SETUP_TOKEN = process.env.ADMIN_SETUP_TOKEN;
      const hasValidSetupToken = req.headers['x-admin-setup'] === ADMIN_SETUP_TOKEN && ADMIN_SETUP_TOKEN;

      if (adminCount > 0 && !hasValidSetupToken) {
        return res.status(403).json({ 
          success: false, 
          message: "Admin já existe. Use header X-Admin-Setup com token válido.",
          existingAdmins: adminCount
        });
      }

      // Promover usuário a admin
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, userId));

      console.log(`✅ [ADMIN SETUP] Usuário ${userId} promovido a admin`);

      res.json({
        success: true,
        message: "Usuário promovido a admin com sucesso",
        data: { userId, isAdmin: true }
      });
    } catch (error) {
      console.error("Erro em /setup/promote-admin:", error);
      res.status(500).json({ success: false, message: "Erro ao promover a admin" });
    }
  }
);

// ==================== DASHBOARD ====================

router.get(
  "/dashboard/stats",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Erro em getDashboardStats:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar dashboard" });
    }
  }
);

// ==================== ESTATÍSTICAS POR PERÍODO ====================

router.get(
  "/dashboard/stats-period",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, period = "daily" } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "startDate e endDate são obrigatórios" });
      }

      const stats = await adminService.getStatsByPeriod(
        new Date(startDate as string),
        new Date(endDate as string),
        (period as "daily" | "weekly" | "monthly") || "daily"
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Erro em getStatsByPeriod:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar estatísticas" });
    }
  }
);

// ==================== USUÁRIOS ====================

router.get(
  "/users",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, type, search } = req.query;
      const result = await adminService.listUsers({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        type: type as string,
        search: search as string
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em listUsers:", error);
      res.status(500).json({ success: false, message: "Erro ao listar usuários" });
    }
  }
);

router.get(
  "/users/:userId",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserDetails(userId);

      if (!user) {
        return res.status(404).json({ success: false, message: "Usuário não encontrado" });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("Erro em getUserDetails:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar usuário" });
    }
  }
);

// ==================== GESTÃO DE USUÁRIOS ====================

// Suspender usuário
router.post(
  "/users/:userId/suspend",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason, end_date } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.suspendUser(userId, reason, admin.id, end_date);
      res.json(result);
    } catch (error) {
      console.error("Erro em suspendUser:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// Reativar usuário
router.post(
  "/users/:userId/reactivate",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.reactivateUser(userId, reason || "", admin.id);
      res.json(result);
    } catch (error) {
      console.error("Erro em reactivateUser:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== CAPACIDADES ====================

router.get(
  "/capabilities/queue",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const queue = await adminService.getVerificationQueue();
      res.json({ success: true, data: queue });
    } catch (error) {
      console.error("Erro em getVerificationQueue:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar fila" });
    }
  }
);

// Motoristas
router.post(
  "/capabilities/:userId/approve-driver",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.approveDriver(userId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em approveDriver:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.post(
  "/capabilities/:userId/reject-driver",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.rejectDriver(userId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em rejectDriver:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.post(
  "/capabilities/:userId/suspend-driver",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason, end_date } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.suspendDriver(userId, admin.id, reason, end_date);
      res.json(result);
    } catch (error) {
      console.error("Erro em suspendDriver:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// Gestores de Hotel
router.post(
  "/capabilities/:userId/approve-hotel-manager",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.approveHotelManager(userId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em approveHotelManager:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.post(
  "/capabilities/:userId/reject-hotel-manager",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.rejectHotelManager(userId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em rejectHotelManager:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// Clientes
router.post(
  "/clients/:userId/suspend",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason, end_date } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.suspendClient(userId, admin.id, reason, end_date);
      res.json(result);
    } catch (error) {
      console.error("Erro em suspendClient:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.post(
  "/clients/:userId/reactivate",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.reactivateClient(userId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em reactivateClient:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== HOTÉIS ====================

router.get(
  "/hotels",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, search } = req.query;
      const result = await adminService.listHotels({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        search: search as string
      });

      res.json({
        success: true,
        data: result.hotels,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em listHotels:", error);
      res.status(500).json({ success: false, message: "Erro ao listar hotéis" });
    }
  }
);

router.get(
  "/hotels/:hotelId",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;
      const hotel = await adminService.getHotelDetails(hotelId);

      if (!hotel) {
        return res.status(404).json({ success: false, message: "Hotel não encontrado" });
      }

      res.json({ success: true, data: hotel });
    } catch (error) {
      console.error("Erro em getHotelDetails:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar hotel" });
    }
  }
);

router.post(
  "/hotels/:hotelId/suspend",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      if (!reason) {
        return res.status(400).json({ success: false, message: "Motivo é obrigatório" });
      }

      const result = await adminService.suspendHotel(hotelId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em suspendHotel:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.post(
  "/hotels/:hotelId/activate",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { hotelId } = req.params;
      const { reason } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.activateHotel(hotelId, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em activateHotel:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== ESTATÍSTICAS DE ESTADIAS ====================

router.get(
  "/bookings/stats",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      // Buscar estatísticas gerais de estadias
      const totalBookings = await db.select({ count: sql<number>`count(*)` }).from(hotelBookings);
      
      let conditions = [];
      if (startDate) conditions.push(gte(hotelBookings.createdAt, new Date(startDate as string)));
      if (endDate) conditions.push(lte(hotelBookings.createdAt, new Date(endDate as string)));

      const periodBookings = await db.select({ count: sql<number>`count(*)` })
        .from(hotelBookings)
        .where(and(...conditions));

      res.json({
        success: true,
        data: {
          totalBookings: Object.values(totalBookings[0])[0] || 0,
          periodBookings: Object.values(periodBookings[0])[0] || 0,
        }
      });
    } catch (error) {
      console.error("Erro em /bookings/stats:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar estatísticas de estadias" });
    }
  }
);

// ==================== TAXAS/COMISSÕES ====================

router.get(
  "/fees/current",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const fees = await adminService.getCurrentFees();
      res.json({ success: true, data: fees });
    } catch (error) {
      console.error("Erro em getCurrentFees:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar taxas" });
    }
  }
);

router.post(
  "/fees/update",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { service_type, fee_percentage, reason } = req.body;
      const admin = (req as any).admin;

      if (!service_type || fee_percentage === undefined) {
        return res.status(400).json({ success: false, message: "Parâmetros inválidos" });
      }

      const result = await adminService.updateFee(service_type, fee_percentage, admin.id, reason);
      res.json(result);
    } catch (error) {
      console.error("Erro em updateFee:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== RECLAMAÇÕES ====================

router.get(
  "/complaints",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, priority } = req.query;
      const result = await adminService.listComplaints({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        priority: priority as string
      });

      res.json({
        success: true,
        data: result.complaints,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em listComplaints:", error);
      res.status(500).json({ success: false, message: "Erro ao listar reclamações" });
    }
  }
);

router.get(
  "/complaints/:complaintId",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { complaintId } = req.params;
      const complaint = await adminService.getComplaintDetails(complaintId);

      if (!complaint) {
        return res.status(404).json({ success: false, message: "Reclamação não encontrada" });
      }

      res.json({ success: true, data: complaint });
    } catch (error) {
      console.error("Erro em getComplaintDetails:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar reclamação" });
    }
  }
);

router.put(
  "/complaints/:complaintId/status",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { complaintId } = req.params;
      const { status, resolution } = req.body;
      const admin = (req as any).admin;

      if (!status) {
        return res.status(400).json({ success: false, message: "Status é obrigatório" });
      }

      const result = await adminService.updateComplaintStatus(
        complaintId,
        admin.id,
        status,
        resolution
      );

      res.json(result);
    } catch (error) {
      console.error("Erro em updateComplaintStatus:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== PAGAMENTOS ====================

router.get(
  "/payments/stats",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const stats = await adminService.getPaymentStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Erro em getPaymentStats:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar stats de pagamentos" });
    }
  }
);

// Pagamentos por período
router.get(
  "/payments/stats-period",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: "startDate e endDate são obrigatórios" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Buscar pagamentos confirmados no período
      const confirmedPayments = await db.select({
        total: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)`,
        count: sql<number>`count(*)`,
      })
        .from(payment_references)
        .where(
          and(
            eq(payment_references.status, "confirmed"),
            gte(payment_references.created_at, start),
            lte(payment_references.created_at, end)
          )
        );

      // Buscar pagamentos pendentes no período
      const pendingPayments = await db.select({
        total: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)`,
        count: sql<number>`count(*)`,
      })
        .from(payment_references)
        .where(
          and(
            eq(payment_references.status, "pending"),
            gte(payment_references.created_at, start),
            lte(payment_references.created_at, end)
          )
        );

      res.json({
        success: true,
        data: {
          period: { start, end },
          confirmed: {
            total: Object.values(confirmedPayments[0])[0] || "0",
            count: Object.values(confirmedPayments[0])[1] || 0,
          },
          pending: {
            total: Object.values(pendingPayments[0])[0] || "0",
            count: Object.values(pendingPayments[0])[1] || 0,
          },
        }
      });
    } catch (error) {
      console.error("Erro em getPaymentStatsPeriod:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar pagamentos por período" });
    }
  }
);

router.get(
  "/payments/references",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, booking_type, provider_id } = req.query;
      const result = await adminService.listPaymentReferences({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        booking_type: booking_type as string,
        provider_id: provider_id as string
      });

      res.json({
        success: true,
        data: result.references,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em listPaymentReferences:", error);
      res.status(500).json({ success: false, message: "Erro ao listar pagamentos" });
    }
  }
);

router.post(
  "/payments/:paymentId/confirm",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { notes } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.confirmPayment(paymentId, admin.id, notes);
      res.json(result);
    } catch (error) {
      console.error("Erro em confirmPayment:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

router.get(
  "/payments/references",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, booking_type, provider_id } = req.query;
      const result = await adminService.listPaymentReferences({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        status: status as string,
        booking_type: booking_type as string,
        provider_id: provider_id as string
      });

      res.json({
        success: true,
        data: result.references,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em listPaymentReferences:", error);
      res.status(500).json({ success: false, message: "Erro ao listar pagamentos" });
    }
  }
);

router.post(
  "/payments/:paymentId/confirm",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const { notes } = req.body;
      const admin = (req as any).admin;

      const result = await adminService.confirmPayment(paymentId, admin.id, notes);
      res.json(result);
    } catch (error) {
      console.error("Erro em confirmPayment:", error);
      res.status(500).json({ success: false, message: (error as Error).message });
    }
  }
);

// ==================== AUDITORIA ====================

router.get(
  "/audit/logs",
  verifyFirebaseToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { page, limit, adminId } = req.query;
      const result = await adminService.getAdminLogs({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
        adminId: adminId as string
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      console.error("Erro em getAdminLogs:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar logs" });
    }
  }
);

export default router;
