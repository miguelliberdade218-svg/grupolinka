// src/modules/admin/adminService.ts - ⭐ SERVICE ÚNICO para todas as operações admin
// Contém toda a lógica de negócio administrativa

import { db } from "../../../db";
import {
  users,
  rides,
  hotels,
  hotelBookings,
  eventSpaces,
  eventBookings,
  complaints,
  paymentReferences,
  platformFeeConfig,
  userCapacityDocuments,
  capabilityAuditLog,
  userEntities,
  userBankAccounts
} from "../../../shared/schema";
import {
  eq,
  and,
  or,
  desc,
  count,
  gte,
  lte,
  like,
  sql,
  inArray
} from "drizzle-orm";

export class AdminService {
  
  // ==================== DASHBOARD ====================
  
  async getDashboardStats() {
    try {
      const [
        totalUsersResult,
        totalAdminsResult,
        totalDriversResult,
        totalHotelManagersResult,
        totalClientsResult,
        pendingVerificationsResult,
        newComplaintsResult,
        pendingPaymentsResult,
        totalRidesResult,
        totalHotelBookingsResult,
        totalEventBookingsResult
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(eq(users.isAdmin, true)),
        db.select({ count: count() }).from(users).where(eq(users.canDrive, true)),
        db.select({ count: count() }).from(users).where(eq(users.canManageHotels, true)),
        db.select({ count: count() }).from(users).where(eq(users.canBookServices, true)),
        db.select({ count: count() }).from(users).where(eq(users.verificationStatus, 'pending')),
        db.select({ count: count() }).from(complaints).where(eq(complaints.status, 'new')),
        db.select({ count: count() }).from(paymentReferences).where(eq(paymentReferences.status, 'pending')),
        db.select({ count: count() }).from(rides),
        db.select({ count: count() }).from(hotelBookings),
        db.select({ count: count() }).from(eventBookings)
      ]);

      const pendingAmount = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)`
      }).from(paymentReferences).where(eq(paymentReferences.status, 'pending'));

      return {
        total_users: totalUsersResult[0].count,
        total_admins: totalAdminsResult[0].count,
        total_drivers: totalDriversResult[0].count,
        total_hotel_managers: totalHotelManagersResult[0].count,
        total_clients: totalClientsResult[0].count,
        pending_verifications: pendingVerificationsResult[0].count,
        new_complaints: newComplaintsResult[0].count,
        pending_payments: pendingPaymentsResult[0].count,
        pending_amount: parseFloat(pendingAmount[0].total?.toString() || '0'),
        total_rides: totalRidesResult[0].count,
        total_hotel_bookings: totalHotelBookingsResult[0].count,
        total_event_bookings: totalEventBookingsResult[0].count
      };
    } catch (error) {
      console.error('Erro no getDashboardStats:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE USUÁRIOS ====================

  async listUsers(filters: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, status, type, search } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (status === 'active') {
      whereConditions.push(
        or(
          eq(users.canDrive, true),
          eq(users.canManageHotels, true),
          eq(users.canBookServices, true)
        )
      );
    } else if (status === 'suspended') {
      whereConditions.push(
        or(
          eq(users.driverVerificationStatus, 'suspended'),
          eq(users.hotelManagerVerificationStatus, 'suspended'),
          eq(users.clientVerificationStatus, 'suspended')
        )
      );
    } else if (status === 'pending') {
      whereConditions.push(
        or(
          eq(users.driverVerificationStatus, 'pending'),
          eq(users.hotelManagerVerificationStatus, 'pending')
        )
      );
    }

    if (type === 'driver') {
      whereConditions.push(eq(users.canDrive, true));
    } else if (type === 'hotel_manager') {
      whereConditions.push(eq(users.canManageHotels, true));
    } else if (type === 'client') {
      whereConditions.push(eq(users.canBookServices, true));
    } else if (type === 'admin') {
      whereConditions.push(eq(users.isAdmin, true));
    }

    if (search) {
      whereConditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.fullName, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [usersResult, totalResult] = await Promise.all([
      db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        phone: users.phone,
        userType: users.userType,
        canDrive: users.canDrive,
        canManageHotels: users.canManageHotels,
        canBookServices: users.canBookServices,
        isAdmin: users.isAdmin,
        isVerified: users.isVerified,
        verificationStatus: users.verificationStatus,
        driverVerificationStatus: users.driverVerificationStatus,
        hotelManagerVerificationStatus: users.hotelManagerVerificationStatus,
        clientVerificationStatus: users.clientVerificationStatus,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        rating: users.rating,
        totalReviews: users.totalReviews,
        profileImageUrl: users.profileImageUrl
      })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(users)
        .where(whereClause)
    ]);

    const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

    return {
      users: usersResult,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0].count),
        totalPages
      }
    };
  }

  async getUserDetails(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) return null;

    // Documentos de capacidade
    const documents = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.userId, userId))
      .orderBy(desc(userCapacityDocuments.createdAt));

    // Histórico de capacidades
    const history = await db.select()
      .from(capabilityAuditLog)
      .where(eq(capabilityAuditLog.user_id, userId))
      .orderBy(desc(capabilityAuditLog.created_at))
      .limit(20);

    // Entidade bancária
    const bankAccounts = await db.select()
      .from(userBankAccounts)
      .where(eq(userBankAccounts.user_id, userId));

    return {
      ...user[0],
      documents: documents || [],
      history: history || [],
      bank_accounts: bankAccounts || []
    };
  }

  // ==================== GESTÃO DE CAPACIDADES ====================

  async getVerificationQueue() {
    try {
      // Motoristas pendentes
      const pendingDrivers = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        type: sql<string>`'driver'`,
        status: users.driverVerificationStatus,
        createdAt: users.createdAt,
        documents: sql<boolean>`EXISTS(SELECT 1 FROM user_capacity_documents WHERE user_id = users.id AND document_type = 'driver_license')`
      })
        .from(users)
        .where(
          and(
            eq(users.canDrive, true),
            eq(users.driverVerificationStatus, 'pending')
          )
        )
        .orderBy(desc(users.createdAt));

      // Gestores de hotel pendentes
      const pendingHotelManagers = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        type: sql<string>`'hotel_manager'`,
        status: users.hotelManagerVerificationStatus,
        createdAt: users.createdAt,
        documents: sql<boolean>`EXISTS(SELECT 1 FROM user_capacity_documents WHERE user_id = users.id AND document_type = 'business_registration')`
      })
        .from(users)
        .where(
          and(
            eq(users.canManageHotels, true),
            eq(users.hotelManagerVerificationStatus, 'pending')
          )
        )
        .orderBy(desc(users.createdAt));

      return [...pendingDrivers, ...pendingHotelManagers];
    } catch (error) {
      console.error('Erro no getVerificationQueue:', error);
      throw error;
    }
  }

  async approveDriver(userId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          canDrive: true,
          driverVerificationStatus: 'verified',
          driverVerifiedAt: new Date(),
          driverVerificationNotes: reason || 'Aprovado pelo admin',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Log da ação
      await this.logAdminAction(adminId, 'approve_driver', userId, { reason });

      return { success: true, message: 'Motorista aprovado com sucesso' };
    } catch (error) {
      console.error('Erro ao aprovar motorista:', error);
      throw error;
    }
  }

  async rejectDriver(userId: string, adminId: string, reason: string) {
    if (!reason) throw new Error('Motivo da rejeição é obrigatório');

    try {
      await db.update(users)
        .set({
          canDrive: false,
          driverVerificationStatus: 'rejected',
          driverVerificationNotes: reason,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'reject_driver', userId, { reason });

      return { success: true, message: 'Motorista rejeitado' };
    } catch (error) {
      console.error('Erro ao rejeitar motorista:', error);
      throw error;
    }
  }

  async suspendDriver(userId: string, adminId: string, reason: string, endDate?: string) {
    if (!reason) throw new Error('Motivo da suspensão é obrigatório');

    try {
      await db.update(users)
        .set({
          driverVerificationStatus: 'suspended',
          driverVerificationNotes: reason,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'suspend_driver', userId, { reason, endDate });

      return { success: true, message: 'Motorista suspenso' };
    } catch (error) {
      console.error('Erro ao suspender motorista:', error);
      throw error;
    }
  }

  async approveHotelManager(userId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          canManageHotels: true,
          hotelManagerVerificationStatus: 'verified',
          hotelManagerVerifiedAt: new Date(),
          hotelManagerVerificationNotes: reason || 'Aprovado pelo admin',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'approve_hotel_manager', userId, { reason });

      return { success: true, message: 'Gestor de hotel aprovado' };
    } catch (error) {
      console.error('Erro ao aprovar gestor de hotel:', error);
      throw error;
    }
  }

  async rejectHotelManager(userId: string, adminId: string, reason: string) {
    if (!reason) throw new Error('Motivo da rejeição é obrigatório');

    try {
      await db.update(users)
        .set({
          canManageHotels: false,
          hotelManagerVerificationStatus: 'rejected',
          hotelManagerVerificationNotes: reason,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'reject_hotel_manager', userId, { reason });

      return { success: true, message: 'Gestor de hotel rejeitado' };
    } catch (error) {
      console.error('Erro ao rejeitar gestor de hotel:', error);
      throw error;
    }
  }

  async suspendClient(userId: string, adminId: string, reason: string, endDate?: string) {
    if (!reason) throw new Error('Motivo da suspensão é obrigatório');

    try {
      await db.update(users)
        .set({
          clientVerificationStatus: 'suspended',
          clientSuspensionReason: reason,
          clientSuspendedAt: new Date(),
          clientSuspensionEndDate: endDate ? endDate : null,
          canBookServices: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'suspend_client', userId, { reason, endDate });

      return { success: true, message: 'Cliente suspenso' };
    } catch (error) {
      console.error('Erro ao suspender cliente:', error);
      throw error;
    }
  }

  async reactivateClient(userId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          clientVerificationStatus: 'verified',
          clientSuspendedAt: null,
          clientSuspensionReason: null,
          clientSuspensionEndDate: null,
          canBookServices: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      await this.logAdminAction(adminId, 'reactivate_client', userId, { reason });

      return { success: true, message: 'Cliente reativado' };
    } catch (error) {
      console.error('Erro ao reativar cliente:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE HOTÉIS ====================

  async listHotels(filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, status, search } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (status === 'active') {
      whereConditions.push(eq(hotels.is_active, true));
    } else if (status === 'inactive') {
      whereConditions.push(eq(hotels.is_active, false));
    }

    if (search) {
      whereConditions.push(
        or(
          like(hotels.name, `%${search}%`),
          like(hotels.description, `%${search}%`),
          like(hotels.address, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [hotelsResult, totalResult] = await Promise.all([
      db.select({
        id: hotels.id,
        name: hotels.name,
        description: hotels.description,
        address: hotels.address,
        locality: hotels.locality,
        province: hotels.province,
        country: hotels.country,
        is_active: hotels.is_active,
        rating: hotels.rating,
        total_reviews: hotels.total_reviews,
        created_at: hotels.created_at,
        updated_at: hotels.updated_at,
        host_id: hotels.host_id
      })
        .from(hotels)
        .where(whereClause)
        .orderBy(desc(hotels.created_at))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(hotels)
        .where(whereClause)
    ]);

    const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

    return {
      hotels: hotelsResult,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0].count),
        totalPages
      }
    };
  }

  async getHotelDetails(hotelId: string) {
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel.length) return null;

    // Recentes reservas
    const recentBookings = await db.select()
      .from(hotelBookings)
      .where(eq(hotelBookings.hotelId, hotelId))
      .orderBy(desc(hotelBookings.createdAt))
      .limit(10);

    return {
      ...hotel[0],
      recent_bookings: recentBookings
    };
  }

  async suspendHotel(hotelId: string, adminId: string, reason: string) {
    if (!reason) throw new Error('Motivo da suspensão é obrigatório');

    try {
      await db.update(hotels)
        .set({
          is_active: false,
          updated_at: new Date()
        })
        .where(eq(hotels.id, hotelId));

      await this.logAdminAction(adminId, 'suspend_hotel', hotelId, { reason });

      return { success: true, message: 'Hotel suspenso' };
    } catch (error) {
      console.error('Erro ao suspender hotel:', error);
      throw error;
    }
  }

  async activateHotel(hotelId: string, adminId: string, reason?: string) {
    try {
      await db.update(hotels)
        .set({
          is_active: true,
          updated_at: new Date()
        })
        .where(eq(hotels.id, hotelId));

      await this.logAdminAction(adminId, 'activate_hotel', hotelId, { reason });

      return { success: true, message: 'Hotel ativado' };
    } catch (error) {
      console.error('Erro ao ativar hotel:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE TAXAS/COMISSÕES ====================

  async getCurrentFees() {
    try {
      const fees = await db.select({
        service_type: platformFeeConfig.service_type,
        fee_percentage: platformFeeConfig.fee_percentage,
        is_active: platformFeeConfig.is_active,
        effective_from: platformFeeConfig.effective_from
      })
        .from(platformFeeConfig)
        .where(eq(platformFeeConfig.is_active, true))
        .orderBy(desc(platformFeeConfig.effective_from));

      return fees;
    } catch (error) {
      console.error('Erro ao obter taxas atuais:', error);
      throw error;
    }
  }

  async updateFee(serviceType: string, feePercentage: number, adminId: string, reason?: string) {
    if (feePercentage < 0 || feePercentage > 100) {
      throw new Error('Percentagem deve estar entre 0 e 100');
    }

    try {
      // Desativar configuração anterior
      await db.update(platformFeeConfig)
        .set({ is_active: false })
        .where(
          and(
            eq(platformFeeConfig.service_type, serviceType),
            eq(platformFeeConfig.is_active, true)
          )
        );

      // Criar nova configuração
      const newFee = await db.insert(platformFeeConfig)
        .values({
          service_type: serviceType,
          fee_percentage: feePercentage.toString() as any,
          is_active: true,
          created_by: adminId
        })
        .returning();

      await this.logAdminAction(adminId, 'update_fee', null, {
        service_type: serviceType,
        fee_percentage: feePercentage,
        reason
      });

      return {
        success: true,
        message: 'Taxa atualizada com sucesso',
        data: newFee[0]
      };
    } catch (error) {
      console.error('Erro ao atualizar taxa:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE RECLAMAÇÕES ====================

  async listComplaints(filters: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  } = {}) {
    const { page = 1, limit = 20, status, priority } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (status && ['new', 'investigating', 'resolved', 'dismissed'].includes(status)) {
      whereConditions.push(eq(complaints.status, status as 'new' | 'investigating' | 'resolved' | 'dismissed'));
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      whereConditions.push(eq(complaints.priority, priority as 'low' | 'medium' | 'high' | 'urgent'));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [complaintsResult, totalResult] = await Promise.all([
      db.select()
        .from(complaints)
        .where(whereClause)
        .orderBy(desc(complaints.created_at))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(complaints)
        .where(whereClause)
    ]);

    const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

    return {
      complaints: complaintsResult,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0].count),
        totalPages
      }
    };
  }

  async getComplaintDetails(complaintId: string) {
    const complaint = await db.select()
      .from(complaints)
      .where(eq(complaints.id, complaintId))
      .limit(1);

    return complaint.length ? complaint[0] : null;
  }

  async updateComplaintStatus(
    complaintId: string,
    adminId: string,
    newStatus: 'new' | 'investigating' | 'resolved' | 'dismissed',
    resolution?: string
  ) {
    try {
      await db.update(complaints)
        .set({
          status: newStatus,
          resolution: resolution || null,
          resolved_at: resolution ? new Date() : null,
          assigned_admin_id: adminId,
          updated_at: new Date()
        })
        .where(eq(complaints.id, complaintId));

      await this.logAdminAction(adminId, 'update_complaint_status', complaintId, {
        status: newStatus,
        resolution
      });

      return { success: true, message: 'Status de reclamação atualizado' };
    } catch (error) {
      console.error('Erro ao atualizar status de reclamação:', error);
      throw error;
    }
  }

  // ==================== GESTÃO DE PAGAMENTOS ====================

  async getPaymentStats() {
    try {
      const stats = await db.select({
        total_transactions: count(),
        total_gross: sql<number>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)`,
        total_fees: sql<number>`COALESCE(SUM(CAST(fee_amount AS DECIMAL)), 0)`,
        total_net: sql<number>`COALESCE(SUM(CAST(net_amount AS DECIMAL)), 0)`,
        pending_count: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
        pending_amount: sql<number>`COALESCE(SUM(CASE WHEN status = 'pending' THEN CAST(gross_amount AS DECIMAL) ELSE 0 END), 0)`
      })
        .from(paymentReferences);

      return stats.length ? stats[0] : {};
    } catch (error) {
      console.error('Erro ao obter stats de pagamentos:', error);
      throw error;
    }
  }

  async listPaymentReferences(filters: {
    page?: number;
    limit?: number;
    status?: string;
    booking_type?: string;
    provider_id?: string;
  } = {}) {
    const { page = 1, limit = 20, status, booking_type, provider_id } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];

    if (status) {
      whereConditions.push(eq(paymentReferences.status, status));
    }

    if (booking_type) {
      whereConditions.push(eq(paymentReferences.booking_type, booking_type));
    }

    if (provider_id) {
      whereConditions.push(eq(paymentReferences.provider_user_id, provider_id));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [referencesResult, totalResult] = await Promise.all([
      db.select()
        .from(paymentReferences)
        .where(whereClause)
        .orderBy(desc(paymentReferences.created_at))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(paymentReferences)
        .where(whereClause)
    ]);

    const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

    return {
      references: referencesResult,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0].count),
        totalPages
      }
    };
  }

  async confirmPayment(paymentId: string, adminId: string, notes?: string) {
    try {
      const payment = await db.select()
        .from(paymentReferences)
        .where(eq(paymentReferences.id, paymentId))
        .limit(1);

      if (!payment.length) {
        throw new Error('Pagamento não encontrado');
      }

      await db.update(paymentReferences)
        .set({
          status: 'paid',
          paid_at: new Date(),
          confirmed_by: adminId,
          notes: notes || null,
          updated_at: new Date()
        })
        .where(eq(paymentReferences.id, paymentId));

      await this.logAdminAction(adminId, 'confirm_payment', paymentId, {
        reference: payment[0].reference_number,
        notes
      });

      return { success: true, message: 'Pagamento confirmado' };
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  // ==================== AUDITORIA ====================

  async logAdminAction(adminId: string, action: string, targetId: string | null, details: any = {}) {
    try {
      await db.insert(capabilityAuditLog)
        .values({
          user_id: adminId,
          capability_type: 'admin',
          changed_by: adminId,
          reason: action,
          metadata: {
            action,
            targetId,
            ...details
          }
        });
    } catch (error) {
      console.error('Erro ao logar ação admin:', error);
    }
  }

  async getAdminLogs(filters: {
    page?: number;
    limit?: number;
    adminId?: string;
  } = {}) {
    const { page = 1, limit = 50, adminId } = filters;
    const offset = (page - 1) * limit;

    let whereClause = undefined;

    if (adminId) {
      whereClause = eq(capabilityAuditLog.changed_by, adminId);
    }

    const [logsResult, totalResult] = await Promise.all([
      db.select()
        .from(capabilityAuditLog)
        .where(whereClause)
        .orderBy(desc(capabilityAuditLog.created_at))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(capabilityAuditLog)
        .where(whereClause)
    ]);

    const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

    return {
      logs: logsResult,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0].count),
        totalPages
      }
    };
  }
}

export const adminService = new AdminService();
