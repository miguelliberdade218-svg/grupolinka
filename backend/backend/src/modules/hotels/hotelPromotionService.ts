// src/modules/hotels/hotelPromotionService.ts - VERSÃO FINAL 100% CORRIGIDA (08/01/2026)

import { db } from "../../../db";
import {
  hotelPromotions,
  hotelSeasons,
  longStayDiscountSettings,
  roomTypes,
  roomAvailability,
} from "../../../shared/schema";
import { eq, and, gte, lte, sql, or, desc } from "drizzle-orm";

// ==================== TIPOS ====================
export type HotelPromotion = typeof hotelPromotions.$inferSelect;
export type HotelSeason = typeof hotelSeasons.$inferSelect;
export type LongStayDiscountSetting = typeof longStayDiscountSettings.$inferSelect;

// ==================== FUNÇÕES HELPER ====================
const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Converte string "YYYY-MM-DD" para Date
const toDate = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return input;
  
  const cleaned = input.split('T')[0];
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
};

// Converte para string "YYYY-MM-DD"
const toDateString = (input: string | Date | null | undefined): string | null => {
  if (!input) return null;
  if (input instanceof Date) {
    return input.toISOString().split('T')[0];
  }
  const cleaned = input.split('T')[0];
  return cleaned && cleaned.match(/^\d{4}-\d{2}-\d{2}$/) ? cleaned : null;
};

const getDateString = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

// ==================== PROMOÇÕES ====================

export const getActivePromotions = async (
  hotelId: string,
  date?: string
): Promise<HotelPromotion[]> => {
  const targetDate = date ? toDate(date) : new Date();
  if (!targetDate) return [];

  return await db
    .select()
    .from(hotelPromotions)
    .where(
      and(
        eq(hotelPromotions.hotel_id, hotelId),
        eq(hotelPromotions.is_active, true),
        lte(hotelPromotions.start_date, targetDate),
        gte(hotelPromotions.end_date, targetDate)
      )
    );
};

export const applyPromotion = async (
  basePrice: number,
  promoCode: string | null | undefined,
  hotelId: string,
  checkInDate?: string
): Promise<{
  finalPrice: number;
  discountAmount: number;
  appliedPromotion?: HotelPromotion;
}> => {
  if (!promoCode) {
    return { finalPrice: basePrice, discountAmount: 0 };
  }

  const promotions = await getActivePromotions(hotelId, checkInDate);
  const promotion = promotions.find(
    (p) => p.promo_code?.toLowerCase() === promoCode.toLowerCase()
  );

  if (!promotion) {
    return { finalPrice: basePrice, discountAmount: 0 };
  }

  let discountAmount = 0;

  if (promotion.discount_percent !== null && promotion.discount_percent !== undefined) {
    discountAmount = basePrice * (promotion.discount_percent / 100);
  } else if (promotion.discount_amount !== null && promotion.discount_amount !== undefined) {
    discountAmount = toNumber(promotion.discount_amount);
  }

  const currentUses = promotion.current_uses ?? 0;
  if (promotion.max_uses && currentUses >= promotion.max_uses) {
    return { finalPrice: basePrice, discountAmount: 0 };
  }

  return {
    finalPrice: basePrice - discountAmount,
    discountAmount,
    appliedPromotion: promotion,
  };
};

// CRIAR PROMOÇÃO - discount_percent como number, discount_amount como string, datas como Date
export const createPromotion = async (
  data: {
    hotel_id: string;
    promo_code: string;
    name: string;
    description?: string | null;
    discount_percent?: number | null;
    discount_amount?: number | null;
    start_date: string;
    end_date: string;
    max_uses?: number | null;
    is_active?: boolean;
  }
): Promise<HotelPromotion> => {
  const startDate = toDate(data.start_date);
  const endDate = toDate(data.end_date);

  if (!startDate || !endDate) {
    throw new Error("Datas inválidas: start_date e end_date devem ser YYYY-MM-DD");
  }

  const promotionData = {
    hotel_id: data.hotel_id,
    promo_code: data.promo_code,
    name: data.name,
    description: data.description || null,
    discount_percent: data.discount_percent ?? null, // number
    discount_amount: data.discount_amount != null ? data.discount_amount.toFixed(2) : null, // string
    start_date: startDate,
    end_date: endDate,
    max_uses: data.max_uses ?? null,
    current_uses: 0,
    is_active: data.is_active ?? true,
  };

  const [promotion] = await db.insert(hotelPromotions).values(promotionData).returning();
  return promotion;
};

