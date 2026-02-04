// src/modules/events/eventService.ts - VERSÃO CORRIGIDA COM BUSCA POR PROXIMIDADE

import { db } from "../../../db";
import {
  eventSpaces,
  eventAvailability,
  eventBookings,
  hotels,
  mozambiqueLocations
} from "../../../shared/schema";
import { eq, and, sql, ilike, or, desc, gte, lte, inArray, asc } from "drizzle-orm";

// Importar apenas as funções que realmente existem no eventSpaceService
import {
  getEventSpacesByHotel as getSpacesByHotelFromSpaceService,
  getEventSpaceById,
  isEventSpaceAvailable as checkSpaceAvailability
} from './eventSpaceService';

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

// ==================== ESPAÇOS POR HOTEL ====================
export const getEventSpacesByHotel = async (
  hotelId: string,
  includeInactive = false
) => {
  try {
    return await getSpacesByHotelFromSpaceService(hotelId, includeInactive);
  } catch (error) {
    console.error('Erro ao buscar espaços de eventos por hotel:', error);
    return [];
  }
};

// ==================== BUSCA POR PROXIMIDADE (NOVA FUNÇÃO) ====================

/**
 * Busca espaços de eventos por proximidade a um ponto geográfico
 */
export const searchEventSpacesNearby = async (
  lat: number,
  lng: number,
  radiusKm: number = 50,
  additionalFilters?: {
    startDate?: string;
    endDate?: string;
    capacity?: number;
    eventType?: string;
    maxPricePerDay?: number;
    amenities?: string[];
    minRating?: number; // ✅ REFERE-SE AO averageRating (campo correto)
  }
) => {
  try {
    // Calcular a fórmula de Haversine
    const haversineFormula = sql`
      (6371 * acos(
        cos(radians(${lat})) * 
        cos(radians(CAST(${hotels.lat} AS numeric))) * 
        cos(radians(CAST(${hotels.lng} AS numeric)) - radians(${lng})) + 
        sin(radians(${lat})) * 
        sin(radians(CAST(${hotels.lat} AS numeric)))
      ))
    `;

    // Construir condições iniciais
    const conditions = [
      eq(eventSpaces.isActive, true),
      eq(hotels.is_active, true),
      sql`${hotels.lat} IS NOT NULL`,
      sql`${hotels.lng} IS NOT NULL`,
      sql`${haversineFormula} <= ${radiusKm}`
    ];

    // Aplicar filtros adicionais
    if (additionalFilters?.capacity) {
      conditions.push(gte(eventSpaces.capacityMax, additionalFilters.capacity));
    }
    
    if (additionalFilters?.eventType) {
      conditions.push(sql`${additionalFilters.eventType} = ANY(${eventSpaces.allowedEventTypes})`);
    }
    
    if (additionalFilters?.maxPricePerDay) {
      // Converter para string para comparar com campo numeric
      conditions.push(lte(eventSpaces.basePricePerDay, additionalFilters.maxPricePerDay.toString()));
    }
    
    // ✅ CORRIGIDO: Filtro por averageRating mínimo usando sql
    if (additionalFilters?.minRating !== undefined) {
      conditions.push(sql`${eventSpaces.averageRating}::numeric >= ${additionalFilters.minRating}`);
    }
    
    if (additionalFilters?.amenities && additionalFilters.amenities.length > 0) {
      const amenitiesArray = additionalFilters.amenities.filter(a => a && a.trim() !== '');
      if (amenitiesArray.length > 0) {
        conditions.push(
          sql`${eventSpaces.amenities} @> ARRAY[${amenitiesArray.join(', ')}]::text[]`
        );
      }
    }
    
    // Executar query
    const results = await db
      .select({
        space: eventSpaces,
        hotel: hotels,
        distance_km: haversineFormula.as('distance_km')
      })
      .from(eventSpaces)
      .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
      .where(and(...conditions))
      .orderBy(sql`distance_km ASC`);
    
    // Filtrar por disponibilidade se tiver datas
    if (additionalFilters?.startDate && additionalFilters?.endDate && results.length > 0) {
      const availableSpaces = [];
      
      for (const result of results) {
        const availability = await checkEventSpaceAvailability(
          result.space.id,
          additionalFilters.startDate!,
          additionalFilters.endDate!
        );
        
        if (availability.isAvailable) {
          availableSpaces.push(result);
        }
      }
      
      return availableSpaces;
    }
    
    return results;
  } catch (error) {
    console.error('Erro na busca por proximidade de event spaces:', error);
    return [];
  }
};

