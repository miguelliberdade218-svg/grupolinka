// src/modules/events/eventBookingService.ts - VERSÃO FINAL (SISTEMA DE DIÁRIAS) - TOTALMENTE CORRIGIDO E OTIMIZADO

import { db } from "../../../db";
import {
  eventBookings,
  eventBookingLogs,
  eventSpaces,
  hotels,
} from "../../../shared/schema";
import { eq, and, sql, desc, inArray, or } from "drizzle-orm";
import { isEventSpaceAvailable, getEventSpaceById } from "./eventSpaceService";
import { calculateEventBasePrice } from "./eventService";

// ==================== TIPOS ====================
export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;

// ✅ CORRIGIDO: Removidos status e paymentStatus do input - sempre controlados pelo backend
export type CreateEventBookingInput = {
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: any;
  cateringRequired?: boolean;
  userId?: string;
  // ✅ REMOVIDO: status e paymentStatus - sempre controlados pelo backend
};

// ==================== CONSTANTES ====================
const VALID_BOOKING_STATUSES = [
  'pending_approval',
  'confirmed',
  'cancelled',
  'rejected'
] as const;

type BookingStatus = typeof VALID_BOOKING_STATUSES[number];

const VALID_PAYMENT_STATUSES = [
  'pending',
  'partially_paid',
  'paid',
  'refunded',
  'failed',
  'cancelled'
] as const;

// ==================== FUNÇÕES HELPER ====================
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = parseFloat(value as string);
  return isNaN(num) ? 0 : num;
};

const toRequiredString = (value: number | string): string => {
  return typeof value === 'string' ? value : value.toString();
};

const toNullableString = (value: number | string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : value.toString();
};

// ✅ HELPER PARA LOGS
const createSafeLogEntry = (
  bookingId: string,
  action: string,
  details: any,
  performedBy?: string
) => {
  if (performedBy) {
    details = { ...details, performedBy };
  }

  return {
    bookingId,
    action,
    details,
    createdAt: new Date(),
  };
};

const validateBookingStatus = (status: string): BookingStatus => {
  if (VALID_BOOKING_STATUSES.includes(status as BookingStatus)) {
    return status as BookingStatus;
  }
  throw new Error(`Status inválido: ${status}. Status permitidos: ${VALID_BOOKING_STATUSES.join(', ')}`);
};

// ✅ Converter string para Date no início do dia
const ymdToDateStart = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

// ✅ Converter string para Date no final do dia
const ymdToDateEnd = (dateStr: string): Date => {
  return new Date(dateStr + 'T23:59:59');
};

// ==================== CRIAÇÃO DE RESERVA (SISTEMA DE DIÁRIAS) ====================

