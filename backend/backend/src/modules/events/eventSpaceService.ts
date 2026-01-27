// src/modules/events/eventSpaceService.ts - VERSÃO FINAL CORRIGIDA

import { db } from "../../../db";
import {
  eventSpaces,
  eventAvailability,
  hotels,
  eventBookings
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
  or
} from "drizzle-orm";

// ==================== TIPOS ====================
export type EventSpace = typeof eventSpaces.$inferSelect;
export type EventSpaceInsert = typeof eventSpaces.$inferInsert;
export type EventSpaceUpdate = Partial<EventSpaceInsert>;

export type EventAvailability = typeof eventAvailability.$inferSelect;

// ==================== FUNÇÕES HELPER ====================
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Função para converter Date para string YYYY-MM-DD
const dateToYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Converter string para Date no início do dia
const ymdToDateStart = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

// Converter string para Date no final do dia
const ymdToDateEnd = (dateStr: string): Date => {
  return new Date(dateStr + 'T23:59:59');
};

// Gerar range de datas entre start e end
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const start = ymdToDateStart(startDate);
  const end = ymdToDateEnd(endDate);
  const dates: string[] = [];
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(dateToYMD(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
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
  // ✅ CORREÇÃO: Verificar se equipment já é string JSON
  let equipmentValue: string;
  
  if (typeof data.equipment === 'string') {
    // Se já for string, verificar se é JSON válido
    try {
      const parsed = JSON.parse(data.equipment);
      // Se parseou, converter de volta para string limpa
      equipmentValue = JSON.stringify(parsed);
      console.log('✅ Equipment já era string JSON, parseado e re-stringified');
    } catch {
      // Se não for JSON válido, usar como objeto vazio
      equipmentValue = '{}';
      console.log('⚠️ Equipment era string inválida, usando objeto vazio');
    }
  } else {
    // Se for objeto, converter para string JSON
    equipmentValue = JSON.stringify(data.equipment || {});
    console.log('✅ Equipment era objeto, convertido para string JSON');
  }
  
  // ✅ LOG para debug DETALHADO
  console.log('🔍 [eventSpaceService] equipment FINAL:', {
    original: data.equipment,
    type: typeof data.equipment,
    stringified: equipmentValue,
    hasEscapes: equipmentValue.includes('\\"'),
    length: equipmentValue.length,
    first50: equipmentValue.substring(0, 50),
    startsWithQuote: equipmentValue.startsWith('"'),
    endsWithQuote: equipmentValue.endsWith('"')
  });
  
  const processedData = {
    ...data,
    basePricePerDay: data.basePricePerDay ? data.basePricePerDay.toString() : "0",
    // ✅ Enviar como string JSON pura (SEM sql helper)
    equipment: equipmentValue,
  };
  
  try {
    const [space] = await db.insert(eventSpaces).values(processedData).returning();
    return space;
  } catch (error: any) {
    console.error('❌ ERRO ao inserir espaço:', {
      message: error.message,
      detail: error.detail,
      constraint: error.constraint_name,
      query: error.query,
      parameters: error.parameters?.map((p: any, i: number) => `${i}: ${p}`)
    });
    throw error;
  }
};

export const updateEventSpace = async (
  id: string,
  data: EventSpaceUpdate
): Promise<EventSpace | null> => {
  const processedData: any = { ...data };
  
  if (data.basePricePerDay !== undefined) {
    processedData.basePricePerDay = data.basePricePerDay.toString();
  }
  
  if (data.equipment !== undefined) {
    // ✅ CORREÇÃO: Mesma lógica da create
    let equipmentValue: string;
    
    if (typeof data.equipment === 'string') {
      try {
        const parsed = JSON.parse(data.equipment);
        equipmentValue = JSON.stringify(parsed);
      } catch {
        equipmentValue = '{}';
      }
    } else {
      equipmentValue = JSON.stringify(data.equipment || {});
    }
    
    processedData.equipment = equipmentValue;
    
    console.log('🔍 [eventSpaceService] update equipment:', {
      original: data.equipment,
      type: typeof data.equipment,
      stringified: equipmentValue,
      hasEscapes: equipmentValue.includes('\\"'),
      length: equipmentValue.length,
      first50: equipmentValue.substring(0, 50)
    });
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
    .select({
      id: eventAvailability.id,
      eventSpaceId: eventAvailability.eventSpaceId,
      date: eventAvailability.date,
      priceOverride: eventAvailability.priceOverride,
      isAvailable: eventAvailability.isAvailable,
      stopSell: eventAvailability.stopSell,
      availableUnits: eventAvailability.availableUnits,
      maxUnits: eventAvailability.maxUnits,
      price: eventAvailability.price,
      minBookingHoursDefault: eventAvailability.minBookingHoursDefault,
      createdAt: eventAvailability.createdAt,
      updatedAt: eventAvailability.updatedAt,
    })
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
  startDate: string,
  endDate: string
): Promise<{ available: boolean; message?: string }> => {
  const dateRange = generateDateRange(startDate, endDate);

  for (const date of dateRange) {
    const [avail] = await db.select().from(eventAvailability)
      .where(and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        sql`${eventAvailability.date}::date = ${date}::date`
      ))
      .limit(1);

    if (avail?.stopSell || !avail?.isAvailable) {
      return { 
        available: false, 
        message: avail?.stopSell 
          ? `Venda bloqueada em ${date}` 
          : `Indisponível em ${date}`
      };
    }

    const conflictingBooking = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.eventSpaceId, eventSpaceId),
          eq(eventBookings.status, "confirmed"),
          sql`${eventBookings.startDate}::date <= ${date}::date`,
          sql`${eventBookings.endDate}::date > ${date}::date`
        )
      );
    
    if (conflictingBooking[0]?.count > 0) {
      return { 
        available: false, 
        message: `Já reservado para ${date}` 
      };
    }
  }

  return { available: true };
};

