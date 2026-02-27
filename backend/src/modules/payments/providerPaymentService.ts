// src/modules/payments/providerPaymentService.ts
/**
 * Serviço para gestão de pagamentos de provedores
 * - Rides: Motoristas pagam comissão após corrida concluída
 * - Hotels: Hotéis pagam comissão após checkout de reserva
 * Ambos com 7 dias de prazo
 */

import { db } from "../../../server/db";
import {
  users,
  rides,
  hotelBookings,
  payment_references,
  userEntities,
  user_documents,
} from "../../../shared/schema";
import { sql, eq, and, gte, lte, or, desc } from "drizzle-orm";

export const providerPaymentService = {
  // ==================== CRIAR COMISSÃO - RIDE ====================

  /**
   * Cria obrigação de pagamento quando motorista conclui corrida
   * Chamado ao marcar ride como "completed"
   */
  async createRideCommission(rideId: string) {
    try {
      // 1. Buscar ride
      const rideData = await db
        .select()
        .from(rides)
        .where(eq(rides.id, rideId))
        .limit(1);

      if (!rideData.length) {
        throw new Error("Ride não encontrada");
      }

      const ride = rideData[0];

      // 2. Buscar entidade do motorista
      const entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, ride.driver_id))
        .limit(1);

      if (!entityData.length) {
        // Criar entidade automáticamente se não existir
        const newEntity = {
          id: `entity_${ride.driver_id}`,
          user_id: ride.driver_id,
          entity_code: `DRIVER_${ride.driver_id.substring(0, 8).toUpperCase()}`,
          entity_name: `Driver Entity`,
          entity_type: "individual",
          status: "active",
          created_at: new Date().toISOString(),
        };
        await db.insert(userEntities).values(newEntity);
        var entityCode = newEntity.entity_code;
      } else {
        var entityCode = entityData[0].entity_code;
      }

      // 3. Calcular comissão (12%)
      const grossAmount = ride.pricePerSeat || 0;
      const feePercentage = 12;
      const feeAmount = (grossAmount * feePercentage) / 100;
      const netAmount = grossAmount - feeAmount;

      // 4. Gerar referência única
      const timestamp = Date.now();
      const referenceNumber = `LINKA-RIDE-${timestamp}-${ride.id.substring(0, 8)}`;

      // 5. Criar payment reference
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // +7 dias

      const paymentRef = {
        id: `payment_${timestamp}_${rideId}`,
        reference_number: referenceNumber,
        booking_id: rideId,
        booking_type: "ride",
        provider_user_id: ride.driver_id,
        provider_entity_id: entityData[0]?.id || `entity_${ride.driver_id}`,
        provider_entity_code: entityCode,
        client_user_id: null,
        gross_amount: grossAmount.toString(),
        fee_percentage: feePercentage.toString(),
        fee_amount: feeAmount.toString(),
        net_amount: netAmount.toString(),
        service_date: new Date().toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        status: "pending",
        paid_at: null,
        payment_method: null,
        payment_proof_url: null,
        confirmed_by: null,
        notes: `Comissão de corrida ID: ${rideId}`,
        metadata: JSON.stringify({
          from_city: ride.fromCity,
          to_city: ride.toCity,
          price_per_seat: ride.pricePerSeat,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.insert(payment_references).values(paymentRef);

      console.log(`✅ [PAYMENT] Comissão criada para motorista ${ride.driver_id}`);
      return {
        success: true,
        paymentReference: referenceNumber,
        amount: feeAmount,
        dueDate: dueDate.toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("Erro em createRideCommission:", error);
      throw error;
    }
  },

  // ==================== CRIAR COMISSÃO - HOTEL ====================

  /**
   * Cria obrigação de pagamento quando cliente faz checkout em hotel
   * Chamado ao marcar reserva como "paid" ou "completed"
   */
  async createHotelCommission(bookingId: string) {
    try {
      // 1. Buscar booking
      const bookingData = await db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, bookingId))
        .limit(1);

      if (!bookingData.length) {
        throw new Error("Hotel booking não encontrada");
      }

      const booking = bookingData[0];

      // 2. Buscar hotel manager (user_id do hotel)
      const hotelData = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.userId)) // userId is the hotel manager
        .limit(1);

      if (!hotelData.length) {
        throw new Error("Hotel manager não encontrado");
      }

      // 3. Buscar entidade do hotel
      const entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, booking.userId))
        .limit(1);

      if (!entityData.length) {
        // Criar entidade automáticamente se não existir
        const newEntity = {
          id: `entity_${booking.userId}`,
          user_id: booking.userId,
          entity_code: `HOTEL_${booking.userId.substring(0, 8).toUpperCase()}`,
          entity_name: `Hotel Entity`,
          entity_type: "company",
          status: "active",
          created_at: new Date().toISOString(),
        };
        await db.insert(userEntities).values(newEntity);
        var entityCode = newEntity.entity_code;
      } else {
        var entityCode = entityData[0].entity_code;
      }

      // 4. Calcular comissão (12%)
      const grossAmount = booking.totalPrice || 0;
      const feePercentage = 12;
      const feeAmount = (grossAmount * feePercentage) / 100;
      const netAmount = grossAmount - feeAmount;

      // 5. Gerar referência única
      const timestamp = Date.now();
      const referenceNumber = `LINKA-HOTEL-${timestamp}-${bookingId.substring(0, 8)}`;

      // 6. Criar payment reference
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // +7 dias

      const paymentRef = {
        id: `payment_${timestamp}_${bookingId}`,
        reference_number: referenceNumber,
        booking_id: bookingId,
        booking_type: "hotel",
        provider_user_id: booking.userId, // hotel manager
        provider_entity_id: entityData[0]?.id || `entity_${booking.userId}`,
        provider_entity_code: entityCode,
        client_user_id: null,
        gross_amount: grossAmount.toString(),
        fee_percentage: feePercentage.toString(),
        fee_amount: feeAmount.toString(),
        net_amount: netAmount.toString(),
        service_date: booking.checkIn,
        due_date: dueDate.toISOString().split("T")[0],
        status: "pending",
        paid_at: null,
        payment_method: null,
        payment_proof_url: null,
        confirmed_by: null,
        notes: `Comissão de reserva de hotel ID: ${bookingId}`,
        metadata: JSON.stringify({
          guest_name: booking.guestName,
          check_in: booking.checkIn,
          check_out: booking.checkOut,
          nights: booking.nights,
          total_price: booking.totalPrice,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.insert(payment_references).values(paymentRef);

      console.log(`✅ [PAYMENT] Comissão criada para hotel ${booking.userId}`);
      return {
        success: true,
        paymentReference: referenceNumber,
        amount: feeAmount,
        dueDate: dueDate.toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("Erro em createHotelCommission:", error);
      throw error;
    }
  },

  // ==================== LISTAR COMISSÕES DO PROVEDOR ====================

  async getProviderCommissions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    } = {}
  ) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = db
        .select({
          id: payment_references.id,
          referenceNumber: payment_references.reference_number,
          bookingId: payment_references.booking_id,
          bookingType: payment_references.booking_type,
          grossAmount: payment_references.gross_amount,
          feeAmount: payment_references.fee_amount,
          netAmount: payment_references.net_amount,
          status: payment_references.status,
          dueDate: payment_references.due_date,
          serviceDate: payment_references.service_date,
          paidAt: payment_references.paid_at,
          paymentProofUrl: payment_references.payment_proof_url,
          notes: payment_references.notes,
          metadata: payment_references.metadata,
        })
        .from(payment_references)
        .where(eq(payment_references.provider_user_id, userId));

      // Filtros
      if (options.status) {
        query = query.where(eq(payment_references.status, options.status));
      }
      if (options.type) {
        query = query.where(eq(payment_references.booking_type, options.type));
      }

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(payment_references)
        .where(eq(payment_references.provider_user_id, userId));

      const commissions = await query
        .orderBy(desc(payment_references.due_date))
        .limit(limit)
        .offset(offset);

      // Calcular resumo
      const pendingTotal = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(fee_amount AS DECIMAL)), 0)`,
        })
        .from(payment_references)
        .where(
          and(
            eq(payment_references.provider_user_id, userId),
            eq(payment_references.status, "pending")
          )
        );

      const overdueDays = await db
        .select({
          count: sql<number>`count(*)`,
          total: sql<string>`COALESCE(SUM(CAST(fee_amount AS DECIMAL)), 0)`,
        })
        .from(payment_references)
        .where(
          and(
            eq(payment_references.provider_user_id, userId),
            eq(payment_references.status, "pending"),
            sql`${payment_references.due_date} < NOW()::date`
          )
        );

      return {
        commissions: commissions.map((c) => ({
          ...c,
          daysUntilDue: Math.ceil(
            (new Date(c.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
          isOverdue: new Date(c.dueDate) < new Date(),
        })),
        pagination: {
          page,
          limit,
          total: Object.values(countResult[0])[0] || 0,
          pages: Math.ceil((Object.values(countResult[0])[0] || 0) / limit),
        },
        summary: {
          pendingAmount: Object.values(pendingTotal[0])[0] || "0",
          overdueCount: overdueDays[0]?.count || 0,
          overdueAmount: overdueDays[0]?.total || "0",
        },
      };
    } catch (error) {
      console.error("Erro em getProviderCommissions:", error);
      throw error;
    }
  },

  // ==================== MARCAR COMO PAGO ====================

  async markAsPaid(
    paymentId: string,
    userId: string,
    proofUrl?: string,
    notes?: string
  ) {
    try {
      // Verificar que pertence ao usuário
      const payment = await db
        .select()
        .from(payment_references)
        .where(eq(payment_references.id, paymentId))
        .limit(1);

      if (!payment.length) {
        throw new Error("Pagamento não encontrado");
      }

      if (payment[0].provider_user_id !== userId) {
        throw new Error("Não pode marcar pagamento de outro usuário");
      }

      // Atualizar
      await db
        .update(payment_references)
        .set({
          status: "pending_confirmation", // Admin ainda precisa confirmar
          paid_at: new Date().toISOString(),
          payment_proof_url: proofUrl || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .where(eq(payment_references.id, paymentId));

      console.log(`✅ [PAYMENT] Pagamento marcado como pago: ${paymentId}`);
      return {
        success: true,
        message: "Pagamento marcado. Aguardando confirmação do admin.",
      };
    } catch (error) {
      console.error("Erro em markAsPaid:", error);
      throw error;
    }
  },

  // ==================== ADMIN: CONFIRMAR PAGAMENTO ====================

  async confirmPayment(paymentId: string, adminId: string, notes?: string) {
    try {
      // Verificar que é admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);

      if (!admin.length || !admin[0].is_admin) {
        throw new Error("Apenas admins podem confirmar pagamentos");
      }

      // Atualizar
      await db
        .update(payment_references)
        .set({
          status: "confirmed",
          confirmed_by: adminId,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .where(eq(payment_references.id, paymentId));

      console.log(`✅ [PAYMENT] Pagamento confirmado por admin: ${paymentId}`);
      return {
        success: true,
        message: "Pagamento confirmado com sucesso",
      };
    } catch (error) {
      console.error("Erro em confirmPayment:", error);
      throw error;
    }
  },

  // ==================== ADMIN: REJEITAR PAGAMENTO ====================

  async rejectPayment(paymentId: string, adminId: string, reason: string) {
    try {
      // Verificar que é admin
      const admin = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);

      if (!admin.length || !admin[0].is_admin) {
        throw new Error("Apenas admins podem rejeitar pagamentos");
      }

      // Atualizar
      await db
        .update(payment_references)
        .set({
          status: "rejected",
          confirmed_by: adminId,
          notes: `REJEITADO: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .where(eq(payment_references.id, paymentId));

      console.log(`❌ [PAYMENT] Pagamento rejeitado: ${paymentId}`);
      return {
        success: true,
        message: "Pagamento rejeitado",
      };
    } catch (error) {
      console.error("Erro em rejectPayment:", error);
      throw error;
    }
  },
};