/**
 * Versão melhorada que prioriza location_id (como hotels)
 */
export const searchEventSpacesNearbyEnhanced = async (
  lat: number,
  lng: number,
  radiusKm: number = 50,
  additionalFilters?: {
    startDate?: string;
    endDate?: string;
    capacity?: number;
    eventType?: string;
    maxPricePerDay?: number;
    amenities?: string[];
    minRating?: number; // ✅ REFERE-SE AO averageRating (campo correto)
  },
  useExactLocations: boolean = false
) => {
  try {
    if (useExactLocations) {
      // Fórmulas de distância
      const distanceFromExactLocation = sql`
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(${mozambiqueLocations.lat}::numeric)) * 
          cos(radians(${mozambiqueLocations.lng}::numeric) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(${mozambiqueLocations.lat}::numeric))
        ))
      `;

      const distanceFromHotel = sql`
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(CAST(${hotels.lat} AS numeric))) * 
          cos(radians(CAST(${hotels.lng} AS numeric)) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(CAST(${hotels.lat} AS numeric)))
        ))
      `;

      // Construir a query manualmente com condições
      const conditions = [
        eq(eventSpaces.isActive, true),
        eq(hotels.is_active, true),
        or(
          and(
            sql`${hotels.location_id} IS NOT NULL`,
            sql`${distanceFromExactLocation} <= ${radiusKm}`
          ),
          and(
            sql`${hotels.location_id} IS NULL`,
            sql`${hotels.lat} IS NOT NULL`,
            sql`${hotels.lng} IS NOT NULL`,
            sql`${distanceFromHotel} <= ${radiusKm}`
          )
        )
      ];

      // Aplicar filtros adicionais
      if (additionalFilters?.capacity) {
        conditions.push(gte(eventSpaces.capacityMax, additionalFilters.capacity));
      }
      
      if (additionalFilters?.eventType) {
        conditions.push(sql`${additionalFilters.eventType} = ANY(${eventSpaces.allowedEventTypes})`);
      }
      
      if (additionalFilters?.maxPricePerDay) {
        conditions.push(lte(eventSpaces.basePricePerDay, additionalFilters.maxPricePerDay.toString()));
      }
      
      // ✅ CORRIGIDO: Filtro por averageRating mínimo usando sql
      if (additionalFilters?.minRating !== undefined) {
        conditions.push(sql`${eventSpaces.averageRating}::numeric >= ${additionalFilters.minRating}`);
      }
      
      if (additionalFilters?.amenities && additionalFilters.amenities.length > 0) {
        const amenitiesArray = additionalFilters.amenities.filter(a => a && a.trim() !== '');
        if (amenitiesArray.length > 0) {
          conditions.push(
            sql`${eventSpaces.amenities} @> ARRAY[${amenitiesArray.join(', ')}]::text[]`
          );
        }
      }

      // Executar query
      const results = await db
        .select({
          space: eventSpaces,
          hotel: hotels,
          location: mozambiqueLocations,
          distance_from_exact_location_km: distanceFromExactLocation.as('distance_from_exact_location_km'),
          distance_from_hotel_km: distanceFromHotel.as('distance_from_hotel_km'),
          priority: sql<number>`
            CASE 
              WHEN ${hotels.location_id} IS NOT NULL THEN 1
              ELSE 2
            END
          `.as('priority')
        })
        .from(eventSpaces)
        .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
        .leftJoin(mozambiqueLocations, eq(hotels.location_id, mozambiqueLocations.id))
        .where(and(...conditions))
        .orderBy(asc(sql`priority`), asc(sql`COALESCE(distance_from_exact_location_km, distance_from_hotel_km)`))
        .limit(50);
      
      // Filtrar por disponibilidade se tiver datas
      if (additionalFilters?.startDate && additionalFilters?.endDate && results.length > 0) {
        const availableSpaces = [];
        
        for (const result of results) {
          const availability = await checkEventSpaceAvailability(
            result.space.id,
            additionalFilters.startDate!,
            additionalFilters.endDate!
          );
          
          if (availability.isAvailable) {
            availableSpaces.push(result);
          }
        }
        
        return availableSpaces;
      }
      
      return results;
    } else {
      // Usar a função básica de busca por proximidade
      return await searchEventSpacesNearby(lat, lng, radiusKm, additionalFilters);
    }
  } catch (error) {
    console.error('Erro na busca por proximidade melhorada de event spaces:', error);
    return [];
  }
};

