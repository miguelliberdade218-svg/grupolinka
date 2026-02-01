// src/modules/events/eventPaymentService.ts - VERSÃO CORRIGIDA PARA FIREBASE UIDs
// Sistema de diárias puro - Usa Firebase UIDs diretamente (text)

import { db } from "../../../db";
import {
  eventBookings,
  eventPayments,
  paymentOptions,
  invoices,
  eventBookingLogs,
  eventSpaces,
  bookings,
  hotels,
  users,
  refunds,
} from "../../../shared/schema";
import { eq, and, sql, desc, gte, lte } from "drizzle-orm";
import crypto from "crypto";

// ==================== TIPOS ====================
export type EventPayment = typeof eventPayments.$inferSelect;
export type EventPaymentInsert = typeof eventPayments.$inferInsert;
export type EventInvoice = typeof invoices.$inferSelect;

// ==================== FUNÇÕES AUXILIARES ====================
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ✅ CORREÇÃO: Função simples para validar/buscar usuário (opcional)
const getUserId = async (firebaseUid?: string | null): Promise<string | null> => {
  if (!firebaseUid || firebaseUid.trim() === '' || firebaseUid === 'unknown') {
    console.warn("getUserId: ID de usuário inválido ou vazio");
    return null;
  }

  // Busca direta pelo Firebase UID (coluna agora é text)
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, firebaseUid))
    .limit(1);

  return user?.id || null;
};