export const createEventBooking = async (
  data: CreateEventBookingInput,
  performedBy?: string
): Promise<EventBooking> => {
  return await db.transaction(async (tx) => {
    try {
      const {
        eventSpaceId,
        hotelId,
        organizerName,
        organizerEmail,
        organizerPhone,
        eventTitle,
        eventDescription,
        eventType,
        startDate,
        endDate,
        expectedAttendees,
        specialRequests,
        additionalServices,
        cateringRequired = false,
        userId,
        // ✅ REMOVIDO: paymentStatus - sempre 'pending' na criação
      } = data;

      console.log('📝 Criando reserva (sistema diárias):', { 
        eventSpaceId, 
        hotelId, 
        organizerName, 
        organizerEmail,
        eventTitle,
        eventType,
        startDate,
        endDate,
        cateringRequired
      });

      // 1. Validações básicas
      const space = await getEventSpaceById(eventSpaceId);
      if (!space || space.hotelId !== hotelId || !space.isActive) {
        throw new Error("Espaço de evento inválido ou inativo");
      }

      // ✅ CORREÇÃO: Validar catering
      if (cateringRequired && !space.offersCatering) {
        throw new Error("Este espaço não oferece serviço de catering");
      }

      // 2. Verificar capacidade
      const capacityMin = toNumber(space.capacityMin);
      const capacityMax = toNumber(space.capacityMax);

      if (expectedAttendees < capacityMin || expectedAttendees > capacityMax) {
        throw new Error(`Número de participantes deve estar entre ${capacityMin} e ${capacityMax}`);
      }

      // 3. Validar tipo de evento
      if (space.allowedEventTypes && space.allowedEventTypes.length > 0) {
        if (!space.allowedEventTypes.includes(eventType)) {
          throw new Error(`Tipo de evento "${eventType}" não permitido neste espaço. Tipos permitidos: ${space.allowedEventTypes.join(', ')}`);
        }
      }

      // 4. Verificar disponibilidade (sistema de diárias)
      const { available, message } = await isEventSpaceAvailable(
        eventSpaceId,
        startDate,
        endDate
      );

      if (!available) {
        throw new Error(`Espaço indisponível: ${message}`);
      }

      // 5. Verificar conflitos
      const conflictingBookings = await tx
        .select()
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.eventSpaceId, eventSpaceId),
            eq(eventBookings.status, "confirmed"),
            or(
              sql`${eventBookings.startDate}::date <= ${startDate}::date AND ${eventBookings.endDate}::date > ${startDate}::date`,
              sql`${eventBookings.startDate}::date <= ${endDate}::date AND ${eventBookings.endDate}::date > ${endDate}::date`,
              sql`${eventBookings.startDate}::date >= ${startDate}::date AND ${eventBookings.endDate}::date <= ${endDate}::date`
            )
          )
        );

      if (conflictingBookings.length > 0) {
        throw new Error("Espaço já reservado para este período");
      }

      // 6. Calcular durationDays
      const calculatedDurationDays = Math.ceil(
        (ymdToDateEnd(endDate).getTime() - ymdToDateStart(startDate).getTime()) / 86400000
      );

      if (calculatedDurationDays < 1) {
        throw new Error("A data final deve ser posterior à data inicial");
      }

      // 7. Calcular preço (diárias + surcharge + catering)
      const totalPrice = await calculateEventBasePrice(
        eventSpaceId,
        startDate,
        endDate,
        cateringRequired
      );

      const basePriceStr = totalPrice.toFixed(2);

      // 8. Preparar dados da reserva
      const bookingData: EventBookingInsert = {
        eventSpaceId,
        hotelId,
        organizerName,
        organizerEmail,
        organizerPhone: organizerPhone || null,
        eventTitle,
        eventDescription: eventDescription || null,
        eventType,
        startDate: startDate,
        endDate: endDate,
        durationDays: calculatedDurationDays,
        expectedAttendees,
        specialRequests: specialRequests || null,
        additionalServices: additionalServices || {},
        cateringRequired,
        basePrice: basePriceStr,
        totalPrice: totalPrice.toFixed(2),
        securityDeposit: space.securityDeposit || "0",
        status: 'pending_approval', // ✅ SEMPRE pendente na criação
        paymentStatus: 'pending',   // ✅ SEMPRE pendente na criação
        userId: userId || null,
      };

      console.log('📤 Inserindo booking (diárias):', { 
        startDate, 
        endDate, 
        durationDays: calculatedDurationDays,
        status: 'pending_approval',
        paymentStatus: 'pending',
        totalPrice: totalPrice.toFixed(2),
        eventType,
        cateringRequired
      });

      const [booking] = await tx.insert(eventBookings).values(bookingData).returning();

      console.log('✅ Booking criado com ID:', booking.id, 'Status:', booking.status);

      // 9. Log da criação
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          booking.id,
          "booking_created",
          {
            durationDays: calculatedDurationDays,
            attendees: expectedAttendees,
            totalPrice: totalPrice.toFixed(2),
            eventType,
            cateringRequired,
            status: 'pending_approval',
            paymentStatus: 'pending',
          },
          performedBy
        )
      );

      return booking;

    } catch (error) {
      console.error('❌ Erro na criação da reserva de evento:', error);
      throw error;
    }
  });
};

// ==================== CONFIRMAÇÃO DE RESERVA ====================

export const confirmEventBooking = async (
  bookingId: string,
  confirmedBy?: string
): Promise<EventBooking | null> => {
  try {
    const [updated] = await db
      .update(eventBookings)
      .set({ 
        status: "confirmed",
        updatedAt: new Date()
      })
      .where(eq(eventBookings.id, bookingId))
      .returning();

    if (updated) {
      // Log com helper
      await db.insert(eventBookingLogs).values(
        createSafeLogEntry(
          bookingId,
          "event_confirmed",
          { 
            timestamp: new Date().toISOString(),
            confirmedBy
          },
          confirmedBy
        )
      );
    }

    return updated || null;
  } catch (error) {
    console.error('Erro na confirmação da reserva:', error);
    throw error;
  }
};

// ==================== CANCELAMENTO DE RESERVA ====================

