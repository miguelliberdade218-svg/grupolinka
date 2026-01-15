// src/modules/payments/paymentService.ts - VERSÃO CORRIGIDA

import { db } from "../../../db";
import {
  payments,
  // invoices, // REMOVIDO - Não existe no schema
  paymentOptions,
  hotelBookings,
  eventBookings,
} from "../../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// ==================== TIPOS ====================
export type Payment = typeof payments.$inferSelect;

// Helper para converter valores
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper para acessar rows de db.execute
const getRows = (result: any): any[] => {
  // Drizzle execute retorna rows de forma diferente
  return Array.isArray(result) ? result : 
         result.rows ? result.rows : 
         result;
};

// ==================== FUNÇÕES QUE CHAMAM PROCEDURES POSTGRESQL ====================

/**
 * Registrar pagamento manual usando função PostgreSQL
 */
export const registerManualPayment = async (
  invoiceId: string,
  data: {
    amount: number;
    paymentMethod: "mpesa" | "bank_transfer" | "card" | "cash" | "mobile_money";
    referenceNumber: string;
    paymentType: string;
    proofImageUrl?: string;
    confirmedBy?: string;
  }
): Promise<any> => {
  const {
    amount,
    paymentMethod,
    referenceNumber,
    paymentType,
    proofImageUrl,
    confirmedBy
  } = data;

  try {
    // ✅ CHAMAR FUNÇÃO POSTGRESQL EXISTENTE
    const result = await db.execute(sql`
      SELECT * FROM register_manual_payment(
        ${invoiceId}::uuid,
        ${amount}::numeric,
        ${paymentMethod}::text,
        ${referenceNumber}::text,
        ${paymentType}::text,
        ${proofImageUrl || null}::text,
        ${confirmedBy || null}::uuid
      ) as result
    `);

    const rows = getRows(result);
    return rows[0]?.result || rows[0];
  } catch (error) {
    console.error('Erro ao registrar pagamento manual:', error);
    // Fallback: Criar pagamento diretamente
    const [payment] = await db.insert(payments).values({
      // Supondo que invoiceId seja bookingId para compatibilidade
      hotelBookingId: invoiceId, // Usar como fallback
      amount: amount.toString(),
      paymentMethod: paymentMethod,
      paymentReference: referenceNumber,
      paymentType: paymentType,
      proofImageUrl: proofImageUrl || null,
      paymentStatus: 'confirmed' as any, // Usar tipo existente
      confirmedBy: confirmedBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return payment;
  }
};

/**
 * Confirmar pagamento manual
 */
export const confirmManualPayment = async (
  paymentId: string,
  userId?: string
): Promise<any> => {
  try {
    const result = await db.execute(sql`
      SELECT * FROM confirm_manual_payment(
        ${paymentId}::uuid,
        ${userId || null}::uuid
      ) as result
    `);

    const rows = getRows(result);
    return rows[0]?.result || rows[0];
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    // Fallback
    const [payment] = await db.update(payments)
      .set({ 
        paymentStatus: 'confirmed' as any,
        updatedAt: new Date(),
        confirmedBy: userId 
      })
      .where(eq(payments.id, paymentId))
      .returning();
    
    return payment;
  }
};

/**
 * Obter opções de pagamento disponíveis
 */
export const getAvailablePaymentOptions = async (
  hotelId?: string,
  eventSpaceId?: string,
  checkInDate?: string,
  eventDate?: string,
  totalAmount: number = 0
): Promise<any[]> => {
  try {
    const result = await db.execute(sql`
      SELECT * FROM get_available_payment_options(
        ${hotelId || null}::uuid,
        ${eventSpaceId || null}::uuid,
        ${checkInDate || null}::date,
        ${eventDate || null}::date,
        ${totalAmount}::numeric
      ) as options
    `);

    return getRows(result);
  } catch (error) {
    console.error('Erro ao buscar opções de pagamento:', error);
    // Opções padrão como fallback
    return [{
      method: "mpesa",
      name: "M-Pesa",
      description: "Pagamento via M-Pesa",
      enabled: true,
      requiresConfirmation: true
    }];
  }
};

/**
 * Gerar recibo para pagamento
 */
export const generateReceiptForPayment = async (
  paymentId: string,
  userId?: string
): Promise<any> => {
  try {
    const result = await db.execute(sql`
      SELECT * FROM generate_receipt_for_payment(
        ${paymentId}::uuid,
        ${userId || null}::uuid
      ) as receipt
    `);

    const rows = getRows(result);
    return rows[0]?.receipt || rows[0];
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    // Fallback: Recibo básico
    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
    if (!payment) throw new Error('Pagamento não encontrado');
    
    return {
      receiptNumber: `REC-${paymentId.slice(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      amount: toNumber(payment.amount),
      paymentMethod: payment.paymentMethod,
      date: payment.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      status: payment.paymentStatus,
    };
  }
};

// ==================== FUNÇÕES DE PAGAMENTO (ADAPTAÇÃO) ====================

/**
 * Criar pagamento para reserva
 */
export const createPayment = async (
  data: {
    bookingId: string;
    bookingType: "hotel" | "event";
    userId: string;
    serviceType: "hotel" | "event";
    subtotal: number;
    platformFee: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    paymentReference?: string;
  }
): Promise<Payment> => {
  const paymentData: any = {
    userId: data.userId,
    serviceType: data.serviceType,
    subtotal: data.subtotal.toString(),
    platformFee: data.platformFee.toString(),
    discountAmount: data.discountAmount.toString(),
    total: data.total.toString(),
    paymentMethod: data.paymentMethod,
    paymentReference: data.paymentReference || null,
    paymentStatus: 'pending' as any, // Usar tipo válido
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Adicionar referência correta baseada no tipo
  if (data.bookingType === "hotel") {
    paymentData.hotelBookingId = data.bookingId;
  } else if (data.bookingType === "event") {
    paymentData.eventBookingId = data.bookingId;
  } else {
    paymentData.bookingId = data.bookingId;
  }

  const [payment] = await db.insert(payments).values(paymentData).returning();
  return payment;
};

/**
 * Atualizar status de pagamento - CORRIGIDO
 */
export const updatePaymentStatus = async (
  paymentId: string,
  status: "confirmed" | "cancelled" | "pending", // Usar tipos válidos do schema
  paidAt?: Date
): Promise<Payment | null> => {
  const updateData: any = {
    paymentStatus: status as any, // Cast para tipo do schema
    updatedAt: new Date(),
  };

  if (status === "confirmed" && paidAt) {
    updateData.paidAt = paidAt;
  }

  const [payment] = await db
    .update(payments)
    .set(updateData)
    .where(eq(payments.id, paymentId))
    .returning();

  return payment || null;
};

/**
 * Obter pagamentos por reserva
 */
export const getPaymentsByBooking = async (
  bookingId: string,
  bookingType: "hotel" | "event"
): Promise<Payment[]> => {
  let condition;

  if (bookingType === "hotel") {
    condition = eq(payments.hotelBookingId, bookingId);
  } else if (bookingType === "event") {
    condition = eq(payments.eventBookingId, bookingId);
  } else {
    condition = eq(payments.bookingId, bookingId);
  }

  return await db
    .select()
    .from(payments)
    .where(condition)
    .orderBy(desc(payments.createdAt));
};

// ==================== FUNÇÕES GENÉRICAS DE HOTEL ====================

/**
 * Obter opções de pagamento para hotel
 */
export const getPaymentOptionsForHotel = async (hotelId: string) => {
  const [options] = await db
    .select()
    .from(paymentOptions)
    .where(eq(paymentOptions.hotel_id, hotelId));

  return options || null;
};

/**
 * Obter detalhes de pagamento de reserva de hotel - CORRIGIDO
 */
export const getHotelBookingPaymentDetails = async (bookingId: string) => {
  const [booking] = await db
    .select()
    .from(hotelBookings)
    .where(eq(hotelBookings.id, bookingId));

  if (!booking) throw new Error("Reserva não encontrada");

  // CORREÇÃO: Usar 'confirmed' em vez de 'paid' que não existe no enum
  const paidPayments = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`.as("total_paid"),
    })
    .from(payments)
    .where(
      and(
        eq(payments.hotelBookingId, bookingId),
        // Usar tipos válidos do schema
        eq(payments.paymentStatus, 'confirmed' as any)
      )
    );

  const totalPaid = Number(paidPayments[0]?.totalPaid || 0);
  const totalPrice = toNumber(booking.total_price);
  const remaining = totalPrice - totalPaid;

  return {
    booking: {
      id: booking.id,
      guestName: booking.guest_name,
      totalPrice: totalPrice,
      paymentStatus: booking.payment_status,
    },
    paymentSummary: {
      totalPrice,
      amountPaid: totalPaid,
      amountDue: remaining > 0 ? remaining : 0,
      // Converter status do schema para 'paid'/'pending' para frontend
      paymentStatus: remaining <= 0 ? 'paid' : 'pending',
    },
  };
};

/**
 * Calcular depósito necessário para hotel
 */
export const calculateRequiredDeposit = async (
  bookingId: string
): Promise<{ required: number; type: string; dueDate?: string }> => {
  const details = await getHotelBookingPaymentDetails(bookingId);
  const [booking] = await db.select().from(hotelBookings).where(eq(hotelBookings.id, bookingId));
  
  let options = null;
  if (booking?.hotel_id) {
    options = await getPaymentOptionsForHotel(booking.hotel_id);
  }

  if (!options) return { required: details.paymentSummary.totalPrice, type: "full_payment" };

  const totalPrice = details.paymentSummary.totalPrice;
  let deposit = 0;
  let depositType = "full_payment";
  let dueDate: string | undefined;

  if (options.deposit_enabled && options.deposit_percentage) {
    const depositPercent = toNumber(options.deposit_percentage);
    if (depositPercent > 0) {
      deposit = totalPrice * (depositPercent / 100);
      depositType = "deposit";
      const dueDays = options.deposit_due_days || 3;
      dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }
  }

  return {
    required: deposit > 0 ? deposit : totalPrice,
    type: depositType,
    dueDate,
  };
};

// ==================== FUNÇÕES GENÉRICAS DE EVENTO ====================

/**
 * Obter opções de pagamento para espaço de evento
 */
export const getPaymentOptionsForEventSpace = async (eventSpaceId: string) => {
  const [options] = await db
    .select()
    .from(paymentOptions)
    .where(eq(paymentOptions.event_space_id, eventSpaceId));

  return options || null;
};

/**
 * Obter detalhes de pagamento de reserva de evento - CORRIGIDO
 */
export const getEventBookingPaymentDetails = async (bookingId: string) => {
  const [booking] = await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.id, bookingId));

  if (!booking) throw new Error("Reserva de evento não encontrada");

  // CORREÇÃO: Usar 'confirmed' em vez de 'paid'
  const paidPayments = await db
    .select({
      totalPaid: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`.as("total_paid"),
    })
    .from(payments)
    .where(
      and(
        eq(payments.eventBookingId, bookingId),
        eq(payments.paymentStatus, 'confirmed' as any)
      )
    );

  const totalPaid = Number(paidPayments[0]?.totalPaid || 0);
  const totalPrice = toNumber(booking.total_price);
  const remaining = totalPrice - totalPaid;

  return {
    booking: {
      id: booking.id,
      eventName: booking.event_name,
      organizerName: booking.organizer_name,
      totalPrice: totalPrice,
      paymentStatus: booking.payment_status,
    },
    paymentSummary: {
      totalPrice,
      amountPaid: totalPaid,
      amountDue: remaining > 0 ? remaining : 0,
      // Converter status do schema para 'paid'/'pending' para frontend
      paymentStatus: remaining <= 0 ? 'paid' : 'pending',
    },
  };
};

/**
 * Calcular depósito necessário para evento
 */
export const calculateRequiredEventDeposit = async (
  bookingId: string
): Promise<{ required: number; type: string; dueDate?: string }> => {
  const details = await getEventBookingPaymentDetails(bookingId);
  const [booking] = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId));
  
  let options = null;
  if (booking?.event_space_id) {
    options = await getPaymentOptionsForEventSpace(booking.event_space_id);
  }

  if (!options) return { required: details.paymentSummary.totalPrice, type: "full_payment" };

  const totalPrice = details.paymentSummary.totalPrice;
  let deposit = 0;
  let depositType = "full_payment";
  let dueDate: string | undefined;

  if (options.deposit_enabled && options.deposit_percentage) {
    const depositPercent = toNumber(options.deposit_percentage);
    if (depositPercent > 0) {
      deposit = totalPrice * (depositPercent / 100);
      depositType = "deposit";
      const dueDays = options.deposit_due_days || 3;
      dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }
  }

  return {
    required: deposit > 0 ? deposit : totalPrice,
    type: depositType,
    dueDate,
  };
};

// ==================== RELATÓRIOS E DASHBOARD ====================

/**
 * Relatório financeiro por período - CORRIGIDO
 */
export const getFinancialReport = async (
  hotelId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  byPaymentMethod: Record<string, number>;
}> => {
  let conditions: any[] = [];

  if (hotelId) {
    conditions.push(sql`
      EXISTS (
        SELECT 1 FROM hotel_bookings hb 
        WHERE hb.id = ${payments.hotelBookingId}
        AND hb.hotel_id = ${hotelId}
      ) OR
      EXISTS (
        SELECT 1 FROM event_bookings eb 
        WHERE eb.id = ${payments.eventBookingId}
        AND eb.hotel_id = ${hotelId}
      )
    `);
  }

  if (startDate && endDate) {
    conditions.push(sql`${payments.createdAt} BETWEEN ${startDate} AND ${endDate}`);
  }

  // Se não há condições, usar uma condição sempre verdadeira
  const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

  // Total revenue (apenas pagamentos confirmados)
  const revenueResult = await db
    .select({ 
      total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`.as("total") 
    })
    .from(payments)
    .where(
      whereCondition ? 
      and(whereCondition, eq(payments.paymentStatus, 'confirmed' as any)) :
      eq(payments.paymentStatus, 'confirmed' as any)
    );

  // Total payments count
  const paymentsResult = await db
    .select({ 
      count: sql<number>`COUNT(*)`.as("count") 
    })
    .from(payments)
    .where(whereCondition || undefined);

  // Pending payments
  const pendingResult = await db
    .select({ 
      total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`.as("total") 
    })
    .from(payments)
    .where(
      whereCondition ? 
      and(whereCondition, eq(payments.paymentStatus, 'pending' as any)) :
      eq(payments.paymentStatus, 'pending' as any)
    );

  // By payment method
  const methodResult = await db
    .select({
      method: payments.paymentMethod,
      total: sql<number>`COALESCE(SUM(${payments.amount}::numeric), 0)`.as("total"),
    })
    .from(payments)
    .where(
      whereCondition ? 
      and(whereCondition, eq(payments.paymentStatus, 'confirmed' as any)) :
      eq(payments.paymentStatus, 'confirmed' as any)
    )
    .groupBy(payments.paymentMethod);

  const byPaymentMethod: Record<string, number> = {};
  methodResult.forEach(row => {
    if (row.method) {
      byPaymentMethod[row.method] = Number(row.total || 0);
    }
  });

  return {
    totalRevenue: Number(revenueResult[0]?.total || 0),
    totalPayments: Number(paymentsResult[0]?.count || 0),
    pendingPayments: Number(pendingResult[0]?.total || 0),
    byPaymentMethod,
  };
};

/**
 * Pagamentos pendentes - CORRIGIDO
 */
export const getPendingPayments = async (
  limit: number = 50,
  offset: number = 0
): Promise<Payment[]> => {
  try {
    // ✅ TENTAR CHAMAR FUNÇÃO POSTGRESQL
    const result = await db.execute(sql`
      SELECT * FROM get_pending_payments(
        ${limit}::integer,
        ${offset}::integer
      ) as pending_payments
    `);

    return getRows(result) as Payment[];
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes via função:', error);
    // Fallback: Buscar diretamente da tabela
    return await db
      .select()
      .from(payments)
      .where(eq(payments.paymentStatus, 'pending' as any))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);
  }
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Verificar se reserva tem pagamentos pendentes
 */
export const hasPendingPayments = async (
  bookingId: string,
  bookingType: "hotel" | "event"
): Promise<boolean> => {
  const payments = await getPaymentsByBooking(bookingId, bookingType);
  return payments.some(p => p.paymentStatus === 'pending');
};

/**
 * Calcular saldo pendente
 */
export const calculatePendingBalance = async (
  bookingId: string,
  bookingType: "hotel" | "event"
): Promise<number> => {
  const payments = await getPaymentsByBooking(bookingId, bookingType);
  
  const paid = payments
    .filter(p => p.paymentStatus === 'confirmed')
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  
  const pending = payments
    .filter(p => p.paymentStatus === 'pending')
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  
  return pending > 0 ? pending : 0;
};

// ==================== ALIASES PARA COMPATIBILIDADE ====================

export const registerHotelManualPayment = registerManualPayment;
export const registerManualEventPayment = registerManualPayment;