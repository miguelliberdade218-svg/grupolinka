// src/modules/hotels/roomTypeService.ts - VERSÃO COMPLETAMENTE CORRIGIDA
// Com tratamento adequado para stopSell (boolean | null)

import { db } from "../../../db";
import {
  roomTypes,
  roomAvailability,
  hotels,
  hotelBookings,
} from "../../../shared/schema";
import {
  eq,
  and,
  gte,
  lte,
  inArray,
  sql,
  desc,
  asc,
} from "drizzle-orm";

// ==================== TIPOS ====================
export type RoomType = typeof roomTypes.$inferSelect;
export type RoomTypeInsert = typeof roomTypes.$inferInsert;
export type RoomTypeUpdate = Partial<RoomTypeInsert>;

export type RoomAvailabilityEntry = typeof roomAvailability.$inferSelect;

// ==================== FUNÇÕES HELPER ====================
const toDecimalString = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return "0.00";
  if (typeof num === 'string') return num;
  return num.toFixed(2);
};

// Helper para garantir que stopSell seja boolean ou null
const ensureStopSell = (value: boolean | null | undefined): boolean | null => {
  if (value === null || value === undefined) return null;
  return Boolean(value);
};

// ==================== CRUD DE ROOM TYPES ====================

/**
 * Lista todos os tipos de quarto ativos de um hotel
 */
export const getRoomTypesByHotel = async (
  hotelId: string,
  includeInactive = false
): Promise<RoomType[]> => {
  const conditions = [eq(roomTypes.hotel_id, hotelId)];
  if (!includeInactive) {
    conditions.push(eq(roomTypes.is_active, true));
  }

  return await db
    .select()
    .from(roomTypes)
    .where(and(...conditions))
    .orderBy(asc(roomTypes.name));
};

/**
 * Obtém um tipo de quarto por ID
 */
export const getRoomTypeById = async (id: string): Promise<RoomType | null> => {
  const [roomType] = await db.select().from(roomTypes).where(eq(roomTypes.id, id));
  return roomType || null;
};

/**
 * Cria um novo tipo de quarto
 */
export const createRoomType = async (data: RoomTypeInsert): Promise<RoomType> => {
  const [roomType] = await db.insert(roomTypes).values(data).returning();
  return roomType;
};

/**
 * Atualiza um tipo de quarto
 */
export const updateRoomType = async (
  id: string,
  data: RoomTypeUpdate
): Promise<RoomType | null> => {
  const [roomType] = await db
    .update(roomTypes)
    .set(data)
    .where(eq(roomTypes.id, id))
    .returning();
  return roomType || null;
};

/**
 * Desativa (soft delete) um tipo de quarto
 */
export const deactivateRoomType = async (id: string): Promise<RoomType | null> => {
  return await updateRoomType(id, { is_active: false });
};

// ==================== DISPONIBILIDADE ETERNA / IMPLÍCITA ====================

/**
 * Verifica disponibilidade para um tipo de quarto em datas específicas
 * Lógica implícita: sem registo = disponível com total_units do roomType
 */
export const checkAvailabilityForDates = async (
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  unitsNeeded: number = 1
): Promise<{ available: boolean; minUnits: number; message: string }> => {
  // Buscar o room type primeiro para obter total_units
  const [roomType] = await db.select({ totalUnits: roomTypes.total_units })
    .from(roomTypes)
    .where(eq(roomTypes.id, roomTypeId))
    .limit(1);

  const totalUnits = roomType?.totalUnits ?? 0;
  
  // Converter strings para Date objects
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);
  
  // Buscar registos existentes
  const availability = await db
    .select({
      date: roomAvailability.date,
      availableUnits: roomAvailability.availableUnits,
      stopSell: roomAvailability.stopSell,
    })
    .from(roomAvailability)
    .where(and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      gte(roomAvailability.date, startDate),
      lte(roomAvailability.date, endDate)
    ));

  if (availability.length === 0) {
    return {
      available: totalUnits >= unitsNeeded,
      minUnits: totalUnits,
      message: "Disponível por padrão (sem restrições registadas)"
    };
  }

  // Verificar se algum dia tem stopSell (true)
  const hasStopSell = availability.some(a => a.stopSell === true);
  
  if (hasStopSell) {
    return {
      available: false,
      minUnits: 0,
      message: "Venda bloqueada em alguma data"
    };
  }

  // Calcular unidades mínimas disponíveis
  const minUnits = Math.min(...availability.map(a => Number(a.availableUnits || 0)), totalUnits);
  
  return {
    available: minUnits >= unitsNeeded,
    minUnits,
    message: minUnits >= unitsNeeded ? "Disponível" : "Unidades insuficientes"
  };
};

