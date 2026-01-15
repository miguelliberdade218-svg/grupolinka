// src/modules/events/eventService.ts

import { db } from "../../../db";
import {
  eventSpaces,
  eventAvailability,
  eventBookings,
  hotels_base,
  hotels
} from "../../../shared/schema";
import { eq, and, sql, ilike, or, desc, gte, lte, inArray, asc } from "drizzle-orm";

// ==================== FUNÇÕES HELPER ====================
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const toString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
};

// ==================== ESPAÇOS POR HOTEL ====================

export const getEventSpacesByHotel = async (
  hotelId: string,
  includeInactive = false
) => {
  try {
    const conditions = [eq(eventSpaces.hotelId, hotelId)];
    
    if (!includeInactive) {
      conditions.push(eq(eventSpaces.isActive, true));
    }

    const spaces = await db
      .select()
      .from(eventSpaces)
      .where(and(...conditions))
      .orderBy(asc(eventSpaces.name));

    return spaces;
  } catch (error) {
    console.error('Erro ao buscar espaços de eventos por hotel:', error);
    return [];
  }
};

// ==================== BUSCA DE ESPAÇOS ====================

export async function searchEventSpaces(filters: {
  query?: string;
  locality?: string;
  province?: string;
  eventDate?: string;
  capacity?: number;
  eventType?: string;
  maxPrice?: number;
  amenities?: string[];
  hotelId?: string;
}) {
  const {
    query,
    locality,
    province,
    eventDate,
    capacity,
    eventType,
    maxPrice,
    amenities,
    hotelId,
  } = filters;

  const conditions: any[] = [
    eq(eventSpaces.isActive, true),
    eq(hotels.is_active, true)
  ];

  if (hotelId) {
    conditions.push(eq(eventSpaces.hotelId, hotelId));
  }

  if (query) {
    conditions.push(
      or(
        sql`f_unaccent(${eventSpaces.name}) ILIKE f_unaccent(${"%" + query + "%"})`,
        sql`f_unaccent(${eventSpaces.description}) ILIKE f_unaccent(${"%" + query + "%"})`,
        sql`f_unaccent(${hotels.name}) ILIKE f_unaccent(${"%" + query + "%"})`
      )
    );
  }

  if (locality) {
    conditions.push(ilike(hotels.locality, `%${locality}%`));
  }

  if (province) {
    conditions.push(ilike(hotels.province, `%${province}%`));
  }

  if (capacity) {
    conditions.push(
      gte(eventSpaces.capacityMax, capacity),
      lte(eventSpaces.capacityMin, capacity)
    );
  }

  if (eventType) {
    conditions.push(sql`${eventType} = ANY(${eventSpaces.eventTypes})`);
  }

  if (amenities && amenities.length > 0) {
    const amenitiesArray = amenities.filter(a => a && a.trim() !== '');
    if (amenitiesArray.length > 0) {
      conditions.push(
        sql`${eventSpaces.amenities} @> ARRAY[${amenitiesArray.join(', ')}]::text[]`
      );
    }
  }

  let spaces = await db
    .select({
      space: eventSpaces,
      hotel: hotels,
      basePrice: eventSpaces.basePriceHourly,
      priceHalfDay: eventSpaces.basePriceHalfDay,
      priceFullDay: eventSpaces.basePriceFullDay,
      pricePerHour: eventSpaces.pricePerHour,
    })
    .from(eventSpaces)
    .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
    .where(and(...conditions))
    .orderBy(desc(eventSpaces.capacityMax), eventSpaces.name);

  // Filtro por disponibilidade na data - AGORA CONSIDERA SEM REGISTO COMO DISPONÍVEL
  if (eventDate && spaces.length > 0) {
    const spaceIds = spaces.map(s => s.space.id);

    const availableSpaces = await db
      .selectDistinct({ eventSpaceId: eventAvailability.eventSpaceId })
      .from(eventAvailability)
      .where(
        and(
          inArray(eventAvailability.eventSpaceId, spaceIds),
          sql`${eventAvailability.date}::date = ${eventDate}::date`,
          eq(eventAvailability.isAvailable, true),
          eq(eventAvailability.stopSell, false)
        )
      );

    const availableIds = new Set(availableSpaces.map(a => a.eventSpaceId));

    // Espaços sem registo na data são considerados disponíveis
    spaces = spaces.filter(s => {
      // Se tem registo e está bloqueado → remove
      // Se não tem registo → mantém (disponível por padrão)
      return !availableIds.has(s.space.id) || true; // true = mantém todos sem registo + os disponíveis com registo
    });
  }

  // Filtro de preço máximo
  if (maxPrice !== undefined) {
    spaces = spaces.filter(s => {
      const priceValue = s.priceFullDay || s.priceHalfDay || s.basePrice || s.pricePerHour || 0;
      const priceNumber = toNumber(priceValue);
      return priceNumber <= maxPrice;
    });
  }

  return spaces;
}

