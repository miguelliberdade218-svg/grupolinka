// src/modules/events/eventSpaceService.ts - VERSÃO FINAL COM DISPONIBILIDADE ETERNA/IMPLÍCITA

import { db } from "../../../db";
import {
  eventSpaces,
  eventAvailability,
  hotels,
} from "../../../shared/schema";
import {
  eq,
  and,
  gte,
  lte,
  sql,
  asc,
  desc,
  inArray,
  ne,
} from "drizzle-orm";

// ==================== TIPOS ====================
export type EventSpace = typeof eventSpaces.$inferSelect;
export type EventSpaceInsert = typeof eventSpaces.$inferInsert;
export type EventSpaceUpdate = Partial<EventSpaceInsert>;

export type EventAvailability = typeof eventAvailability.$inferSelect;

export interface TimeSlot {
  startTime: string;
  endTime: string;
  bookingId?: string;
  status?: string;
}

// ==================== FUNÇÕES HELPER ====================
const toDecimalString = (num: number | string | null | undefined): string | null => {
  if (num === null || num === undefined) return null;
  if (typeof num === 'string') return num;
  return num.toString();
};

const toNumber = (str: string | number | null | undefined): number => {
  if (str === null || str === undefined) return 0;
  if (typeof str === 'number') return str;
  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

const toSlotsJson = (slots: TimeSlot[] | null | undefined): any => {
  if (!slots || slots.length === 0) return [];
  return slots;
};

// ==================== CRUD DE ESPAÇOS ====================

export const getEventSpacesByHotel = async (
  hotelId: string,
  includeInactive = false
): Promise<EventSpace[]> => {
  const conditions = [eq(eventSpaces.hotelId, hotelId)];
  if (!includeInactive) {
    conditions.push(eq(eventSpaces.isActive, true));
  }

  return await db
    .select()
    .from(eventSpaces)
    .where(and(...conditions))
    .orderBy(asc(eventSpaces.name));
};

export const getEventSpaceById = async (id: string): Promise<EventSpace | null> => {
  const [space] = await db.select().from(eventSpaces).where(eq(eventSpaces.id, id));
  return space || null;
};

export const createEventSpace = async (data: EventSpaceInsert): Promise<EventSpace> => {
  const processedData = {
    ...data,
    basePriceHourly: data.basePriceHourly ? toDecimalString(data.basePriceHourly as number | string) : null,
    pricePerHour: data.pricePerHour ? toDecimalString(data.pricePerHour as number | string) : null,
    basePriceHalfDay: data.basePriceHalfDay ? toDecimalString(data.basePriceHalfDay as number | string) : null,
    basePriceFullDay: data.basePriceFullDay ? toDecimalString(data.basePriceFullDay as number | string) : null,
  };
  
  const [space] = await db.insert(eventSpaces).values(processedData).returning();
  return space;
};

export const updateEventSpace = async (
  id: string,
  data: EventSpaceUpdate
): Promise<EventSpace | null> => {
  const processedData: any = { ...data };
  
  if (data.basePriceHourly !== undefined) {
    processedData.basePriceHourly = toDecimalString(data.basePriceHourly as number | string);
  }
  if (data.pricePerHour !== undefined) {
    processedData.pricePerHour = data.pricePerHour ? toDecimalString(data.pricePerHour as number | string) : null;
  }
  if (data.basePriceHalfDay !== undefined) {
    processedData.basePriceHalfDay = data.basePriceHalfDay ? toDecimalString(data.basePriceHalfDay as number | string) : null;
  }
  if (data.basePriceFullDay !== undefined) {
    processedData.basePriceFullDay = data.basePriceFullDay ? toDecimalString(data.basePriceFullDay as number | string) : null;
  }
  
  const [space] = await db
    .update(eventSpaces)
    .set(processedData)
    .where(eq(eventSpaces.id, id))
    .returning();
  return space || null;
};

export const deactivateEventSpace = async (id: string): Promise<EventSpace | null> => {
  return await updateEventSpace(id, { isActive: false });
};

// ==================== DISPONIBILIDADE ====================

export const getEventSpaceCalendar = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<EventAvailability[]> => {
  return await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        sql`${eventAvailability.date}::date >= ${startDate}::date`,
        sql`${eventAvailability.date}::date <= ${endDate}::date`
      )
    )
    .orderBy(asc(eventAvailability.date));
};