/**
 * Atualiza disponibilidade após reserva (subtrai unidades)
 * Cria registo se não existir (baseado em total_units)
 */
export const updateAvailabilityAfterBooking = async (
  roomTypeId: string,
  hotelId: string,
  checkIn: string,
  checkOut: string,
  units: number
): Promise<boolean> => {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);

    const [roomType] = await db
      .select({ totalUnits: roomTypes.total_units, basePrice: roomTypes.base_price })
      .from(roomTypes)
      .where(eq(roomTypes.id, roomTypeId))
      .limit(1);

    const totalUnits = roomType?.totalUnits ?? 0;
    const basePrice = roomType?.basePrice ?? "0.00";

    while (current < end) {
      const dateObj = new Date(current); // Usar Date object

      const [existing] = await db
        .select()
        .from(roomAvailability)
        .where(and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, dateObj)
        ))
        .limit(1);

      if (!existing) {
        // Cria registo com total_units - units
        await db.insert(roomAvailability).values({
          hotelId,
          roomTypeId,
          date: dateObj,
          price: basePrice,
          availableUnits: totalUnits - units,
          stopSell: null, // Inicialmente null (não false)
          minNights: 1,
          updatedAt: new Date(),
        });
      } else {
        // Atualiza existente
        await db
          .update(roomAvailability)
          .set({
            availableUnits: sql`${roomAvailability.availableUnits} - ${units}`,
            updatedAt: new Date(),
          })
          .where(eq(roomAvailability.id, existing.id));
      }

      current.setDate(current.getDate() + 1);
    }

    return true;
  } catch (error) {
    console.error("Erro ao atualizar disponibilidade após reserva:", error);
    return false;
  }
};

/**
 * Libera disponibilidade após cancelamento/rejeição (soma unidades)
 * Remove registo se availableUnits voltar ao total_units e sem stopSell
 */
export const releaseAvailabilityAfterCancellation = async (
  roomTypeId: string,
  hotelId: string,
  checkIn: string,
  checkOut: string,
  units: number
): Promise<boolean> => {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);

    const [roomType] = await db
      .select({ totalUnits: roomTypes.total_units })
      .from(roomTypes)
      .where(eq(roomTypes.id, roomTypeId))
      .limit(1);

    const totalUnits = roomType?.totalUnits ?? 0;

    while (current < end) {
      const dateObj = new Date(current);

      const [existing] = await db
        .select()
        .from(roomAvailability)
        .where(and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, dateObj)
        ))
        .limit(1);

      if (existing) {
        const newUnits = Number(existing.availableUnits) + units;

        if (newUnits >= totalUnits && existing.stopSell !== true && existing.price === "0.00") {
          // Volta ao padrão → remove registo (só se preço for 0.00/default)
          await db.delete(roomAvailability).where(eq(roomAvailability.id, existing.id));
        } else {
          await db
            .update(roomAvailability)
            .set({
              availableUnits: newUnits,
              updatedAt: new Date(),
            })
            .where(eq(roomAvailability.id, existing.id));
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return true;
  } catch (error) {
    console.error("Erro ao liberar disponibilidade após cancelamento:", error);
    return false;
  }
};

/**
 * Bulk update (preço, stopSell, etc.) - cria registo se não existir
 */
export const bulkUpdateAvailability = async (
  roomTypeId: string,
  updates: {
    date: string;
    price?: number;
    stopSell?: boolean | null;
    minNights?: number;
    availableUnits?: number; // opcional, se quiser forçar
  }[]
): Promise<number> => {
  if (updates.length === 0) return 0;

  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType || !roomType.hotel_id) throw new Error("RoomType inválido");

  let updatedCount = 0;

  await db.transaction(async (tx) => {
    for (const u of updates) {
      const dateObj = new Date(u.date);
      const [existing] = await tx
        .select()
        .from(roomAvailability)
        .where(and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, dateObj)
        ))
        .limit(1);

      // Garantir que stopSell seja boolean ou null
      const stopSellValue = ensureStopSell(u.stopSell !== undefined ? u.stopSell : existing?.stopSell);

      const values = {
        hotelId: roomType.hotel_id!,
        roomTypeId,
        date: dateObj,
        price: u.price !== undefined ? toDecimalString(u.price) : (existing?.price ?? "0.00"),
        availableUnits: u.availableUnits ?? (existing?.availableUnits ?? roomType.total_units ?? 0),
        stopSell: stopSellValue,
        minNights: u.minNights ?? (existing?.minNights ?? 1),
        updatedAt: new Date(),
      };

      if (existing) {
        await tx
          .update(roomAvailability)
          .set(values)
          .where(eq(roomAvailability.id, existing.id));
      } else {
        await tx.insert(roomAvailability).values(values);
      }
      updatedCount++;
    }
  });

  return updatedCount;
};