export const bulkUpdateEventAvailability = async (
  eventSpaceId: string,
  updates: {
    date: string;
    isAvailable?: boolean;
    stopSell?: boolean;
    priceOverride?: number | null;
    availableUnits?: number;
    maxUnits?: number;
    price?: number | null;
    minBookingHoursDefault?: number;
  }[]
): Promise<void> => {
  if (updates.length === 0) return;

  await db.transaction(async (tx) => {
    for (const update of updates) {
      const dateStr = update.date; // Manter como string
      
      const values: any = {
        eventSpaceId,
        date: dateStr, // Usar string diretamente
        isAvailable: update.isAvailable ?? true,
        stopSell: update.stopSell ?? false,
        availableUnits: update.availableUnits ?? 1,
        maxUnits: update.maxUnits ?? 1,
        minBookingHoursDefault: update.minBookingHoursDefault ?? 4,
        updatedAt: new Date()
      };

      // Adicionar campos opcionais se fornecidos
      if (update.priceOverride !== null && update.priceOverride !== undefined) {
        values.priceOverride = update.priceOverride.toString();
      }
      if (update.price !== null && update.price !== undefined) {
        values.price = update.price.toString();
      }

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
      upcomingBookings: sql<number>`(
        SELECT COUNT(*) FROM "eventBookings" eb 
        WHERE eb."eventSpaceId" = "eventSpaces"."id" 
        AND eb."status" IN ('confirmed', 'pending')
        AND eb."startDate"::date >= CURRENT_DATE
      )`.as("upcoming_bookings"),
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
    availableUnits?: number;
    maxUnits?: number;
    price?: number | null;
    minBookingHoursDefault?: number;
  }
): Promise<EventAvailability> => {
  const dateStr = date; // Manter como string
  
  const values: any = {
    eventSpaceId,
    date: dateStr, // Usar string diretamente
    isAvailable: data.isAvailable ?? true,
    stopSell: data.stopSell ?? false,
    availableUnits: data.availableUnits ?? 1,
    maxUnits: data.maxUnits ?? 1,
    minBookingHoursDefault: data.minBookingHoursDefault ?? 4,
    updatedAt: new Date()
  };

  // Adicionar campos opcionais se fornecidos
  if (data.priceOverride !== null && data.priceOverride !== undefined) {
    values.priceOverride = data.priceOverride.toString();
  }
  if (data.price !== null && data.price !== undefined) {
    values.price = data.price.toString();
  }

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

  const availability = await db
    .select({
      id: eventAvailability.id,
      eventSpaceId: eventAvailability.eventSpaceId,
      date: eventAvailability.date,
      priceOverride: eventAvailability.priceOverride,
      isAvailable: eventAvailability.isAvailable,
      stopSell: eventAvailability.stopSell,
      availableUnits: eventAvailability.availableUnits,
      maxUnits: eventAvailability.maxUnits,
      price: eventAvailability.price,
      minBookingHoursDefault: eventAvailability.minBookingHoursDefault,
      createdAt: eventAvailability.createdAt,
      updatedAt: eventAvailability.updatedAt,
    })
    .from(eventAvailability)
    .where(
      and(
        inArray(eventAvailability.eventSpaceId, eventSpaceIds),
        sql`${eventAvailability.date}::date = ${date}::date`
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

export const getEventSpaceAvailabilityStats = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
) => {
  const stats = await db
    .select({
      totalDays: sql<number>`COUNT(DISTINCT date)`,
      availableDays: sql<number>`COUNT(DISTINCT date) FILTER (WHERE "isAvailable" = true AND "stopSell" = false)`,
      blockedDays: sql<number>`COUNT(DISTINCT date) FILTER (WHERE "stopSell" = true)`,
      averagePrice: sql<number>`COALESCE(AVG("price"), 0)`,
    })
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        sql`${eventAvailability.date}::date >= ${startDate}::date`,
        sql`${eventAvailability.date}::date <= ${endDate}::date`
      )
    );

  const bookedDays = await db
    .select({ count: sql<number>`COUNT(DISTINCT "startDate")` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        eq(eventBookings.status, "confirmed"),
        sql`${eventBookings.startDate}::date >= ${startDate}::date`,
        sql`${eventBookings.endDate}::date <= ${endDate}::date`
      )
    );

  return {
    totalDays: stats[0]?.totalDays || 0,
    availableDays: stats[0]?.availableDays || 0,
    blockedDays: stats[0]?.blockedDays || 0,
    bookedDays: bookedDays[0]?.count || 0,
    averagePrice: stats[0]?.averagePrice || 0
  };
};

export const hasActiveEventBookingsForSpace = async (eventSpaceId: string): Promise<boolean> => {
  const activeBookings = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        inArray(eventBookings.status, ["pending", "confirmed", "checked_in"])
      )
    );

  return (activeBookings[0]?.count || 0) > 0;
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

  const startDateObj = ymdToDateStart(startDate);
  const endDateObj = ymdToDateEnd(endDate);
  
  const daysDiff = Math.ceil(
    (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  let updatedCount = 0;

  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(startDateObj);
    currentDate.setDate(startDateObj.getDate() + i);
    const dateStr = dateToYMD(currentDate);

    const existing = await db
      .select({
        id: eventAvailability.id,
        eventSpaceId: eventAvailability.eventSpaceId,
        date: eventAvailability.date,
        priceOverride: eventAvailability.priceOverride,
        isAvailable: eventAvailability.isAvailable,
        stopSell: eventAvailability.stopSell,
        availableUnits: eventAvailability.availableUnits,
        maxUnits: eventAvailability.maxUnits,
        price: eventAvailability.price,
        minBookingHoursDefault: eventAvailability.minBookingHoursDefault,
        createdAt: eventAvailability.createdAt,
        updatedAt: eventAvailability.updatedAt,
      })
      .from(eventAvailability)
      .where(
        and(
          eq(eventAvailability.eventSpaceId, eventSpaceId),
          sql`${eventAvailability.date}::date = ${dateStr}::date`
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await upsertEventAvailability(eventSpaceId, dateStr, {
        isAvailable: true,
        stopSell: false,
        availableUnits: 1,
        maxUnits: 1,
        price: toNumber(space.basePricePerDay || "0"),
        minBookingHoursDefault: 4
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
  availableUnits: number;
  maxUnits: number;
  hasBooking: boolean;
}>> => {
  const availability = await getEventSpaceCalendar(eventSpaceId, startDate, endDate);
  
  const bookings = await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        eq(eventBookings.status, "confirmed"),
        sql`${eventBookings.startDate}::date >= ${startDate}::date`,
        sql`${eventBookings.endDate}::date <= ${endDate}::date`
      )
    );

  const bookingDates = new Set<string>();
  bookings.forEach(booking => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const current = new Date(start);
    while (current <= end) {
      bookingDates.add(dateToYMD(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return availability.map(entry => {
    const dateStr = typeof entry.date === 'string' ? entry.date : dateToYMD(new Date(entry.date));
    const hasBooking = bookingDates.has(dateStr);
    
    let status = 'Disponível';
    if (hasBooking) {
      status = 'Reservado';
    } else if (entry.stopSell) {
      status = 'Venda Bloqueada';
    } else if (!entry.isAvailable) {
      status = 'Indisponível';
    }

    const priceValue = toNumber(entry.price || 0);
    const overridePriceValue = toNumber(entry.priceOverride || 0);
    const finalPrice = overridePriceValue > 0 ? overridePriceValue : priceValue;
    
    return {
      date: dateStr,
      status,
      price: finalPrice > 0 
        ? `MZN ${finalPrice.toFixed(2)}` 
        : 'Preço padrão',
      availableUnits: entry.availableUnits || 1,
      maxUnits: entry.maxUnits || 1,
      hasBooking
    };
  });
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const getEventSpacesByEventType = async (
  eventType: string,
  hotelId?: string
): Promise<EventSpace[]> => {
  const conditions: any[] = [
    eq(eventSpaces.isActive, true)
  ];

  if (eventType) {
    conditions.push(sql`${eventType} = ANY(${eventSpaces.allowedEventTypes})`);
  }

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
    basePricePerDay?: number;
    weekendSurchargePercent?: number;
    securityDeposit?: number;
  }
): Promise<EventSpace | null> => {
  const updateData: any = {};
  
  if (pricing.basePricePerDay !== undefined) {
    updateData.basePricePerDay = pricing.basePricePerDay.toString();
  }
  if (pricing.weekendSurchargePercent !== undefined) {
    updateData.weekendSurchargePercent = pricing.weekendSurchargePercent;
  }
  if (pricing.securityDeposit !== undefined) {
    updateData.securityDeposit = pricing.securityDeposit.toString();
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
    offersCatering?: boolean;
    minPricePerDay?: number;
    maxPricePerDay?: number;
    eventType?: string;
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
  
  if (filters.offersCatering !== undefined) {
    conditions.push(eq(eventSpaces.offersCatering, filters.offersCatering));
  }
  
  if (filters.eventType) {
    conditions.push(sql`${filters.eventType} = ANY(${eventSpaces.allowedEventTypes})`);
  }
  
  if (filters.minPricePerDay !== undefined || filters.maxPricePerDay !== undefined) {
    const priceConditions: any[] = [];
    
    if (filters.minPricePerDay !== undefined) {
      priceConditions.push(gte(eventSpaces.basePricePerDay, filters.minPricePerDay.toString()));
    }
    
    if (filters.maxPricePerDay !== undefined) {
      priceConditions.push(lte(eventSpaces.basePricePerDay, filters.maxPricePerDay.toString()));
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
  startDate: string,
  endDate: string,
  cateringRequired: boolean = false
): Promise<number> => {
  const space = await getEventSpaceById(eventSpaceId);
  if (!space) {
    throw new Error('Espaço não encontrado');
  }
  
  const start = ymdToDateStart(startDate);
  const end = ymdToDateEnd(endDate);
  const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  let totalPrice = 0;
  
  for (let i = 0; i < daysDifference; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const currentDateStr = dateToYMD(currentDate);
    
    const [availability] = await db
      .select({
        id: eventAvailability.id,
        eventSpaceId: eventAvailability.eventSpaceId,
        date: eventAvailability.date,
        priceOverride: eventAvailability.priceOverride,
        isAvailable: eventAvailability.isAvailable,
        stopSell: eventAvailability.stopSell,
        availableUnits: eventAvailability.availableUnits,
        maxUnits: eventAvailability.maxUnits,
        price: eventAvailability.price,
        minBookingHoursDefault: eventAvailability.minBookingHoursDefault,
        createdAt: eventAvailability.createdAt,
        updatedAt: eventAvailability.updatedAt,
      })
      .from(eventAvailability)
      .where(
        and(
          eq(eventAvailability.eventSpaceId, eventSpaceId),
          sql`${eventAvailability.date}::date = ${currentDateStr}::date`
        )
      )
      .limit(1);
    
    let dailyPrice = toNumber(space.basePricePerDay || "0");
    
    // Usar price do availability se existir, senão usar priceOverride se existir
    if (availability?.price) {
      dailyPrice = toNumber(availability.price);
    } else if (availability?.priceOverride) {
      dailyPrice = toNumber(availability.priceOverride);
    }
    
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    if (isWeekend && space.weekendSurchargePercent) {
      const surchargePercent = toNumber(space.weekendSurchargePercent);
      dailyPrice += dailyPrice * (surchargePercent / 100);
    }
    
    totalPrice += dailyPrice;
  }
  
  if (cateringRequired && space.offersCatering && space.cateringDiscountPercent) {
    const cateringDiscountPercent = toNumber(space.cateringDiscountPercent);
    const discountAmount = totalPrice * (cateringDiscountPercent / 100);
    totalPrice -= discountAmount;
  }
  
  return Math.round(totalPrice * 100) / 100;
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

// ==================== FUNÇÕES DE INICIALIZAÇÃO ====================

export const initializeEventAvailability = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  try {
    try {
      const result = await db.execute(sql`
        SELECT generate_event_availability(
          ${eventSpaceId}::uuid,
          ${startDate}::date,
          ${endDate}::date
        ) as created_count
      `);
      
      if (Array.isArray(result)) {
        const firstRow = result[0] as any;
        return firstRow?.created_count || 0;
      }
      
      const anyResult = result as any;
      if (anyResult && typeof anyResult === 'object') {
        if (anyResult.rows && Array.isArray(anyResult.rows)) {
          return anyResult.rows[0]?.created_count || 0;
        }
        if (anyResult[0]) {
          return (anyResult[0] as any).created_count || 0;
        }
      }
      
      return 0;
    } catch (sqlError) {
      return await syncAvailabilityWithSpaceConfig(eventSpaceId, startDate, endDate);
    }
  } catch (error) {
    console.error('Erro ao inicializar disponibilidade:', error);
    return await syncAvailabilityWithSpaceConfig(eventSpaceId, startDate, endDate);
  }
};

export const getAvailabilityCalendar = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  status: 'available' | 'blocked' | 'booked' | 'unavailable';
  price: number;
  availableUnits: number;
  maxUnits: number;
  hasOverride: boolean;
}>> => {
  const availability = await getEventSpaceCalendar(eventSpaceId, startDate, endDate);
  
  const bookings = await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        eq(eventBookings.status, "confirmed"),
        sql`${eventBookings.startDate}::date >= ${startDate}::date`,
        sql`${eventBookings.endDate}::date <= ${endDate}::date`
      )
    );

  const bookedDates = new Set<string>();
  bookings.forEach(booking => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const current = new Date(start);
    
    while (current < end) {
      bookedDates.add(dateToYMD(current));
      current.setDate(current.getDate() + 1);
    }
  });

  return availability.map(entry => {
    const dateStr = typeof entry.date === 'string' ? entry.date : dateToYMD(new Date(entry.date));
    const hasBooking = bookedDates.has(dateStr);
    const hasOverride = !!entry.priceOverride;
    
    let status: 'available' | 'blocked' | 'booked' | 'unavailable' = 'available';
    
    if (hasBooking) {
      status = 'booked';
    } else if (entry.stopSell) {
      status = 'blocked';
    } else if (!entry.isAvailable) {
      status = 'unavailable';
    }

    const priceValue = toNumber(entry.price || 0);
    const overridePriceValue = toNumber(entry.priceOverride || 0);
    const finalPrice = overridePriceValue > 0 ? overridePriceValue : priceValue;

    return {
      date: dateStr,
      status,
      price: finalPrice,
      availableUnits: entry.availableUnits || 1,
      maxUnits: entry.maxUnits || 1,
      hasOverride
    };
  });
};