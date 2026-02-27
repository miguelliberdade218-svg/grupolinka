// src/modules/admin/adminService.ts - Serviço administrativo completo
import { db } from "../../../db";
import { users, hotelBookings, payment_references, complaints, rides, eventBookings } from "../../../shared/schema";
import { sql, eq, and, gte, lte, or, desc } from "drizzle-orm";

export const adminService = {
  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    try {
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const admins = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.is_admin, true));
      const drivers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.can_drive, true));
      const hotels = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.can_manage_hotels, true));
      const clients = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.can_book_services, true));
      const pendingVerifications = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.verificationStatus, "pending"));
      const newComplaints = await db.select({ count: sql<number>`count(*)` }).from(complaints).where(eq(complaints.status, "new"));
      const pendingPayments = await db.select({ count: sql<number>`count(*)` }).from(payment_references).where(eq(payment_references.status, "pending"));
      const totalRides = await db.select({ count: sql<number>`count(*)` }).from(rides);
      const totalHotelBookings = await db.select({ count: sql<number>`count(*)` }).from(hotelBookings);
      const totalEventBookings = await db.select({ count: sql<number>`count(*)` }).from(eventBookings);
      const pendingPaymentsAmount = await db.select({ total: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)` }).from(payment_references).where(eq(payment_references.status, "pending"));

      return {
        totalUsers: Object.values(totalUsers[0])[0] || 0,
        admins: Object.values(admins[0])[0] || 0,
        drivers: Object.values(drivers[0])[0] || 0,
        hotels: Object.values(hotels[0])[0] || 0,
        clients: Object.values(clients[0])[0] || 0,
        pendingVerifications: Object.values(pendingVerifications[0])[0] || 0,
        newComplaints: Object.values(newComplaints[0])[0] || 0,
        pendingPayments: Object.values(pendingPayments[0])[0] || 0,
        totalRides: Object.values(totalRides[0])[0] || 0,
        totalHotelBookings: Object.values(totalHotelBookings[0])[0] || 0,
        totalEventBookings: Object.values(totalEventBookings[0])[0] || 0,
        pendingPaymentsAmount: Object.values(pendingPaymentsAmount[0])[0] || "0",
      };
    } catch (error) {
      console.error("Erro em getDashboardStats:", error);
      throw error;
    }
  },

  // ==================== ESTATÍSTICAS POR PERÍODO ====================

  async getStatsByPeriod(startDate: Date, endDate: Date, period: "daily" | "weekly" | "monthly") {
    try {
      const stats = await db.select({
        period: sql<string>`DATE_TRUNC('${sql.raw(period)}', created_at)`,
        totalUsers: sql<number>`count(distinct users.id)`,
        newRides: sql<number>`count(distinct rides.id)`,
        hotelBookings: sql<number>`count(distinct "hotelBookings".id)`,
        revenue: sql<string>`COALESCE(SUM(CAST(payment_references.gross_amount AS DECIMAL)), 0)`,
      })
        .from(users)
        .leftJoin(rides, eq(rides.driver_id, users.id))
        .leftJoin(hotelBookings, eq(hotelBookings.userId, users.id))
        .leftJoin(payment_references, and(
          eq(payment_references.booking_type, "hotel"),
          eq(payment_references.status, "confirmed")
        ))
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        ))
        .groupBy(sql<string>`DATE_TRUNC('${sql.raw(period)}', created_at)`);

      return stats;
    } catch (error) {
      console.error("Erro em getStatsByPeriod:", error);
      throw error;
    }
  },

  // ==================== USUÁRIOS ====================

  async listUsers({ page = 1, limit = 20, status, type, search }: any) {
    try {
      const offset = (page - 1) * limit;
      let query = db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        userType: users.userType,
        canDrive: users.can_drive,
        canManageHotels: users.can_manage_hotels,
        canBookServices: users.can_book_services,
        isAdmin: users.is_admin,
        isVerified: users.isVerified,
        verificationStatus: users.verificationStatus,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        rating: users.rating,
        totalReviews: users.totalReviews,
        profileImageUrl: users.profileImageUrl,
        driverVerificationStatus: users.driver_verification_status,
        hotelManagerVerificationStatus: users.hotel_manager_verification_status,
        clientVerificationStatus: users.client_verification_status,
        clientSuspendedAt: users.client_suspended_at,
        clientSuspensionReason: users.client_suspension_reason,
      }).from(users);

      const conditions = [];
      if (type === "driver") conditions.push(eq(users.can_drive, true));
      if (type === "hotel") conditions.push(eq(users.can_manage_hotels, true));
      if (type === "client") conditions.push(eq(users.can_book_services, true));
      if (status === "suspended") conditions.push(sql`${users.client_suspended_at} IS NOT NULL`);
      if (status === "verified") conditions.push(eq(users.isVerified, true));
      if (search) conditions.push(or(sql`${users.email} ILIKE ${"%" + search + "%"}`, sql`${users.fullName} ILIKE ${"%" + search + "%"}`));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(...conditions));
      const usersList = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

      // Calcular isVerified baseado nos verification statuses dos capabilities
      const usersWithVerification = usersList.map((user: any) => {
        let isVerified = true;
        
        // Se tem capability, deve estar verificado
        if (user.canDrive && user.driverVerificationStatus !== "verified") isVerified = false;
        if (user.canManageHotels && user.hotelManagerVerificationStatus !== "verified") isVerified = false;
        if (user.canBookServices && user.clientVerificationStatus !== "verified") isVerified = false;
        
        return {
          ...user,
          isVerified: isVerified
        };
      });

      return {
        users: usersWithVerification,
        pagination: {
          page,
          limit,
          total: Object.values(countResult[0])[0] || 0,
          pages: Math.ceil((Object.values(countResult[0])[0] || 0) / limit),
        }
      };
    } catch (error) {
      console.error("Erro em listUsers:", error);
      throw error;
    }
  },

  async getUserDetails(userId: string) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user.length) return null;

      // Buscar dados adicionais
      const userRides = await db.select({ count: sql<number>`count(*)` }).from(rides).where(eq(rides.driver_id, userId));
      const userBookings = await db.select({ count: sql<number>`count(*)` }).from(hotelBookings).where(eq(hotelBookings.userId, userId));
      const userComplaints = await db.select({ count: sql<number>`count(*)` }).from(complaints).where(or(eq(complaints.reporter_id, userId), eq(complaints.reported_id, userId)));

      return {
        ...user[0],
        stats: {
          rides: Object.values(userRides[0])[0] || 0,
          bookings: Object.values(userBookings[0])[0] || 0,
          complaints: Object.values(userComplaints[0])[0] || 0,
        }
      };
    } catch (error) {
      console.error("Erro em getUserDetails:", error);
      throw error;
    }
  },

  // ==================== SUSPENDER USUÁRIO ====================

  async suspendUser(userId: string, reason: string, adminId: string, endDate?: string) {
    try {
      const updateData: any = {
        client_suspended_at: new Date().toISOString(),
        client_suspension_reason: reason,
        updatedAt: new Date().toISOString(),
      };

      if (endDate) {
        updateData.client_suspension_end_date = endDate;
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Usuário suspenso com sucesso",
        data: { userId, suspended: true, reason }
      };
    } catch (error) {
      console.error("Erro em suspendUser:", error);
      throw error;
    }
  },

  async reactivateUser(userId: string, reason: string, adminId: string) {
    try {
      await db.update(users)
        .set({
          client_suspended_at: null,
          client_suspension_reason: null,
          client_suspension_end_date: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        message: "Usuário reativado com sucesso",
        data: { userId, suspended: false }
      };
    } catch (error) {
      console.error("Erro em reactivateUser:", error);
      throw error;
    }
  },

  // ==================== CAPABILITIES ====================

  async getVerificationQueue() {
    try {
      const drivers = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        type: sql<string>`'driver'`,
        status: users.driver_verification_status,
        createdAt: users.createdAt,
        verificationNotes: users.driver_verification_notes,
      })
        .from(users)
        .where(and(
          eq(users.can_drive, true),
          eq(users.driver_verification_status, "pending")
        ))
        .orderBy(desc(users.createdAt));

      const hotelManagers = await db.select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        type: sql<string>`'hotel_manager'`,
        status: users.hotel_manager_verification_status,
        createdAt: users.createdAt,
        verificationNotes: users.hotel_manager_verification_notes,
      })
        .from(users)
        .where(and(
          eq(users.can_manage_hotels, true),
          eq(users.hotel_manager_verification_status, "pending")
        ))
        .orderBy(desc(users.createdAt));

      return {
        drivers,
        hotelManagers,
        total: (drivers?.length || 0) + (hotelManagers?.length || 0),
      };
    } catch (error) {
      console.error("Erro em getVerificationQueue:", error);
      throw error;
    }
  },

  async approveDriver(userId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          can_drive: true,
          driver_verification_status: "verified",
          driver_verified_at: new Date().toISOString(),
          driver_verification_notes: reason || "Aprovado pelo admin",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Motorista aprovado" };
    } catch (error) {
      console.error("Erro em approveDriver:", error);
      throw error;
    }
  },

  async rejectDriver(userId: string, adminId: string, reason: string) {
    try {
      await db.update(users)
        .set({
          can_drive: false,
          driver_verification_status: "rejected",
          driver_verification_notes: reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Motorista rejeitado" };
    } catch (error) {
      console.error("Erro em rejectDriver:", error);
      throw error;
    }
  },

  async approveHotelManager(userId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          can_manage_hotels: true,
          hotel_manager_verification_status: "verified",
          hotel_manager_verified_at: new Date().toISOString(),
          hotel_manager_verification_notes: reason || "Aprovado pelo admin",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Gestor de hotel aprovado" };
    } catch (error) {
      console.error("Erro em approveHotelManager:", error);
      throw error;
    }
  },

  async rejectHotelManager(userId: string, adminId: string, reason: string) {
    try {
      await db.update(users)
        .set({
          can_manage_hotels: false,
          hotel_manager_verification_status: "rejected",
          hotel_manager_verification_notes: reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Gestor de hotel rejeitado" };
    } catch (error) {
      console.error("Erro em rejectHotelManager:", error);
      throw error;
    }
  },

  async suspendDriver(userId: string, adminId: string, reason: string, end_date?: string) {
    try {
      await db.update(users)
        .set({
          driver_verification_status: "suspended",
          driver_verification_notes: reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId));

      return { success: true, message: "Motorista suspenso" };
    } catch (error) {
      console.error("Erro em suspendDriver:", error);
      throw error;
    }
  },

  async suspendClient(userId: string, adminId: string, reason: string, end_date?: string) {
    try {
      await adminService.suspendUser(userId, reason, adminId, end_date);
      return { success: true, message: "Cliente suspenso" };
    } catch (error) {
      console.error("Erro em suspendClient:", error);
      throw error;
    }
  },

  async reactivateClient(userId: string, adminId: string, reason?: string) {
    try {
      await adminService.reactivateUser(userId, reason || "", adminId);
      return { success: true, message: "Cliente reativado" };
    } catch (error) {
      console.error("Erro em reactivateClient:", error);
      throw error;
    }
  },

  // ==================== COMPLAINTS ====================

  async listComplaints({ page = 1, limit = 20, status, priority }: any) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      if (status) conditions.push(eq(complaints.status, status));
      if (priority) conditions.push(eq(complaints.priority, priority));

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(complaints).where(and(...conditions));
      const complaintsList = await db.select()
        .from(complaints)
        .where(and(...conditions))
        .orderBy(desc(complaints.created_at))
        .limit(limit)
        .offset(offset);

      return {
        complaints: complaintsList,
        pagination: {
          page,
          limit,
          total: Object.values(countResult[0])[0] || 0,
        }
      };
    } catch (error) {
      console.error("Erro em listComplaints:", error);
      throw error;
    }
  },

  async getComplaintDetails(complaintId: string) {
    try {
      const complaint = await db.select().from(complaints).where(eq(complaints.id, complaintId)).limit(1);
      return complaint[0] || null;
    } catch (error) {
      console.error("Erro em getComplaintDetails:", error);
      throw error;
    }
  },

  async updateComplaintStatus(complaintId: string, adminId: string, status: string, resolution?: string) {
    try {
      await db.update(complaints)
        .set({
          status,
          resolution,
          assigned_admin_id: adminId,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where(eq(complaints.id, complaintId));

      return { success: true, message: "Reclamação atualizada" };
    } catch (error) {
      console.error("Erro em updateComplaintStatus:", error);
      throw error;
    }
  },

  // ==================== HOTÉIS ====================

  async listHotels({ page = 1, limit = 20, status, search }: any) {
    try {
      const offset = (page - 1) * limit;
      const hotelUsers = await db.select()
        .from(users)
        .where(and(
          eq(users.can_manage_hotels, true),
          search ? or(
            sql`${users.email} ILIKE ${"%" + search + "%"}`,
            sql`${users.fullName} ILIKE ${"%" + search + "%"}`
          ) : undefined
        ))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const count = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.can_manage_hotels, true));

      return {
        hotels: hotelUsers,
        pagination: {
          page,
          limit,
          total: Object.values(count[0])[0] || 0,
        }
      };
    } catch (error) {
      console.error("Erro em listHotels:", error);
      throw error;
    }
  },

  async getHotelDetails(hotelId: string) {
    try {
      const hotel = await db.select().from(users).where(eq(users.id, hotelId)).limit(1);
      if (!hotel.length) return null;

      const bookings = await db.select({ count: sql<number>`count(*)` }).from(hotelBookings).where(eq(hotelBookings.userId, hotelId));

      return {
        ...hotel[0],
        stats: {
          bookings: Object.values(bookings[0])[0] || 0,
        }
      };
    } catch (error) {
      console.error("Erro em getHotelDetails:", error);
      throw error;
    }
  },

  async suspendHotel(hotelId: string, adminId: string, reason: string) {
    try {
      await db.update(users)
        .set({
          can_manage_hotels: false,
          hotel_manager_verification_status: "suspended",
          hotel_manager_verification_notes: reason,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, hotelId));

      return { success: true, message: "Hotel suspenso" };
    } catch (error) {
      console.error("Erro em suspendHotel:", error);
      throw error;
    }
  },

  async activateHotel(hotelId: string, adminId: string, reason?: string) {
    try {
      await db.update(users)
        .set({
          can_manage_hotels: true,
          hotel_manager_verification_status: "verified",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, hotelId));

      return { success: true, message: "Hotel ativado" };
    } catch (error) {
      console.error("Erro em activateHotel:", error);
      throw error;
    }
  },

  // ==================== PAGAMENTOS ====================

  async listPaymentReferences({ page = 1, limit = 20, status, booking_type, provider_id }: any) {
    try {
      const offset = (page - 1) * limit;
      const conditions = [];
      if (status) conditions.push(eq(payment_references.status, status));
      if (booking_type) conditions.push(eq(payment_references.booking_type, booking_type));
      if (provider_id) conditions.push(eq(payment_references.provider_user_id, provider_id));

      const countResult = await db.select({ count: sql<number>`count(*)` }).from(payment_references).where(and(...conditions));
      const references = await db.select()
        .from(payment_references)
        .where(and(...conditions))
        .orderBy(desc(payment_references.created_at))
        .limit(limit)
        .offset(offset);

      return {
        references,
        pagination: {
          page,
          limit,
          total: Object.values(countResult[0])[0] || 0,
        }
      };
    } catch (error) {
      console.error("Erro em listPaymentReferences:", error);
      throw error;
    }
  },

  async getPaymentStats() {
    try {
      const total = await db.select({ sum: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)` }).from(payment_references);
      const pending = await db.select({ sum: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)` }).from(payment_references).where(eq(payment_references.status, "pending"));
      const confirmed = await db.select({ sum: sql<string>`COALESCE(SUM(CAST(gross_amount AS DECIMAL)), 0)` }).from(payment_references).where(eq(payment_references.status, "confirmed"));

      return {
        total: Object.values(total[0])[0] || "0",
        pending: Object.values(pending[0])[0] || "0",
        confirmed: Object.values(confirmed[0])[0] || "0",
      };
    } catch (error) {
      console.error("Erro em getPaymentStats:", error);
      throw error;
    }
  },

  async confirmPayment(paymentId: string, adminId: string, notes?: string) {
    try {
      await db.update(payment_references)
        .set({
          status: "confirmed",
          paid_at: new Date().toISOString(),
          confirmed_by: adminId,
          notes,
          updated_at: new Date().toISOString(),
        })
        .where(eq(payment_references.id, paymentId));

      return { success: true, message: "Pagamento confirmado" };
    } catch (error) {
      console.error("Erro em confirmPayment:", error);
      throw error;
    }
  },

  // ==================== TAXAS ====================

  async getCurrentFees() {
    try {
      // Retornar taxas padrão (pode ser estendido com tabela de fees)
      return {
        rides: { percentage: 15, description: "Taxa de corridas" },
        hotels: { percentage: 12, description: "Taxa de hotéis" },
        events: { percentage: 18, description: "Taxa de eventos" },
      };
    } catch (error) {
      console.error("Erro em getCurrentFees:", error);
      throw error;
    }
  },

  async updateFee(service_type: string, fee_percentage: number, adminId: string, reason?: string) {
    try {
      // Implementar atualização de taxas em tabela dedicada quando disponível
      return {
        success: true,
        message: "Taxa atualizada",
        data: { service_type, fee_percentage }
      };
    } catch (error) {
      console.error("Erro em updateFee:", error);
      throw error;
    }
  },

  // ==================== AUDITORIA ====================

  async getAdminLogs({ page = 1, limit = 50, adminId }: any) {
    try {
      // Retornar logs vazios por enquanto (implementar quando tabela de auditoria estiver pronta)
      return {
        logs: [],
        pagination: {
          page,
          limit,
          total: 0,
        }
      };
    } catch (error) {
      console.error("Erro em getAdminLogs:", error);
      throw error;
    }
  },
};