const logEventPaymentAction = async (
  bookingId: string,
  action: string,
  details: Record<string, any>
) => {
  try {
    await db.insert(eventBookingLogs).values({
      bookingId,
      action,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao logar ação de pagamento:', error);
  }
};

// ✅ CORREÇÃO CRÍTICA: Função principal de registro de pagamento manual - AGORA COM FIREBASE UIDs
export const registerManualEventPayment = async (
  eventBookingId: string,
  data: {
    amount: number;
    paymentMethod: "mpesa" | "bank_transfer" | "card" | "cash" | "mobile_money";
    referenceNumber: string;
    paymentType?: string;
    proofImageUrl?: string;
    registeredBy?: string;
    notes?: string;
  }
): Promise<any> => {
  const {
    amount,
    paymentMethod,
    referenceNumber,
    paymentType = "manual_event_payment",
    proofImageUrl,
    registeredBy,
    notes
  } = data;

  try {
    // 🔒 USAR TRANSACTION para garantir atomicidade
    return await db.transaction(async (tx) => {
      // 1. Buscar a reserva com lock
      const [eventBooking] = await tx.select().from(eventBookings).where(eq(eventBookings.id, eventBookingId));
      
      if (!eventBooking) {
        throw new Error("Reserva de evento não encontrada");
      }

      // 2. Calcular valores
      const totalPrice = toNumber(eventBooking.totalPrice);
      const currentBalance = toNumber(eventBooking.balanceDue) || totalPrice;
      const currentDeposit = toNumber(eventBooking.depositPaid) || 0;

      // 3. Validações
      if (amount <= 0) {
        throw new Error("Valor do pagamento deve ser maior que zero");
      }

      if (amount > currentBalance) {
        throw new Error(`Valor do pagamento (${amount}) excede o saldo pendente (${currentBalance})`);
      }

      // 4. Calcular novos valores
      const newBalance = Math.max(0, currentBalance - amount);
      const newDeposit = currentDeposit + amount;

      // 5. Determinar novo status de pagamento
      let newPaymentStatus: typeof eventBooking.paymentStatus = eventBooking.paymentStatus;
      if (newBalance <= 0) {
        newPaymentStatus = "paid";
      } else if (newBalance < totalPrice) {
        newPaymentStatus = "partial";
      } else {
        newPaymentStatus = "pending";
      }

      // ✅ CORREÇÃO: Usar Firebase UIDs diretamente (agora coluna é text)
      const confirmedBy = registeredBy || null;
      const userId = eventBooking.userId || null;

      // 6. Criar registro de pagamento usando a tabela payments
      const [payment] = await tx.insert(eventPayments).values({
        id: crypto.randomUUID(),
        eventBookingId: eventBookingId,
        hotelId: eventBooking.hotelId,
        userId, // ✅ Firebase UID direto (string)
        amount: amount.toString(),
        paymentMethod: paymentMethod,
        paymentType: paymentType,
        referenceNumber: referenceNumber,
        proofImageUrl: proofImageUrl || null,
        status: "pending", // Aguarda confirmação
        confirmedBy, // ✅ Firebase UID direto (string) ou null
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: notes || `Pagamento manual registrado por ${registeredBy || 'sistema'}`,
        metadata: { 
          registeredBy, 
          paymentType,
          previousBalance: currentBalance,
          newBalance: newBalance,
          timestamp: new Date().toISOString()
        }
      }).returning();

      // ✅ CORREÇÃO CRÍTICA: Atualizar a reserva com os novos valores - cálculo manual agora permitido
      // Após inserir em payments, atualize eventBookings (inclua depositPaid, balanceDue, paymentStatus)
      const newDepositCalculated = currentDeposit + amount;
      const newBalanceCalculated = totalPrice - newDepositCalculated;
      const newStatusCalculated = newBalanceCalculated <= 0 ? 'paid' : 'partial';

      const [updatedBooking] = await tx.update(eventBookings)
        .set({
          depositPaid: newDepositCalculated.toString(),
          balanceDue: newBalanceCalculated.toString(),
          paymentStatus: newStatusCalculated,
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, eventBookingId))
        .returning();

      // 7. Registrar log
      await tx.insert(eventBookingLogs).values({
        id: crypto.randomUUID(),
        bookingId: eventBookingId,
        action: "payment_registered",
        details: {
          paymentId: payment.id,
          amount: amount,
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber,
          previousBalance: currentBalance,
          newBalance: newBalance,
          previousPaymentStatus: eventBooking.paymentStatus,
          newPaymentStatus: newStatusCalculated,
          registeredBy: registeredBy,
          notes: notes,
        },
        createdAt: new Date(),
      });

      // 8. Retornar resposta completa (compatível com frontend)
      return {
        paymentId: payment.id,
        booking: updatedBooking,
        message: "Pagamento registrado com sucesso",
        paymentSummary: {
          totalPrice: totalPrice,
          amountPaid: newDepositCalculated,
          amountDue: newBalanceCalculated,
          paymentStatus: newStatusCalculated,
        }
      };
    });
  } catch (error) {
    console.error('❌ Erro ao registrar pagamento manual:', error);
    throw new Error(`Falha ao registrar pagamento: ${(error as Error).message}`);
  }
};

export const confirmEventPayment = async (
  paymentId: string,
  confirmedBy?: string
): Promise<any> => {
  try {
    const [payment] = await db.select().from(eventPayments).where(eq(eventPayments.id, paymentId));
    
    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    // ✅ CORREÇÃO: Usar Firebase UID diretamente
    const confirmedByValue = confirmedBy || null;

    // Atualize o status do pagamento
    const [updatedPayment] = await db.update(eventPayments)
      .set({
        status: "confirmed",
        confirmedBy: confirmedByValue, // ✅ Firebase UID direto
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(eventPayments.id, paymentId))
      .returning();

    // Verifique se todos os pagamentos estão confirmados para atualizar a reserva
    const allPayments = await db.select()
      .from(eventPayments)
      .where(eq(eventPayments.eventBookingId!, payment.eventBookingId!));

    const totalPaid = allPayments
      .filter(p => p.status === "confirmed")
      .reduce((sum, p) => sum + toNumber(p.amount), 0);

    const [eventBooking] = await db.select().from(eventBookings).where(eq(eventBookings.id, payment.eventBookingId!));
    
    if (eventBooking) {
      const totalPrice = toNumber(eventBooking.totalPrice);
      let newPaymentStatus = eventBooking.paymentStatus;

      if (totalPaid >= totalPrice) {
        newPaymentStatus = "paid";
      } else if (totalPaid > 0) {
        newPaymentStatus = "partial";
      }

      // ✅ Atualizar com cálculo manual para consistência
      // ✅ CORREÇÃO: Atualizar depositPaid e balanceDe corretamente
      await db.update(eventBookings)
        .set({ 
          paymentStatus: newPaymentStatus,
          depositPaid: totalPaid.toString(),
          balanceDue: (totalPrice - totalPaid).toString(),
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, payment.eventBookingId!));
    }

    await logEventPaymentAction(payment.eventBookingId!, "payment_confirmed", {
      paymentId: paymentId,
      confirmedBy: confirmedBy,
      action: "payment_confirmed"
    });

    return updatedPayment;
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    throw new Error(`Falha ao confirmar pagamento: ${(error as Error).message}`);
  }
};

// ✅ CORREÇÃO: Função para cancelar reserva com tratamento de reembolso
export const cancelEventBooking = async (
  eventBookingId: string,
  reason: string,
  cancelledBy: string
): Promise<any> => {
  try {
    return await db.transaction(async (tx) => {
      // 1. Buscar a reserva
      const [eventBooking] = await tx.select().from(eventBookings).where(eq(eventBookings.id, eventBookingId));
      
      if (!eventBooking) {
        throw new Error("Reserva de evento não encontrada");
      }

      const currentDeposit = toNumber(eventBooking.depositPaid);

      // ✅ CORREÇÃO: Para cancelamento: zerar saldo pendente e marcar reembolso se pago > 0
      // Antes de set "status" = 'cancelled'
      if (currentDeposit > 0) {
        // Lógica de reembolso (insert em refunds ou similar)
        await tx.insert(refunds).values({
          id: crypto.randomUUID(),
          bookingId: eventBookingId,
          amount: currentDeposit.toString(),
          status: 'pending',
          reason: reason + ' (reembolso por cancelamento)',
          requestedBy: cancelledBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Zerar saldo pendente
        await tx.update(eventBookings)
          .set({
            depositPaid: '0',
            balanceDue: '0',
            paymentStatus: 'refunded'
          })
          .where(eq(eventBookings.id, eventBookingId));
      }

      // 2. Atualizar o status da reserva para cancelled
      const [updatedBooking] = await tx.update(eventBookings)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, eventBookingId))
        .returning();

      // 3. Cancele qualquer pagamento pendente associado
      await tx.update(eventPayments)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
          notes: `Pagamento cancelado: ${cancelledBy} - ${reason}`
        })
        .where(and(
          eq(eventPayments.eventBookingId!, eventBookingId),
          eq(eventPayments.status, "pending")
        ));

      await logEventPaymentAction(eventBookingId, "booking_cancelled", {
        cancelledBy,
        reason,
        previousStatus: eventBooking.status,
        currentDeposit,
        action: "booking_cancelled"
      });

      return updatedBooking;
    });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    throw new Error(`Falha ao cancelar reserva: ${(error as Error).message}`);
  }
};

// ✅ CORREÇÃO: Função para rejeitar reserva com tratamento de reembolso
export const rejectEventBooking = async (
  eventBookingId: string,
  reason: string,
  rejectedBy: string
): Promise<any> => {
  try {
    return await db.transaction(async (tx) => {
      // 1. Buscar a reserva
      const [eventBooking] = await tx.select().from(eventBookings).where(eq(eventBookings.id, eventBookingId));
      
      if (!eventBooking) {
        throw new Error("Reserva de evento não encontrada");
      }

      const currentDeposit = toNumber(eventBooking.depositPaid);

      // ✅ CORREÇÃO: Para rejeição: zerar saldo pendente e marcar reembolso se pago > 0
      if (currentDeposit > 0) {
        // Lógica de reembolso
        await tx.insert(refunds).values({
          id: crypto.randomUUID(),
          bookingId: eventBookingId,
          amount: currentDeposit.toString(),
          status: 'pending',
          reason: reason + ' (reembolso por rejeição)',
          requestedBy: rejectedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Zerar saldo pendente
        await tx.update(eventBookings)
          .set({
            depositPaid: '0',
            balanceDue: '0',
            paymentStatus: 'refunded'
          })
          .where(eq(eventBookings.id, eventBookingId));
      }

      // 2. Atualizar o status da reserva para rejected
      const [updatedBooking] = await tx.update(eventBookings)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, eventBookingId))
        .returning();

      // 3. Cancele qualquer pagamento pendente associado
      await tx.update(eventPayments)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
          notes: `Pagamento cancelado: ${rejectedBy} - ${reason}`
        })
        .where(and(
          eq(eventPayments.eventBookingId!, eventBookingId),
          eq(eventPayments.status, "pending")
        ));

      await logEventPaymentAction(eventBookingId, "booking_rejected", {
        rejectedBy,
        reason,
        previousStatus: eventBooking.status,
        currentDeposit,
        action: "booking_rejected"
      });

      return updatedBooking;
    });
  } catch (error) {
    console.error('Erro ao rejeitar reserva:', error);
    throw new Error(`Falha ao rejeitar reserva: ${(error as Error).message}`);
  }
};