export const isEventSpaceAvailable = async (
  eventSpaceId: string,
  date: string,
  startTime?: string,
  endTime?: string
): Promise<{ available: boolean; message?: string; availability?: EventAvailability }> => {
  const dateObj = new Date(date);
  
  const [availability] = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, dateObj)
      )
    )
    .limit(1);

  // NOVA LÓGICA: DISPONIBILIDADE ETERNA / IMPLÍCITA
  if (!availability) {
    return {
      available: true,
      message: 'Data disponível por padrão (sem restrições ou reservas registadas)'
    };
  }

  if (!availability.isAvailable || availability.stopSell) {
    return {
      available: false,
      availability,
      message: availability.stopSell ? 'Venda bloqueada para esta data' : 'Espaço não disponível'
    };
  }

  if (startTime && endTime && availability.slots) {
    try {
      const slots = availability.slots as TimeSlot[];
      const hasConflict = slots.some(slot => {
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;
        
        return (
          (startTime >= slotStart && startTime < slotEnd) ||
          (endTime > slotStart && endTime <= slotEnd) ||
          (startTime <= slotStart && endTime >= slotEnd)
        );
      });

      if (hasConflict) {
        return {
          available: false,
          availability,
          message: 'Conflito de horário com reserva existente'
        };
      }
    } catch (error) {
      console.error('Erro ao analisar slots:', error);
      return {
        available: false,
        availability,
        message: 'Erro ao verificar disponibilidade de horários'
      };
    }
  }

  return {
    available: true,
    availability
  };
};

export const bulkUpdateEventAvailability = async (
  eventSpaceId: string,
  updates: {
    date: string;
    isAvailable?: boolean;
    stopSell?: boolean;
    priceOverride?: number | null;
    minBookingHours?: number;
    slots?: TimeSlot[];
  }[]
): Promise<void> => {
  if (updates.length === 0) return;

  await db.transaction(async (tx) => {
    for (const update of updates) {
      const dateObj = new Date(update.date);
      
      const values: any = {
        eventSpaceId,
        date: dateObj,
        isAvailable: update.isAvailable ?? true,
        stopSell: update.stopSell ?? false,
        priceOverride: update.priceOverride !== null && update.priceOverride !== undefined 
          ? update.priceOverride.toString()
          : null,
        minBookingHours: update.minBookingHours ?? 4,
        slots: update.slots ? toSlotsJson(update.slots) : [],
        updatedAt: new Date()
      };

      await tx
        .insert(eventAvailability)
        .values(values)
        .onConflictDoUpdate({
          target: [eventAvailability.eventSpaceId, eventAvailability.date],
          set: values
        });
    }
  });
};

export const getHotelEventSpacesSummary = async (hotelId: string) => {
  return await db
    .select({
      space: eventSpaces,
      totalDaysAvailable: sql<number>`COUNT(DISTINCT ea.date)`.as("days_available"),
    })
    .from(eventSpaces)
    .leftJoin(eventAvailability, and(
      eq(eventAvailability.eventSpaceId, eventSpaces.id),
      eq(eventAvailability.isAvailable, true)
    ))
    .where(eq(eventSpaces.hotelId, hotelId))
    .groupBy(eventSpaces.id)
    .orderBy(eventSpaces.name);
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const upsertEventAvailability = async (
  eventSpaceId: string,
  date: string,
  data: {
    isAvailable?: boolean;
    stopSell?: boolean;
    priceOverride?: number | null;
    minBookingHours?: number;
    slots?: TimeSlot[];
  }
): Promise<EventAvailability> => {
  const dateObj = new Date(date);
  
  const values = {
    eventSpaceId,
    date: dateObj,
    isAvailable: data.isAvailable ?? true,
    stopSell: data.stopSell ?? false,
    priceOverride: data.priceOverride !== null && data.priceOverride !== undefined 
      ? data.priceOverride.toString()
      : null,
    minBookingHours: data.minBookingHours ?? 4,
    slots: data.slots ? toSlotsJson(data.slots) : [],
    updatedAt: new Date()
  };

  const [availability] = await db
    .insert(eventAvailability)
    .values(values)
    .onConflictDoUpdate({
      target: [eventAvailability.eventSpaceId, eventAvailability.date],
      set: values
    })
    .returning();

  return availability;
};

export const getMultiSpaceAvailabilityForDate = async (
  eventSpaceIds: string[],
  date: string
): Promise<Record<string, EventAvailability | null>> => {
  if (eventSpaceIds.length === 0) return {};

  const dateObj = new Date(date);
  
  const availability = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        inArray(eventAvailability.eventSpaceId, eventSpaceIds),
        eq(eventAvailability.date, dateObj)
      )
    );

  const result: Record<string, EventAvailability | null> = {};
  
  eventSpaceIds.forEach(id => result[id] = null);
  
  availability.forEach(entry => {
    const spaceId = entry.eventSpaceId as string;
    result[spaceId] = entry;
  });

  return result;
};