// ATUALIZAR PROMOÇÃO
export const updatePromotion = async (
  id: string,
  data: Partial<{
    name?: string;
    description?: string | null;
    is_active?: boolean;
    promo_code?: string;
    discount_percent?: number | null;
    discount_amount?: number | null;
    start_date?: string;
    end_date?: string;
    max_uses?: number | null;
  }>
): Promise<HotelPromotion | null> => {
  const updateData: any = { ...data };

  if (data.discount_percent !== undefined) {
    updateData.discount_percent = data.discount_percent ?? null;
  }
  if (data.discount_amount !== undefined) {
    updateData.discount_amount = data.discount_amount != null ? data.discount_amount.toFixed(2) : null;
  }
  if (data.start_date !== undefined) {
    const date = toDate(data.start_date);
    if (!date) throw new Error("start_date inválida");
    updateData.start_date = date;
  }
  if (data.end_date !== undefined) {
    const date = toDate(data.end_date);
    if (!date) throw new Error("end_date inválida");
    updateData.end_date = date;
  }

  const [promotion] = await db
    .update(hotelPromotions)
    .set(updateData)
    .where(eq(hotelPromotions.id, id))
    .returning();

  return promotion || null;
};

export const getPromotionsByHotel = async (
  hotelId: string
): Promise<HotelPromotion[]> => {
  return await db
    .select()
    .from(hotelPromotions)
    .where(eq(hotelPromotions.hotel_id, hotelId))
    .orderBy(hotelPromotions.start_date);
};

// ==================== TEMPORADAS (campos são string) ====================

export const getSeasonMultiplier = async (
  hotelId: string,
  date: string
): Promise<number> => {
  const targetDateStr = toDateString(date);
  if (!targetDateStr) return 1.0;

  const seasons = await db
    .select()
    .from(hotelSeasons)
    .where(
      and(
        eq(hotelSeasons.hotelId, hotelId),
        eq(hotelSeasons.isActive, true),
        lte(hotelSeasons.startDate, targetDateStr),
        gte(hotelSeasons.endDate, targetDateStr)
      )
    )
    .orderBy(desc(hotelSeasons.multiplier))
    .limit(1);

  if (seasons.length === 0) return 1.0;

  return toNumber(seasons[0].multiplier);
};

export const applySeasonPricing = async (
  basePrice: number,
  hotelId: string,
  date: string
): Promise<number> => {
  const multiplier = await getSeasonMultiplier(hotelId, date);
  return basePrice * multiplier;
};

export const getSeasonsByHotel = async (hotelId: string): Promise<HotelSeason[]> => {
  return await db
    .select()
    .from(hotelSeasons)
    .where(eq(hotelSeasons.hotelId, hotelId))
    .orderBy(hotelSeasons.startDate);
};

// ==================== LONGA ESTADIA ====================

export const getLongStayDiscountPercent = async (
  hotelId: string,
  nights: number
): Promise<number> => {
  try {
    const [settings] = await db
      .select()
      .from(longStayDiscountSettings)
      .where(and(
        eq(longStayDiscountSettings.hotelId, hotelId),
        eq(longStayDiscountSettings.isActive, true)
      ))
      .limit(1);

    if (!settings) return 0;

    const tier7 = toNumber(settings.tier7NightsPercent);
    const tier14 = toNumber(settings.tier14NightsPercent);
    const tier30 = toNumber(settings.tier30NightsPercent);

    if (nights >= 30 && tier30 > 0) return tier30;
    if (nights >= 14 && tier14 > 0) return tier14;
    if (nights >= 7 && tier7 > 0) return tier7;

    return 0;
  } catch (error) {
    console.error('Erro ao buscar configurações de longa estadia:', error);
    return 0;
  }
};

export const applyLongStayDiscount = async (
  totalPrice: number,
  hotelId: string,
  nights: number
): Promise<{
  finalPrice: number;
  discountAmount: number;
  discountPercent: number;
}> => {
  const discountPercent = await getLongStayDiscountPercent(hotelId, nights);
  const discountAmount = totalPrice * (discountPercent / 100);

  return {
    finalPrice: totalPrice - discountAmount,
    discountAmount,
    discountPercent,
  };
};

export const getLongStaySettings = async (
  hotelId: string
): Promise<LongStayDiscountSetting | null> => {
  try {
    const [setting] = await db
      .select()
      .from(longStayDiscountSettings)
      .where(eq(longStayDiscountSettings.hotelId, hotelId));
    return setting || null;
  } catch (error) {
    console.error('Erro ao buscar configurações de longa estadia:', error);
    return null;
  }
};

export const upsertLongStaySettings = async (
  data: typeof longStayDiscountSettings.$inferInsert
): Promise<LongStayDiscountSetting> => {
  try {
    const result = await db
      .insert(longStayDiscountSettings)
      .values(data)
      .onConflictDoUpdate({
        target: longStayDiscountSettings.hotelId,
        set: data,
      })
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Erro ao upsert configurações de longa estadia:', error);
    throw error;
  }
};

// ==================== PREÇO FINAL ====================