export const generateEventReceipt = async (
  paymentId: string,
  generatedBy?: string
): Promise<any> => {
  try {
    // Busque informações completas do pagamento
    const result = await db.select({
      payment: eventPayments,
      booking: eventBookings,
      hotel: hotels,
      user: users,
    })
    .from(eventPayments)
    .innerJoin(eventBookings, eq(eventBookings.id, eventPayments.eventBookingId!))
    .innerJoin(hotels, eq(hotels.id, eventBookings.hotelId))
    .leftJoin(users, eq(users.id, eventPayments.userId!))
    .where(eq(eventPayments.id, paymentId))
    .limit(1);

    if (result.length === 0) {
      throw new Error("Pagamento não encontrado");
    }

    const { payment, booking, hotel, user } = result[0];

    // Gere um recibo simples
    const receipt = {
      receiptNumber: `EVENT-RCPT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paymentId: payment.id,
      eventBookingId: booking.id,
      eventTitle: booking.eventTitle,
      hotelName: hotel.name,
      organizerName: booking.organizerName,
      amount: toNumber(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentType: payment.paymentType,
      referenceNumber: payment.referenceNumber,
      paidAt: payment.paidAt,
      confirmedAt: payment.confirmedAt,
      status: payment.status,
      generatedAt: new Date(),
      generatedBy: generatedBy,
    };

    await logEventPaymentAction(booking.id, "receipt_generated", {
      receiptNumber: receipt.receiptNumber,
      paymentId,
      generatedBy
    });

    return receipt;
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    throw new Error(`Falha ao gerar recibo: ${(error as Error).message}`);
  }
};

export const processEventBookingWithPayment = async (
  bookingId: string,
  paymentOptionId: string,
  selectedPromotionId?: string
): Promise<any> => {
  try {
    const result = await db.execute(sql`
      SELECT process_booking_with_payment_option(
        ${bookingId}::uuid,
        'event'::text,
        ${paymentOptionId}::text,
        ${selectedPromotionId || null}::uuid
      ) as result
    `);

    const rows = result as unknown as Array<{ result: any }>;

    return rows[0]?.result;
  } catch (error) {
    console.error('Erro ao processar reserva com pagamento:', error);
    throw new Error(`Falha ao processar reserva: ${(error as Error).message}`);
  }
};

export const cancelEventBookingForNonPayment = async (
  eventBookingId: string,
  cancelledBy: string
): Promise<any> => {
  try {
    const [eventBooking] = await db.select().from(eventBookings).where(eq(eventBookings.id, eventBookingId));
    
    if (!eventBooking) {
      throw new Error("Reserva de evento não encontrada");
    }

    // ✅ CORREÇÃO: Usar Firebase UID diretamente
    const cancelledByValue = cancelledBy;

    // Atualize o status da reserva
    const [updatedBooking] = await db.update(eventBookings)
      .set({
        status: "cancelled",
        paymentStatus: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(eventBookings.id, eventBookingId))
      .returning();

    // Cancele qualquer pagamento pendente associado
    await db.update(eventPayments)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
        notes: `Pagamento cancelado: ${cancelledBy}`
      })
      .where(and(
        eq(eventPayments.eventBookingId!, eventBookingId),
        eq(eventPayments.status, "pending")
      ));

    await logEventPaymentAction(eventBookingId, "booking_cancelled_non_payment", {
      cancelledBy,
      action: "booking_cancelled_for_non_payment"
    });

    return updatedBooking;
  } catch (error) {
    console.error('Erro ao cancelar reserva por falta de pagamento:', error);
    throw new Error(`Falha ao cancelar reserva: ${(error as Error).message}`);
  }
};

// ==================== FUNÇÕES DE FATURAÇÃO ====================

export const createEventInvoice = async (
  bookingId: string,
  data: {
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
    dueDate?: Date;
  }
): Promise<EventInvoice> => {
  try {
    const invoiceNumber = `EVENT-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const [eventBooking] = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId));
    
    if (!eventBooking) throw new Error("Reserva de evento não encontrada");

    // CORREÇÃO: Buscar booking com SQL direto para evitar problemas de camelCase
    const bookingResult = await db.execute(sql`
      SELECT id FROM bookings 
      WHERE "hotelId" = ${eventBooking.hotelId} 
        AND type = 'event'
      LIMIT 1
    `);

    const bookingData = bookingResult as unknown as Array<{ id: string }>;
    let bookingReferenceId: string;

    if (bookingData && bookingData.length > 0) {
      bookingReferenceId = bookingData[0].id;
    } else {
      const [newBooking] = await db.insert(bookings).values({
        hotelId: eventBooking.hotelId,
        type: 'event',
        status: 'confirmed',
        totalPrice: eventBooking.totalPrice.toString(),
        seatsBooked: 1,
        guestName: eventBooking.organizerName,
        guestEmail: eventBooking.organizerEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      bookingReferenceId = newBooking.id;
    }

    const [invoice] = await db.insert(invoices).values({
      booking_id: bookingReferenceId,
      invoice_number: invoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      total_amount: data.total.toString(),
      tax_amount: (data.tax || 0).toString(),
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    await logEventPaymentAction(bookingId, "invoice_created", {
      invoiceId: invoice.id,
      invoiceNumber,
      total: data.total,
      dueDate: invoice.due_date
    });

    return invoice;
  } catch (error) {
    console.error('Erro ao criar fatura:', error);
    throw new Error(`Falha ao criar fatura: ${(error as Error).message}`);
  }
};

export const getEventInvoiceById = async (invoiceId: string): Promise<EventInvoice | null> => {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId));
  return invoice || null;
};

export const getEventInvoicesByBooking = async (bookingId: string): Promise<EventInvoice[]> => {
  const [eventBooking] = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId));
  
  if (!eventBooking) return [];

  // CORREÇÃO: Usar SQL direto com nomes de colunas corretos
  try {
    const result = await db.execute(sql`
      SELECT i.*
      FROM invoices i
      JOIN bookings b ON b.id = i.booking_id
      WHERE b."hotelId" = ${eventBooking.hotelId}
        AND b.type = 'event'
      ORDER BY i.created_at DESC
    `);

    const invoicesData = result as unknown as EventInvoice[];
    return invoicesData || [];
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    return [];
  }
};