export const updateEventSlots = async (
  eventSpaceId: string,
  date: string,
  slots: TimeSlot[]
): Promise<EventAvailability> => {
  const dateObj = new Date(date);
  
  const [availability] = await db
    .update(eventAvailability)
    .set({
      slots: toSlotsJson(slots),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, dateObj)
      )
    )
    .returning();

  if (!availability) {
    return await upsertEventAvailability(eventSpaceId, date, { slots });
  }

  return availability;
};

export const addTimeSlot = async (
  eventSpaceId: string,
  date: string,
  slot: TimeSlot
): Promise<EventAvailability> => {
  const dateObj = new Date(date);
  
  const [currentAvailability] = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, dateObj)
      )
    )
    .limit(1);

  let slots: TimeSlot[] = [];
  
  if (currentAvailability?.slots) {
    slots = currentAvailability.slots as TimeSlot[];
    
    const exists = slots.some(s => 
      s.startTime === slot.startTime && s.endTime === slot.endTime
    );
    
    if (exists) {
      throw new Error('Este horário já está reservado');
    }
  }
  
  slots.push(slot);
  
  return await updateEventSlots(eventSpaceId, date, slots);
};

export const removeTimeSlot = async (
  eventSpaceId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<EventAvailability> => {
  const dateObj = new Date(date);
  
  const [currentAvailability] = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, dateObj)
      )
    )
    .limit(1);

  if (!currentAvailability?.slots) {
    throw new Error('Nenhum slot encontrado para remover');
  }

  const slots = currentAvailability.slots as TimeSlot[];
  const filteredSlots = slots.filter(s => 
    !(s.startTime === startTime && s.endTime === endTime)
  );

  if (filteredSlots.length === slots.length) {
    throw new Error('Slot não encontrado para remoção');
  }

  return await updateEventSlots(eventSpaceId, date, filteredSlots);
};

export const getEventSpaceAvailabilityStats = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
) => {
  const stats = await db
    .select({
      totalDays: sql<number>`COUNT(DISTINCT date)`,
      availableDays: sql<number>`COUNT(DISTINCT date) FILTER (WHERE "isAvailable" = true AND "stopSell" = false)`,
      bookedDays: sql<number>`COUNT(DISTINCT date) FILTER (WHERE "stopSell" = true OR (slots IS NOT NULL AND jsonb_array_length(slots) > 0))`,
      averagePrice: sql<number>`COALESCE(AVG("priceOverride"), 0)`,
    })
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        sql`${eventAvailability.date}::date >= ${startDate}::date`,
        sql`${eventAvailability.date}::date <= ${endDate}::date`
      )
    );

  return stats[0] || {
    totalDays: 0,
    availableDays: 0,
    bookedDays: 0,
    averagePrice: 0
  };
};

export const hasActiveEventBookingsForSpace = async (eventSpaceId: string): Promise<boolean> => {
  const availabilityWithSlots = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        sql`slots IS NOT NULL`,
        sql`jsonb_array_length(slots) > 0`
      )
    )
    .limit(1);

  return availabilityWithSlots.length > 0;
};