// ==================== FUNÇÕES DE LEITURA / RELATÓRIOS ====================

/**
 * Obtém o calendário de disponibilidade para um tipo de quarto em um período
 * Lógica implícita: preenche dias sem registo com valores padrão do roomType
 */
export const getAvailabilityCalendar = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  price: string;
  availableUnits: number;
  stopSell: boolean | null;
  minNights: number;
}>> => {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) throw new Error("RoomType não encontrado");

  const totalUnits = roomType.total_units ?? 0;
  const basePrice = roomType.base_price ?? "0.00";

  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const availability = await db
    .select({
      date: roomAvailability.date,
      price: roomAvailability.price,
      availableUnits: roomAvailability.availableUnits,
      stopSell: roomAvailability.stopSell,
      minNights: roomAvailability.minNights,
    })
    .from(roomAvailability)
    .where(and(
      eq(roomAvailability.roomTypeId, roomTypeId),
      gte(roomAvailability.date, startDateObj),
      lte(roomAvailability.date, endDateObj)
    ))
    .orderBy(asc(roomAvailability.date));

  // Preenche dias sem registo com valores padrão
  const result: Array<{
    date: string;
    price: string;
    availableUnits: number;
    stopSell: boolean | null;
    minNights: number;
  }> = [];
  const current = new Date(startDateObj);

  while (current <= endDateObj) {
    const dateStr = current.toISOString().split('T')[0];
    const entry = availability.find(a => {
      const entryDateStr = a.date.toISOString().split('T')[0];
      return entryDateStr === dateStr;
    });

    result.push({
      date: dateStr,
      price: entry ? entry.price : basePrice,
      availableUnits: entry ? Number(entry.availableUnits) : totalUnits,
      stopSell: entry ? entry.stopSell : null,
      minNights: entry ? Number(entry.minNights) : 1,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
};

/**
 * Obtém disponibilidade detalhada para um hotel inteiro (útil para dashboard)
 */
export const getHotelAvailabilitySummary = async (
  hotelId: string,
  startDate: string,
  endDate: string
) => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  return await db
    .select({
      roomType: roomTypes,
      date: roomAvailability.date,
      price: roomAvailability.price,
      availableUnits: roomAvailability.availableUnits,
      stopSell: roomAvailability.stopSell,
    })
    .from(roomAvailability)
    .innerJoin(roomTypes, eq(roomTypes.id, roomAvailability.roomTypeId))
    .where(
      and(
        eq(roomAvailability.hotelId, hotelId),
        gte(roomAvailability.date, startDateObj),
        lte(roomAvailability.date, endDateObj)
      )
    )
    .orderBy(roomTypes.name, roomAvailability.date);
};

/**
 * Verifica se um tipo de quarto tem reservas ativas (para prevenir desativação)
 */
export const hasActiveBookings = async (roomTypeId: string): Promise<boolean> => {
  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(hotelBookings)
    .where(
      and(
        eq(hotelBookings.roomTypeId, roomTypeId),
        inArray(hotelBookings.status, ["pending", "confirmed", "checked_in"])
      )
    );

  return (active[0]?.count || 0) > 0;
};

// ==================== FUNÇÕES ADICIONAIS ====================

/**
 * Inicializa ou atualiza disponibilidade para um tipo de quarto
 */
export const initializeAvailability = async (
  roomTypeId: string,
  startDate: string,
  endDate: string,
  defaultPrice: number,
  defaultUnits: number = 1,
  minNights: number = 1
): Promise<number> => {
  // Buscar informações do tipo de quarto
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType || !roomType.hotel_id) {
    throw new Error("Tipo de quarto não encontrado ou sem hotel associado");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let createdCount = 0;

  // Criar entrada para cada dia no período
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateObj = new Date(currentDate);

    // Verificar se já existe entrada para esta data
    const existing = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, dateObj)
        )
      );

    if (existing.length === 0) {
      await db.insert(roomAvailability).values({
        roomTypeId: roomTypeId,
        hotelId: roomType.hotel_id,
        date: dateObj,
        price: defaultPrice.toString(),
        availableUnits: defaultUnits,
        stopSell: null, // Inicialmente null
        minNights: minNights,
        maxStay: null,
        minStay: 1
      });
      createdCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return createdCount;
};

