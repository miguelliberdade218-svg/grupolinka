// src/modules/hotels/hotelPaymentService.ts - VERSÃO FINAL CORRIGIDA (13/01/2026)
// Usa Drizzle direto na tabela hotel_payments (tabela real do teu banco)
// SEM stored procedures, ajustado para colunas exatas da tua tabela (SNAKE_CASE)

import { db } from "../../../db";
import { sql, eq, and } from "drizzle-orm";
import { hotelBookings, hotelPayments } from "../../../shared/schema";

// ==================== TIPOS ====================
export type PaymentMethod = "mpesa" | "bank_transfer" | "card" | "cash" | "mobile_money";
export type PaymentType = "partial" | "full";

export interface PaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentType?: PaymentType;
  proofImageUrl?: string;
  confirmedBy?: string;      // Firebase UID (string)
  isFinalPayment?: boolean;
  extraNotes?: string;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Registrar pagamento manual para hotel
 * Insere diretamente na tabela hotel_payments (tabela real do teu banco)
 */
export const registerManualPayment = async (
  bookingId: string,
  data: PaymentData
): Promise<any> => {
  try {
    const {
      amount,
      paymentMethod,
      referenceNumber,
      paymentType = "partial",
      proofImageUrl,
      confirmedBy, // Firebase UID como string
      extraNotes,
    } = data;

    // 1. Validar se o booking existe
    const bookingResult = await db
      .select({
        id: hotelBookings.id,
        totalPrice: hotelBookings.totalPrice,
        paymentStatus: hotelBookings.paymentStatus,
      })
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (bookingResult.length === 0) {
      throw new Error("Booking não encontrado");
    }

    const booking = bookingResult[0];
    const totalPrice = Number(booking.totalPrice || 0);

    // 2. Calcular total já pago (somente status 'paid')
    const paidResult = await db
      .select({
        totalPaid: sql<number>`COALESCE(SUM(${hotelPayments.amount}), 0)`,
      })
      .from(hotelPayments)
      .where(
        and(
          eq(hotelPayments.booking_id, bookingId),
          eq(hotelPayments.status, 'paid')
        )
      );

    const totalPaid = Number(paidResult[0]?.totalPaid || 0);
    const remaining = totalPrice - totalPaid;

    // 3. Validações básicas
    if (amount <= 0) {
      throw new Error("O valor do pagamento deve ser positivo");
    }

    if (amount > remaining) {
      throw new Error(
        `Pagamento excede o saldo restante (${remaining.toFixed(2)}). Valor informado: ${amount}`
      );
    }

    // 4. Inserir pagamento na tabela hotel_payments (usando SNAKE_CASE)
    const [newPayment] = await db
      .insert(hotelPayments)
      .values({
        booking_id: bookingId,
        amount: amount.toString(), // Converter para string (tipo numeric)
        payment_method: paymentMethod,
        payment_reference: referenceNumber,
        notes: extraNotes || null,
        payment_type: paymentType,
        status: 'paid',
        confirmed_by: confirmedBy || null,
        proof_image_url: proofImageUrl || null,
        paid_at: new Date(),
        metadata: extraNotes ? { notes: extraNotes } : {},
        is_manual: true,
      })
      .returning();

    // 5. Atualizar status do booking automaticamente
    let newPaymentStatus = "partial";
    const newTotalPaid = totalPaid + amount;

    if (newTotalPaid >= totalPrice) {
      newPaymentStatus = "paid";
    }

    await db
      .update(hotelBookings)
      .set({
        paymentStatus: newPaymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(hotelBookings.id, bookingId));

    // 6. Retornar resposta compatível com o controller
    return {
      success: true,
      message: "Pagamento registrado com sucesso",
      data: {
        payment: {
          id: newPayment.id,
          bookingId: newPayment.booking_id, // Usando booking_id
          amount: Number(newPayment.amount),
          paymentMethod: newPayment.payment_method, // Usando payment_method
          reference: newPayment.payment_reference, // Usando payment_reference
          status: newPayment.status,
          paidAt: newPayment.paid_at, // Usando paid_at
          createdAt: newPayment.created_at, // Usando created_at
          paymentType: newPayment.payment_type, // Usando payment_type
          isManual: newPayment.is_manual, // Usando is_manual
          notes: extraNotes,
          confirmedBy: newPayment.confirmed_by, // Usando confirmed_by
        },
        booking: {
          id: bookingId,
          paymentStatus: newPaymentStatus,
          totalPrice,
          totalPaid: newTotalPaid,
          remaining: totalPrice - newTotalPaid,
        },
      },
    };
  } catch (error: any) {
    console.error("Erro ao registrar pagamento manual:", error);
    return {
      success: false,
      message: `Erro ao registrar pagamento: ${error.message}`,
      error: error.message,
    };
  }
};

/**
 * Obter pagamentos por booking
 */
export const getHotelPaymentsByBooking = async (bookingId: string) => {
  try {
    const paymentsList = await db
      .select()
      .from(hotelPayments)
      .where(eq(hotelPayments.booking_id, bookingId))
      .orderBy(hotelPayments.paid_at);

    return paymentsList.map((payment: any) => ({
      id: payment.id,
      amount: Number(payment.amount || 0),
      paymentMethod: payment.payment_method, // Usando payment_method
      reference: payment.payment_reference, // Usando payment_reference
      status: payment.status,
      paidAt: payment.paid_at, // Usando paid_at
      createdAt: payment.created_at, // Usando created_at
      paymentType: payment.payment_type, // Usando payment_type
      isManual: payment.is_manual, // Usando is_manual
      notes: payment.notes,
      confirmedBy: payment.confirmed_by, // Usando confirmed_by
    }));
  } catch (error) {
    console.error("Erro ao buscar pagamentos do booking:", error);
    return [];
  }
};

/**
 * Calcular depósito necessário (mantido simples)
 */
export const calculateRequiredDepositSimple = async (bookingId: string) => {
  try {
    const booking = await db
      .select({ totalPrice: hotelBookings.totalPrice })
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) throw new Error("Booking não encontrado");

    const total = Number(booking[0].totalPrice || 0);
    const deposit = total * 0.3; // 30% - ajusta conforme regra do teu sistema

    return {
      totalPrice: total,
      depositAmount: deposit,
      remaining: total - deposit,
      percentage: 30,
    };
  } catch (error) {
    console.error("Erro ao calcular depósito:", error);
    throw error;
  }
};

