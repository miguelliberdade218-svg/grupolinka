// src/modules/events/eventBookingService.ts - VERSÃO FINAL COMPLETA CORRIGIDA (11/01/2026)
// Inclui função rejectEventBooking para status "rejected"
// Alinhado com tabela real: performedBy em vez de userId

import { db } from "../../../db";
import {
  eventBookings,
  eventBookingLogs,
  eventSpaces,
  eventAvailability,
  hotels,
} from "../../../shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { isEventSpaceAvailable } from "./eventSpaceService";
import type { TimeSlot } from "./eventSpaceService";

// ==================== TIPOS ====================
export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;

// ==================== CONSTANTES ====================
const VALID_BOOKING_STATUSES = [
  'pending_approval',
  'confirmed',
  'in_progress',
  'completed',
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

// ✅ HELPER PARA LOGS - Evita problemas com colunas (usa performedBy corretamente)
const createSafeLogEntry = (
  bookingId: string,
  action: string,
  details: any,
  performedBy?: string
) => {
  // Coloca performedBy dentro de details se existir
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

const checkForTimeSlotConflicts = async (
  eventSpaceId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<boolean> => {
  try {
    const [availability] = await db
      .select({ slots: eventAvailability.slots })
      .from(eventAvailability)
      .where(and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, date)
      ))
      .limit(1);

    if (!availability?.slots || !Array.isArray(availability.slots)) return false;

    const slots = availability.slots as TimeSlot[];
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    for (const slot of slots) {
      if (excludeBookingId && slot.bookingId === excludeBookingId) continue;

      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);

      const hasOverlap = 
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd);

      if (hasOverlap) return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar conflitos:', error);
    return true;
  }
};

const createTimeSlot = (
  startTime: string,
  endTime: string,
  bookingId: string
): TimeSlot => ({
  startTime,
  endTime,
  bookingId,
  status: 'pending_approval',
});

const validateBookingStatus = (status: string): BookingStatus => {
  if (VALID_BOOKING_STATUSES.includes(status as BookingStatus)) {
    return status as BookingStatus;
  }
  throw new Error(`Status inválido: ${status}. Status permitidos: ${VALID_BOOKING_STATUSES.join(', ')}`);
};

// ==================== CRIAÇÃO DE RESERVA ====================