/**
 * Obter preços disponíveis para um tipo de quarto em um período
 */
export const getAvailablePrices = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number; available: boolean }>> => {
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);

  return availability.map((entry) => ({
    date: entry.date,
    price: Number(entry.price) || 0,
    available: entry.availableUnits > 0 && entry.stopSell !== true,
  }));
};

/**
 * Buscar disponibilidade para múltiplos tipos de quarto
 */
export const getMultiRoomTypeAvailability = async (
  roomTypeIds: string[],
  startDate: string,
  endDate: string
): Promise<Record<string, Array<{
  date: string;
  price: string;
  availableUnits: number;
  stopSell: boolean | null;
  minNights: number;
}>>> => {
  if (roomTypeIds.length === 0) return {};

  const result: Record<string, Array<{
    date: string;
    price: string;
    availableUnits: number;
    stopSell: boolean | null;
    minNights: number;
  }>> = {};

  for (const roomTypeId of roomTypeIds) {
    result[roomTypeId] = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  }

  return result;
};

/**
 * Verificar compatibilidade de estadia mínima (min nights)
 */
export const checkMinNightsCompliance = async (
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): Promise<{ compliant: boolean; requiredMinNights: number; actualNights: number }> => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const actualNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const availability = await getAvailabilityCalendar(roomTypeId, checkIn, checkOut);
  
  if (availability.length === 0) {
    return {
      compliant: actualNights >= 1,
      requiredMinNights: 1,
      actualNights
    };
  }

  const maxMinNights = Math.max(...availability.map(a => a.minNights));
  const compliant = actualNights >= maxMinNights;

  return {
    compliant,
    requiredMinNights: maxMinNights,
    actualNights,
  };
};

/**
 * Obter estatísticas de ocupação para um tipo de quarto
 */
export const getRoomTypeOccupancyStats = async (
  roomTypeId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  totalUnits: number;
  bookedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  averagePrice: number;
}> => {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    throw new Error("Tipo de quarto não encontrado");
  }

  const totalUnits = roomType.total_units || 0;
  
  const conditions: any[] = [
    eq(hotelBookings.roomTypeId, roomTypeId),
    inArray(hotelBookings.status, ["confirmed", "checked_in", "pending"]),
  ];

  if (startDate && endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    conditions.push(
      sql`${hotelBookings.checkIn}::date >= ${startDateObj}`,
      sql`${hotelBookings.checkOut}::date <= ${endDateObj}`
    );
  }

  const bookings = await db
    .select({
      totalBookedUnits: sql<number>`COALESCE(SUM(units), 0)`.as("total_booked_units"),
      totalRevenue: sql<number>`COALESCE(SUM(totalPrice), 0)`.as("total_revenue"),
    })
    .from(hotelBookings)
    .where(and(...conditions));

  const bookedUnits = Number(bookings[0]?.totalBookedUnits || 0);
  const availableUnits = Math.max(0, totalUnits - bookedUnits);
  const occupancyRate = totalUnits > 0 ? (bookedUnits / totalUnits) * 100 : 0;
  const averagePrice = bookedUnits > 0 ? Number(bookings[0]?.totalRevenue || 0) / bookedUnits : 0;

  return {
    totalUnits,
    bookedUnits,
    availableUnits,
    occupancyRate,
    averagePrice,
  };
};

/**
 * Sincronizar disponibilidade com o total de unidades do tipo de quarto
 */
export const syncAvailabilityWithTotalUnits = async (
  roomTypeId: string
): Promise<number> => {
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType || !roomType.total_units) {
    throw new Error("Tipo de quarto não encontrado ou sem total_units definido");
  }

  const totalUnits = roomType.total_units;

  // Para cada entrada de disponibilidade, ajustar availableUnits se necessário
  await db
    .update(roomAvailability)
    .set({
      availableUnits: sql`LEAST(${roomAvailability.availableUnits}, ${totalUnits})`,
      updatedAt: new Date()
    })
    .where(
      eq(roomAvailability.roomTypeId, roomTypeId)
    );

  // Contar quantas entradas foram atualizadas
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        sql`${roomAvailability.availableUnits} > ${totalUnits}`
      )
    );

  return Number(result[0]?.count || 0);
};