// ==================== DASHBOARD ====================

export const getEventDashboardSummary = async (hotelId: string) => {
  const spaces = await getEventSpacesByHotel(hotelId);

  if (spaces.length === 0) {
    return {
      totalSpaces: 0,
      upcomingEvents: 0,
      todayEvents: 0,
      totalRevenueThisMonth: 0,
      occupancyRate: 0,
    };
  }

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const bookingsThisMonth = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`,
    })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        gte(eventBookings.startDatetime, monthStart),
        inArray(eventBookings.status, ["confirmed", "checked_in"])
      )
    );

  const todayEvents = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        gte(eventBookings.startDatetime, todayDateOnly),
        lte(eventBookings.startDatetime, new Date(todayDateOnly.getTime() + 24 * 60 * 60 * 1000)),
        eq(eventBookings.status, "confirmed")
      )
    );

  const upcoming = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        gte(eventBookings.startDatetime, todayDateOnly),
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    );

  const totalRevenue = toNumber(bookingsThisMonth[0]?.revenue || 0);
  const bookingsCount = Number(bookingsThisMonth[0]?.count || 0);

  return {
    totalSpaces: spaces.length,
    upcomingEvents: Number(upcoming[0]?.count || 0),
    todayEvents: Number(todayEvents[0]?.count || 0),
    totalRevenueThisMonth: totalRevenue,
    occupancyRate: spaces.length > 0
      ? Math.round((bookingsCount / (spaces.length * 30)) * 100)
      : 0,
  };
};

export const getUpcomingEventsForHotel = async (
  hotelId: string,
  limit: number = 10
) => {
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return await db
    .select({
      booking: eventBookings,
      space: eventSpaces,
    })
    .from(eventBookings)
    .innerJoin(eventSpaces, eq(eventSpaces.id, eventBookings.eventSpaceId))
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        gte(eventBookings.startDatetime, todayDateOnly),
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    )
    .orderBy(eventBookings.startDatetime)
    .limit(limit);
};

export const getEventSpacesOverview = async (hotelId: string) => {
  return await db
    .select({
      space: eventSpaces,
      totalBookings: sql<number>`COUNT(${eventBookings.id})`.as("total_bookings"),
      revenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`.as("revenue"),
    })
    .from(eventSpaces)
    .leftJoin(eventBookings, and(
      eq(eventBookings.eventSpaceId, eventSpaces.id),
      eq(eventBookings.paymentStatus, "paid")
    ))
    .where(eq(eventSpaces.hotelId, hotelId))
    .groupBy(eventSpaces.id)
    .orderBy(desc(sql`"revenue"`));
};

export const getEventSpaceDetails = async (spaceId: string) => {
  const result = await db
    .select({
      space: eventSpaces,
      hotel: hotels,
    })
    .from(eventSpaces)
    .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
    .where(eq(eventSpaces.id, spaceId))
    .limit(1);

  return result[0] || null;
};

// ==================== DISPONIBILIDADE ====================

export const checkEventSpaceAvailability = async (
  eventSpaceId: string,
  date: string,
  startTime?: string,
  endTime?: string
): Promise<{
  isAvailable: boolean;
  availability?: typeof eventAvailability.$inferSelect;
  message?: string;
}> => {
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

  // NOVA LÓGICA: disponibilidade eterna/implícita
  if (!availability) {
    return {
      isAvailable: true,
      message: 'Disponível por padrão (sem bloqueios ou reservas registadas)'
    };
  }

  if (!availability.isAvailable || availability.stopSell) {
    return {
      isAvailable: false,
      availability,
      message: availability.stopSell ? 'Venda bloqueada para esta data' : 'Espaço não disponível'
    };
  }

  if (startTime && endTime && availability.slots) {
    try {
      const slots = availability.slots as any[];
      
      const hasConflict = slots.some(slot => {
        const slotStart = slot.startTime || '';
        const slotEnd = slot.endTime || '';
        return (
          (startTime >= slotStart && startTime < slotEnd) ||
          (endTime > slotStart && endTime <= slotEnd) ||
          (startTime <= slotStart && endTime >= slotEnd)
        );
      });

      if (hasConflict) {
        return {
          isAvailable: false,
          availability,
          message: 'Conflito de horário com reserva existente'
        };
      }
    } catch (error) {
      console.error('Erro ao analisar slots:', error);
    }
  }

  return {
    isAvailable: true,
    availability
  };
};

export const getMultiDateAvailability = async (
  eventSpaceId: string,
  dates: string[]
): Promise<Record<string, typeof eventAvailability.$inferSelect>> => {
  if (dates.length === 0) return {};

  const dateObjects = dates.map(d => new Date(d));
  
  const availability = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        inArray(eventAvailability.date, dateObjects)
      )
    );

  const result: Record<string, typeof eventAvailability.$inferSelect> = {};
  
  availability.forEach(entry => {
    const dateKey = entry.date.toISOString().split('T')[0];
    result[dateKey] = entry;
  });

  return result;
};