// ==================== DETALHES DE PAGAMENTO ====================

export const getEventBookingPaymentDetails = async (bookingId: string) => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, bookingId));

    if (!booking) throw new Error("Reserva de evento não encontrada");

    // Busque pagamentos específicos de eventos
    const paymentRecords = await db
      .select()
      .from(eventPayments)
      .where(eq(eventPayments.eventBookingId!, bookingId))
      .orderBy(desc(eventPayments.paidAt));

    // ✅ CORREÇÃO: Incluir status "partial" no cálculo do total pago
    const totalPaid = paymentRecords
      .filter(p => p.status === "confirmed" || p.status === "paid" || p.status === "partial")
      .reduce((sum, p) => sum + toNumber(p.amount), 0);

    const totalPrice = toNumber(booking.totalPrice);
    const remaining = totalPrice - totalPaid;

    // Busque faturas associadas
    let activeInvoice: EventInvoice | null = null;
    
    try {
      const invoiceResult = await db.execute(sql`
        SELECT i.*
        FROM invoices i
        JOIN bookings b ON b.id = i.booking_id
        WHERE b."hotelId" = ${booking.hotelId}
          AND b.type = 'event'
          AND i.status = 'pending'
        ORDER BY i.created_at DESC
        LIMIT 1
      `);

      const invoicesData = invoiceResult as unknown as EventInvoice[];
      activeInvoice = invoicesData && invoicesData.length > 0 ? invoicesData[0] : null;
    } catch (invoiceError) {
      console.error('Erro ao buscar fatura:', invoiceError);
      // Continuar sem fatura
    }

    return {
      booking: {
        id: booking.id,
        eventName: booking.eventTitle,
        organizerName: booking.organizerName,
        organizerEmail: booking.organizerEmail,
        // ✅ CORREÇÃO: Campos atualizados para sistema diário
        startDate: booking.startDate,  
        endDate: booking.endDate,      
        durationDays: toNumber(booking.durationDays),  
        attendees: booking.expectedAttendees,
        totalPrice: totalPrice,
        basePrice: toNumber(booking.basePrice),
        securityDeposit: toNumber(booking.securityDeposit),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        cateringRequired: booking.cateringRequired || false,
        depositPaid: toNumber(booking.depositPaid),
        balanceDue: toNumber(booking.balanceDue),
      },
      invoice: activeInvoice ? {
        id: activeInvoice.id,
        invoiceNumber: activeInvoice.invoice_number,
        totalAmount: toNumber(activeInvoice.total_amount),
        dueDate: activeInvoice.due_date,
        status: activeInvoice.status,
      } : null,
      paymentSummary: {
        totalPrice,
        amountPaid: totalPaid,
        amountDue: remaining > 0 ? remaining : 0,
        paymentStatus: remaining <= 0 ? "paid" : booking.paymentStatus,
      },
      paymentHistory: paymentRecords.map(p => ({
        id: p.id,
        amount: toNumber(p.amount),
        paymentMethod: p.paymentMethod,
        paymentType: p.paymentType,
        referenceNumber: p.referenceNumber,
        status: p.status,
        paidAt: p.paidAt,
        confirmedAt: p.confirmedAt,
        createdAt: p.createdAt,
        proofImageUrl: p.proofImageUrl,
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes de pagamento:', error);
    throw new Error(`Falha ao buscar detalhes: ${(error as Error).message}`);
  }
};

// ==================== OPÇÕES DE PAGAMENTO ====================

export const getPaymentOptionsForEventSpace = async (eventSpaceId: string) => {
  const options = await db
    .select()
    .from(paymentOptions)
    .where(eq(paymentOptions.event_space_id!, eventSpaceId))
    .limit(1);

  return options[0] || null;
};

export const getAvailableEventPaymentOptions = async (
  eventSpaceId?: string,
  eventDate?: string,
  totalAmount: number = 0
): Promise<any[]> => {
  try {
    const result = await db.execute(sql`
      SELECT * FROM get_available_payment_options(
        NULL::uuid,
        ${eventSpaceId || null}::uuid,
        NULL::date,
        ${eventDate || null}::date,
        ${totalAmount}::numeric
      ) as options
    `);

    const rows = result as unknown as Array<{ options: any }>;
    return rows.map(row => row.options);
  } catch (error) {
    console.error('Erro ao buscar opções de pagamento:', error);
    return [];
  }
};

export const calculateRequiredEventDeposit = async (
  bookingId: string
): Promise<{ 
  required: number; 
  type: string; 
  dueDate?: string; 
  options?: any;
  totalPrice: number;
  depositAmount: number;
  depositPercentage: number;
}> => {
  try {
    const details = await getEventBookingPaymentDetails(bookingId);
    const [booking] = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId));
    
    if (!booking) throw new Error('Reserva de evento não encontrada');
    
    const options = await getPaymentOptionsForEventSpace(booking.eventSpaceId);
    
    const totalPrice = details.paymentSummary.totalPrice;
    let deposit = 0;
    let depositType = "full_payment";
    let depositPercentage = 100;
    let dueDate: string | undefined;

    if (options) {
      if (options.deposit_enabled && options.deposit_percentage) {
        const depositPercent = toNumber(options.deposit_percentage);
        if (depositPercent > 0) {
          deposit = totalPrice * (depositPercent / 100);
          depositType = "deposit";
          depositPercentage = depositPercent;
          const dueDays = options.deposit_due_days || 3;
          dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        }
      } else if (options.advance_payment_enabled && options.advance_payment_required_percentage) {
        const advancePercent = toNumber(options.advance_payment_required_percentage);
        if (advancePercent > 0) {
          deposit = totalPrice * (advancePercent / 100);
          depositType = "advance_payment";
          depositPercentage = advancePercent;
          const dueDays = options.advance_payment_due_days || 7;
          dueDate = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        }
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
      options
    };
  } catch (error) {
    console.error('Erro ao calcular depósito:', error);
    throw new Error(`Falha ao calcular depósito: ${(error as Error).message}`);
  }
};

// ==================== HISTÓRICO E RELATÓRIOS ====================

export const getPaymentsByEventBooking = async (bookingId: string): Promise<EventPayment[]> => {
  return await db
    .select()
    .from(eventPayments)
    .where(eq(eventPayments.eventBookingId!, bookingId))
    .orderBy(desc(eventPayments.paidAt));
};

export const getRecentEventPaymentsByHotel = async (
  hotelId: string,
  limit: number = 20
): Promise<EventPayment[]> => {
  const results = await db
    .select({
      payment: eventPayments,
    })
    .from(eventPayments)
    .innerJoin(eventBookings, eq(eventBookings.id, eventPayments.eventBookingId!))
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        eq(eventPayments.status, "confirmed")
      )
    )
    .orderBy(desc(eventPayments.paidAt))
    .limit(limit);

  return results.map(r => r.payment);
};