export const cancelEventBooking = async (
  bookingId: string,
  reason?: string,
  cancelledBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const [booking] = await tx.select().from(eventBookings).where(eq(eventBookings.id, bookingId));

      if (!booking) throw new Error("Reserva de evento não encontrada");

      if (["cancelled"].includes(booking.status)) {
        throw new Error("Reserva já cancelada");
      }

      const updateData: any = {
        status: "cancelled",
        cancellationReason: reason || "Cancelado pelo organizador",
        updatedAt: new Date()
      };

      const [cancelled] = await tx
        .update(eventBookings)
        .set(updateData)
        .where(eq(eventBookings.id, bookingId))
        .returning();

      // Log com helper
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          bookingId,
          "booking_cancelled",
          { 
            reason: reason || "Sem motivo informado",
            cancelledBy
          },
          cancelledBy
        )
      );

      return cancelled;
    } catch (error) {
      console.error('Erro ao cancelar reserva de evento:', error);
      throw error;
    }
  });
};

// ==================== REJEIÇÃO DE RESERVA ====================

export const rejectEventBooking = async (
  bookingId: string,
  reason: string,
  rejectedBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const [booking] = await tx
        .select()
        .from(eventBookings)
        .where(eq(eventBookings.id, bookingId));

      if (!booking) throw new Error("Reserva não encontrada");

      if (booking.status !== "pending_approval") {
        throw new Error("Só reservas pendentes podem ser rejeitadas");
      }

      const updateData = {
        status: "rejected" as const,
        cancellationReason: reason || "Rejeitada pelo hotel (motivo não especificado)",
        cancelledAt: new Date(),
        updatedAt: new Date()
      };

      const [rejected] = await tx
        .update(eventBookings)
        .set(updateData)
        .where(eq(eventBookings.id, bookingId))
        .returning();

      // Log específico de rejeição
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          bookingId,
          "booking_rejected",
          {
            reason: reason || "Motivo não informado",
            rejectedBy,
            timestamp: new Date().toISOString()
          },
          rejectedBy
        )
      );

      return rejected;
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      throw error;
    }
  });
};

// ==================== ATUALIZAÇÃO DE DATAS ====================

export const updateEventBookingDates = async (
  bookingId: string,
  newStartDate: string,
  newEndDate: string,
  updatedBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const booking = await getEventBookingById(bookingId);
      if (!booking) throw new Error("Reserva não encontrada");

      // Validar novas datas
      const newDurationDays = Math.ceil(
        (ymdToDateEnd(newEndDate).getTime() - ymdToDateStart(newStartDate).getTime()) / 86400000
      );

      if (newDurationDays < 1) {
        throw new Error("A nova data final deve ser posterior à data inicial");
      }

      // Verificar conflitos com novas datas
      const conflictingBookings = await tx
        .select()
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.eventSpaceId, booking.eventSpaceId),
            eq(eventBookings.status, "confirmed"),
            sql`${eventBookings.id} != ${bookingId}`,
            or(
              sql`${eventBookings.startDate}::date <= ${newStartDate}::date AND ${eventBookings.endDate}::date > ${newStartDate}::date`,
              sql`${eventBookings.startDate}::date <= ${newEndDate}::date AND ${eventBookings.endDate}::date > ${newEndDate}::date`,
              sql`${eventBookings.startDate}::date >= ${newStartDate}::date AND ${eventBookings.endDate}::date <= ${newEndDate}::date`
            )
          )
        );

      if (conflictingBookings.length > 0) {
        throw new Error("Novo período já está reservado");
      }

      // ✅ CORREÇÃO: Recalcular preço corretamente com cateringRequired do booking
      const cateringRequired = booking.cateringRequired || false;
      const newTotalPrice = await calculateEventBasePrice(
        booking.eventSpaceId,
        newStartDate,
        newEndDate,
        cateringRequired
      );

      // Atualizar booking
      const [updated] = await tx
        .update(eventBookings)
        .set({
          startDate: newStartDate,
          endDate: newEndDate,
          durationDays: newDurationDays,
          totalPrice: newTotalPrice.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, bookingId))
        .returning();

      // Log
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          bookingId,
          "booking_dates_updated",
          {
            oldDates: { start: booking.startDate, end: booking.endDate },
            newDates: { start: newStartDate, end: newEndDate },
            newDurationDays,
            newTotalPrice: newTotalPrice.toFixed(2),
            cateringRequired,
            timestamp: new Date().toISOString(),
            updatedBy
          },
          updatedBy
        )
      );

      return updated || null;
    } catch (error) {
      console.error('Erro ao atualizar datas da reserva:', error);
      throw error;
    }
  });
};