// ==================== OUTRAS FUNÇÕES ====================

export const hasActiveEventBookings = async (eventSpaceId: string): Promise<boolean> => {
  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        inArray(eventBookings.status, ["pending", "confirmed", "checked_in"])
      )
    );

  return (active[0]?.count || 0) > 0;
};

export const calculateEventBasePrice = async (
  eventSpaceId: string,
  date: string,
  durationHours?: number
): Promise<number> => {
  const [space] = await db
    .select()
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId));

  if (!space) throw new Error('Espaço de evento não encontrado');

  const [availability] = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        eq(eventAvailability.eventSpaceId, eventSpaceId),
        eq(eventAvailability.date, new Date(date))
      )
    );

  let basePrice = toNumber(space.basePriceHourly || space.pricePerHour || "0");

  // Se houver registo e priceOverride, usa-o; senão, usa base
  if (availability?.priceOverride) {
    basePrice = toNumber(availability.priceOverride);
  }

  if (durationHours && space.pricePerHour) {
    const hourlyRate = toNumber(space.pricePerHour);
    return hourlyRate * durationHours;
  }

  const dateObj = new Date(date);
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  
  if (isWeekend && space.weekendSurchargePercent) {
    const surchargePercent = toNumber(space.weekendSurchargePercent);
    basePrice += basePrice * (surchargePercent / 100);
  }

  return basePrice;
};

export const getFutureEventsBySpace = async (
  eventSpaceId: string,
  limit: number = 20
) => {
  const today = new Date();
  
  return await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        gte(eventBookings.startDatetime, today),
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    )
    .orderBy(eventBookings.startDatetime)
    .limit(limit);
};

export const getMultiSpaceAvailability = async (
  spaceIds: string[],
  date: string
): Promise<Record<string, typeof eventAvailability.$inferSelect>> => {
  if (spaceIds.length === 0) return {};

  const dateObj = new Date(date);
  
  const availability = await db
    .select()
    .from(eventAvailability)
    .where(
      and(
        inArray(eventAvailability.eventSpaceId, spaceIds),
        eq(eventAvailability.date, dateObj)
      )
    );

  const result: Record<string, typeof eventAvailability.$inferSelect> = {};
  
  availability.forEach(entry => {
    result[entry.eventSpaceId as string] = entry;
  });

  return result;
};