// ✅ CORREÇÃO: Função para estatísticas do dashboard - filtrar reservas ativas
export const getEventDashboardStats = async (
  hotelId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    // ✅ CORREÇÃO: Para estatísticas (em dashboard endpoint): filtrar reservas ativas
    const baseConditions = [
      eq(eventBookings.hotelId, hotelId)
    ];

    if (startDate && endDate) {
      baseConditions.push(gte(eventBookings.startDate, startDate));
      baseConditions.push(lte(eventBookings.startDate, endDate));
    }

    // ✅ CORREÇÃO: Filtrar reservas ativas (não canceladas ou rejeitadas)
    const bookingsResult = await db
      .select({
        total_reservas: sql<number>`COUNT(*)`,
        total_revenue: sql<number>`COALESCE(SUM(total_price::numeric), 0)`,
        paid_reservas: sql<number>`COUNT(CASE WHEN payment_status = 'paid' THEN 1 END)`,
        confirmed_reservas: sql<number>`COUNT(CASE WHEN status IN ('confirmed', 'pending') THEN 1 END)`
      })
      .from(eventBookings)
      .where(
        and(
          ...baseConditions,
          // ✅ CORREÇÃO: Filtrar reservas ativas
          sql`status NOT IN ('cancelled', 'rejected')`
        )
      );

    const bookingsData = bookingsResult[0] || {
      total_reservas: 0,
      total_revenue: 0,
      paid_reservas: 0,
      confirmed_reservas: 0
    };

    // ✅ CORREÇÃO: Para estatísticas (em dashboard endpoint): filtrar reservas ativas
    const paymentsResult = await db
      .select({
        total_paid: sql<number>`COALESCE(SUM(ep.amount::numeric), 0)`,
        pending_payments: sql<number>`COUNT(CASE WHEN ep.status = 'pending' THEN 1 END)`,
        upcoming_payments: sql<number`COUNT(CASE WHEN eb.payment_status IN ('partial', 'pending') THEN 1 END)`
      })
      .from(eventPayments)
      .innerJoin(eventBookings, eq(eventBookings.id, eventPayments.eventBookingId!))
      .where(
        and(
          eq(eventBookings.hotelId, hotelId),
          // ✅ CORREÇÃO: Filtrar reservas ativas
          sql`eb.status NOT IN ('cancelled', 'rejected')`,
          startDate && endDate ? gte(eventPayments.paidAt, new Date(startDate)) : sql``,
          startDate && endDate ? lte(eventPayments.paidAt, new Date(endDate)) : sql``
        )
      );

    const paymentsData = paymentsResult[0] || {
      total_paid: 0,
      pending_payments: 0,
      upcoming_payments: 0
    };

    return {
      totalReservas: Number(bookingsData.total_reservas),
      totalRevenue: Number(bookingsData.total_revenue),
      reservasPagas: Number(bookingsData.paid_reservas),
      reservasConfirmadas: Number(bookingsData.confirmed_reservas),
      totalPago: Number(paymentsData.total_paid),
      pagamentosPendentes: Number(paymentsData.pending_payments),
      pagamentosFuturos: Number(paymentsData.upcoming_payments),
      taxaConfirmacao: Number(bookingsData.total_reservas) > 0 
        ? (Number(bookingsData.confirmed_reservas) / Number(bookingsData.total_reservas)) * 100 
        : 0
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    throw new Error(`Falha ao buscar estatísticas: ${(error as Error).message}`);
  }
};