export const createEventBooking = async (
  data: {
    eventSpaceId: string;
    hotelId: string;
    organizerName: string;
    organizerEmail: string;
    organizerPhone?: string;
    eventTitle: string;
    eventDescription?: string;
    eventType: string;
    startDatetime: string;
    endDatetime: string;
    expectedAttendees: number;
    specialRequests?: string;
    additionalServices?: any;
  },
  performedByUserId?: string  // ✅ Renomeado para refletir a coluna real
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
        startDatetime,
        endDatetime,
        expectedAttendees,
        specialRequests,
        additionalServices,
      } = data;

      console.log('📝 Criando reserva com dados:', { 
        eventSpaceId, 
        hotelId, 
        organizerName, 
        organizerEmail,
        eventTitle,
        eventType,
        startDatetime,
        endDatetime
      });

      // 1. Validações básicas
      const [space] = await tx
        .select()
        .from(eventSpaces)
        .where(and(eq(eventSpaces.id, eventSpaceId), eq(eventSpaces.hotelId, hotelId)));

      if (!space || !space.isActive) {
        throw new Error("Espaço de evento inválido ou inativo");
      }

      const capacityMin = toNumber(space.capacityMin);
      const capacityMax = toNumber(space.capacityMax);

      if (expectedAttendees < capacityMin || expectedAttendees > capacityMax) {
        throw new Error(`Número de participantes deve estar entre ${capacityMin} e ${capacityMax}`);
      }

      // 2. Verifica disponibilidade
      const startDateObj = new Date(startDatetime);
      const endDateObj = new Date(endDatetime);
      const date = startDatetime.split("T")[0];
      const dateObj = new Date(date);
      const startTime = startDateObj.toTimeString().split(' ')[0].substring(0, 5);
      const endTime = endDateObj.toTimeString().split(' ')[0].substring(0, 5);

      const { available, message } = await isEventSpaceAvailable(
        eventSpaceId,
        date,
        startTime,
        endTime
      );

      if (!available) {
        throw new Error(`Espaço indisponível: ${message}`);
      }

      // 3. Verificar conflitos
      const hasConflicts = await checkForTimeSlotConflicts(eventSpaceId, dateObj, startTime, endTime);
      
      if (hasConflicts) {
        throw new Error(`O horário ${startTime} - ${endTime} já está reservado para esta data`);
      }

      // 4. Calcula preço
      const durationHours = (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60);
      const basePriceNum = toNumber(space.basePriceHourly || "0");
      
      let basePrice = basePriceNum * durationHours;
      let weekendSurcharge = 0;
      const isWeekend = startDateObj.getDay() === 0 || startDateObj.getDay() === 6;

      if (isWeekend && space.weekendSurchargePercent) {
        const weekendPercent = toNumber(space.weekendSurchargePercent);
        weekendSurcharge = basePrice * (weekendPercent / 100);
      }

      let equipmentFees = 0;
      let serviceFees = 0;
      if (additionalServices && typeof additionalServices === 'object') {
        equipmentFees = toNumber(additionalServices.equipment || 0);
        serviceFees = toNumber(additionalServices.catering || additionalServices.other || 0);
      }

      const totalPrice = basePrice + weekendSurcharge + equipmentFees + serviceFees;

      const bookingStatus: BookingStatus = 'pending_approval';
      const paymentStatus = 'pending';

      console.log('📊 Calculando preços:', {
        basePrice,
        weekendSurcharge,
        equipmentFees,
        serviceFees,
        totalPrice,
        bookingStatus
      });

      const bookingData: EventBookingInsert = {
        eventSpaceId,
        hotelId,
        organizerName,
        organizerEmail,
        organizerPhone: organizerPhone || null,
        eventTitle,
        eventDescription: eventDescription || null,
        eventType,
        startDatetime: startDateObj,
        endDatetime: endDateObj,
        durationHours: toRequiredString(durationHours),
        expectedAttendees,
        specialRequests: specialRequests || null,
        additionalServices: additionalServices || {},
        basePrice: toRequiredString(basePrice),
        totalPrice: toRequiredString(totalPrice),
        equipmentFees: toNullableString(equipmentFees),
        serviceFees: toNullableString(serviceFees),
        weekendSurcharge: toNullableString(weekendSurcharge),
        status: bookingStatus,
        paymentStatus: paymentStatus,
      };

      console.log('📤 Inserindo booking com status:', bookingStatus);

      const [booking] = await tx.insert(eventBookings).values(bookingData).returning();

      console.log('✅ Booking criado com ID:', booking.id, 'Status:', booking.status);

      // 5. Bloqueia disponibilidade
      const [currentAvailability] = await tx
        .select()
        .from(eventAvailability)
        .where(and(
          eq(eventAvailability.eventSpaceId, eventSpaceId),
          eq(eventAvailability.date, dateObj)
        ))
        .limit(1);

      const newSlot = createTimeSlot(startTime, endTime, booking.id);

      if (currentAvailability) {
        const currentSlots = (currentAvailability.slots as TimeSlot[]) || [];
        const slotExists = currentSlots.some(slot => 
          slot.startTime === startTime && slot.endTime === endTime && slot.bookingId === booking.id
        );
        
        if (!slotExists) {
          const updatedSlots = [...currentSlots, newSlot];
          
          await tx
            .update(eventAvailability)
            .set({
              slots: updatedSlots,
              updatedAt: new Date()
            })
            .where(and(
              eq(eventAvailability.eventSpaceId, eventSpaceId),
              eq(eventAvailability.date, dateObj)
            ));
        }
      } else {
        await tx.insert(eventAvailability).values({
          eventSpaceId,
          date: dateObj,
          slots: [newSlot],
          isAvailable: true,
          stopSell: false,
          minBookingHours: 4
        });
      }

      // 6. Log - ✅ Usa helper com performedBy correto
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          booking.id,
          "booking_created",
          {
            durationHours,
            attendees: expectedAttendees,
            totalPrice,
            status: bookingStatus
          },
          performedByUserId  // Agora passa como performedBy
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
      // Atualizar status do slot
      const startDate = new Date(updated.startDatetime);
      const date = startDate.toISOString().split("T")[0];
      const dateObj = new Date(date);
      const startTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
      const endTime = new Date(updated.endDatetime).toTimeString().split(' ')[0].substring(0, 5);

      const [currentAvailability] = await db
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, updated.eventSpaceId),
            eq(eventAvailability.date, dateObj)
          )
        )
        .limit(1);

      if (currentAvailability?.slots && Array.isArray(currentAvailability.slots)) {
        const currentSlots = currentAvailability.slots as TimeSlot[];
        const updatedSlots = currentSlots.map(slot => {
          if (slot.bookingId === bookingId || 
              (slot.startTime === startTime && slot.endTime === endTime)) {
            return { ...slot, status: 'confirmed' as const };
          }
          return slot;
        });

        await db
          .update(eventAvailability)
          .set({
            slots: updatedSlots,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(eventAvailability.eventSpaceId, updated.eventSpaceId),
              eq(eventAvailability.date, dateObj)
            )
          );
      }

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

      // Libera disponibilidade
      const startDate = new Date(booking.startDatetime);
      const date = startDate.toISOString().split("T")[0];
      const dateObj = new Date(date);
      const startTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
      const endTime = new Date(booking.endDatetime).toTimeString().split(' ')[0].substring(0, 5);

      const [currentAvailability] = await tx
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
            eq(eventAvailability.date, dateObj)
          )
        )
        .limit(1);

      if (currentAvailability?.slots && Array.isArray(currentAvailability.slots)) {
        const currentSlots = currentAvailability.slots as TimeSlot[];
        
        const updatedSlots = currentSlots.filter(slot => {
          if (slot.bookingId === bookingId) return false;
          if (slot.startTime === startTime && slot.endTime === endTime) return false;
          return true;
        });

        await tx
          .update(eventAvailability)
          .set({
            slots: updatedSlots,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
              eq(eventAvailability.date, dateObj)
            )
          );
      }

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

      // Libera slot (igual ao cancel)
      const startDate = new Date(booking.startDatetime);
      const date = startDate.toISOString().split("T")[0];
      const dateObj = new Date(date);
      const startTime = startDate.toTimeString().split(' ')[0].substring(0, 5);
      const endTime = new Date(booking.endDatetime).toTimeString().split(' ')[0].substring(0, 5);

      const [currentAvailability] = await tx
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
            eq(eventAvailability.date, dateObj)
          )
        )
        .limit(1);

      if (currentAvailability?.slots && Array.isArray(currentAvailability.slots)) {
        const currentSlots = currentAvailability.slots as any[];
        const updatedSlots = currentSlots.filter(slot => 
          slot.bookingId !== bookingId
        );

        await tx
          .update(eventAvailability)
          .set({
            slots: updatedSlots,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
              eq(eventAvailability.date, dateObj)
            )
          );
      }

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

