// src/modules/events/eventBookingService.ts - VERSÃO FINAL CORRIGIDA
// ✅ CORREÇÃO CRÍTICA 1: Validação de tipos de evento usa dados do banco!
// ✅ CORREÇÃO CRÍTICA 2: ALLOWED_EVENT_TYPES inclui TODOS os tipos do frontend!
// ✅ CORREÇÃO: Removido campo cateringPrice (não existe no schema)
// ✅ CORREÇÃO: Catering NÃO afeta o preço (apenas indicação)
// ✅ CORREÇÃO: Cálculo de dias IGUAL aos hotéis (check-out NÃO conta)

import { db } from "../../../db";
import {
  eventBookings,
  eventBookingLogs,
  eventSpaces,
  hotels,
} from "../../../shared/schema";
import { eq, and, sql, desc, inArray, or } from "drizzle-orm";
import { isEventSpaceAvailable, getEventSpaceById } from "./eventSpaceService";

// ==================== TIPOS ====================
export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;

export type CreateEventBookingInput = {
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string;  // YYYY-MM-DD (check-in)
  endDate: string;    // YYYY-MM-DD (check-out)
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: any;
  cateringRequired?: boolean;
  userId?: string;
};

// ==================== CONSTANTES ====================
const VALID_BOOKING_STATUSES = [
  'pending_approval',
  'confirmed',
  'cancelled',
  'rejected'
] as const;

type BookingStatus = typeof VALID_BOOKING_STATUSES[number];