/**
 * Verificar conflitos de preços (preços inconsistentes em datas consecutivas)
 */
export const checkPriceConsistency = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number; previousPrice: number; differencePercent: number }>> => {
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  if (availability.length < 2) return [];

  const inconsistencies: Array<{ date: string; price: number; previousPrice: number; differencePercent: number }> = [];

  for (let i = 1; i < availability.length; i++) {
    const current = availability[i];
    const previous = availability[i - 1];
    
    const currentPrice = Number(current.price || 0);
    const previousPrice = Number(previous.price || 0);
    
    if (previousPrice === 0) continue;
    
    const differencePercent = Math.abs((currentPrice - previousPrice) / previousPrice) * 100;
    
    // Considerar inconsistência se a diferença for maior que 30%
    if (differencePercent > 30) {
      inconsistencies.push({
        date: current.date,
        price: currentPrice,
        previousPrice: previousPrice,
        differencePercent: Math.round(differencePercent * 100) / 100
      });
    }
  }

  return inconsistencies;
};

/**
 * Exportar calendário de disponibilidade para CSV/Excel
 */
export const exportAvailabilityCalendar = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  price: string;
  availableUnits: number;
  status: string;
  minNights: number;
}>> => {
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  return availability.map(entry => ({
    date: entry.date,
    price: `MZN ${Number(entry.price).toFixed(2)}`,
    availableUnits: entry.availableUnits,
    status: entry.stopSell === true ? "Não Disponível" : entry.availableUnits > 0 ? "Disponível" : "Esgotado",
    minNights: entry.minNights || 1
  }));
};

/**
 * Atualizar preço base para todas as datas futuras
 */
export const updateBasePriceForFutureDates = async (
  roomTypeId: string,
  newBasePrice: number,
  effectiveFrom: string = new Date().toISOString().split("T")[0]
): Promise<number> => {
  const effectiveDate = new Date(effectiveFrom);
  
  await db
    .update(roomAvailability)
    .set({
      price: newBasePrice.toString(),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, effectiveDate)
      )
    );

  // Obter número de linhas afetadas
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, effectiveDate)
      )
    );

  return Number(countResult[0]?.count || 0);
};

/**
 * Obter todas as datas com disponibilidade zero (esgotado)
 */
export const getSoldOutDates = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<string[]> => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const availability = await db
    .select({
      date: roomAvailability.date,
    })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, startDateObj),
        lte(roomAvailability.date, endDateObj),
        eq(roomAvailability.availableUnits, 0)
      )
    )
    .orderBy(roomAvailability.date);

  return availability.map(entry => entry.date.toISOString().split("T")[0]);
};

/**
 * Obter datas com stop sell ativo
 */
export const getStopSellDates = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<string[]> => {
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const availability = await db
    .select({
      date: roomAvailability.date,
    })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, startDateObj),
        lte(roomAvailability.date, endDateObj),
        eq(roomAvailability.stopSell, true)
      )
    )
    .orderBy(roomAvailability.date);

  return availability.map(entry => entry.date.toISOString().split("T")[0]);
};

/**
 * Calcular receita potencial para um período
 */
export const calculatePotentialRevenue = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  return availability.reduce((total, entry) => {
    if (entry.availableUnits > 0 && entry.stopSell !== true) {
      return total + (Number(entry.price) * entry.availableUnits);
    }
    return total;
  }, 0);
};

export default {
  getRoomTypesByHotel,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deactivateRoomType,
  checkAvailabilityForDates,
  updateAvailabilityAfterBooking,
  releaseAvailabilityAfterCancellation,
  bulkUpdateAvailability,
  getAvailabilityCalendar,
  getHotelAvailabilitySummary,
  hasActiveBookings,
  initializeAvailability,
  getAvailablePrices,
  getMultiRoomTypeAvailability,
  checkMinNightsCompliance,
  getRoomTypeOccupancyStats,
  syncAvailabilityWithTotalUnits,
  checkPriceConsistency,
  exportAvailabilityCalendar,
  updateBasePriceForFutureDates,
  getSoldOutDates,
  getStopSellDates,
  calculatePotentialRevenue,
};