import { db } from '../../../db';

import { paymentReferences, userEntities, rides, hotelBookings, users, eventBookings, hotels, platformFeeConfig } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * SERVIÇO DE PAGAMENTOS PARA PROVEDORES
 * - Cria e gerencia comissões automaticamente (taxa lida de platformFeeConfig, fallback 12%)
 * - Gera referências únicas (LINKA-RIDE-xxxxx, LINKA-HOTEL-xxxxx, LINKA-EVENT-xxxxx)
 * - Gera entidades únicas por provedor (DRIVER_xxxxx, HOTEL_xxxxx)
 * - Vencimento individual: 30 dias (default do schema)
 *
 * FLUXO DE ESTADOS (ÚNICO E COERENTE):
 *   pending         -> comissão criada, aguardando pagamento pelo provedor
 *   proof_uploaded  -> provedor enviou comprovativo, aguardando confirmação do admin
 *   paid            -> admin confirmou o pagamento
 *   rejected        -> admin rejeitou o comprovativo (provedor pode reenviar -> volta a proof_uploaded)
 */

export class ProviderPaymentService {
  /**
   * Lê a taxa de comissão ativa para um tipo de serviço.
   * Fonte: platformFeeConfig (dinâmico). Fallback: 12%.
   * @param serviceType 'ride' | 'hotel' | 'event'
   */
  async getFeePercentage(serviceType: string): Promise<number> {
    try {
      const serviceTypeMap: Record<string, string[]> = {
        ride: ['ride'],
        hotel: ['accommodation', 'hotel'],
        event: ['event'],
      };
      const candidates = serviceTypeMap[serviceType] || [serviceType];
      const inList = sql.raw(`('${candidates.join("','")}')`);

      const config = await db
        .select({ fee_percentage: platformFeeConfig.fee_percentage })
        .from(platformFeeConfig)
        .where(
          and(
            eq(platformFeeConfig.is_active, true),
            sql`${platformFeeConfig.service_type} IN ${inList}`
          )
        )
        .orderBy(desc(platformFeeConfig.effective_from))
        .limit(1);

      if (config.length > 0 && config[0].fee_percentage) {
        const pct = parseFloat(config[0].fee_percentage.toString());
        if (!isNaN(pct) && pct >= 0 && pct <= 100) return pct;
      }
      return 12;
    } catch (error) {
      console.error('⚠️ Erro ao ler platformFeeConfig, usando fallback 12%:', error);
      return 12;
    }
  }

  /**
   * Helper: garante entity_code do utilizador (cria se não existir).
   */
  private async ensureEntityCode(
    userId: string,
    prefix: 'DRIVER' | 'HOTEL',
    entityType: string
  ): Promise<string> {
    const existing = await db
      .select()
      .from(userEntities)
      .where(eq(userEntities.user_id, userId))
      .limit(1);

    if (existing.length > 0) {
      return (existing[0] as any).entity_code;
    }

    const code = `${prefix}_${userId.substring(0, 8)}`;
    await db.insert(userEntities).values({
      user_id: userId,
      entity_code: code,
      entity_prefix: prefix === 'DRIVER' ? 'DRV' : 'HTL',
      entity_type: entityType,
      created_at: new Date(),
    } as any);
    return code;
  }

  /**
   * Helper: verifica se já existe comissão para um booking.
   */
  private async findExistingCommission(bookingId: string, bookingType: string) {
    const existing = await db
      .select({ id: paymentReferences.id, reference_number: paymentReferences.reference_number, status: paymentReferences.status })
      .from(paymentReferences)
      .where(
        and(
          eq(paymentReferences.booking_id, bookingId as any),
          eq(paymentReferences.booking_type, bookingType)
        )
      )
      .limit(1);
    return existing.length > 0 ? (existing[0] as any) : null;
  }