/**
 * Obter detalhes de pagamento de uma reserva de hotel
 */
export const getBookingPaymentDetails = async (bookingId: string) => {
  try {
    const booking = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      throw new Error('Booking não encontrado');
    }

    const paymentsList = await getHotelPaymentsByBooking(bookingId);

    return {
      booking: booking[0],
      payments: paymentsList,
      summary: {
        totalPrice: Number(booking[0].totalPrice || 0),
        totalPaid: paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        remaining: Number(booking[0].totalPrice || 0) - paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      }
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes de pagamento:', error);
    throw error;
  }
};

// Alias para compatibilidade
export const getHotelBookingPaymentDetails = getBookingPaymentDetails;

/**
 * Obter opções de pagamento para hotel
 */
export const getPaymentOptionsForHotel = async (hotelId: string) => {
  try {
    const result = await db.execute(sql`
      SELECT * FROM payment_options 
      WHERE hotel_id = ${hotelId}::uuid
    `);
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar opções de pagamento:', error);
    return null;
  }
};

/**
 * Calcular depósito necessário para reserva de hotel
 */
export const calculateRequiredDeposit = async (bookingId: string) => {
  try {
    const bookingResult = await db.execute(sql`
      SELECT 
        hb.total_price,
        hb.hotel_id,
        po.deposit_enabled,
        po.deposit_percentage,
        po.deposit_due_days,
        po.advance_payment_enabled,
        po.advance_payment_required_percentage,
        po.advance_payment_due_days
      FROM hotel_bookings hb
      LEFT JOIN payment_options po ON po.hotel_id = hb.hotel_id
      WHERE hb.id = ${bookingId}::uuid
    `);
    
    const booking = bookingResult[0] as any;
    if (!booking) throw new Error('Booking não encontrado');
    
    const totalPrice = Number(booking.total_price || 0);
    let deposit = 0;
    let depositType = "full_payment";
    let depositPercentage = 100;
    let dueDate: string | undefined;

    if (booking.deposit_enabled && booking.deposit_percentage) {
      const depositPercent = Number(booking.deposit_percentage) || 0;
      if (depositPercent > 0) {
        deposit = totalPrice * (depositPercent / 100);
        depositType = "deposit";
        depositPercentage = depositPercent;
        const dueDays = booking.deposit_due_days || 3;
        dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }
    } else if (booking.advance_payment_enabled && booking.advance_payment_required_percentage) {
      const advancePercent = Number(booking.advance_payment_required_percentage) || 0;
      if (advancePercent > 0) {
        deposit = totalPrice * (advancePercent / 100);
        depositType = "advance_payment";
        depositPercentage = advancePercent;
        const dueDays = booking.advance_payment_due_days || 7;
        dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }
    }

    if (deposit === 0) {
      deposit = totalPrice;
      depositPercentage = 100;
    }

    return {
      totalPrice,
      depositAmount: deposit,
      depositPercentage,
      required: deposit,
      type: depositType,
      dueDate,
    };
  } catch (error) {
    console.error('Erro ao calcular depósito:', error);
    throw new Error(`Falha ao calcular depósito: ${(error as Error).message}`);
  }
};