// ==================== ATUALIZAÇÃO DE HORÁRIO ====================

export const updateEventBookingTime = async (
  bookingId: string,
  newStartDatetime: string,
  newEndDatetime: string,
  updatedBy?: string
): Promise<EventBooking | null> => {
  return await db.transaction(async (tx) => {
    try {
      const booking = await getEventBookingById(bookingId);
      if (!booking) throw new Error("Reserva não encontrada");

      const newStartDate = new Date(newStartDatetime);
      const newEndDate = new Date(newEndDatetime);
      const newDate = newStartDatetime.split("T")[0];
      const newDateObj = new Date(newDate);
      const newStartTime = newStartDate.toTimeString().split(' ')[0].substring(0, 5);
      const newEndTime = newEndDate.toTimeString().split(' ')[0].substring(0, 5);

      const hasConflicts = await checkForTimeSlotConflicts(
        booking.eventSpaceId,
        newDateObj,
        newStartTime,
        newEndTime,
        bookingId
      );

      if (hasConflicts) {
        throw new Error(`Novo horário ${newStartTime}-${newEndTime} já está reservado`);
      }

      // Liberar slot antigo
      const oldStartDate = new Date(booking.startDatetime);
      const oldDate = oldStartDate.toISOString().split("T")[0];
      const oldDateObj = new Date(oldDate);
      const oldStartTime = oldStartDate.toTimeString().split(' ')[0].substring(0, 5);
      const oldEndTime = new Date(booking.endDatetime).toTimeString().split(' ')[0].substring(0, 5);

      if (oldDate !== newDate || oldStartTime !== newStartTime) {
        const [oldAvailability] = await tx
          .select()
          .from(eventAvailability)
          .where(
            and(
              eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
              eq(eventAvailability.date, oldDateObj)
            )
          )
          .limit(1);

        if (oldAvailability?.slots && Array.isArray(oldAvailability.slots)) {
          const oldSlots = oldAvailability.slots as TimeSlot[];
          const updatedOldSlots = oldSlots.filter(slot => 
            !(slot.bookingId === bookingId || 
              (slot.startTime === oldStartTime && slot.endTime === oldEndTime))
          );

          await tx
            .update(eventAvailability)
            .set({
              slots: updatedOldSlots,
              updatedAt: new Date()
            })
            .where(
              and(
                eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
                eq(eventAvailability.date, oldDateObj)
              )
            );
        }
      }

      // Criar novo slot
      const newSlot = createTimeSlot(newStartTime, newEndTime, bookingId);
      
      const [newAvailability] = await tx
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
            eq(eventAvailability.date, newDateObj)
          )
        )
        .limit(1);

      if (newAvailability) {
        const currentSlots = (newAvailability.slots as TimeSlot[]) || [];
        const updatedSlots = [...currentSlots, newSlot];
        
        await tx
          .update(eventAvailability)
          .set({
            slots: updatedSlots,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(eventAvailability.eventSpaceId, booking.eventSpaceId),
              eq(eventAvailability.date, newDateObj)
            )
          );
      } else {
        await tx.insert(eventAvailability).values({
          eventSpaceId: booking.eventSpaceId,
          date: newDateObj,
          slots: [newSlot],
          isAvailable: true,
          stopSell: false,
          minBookingHours: 4
        });
      }

      // Atualizar booking
      const durationHours = (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60);
      const [updated] = await tx
        .update(eventBookings)
        .set({
          startDatetime: newStartDate,
          endDatetime: newEndDate,
          durationHours: toRequiredString(durationHours),
          updatedAt: new Date()
        })
        .where(eq(eventBookings.id, bookingId))
        .returning();

      // Log
      await tx.insert(eventBookingLogs).values(
        createSafeLogEntry(
          bookingId,
          "booking_time_updated",
          {
            oldTime: { start: booking.startDatetime, end: booking.endDatetime },
            newTime: { start: newStartDatetime, end: newEndDatetime },
            timestamp: new Date().toISOString(),
            updatedBy
          },
          updatedBy
        )
      );

      return updated || null;
    } catch (error) {
      console.error('Erro ao atualizar horário da reserva:', error);
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
    .orderBy(desc(eventBookings.startDatetime));
};

export const getEventBookingsByOrganizerEmail = async (email: string): Promise<EventBooking[]> => {
  return await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.organizerEmail, email))
    .orderBy(desc(eventBookings.startDatetime));
};