export const calculateFinalBookingPrice = async (
  hotelId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  units: number = 1,
  promoCode?: string
) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const [roomType] = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.id, roomTypeId));

  if (!roomType) throw new Error("Tipo de quarto não encontrado");

  let dailyPrices: number[] = [];

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = getDateString(currentDate);

    const [availability] = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.hotelId, hotelId),
          eq(roomAvailability.roomTypeId, roomTypeId),
          sql`${roomAvailability.date} = ${currentDate}::date`
        )
      );

    const basePriceValue = toNumber(roomType.base_price);
    let dailyPrice = availability?.price ? toNumber(availability.price) : basePriceValue;

    dailyPrice = await applySeasonPricing(dailyPrice, hotelId, dateStr || '');

    dailyPrices.push(dailyPrice);
  }

  const subtotal = dailyPrices.reduce((sum, p) => sum + p, 0) * units;

  const { finalPrice: afterPromo, discountAmount: promoDiscount } = await applyPromotion(
    subtotal,
    promoCode,
    hotelId,
    checkIn
  );

  const { finalPrice, discountAmount: longStayDiscount } = await applyLongStayDiscount(
    afterPromo,
    hotelId,
    nights
  );

  return {
    basePrice: subtotal,
    priceAfterSeason: dailyPrices.reduce((sum, p) => sum + p, 0) * units,
    priceAfterPromotion: afterPromo,
    priceAfterLongStay: finalPrice,
    totalDiscount: promoDiscount + longStayDiscount,
    nights,
    units,
    dailyPrices,
  };
};

// ==================== FUNÇÕES ADICIONAIS ====================

export const checkAvailabilityWithPromotions = async (
  hotelId: string,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  units: number = 1,
  promoCode?: string
) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const availabilityChecks: Array<{ date: string; isAvailable: boolean; price: number }> = [];

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = getDateString(currentDate);

    const [availability] = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.hotelId, hotelId),
          eq(roomAvailability.roomTypeId, roomTypeId),
          sql`${roomAvailability.date} = ${currentDate}::date`
        )
      );

    if (!availability) {
      availabilityChecks.push({
        date: dateStr || '',
        isAvailable: false,
        price: 0
      });
      continue;
    }

    const isAvailable = availability.availableUnits >= units && !availability.stopSell;
    
    let dailyPrice = toNumber(availability.price);
    
    dailyPrice = await applySeasonPricing(dailyPrice, hotelId, dateStr || '');

    availabilityChecks.push({
      date: dateStr || '',
      isAvailable,
      price: dailyPrice
    });
  }

  const allAvailable = availabilityChecks.every(day => day.isAvailable);
  
  if (!allAvailable) {
    return {
      isAvailable: false,
      unavailableDates: availabilityChecks.filter(day => !day.isAvailable).map(day => day.date),
      dailyPrices: availabilityChecks,
      totalPrice: 0,
      totalDiscount: 0,
      finalPrice: 0
    };
  }

  const subtotal = availabilityChecks.reduce((sum, day) => sum + day.price, 0) * units;

  const { finalPrice: afterPromo, discountAmount: promoDiscount } = await applyPromotion(
    subtotal,
    promoCode,
    hotelId,
    checkIn
  );

  const { finalPrice, discountAmount: longStayDiscount } = await applyLongStayDiscount(
    afterPromo,
    hotelId,
    nights
  );

  return {
    isAvailable: true,
    unavailableDates: [],
    dailyPrices: availabilityChecks,
    basePrice: subtotal,
    priceAfterSeason: subtotal,
    priceAfterPromotion: afterPromo,
    priceAfterLongStay: finalPrice,
    totalDiscount: promoDiscount + longStayDiscount,
    finalPrice,
    nights,
    units
  };
};

export const getPromotionsForRoomType = async (
  hotelId: string,
  roomTypeId?: string,
  date?: string
): Promise<HotelPromotion[]> => {
  const targetDate = date ? toDate(date) : new Date();
  if (!targetDate) return [];

  const conditions: any[] = [
    eq(hotelPromotions.hotel_id, hotelId),
    eq(hotelPromotions.is_active, true),
    lte(hotelPromotions.start_date, targetDate),
    gte(hotelPromotions.end_date, targetDate)
  ];

  if (roomTypeId) {
    conditions.push(
      or(
        eq(hotelPromotions.room_type_id, roomTypeId),
        sql`${hotelPromotions.room_type_id} IS NULL`
      )
    );
  }

  return await db
    .select()
    .from(hotelPromotions)
    .where(and(...conditions))
    .orderBy(hotelPromotions.discount_percent, hotelPromotions.discount_amount);
};

