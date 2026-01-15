// src/modules/hotels/hotelService.ts - VERSÃO FINAL LIMPA E CORRIGIDA (13/01/2026)
// Fonte única: hotels
// Corrigido: camelCase vs snake_case, tipagem Drizzle, remoção de SQL inválido

import { db } from "../../../db";
import {
  hotels,
  roomTypes,
  roomAvailability,
  hotelBookings,
} from "../../../shared/schema";
import { eq, and, sql, ilike, or, desc, inArray, gte, lte, between } from "drizzle-orm";
import { checkAvailabilityForDates } from "./roomTypeService";

// ==================== TIPOS ====================
export type Hotel = typeof hotels.$inferSelect;
export type HotelInsert = typeof hotels.$inferInsert;
export type HotelUpdate = Partial<HotelInsert>;

export type HotelBooking = typeof hotelBookings.$inferSelect;
export type HotelBookingInsert = typeof hotelBookings.$inferInsert;

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
  const [hotel] = await db.insert(hotels).values(data).returning();
  return hotel;
};

export const updateHotel = async (id: string, data: HotelUpdate): Promise<Hotel | null> => {
  const [hotel] = await db
    .update(hotels)
    .set({ ...data, updated_at: new Date() })
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