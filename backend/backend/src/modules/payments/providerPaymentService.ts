import { db } from '../../../db';
import { paymentReferences, userEntities, rides, hotelBookings, users } from '../../../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * SERVIÇO DE PAGAMENTOS PARA PROVEDORES
 * - Cria e gerencia comissões automaticamente (12% de cada transação)
 * - Gera referências únicas (LINKA-RIDE-xxxxx, LINKA-HOTEL-xxxxx)
 * - Gera entidades únicas por provedor (DRIVER_xxxxx, HOTEL_xxxxx)
 * - Define vencimento individual (7 dias por transação)
 */

export class ProviderPaymentService {
  /**
   * Cria comissão automaticamente ao completar uma ride
   * - Aplica 12% sobre o valor total
   * - Gera referência LINKA-RIDE-[timestamp]-[booking_id]
   * - Define vencimento = hoje + 7 dias
   */
  async createRideCommission(rideId: string) {
    try {
      console.log(`💳 Criando comissão para ride ${rideId}...`);
      
      // Buscar dados da ride
      const rideData = await db
        .select()
        .from(rides)
        .where(eq(rides.id, rideId))
        .limit(1);

      if (!rideData || rideData.length === 0) {
        throw new Error(`Ride ${rideId} não encontrada`);
      }

      const ride = rideData[0];
      const driverId = ride.driver_id;
      
      if (!driverId) {
        throw new Error(`Driver ID não encontrado para ride ${rideId}`);
      }

      // Calcular valores (usando 'as any' para acessar propriedades dinamicamente)
      const grossAmount = parseFloat((ride as any).price_per_seat?.toString() || '0') * ((ride as any).passenger_count || 1);
      const feeAmount = (grossAmount * 12) / 100; // 12% de comissão
      const netAmount = grossAmount - feeAmount;

      // Gerar referência única
      const timestamp = Date.now();
      const rideIdShort = rideId.substring(0, 10);
      const referenceNumber = `LINKA-RIDE-${timestamp}-${rideIdShort}`;

      // Buscar ou criar entity code do driver
      let entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, driverId as any))
        .limit(1);

      let entityCode: string;
      
      if (!entityData || entityData.length === 0) {
        // Criar novo entity code
        const driverIdShort = driverId.substring(0, 8);
        entityCode = `DRIVER_${driverIdShort}`;
        
        await db.insert(userEntities).values({
          user_id: driverId,
          entity_code: entityCode,
          entity_type: 'driver',
          created_at: new Date(),
        } as any);
      } else {
        entityCode = (entityData[0] as any).entity_code;
      }

