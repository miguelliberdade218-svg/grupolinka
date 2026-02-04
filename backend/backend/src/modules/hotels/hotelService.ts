// src/modules/hotels/hotelService.ts - VERSÃO FINAL LIMPA E CORRIGIDA (03/02/2026)
// ✅ CORREÇÃO APLICADA: País sempre "Moçambique" (forçado em createHotel e updateHotel)
// ✅ ATUALIZADO: Adicionada validação de location_id

import { db } from "../../../db";
import {
  hotels,
  roomTypes,
  roomAvailability,
  hotelBookings,
  mozambiqueLocations,
} from "../../../shared/schema";
import { eq, and, sql, ilike, or, desc, inArray, gte, lte, between } from "drizzle-orm";
import { checkAvailabilityForDates } from "./roomTypeService";

// ==================== TIPOS ====================
export type Hotel = typeof hotels.$inferSelect;
export type HotelInsert = typeof hotels.$inferInsert;
export type HotelUpdate = Partial<HotelInsert>;

export type HotelBooking = typeof hotelBookings.$inferSelect;
export type HotelBookingInsert = typeof hotelBookings.$inferInsert;

// ==================== FUNÇÕES AUXILIARES ====================
const validateLocationId = async (locationId: string): Promise<boolean> => {
  if (!locationId) return false;
  
  try {
    const locationExists = await db
      .select({ id: mozambiqueLocations.id })
      .from(mozambiqueLocations)
      .where(eq(mozambiqueLocations.id, locationId))
      .limit(1);
    
    return locationExists.length > 0;
  } catch (error) {
    console.error('Erro ao validar location_id:', error);
    return false;
  }
};

