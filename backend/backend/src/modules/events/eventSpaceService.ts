// src/modules/events/eventSpaceService.ts - VERSÃO FINAL CORRIGIDA
// ✅ ÚNICA CORREÇÃO APLICADA: Adicionada função getEventSpaceDetails
// ✅ TODAS AS FUNÇÕES EXISTENTES MANTIDAS IGUAIS

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

// ✅ Função para processar equipment SEMPRE como string JSON
const processEquipmentForDb = (equipment: any): string => {
  if (equipment === null || equipment === undefined) {
    return '{}';
  }
  
  // Se já for string
  if (typeof equipment === 'string') {
    // Se for string vazia, retorna objeto vazio
    if (equipment.trim() === '') {
      return '{}';
    }
    
    // Tentar parsear para validar
    try {
      const parsed = JSON.parse(equipment);
      // Se parseou com sucesso, converter de volta para string limpa
      return JSON.stringify(parsed);
    } catch {
      // Se não for JSON válido, retorna objeto vazio
      return '{}';
    }
  }
  
  // Se for objeto, converter para string JSON
  if (typeof equipment === 'object') {
    try {
      return JSON.stringify(equipment);
    } catch {
      return '{}';
    }
  }
  
  // Qualquer outro tipo, retorna objeto vazio
  return '{}';
};

// ==================== BUSCAR HOTEL POR ID (AUXILIAR) ====================
const getHotelById = async (hotelId: string) => {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
  return hotel || null;
};

// ==================== ✅ CORREÇÃO APLICADA: getEventSpaceDetails ====================
// ✅ FUNÇÃO ADICIONADA - NECESSÁRIA PARA O EVENTCONTROLLER
export const getEventSpaceDetails = async (spaceId: string) => {
  // Buscar o espaço com TODOS os campos necessários
  const space = await db.query.eventSpaces.findFirst({
    where: eq(eventSpaces.id, spaceId),
    columns: {
      id: true,
      hotelId: true,
      name: true,
      description: true,
      capacityMin: true,
      capacityMax: true,
      basePricePerDay: true,
      pricePerDay: true,
      weekendSurchargePercent: true,
      securityDeposit: true,
      offersCatering: true,
      cateringDiscountPercent: true,
      cateringMenuUrls: true,
      isActive: true,
      isFeatured: true,
      areaSqm: true,
      spaceType: true,
      hasStage: true,
      naturalLight: true,
      loadingAccess: true,
      dressingRooms: true,
      insuranceRequired: true,
      alcoholAllowed: true,
      floorPlanImage: true,
      virtualTourUrl: true,
      approvalRequired: true,
      equipment: true,
      amenities: true,
      images: true,
      setupOptions: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      // ✅ CAMPO CRÍTICO - PRECISA ESTAR AQUI!
      allowedEventTypes: true,
      prohibitedEventTypes: true
    }
  });
  
  if (!space) {
    return null;
  }
  
  // ✅ LOG PARA DEBUG - VERIFICAR SE O CAMPO ESTÁ SENDO RETORNADO
  console.log('🔍 [getEventSpaceDetails] space:', {
    id: space.id,
    name: space.name,
    allowedEventTypes: space.allowedEventTypes,
    prohibitedEventTypes: space.prohibitedEventTypes,
    hasAllowedTypes: Array.isArray(space.allowedEventTypes),
    allowedCount: space.allowedEventTypes?.length || 0
  });
  
  // Buscar o hotel associado
  const hotel = await getHotelById(space.hotelId);
  
  return {
    space,
    hotel
  };
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
  // ✅ Processar equipment para string JSON
  let equipmentValue: string;
  
  if (typeof data.equipment === 'string') {
    try {
      const parsed = JSON.parse(data.equipment);
      equipmentValue = JSON.stringify(parsed);
      console.log('✅ Equipment já era string JSON, parseado e re-stringified');
    } catch {
      equipmentValue = '{}';
      console.log('⚠️ Equipment era string inválida, usando objeto vazio');
    }
  } else {
    equipmentValue = JSON.stringify(data.equipment || {});
    console.log('✅ Equipment era objeto, convertido para string JSON');
  }
  
  console.log('🔍 [eventSpaceService] equipment FINAL:', {
    original: data.equipment,
    type: typeof data.equipment,
    stringified: equipmentValue.substring(0, 100)
  });
  
  const processedData = {
    ...data,
    basePricePerDay: data.basePricePerDay ? data.basePricePerDay.toString() : "0",
    equipment: equipmentValue,
  };
  
  try {
    const [space] = await db.insert(eventSpaces).values(processedData).returning();
    return space;
  } catch (error: any) {
    console.error('❌ ERRO ao inserir espaço:', {
      message: error.message,
      detail: error.detail,
      constraint: error.constraint_name
    });
    throw error;
  }
};