// ✅ CORREÇÃO CRÍTICA: Array COMPLETO com todos os tipos do frontend!
export const ALLOWED_EVENT_TYPES = [
  'Casamento',
  'Conferência',
  'Cerimônia',
  'Lançamento',
  'Festa Corporativa',  // ✅ ADICIONADO!
  'Festa',
  'Workshop',
  'Reunião',
  'Formação/Treinamento',
  'Evento Corporativo',
  'Seminário',
  'Exposição',
  'Concerto',
  'Networking',
  'Team Building',
  'Aniversário',
  'Show',              // ✅ ADICIONADO!
  'Outro'              // ✅ ADICIONADO!
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

// ✅ CORREÇÃO CRÍTICA: Calcular dias de estadia (check-out NÃO conta)
const calculateNights = (checkInDate: string, checkOutDate: string): number => {
  const checkIn = new Date(checkInDate + 'T00:00:00');
  const checkOut = new Date(checkOutDate + 'T00:00:00');
  
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);
  
  // ⚠️ HOTEL LOGIC: check-out NÃO conta como noite
  // Exemplo: 21 a 22 = 1 noite, 21 a 23 = 2 noites
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// ✅ Contar fins de semana APENAS nos dias de estadia
const countWeekendDays = (checkInDate: string, checkOutDate: string): number => {
  const checkIn = new Date(checkInDate + 'T00:00:00');
  const checkOut = new Date(checkOutDate + 'T00:00:00');
  
  checkIn.setHours(0, 0, 0, 0);
  checkOut.setHours(0, 0, 0, 0);
  
  let weekendCount = 0;
  const currentDate = new Date(checkIn);
  
  // ⚠️ Só contar os dias de estadia (check-out NÃO conta)
  const lastNight = new Date(checkOut);
  lastNight.setDate(lastNight.getDate() - 1);
  
  while (currentDate <= lastNight) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weekendCount;
};

// ==================== FUNÇÃO DE VALIDAÇÃO DE TIPO DE EVENTO ====================
// ✅ CORREÇÃO CRÍTICA: Esta função BUSCA DO BANCO os tipos permitidos!
async function validateEventType(eventSpaceId: string, eventType: string): Promise<void> {
  // Buscar o espaço com os tipos permitidos
  const space = await db
    .select({
      allowedEventTypes: eventSpaces.allowedEventTypes
    })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  if (!space || space.length === 0) {
    throw new Error('Espaço não encontrado');
  }

  const allowedTypes = space[0].allowedEventTypes || [];

  // 1. Primeiro valida se o tipo é válido globalmente
  if (!ALLOWED_EVENT_TYPES.includes(eventType as any)) {
    throw new Error(`Tipo de evento "${eventType}" não é um tipo válido. Tipos permitidos: ${ALLOWED_EVENT_TYPES.join(', ')}`);
  }

  // 2. Depois valida as restrições específicas do espaço
  // Se não há restrições, qualquer tipo globalmente válido é permitido
  if (allowedTypes.length === 0) {
    return;
  }

  // Validar se o tipo é permitido neste espaço específico
  if (!allowedTypes.includes(eventType)) {
    throw new Error(
      `Tipo de evento "${eventType}" não permitido neste espaço. ` +
      `Tipos permitidos: ${allowedTypes.join(', ')}`
    );
  }
}

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
      } = data;

      console.log('📝 Criando reserva (sistema diárias):', { 
        eventSpaceId, 
        hotelId, 
        organizerName, 
        organizerEmail,
        eventTitle,
        eventType,
        checkIn: startDate,
        checkOut: endDate,
        cateringRequired
      });

      // 1. Validações básicas
      const space = await getEventSpaceById(eventSpaceId);
      if (!space || space.hotelId !== hotelId || !space.isActive) {
        throw new Error("Espaço de evento inválido ou inativo");
      }

      // ✅ Validar catering (apenas se o espaço oferece)
      if (cateringRequired && !space.offersCatering) {
        throw new Error("Este espaço não oferece serviço de catering");
      }

      // 2. Verificar capacidade
      const capacityMin = toNumber(space.capacityMin);
      const capacityMax = toNumber(space.capacityMax);

      if (expectedAttendees < capacityMin || expectedAttendees > capacityMax) {
        throw new Error(`Número de participantes deve estar entre ${capacityMin} e ${capacityMax}`);
      }

      // 3. ✅ CORREÇÃO CRÍTICA: Validar tipo de evento usando dados do banco!
      await validateEventType(eventSpaceId, eventType);

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

      // ✅ Calcular número de noites (check-out NÃO conta)
      const nights = calculateNights(startDate, endDate);

      if (nights < 1) {
        throw new Error("A estadia deve ter pelo menos 1 noite (check-out deve ser após check-in)");
      }

      // ✅ Contar fins de semana APENAS nas noites de estadia
      const weekendNights = countWeekendDays(startDate, endDate);

      // ✅ Calcular preço - SEM incluir catering!
      const spaceBasePrice = toNumber(space.basePricePerDay || space.pricePerDay);
      
      if (spaceBasePrice <= 0) {
        throw new Error("Preço do espaço não configurado");
      }

      // Subtotal = preço base × número de noites
      const subtotal = spaceBasePrice * nights;
      
      // Adicional de fim de semana = preço base × % surcharge × noites de fim de semana
      let weekendSurcharge = 0;
      if (space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && weekendNights > 0) {
        weekendSurcharge = spaceBasePrice * (space.weekendSurchargePercent / 100) * weekendNights;
      }
      
      // ✅ PREÇO TOTAL = subtotal + surcharge (catering NÃO entra no cálculo!)
      const totalPrice = subtotal + weekendSurcharge;

      console.log('💰 Cálculo de preço:', {
        basePricePerNight: spaceBasePrice,
        nights,
        subtotal,
        weekendNights,
        surchargePercent: space.weekendSurchargePercent,
        weekendSurcharge,
        totalPrice,
        cateringRequired: cateringRequired ? 'Sim (apenas indicação)' : 'Não'
      });

      // ✅ Garantir campos obrigatórios para o check constraint
      const depositAmount = toNumber(space.securityDeposit);
      const depositPaid = 0;
      const balanceDue = totalPrice - depositPaid;

      // 8. Preparar dados da reserva - SEM cateringPrice!
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
        durationDays: nights, // ✅ Número correto de noites
        expectedAttendees,
        specialRequests: specialRequests || null,
        additionalServices: additionalServices || {},
        cateringRequired, // ✅ APENAS flag, não afeta preço
        basePrice: subtotal.toFixed(2),
        weekendSurcharge: weekendSurcharge.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        securityDeposit: depositAmount.toFixed(2),
        depositPaid: depositPaid.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status: 'pending_approval',
        paymentStatus: 'pending',
        userId: userId || null,
      };

      console.log('📤 Inserindo booking (diárias):', { 
        checkIn: startDate, 
        checkOut: endDate, 
        nights,
        weekendNights,
        status: 'pending_approval',
        paymentStatus: 'pending',
        subtotal: subtotal.toFixed(2),
        weekendSurcharge: weekendSurcharge.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
        depositPaid: depositPaid.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
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
            nights,
            weekendNights,
            attendees: expectedAttendees,
            subtotal: subtotal.toFixed(2),
            weekendSurcharge: weekendSurcharge.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            depositPaid: depositPaid.toFixed(2),
            balanceDue: balanceDue.toFixed(2),
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

      // Validar novas datas com cálculo correto de noites
      const newNights = calculateNights(newStartDate, newEndDate);

      if (newNights < 1) {
        throw new Error("A estadia deve ter pelo menos 1 noite");
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

      // Buscar espaço para recalcular preço
      const space = await getEventSpaceById(booking.eventSpaceId);
      if (!space) throw new Error("Espaço não encontrado");

      const spaceBasePrice = toNumber(space.basePricePerDay || space.pricePerDay);
      const weekendNights = countWeekendDays(newStartDate, newEndDate);

      // Recalcular preços - SEM catering
      const subtotal = spaceBasePrice * newNights;
      
      let weekendSurcharge = 0;
      if (space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && weekendNights > 0) {
        weekendSurcharge = spaceBasePrice * (space.weekendSurchargePercent / 100) * weekendNights;
      }
      
      const newTotalPrice = subtotal + weekendSurcharge;
      const depositPaid = toNumber(booking.depositPaid);
      const newBalanceDue = newTotalPrice - depositPaid;

      // Atualizar booking - SEM cateringPrice
      const [updated] = await tx
        .update(eventBookings)
        .set({
          startDate: newStartDate,
          endDate: newEndDate,
          durationDays: newNights,
          basePrice: subtotal.toFixed(2),
          weekendSurcharge: weekendSurcharge.toFixed(2),
          totalPrice: newTotalPrice.toFixed(2),
          balanceDue: newBalanceDue.toFixed(2),
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
            oldDates: { 
              checkIn: booking.startDate, 
              checkOut: booking.endDate,
              nights: booking.durationDays 
            },
            newDates: { 
              checkIn: newStartDate, 
              checkOut: newEndDate,
              nights: newNights,
              weekendNights
            },
            newTotalPrice: newTotalPrice.toFixed(2),
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
      const booking = await getEventBookingById(bookingId);
      if (!booking) throw new Error("Reserva não encontrada");

      const updateData: any = {
        paymentStatus,
        updatedAt: new Date()
      };

      if (paymentReference) {
        updateData.paymentReference = paymentReference;
      }

      if (paymentStatus === 'paid') {
        const totalPrice = toNumber(booking.totalPrice);
        updateData.depositPaid = totalPrice.toFixed(2);
        updateData.balanceDue = '0.00';
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
              fromStatus: booking.paymentStatus,
              toStatus: paymentStatus,
              paymentReference,
              depositPaid: updateData.depositPaid,
              balanceDue: updateData.balanceDue,
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
      
      // Converter campos de preço - SEM cateringPrice
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = toRequiredString(updateData.basePrice as number | string);
      }
      if (updateData.weekendSurcharge !== undefined) {
        updateData.weekendSurcharge = toNullableString(updateData.weekendSurcharge);
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

  // ✅ CORREÇÃO CRÍTICA: Usar a mesma validação de tipo de evento
  try {
    await validateEventType(eventSpaceId, eventType);
  } catch (error: any) {
    return { valid: false, message: error.message };
  }

  // Validar catering
  if (cateringRequired && !space.offersCatering) {
    return { 
      valid: false, 
      message: "Este espaço não oferece serviço de catering" 
    };
  }

  // Validar número de noites
  const nights = calculateNights(startDate, endDate);
  if (nights < 1) {
    return { 
      valid: false, 
      message: "A estadia deve ter pelo menos 1 noite" 
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
  calculateNights,
  countWeekendDays,
  validateEventType,
  ALLOWED_EVENT_TYPES,
};