export const getEventBookingsBySpace = async (
  eventSpaceId: string
): Promise<EventBooking[]> => {
  return await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.eventSpaceId, eventSpaceId))
    .orderBy(desc(eventBookings.startDatetime));
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
      
      if (updateData.basePrice !== undefined) {
        updateData.basePrice = toRequiredString(updateData.basePrice as number | string);
      }
      if (updateData.totalPrice !== undefined) {
        updateData.totalPrice = toRequiredString(updateData.totalPrice as number | string);
      }
      if (updateData.durationHours !== undefined) {
        updateData.durationHours = toRequiredString(updateData.durationHours as number | string);
      }
      if (updateData.equipmentFees !== undefined) {
        updateData.equipmentFees = toNullableString(updateData.equipmentFees);
      }
      if (updateData.serviceFees !== undefined) {
        updateData.serviceFees = toNullableString(updateData.serviceFees);
      }
      if (updateData.weekendSurcharge !== undefined) {
        updateData.weekendSurcharge = toNullableString(updateData.weekendSurcharge);
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
        sql`${eventBookings.startDatetime}::date >= ${today}::date`,
        sql`${eventBookings.startDatetime}::date <= ${futureStr}::date`,
        inArray(eventBookings.status, ["pending_approval", "confirmed"])
      )
    )
    .orderBy(eventBookings.startDatetime);
};

// ==================== EXPORTAÇÃO ====================

export default {
  createEventBooking,
  confirmEventBooking,
  cancelEventBooking,
  rejectEventBooking,  // ✅ NOVA FUNÇÃO ADICIONADA
  updateEventBookingTime,
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
  checkForTimeSlotConflicts,
  createTimeSlot,
  validateBookingStatus,
};