export const getEventFinancialSummary = async (
  hotelId: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const conditions: any[] = [
      eq(eventBookings.hotelId, hotelId),
      // ✅ CORREÇÃO: Filtrar reservas ativas
      sql`status NOT IN ('cancelled', 'rejected')`
    ];

    let startDateStr: string | undefined;
    let endDateStr: string | undefined;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      startDateStr = start.toISOString().split('T')[0];
      endDateStr = end.toISOString().split('T')[0];

      conditions.push(gte(eventBookings.startDate, startDateStr));
      conditions.push(lte(eventBookings.startDate, endDateStr));
    }

    const bookingsQuery = sql`
      SELECT 
        COALESCE(SUM(total_price::numeric), 0) as total_revenue,
        COUNT(*) as total_events,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_events
      FROM event_bookings
      WHERE hotel_id = ${hotelId}
        AND status NOT IN ('cancelled', 'rejected')
        ${startDateStr && endDateStr 
          ? sql`AND start_date >= ${startDateStr} AND start_date <= ${endDateStr}` 
          : sql``}
    `;

    const bookingsResult = await db.execute(bookingsQuery);
    const bookingsData = bookingsResult as unknown as Array<{
      total_revenue: string | number;
      total_events: string | number;
      paid_events: string | number;
    }>;

    const bookingsRow = bookingsData?.[0] ?? { 
      total_revenue: 0, 
      total_events: 0, 
      paid_events: 0 
    };

    const paymentsQuery = sql`
      SELECT 
        COALESCE(SUM(ep.amount::numeric), 0) as total_paid,
        COUNT(CASE WHEN ep.status = 'confirmed' THEN 1 END) as confirmed_payments,
        COUNT(CASE WHEN ep.status = 'pending' THEN 1 END) as pending_payments
      FROM event_payments ep
      INNER JOIN event_bookings eb ON eb.id = ep.event_booking_id
      WHERE eb.hotel_id = ${hotelId}
        AND eb.status NOT IN ('cancelled', 'rejected')
        ${startDateStr && endDateStr 
          ? sql`AND ep.paid_at >= ${new Date(startDateStr)} AND ep.paid_at <= ${new Date(endDateStr + 'T23:59:59')}` 
          : sql``}
    `;

    const paymentsResult = await db.execute(paymentsQuery);
    const paymentsData = paymentsResult as unknown as Array<{
      total_paid: string | number;
      confirmed_payments: string | number;
      pending_payments: string | number;
    }>;

    const paymentsRow = paymentsData?.[0] ?? {
      total_paid: 0,
      confirmed_payments: 0,
      pending_payments: 0
    };

    return {
      totalRevenue: toNumber(bookingsRow.total_revenue),
      totalEvents: Number(bookingsRow.total_events),
      paidEvents: Number(bookingsRow.paid_events),
      totalPaid: toNumber(paymentsRow.total_paid),
      confirmedPayments: Number(paymentsRow.confirmed_payments),
      pendingPayments: Number(paymentsRow.pending_payments),
      averageRevenuePerEvent: Number(bookingsRow.total_events) > 0 
        ? toNumber(bookingsRow.total_revenue) / Number(bookingsRow.total_events) 
        : 0,
      pendingEvents: Number(bookingsRow.total_events) - Number(bookingsRow.paid_events),
    };
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro de eventos:', error);
    throw new Error(`Falha ao buscar resumo: ${(error as Error).message}`);
  }
};