export const syncAvailabilityWithSpaceConfig = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const space = await getEventSpaceById(eventSpaceId);
  if (!space) {
    throw new Error('Espaço de evento não encontrado');
  }

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  const daysDiff = Math.ceil(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  let updatedCount = 0;

  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    const existing = await db
      .select()
      .from(eventAvailability)
      .where(
        and(
          eq(eventAvailability.eventSpaceId, eventSpaceId),
          eq(eventAvailability.date, currentDate)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await upsertEventAvailability(eventSpaceId, dateStr, {
        isAvailable: true,
        stopSell: false,
        minBookingHours: 4,
        slots: []
      });
      updatedCount++;
    }
  }

  return updatedCount;
};

export const exportAvailabilityCalendar = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  status: string;
  price: string;
  slots: number;
  minHours: number;
}>> => {
  const availability = await getEventSpaceCalendar(eventSpaceId, startDate, endDate);
  
  return availability.map(entry => {
    const slots = entry.slots as TimeSlot[] || [];
    const basePrice = toNumber(entry.priceOverride);
    const dateStr = entry.date.toISOString().split('T')[0];
    
    let status = 'Disponível';
    if (entry.stopSell) {
      status = 'Venda Bloqueada';
    } else if (!entry.isAvailable) {
      status = 'Não Disponível';
    } else if (slots.length > 0) {
      status = `Parcial (${slots.length} slots)`;
    }

    return {
      date: dateStr,
      status,
      price: basePrice > 0 ? `MZN ${basePrice.toFixed(2)}` : 'Preço padrão',
      slots: slots.length,
      minHours: entry.minBookingHours || 4
    };
  });
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const getEventSpacesByEventType = async (
  eventType: string,
  hotelId?: string
): Promise<EventSpace[]> => {
  const conditions: any[] = [
    eq(eventSpaces.isActive, true),
    sql`${eventType} = ANY(${eventSpaces.eventTypes})`
  ];

  if (hotelId) {
    conditions.push(eq(eventSpaces.hotelId, hotelId));
  }

  return await db
    .select()
    .from(eventSpaces)
    .where(and(...conditions))
    .orderBy(eventSpaces.name);
};

export const updateEventSpacePricing = async (
  eventSpaceId: string,
  pricing: {
    basePriceHourly?: number;
    pricePerHour?: number;
    basePriceHalfDay?: number;
    basePriceFullDay?: number;
    weekendSurchargePercent?: number;
  }
): Promise<EventSpace | null> => {
  const updateData: any = {};
  
  if (pricing.basePriceHourly !== undefined) {
    updateData.basePriceHourly = toDecimalString(pricing.basePriceHourly);
  }
  if (pricing.pricePerHour !== undefined) {
    updateData.pricePerHour = pricing.pricePerHour ? toDecimalString(pricing.pricePerHour) : null;
  }
  if (pricing.basePriceHalfDay !== undefined) {
    updateData.basePriceHalfDay = pricing.basePriceHalfDay ? toDecimalString(pricing.basePriceHalfDay) : null;
  }
  if (pricing.basePriceFullDay !== undefined) {
    updateData.basePriceFullDay = pricing.basePriceFullDay ? toDecimalString(pricing.basePriceFullDay) : null;
  }
  if (pricing.weekendSurchargePercent !== undefined) {
    updateData.weekendSurchargePercent = pricing.weekendSurchargePercent;
  }

  return await updateEventSpace(eventSpaceId, updateData);
};

export const checkEventSpaceCapacity = async (
  eventSpaceId: string,
  expectedAttendees: number
): Promise<{ valid: boolean; message: string }> => {
  const space = await getEventSpaceById(eventSpaceId);
  
  if (!space) {
    return { valid: false, message: 'Espaço não encontrado' };
  }

  if (!space.isActive) {
    return { valid: false, message: 'Espaço não está ativo' };
  }

  if (expectedAttendees < space.capacityMin) {
    return { 
      valid: false, 
      message: `Número mínimo de participantes é ${space.capacityMin}` 
    };
  }

  if (expectedAttendees > space.capacityMax) {
    return { 
      valid: false, 
      message: `Número máximo de participantes é ${space.capacityMax}` 
    };
  }

  return { valid: true, message: 'Capacidade adequada' };
};

export const bulkUpdateEventSpacesStatus = async (
  spaceIds: string[],
  isActive: boolean
): Promise<number> => {
  if (spaceIds.length === 0) return 0;

  const result = await db
    .update(eventSpaces)
    .set({ isActive, updatedAt: new Date() })
    .where(inArray(eventSpaces.id, spaceIds))
    .returning({ id: eventSpaces.id });

  return result.length;
};

export const searchEventSpacesWithFilters = async (
  filters: {
    hotelId?: string;
    isActive?: boolean;
    capacityMin?: number;
    capacityMax?: number;
    spaceType?: string;
    hasStage?: boolean;
    naturalLight?: boolean;
    includesCatering?: boolean;
    includesFurniture?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<EventSpace[]> => {
  const conditions: any[] = [];
  
  if (filters.hotelId) {
    conditions.push(eq(eventSpaces.hotelId, filters.hotelId));
  }
  
  if (filters.isActive !== undefined) {
    conditions.push(eq(eventSpaces.isActive, filters.isActive));
  }
  
  if (filters.capacityMin !== undefined) {
    conditions.push(gte(eventSpaces.capacityMin, filters.capacityMin));
  }
  
  if (filters.capacityMax !== undefined) {
    conditions.push(lte(eventSpaces.capacityMax, filters.capacityMax));
  }
  
  if (filters.spaceType) {
    conditions.push(eq(eventSpaces.spaceType, filters.spaceType));
  }
  
  if (filters.hasStage !== undefined) {
    conditions.push(eq(eventSpaces.hasStage, filters.hasStage));
  }
  
  if (filters.naturalLight !== undefined) {
    conditions.push(eq(eventSpaces.naturalLight, filters.naturalLight));
  }
  
  if (filters.includesCatering !== undefined) {
    conditions.push(eq(eventSpaces.includesCatering, filters.includesCatering));
  }
  
  if (filters.includesFurniture !== undefined) {
    conditions.push(eq(eventSpaces.includesFurniture, filters.includesFurniture));
  }
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions: any[] = [];
    
    if (filters.minPrice !== undefined) {
      priceConditions.push(gte(eventSpaces.basePriceHourly, filters.minPrice.toString()));
    }
    
    if (filters.maxPrice !== undefined) {
      priceConditions.push(lte(eventSpaces.basePriceHourly, filters.maxPrice.toString()));
    }
    
    conditions.push(and(...priceConditions));
  }
  
  return await db
    .select()
    .from(eventSpaces)
    .where(and(...conditions))
    .orderBy(asc(eventSpaces.name));
};

export const calculateEventPrice = async (
  eventSpaceId: string,
  date: string,
  durationHours: number
): Promise<number> => {
  const space = await getEventSpaceById(eventSpaceId);
  if (!space) {
    throw new Error('Espaço não encontrado');
  }
  
  const dateObj = new Date(date);
  const [availability] = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, dateObj)
      )
    )
    .limit(1);
  
  let basePrice: number;
  
  if (availability?.priceOverride) {
    basePrice = toNumber(availability.priceOverride);
  } else if (space.pricePerHour) {
    basePrice = toNumber(space.pricePerHour) * durationHours;
  } else if (space.basePriceHourly) {
    basePrice = toNumber(space.basePriceHourly) * durationHours;
  } else {
    basePrice = 0;
  }
  
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  if (isWeekend && space.weekendSurchargePercent) {
    const surchargePercent = toNumber(space.weekendSurchargePercent);
    basePrice += basePrice * (surchargePercent / 100);
  }
  
  return Math.round(basePrice);
};

export const getEventSpacesWithStats = async (
  hotelId: string
): Promise<Array<EventSpace & {
  totalBookings: number;
  totalRevenue: number;
  lastBookingDate: string | null;
}>> => {
  const spaces = await getEventSpacesByHotel(hotelId, true);
  
  return spaces.map(space => ({
    ...space,
    totalBookings: 0,
    totalRevenue: 0,
    lastBookingDate: null
  }));
};

export const isEventSpaceSlugAvailable = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const conditions: any[] = [eq(eventSpaces.slug, slug)];
  
  if (excludeId) {
    conditions.push(ne(eventSpaces.id, excludeId));
  }
  
  const [existing] = await db
    .select({ id: eventSpaces.id })
    .from(eventSpaces)
    .where(and(...conditions))
    .limit(1);
  
  return !existing;
};

export const generateEventSpaceSlug = async (
  name: string,
  hotelId: string
): Promise<string> => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await isEventSpaceSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};