// ==================== BUSCA DE RESERVAS ====================

export const getEventBookingById = async (id: string): Promise<EventBooking | null> => {
  const [booking] = await db.select().from(eventBookings).where(eq(eventBookings.id, id));
  return booking || null;
};

export const getEventBookingsByHotel = async (
  hotelId: string,
  status?: string[]
): Promise<EventBooking[]> => {
  const conditions = [eq(eventBookings.hotelId, hotelId)];
  if (status && status.length > 0) {
    const validStatuses = status.filter(s => VALID_BOOKING_STATUSES.includes(s as BookingStatus));
    if (validStatuses.length > 0) {
      conditions.push(inArray(eventBookings.status, validStatuses));
    }
  }

  return await db
    .select()
    .from(eventBookings)
    .where(and(...conditions))
    .orderBy(desc(eventBookings.startDate));
};

export const getEventBookingsByOrganizerEmail = async (email: string): Promise<EventBooking[]> => {
  return await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.organizerEmail, email))
    .orderBy(desc(eventBookings.startDate));
};

export const getEventBookingsBySpace = async (
  eventSpaceId: string
): Promise<EventBooking[]> => {
  return await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.eventSpaceId, eventSpaceId))
    .orderBy(desc(eventBookings.startDate));
};

// ==================== ATUALIZAÇÃO DE STATUS DE PAGAMENTO ====================

export const updateEventBookingPaymentStatus = async (
  bookingId: string,
  paymentStatus: "pending" | "paid" | "partial" | "refunded" | "failed",
  paymentReference?: string,
  updatedBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const updateData: any = {
        paymentStatus,
        updatedAt: new Date()
      };

      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }

      const [updated] = await tx
        .update(eventBookings)
        .set(updateData)
        .where(eq(eventBookings.id, bookingId))
        .returning();

      if (updated) {
        await tx.insert(eventBookingLogs).values(
          createSafeLogEntry(
            bookingId,
            "payment_status_updated",
            {
              fromStatus: paymentStatus,
              paymentReference,
              timestamp: new Date().toISOString(),
              updatedBy
            },
            updatedBy
          )
        );
      }

      return updated || null;
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
      throw error;
    }
  });
};

// ==================== ATUALIZAÇÃO GERAL DE RESERVA ====================

export const updateEventBooking = async (
  bookingId: string,
  data: Partial<EventBookingInsert>,
  updatedBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const { id, eventSpaceId, hotelId, createdAt, ...updateData } = data;
      
      if (updateData.status !== undefined) {
        updateData.status = validateBookingStatus(updateData.status);
      }
      
      // Converter campos de preço
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = toRequiredString(updateData.basePrice as number | string);
      }
      if (updateData.totalPrice !== undefined) {
        updateData.totalPrice = toRequiredString(updateData.totalPrice as number | string);
      }
      if (updateData.securityDeposit !== undefined) {
        updateData.securityDeposit = toNullableString(updateData.securityDeposit);
      }
      if (updateData.depositPaid !== undefined) {
        updateData.depositPaid = toNullableString(updateData.depositPaid);
      }
      if (updateData.balanceDue !== undefined) {
        updateData.balanceDue = toNullableString(updateData.balanceDue);
      }
      
      updateData.updatedAt = new Date();
      
      const [updated] = await tx
        .update(eventBookings)
        .set(updateData)
        .where(eq(eventBookings.id, bookingId))
        .returning();

      if (updated && updatedBy) {
        await tx.insert(eventBookingLogs).values(
          createSafeLogEntry(
            bookingId,
            "booking_updated",
            {
              updatedFields: Object.keys(data).filter(k => !['id', 'createdAt'].includes(k)),
              timestamp: new Date().toISOString(),
              updatedBy
            },
            updatedBy
          )
        );
      }

      return updated || null;
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      throw error;
    }
  });
};

// ==================== FUNÇÕES DE DETALHES ====================

export const getEventBookingWithDetails = async (bookingId: string) => {
  const result = await db
    .select({
      booking: eventBookings,
      space: eventSpaces,
      hotel: hotels,
    })
    .from(eventBookings)
    .innerJoin(eventSpaces, eq(eventSpaces.id, eventBookings.eventSpaceId))
    .innerJoin(hotels, eq(hotels.id, eventBookings.hotelId))
    .where(eq(eventBookings.id, bookingId))
    .limit(1);

  return result[0] || null;
};

