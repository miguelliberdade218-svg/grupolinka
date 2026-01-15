// src/modules/billing/billingService.ts
import { db } from '../db';
import { bookings, payments, systemSettings } from '../shared/schema'; // ✅ CORREÇÃO: systemSettings em vez de app_config
import { eq, and, sql, gte, lte } from 'drizzle-orm';

interface BillingCalculation {
  subtotal: number;
  platformFee: number;
  providerAmount: number;
  total: number;
  feePercentage: number;
}

interface CreateBillingParams {
  bookingId?: string; // ✅ Opcional pois pode não existir para todos os tipos
  hotelBookingId?: string; // ✅ Adicionado para hotéis
  eventBookingId?: string; // ✅ Adicionado para eventos
  userId: string;
  serviceType: 'ride' | 'accommodation' | 'event' | 'hotel'; // ✅ Adicionado hotel
  amount: number;
  distanceKm?: number;
  pricePerKm?: number;
  paymentMethod?: string; // ✅ Adicionado método de pagamento
}

export class BillingService {
  
  /**
   * Obtém a taxa da plataforma configurada (padrão 11%)
   */
  async getPlatformFeePercentage(): Promise<number> {
    try {
      // ✅ CORREÇÃO: Usar systemSettings em vez de app_config
      const [config] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'platform_fee_percentage'))
        .limit(1);
      
      if (config && config.value) {
        return parseFloat(config.value);
      }
      