export const updateEventSpace = async (
  id: string,
  data: EventSpaceUpdate
): Promise<EventSpace | null> => {
  const processedData: any = { ...data, updatedAt: new Date() };
  
  if (data.basePricePerDay !== undefined) {
    processedData.basePricePerDay = data.basePricePerDay.toString();
  }
  
  if (data.equipment !== undefined) {
    processedData.equipment = processEquipmentForDb(data.equipment);
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

// ✅ CORREÇÃO: Disponibilidade infinita e detecção de conflitos com pending_approval
export const isEventSpaceAvailable = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<{ available: boolean; message?: string }> => {
  try {
    const dateRange = generateDateRange(startDate, endDate);

    for (const date of dateRange) {
      // ✅ VERIFICAÇÃO 1: Verificar bookings (incluindo pending_approval)
      const conflictingBooking = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.eventSpaceId, eventSpaceId),
            inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"]),
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

      // ✅ VERIFICAÇÃO 2: Verificar disponibilidade manual (só se houver registro)
      const [avail] = await db
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, eventSpaceId),
            sql`${eventAvailability.date}::date = ${date}::date`
          )
        )
        .limit(1);

      // ✅ DISPONIBILIDADE INFINITA: Se não há registro, está disponível!
      if (avail) {
        if (avail.stopSell) {
          return { 
            available: false, 
            message: `Venda bloqueada em ${date}` 
          };
        }
        
        if (!avail.isAvailable) {
          return { 
            available: false, 
            message: `Indisponível em ${date}` 
          };
        }
        
        if (avail.availableUnits !== null && avail.availableUnits <= 0) {
          return { 
            available: false, 
            message: `Sem unidades disponíveis em ${date}` 
          };
        }
      }
    }

    return { available: true };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return { 
      available: false, 
      message: 'Erro ao verificar disponibilidade' 
    };
  }
};