export const validatePromotion = async (
  promoCode: string,
  hotelId: string,
  roomTypeId?: string,
  date?: string
): Promise<{
  isValid: boolean;
  promotion?: HotelPromotion;
  message?: string;
}> => {
  const targetDate = date ? toDate(date) : new Date();
  if (!targetDate) {
    return { isValid: false, message: 'Data inválida' };
  }

  const [promotion] = await db
    .select()
    .from(hotelPromotions)
    .where(
      and(
        eq(hotelPromotions.promo_code, promoCode),
        eq(hotelPromotions.hotel_id, hotelId),
        eq(hotelPromotions.is_active, true),
        lte(hotelPromotions.start_date, targetDate),
        gte(hotelPromotions.end_date, targetDate),
        or(
          roomTypeId ? eq(hotelPromotions.room_type_id, roomTypeId) : sql`true`,
          sql`${hotelPromotions.room_type_id} IS NULL`
        )
      )
    )
    .limit(1);

  if (!promotion) {
    return {
      isValid: false,
      message: 'Código promocional inválido ou expirado'
    };
  }

  const currentUses = promotion.current_uses ?? 0;
  if (promotion.max_uses && currentUses >= promotion.max_uses) {
    return {
      isValid: false,
      promotion,
      message: 'Limite de utilizações atingido para esta promoção'
    };
  }

  return {
    isValid: true,
    promotion
  };
};

export const incrementPromotionUses = async (promotionId: string): Promise<boolean> => {
  try {
    await db
      .update(hotelPromotions)
      .set({
        current_uses: sql`COALESCE(current_uses, 0) + 1`,
        updated_at: new Date()
      })
      .where(eq(hotelPromotions.id, promotionId));

    return true;
  } catch (error) {
    console.error('Erro ao incrementar uses da promoção:', error);
    return false;
  }
};

export const getActiveSeasonsInPeriod = async (
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<HotelSeason[]> => {
  const startDateStr = toDateString(startDate);
  const endDateStr = toDateString(endDate);

  if (!startDateStr || !endDateStr) return [];

  return await db
    .select()
    .from(hotelSeasons)
    .where(
      and(
        eq(hotelSeasons.hotelId, hotelId),
        eq(hotelSeasons.isActive, true),
        or(
          and(
            lte(hotelSeasons.startDate, endDateStr),
            gte(hotelSeasons.endDate, startDateStr)
          )
        )
      )
    )
    .orderBy(hotelSeasons.startDate);
};

export const calculateAverageDailyRate = async (
  hotelId: string,
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const checkInDate = new Date(startDate);
  const checkOutDate = new Date(endDate);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (nights <= 0) return 0;

  let totalPrice = 0;

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = getDateString(currentDate);

    const [availability] = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.hotelId, hotelId),
          eq(roomAvailability.roomTypeId, roomTypeId),
          sql`${roomAvailability.date} = ${currentDate}::date`
        )
      );

    let dailyPrice = availability?.price ? toNumber(availability.price) : 0;
    
    dailyPrice = await applySeasonPricing(dailyPrice, hotelId, dateStr || '');

    totalPrice += dailyPrice;
  }

  return totalPrice / nights;
};

export const getHotelPricingConfig = async (hotelId: string) => {
  const [settings] = await db
    .select()
    .from(longStayDiscountSettings)
    .where(eq(longStayDiscountSettings.hotelId, hotelId));

  const promotions = await getPromotionsByHotel(hotelId);
  const seasons = await getSeasonsByHotel(hotelId);

  return {
    longStaySettings: settings || null,
    promotions: promotions.filter(p => p.is_active),
    seasons: seasons.filter(s => s.isActive)
  };
};

export const updateAvailabilityWithSeasons = async (
  hotelId: string,
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  const checkInDate = new Date(startDate);
  const checkOutDate = new Date(endDate);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let updatedCount = 0;

  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(checkInDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = getDateString(currentDate);

    const [roomType] = await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, roomTypeId));

    if (!roomType) continue;

    const basePrice = toNumber(roomType.base_price);
    
    const finalPrice = await applySeasonPricing(basePrice, hotelId, dateStr || '');

    const [existing] = await db
      .select()
      .from(roomAvailability)
      .where(
        and(
          eq(roomAvailability.hotelId, hotelId),
          eq(roomAvailability.roomTypeId, roomTypeId),
          sql`${roomAvailability.date} = ${currentDate}::date`
        )
      );

    if (existing) {
      await db
        .update(roomAvailability)
        .set({
          price: finalPrice.toFixed(2),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(roomAvailability.hotelId, hotelId),
            eq(roomAvailability.roomTypeId, roomTypeId),
            sql`${roomAvailability.date} = ${currentDate}::date`
          )
        );
    } else {
      await db.insert(roomAvailability).values({
        hotelId,
        roomTypeId,
        date: currentDate,
        price: finalPrice.toFixed(2),
        availableUnits: roomType.total_units ?? 1,
        stopSell: false,
        minNights: 1
      });
    }

    updatedCount++;
  }

  return updatedCount;
};