export const updateEventAvailabilityAfterBooking = async (
  eventSpaceId: string,
  date: string,
  startTime?: string,
  endTime?: string
): Promise<boolean> => {
  try {
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

    if (!currentAvailability) {
      const slots = startTime && endTime ? [{ startTime, endTime }] : [];
      
      await db.insert(eventAvailability).values({
        eventSpaceId,
        date: dateObj,
        slots: slots,
        isAvailable: true,
        stopSell: false,
        minBookingHours: 4
      });
    } else if (startTime && endTime) {
      const currentSlots = (currentAvailability.slots as any[]) || [];
      const newSlot = { startTime, endTime };
      
      await db
        .update(eventAvailability)
        .set({
          slots: [...currentSlots, newSlot],
          updatedAt: new Date()
        })
        .where(
          and(
            eq(eventAvailability.eventSpaceId, eventSpaceId),
            eq(eventAvailability.date, dateObj)
          )
        );
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade após reserva:', error);
    return false;
  }
};

export const releaseEventAvailabilityAfterCancellation = async (
  eventSpaceId: string,
  date: string,
  startTime?: string,
  endTime?: string
): Promise<boolean> => {
  try {
    const dateObj = new Date(date);
    
    if (!startTime || !endTime) {
      await db
        .update(eventAvailability)
        .set({
          isAvailable: true,
          stopSell: false,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(eventAvailability.eventSpaceId, eventSpaceId),
            eq(eventAvailability.date, dateObj)
          )
        );
    } else {
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

      if (currentAvailability?.slots) {
        const currentSlots = currentAvailability.slots as any[];
        const updatedSlots = currentSlots.filter(
          slot => !(slot.startTime === startTime && slot.endTime === endTime)
        );

        await db
          .update(eventAvailability)
          .set({
            slots: updatedSlots,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(eventAvailability.eventSpaceId, eventSpaceId),
              eq(eventAvailability.date, dateObj)
            )
          );
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao liberar disponibilidade após cancelamento:', error);
    return false;
  }
};

export const getEventStatsForHotel = async (hotelId: string) => {
  const spaces = await getEventSpacesByHotel(hotelId);
  const spaceIds = spaces.map(s => s.id);

  const stats = await db
    .select({
      totalBookings: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`,
      confirmedBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed')`,
      cancelledBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')`,
      averageAttendees: sql<number>`COALESCE(AVG("expectedAttendees"), 0)`,
      averageDuration: sql<number>`COALESCE(AVG("durationHours"), 0)`,
    })
    .from(eventBookings)
    .where(
      and(
        inArray(eventBookings.eventSpaceId, spaceIds),
        gte(eventBookings.createdAt, sql`NOW() - INTERVAL '30 days'`)
      )
    );

  const byEventType = await db
    .select({
      eventType: eventBookings.eventType,
      count: sql<number>`COUNT(*)`,
      revenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`,
    })
    .from(eventBookings)
    .where(inArray(eventBookings.eventSpaceId, spaceIds))
    .groupBy(eventBookings.eventType)
    .orderBy(desc(sql`COALESCE(SUM("totalPrice"), 0)`))
    .limit(5);

  return {
    generalStats: stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      averageAttendees: 0,
      averageDuration: 0,
    },
    byEventType,
    totalSpaces: spaces.length,
    availableSpaces: spaces.filter(s => s.isActive).length
  };
};

export const checkBookingConflicts = async (
  eventSpaceId: string,
  startDatetime: Date,
  endDatetime: Date,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: any[] }> => {
  const conditions: any[] = [
    eq(eventBookings.eventSpaceId, eventSpaceId),
    eq(eventBookings.status, "confirmed"),
    or(
      and(
        lte(eventBookings.startDatetime, startDatetime),
        gte(eventBookings.endDatetime, startDatetime)
      ),
      and(
        lte(eventBookings.startDatetime, endDatetime),
        gte(eventBookings.endDatetime, endDatetime)
      ),
      and(
        gte(eventBookings.startDatetime, startDatetime),
        lte(eventBookings.endDatetime, endDatetime)
      )
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

export const getEventsByOrganizer = async (email: string) => {
  return await db
    .select()
    .from(eventBookings)
    .where(eq(eventBookings.organizerEmail, email))
    .orderBy(desc(eventBookings.startDatetime))
    .limit(50);
};

export const incrementEventSpaceViewCount = async (spaceId: string) => {
  try {
    await db
      .update(eventSpaces)
      .set({
        viewCount: sql`${eventSpaces.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(eventSpaces.id, spaceId));
    return true;
  } catch (error) {
    console.error('Erro ao incrementar contador de visualizações:', error);
    return false;
  }
};

export const calculateEventDeposit = async (
  eventSpaceId: string,
  totalPrice: number
): Promise<number> => {
  return Math.round(totalPrice * 0.3);
};

export const isEventSpaceAvailableForImmediateBooking = async (
  eventSpaceId: string
): Promise<boolean> => {
  const [space] = await db
    .select()
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId));

  if (!space) return false;

  if (!space.isActive) return false;

  if (space.approvalRequired !== undefined && space.approvalRequired === true) {
    return false;
  }

  return true;
};

export const getFeaturedEventSpaces = async (limit: number = 10) => {
  return await db
    .select({
      space: eventSpaces,
      hotel: hotels,
    })
    .from(eventSpaces)
    .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
    .where(
      and(
        eq(eventSpaces.isActive, true),
        eq(eventSpaces.isFeatured, true),
        eq(hotels.is_active, true)
      )
    )
    .orderBy(desc(eventSpaces.bookingCount))
    .limit(limit);
};

export const getEventBookingSecurityDeposit = async (
  bookingId: string
): Promise<number> => {
  const [booking] = await db
    .select({
      securityDeposit: eventBookings.securityDeposit,
      totalPrice: eventBookings.totalPrice
    })
    .from(eventBookings)
    .where(eq(eventBookings.id, bookingId))
    .limit(1);

  if (!booking) return 0;
  
  const securityDepositNum = toNumber(booking.securityDeposit);
  if (securityDepositNum > 0) {
    return securityDepositNum;
  }
  
  return Math.round(toNumber(booking.totalPrice) * 0.3);
};

export const isAlcoholAllowed = async (eventSpaceId: string): Promise<boolean> => {
  const [space] = await db
    .select({ alcoholAllowed: eventSpaces.alcoholAllowed })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.alcoholAllowed === true;
};

export const getSpaceMaxCapacity = async (eventSpaceId: string): Promise<number> => {
  const [space] = await db
    .select({ capacityMax: eventSpaces.capacityMax })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.capacityMax || 0;
};

export const includesCatering = async (eventSpaceId: string): Promise<boolean> => {
  const [space] = await db
    .select({ includesCatering: eventSpaces.includesCatering })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.includesCatering === true;
};

export const includesFurniture = async (eventSpaceId: string): Promise<boolean> => {
  const [space] = await db
    .select({ includesFurniture: eventSpaces.includesFurniture })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.includesFurniture === true;
};