// Alias para compatibilidade
export const getPaymentsByBooking = getHotelPaymentsByBooking;

/**
 * Obter pagamentos recentes de um hotel
 */
export const getRecentPaymentsByHotel = async (hotelId: string, limit: number = 20) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        hp.id,
        hp.booking_id,
        hp.amount,
        hp.payment_method,
        hp.payment_reference,
        hp.status,
        hp.paid_at,
        hp.created_at,
        hb.guest_name,
        hb.check_in,
        hb.check_out,
        hb.total_price
      FROM hotel_payments hp
      INNER JOIN hotel_bookings hb ON hb.id = hp.booking_id
      WHERE hb.hotel_id = ${hotelId}::uuid
        AND hp.status IN ('paid', 'completed', 'confirmed')
      ORDER BY hp.paid_at DESC
      LIMIT ${limit}
    `);
    
    return result.map((row: any) => ({
      payment: {
        id: row.id,
        amount: Number(row.amount || 0),
        paymentMethod: row.payment_method,
        paymentReference: row.payment_reference,
        status: row.status,
        paidAt: row.paid_at,
      },
      booking: {
        id: row.booking_id,
        guestName: row.guest_name,
        checkIn: row.check_in,
        checkOut: row.check_out,
        totalPrice: Number(row.total_price || 0),
      },
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos recentes:', error);
    return [];
  }
};

/**
 * Resumo financeiro do hotel
 */
export const getHotelFinancialSummary = async (
  hotelId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    let revenueQuery = sql`
      SELECT 
        COALESCE(SUM(hp.amount::numeric), 0) as total_revenue,
        COUNT(DISTINCT hb.id) as total_bookings,
        COUNT(DISTINCT CASE 
          WHEN hp.status IN ('paid', 'completed', 'confirmed') 
          THEN hb.id 
        END) as paid_bookings
      FROM hotel_payments hp
      INNER JOIN hotel_bookings hb ON hb.id = hp.booking_id
      WHERE hb.hotel_id = ${hotelId}::uuid
        AND hp.status IS NOT NULL
    `;

    if (startDate) {
      revenueQuery = sql`${revenueQuery} AND (hp.paid_at >= ${startDate}::date OR hp.paid_at IS NULL)`;
    }
    if (endDate) {
      revenueQuery = sql`${revenueQuery} AND (hp.paid_at <= ${endDate}::date OR hp.paid_at IS NULL)`;
    }

    const revenueResult = await db.execute(revenueQuery);
    const revenueRow = revenueResult[0] as any;

    // Query para pagamentos pendentes
    let pendingQuery = sql`
      SELECT 
        COALESCE(SUM(total_price::numeric), 0) as pending_amount,
        COUNT(*) as pending_bookings
      FROM hotel_bookings
      WHERE hotel_id = ${hotelId}::uuid
        AND payment_status = 'pending'
    `;

    if (startDate) {
      pendingQuery = sql`${pendingQuery} AND created_at >= ${startDate}::date`;
    }
    if (endDate) {
      pendingQuery = sql`${pendingQuery} AND created_at <= ${endDate}::date`;
    }

    const pendingResult = await db.execute(pendingQuery);
    const pendingRow = pendingResult[0] as any;

    const totalRevenue = Number(revenueRow?.total_revenue || 0);
    const totalBookings = Number(revenueRow?.total_bookings || 0);
    const paidBookings = Number(revenueRow?.paid_bookings || 0);
    const pendingAmount = Number(pendingRow?.pending_amount || 0);
    const pendingBookings = Number(pendingRow?.pending_bookings || 0);

    return {
      totalRevenue,
      totalBookings,
      paidBookings,
      pendingAmount,
      pendingBookings,
      averageRevenuePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      conversionRate: totalBookings > 0 ? (paidBookings / totalBookings) * 100 : 0,
    };
  } catch (error) {
    console.error('Erro ao calcular resumo financeiro:', error);
    return {
      totalRevenue: 0,
      totalBookings: 0,
      paidBookings: 0,
      pendingAmount: 0,
      pendingBookings: 0,
      averageRevenuePerBooking: 0,
      conversionRate: 0,
    };
  }
};

/**
 * Obter pagamentos pendentes (geral)
 */
export const getPendingPayments = async (limit: number = 50, offset: number = 0) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        hp.*,
        hb.guest_name,
        hb.guest_email,
        hb.total_price,
        hb.hotel_id,
        i.id as invoice_id,
        i.invoice_number,
        i.due_date
      FROM hotel_payments hp
      INNER JOIN hotel_bookings hb ON hb.id = hp.booking_id
      LEFT JOIN invoices i ON i.hotel_booking_id = hb.id
      WHERE hp.status = 'pending'
        AND hp.amount > 0
      ORDER BY hp.created_at ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    return result.map((row: any) => ({
      id: row.id,
      bookingId: row.booking_id,
      amount: Number(row.amount || 0),
      guestName: row.guest_name,
      guestEmail: row.guest_email,
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      dueDate: row.due_date,
      hotelId: row.hotel_id,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    return [];
  }
};

/**
 * Processar reserva com opção de pagamento
 */
export const processHotelBookingWithPayment = async (
  bookingId: string,
  paymentOptionId: string,
  selectedPromotionId?: string
): Promise<any> => {
  try {
    const result = await db.execute(sql`
      SELECT process_booking_with_payment_option(
        ${bookingId}::uuid,
        'hotel'::text,
        ${paymentOptionId}::text,
        ${selectedPromotionId || null}::uuid
      ) as result
    `);

    const row = result[0] as any;
    return row?.result;
  } catch (error) {
    console.error('Erro ao processar reserva com pagamento:', error);
    throw error;
  }
};

/**
 * Cancelar reserva por falta de pagamento
 */
export const cancelHotelBookingForNonPayment = async (
  invoiceId: string,
  cancelledBy: string
): Promise<any> => {
  try {
    const result = await db.execute(sql`
      SELECT cancel_booking_for_non_payment(
        ${invoiceId}::uuid,
        NULL::uuid  -- Firebase UID não é UUID válido
      ) as result
    `);

    const row = result[0] as any;
    return row?.result;
  } catch (error) {
    console.error('Erro ao cancelar reserva por falta de pagamento:', error);
    throw error;
  }
};

/**
 * Função para atualizar/refresh status do invoice
 */
export const refreshInvoiceStatus = async (invoiceId: string): Promise<any> => {
  try {
    // Primeiro buscar dados do invoice
    const invoiceResult = await db.execute(sql`
      SELECT 
        i.id,
        i.hotel_booking_id,
        i.total_amount,
        i.status as current_status,
        COALESCE(SUM(hp.amount), 0) as total_paid
      FROM invoices i
      LEFT JOIN hotel_payments hp ON hp.booking_id = i.hotel_booking_id 
        AND hp.status = 'paid'
      WHERE i.id = ${invoiceId}::uuid
      GROUP BY i.id, i.hotel_booking_id, i.total_amount, i.status
    `);
    
    const invoice = invoiceResult[0] as any;
    if (!invoice) throw new Error('Invoice não encontrado');

    // Determinar novo status
    const totalAmount = Number(invoice.total_amount || 0);
    const totalPaid = Number(invoice.total_paid || 0);
    
    let newStatus = 'pending';
    if (totalPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    // Atualizar invoice
    const updateResult = await db.execute(sql`
      UPDATE invoices
      SET 
        status = ${newStatus}::text,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoiceId}::uuid
      RETURNING id, invoice_number, status, total_amount
    `);

    // Atualizar booking também
    if (invoice.hotel_booking_id) {
      await db.execute(sql`
        UPDATE hotel_bookings
        SET 
          payment_status = ${newStatus}::text,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${invoice.hotel_booking_id}::uuid
      `);
    }

    return {
      success: true,
      message: 'Status do invoice atualizado',
      data: {
        invoice_id: updateResult[0]?.id,
        invoice_number: updateResult[0]?.invoice_number,
        old_status: invoice.current_status,
        new_status: newStatus,
        total_amount: totalAmount,
        total_paid: totalPaid,
        remaining: totalAmount - totalPaid
      }
    };
  } catch (error) {
    console.error('Erro ao atualizar status do invoice:', error);
    return {
      success: false,
      message: `Erro ao atualizar invoice: ${(error as Error).message}`
    };
  }
};

/**
 * Obter detalhes completos do invoice
 */
export const getInvoiceDetails = async (invoiceId: string) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        i.*,
        hb.guest_name,
        hb.guest_email,
        hb.total_price as booking_total,
        hb.payment_status as booking_payment_status,
        COALESCE(SUM(hp.amount), 0) as total_paid
      FROM invoices i
      INNER JOIN hotel_bookings hb ON hb.id = i.hotel_booking_id
      LEFT JOIN hotel_payments hp ON hp.booking_id = i.hotel_booking_id 
        AND hp.status = 'paid'
      WHERE i.id = ${invoiceId}::uuid
      GROUP BY i.id, hb.guest_name, hb.guest_email, hb.total_price, hb.payment_status
    `);
    
    const invoice = result[0] as any;
    if (!invoice) return null;

    // Buscar pagamentos relacionados
    const payments = await getHotelPaymentsByBooking(invoice.hotel_booking_id);

    return {
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        total_amount: Number(invoice.total_amount || 0),
        status: invoice.status,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at
      },
      booking: {
        id: invoice.hotel_booking_id,
        guest_name: invoice.guest_name,
        guest_email: invoice.guest_email,
        total_price: Number(invoice.booking_total || 0),
        payment_status: invoice.booking_payment_status
      },
      payment_summary: {
        total_paid: Number(invoice.total_paid || 0),
        remaining_balance: Number(invoice.total_amount || 0) - Number(invoice.total_paid || 0),
        percentage_paid: Number(invoice.total_amount || 0) > 0 
          ? Math.round((Number(invoice.total_paid || 0) / Number(invoice.total_amount || 0)) * 100)
          : 0
      },
      payments: payments
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do invoice:', error);
    return null;
  }
};

// Exportar a função universal
export const registerPaymentUniversal = registerManualPayment;

// ==================== EXPORT DEFAULT ====================
export default {
  registerManualPayment,
  getHotelPaymentsByBooking,
  calculateRequiredDepositSimple,
  getBookingPaymentDetails,
  getHotelBookingPaymentDetails,
  getPaymentOptionsForHotel,
  calculateRequiredDeposit,
  getRecentPaymentsByHotel,
  getHotelFinancialSummary,
  getPendingPayments,
  processHotelBookingWithPayment,
  cancelHotelBookingForNonPayment,
  refreshInvoiceStatus,
  getInvoiceDetails,
  registerPaymentUniversal,
  getPaymentsByBooking,
};