export const getEventBookingLogs = async (bookingId: string) => {
  return await db
    .select()
    .from(eventBookingLogs)
    .where(eq(eventBookingLogs.bookingId, bookingId))
    .orderBy(desc(eventBookingLogs.createdAt));
};

// ==================== FUNÇÕES DE CÁLCULO ====================

export const calculateEventDeposit = async (
  bookingId: string,
  depositPercentage: number = 30
): Promise<number> => {
  const booking = await getEventBookingById(bookingId);
  if (!booking) {
    throw new Error("Reserva não encontrada");
  }

  const totalPrice = toNumber(booking.totalPrice);
  return Math.round(totalPrice * (depositPercentage / 100));
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const getPendingApprovalBookings = async (hotelId: string): Promise<EventBooking[]> => {
  return await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        eq(eventBookings.status, "pending_approval")
      )
    )
    .orderBy(desc(eventBookings.createdAt));
};

export const getUpcomingEventBookings = async (
  hotelId: string,
  daysAhead: number = 30
): Promise<EventBooking[]> => {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureStr = futureDate.toISOString().split("T")[0];

  return await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        sql`${eventBookings.startDate}::date >= ${today}::date`,
        sql`${eventBookings.startDate}::date <= ${futureStr}::date`,
        inArray(eventBookings.status, ["pending_approval", "confirmed"])
      )
    )
    .orderBy(eventBookings.startDate);
};

// ==================== VERIFICAÇÃO DE CONFLITOS (DIÁRIAS) ====================

export const checkBookingConflicts = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: EventBooking[] }> => {
  const conditions: any[] = [
    eq(eventBookings.eventSpaceId, eventSpaceId),
    eq(eventBookings.status, "confirmed"),
    or(
      sql`${eventBookings.startDate}::date <= ${startDate}::date AND ${eventBookings.endDate}::date > ${startDate}::date`,
      sql`${eventBookings.startDate}::date <= ${endDate}::date AND ${eventBookings.endDate}::date > ${endDate}::date`,
      sql`${eventBookings.startDate}::date >= ${startDate}::date AND ${eventBookings.endDate}::date <= ${endDate}::date`
    )
  ];

  if (excludeBookingId) {
    conditions.push(sql`${eventBookings.id} != ${excludeBookingId}`);
  }

  const conflicts = await db
    .select()
    .from(eventBookings)
    .where(and(...conditions));

  return {
    hasConflict: conflicts.length > 0,
    conflictingBookings: conflicts
  };
};

// ==================== FUNÇÕES ADICIONAIS DE VALIDAÇÃO ====================

export const validateBookingData = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string,
  expectedAttendees: number,
  eventType: string,
  cateringRequired: boolean = false
): Promise<{
  valid: boolean;
  message?: string;
  space?: any;
}> => {
  const space = await getEventSpaceById(eventSpaceId);
  if (!space) {
    return { valid: false, message: "Espaço de evento não encontrado" };
  }

  // Verificar capacidade
  const capacityMin = toNumber(space.capacityMin);
  const capacityMax = toNumber(space.capacityMax);
  
  if (expectedAttendees < capacityMin || expectedAttendees > capacityMax) {
    return { 
      valid: false, 
      message: `Número de participantes deve estar entre ${capacityMin} e ${capacityMax}` 
    };
  }

  // Validar tipo de evento
  if (space.allowedEventTypes && space.allowedEventTypes.length > 0) {
    if (!space.allowedEventTypes.includes(eventType)) {
      return { 
        valid: false, 
        message: `Tipo de evento "${eventType}" não permitido neste espaço. Tipos permitidos: ${space.allowedEventTypes.join(', ')}` 
      };
    }
  }

  // Validar catering
  if (cateringRequired && !space.offersCatering) {
    return { 
      valid: false, 
      message: "Este espaço não oferece serviço de catering" 
    };
  }

  return { valid: true, space };
};

// ==================== EXPORTAÇÃO ====================

export default {
  createEventBooking,
  confirmEventBooking,
  cancelEventBooking,
  rejectEventBooking,
  updateEventBookingDates,
  getEventBookingById,
  getEventBookingsByHotel,
  getEventBookingsByOrganizerEmail,
  getEventBookingsBySpace,
  updateEventBookingPaymentStatus,
  updateEventBooking,
  getEventBookingWithDetails,
  getEventBookingLogs,
  calculateEventDeposit,
  getPendingApprovalBookings,
  getUpcomingEventBookings,
  checkBookingConflicts,
  validateBookingStatus,
  validateBookingData,
};