export const getPendingEventPayments = async (
  limit: number = 50,
  offset: number = 0
): Promise<EventPayment[]> => {
  try {
    const result = await db
      .select()
      .from(eventPayments)
      .where(eq(eventPayments.status, 'pending'))
      .orderBy(desc(eventPayments.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    return [];
  }
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const updateEventBookingPaymentStatus = async (
  bookingId: string,
  paymentStatus: "pending" | "paid" | "partial" | "refunded" | "failed" | "cancelled",
  paymentReference?: string
): Promise<any> => {
  try {
    const [updated] = await db
      .update(eventBookings)
      .set({
        paymentStatus,
        ...(paymentReference && { paymentReference }),
        updatedAt: new Date(),
      })
      .where(eq(eventBookings.id, bookingId))
      .returning();

    await logEventPaymentAction(bookingId, "payment_status_updated", {
      previousStatus: updated?.paymentStatus,
      newStatus: paymentStatus,
      paymentReference
    });

    return updated;
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    throw new Error(`Falha ao atualizar status: ${(error as Error).message}`);
  }
};

export const hasPendingEventPayments = async (bookingId: string): Promise<boolean> => {
  const payments = await getPaymentsByEventBooking(bookingId);
  return payments.some(p => p.status === "pending");
};

export const calculateEventPendingBalance = async (bookingId: string): Promise<number> => {
  const details = await getEventBookingPaymentDetails(bookingId);
  return details.paymentSummary.amountDue;
};

export const registerSimpleEventPayment = async (
  bookingId: string,
  userId: string | null,
  paymentMethod: string,
  amount?: number
): Promise<EventPayment> => {
  try {
    const [eventBooking] = await db.select().from(eventBookings).where(eq(eventBookings.id, bookingId));
    if (!eventBooking) throw new Error("Reserva de evento não encontrada");

    // ✅ CORREÇÃO: Usar Firebase UID diretamente
    const paymentAmount = amount || toNumber(eventBooking.totalPrice);

    const [payment] = await db.insert(eventPayments).values({
      eventBookingId: bookingId,
      hotelId: eventBooking.hotelId,
      userId, // ✅ Firebase UID direto
      amount: paymentAmount.toString(),
      paymentMethod: paymentMethod,
      paymentType: "full",
      status: "confirmed",
      confirmedBy: userId, // ✅ Firebase UID direto
      paidAt: new Date(),
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: "Pagamento simples registrado",
      metadata: { 
        paymentMethod, 
        type: "simple_payment"
      }
    }).returning();

    // Atualize o status da reserva com cálculo manual
    // ✅ CORREÇÃO: Usar a lógica consistente de atualização
    const totalPaid = toNumber(eventBooking.depositPaid) + paymentAmount;
    const totalPrice = toNumber(eventBooking.totalPrice);
    
    await db.update(eventBookings)
      .set({
        paymentStatus: totalPaid >= totalPrice ? 'paid' : 'partial',
        depositPaid: totalPaid.toString(),
        balanceDue: (totalPrice - totalPaid).toString(),
        updatedAt: new Date()
      })
      .where(eq(eventBookings.id, bookingId));

    return payment;
  } catch (error) {
    console.error('Erro ao registrar pagamento simples:', error);
    throw new Error(`Falha ao registrar pagamento: ${(error as Error).message}`);
  }
};

// ==================== FUNÇÕES ADICIONAIS PARA EVENT_PAYMENTS ====================

export const getEventPaymentById = async (paymentId: string): Promise<EventPayment | null> => {
  const [payment] = await db
    .select()
    .from(eventPayments)
    .where(eq(eventPayments.id, paymentId));
  return payment || null;
};

export const updateEventPayment = async (
  paymentId: string,
  data: Partial<EventPaymentInsert>
): Promise<EventPayment> => {
  // ✅ CORREÇÃO: Usar Firebase UIDs diretamente, sem conversão
  const [updated] = await db
    .update(eventPayments)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(eventPayments.id, paymentId))
    .returning();

  if (!updated) {
    throw new Error("Pagamento não encontrado");
  }

  return updated;
};

export const deleteEventPayment = async (paymentId: string): Promise<boolean> => {
  const result = await db
    .delete(eventPayments)
    .where(eq(eventPayments.id, paymentId))
    .returning();

  return result.length > 0;
};

export const getEventPaymentsByDateRange = async (
  hotelId: string,
  startDate: Date,
  endDate: Date
): Promise<EventPayment[]> => {
  const results = await db
    .select({
      payment: eventPayments,
    })
    .from(eventPayments)
    .innerJoin(eventBookings, eq(eventBookings.id, eventPayments.eventBookingId!))
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        gte(eventPayments.createdAt, startDate),
        lte(eventPayments.createdAt, endDate)
      )
    );

  return results.map(r => r.payment);
};