      // Calcular data de vencimento (hoje + 7 dias)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Inserir no paymentReferences
      const result = await db.insert(paymentReferences).values({
        reference_number: referenceNumber,
        booking_id: rideId as any,
        booking_type: 'ride',
        provider_user_id: driverId,
        provider_entity_code: entityCode,
        gross_amount: grossAmount.toString() as any,
        fee_amount: feeAmount.toString() as any,
        net_amount: netAmount.toString() as any,
        fee_percentage: (12).toString() as any,
        status: 'pending',
        service_date: new Date(),
        due_date: dueDate,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log(`✅ Comissão criada: ${referenceNumber} | ${feeAmount.toFixed(2)} MZN`);
      
      return {
        success: true,
        referenceNumber,
        entityCode,
        grossAmount,
        feeAmount,
        netAmount,
        dueDate,
        message: `Comissão de ${feeAmount.toFixed(2)} MZN criada com sucesso`,
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão de ride:', error);
      throw error;
    }
  }

  /**
   * Cria comissão automaticamente ao fazer checkout de hotel
   * - Aplica 12% sobre o valor total da reserva
   * - Gera referência LINKA-HOTEL-[timestamp]-[booking_id]
   * - Define vencimento = hoje + 7 dias
   */
  async createHotelCommission(bookingId: string) {
    try {
      console.log(`💳 Criando comissão para hotel booking ${bookingId}...`);
      
      // Buscar dados da booking
      const bookingData = await db
        .select()
        .from(hotelBookings)
        .where(eq(hotelBookings.id, bookingId))
        .limit(1);

      if (!bookingData || bookingData.length === 0) {
        throw new Error(`Booking ${bookingId} não encontrada`);
      }

      const booking = bookingData[0];
      const hotelId = (booking as any).hotel_id;
      
      if (!hotelId) {
        throw new Error(`Hotel ID não encontrado para booking ${bookingId}`);
      }

      // Calcular valores (usando 'as any' para acessar propriedades dinamicamente)
      const grossAmount = parseFloat((booking as any).total_price?.toString() || '0');
      const feeAmount = (grossAmount * 12) / 100; // 12% de comissão
      const netAmount = grossAmount - feeAmount;

      // Gerar referência única
      const timestamp = Date.now();
      const bookingIdShort = bookingId.substring(0, 10);
      const referenceNumber = `LINKA-HOTEL-${timestamp}-${bookingIdShort}`;

      // Buscar ou criar entity code do hotel
      let entityData = await db
        .select()
        .from(userEntities)
        .where(eq(userEntities.user_id, hotelId as any))
        .limit(1);

      let entityCode: string;
      
      if (!entityData || entityData.length === 0) {
        // Criar novo entity code
        const hotelIdShort = hotelId.substring(0, 8);
        entityCode = `HOTEL_${hotelIdShort}`;
        
        await db.insert(userEntities).values({
          user_id: hotelId as any,
          entity_code: entityCode,
          entity_type: 'hotel_manager',
          created_at: new Date(),
        } as any);
      } else {
        entityCode = (entityData[0] as any).entity_code;
      }

      // Calcular data de vencimento (hoje + 7 dias)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      // Inserir no paymentReferences
      const result = await db.insert(paymentReferences).values({
        reference_number: referenceNumber,
        booking_id: bookingId as any,
        booking_type: 'hotel',
        provider_user_id: hotelId as any,
        provider_entity_code: entityCode,
        gross_amount: grossAmount.toString() as any,
        fee_amount: feeAmount.toString() as any,
        net_amount: netAmount.toString() as any,
        fee_percentage: (12).toString() as any,
        status: 'pending',
        service_date: new Date(),
        due_date: dueDate,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      console.log(`✅ Comissão criada: ${referenceNumber} | ${feeAmount.toFixed(2)} MZN`);
      
      return {
        success: true,
        referenceNumber,
        entityCode,
        grossAmount,
        feeAmount,
        netAmount,
        dueDate,
        message: `Comissão de ${feeAmount.toFixed(2)} MZN criada com sucesso`,
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão de hotel:', error);
      throw error;
    }
  }

  /**
   * Lista todas as comissões de um provedor com paginação
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

      // Buscar entity code do user
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

      // Montar query
      let query = db
        .select()
        .from(paymentReferences)
        .where(eq(paymentReferences.provider_entity_code, entityCode));

      // Filtrar por status se fornecido
      if (options.status) {
        query = db
          .select()
          .from(paymentReferences)
          .where(
            and(
              eq(paymentReferences.provider_entity_code, entityCode),
              eq(paymentReferences.status, options.status as any)
            )
          );
      }

      // Contar total
      const countResult = await query;
      const total = countResult.length;
      const pages = Math.ceil(total / limit);

      // Buscar com paginação e ordenação
      const commissions = await query
        .orderBy(desc(paymentReferences.created_at))
        .limit(limit)
        .offset(offset);

      // Calcular resumo
      const now = new Date();
      let pendingAmount = 0;
      let overdueCount = 0;
      let overdueAmount = 0;

      commissions.forEach((c: any) => {
        if (c.status === 'pending' || c.status === 'pending_confirmation') {
          pendingAmount += parseFloat(c.fee_amount?.toString() || '0');
          if (c.due_date && new Date(c.due_date) < now) {
            overdueCount++;
            overdueAmount += parseFloat(c.fee_amount?.toString() || '0');
          }
        }
      });

      // Mapear para frontend
      const data = commissions.map((c: any) => {
        const dueDate = new Date(c.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;

        return {
          id: c.id,
          referenceNumber: c.reference_number,
          type: c.booking_type === 'ride' ? 'ride' : 'hotel',
          grossAmount: parseFloat(c.gross_amount?.toString() || '0'),
          feeAmount: parseFloat(c.fee_amount?.toString() || '0'),
          netAmount: parseFloat(c.net_amount?.toString() || '0'),
          status: c.status,
          dueDate: dueDate.toISOString().split('T')[0],
          daysUntilDue,
          isOverdue,
          createdAt: c.created_at,
          paidAt: c.paid_at,
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
   * Marca comissão como paga (aguardando confirmação)
   */
  async markAsPaid(paymentId: string, userId: string, proofUrl?: string, notes?: string) {
    try {
      console.log(`💳 Marcando pagamento ${paymentId} como pago...`);
      
      // Verificar acesso do usuário
      const paymentData = await db
        .select()
        .from(paymentReferences)
        .where(eq(paymentReferences.id, paymentId as any))
        .limit(1);

      if (!paymentData || paymentData.length === 0) {
        throw new Error(`Pagamento ${paymentId} não encontrado`);
      }

      const payment = paymentData[0];
      
      // Verificar se o usuário é o provider
      const entityData = await db
        .select()
        .from(userEntities)
        .where(
          and(
            eq(userEntities.user_id, userId),
            eq(userEntities.entity_code, (payment as any).provider_entity_code as any)
          )
        )
        .limit(1);

      if (!entityData || entityData.length === 0) {
        throw new Error('Acesso negado: você não é o dono desta comissão');
      }

      // Atualizar status
      await db.update(paymentReferences)
        .set({
          status: 'pending_confirmation' as any,
          paid_at: new Date(),
          payment_proof_url: proofUrl,
          notes,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`✅ Pagamento marcado como pago`);
      
      return {
        success: true,
        message: 'Pagamento marcado como aguardando confirmação',
      };
    } catch (error) {
      console.error('❌ Erro ao marcar como pago:', error);
      throw error;
    }
  }

  /**
   * Admin confirma o pagamento
   */
  async confirmPayment(paymentId: string, adminId: string, notes?: string) {
    try {
      console.log(`✅ Admin confirmando pagamento ${paymentId}...`);
      
      // Verificar se é admin (aqui simplificado, verificar no middleware)
      await db.update(paymentReferences)
        .set({
          status: 'confirmed' as any,
          confirmed_by: adminId,
          notes,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`✅ Pagamento confirmado pelo admin`);
      
      return {
        success: true,
        message: 'Pagamento confirmado com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
      throw error;
    }
  }

  /**
   * Admin rejeita o pagamento
   */
  async rejectPayment(paymentId: string, adminId: string, reason: string) {
    try {
      console.log(`❌ Admin rejeitando pagamento ${paymentId}...`);
      
      await db.update(paymentReferences)
        .set({
          status: 'rejected' as any,
          confirmed_by: adminId,
          notes: reason,
          updated_at: new Date(),
        } as any)
        .where(eq(paymentReferences.id, paymentId as any));

      console.log(`❌ Pagamento rejeitado`);
      
      return {
        success: true,
        message: 'Pagamento rejeitado',
      };
    } catch (error) {
      console.error('❌ Erro ao rejeitar pagamento:', error);
      throw error;
    }
  }
}

export default new ProviderPaymentService();