      // Retorna taxa padrão de 11% se não encontrar
      return 11.0;
    } catch (error) {
      console.error('Erro ao obter taxa da plataforma:', error);
      return 11.0;
    }
  }

  /**
   * Actualiza a taxa da plataforma (apenas administradores)
   */
  async updatePlatformFeePercentage(percentage: number, adminUserId: string): Promise<void> {
    // ✅ CORREÇÃO: Usar systemSettings
    await db
      .insert(systemSettings)
      .values({
        key: 'platform_fee_percentage',
        value: percentage.toString(),
        description: 'Taxa percentual cobrada pela plataforma',
        updatedAt: new Date(),
        updatedBy: adminUserId
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: percentage.toString(),
          updatedBy: adminUserId,
          updatedAt: new Date()
        }
      });
  }

  /**
   * Calcula preço baseado na distância para boleias
   */
  async calculateRidePrice(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<{
    distance: number;
    pricePerKm: number;
    suggestedPrice: number;
  }> {
    // ✅ CORREÇÃO: Função calculateDistance precisa ser implementada
    const distance = await this.calculateDistance(fromLat, fromLng, toLat, toLng);
    
    // Obter preço por km das configurações
    const [pricePerKmSetting] = await db
      .select()
      .from(systemSettings) // ✅ CORREÇÃO
      .where(eq(systemSettings.key, 'default_price_per_km'))
      .limit(1);
    
    const pricePerKm = pricePerKmSetting ? parseFloat(pricePerKmSetting.value) : 15.0; // 15 MZN por km por defeito
    const suggestedPrice = distance * pricePerKm;

    return {
      distance,
      pricePerKm,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100 // Arredondar para 2 casas decimais
    };
  }

  /**
   * Calcula distância entre dois pontos (simplificado)
   */
  private async calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
    // Implementação simplificada - fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Calcula a facturação para uma transacção
   */
  async calculateBilling(amount: number): Promise<BillingCalculation> {
    const feePercentage = await this.getPlatformFeePercentage();
    const platformFee = (amount * feePercentage) / 100;
    const providerAmount = amount - platformFee;

    return {
      subtotal: amount,
      platformFee: Math.round(platformFee * 100) / 100,
      providerAmount: Math.round(providerAmount * 100) / 100,
      total: amount,
      feePercentage
    };
  }

  /**
   * Cria facturação para uma reserva confirmada
   */
  async createBilling(params: CreateBillingParams): Promise<string> {
    const billing = await this.calculateBilling(params.amount);

    // ✅ CORREÇÃO: Preencher campos corretos baseado no tipo de serviço
    const paymentData: any = {
      userId: params.userId,
      serviceType: params.serviceType,
      subtotal: billing.subtotal.toString(),
      platformFee: billing.platformFee.toString(),
      total: billing.total.toString(),
      paymentStatus: 'completed',
      paymentMethod: params.paymentMethod || 'pending',
      paidAt: new Date()
    };

    // Adicionar referência ao booking correto baseado no tipo
    if (params.serviceType === 'hotel' && params.hotelBookingId) {
      paymentData.hotelBookingId = params.hotelBookingId;
    } else if (params.serviceType === 'event' && params.eventBookingId) {
      paymentData.eventBookingId = params.eventBookingId;
    } else if (params.bookingId) {
      paymentData.bookingId = params.bookingId;
    }

    const [newPayment] = await db.insert(payments).values(paymentData).returning();

    // Atualizar status do booking se tiver bookingId
    if (params.bookingId) {
      await db
        .update(bookings)
        .set({
          totalPrice: billing.total.toString(),
          updatedAt: new Date()
        })
        .where(eq(bookings.id, params.bookingId));
    }

    return newPayment.id;
  }

  /**
   * Obtém taxas pendentes para um provedor
   */
  async getPendingFees(providerId: string) {
    return await db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        hotelBookingId: payments.hotelBookingId,
        eventBookingId: payments.eventBookingId,
        amount: payments.platformFee,
        status: payments.paymentStatus,
        createdAt: payments.createdAt
      })
      .from(payments)
      .where(and(
        eq(payments.userId, providerId),
        eq(payments.paymentStatus, 'pending')
      ));
  }

  /**
   * Marca uma taxa como paga
   */
  async markFeeAsPaid(feeId: string, paymentMethod: string): Promise<void> {
    await db
      .update(payments)
      .set({
        paymentStatus: 'completed',
        paymentMethod: paymentMethod,
        paidAt: new Date()
      })
      .where(eq(payments.id, feeId));
  }

  /**
   * Obtém relatório financeiro
   */
  async getFinancialReport(startDate: Date, endDate: Date) {
    const conditions = [
      eq(payments.paymentStatus, 'completed'),
      gte(payments.paidAt, startDate),
      lte(payments.paidAt, endDate)
    ];

    // Total de transações
    const totalTransactions = await db
      .select({
        total: payments.total,
        platformFee: payments.platformFee
      })
      .from(payments)
      .where(and(...conditions));

    // Cálculos
    const totalRevenue = totalTransactions.reduce((sum, t) => sum + Number(t.total), 0);
    const totalFees = totalTransactions.reduce((sum, t) => sum + Number(t.platformFee), 0);

    // Transações pendentes
    const pendingPayouts = await db
      .select({
        platformFee: payments.platformFee
      })
      .from(payments)
      .where(and(
        eq(payments.paymentStatus, 'pending'),
        gte(payments.createdAt, startDate),
        lte(payments.createdAt, endDate)
      ));

    const totalPendingPayouts = pendingPayouts.reduce((sum, t) => sum + Number(t.platformFee), 0);

    // Estatísticas por tipo de serviço
    const statsByService = await db
      .select({
        serviceType: payments.serviceType,
        count: sql<number>`count(*)`.as('count'),
        total: sql<number>`COALESCE(SUM(${payments.total}), 0)`.as('total'),
        fees: sql<number>`COALESCE(SUM(${payments.platformFee}), 0)`.as('fees')
      })
      .from(payments)
      .where(and(...conditions))
      .groupBy(payments.serviceType);

    return {
      period: { startDate, endDate },
      summary: {
        totalTransactions: totalTransactions.length,
        totalRevenue,
        totalFees,
        totalPendingPayouts,
        netRevenue: totalRevenue - totalFees,
        profitMargin: totalRevenue > 0 ? (totalFees / totalRevenue * 100) : 0
      },
      breakdownByService: statsByService.map(stat => ({
        serviceType: stat.serviceType,
        count: Number(stat.count),
        revenue: Number(stat.total),
        fees: Number(stat.fees),
        percentage: totalRevenue > 0 ? (Number(stat.total) / totalRevenue * 100) : 0
      }))
    };
  }

  /**
   * 🆕 Cria fee para prestador após serviço realizado
   */
  async createFeeForProvider(data: {
    providerId: string;
    type: 'ride' | 'hotel' | 'event' | 'accommodation';
    totalAmount: number;
    clientId: string;
    referenceId?: string; // ID do booking/hotelBooking/eventBooking
  }): Promise<string> {
    const feePercentage = await this.getPlatformFeePercentage();
    const feeAmount = (data.totalAmount * feePercentage) / 100;

    // ✅ CORREÇÃO: Criar objeto de pagamento correto
    const paymentData: any = {
      userId: data.clientId,
      serviceType: data.type,
      subtotal: data.totalAmount.toString(),
      platformFee: feeAmount.toString(),
      total: data.totalAmount.toString(),
      paymentStatus: 'pending',
      paymentMethod: 'platform_fee',
      paidAt: null
    };

    // Adicionar referência baseada no tipo
    if (data.type === 'hotel' && data.referenceId) {
      paymentData.hotelBookingId = data.referenceId;
    } else if (data.type === 'event' && data.referenceId) {
      paymentData.eventBookingId = data.referenceId;
    } else if (data.referenceId) {
      paymentData.bookingId = data.referenceId;
    }

    const [newPayment] = await db.insert(payments).values(paymentData).returning();

    console.log(`✅ Fee criada para ${data.providerId}: ${feeAmount.toFixed(2)} MZN à plataforma`);

    return newPayment.id;
  }

  /**
   * Configura preços automáticos baseados na distância
   */
  async setAutomaticPricing(enable: boolean, basePrice: number, pricePerKm: number): Promise<void> {
    // ✅ CORREÇÃO: Usar systemSettings
    const updates = [
      db.insert(systemSettings).values({
        key: 'automatic_pricing_enabled',
        value: enable.toString(),
        description: 'Preços automáticos baseados na distância',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value: enable.toString(), 
          updatedAt: new Date() 
        }
      }),
      
      db.insert(systemSettings).values({
        key: 'base_ride_price',
        value: basePrice.toString(),
        description: 'Preço base para boleias (MZN)',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value: basePrice.toString(), 
          updatedAt: new Date() 
        }
      }),
      
      db.insert(systemSettings).values({
        key: 'default_price_per_km',
        value: pricePerKm.toString(),
        description: 'Preço por quilómetro (MZN)',
      }).onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value: pricePerKm.toString(), 
          updatedAt: new Date() 
        }
      })
    ];

    await Promise.all(updates);
  }

  /**
   * 🆕 Obtém todas as configurações do sistema
   */
  async getAllConfigs(): Promise<Record<string, string>> {
    const configs = await db
      .select({
        key: systemSettings.key,
        value: systemSettings.value
      })
      .from(systemSettings);

    const result: Record<string, string> = {};
    configs.forEach(config => {
      result[config.key] = config.value;
    });

    return result;
  }

  /**
   * 🆕 Cria ou atualiza configuração
   */
  async setConfig(key: string, value: string, description?: string): Promise<void> {
    await db
      .insert(systemSettings)
      .values({
        key,
        value,
        description: description || key,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { 
          value, 
          description: description || key,
          updatedAt: new Date() 
        }
      });
  }

  /**
   * 🆕 Calcula preço para estadia em hotel
   */
  async calculateHotelPrice(
    basePrice: number,
    nights: number,
    adults: number = 2,
    children: number = 0,
    hasLongStayDiscount: boolean = false
  ): Promise<{
    basePrice: number;
    extraAdults: number;
    extraChildren: number;
    longStayDiscount: number;
    subtotal: number;
    platformFee: number;
    total: number;
  }> {
    // Obter configurações de preços
    const [adultPriceSetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'extra_adult_price'))
      .limit(1);
    
    const [childPriceSetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'extra_child_price'))
      .limit(1);

    const extraAdultPrice = adultPriceSetting ? parseFloat(adultPriceSetting.value) : 200;
    const extraChildPrice = childPriceSetting ? parseFloat(childPriceSetting.value) : 100;

    // Cálculos
    const extraAdults = Math.max(0, adults - 2) * extraAdultPrice * nights;
    const extraChildren = children * extraChildPrice * nights;
    const baseTotal = basePrice * nights;

    // Desconto longa estadia
    let longStayDiscount = 0;
    if (hasLongStayDiscount && nights >= 7) {
      const [longStaySetting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'long_stay_discount_percent'))
        .limit(1);
      
      const discountPercent = longStaySetting ? parseFloat(longStaySetting.value) : 10;
      longStayDiscount = baseTotal * (discountPercent / 100);
    }

    const subtotal = baseTotal + extraAdults + extraChildren - longStayDiscount;
    const platformFee = await this.getPlatformFeePercentage();
    const feeAmount = (subtotal * platformFee) / 100;
    const total = subtotal + feeAmount;

    return {
      basePrice: baseTotal,
      extraAdults,
      extraChildren,
      longStayDiscount,
      subtotal,
      platformFee: feeAmount,
      total: Math.round(total * 100) / 100
    };
  }
}

export const billingService = new BillingService();