  /**
   * Cria comissão automaticamente ao completar uma ride.
   * Taxa lida de platformFeeConfig. Vencimento: 30 dias (default schema).
   */
  async createRideCommission(rideId: string) {
    try {
      console.log(`💳 Criando comissão para ride ${rideId}...`);

      const existing = await this.findExistingCommission(rideId, 'ride');
      if (existing) {
        console.log(`⚠️ Comissão já existe para ride ${rideId}. Status: ${existing.status}. Ignorando duplicata.`);
        return {
          success: true,
          message: 'Comissão já foi criada anteriormente',
          referenceNumber: existing.reference_number || '',
          status: existing.status,
          skipped: true,
        };
      }

      const rideData = await db.select().from(rides).where(eq(rides.id, rideId)).limit(1);
      if (!rideData || rideData.length === 0) {
        throw new Error(`Ride ${rideId} não encontrada`);
      }

      const ride = rideData[0];
      const driverId = ride.driverId;
      if (!driverId) {
        throw new Error(`Driver ID não encontrado para ride ${rideId}`);
      }

      const feePercentage = await this.getFeePercentage('ride');
      const grossAmount = parseFloat((ride as any).price_per_seat?.toString() || '0') * ((ride as any).passenger_count || 1);
      const feeAmount = (grossAmount * feePercentage) / 100;
      const netAmount = grossAmount - feeAmount;

      const timestamp = Date.now();
      const referenceNumber = `LINKA-RIDE-${timestamp}-${rideId.substring(0, 10)}`;
      const entityCode = await this.ensureEntityCode(driverId, 'DRIVER', 'driver');

      await db.insert(paymentReferences).values({
        reference_number: referenceNumber,
        booking_id: rideId as any,
        booking_type: 'ride',
        provider_user_id: driverId,
        provider_entity_code: entityCode,
        gross_amount: grossAmount.toString() as any,
        fee_percentage: feePercentage.toString() as any,
        status: 'pending',
        service_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log(`✅ Comissão criada: ${referenceNumber} | ${feeAmount.toFixed(2)} MZN (${feePercentage}%)`);

      return {
        success: true,
        referenceNumber,
        entityCode,
        grossAmount,
        feeAmount,
        netAmount,
        feePercentage,
        message: `Comissão de ${feeAmount.toFixed(2)} MZN criada com sucesso`,
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão de ride:', error);
      throw error;
    }
  }

  /**
   * Cria comissão automaticamente ao fazer checkout de hotel.
   * Taxa lida de platformFeeConfig. Vencimento: 30 dias (default schema).
   */
  async createHotelCommission(bookingId: string) {
    try {
      console.log(`💳 Criando comissão para hotel booking ${bookingId}...`);

      const existing = await this.findExistingCommission(bookingId, 'hotel');
      if (existing) {
        console.log(`⚠️ Comissão já existe para hotel booking ${bookingId}. Ignorando.`);
        return { success: true, message: 'Comissão já foi criada anteriormente', skipped: true };
      }

      const bookingData = await db.select().from(hotelBookings).where(eq(hotelBookings.id, bookingId)).limit(1);
      if (!bookingData || bookingData.length === 0) {
        throw new Error(`Booking ${bookingId} não encontrada`);
      }

      const booking = bookingData[0];
      const hotelId = (booking as any).hotelId;
      if (!hotelId) {
        throw new Error(`Hotel ID não encontrado para booking ${bookingId}`);
      }

      const feePercentage = await this.getFeePercentage('hotel');
      const grossAmount = parseFloat((booking as any).totalPrice?.toString() || '0');
      const feeAmount = (grossAmount * feePercentage) / 100;
      const netAmount = grossAmount - feeAmount;

      const timestamp = Date.now();
      const referenceNumber = `LINKA-HOTEL-${timestamp}-${bookingId.substring(0, 10)}`;

      const hotelData = await db
        .select({ host_id: hotels.host_id })
        .from(hotels)
        .where(eq(hotels.id, hotelId))
        .limit(1);

      let providerUserId: string;
      if (hotelData && hotelData.length > 0 && (hotelData[0] as any).host_id) {
        providerUserId = (hotelData[0] as any).host_id;
      } else {
        throw new Error(`Host (dono) não encontrado para o hotel ${hotelId}`);
      }

      const entityCode = await this.ensureEntityCode(providerUserId, 'HOTEL', 'hotel_manager');

      await db.insert(paymentReferences).values({
        reference_number: referenceNumber,
        booking_id: bookingId as any,
        booking_type: 'hotel',
        provider_user_id: providerUserId,
        provider_entity_code: entityCode,
        gross_amount: grossAmount.toString() as any,
        fee_percentage: feePercentage.toString() as any,
        status: 'pending',
        service_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log(`✅ Comissão criada: ${referenceNumber} | ${feeAmount.toFixed(2)} MZN (${feePercentage}%)`);

      return {
        success: true,
        referenceNumber,
        entityCode,
        grossAmount,
        feeAmount,
        netAmount,
        feePercentage,
        message: `Comissão de ${feeAmount.toFixed(2)} MZN criada com sucesso`,
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão de hotel:', error);
      throw error;
    }
  }

  /**
   * Cria comissão automaticamente ao completar uma reserva de evento.
   * Taxa lida de platformFeeConfig. Vencimento: 30 dias (default schema).
   */
  async createEventCommission(bookingId: string) {
    try {
      console.log(`💳 Criando comissão para event booking ${bookingId}...`);

      const existing = await this.findExistingCommission(bookingId, 'event');
      if (existing) {
        console.log(`⚠️ Comissão já existe para event booking ${bookingId}. Ignorando.`);
        return { success: true, message: 'Comissão já foi criada anteriormente', skipped: true };
      }

      const bookingData = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId)).limit(1);
      if (!bookingData || bookingData.length === 0) {
        throw new Error(`Event booking ${bookingId} não encontrada`);
      }

      const booking = bookingData[0] as any;
      const hotelId = booking.hotelId || booking.hotel_id;
      if (!hotelId) {
        throw new Error(`Hotel ID não encontrado para event booking ${bookingId}`);
      }

      const feePercentage = await this.getFeePercentage('event');
      const grossAmount = parseFloat(booking.totalPrice?.toString() || booking.total_price?.toString() || '0');
      const feeAmount = (grossAmount * feePercentage) / 100;
      const netAmount = grossAmount - feeAmount;

      const timestamp = Date.now();
      const referenceNumber = `LINKA-EVENT-${timestamp}-${bookingId.substring(0, 10)}`;
      const entityCode = await this.ensureEntityCode(hotelId, 'HOTEL', 'hotel_manager');

      await db.insert(paymentReferences).values({
        reference_number: referenceNumber,
        booking_id: bookingId,
        booking_type: 'event',
        provider_user_id: hotelId,
        provider_entity_code: entityCode,
        gross_amount: grossAmount.toString(),
        fee_percentage: feePercentage.toString(),
        status: 'pending',
        service_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log(`✅ Comissão criada: ${referenceNumber} | ${feeAmount.toFixed(2)} MZN (${feePercentage}%)`);

      return {
        success: true,
        referenceNumber,
        entityCode,
        grossAmount,
        feeAmount,
        netAmount,
        feePercentage,
        message: `Comissão de ${feeAmount.toFixed(2)} MZN criada com sucesso`,
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão de evento:', error);
      throw error;
    }
  }

  /**
   * Lista todas as comissões de um provedor com paginação e resumo.
   */
  async getProviderCommissions(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  } = {}) {
    try {
      const page = options.page || 1;
      const limit = Math.min(options.limit || 20, 100);
      const offset = (page - 1) * limit;

      const entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, userId))
        .limit(1);

      if (!entityData || entityData.length === 0) {
        return {
          success: true,
          data: [],
          pagination: { page, limit, total: 0, pages: 0 },
          summary: { pendingAmount: 0, overdueCount: 0, overdueAmount: 0 },
        };
      }

      const entityCode = entityData[0].entity_code;
      const conditions: any[] = [eq(paymentReferences.provider_entity_code, entityCode)];
      if (options.status) conditions.push(eq(paymentReferences.status, options.status as any));
      if (options.type) conditions.push(eq(paymentReferences.booking_type, options.type as any));
      const whereClause = and(...conditions);

      const allRows = await db
        .select()
        .from(paymentReferences)
        .where(whereClause)
        .orderBy(desc(paymentReferences.created_at));

      const total = allRows.length;
      const pages = Math.ceil(total / limit);
      const commissions = allRows.slice(offset, offset + limit);

      const now = new Date();
      let pendingAmount = 0;
      let overdueCount = 0;
      let overdueAmount = 0;

      allRows.forEach((c: any) => {
        if (c.status === 'pending' || c.status === 'proof_uploaded') {
          const fee = parseFloat(c.fee_amount?.toString() || '0');
          pendingAmount += fee;
          if (c.due_date && new Date(c.due_date) < now) {
            overdueCount++;
            overdueAmount += fee;
          }
        }
      });

      const data = commissions.map((c: any) => {
        const dueDate = c.due_date ? new Date(c.due_date) : null;
        const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        return {
          id: c.id,
          referenceNumber: c.reference_number,
          type: c.booking_type,
          grossAmount: parseFloat(c.gross_amount?.toString() || '0'),
          feeAmount: parseFloat(c.fee_amount?.toString() || '0'),
          netAmount: parseFloat(c.net_amount?.toString() || '0'),
          status: c.status,
          dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
          daysUntilDue,
          isOverdue: daysUntilDue !== null && daysUntilDue < 0,
          hasProof: !!c.payment_proof_url,
          createdAt: c.created_at,
          paidAt: c.paid_at,
          notes: c.notes,
        };
      });

      return {
        success: true,
        data,
        pagination: { page, limit, total, pages },
        summary: {
          pendingAmount: Math.round(pendingAmount * 100) / 100,
          overdueCount,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
        },
      };
    } catch (error) {
      console.error('❌ Erro ao listar comissões:', error);
      throw error;
    }
  }

  /**
   * Provedor envia comprovativo de pagamento.
   * Transição: pending|rejected -> proof_uploaded.
   */
  async markAsPaid(paymentId: string, userId: string, proofUrl?: string, notes?: string) {
    try {
      console.log(`💳 Provedor ${userId} enviando comprovativo para ${paymentId}...`);

      const paymentData = await db
        .select()
        .from(paymentReferences)
        .where(eq(paymentReferences.id, paymentId as any))
        .limit(1);

      if (!paymentData || paymentData.length === 0) {
        throw new Error(`Pagamento ${paymentId} não encontrado`);
      }

      const payment: any = paymentData[0];

      // Autorização: o utilizador tem de ser o dono da entity
      const entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, userId))
        .limit(1);

      if (
        !entityData ||
        entityData.length === 0 ||
        (entityData[0] as any).entity_code !== payment.provider_entity_code
      ) {
        throw new Error('Acesso negado: você não é o dono desta comissão');
      }

      if (payment.status === 'paid') {
        throw new Error('Esta comissão já foi confirmada como paga');
      }

      await db.update(paymentReferences)
        .set({
          status: 'proof_uploaded' as any,
          paid_at: new Date(),
          payment_proof_url: proofUrl,
          notes,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`✅ Comprovativo registado (proof_uploaded)`);

      return {
        success: true,
        message: 'Comprovativo enviado. Aguardando confirmação do administrador.',
      };
    } catch (error) {
      console.error('❌ Erro ao enviar comprovativo:', error);
      throw error;
    }
  }

  /**
   * Admin confirma o pagamento (chamado apenas por admin autenticado).
   * Transição: proof_uploaded|pending -> paid.
   */
  async confirmPayment(paymentId: string, adminId: string, notes?: string) {
    try {
      console.log(`✅ Admin ${adminId} confirmando pagamento ${paymentId}...`);

      await db.update(paymentReferences)
        .set({
          status: 'paid' as any,
          paid_at: new Date(),
          confirmed_by: adminId,
          notes,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`✅ Pagamento confirmado pelo admin`);
      return { success: true, message: 'Pagamento confirmado com sucesso' };
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  /**
   * Admin rejeita o comprovativo.
   * Transição: proof_uploaded -> rejected (o provedor pode reenviar).
   */
  async rejectPayment(paymentId: string, adminId: string, reason: string) {
    try {
      console.log(`❌ Admin ${adminId} rejeitando pagamento ${paymentId}...`);

      if (!reason) {
        throw new Error('Motivo da rejeição é obrigatório');
      }

      await db.update(paymentReferences)
        .set({
          status: 'rejected' as any,
          confirmed_by: adminId,
          notes: reason,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`❌ Pagamento rejeitado`);
      return { success: true, message: 'Pagamento rejeitado' };
    } catch (error) {
      console.error('❌ Erro ao rejeitar pagamento:', error);
      throw error;
    }
  }
}

export default new ProviderPaymentService();