// ==================== BUSCA DE ESPAÇOS (ATUALIZADA COM PROXIMIDADE E AVERAGE RATING) ====================

export async function searchEventSpaces(filters: {
  query?: string;
  locality?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  eventType?: string;
  maxPricePerDay?: number;
  amenities?: string[];
  hotelId?: string;
  minRating?: number; // ✅ REFERE-SE AO averageRating (campo correto)
  // ✅ NOVO: Parâmetros de proximidade
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: 'distance' | 'price' | 'capacity' | 'rating'; // ✅ 'rating' ordena por averageRating
  useExactLocations?: boolean;
}) {
  const {
    query,
    locality,
    province,
    startDate,
    endDate,
    capacity,
    eventType,
    maxPricePerDay,
    amenities,
    hotelId,
    minRating, // ✅ Isto é o campo averageRating da tabela
    lat,
    lng,
    radiusKm = 50,
    sortBy = 'distance',
    useExactLocations = false,
  } = filters;
  
  // ✅ SE tiver lat/lng, usar busca por proximidade
  if (lat !== undefined && lng !== undefined) {
    return await searchEventSpacesNearbyEnhanced(
      lat,
      lng,
      radiusKm,
      {
        startDate,
        endDate,
        capacity,
        eventType,
        maxPricePerDay,
        amenities,
        minRating // ✅ Passando como minRating (averageRating)
      },
      useExactLocations
    );
  }
  
  // ✅ SENÃO, usar busca tradicional (código existente) COM averageRating
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
    conditions.push(gte(eventSpaces.capacityMax, capacity));
  }

  if (eventType) {
    conditions.push(sql`${eventType} = ANY(${eventSpaces.allowedEventTypes})`);
  }

  // ✅ CORREÇÃO: Filtro por averageRating mínimo usando sql (não gte direto)
  if (minRating !== undefined) {
    conditions.push(sql`${eventSpaces.averageRating}::numeric >= ${minRating}`);
  }

  if (amenities && amenities.length > 0) {
    const amenitiesArray = amenities.filter(a => a && a.trim() !== '');
    if (amenitiesArray.length > 0) {
      conditions.push(
        sql`${eventSpaces.amenities} @> ARRAY[${amenitiesArray.join(', ')}]::text[]`
      );
    }
  }

  // Buscar espaços que atendem aos critérios básicos
  const spacesQuery = db
    .select({
      space: eventSpaces,
      hotel: hotels,
      basePricePerDay: eventSpaces.basePricePerDay,
      weekendSurchargePercent: eventSpaces.weekendSurchargePercent,
    })
    .from(eventSpaces)
    .innerJoin(hotels, eq(hotels.id, eventSpaces.hotelId))
    .where(and(...conditions));

  // Aplicar ordenação baseada no sortBy - AGORA COM averageRating CORRETO
  let orderedSpaces;
  switch (sortBy) {
    case 'price':
      orderedSpaces = await spacesQuery.orderBy(asc(eventSpaces.basePricePerDay));
      break;
    case 'capacity':
      orderedSpaces = await spacesQuery.orderBy(desc(eventSpaces.capacityMax));
      break;
    case 'rating':
      // ✅ CORREÇÃO: Ordenação por averageRating (campo correto)
      orderedSpaces = await spacesQuery.orderBy(desc(sql`${eventSpaces.averageRating}::numeric`));
      break;
    case 'distance':
      // Para ordenação por distância, precisamos de lat/lng
      orderedSpaces = await spacesQuery.orderBy(desc(eventSpaces.capacityMax));
      break;
    default:
      orderedSpaces = await spacesQuery.orderBy(desc(eventSpaces.capacityMax));
  }

  let spaces = orderedSpaces;

  // Filtro por disponibilidade no período (sistema de diárias)
  if (startDate && endDate && spaces.length > 0) {
    const spaceIds = spaces.map(s => s.space.id);
    
    const start = ymdToDateStart(startDate);
    const end = ymdToDateEnd(endDate);
    const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const availableSpaces = [];
    
    for (const space of spaces) {
      let isAvailableForAllDays = true;
      
      for (let i = 0; i < daysDifference; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const currentDateStr = dateToYMD(currentDate);
        
        // ✅ CORREÇÃO: Verificar conflitos com bookings (incluindo pending_approval)
        const conflictingBooking = await db
          .select({ count: sql<number>`count(*)` })
          .from(eventBookings)
          .where(
            and(
              eq(eventBookings.eventSpaceId, space.space.id),
              // ✅ CRÍTICO: Incluir pending_approval para evitar múltiplas reservas
              inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"]),
              sql`${eventBookings.startDate}::date <= ${currentDateStr}::date`,
              sql`${eventBookings.endDate}::date > ${currentDateStr}::date`
            )
          );
        
        if (conflictingBooking[0]?.count > 0) {
          isAvailableForAllDays = false;
          break;
        }
        
        // ✅ CORREÇÃO: Verificar disponibilidade APENAS se existir registro
        // Se não houver registro, assume DISPONÍVEL
        const availability = await db
          .select()
          .from(eventAvailability)
          .where(
            and(
              eq(eventAvailability.eventSpaceId, space.space.id),
              sql`${eventAvailability.date}::date = ${currentDateStr}::date`
            )
          )
          .limit(1);
        
        // ✅ Só considera bloqueio se EXISTIR registro E tiver restrições
        if (availability.length > 0) {
          const avail = availability[0];
          if (avail.stopSell || !avail.isAvailable) {
            isAvailableForAllDays = false;
            break;
          }
        }
        // ✅ Se não houver registro, CONTINUA DISPONÍVEL
      }
      
      if (isAvailableForAllDays) {
        availableSpaces.push(space);
      }
    }
    
    spaces = availableSpaces;
  }

  if (maxPricePerDay !== undefined) {
    spaces = spaces.filter(s => {
      const priceNumber = toNumber(s.basePricePerDay);
      return priceNumber <= maxPricePerDay;
    });
  }

  return spaces;
}