export const checkBookingConflicts = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<{ hasConflict: boolean; conflicts?: any[]; message?: string }> => {
  try {
    const dateRange = generateDateRange(startDate, endDate);
    const conflicts = [];

    for (const date of dateRange) {
      const conflictingBooking = await db
        .select()
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.eventSpaceId, eventSpaceId),
            inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"]),
            sql`${eventBookings.startDate}::date <= ${date}::date`,
            sql`${eventBookings.endDate}::date > ${date}::date`
          )
        )
        .limit(1);

      if (conflictingBooking.length > 0) {
        conflicts.push({
          date,
          bookingId: conflictingBooking[0].id,
          status: conflictingBooking[0].status
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      message: conflicts.length > 0 
        ? `Conflito detectado em ${conflicts.length} dia(s)` 
        : undefined
    };
  } catch (error) {
    console.error('Erro ao verificar conflitos:', error);
    return {
      hasConflict: true,
      message: 'Erro ao verificar conflitos'
    };
  }
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
      const dateStr = update.date;
      
      const values: any = {
        eventSpaceId,
        date: dateStr,
        isAvailable: update.isAvailable ?? true,
        stopSell: update.stopSell ?? false,
        availableUnits: update.availableUnits ?? 1,
        maxUnits: update.maxUnits ?? 1,
        minBookingHoursDefault: update.minBookingHoursDefault ?? 4,
        updatedAt: new Date()
      };

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
      totalDaysAvailable: sql<number>`COUNT(DISTINCT ${eventAvailability.date})`.as("days_available"),
      upcomingBookings: sql<number>`
        COALESCE(
          (SELECT COUNT(*) FROM ${eventBookings} eb 
           WHERE eb."eventSpaceId" = ${eventSpaces.id} 
           AND eb.status IN ('pending_approval', 'confirmed')
           AND eb."startDate"::date >= CURRENT_DATE
          ), 0
        )
      `.as("upcoming_bookings"),
    })
    .from(eventSpaces)
    .leftJoin(eventAvailability, and(
      eq(eventAvailability.eventSpaceId, eventSpaces.id),
      eq(eventAvailability.isAvailable, true),
      eq(eventAvailability.stopSell, false)
    ))
    .where(eq(eventSpaces.hotelId, hotelId))
    .groupBy(eventSpaces.id)
    .orderBy(eventSpaces.name);
};

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
  const dateStr = date;
  
  const values: any = {
    eventSpaceId,
    date: dateStr,
    isAvailable: data.isAvailable ?? true,
    stopSell: data.stopSell ?? false,
    availableUnits: data.availableUnits ?? 1,
    maxUnits: data.maxUnits ?? 1,
    minBookingHoursDefault: data.minBookingHoursDefault ?? 4,
    updatedAt: new Date()
  };

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
    .select()
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
      totalDays: sql<number>`COUNT(DISTINCT ${eventAvailability.date})`,
      availableDays: sql<number>`COUNT(DISTINCT ${eventAvailability.date}) FILTER (WHERE ${eventAvailability.isAvailable} = true AND ${eventAvailability.stopSell} = false)`,
      blockedDays: sql<number>`COUNT(DISTINCT ${eventAvailability.date}) FILTER (WHERE ${eventAvailability.stopSell} = true)`,
      averagePrice: sql<number>`COALESCE(AVG(${eventAvailability.price}), 0)`,
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
    .select({ count: sql<number>`COUNT(DISTINCT ${eventBookings.startDate})` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        inArray(eventBookings.status, ["confirmed", "in_progress"]),
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
        inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"])
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

  const dateRange = generateDateRange(startDate, endDate);
  let updatedCount = 0;

  for (const dateStr of dateRange) {
    const existing = await db
      .select({ id: eventAvailability.id })
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
        inArray(eventBookings.status, ["confirmed", "in_progress"]),
        sql`${eventBookings.startDate}::date >= ${startDate}::date`,
        sql`${eventBookings.endDate}::date <= ${endDate}::date`
      )
    );

  const bookingDates = new Set<string>();
  bookings.forEach(booking => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const current = new Date(start);
    while (current < end) {
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
  
  const dateRange = generateDateRange(startDate, endDate);
  let totalPrice = 0;
  
  for (const currentDateStr of dateRange) {
    const [availability] = await db
      .select()
      .from(eventAvailability)
      .where(
        and(
          eq(eventAvailability.eventSpaceId, eventSpaceId),
          sql`${eventAvailability.date}::date = ${currentDateStr}::date`
        )
      )
      .limit(1);
    
    let dailyPrice = toNumber(space.basePricePerDay || "0");
    
    if (availability?.price) {
      dailyPrice = toNumber(availability.price);
    } else if (availability?.priceOverride) {
      dailyPrice = toNumber(availability.priceOverride);
    }
    
    const currentDate = ymdToDateStart(currentDateStr);
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
  
  const spacesWithStats = await Promise.all(
    spaces.map(async (space) => {
      const bookings = await db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`sum(${eventBookings.totalPrice}::numeric)`,
          lastDate: sql<string>`max(${eventBookings.startDate})`
        })
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.eventSpaceId, space.id),
            eq(eventBookings.status, "confirmed")
          )
        );
      
      return {
        ...space,
        totalBookings: bookings[0]?.count || 0,
        totalRevenue: bookings[0]?.revenue || 0,
        lastBookingDate: bookings[0]?.lastDate || null
      };
    })
  );
  
  return spacesWithStats;
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
        inArray(eventBookings.status, ["confirmed", "in_progress"]),
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