const findNearestLocation = async (
  lat: number | string | null,
  lng: number | string | null,
  maxDistanceKm: number = 5
): Promise<string | null> => {
  if (!lat || !lng) return null;
  
  try {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (isNaN(latNum) || isNaN(lngNum)) return null;
    
    // Buscar localização mais próxima usando cálculo de distância
    const nearest = await db.execute(sql`
      SELECT 
        id,
        name,
        province,
        district,
        (6371 * acos(
          cos(radians(${latNum})) * 
          cos(radians(${mozambiqueLocations.lat}::numeric)) * 
          cos(radians(${mozambiqueLocations.lng}::numeric) - radians(${lngNum})) + 
          sin(radians(${latNum})) * 
          sin(radians(${mozambiqueLocations.lat}::numeric))
        )) as distance_km
      FROM ${mozambiqueLocations}
      WHERE ${mozambiqueLocations.lat} IS NOT NULL 
        AND ${mozambiqueLocations.lng} IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 1
    `);
    
    const location = (nearest as any).rows?.[0];
    
    if (location && location.distance_km <= maxDistanceKm) {
      return location.id;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar localização mais próxima:', error);
    return null;
  }
};

// ==================== BUSCA PRINCIPAL ====================
export async function searchHotels(filters: {
  query?: string;
  locality?: string;
  province?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  isActive?: boolean;
}) {
  const {
    query,
    locality,
    province,
    checkIn,
    checkOut,
    guests = 2,
    isActive = true,
  } = filters;

  const whereConditions: any[] = [eq(hotels.is_active, isActive)];

  if (query) {
    // Correção: usar like direto nas colunas em vez de sql`f_unaccent()`
    whereConditions.push(
      or(
        ilike(hotels.name, `%${query}%`),
        ilike(hotels.description, `%${query}%`)
      )
    );
  }

  if (locality) {
    whereConditions.push(ilike(hotels.locality, `%${locality}%`));
  }

  if (province) {
    whereConditions.push(ilike(hotels.province, `%${province}%`));
  }

  let hotelsList = await db
    .select()
    .from(hotels)
    .where(and(...whereConditions))
    .orderBy(desc(hotels.rating), hotels.name)
    .limit(50);

  // Filtro de disponibilidade (eterna/implícita)
  if (checkIn && checkOut && hotelsList.length > 0) {
    const hotelIds = hotelsList.map((h) => h.id);

    const availableHotels = await Promise.all(
      hotelIds.map(async (hotelId) => {
        const roomTypesOfHotel = await db
          .select({ roomTypeId: roomTypes.id })
          .from(roomTypes)
          .where(and(eq(roomTypes.hotel_id, hotelId), eq(roomTypes.is_active, true)));

        for (const { roomTypeId } of roomTypesOfHotel) {
          const { available } = await checkAvailabilityForDates(
            roomTypeId,
            checkIn,
            checkOut,
            guests
          );
          if (available) return true;
        }
        return false;
      })
    );

    hotelsList = hotelsList.filter((_, index) => availableHotels[index]);
  }

  return hotelsList;
}

// ==================== CRUD SIMPLES ====================
export const getHotelById = async (id: string): Promise<Hotel | null> => {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
  return hotel ?? null;
};

export const getHotelBySlug = async (slug: string): Promise<Hotel | null> => {
  const [hotel] = await db.select().from(hotels).where(eq(hotels.slug, slug));
  return hotel ?? null;
};

export const getHotelsByHost = async (hostId: string): Promise<Hotel[]> => {
  return await db
    .select()
    .from(hotels)
    .where(and(eq(hotels.host_id, hostId), eq(hotels.is_active, true)))
    .orderBy(hotels.name);
};

export const createHotel = async (data: HotelInsert): Promise<Hotel> => {
  // ✅ CORREÇÃO: Forçar país como "Moçambique" sempre
  const normalizedData = {
    ...data,
    country: 'Moçambique', // ✅ FORÇAR sempre Moçambique
  };
  
  // ✅ VALIDAÇÃO DE location_id
  if (normalizedData.location_id) {
    const isValid = await validateLocationId(normalizedData.location_id);
    if (!isValid) {
      console.warn(`⚠️ location_id ${normalizedData.location_id} não encontrado em mozambique_locations`);
      // Opcional: remover location_id inválido ou lançar erro
      // delete normalizedData.location_id;
    }
  }
  
  // ✅ SUGESTÃO AUTOMÁTICA DE location_id (opcional)
  if (!normalizedData.location_id && normalizedData.lat && normalizedData.lng) {
    const nearestLocationId = await findNearestLocation(normalizedData.lat, normalizedData.lng, 10);
    if (nearestLocationId) {
      console.log(`📍 Sugerindo location_id ${nearestLocationId} para hotel com coordenadas`);
      // Opcional: atribuir automaticamente
      // normalizedData.location_id = nearestLocationId;
    }
  }
  
  const [hotel] = await db.insert(hotels).values(normalizedData).returning();
  return hotel;
};

export const updateHotel = async (id: string, data: HotelUpdate): Promise<Hotel | null> => {
  // ✅ CORREÇÃO: Forçar país como "Moçambique" sempre
  const normalizedData = {
    ...data,
    country: 'Moçambique', // ✅ FORÇAR sempre Moçambique
  };
  
  // ✅ VALIDAÇÃO DE location_id
  if (normalizedData.location_id) {
    const isValid = await validateLocationId(normalizedData.location_id);
    if (!isValid) {
      console.warn(`⚠️ location_id ${normalizedData.location_id} não encontrado em mozambique_locations`);
      // Opcional: remover location_id inválido
      delete normalizedData.location_id;
    }
  }
  
  // ✅ SINCRONIZAÇÃO AUTOMÁTICA (opcional)
  if (!normalizedData.location_id && normalizedData.lat && normalizedData.lng) {
    const nearestLocationId = await findNearestLocation(normalizedData.lat, normalizedData.lng, 5);
    if (nearestLocationId) {
      console.log(`🔄 Sincronizando location_id ${nearestLocationId} para hotel ${id}`);
      normalizedData.location_id = nearestLocationId;
    }
  }
  
  const [hotel] = await db
    .update(hotels)
    .set({ ...normalizedData, updated_at: new Date() })
    .where(eq(hotels.id, id))
    .returning();
  return hotel ?? null;
};

export const isHotelOwner = async (hotelId: string, userId: string): Promise<boolean> => {
  const [hotel] = await db
    .select({ hostId: hotels.host_id })
    .from(hotels)
    .where(eq(hotels.id, hotelId));
  return hotel?.hostId === userId;
};

// ==================== SINCRONIZAÇÃO DE LOCALIZAÇÃO ====================
export const syncHotelLocation = async (
  hotelId: string, 
  maxDistanceKm: number = 5
): Promise<{ success: boolean; locationId?: string; distanceKm?: number; message: string }> => {
  try {
    const hotel = await getHotelById(hotelId);
    if (!hotel) {
      return { success: false, message: 'Hotel não encontrado' };
    }
    
    if (!hotel.lat || !hotel.lng) {
      return { success: false, message: 'Hotel não tem coordenadas para sincronizar' };
    }
    
    const nearestLocationId = await findNearestLocation(hotel.lat, hotel.lng, maxDistanceKm);
    
    if (!nearestLocationId) {
      return { 
        success: false, 
        message: 'Nenhuma localização próxima encontrada',
        distanceKm: undefined
      };
    }
    
    // Atualizar hotel com location_id
    await updateHotel(hotelId, { location_id: nearestLocationId });
    
    return { 
      success: true, 
      locationId: nearestLocationId,
      message: 'Localização sincronizada com sucesso'
    };
  } catch (error) {
    console.error('Erro ao sincronizar localização do hotel:', error);
    return { 
      success: false, 
      message: 'Erro ao sincronizar localização' 
    };
  }
};

// ==================== BUSCA COM LOCALIZAÇÃO EXATA ====================
export const searchHotelsNearby = async (
  lat: number,
  lng: number,
  radiusKm: number = 50,
  useExactLocations: boolean = false
) => {
  if (useExactLocations) {
    // ✅ BUSCA USANDO LOCALIZAÇÕES EXATAS
    return await db.execute(sql`
      SELECT 
        h.*,
        ml.name as exact_location_name,
        ml.province as exact_province,
        ml.district as exact_district,
        ml.type as location_type,
        -- Distância da localização exata
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(${mozambiqueLocations.lat}::numeric)) * 
          cos(radians(${mozambiqueLocations.lng}::numeric) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(${mozambiqueLocations.lat}::numeric))
        )) as distance_from_exact_location_km,
        -- Distância do hotel (fallback)
        (6371 * acos(
          cos(radians(${lat})) * 
          cos(radians(${hotels.lat}::numeric)) * 
          cos(radians(${hotels.lng}::numeric) - radians(${lng})) + 
          sin(radians(${lat})) * 
          sin(radians(${hotels.lat}::numeric))
        )) as distance_from_hotel_km
      FROM ${hotels} h
      LEFT JOIN ${mozambiqueLocations} ml ON h.location_id = ml.id
      WHERE h.is_active = true
        AND (
          -- Se tem location_id, usa distância da localização exata
          (h.location_id IS NOT NULL AND 
           (6371 * acos(
             cos(radians(${lat})) * 
             cos(radians(${mozambiqueLocations.lat}::numeric)) * 
             cos(radians(${mozambiqueLocations.lng}::numeric) - radians(${lng})) + 
             sin(radians(${lat})) * 
             sin(radians(${mozambiqueLocations.lat}::numeric))
           )) <= ${radiusKm})
          OR
          -- Se não tem location_id, usa distância do hotel (fallback)
          (h.location_id IS NULL AND h.lat IS NOT NULL AND h.lng IS NOT NULL AND
           (6371 * acos(
             cos(radians(${lat})) * 
             cos(radians(${hotels.lat}::numeric)) * 
             cos(radians(${hotels.lng}::numeric) - radians(${lng})) + 
             sin(radians(${lat})) * 
             sin(radians(${hotels.lat}::numeric))
           )) <= ${radiusKm})
        )
      ORDER BY 
        CASE 
          WHEN h.location_id IS NOT NULL THEN 1  -- Prioridade para hotéis com localização exata
          ELSE 2
        END,
        COALESCE(
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${mozambiqueLocations.lat}::numeric)) * 
            cos(radians(${mozambiqueLocations.lng}::numeric) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${mozambiqueLocations.lat}::numeric))
          )),
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${hotels.lat}::numeric)) * 
            cos(radians(${hotels.lng}::numeric) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${hotels.lat}::numeric))
          ))
        ) ASC
      LIMIT 50
    `);
  } else {
    // Busca tradicional (mantida para compatibilidade)
    return await db
      .select()
      .from(hotels)
      .where(
        and(
          eq(hotels.is_active, true),
          sql`${hotels.lat} IS NOT NULL`,
          sql`${hotels.lng} IS NOT NULL`,
          sql`(6371 * acos(
            cos(radians(${lat})) * cos(radians(${hotels.lat})) *
            cos(radians(${hotels.lng}) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(${hotels.lat}))
          )) <= ${radiusKm}`
        )
      )
      .orderBy(sql`
        (6371 * acos(
          cos(radians(${lat})) * cos(radians(${hotels.lat})) *
          cos(radians(${hotels.lng}) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(${hotels.lat}))
        ))
      `)
      .limit(20);
  }
};

// ==================== BUSCA POR LOCALIZAÇÃO ID ====================
export const getHotelsByLocationId = async (locationId: string): Promise<Hotel[]> => {
  return await db
    .select()
    .from(hotels)
    .where(
      and(
        eq(hotels.location_id, locationId),
        eq(hotels.is_active, true)
      )
    )
    .orderBy(desc(hotels.rating), hotels.name);
};

export const getHotelsWithLocations = async (hotelIds: string[]) => {
  return await db
    .select({
      hotel: hotels,
      location: mozambiqueLocations,
    })
    .from(hotels)
    .leftJoin(mozambiqueLocations, eq(hotels.location_id, mozambiqueLocations.id))
    .where(inArray(hotels.id, hotelIds));
};

// ==================== DASHBOARD ====================
export const getHostDashboardSummary = async (hostId: string) => {
  const userHotels = await getHotelsByHost(hostId);

  if (userHotels.length === 0) {
    return {
      totalHotels: 0,
      totalBookings: 0,
      activeBookings: 0,
      occupancyRate: 0,
      totalRevenue: 0,
    };
  }

  const hotelIds = userHotels.map((h) => h.id);

  const [stats] = await db
    .select({
      totalBookings: sql<number>`count(*)`,
      activeBookings: sql<number>`count(*) filter (where status = 'confirmed')`,
      totalRevenue: sql<number>`coalesce(sum(total_price), 0)`,
    })
    .from(hotelBookings)
    .where(inArray(hotelBookings.hotelId, hotelIds));

  return {
    totalHotels: userHotels.length,
    totalBookings: Number(stats.totalBookings || 0),
    activeBookings: Number(stats.activeBookings || 0),
    occupancyRate: 0,
    totalRevenue: Number(stats.totalRevenue || 0),
  };
};

// ==================== FUNÇÕES ÚTEIS ====================
export const getHotelWithRoomTypes = async (hotelId: string) => {
  const hotel = await getHotelById(hotelId);
  if (!hotel) return null;

  const hotelRooms = await db
    .select()
    .from(roomTypes)
    .where(and(eq(roomTypes.hotel_id, hotelId), eq(roomTypes.is_active, true)));

  return {
    ...hotel,
    roomTypes: hotelRooms,
  };
};

export const deactivateHotel = async (hotelId: string, userId: string): Promise<boolean> => {
  const isOwner = await isHotelOwner(hotelId, userId);
  if (!isOwner) return false;

  await db
    .update(hotels)
    .set({ is_active: false, updated_at: new Date(), updated_by: userId })
    .where(eq(hotels.id, hotelId));

  return true;
};

export const activateHotel = async (hotelId: string, userId: string): Promise<boolean> => {
  const isOwner = await isHotelOwner(hotelId, userId);
  if (!isOwner) return false;

  await db
    .update(hotels)
    .set({ is_active: true, updated_at: new Date(), updated_by: userId })
    .where(eq(hotels.id, hotelId));

  return true;
};

// ==================== PESQUISA AVANÇADA ====================
export const searchHotelsByLocation = async (
  lat: number,
  lng: number,
  radiusKm: number = 50
) => {
  // Correção: Usar condição SQL direta para cálculo de distância
  return await db
    .select()
    .from(hotels)
    .where(eq(hotels.is_active, true))
    .orderBy(sql`
      CASE 
        WHEN ${hotels.lat} IS NULL OR ${hotels.lng} IS NULL THEN 999999
        ELSE (
          6371 * acos(
            cos(radians(${lat})) * cos(radians(${hotels.lat})) *
            cos(radians(${hotels.lng}) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(${hotels.lat}))
          )
        )
      END
    `)
    .limit(20);
};

export const getHotelsByProvince = async (province: string): Promise<Hotel[]> => {
  return await db
    .select()
    .from(hotels)
    .where(and(eq(hotels.province, province), eq(hotels.is_active, true)))
    .orderBy(hotels.name);
};

export const getHotelsByLocality = async (locality: string): Promise<Hotel[]> => {
  return await db
    .select()
    .from(hotels)
    .where(and(eq(hotels.locality, locality), eq(hotels.is_active, true)))
    .orderBy(desc(hotels.rating), hotels.name);
};

// ==================== DISPONIBILIDADE ====================
export const getHotelAvailability = async (
  hotelId: string,
  startDate: string,
  endDate: string,
  roomTypeId?: string
) => {
  const conditions: any[] = [
    eq(roomAvailability.hotelId, hotelId),
    sql`${roomAvailability.date}::date BETWEEN ${startDate}::date AND ${endDate}::date`,
    sql`${roomAvailability.availableUnits} > 0`,
    eq(roomAvailability.stopSell, false)
  ];

  if (roomTypeId) {
    conditions.push(eq(roomAvailability.roomTypeId, roomTypeId));
  }

  return await db
    .select({
      date: roomAvailability.date,
      roomTypeId: roomAvailability.roomTypeId,
      price: roomAvailability.price,
      availableUnits: roomAvailability.availableUnits,
      roomTypeName: roomTypes.name,
      baseOccupancy: roomTypes.base_occupancy
    })
    .from(roomAvailability)
    .innerJoin(roomTypes, eq(roomTypes.id, roomAvailability.roomTypeId))
    .where(and(...conditions))
    .orderBy(roomAvailability.date, roomTypes.name);
};

// ==================== RELATÓRIOS ====================
export const getHotelPerformanceReport = async (
  hotelId: string,
  startDate: string,
  endDate: string
) => {
  const bookings = await db
    .select({
      totalBookings: sql<number>`COUNT(*)`,
      confirmedBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'confirmed')`,
      cancelledBookings: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')`,
      totalRevenue: sql<number>`COALESCE(SUM(total_price), 0)`,
      paidRevenue: sql<number>`COALESCE(SUM(total_price) FILTER (WHERE payment_status = 'paid'), 0)`,
      averageStayLength: sql<number>`COALESCE(AVG(nights), 0)`,
      occupancyRate: sql<number>`COALESCE(
        (SUM(units * nights)::float / 
        (SELECT COALESCE(SUM(total_units), 1) FROM room_types WHERE hotel_id = ${hotelId} AND is_active = true)::float * 100), 0
      )`
    })
    .from(hotelBookings)
    .where(
      and(
        eq(hotelBookings.hotelId, hotelId),
        sql`${hotelBookings.createdAt}::date BETWEEN ${startDate}::date AND ${endDate}::date`
      )
    );

  return bookings[0] || {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    averageStayLength: 0,
    occupancyRate: 0
  };
};

export default {
  searchHotels,
  getHotelById,
  getHotelBySlug,
  getHotelsByHost,
  createHotel,
  updateHotel,
  isHotelOwner,
  syncHotelLocation,
  searchHotelsNearby,
  getHotelsByLocationId,
  getHotelsWithLocations,
  getHostDashboardSummary,
  getHotelWithRoomTypes,
  deactivateHotel,
  activateHotel,
  searchHotelsByLocation,
  getHotelsByProvince,
  getHotelsByLocality,
  getHotelAvailability,
  getHotelPerformanceReport,
};