// ==================== RESTANTE DO CÓDIGO (MANTIDO IGUAL) ====================
// ... (todo o resto do código permanece igual a partir daqui, incluindo:
// getEventDashboardSummary, getUpcomingEventsForHotel, getEventSpacesOverview,
// getEventSpaceDetails, checkEventSpaceAvailability, hasActiveEventBookings,
// calculateEventBasePrice, getFutureEventsBySpace, getEventStatsForHotel,
// checkBookingConflicts, getEventsByOrganizer, incrementEventSpaceViewCount,
// calculateEventDeposit, isEventSpaceAvailableForImmediateBooking,
// getFeaturedEventSpaces, getEventBookingSecurityDeposit, offersCatering,
// getCateringDiscountPercent, getCateringMenuUrls, isAlcoholAllowed,
// getSpaceMaxCapacity, getSpaceMinCapacity, canBookEventSpace)

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
  const todayDateOnly = dateToYMD(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = dateToYMD(monthStart);

  const bookingsThisMonth = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`,
    })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        sql`${eventBookings.startDate}::date >= ${monthStartStr}::date`,
        inArray(eventBookings.status, ["confirmed", "checked_in"])
      )
    );

  const todayEvents = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        sql`${eventBookings.startDate}::date = ${todayDateOnly}::date`,
        eq(eventBookings.status, "confirmed")
      )
    );

  const upcoming = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        sql`${eventBookings.startDate}::date >= ${todayDateOnly}::date`,
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    );

  const totalRevenue = toNumber(bookingsThisMonth[0]?.revenue || 0);
  const bookingsCount = Number(bookingsThisMonth[0]?.count || 0);

  const occupiedDays = await db
    .select({ totalDays: sql<number>`COALESCE(SUM(${eventBookings.durationDays}), 0)` })
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.hotelId, hotelId),
        sql`${eventBookings.startDate}::date >= ${monthStartStr}::date`,
        inArray(eventBookings.status, ["confirmed", "checked_in"])
      )
    );

  const totalOccupiedDays = toNumber(occupiedDays[0]?.totalDays || 0);
  const totalPossibleDays = spaces.length * 30;
  
  return {
    totalSpaces: spaces.length,
    upcomingEvents: Number(upcoming[0]?.count || 0),
    todayEvents: Number(todayEvents[0]?.count || 0),
    totalRevenueThisMonth: totalRevenue,
    occupancyRate: totalPossibleDays > 0
      ? Math.round((totalOccupiedDays / totalPossibleDays) * 100)
      : 0,
  };
};

export const getUpcomingEventsForHotel = async (
  hotelId: string,
  limit: number = 10
) => {
  const today = new Date();
  const todayDateOnly = dateToYMD(today);

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
        sql`${eventBookings.startDate}::date >= ${todayDateOnly}::date`,
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    )
    .orderBy(eventBookings.startDate)
    .limit(limit);
};

export const getEventSpacesOverview = async (hotelId: string) => {
  return await db
    .select({
      space: eventSpaces,
      totalBookings: sql<number>`COUNT(${eventBookings.id})`.as("total_bookings"),
      revenue: sql<number>`COALESCE(SUM("totalPrice"), 0)`.as("revenue"),
      totalDaysBooked: sql<number>`COALESCE(SUM(${eventBookings.durationDays}), 0)`.as("total_days_booked"),
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

// ==================== DETALHES DO ESPAÇO ====================
export const getEventSpaceDetails = async (spaceId: string) => {
  const space = await getEventSpaceById(spaceId);
  if (!space) return null;

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, space.hotelId))
    .limit(1);

  return hotel ? { space, hotel } : null;
};

// ==================== DISPONIBILIDADE - VERSÃO CORRIGIDA COM DISPONIBILIDADE INFINITA ====================
// ✅ E DETECÇÃO DE CONFLITOS INCLUINDO BOOKINGS pending_approval
export const checkEventSpaceAvailability = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string
): Promise<{
  isAvailable: boolean;
  message?: string;
}> => {
  try {
    // ✅ 1. Verificar se o espaço existe e está ativo
    const space = await getEventSpaceById(eventSpaceId);
    if (!space) {
      return {
        isAvailable: false,
        message: 'Espaço não encontrado'
      };
    }
    
    if (!space.isActive) {
      return {
        isAvailable: false,
        message: 'Espaço inativo'
      };
    }

    const start = ymdToDateStart(startDate);
    const end = ymdToDateEnd(endDate);
    
    // Verificar se startDate <= endDate
    if (start > end) {
      return {
        isAvailable: false,
        message: 'Data de início deve ser anterior à data de fim'
      };
    }
    
    const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // ✅ 2. Verificar conflitos com bookings (incluindo pending_approval)
    const conflictingBooking = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.eventSpaceId, eventSpaceId),
          // ✅ CRÍTICO: Incluir pending_approval para evitar múltiplas reservas
          inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"]),
          or(
            sql`(${eventBookings.startDate}::date <= ${startDate}::date AND ${eventBookings.endDate}::date > ${startDate}::date)`,
            sql`(${eventBookings.startDate}::date <= ${endDate}::date AND ${eventBookings.endDate}::date > ${endDate}::date)`,
            sql`(${eventBookings.startDate}::date >= ${startDate}::date AND ${eventBookings.endDate}::date <= ${endDate}::date)`
          )
        )
      );
    
    if (conflictingBooking[0]?.count > 0) {
      return {
        isAvailable: false,
        message: 'Espaço já reservado para este período'
      };
    }
    
    // ✅ 3. Verificar disponibilidade manual (APENAS SE HOUVER REGISTRO)
    for (let i = 0; i < daysDifference; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const currentDateStr = dateToYMD(currentDate);
      
      const availability = await db
        .select()
        .from(eventAvailability)
        .where(
          and(
            eq(eventAvailability.eventSpaceId, eventSpaceId),
            sql`${eventAvailability.date}::date = ${currentDateStr}::date`
          )
        )
        .limit(1);
      
      // ✅ CORREÇÃO: Se NÃO houver registro, CONTINUA DISPONÍVEL
      if (availability.length === 0) {
        continue; // Disponibilidade infinita por padrão
      }
      
      // ✅ Só aplica restrições se HOUVER registro explícito
      if (availability[0].stopSell) {
        return {
          isAvailable: false,
          message: `Dia ${currentDate.toLocaleDateString()} bloqueado para reservas`
        };
      }
      
      if (!availability[0].isAvailable) {
        return {
          isAvailable: false,
          message: `Dia ${currentDate.toLocaleDateString()} marcado como indisponível`
        };
      }
      
      // ✅ Verificar também availableUnits se necessário
      if (availability[0].availableUnits !== null && availability[0].availableUnits <= 0) {
        return {
          isAvailable: false,
          message: `Dia ${currentDate.toLocaleDateString()} sem unidades disponíveis`
        };
      }
    }
    
    // ✅ 4. Se passou por todas as verificações, ESPAÇO DISPONÍVEL
    return {
      isAvailable: true,
      message: 'Espaço disponível para reserva'
    };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return {
      isAvailable: false,
      message: 'Erro ao verificar disponibilidade'
    };
  }
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
  startDate: string,
  endDate: string,
  cateringRequired: boolean = false
): Promise<number> => {
  const space = await getEventSpaceById(eventSpaceId);
  if (!space) throw new Error('Espaço de evento não encontrado');

  const start = ymdToDateStart(startDate);
  const end = ymdToDateEnd(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);

  let total = toNumber(space.basePricePerDay) * days;

  let current = new Date(start);
  for (let i = 0; i < days; i++) {
    if (current.getDay() === 0 || current.getDay() === 6) {
      total += toNumber(space.basePricePerDay) * (toNumber(space.weekendSurchargePercent) / 100);
    }
    current.setDate(current.getDate() + 1);
  }

  if (cateringRequired && space.offersCatering) {
    total *= (1 - toNumber(space.cateringDiscountPercent) / 100);
  }

  return Math.round(total * 100) / 100;
};

export const getFutureEventsBySpace = async (
  eventSpaceId: string,
  limit: number = 20
) => {
  const today = new Date();
  const todayStr = dateToYMD(today);
  
  return await db
    .select()
    .from(eventBookings)
    .where(
      and(
        eq(eventBookings.eventSpaceId, eventSpaceId),
        sql`${eventBookings.startDate}::date >= ${todayStr}::date`,
        inArray(eventBookings.status, ["confirmed", "pending"])
      )
    )
    .orderBy(eventBookings.startDate)
    .limit(limit);
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
      averageDurationDays: sql<number>`COALESCE(AVG(${eventBookings.durationDays}), 0)`,
      totalDaysBooked: sql<number>`COALESCE(SUM(${eventBookings.durationDays}), 0)`,
    })
    .from(eventBookings)
    .where(
      and(
        inArray(eventBookings.eventSpaceId, spaceIds),
        sql`${eventBookings.createdAt} >= NOW() - INTERVAL '30 days'`
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
      averageDurationDays: 0,
      totalDaysBooked: 0,
    },
    byEventType,
    totalSpaces: spaces.length,
    availableSpaces: spaces.filter(s => s.isActive).length
  };
};

export const checkBookingConflicts = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflictingBookings: any[] }> => {
  const startDateStr = dateToYMD(new Date(startDate));
  const endDateStr = dateToYMD(new Date(endDate));
  
  const conditions: any[] = [
    eq(eventBookings.eventSpaceId, eventSpaceId),
    // ✅ CRÍTICO: Incluir pending_approval para evitar múltiplas reservas
    inArray(eventBookings.status, ["pending_approval", "confirmed", "in_progress"]),
    or(
      sql`(${eventBookings.startDate}::date <= ${startDateStr}::date AND ${eventBookings.endDate}::date > ${startDateStr}::date)`,
      sql`(${eventBookings.startDate}::date <= ${endDateStr}::date AND ${eventBookings.endDate}::date > ${endDateStr}::date)`,
      sql`(${eventBookings.startDate}::date >= ${startDateStr}::date AND ${eventBookings.endDate}::date <= ${endDateStr}::date)`
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
    .orderBy(desc(eventBookings.startDate))
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
  const space = await getEventSpaceById(eventSpaceId);

  if (!space) return false;
  if (!space.isActive) return false;
  if (space.approvalRequired === true) return false;

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

// ==================== FUNÇÕES PARA SISTEMA DE CATERING ====================
export const offersCatering = async (eventSpaceId: string): Promise<boolean> => {
  const [space] = await db
    .select({ offersCatering: eventSpaces.offersCatering })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.offersCatering === true;
};

export const getCateringDiscountPercent = async (eventSpaceId: string): Promise<number> => {
  const [space] = await db
    .select({ cateringDiscountPercent: eventSpaces.cateringDiscountPercent })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return toNumber(space?.cateringDiscountPercent || 0);
};

export const getCateringMenuUrls = async (eventSpaceId: string): Promise<string[]> => {
  const [space] = await db
    .select({ cateringMenuUrls: eventSpaces.cateringMenuUrls })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.cateringMenuUrls || [];
};

// ==================== FUNÇÕES SIMPLES ====================
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

export const getSpaceMinCapacity = async (eventSpaceId: string): Promise<number> => {
  const [space] = await db
    .select({ capacityMin: eventSpaces.capacityMin })
    .from(eventSpaces)
    .where(eq(eventSpaces.id, eventSpaceId))
    .limit(1);

  return space?.capacityMin || 0;
};

// ==================== FUNÇÃO AUXILIAR: VERIFICAR SE ESPAÇO PODE SER RESERVADO ====================
export const canBookEventSpace = async (
  eventSpaceId: string,
  startDate: string,
  endDate: string,
  expectedAttendees: number
): Promise<{ 
  canBook: boolean; 
  message?: string;
  conflicts?: any[];
}> => {
  try {
    // 1. Verificar espaço
    const space = await getEventSpaceById(eventSpaceId);
    if (!space) {
      return { canBook: false, message: 'Espaço não encontrado' };
    }
    
    if (!space.isActive) {
      return { canBook: false, message: 'Espaço inativo' };
    }
    
    // 2. Verificar capacidade
    if (expectedAttendees < space.capacityMin) {
      return { canBook: false, message: `Número mínimo de participantes: ${space.capacityMin}` };
    }
    
    if (expectedAttendees > space.capacityMax) {
      return { canBook: false, message: `Número máximo de participantes: ${space.capacityMax}` };
    }
    
    // 3. Verificar disponibilidade (usando a função corrigida)
    const availability = await checkEventSpaceAvailability(eventSpaceId, startDate, endDate);
    if (!availability.isAvailable) {
      return { canBook: false, message: availability.message };
    }
    
    return { canBook: true, message: 'Espaço disponível para reserva' };
  } catch (error) {
    console.error('Erro ao verificar se espaço pode ser reservado:', error);
    return { canBook: false, message: 'Erro ao verificar disponibilidade' };
  }
};