// ==================== EXPORTS ====================

export default {
  // Funções principais
  registerManualEventPayment,
  confirmEventPayment,
  generateEventReceipt,
  processEventBookingWithPayment,
  cancelEventBookingForNonPayment,
  cancelEventBooking, // ✅ CORREÇÃO: Nova função adicionada
  rejectEventBooking, // ✅ CORREÇÃO: Nova função adicionada
  
  // Faturação
  createEventInvoice,
  getEventInvoiceById,
  getEventInvoicesByBooking,
  
  // Detalhes de pagamento
  getEventBookingPaymentDetails,
  
  // Opções de pagamento
  getPaymentOptionsForEventSpace,
  getAvailableEventPaymentOptions,
  calculateRequiredEventDeposit,
  
  // Histórico e relatórios
  getPaymentsByEventBooking,
  getRecentEventPaymentsByHotel,
  getEventFinancialSummary,
  getPendingEventPayments,
  getEventDashboardStats, // ✅ CORREÇÃO: Nova função para dashboard
  
  // Funções adicionais
  updateEventBookingPaymentStatus,
  hasPendingEventPayments,
  calculateEventPendingBalance,
  registerSimpleEventPayment,
  
  // Novas funções para event_payments
  getEventPaymentById,
  updateEventPayment,
  deleteEventPayment,
  getEventPaymentsByDateRange,
  
  // ✅ CORREÇÃO: Exportar função auxiliar se necessário
  getUserId,
};