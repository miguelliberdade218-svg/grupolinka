// src/modules/hotels/roomTypeService.ts - VERSÃO FINAL CORRIGIDA
// Usando tabela base "roomTypes" para operações de escrita

import { db } from "../../../db";
import {
  roomTypes as roomTypesView,
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
export type RoomType = typeof roomTypesView.$inferSelect;
export type RoomTypeInsert = Omit<RoomType, 'id' | 'created_at' | 'updated_at'>;
export type RoomTypeUpdate = Partial<RoomTypeInsert>;

export type RoomAvailabilityEntry = typeof roomAvailability.$inferSelect;

// ==================== FUNÇÕES HELPER ====================
const toDecimalString = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return "0.00";
  if (typeof num === 'string') {
    const parsedNum = parseFloat(num);
    return isNaN(parsedNum) ? "0.00" : parsedNum.toFixed(2);
  }
  return num.toFixed(2);
};

const ensureStopSell = (value: boolean | null | undefined): boolean | null => {
  if (value === null || value === undefined) return null;
  return Boolean(value);
};

// ==================== VALIDAÇÕES ====================
const validateRoomTypeData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('Nome deve ser uma string');
    } else if (data.name.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
  }
  
  if (data.base_price !== undefined) {
    const price = parseFloat(data.base_price);
    if (isNaN(price) || price < 0) {
      errors.push('Preço base deve ser um número não-negativo');
    }
  }
  
  if (data.capacity !== undefined) {
    const capacity = parseInt(data.capacity.toString());
    if (isNaN(capacity) || capacity < 1) {
      errors.push('Capacidade deve ser um número maior que 0');
    }
  }
  
  if (data.total_units !== undefined) {
    const totalUnits = parseInt(data.total_units.toString());
    if (isNaN(totalUnits) || totalUnits < 1) {
      errors.push('Total de unidades deve ser um número maior que 0');
    }
  }
  
  if (data.base_occupancy !== undefined) {
    const baseOccupancy = parseInt(data.base_occupancy.toString());
    if (isNaN(baseOccupancy) || baseOccupancy < 1) {
      errors.push('Ocupação base deve ser um número maior que 0');
    }
  }
  
  if (data.capacity !== undefined && data.base_occupancy !== undefined) {
    const capacity = parseInt(data.capacity.toString());
    const baseOccupancy = parseInt(data.base_occupancy.toString());
    if (!isNaN(capacity) && !isNaN(baseOccupancy) && capacity < baseOccupancy) {
      errors.push('Capacidade total deve ser maior ou igual à ocupação base');
    }
  }
  
  if (data.min_nights_default !== undefined) {
    const minNights = parseInt(data.min_nights_default.toString());
    if (isNaN(minNights) || minNights < 1) {
      errors.push('Mínimo de noites deve ser um número maior que 0');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para converter dados do formato da view para o formato da tabela base
const convertToBaseTableFormat = (data: any): any => {
  const converted: any = {};
  
  if (data.name !== undefined) converted.name = data.name;
  if (data.description !== undefined) converted.description = data.description;
  if (data.capacity !== undefined) converted.maxOccupancy = data.capacity;
  if (data.base_occupancy !== undefined) converted.baseOccupancy = data.base_occupancy;
  if (data.base_price !== undefined) converted.basePrice = data.base_price;
  if (data.total_units !== undefined) converted.totalUnits = data.total_units;
  if (data.extra_adult_price !== undefined) converted.extraAdultPrice = data.extra_adult_price;
  if (data.extra_child_price !== undefined) converted.extraChildPrice = data.extra_child_price;
  if (data.amenities !== undefined) converted.amenities = data.amenities;
  if (data.min_nights_default !== undefined) converted.minNightsDefault = data.min_nights_default;
  if (data.images !== undefined) converted.images = data.images;
  if (data.is_active !== undefined) converted.isActive = data.is_active;
  if (data.base_price_low !== undefined) converted.basePriceLow = data.base_price_low;
  if (data.base_price_high !== undefined) converted.basePriceHigh = data.base_price_high;
  if (data.extra_night_price !== undefined) converted.extraNightPrice = data.extra_night_price;
  if (data.slug !== undefined) converted.code = data.slug;
  if (data.hotel_id !== undefined) converted.hotelId = data.hotel_id;
  
  return converted;
};

// Função para converter resultados da tabela base para o formato da view
const convertToViewFormat = (result: any): any => {
  if (!result) return null;
  
  return {
    id: result.id,
    hotel_id: result.hotelId,
    name: result.name,
    slug: result.code,
    description: result.description,
    capacity: result.maxOccupancy,
    base_price: result.basePrice?.toString?.(),
    extra_adult_price: result.extraAdultPrice?.toString?.(),
    extra_child_price: result.extraChildPrice?.toString?.(),
    base_occupancy: result.baseOccupancy,
    amenities: result.amenities,
    images: result.images,
    total_units: result.totalUnits,
    is_active: result.isActive,
    created_at: result.createdAt,
    updated_at: result.updatedAt,
    base_price_low: result.basePriceLow?.toString?.(),
    base_price_high: result.basePriceHigh?.toString?.(),
    min_nights_default: result.minNightsDefault,
    extra_night_price: result.extraNightPrice?.toString?.(),
  };
};

// ==================== CRUD DE ROOM TYPES ====================

/**
 * Lista todos os tipos de quarto ativos de um hotel
 */
export const getRoomTypesByHotel = async (
  hotelId: string,
  includeInactive = false
): Promise<RoomType[]> => {
  const conditions = [eq(roomTypesView.hotel_id, hotelId)];
  if (!includeInactive) {
    conditions.push(eq(roomTypesView.is_active, true));
  }

  return await db
    .select()
    .from(roomTypesView)
    .where(and(...conditions))
    .orderBy(asc(roomTypesView.name));
};

/**
 * Obtém um tipo de quarto por ID
 */
export const getRoomTypeById = async (id: string): Promise<RoomType | null> => {
  const [roomType] = await db.select().from(roomTypesView).where(eq(roomTypesView.id, id));
  return roomType || null;
};

/**
 * Cria um novo tipo de quarto
 */
export const createRoomType = async (data: RoomTypeInsert): Promise<RoomType> => {
  console.log("🟢 [SERVICE CREATE] Criando novo room type");
  console.log("📦 Dados recebidos:", JSON.stringify(data, null, 2));
  
  const validation = validateRoomTypeData(data);
  if (!validation.isValid) {
    console.error("❌ Validação falhou:", validation.errors);
    throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
  }
  
  if (!data.name || !data.base_price || !data.capacity || !data.total_units || !data.base_occupancy) {
    throw new Error("Campos obrigatórios faltando: name, base_price, capacity, total_units, base_occupancy");
  }
  
  // Converter para formato da tabela base
  const baseTableData = convertToBaseTableFormat(data);
  
  // Verificar se o hotel existe
  const hotelCheck = await db.execute(sql`
    SELECT id FROM "hotels" WHERE id = ${baseTableData.hotelId}
  `);
  
  // Extrair resultado da verificação do hotel
  let hotelExists = null;
  if (hotelCheck && typeof hotelCheck === 'object') {
    if ('rows' in hotelCheck && Array.isArray((hotelCheck as any).rows)) {
      hotelExists = (hotelCheck as any).rows[0];
    } else if (Array.isArray(hotelCheck) && hotelCheck.length > 0) {
      hotelExists = hotelCheck[0];
    } else if ('0' in hotelCheck) {
      hotelExists = (hotelCheck as any)['0'];
    }
  }
  
  if (!hotelExists) {
    console.error("❌ Hotel não encontrado:", baseTableData.hotelId);
    throw new Error(`Hotel com ID ${baseTableData.hotelId} não encontrado`);
  }
  console.log("✅ Hotel verificado:", hotelExists.id);
  
  // Preparar a query de inserção
  let query;
  
  if (baseTableData.amenities && Array.isArray(baseTableData.amenities) && baseTableData.amenities.length > 0) {
    // Com amenities
    console.log("📦 Inserindo com amenities:", baseTableData.amenities);
    
    query = sql`
      INSERT INTO "roomTypes" (
        "hotelId", 
        name, 
        code, 
        description, 
        "maxOccupancy", 
        "basePrice",
        "extraAdultPrice", 
        "extraChildPrice", 
        "baseOccupancy", 
        amenities,
        images, 
        "totalUnits", 
        "isActive", 
        "createdAt", 
        "updatedAt",
        "basePriceLow", 
        "basePriceHigh", 
        "minNightsDefault", 
        "extraNightPrice"
      ) VALUES (
        ${baseTableData.hotelId},
        ${baseTableData.name},
        ${baseTableData.code || ''},
        ${baseTableData.description || null},
        ${baseTableData.maxOccupancy},
        ${baseTableData.basePrice},
        ${baseTableData.extraAdultPrice || null},
        ${baseTableData.extraChildPrice || null},
        ${baseTableData.baseOccupancy},
        ARRAY[${sql.join(baseTableData.amenities.map((a: string) => sql`${a}`), sql`, `)}],
        ${baseTableData.images || null},
        ${baseTableData.totalUnits},
        ${baseTableData.isActive ?? true},
        NOW(),
        NOW(),
        ${baseTableData.basePriceLow || null},
        ${baseTableData.basePriceHigh || null},
        ${baseTableData.minNightsDefault ?? 1},
        ${baseTableData.extraNightPrice || null}
      ) RETURNING *;
    `;
  } else {
    // Sem amenities
    console.log("📦 Inserindo sem amenities");
    
    query = sql`
      INSERT INTO "roomTypes" (
        "hotelId", 
        name, 
        code, 
        description, 
        "maxOccupancy", 
        "basePrice",
        "extraAdultPrice", 
        "extraChildPrice", 
        "baseOccupancy", 
        amenities,
        images, 
        "totalUnits", 
        "isActive", 
        "createdAt", 
        "updatedAt",
        "basePriceLow", 
        "basePriceHigh", 
        "minNightsDefault", 
        "extraNightPrice"
      ) VALUES (
        ${baseTableData.hotelId},
        ${baseTableData.name},
        ${baseTableData.code || ''},
        ${baseTableData.description || null},
        ${baseTableData.maxOccupancy},
        ${baseTableData.basePrice},
        ${baseTableData.extraAdultPrice || null},
        ${baseTableData.extraChildPrice || null},
        ${baseTableData.baseOccupancy},
        NULL,
        ${baseTableData.images || null},
        ${baseTableData.totalUnits},
        ${baseTableData.isActive ?? true},
        NOW(),
        NOW(),
        ${baseTableData.basePriceLow || null},
        ${baseTableData.basePriceHigh || null},
        ${baseTableData.minNightsDefault ?? 1},
        ${baseTableData.extraNightPrice || null}
      ) RETURNING *;
    `;
  }
  
  // Executar a query
  console.log("⚡ Executando INSERT...");
  const result = await db.execute(query);
  
  // Extrair o resultado inserido
  let inserted = null;
  
  if (result && typeof result === 'object') {
    // Formato do Drizzle/pg: { rows: [...] }
    if ('rows' in result && Array.isArray((result as any).rows)) {
      console.log("📦 Encontrado rows array, length:", (result as any).rows.length);
      if ((result as any).rows.length > 0) {
        inserted = (result as any).rows[0];
      }
    }
    // Formato do Postgres.js: array diretamente
    else if (Array.isArray(result) && result.length > 0) {
      console.log("📦 Resultado é array direto, length:", result.length);
      inserted = result[0];
    }
    // Formato com índices numéricos
    else {
      // Tentar encontrar qualquer propriedade que pareça um registro
      for (const key in result) {
        if (result[key] && typeof result[key] === 'object' && result[key].id) {
          console.log(`📦 Encontrado registro em result[${key}]`);
          inserted = result[key];
          break;
        }
      }
    }
  }
  
  if (!inserted) {
    console.error("❌ Falha ao criar room type - nenhum registro retornado");
    console.error("📦 Resultado completo:", JSON.stringify(result, null, 2));
    throw new Error("Falha ao criar room type - nenhum registro retornado");
  }
  
  console.log("✅ Registro inserido:", JSON.stringify(inserted, null, 2));
  
  const roomType = convertToViewFormat(inserted);
  console.log("✅ Room type criado com sucesso:", roomType.id);
  return roomType;
};

/**
 * Atualiza um tipo de quarto
 */
export const updateRoomType = async (
  id: string,
  data: RoomTypeUpdate
): Promise<RoomType | null> => {
  console.log("🔵 [SERVICE UPDATE] Atualizando room type:", id);
  console.log("📦 Dados recebidos no service:", JSON.stringify(data, null, 2));
  
  console.log("📝 Campos recebidos:", Object.keys(data));
  
  const validation = validateRoomTypeData(data);
  if (!validation.isValid) {
    console.error("❌ Validação falhou:", validation.errors);
    throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
  }
  
  // Verificar se o room type existe
  const existingRoomType = await getRoomTypeById(id);
  if (!existingRoomType) {
    console.error("❌ Room type não encontrado:", id);
    throw new Error("Tipo de quarto não encontrado");
  }
  
  // Converter para formato da tabela base
  const baseTableData = convertToBaseTableFormat(data);
  
  // Construir a query de update dinamicamente usando sql
  const setClauses = [];
  
  for (const [key, value] of Object.entries(baseTableData)) {
    if (value !== undefined) {
      // Tratamento especial para arrays
      if (key === 'amenities' && Array.isArray(value)) {
        if (value.length > 0) {
          const arrayValues = value.map(v => sql`${v}`);
          setClauses.push(sql`${sql.identifier(key)} = ARRAY[${sql.join(arrayValues, sql`, `)}]`);
        } else {
          setClauses.push(sql`${sql.identifier(key)} = NULL`);
        }
      } else {
        setClauses.push(sql`${sql.identifier(key)} = ${value}`);
      }
    }
  }
  
  // Adicionar updatedAt manualmente
  setClauses.push(sql`"updatedAt" = NOW()`);
  
  if (setClauses.length === 0) {
    console.log("⚠️ Nenhum campo para atualizar");
    return existingRoomType;
  }
  
  console.log("🔄 Executando update na tabela base");
  
  // Usar sql com template string e sql.join
  const result = await db.execute(sql`
    UPDATE "roomTypes"
    SET ${sql.join(setClauses, sql`, `)}
    WHERE id = ${id}
    RETURNING *;
  `);
  
  console.log("📦 Resultado bruto do update:", JSON.stringify(result, null, 2));
  
  // Tentar diferentes formas de acessar o resultado
  let updated = null;
  
  if (result && typeof result === 'object') {
    // Formato do Drizzle: { rows: [...] }
    if ('rows' in result && Array.isArray((result as any).rows) && (result as any).rows.length > 0) {
      updated = (result as any).rows[0];
    }
    // Formato do Postgres.js: array diretamente
    else if (Array.isArray(result) && result.length > 0) {
      updated = result[0];
    }
    // Formato com campo '0'
    else if ('0' in result) {
      updated = (result as any)['0'];
    }
  }
  
  if (!updated) {
    console.log("❌ Falha ao atualizar room type - nenhum registro retornado");
    console.log("📦 Estrutura do resultado:", Object.keys(result || {}));
    return null;
  }
  
  const roomType = convertToViewFormat(updated);
  console.log("✅ Room type atualizado com sucesso:", roomType.id);
  return roomType;
};

/**
 * Desativa (soft delete) um tipo de quarto
 */
export const deactivateRoomType = async (id: string): Promise<RoomType | null> => {
  console.log("🔴 [SERVICE] Desativando room type:", id);
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
  const [roomType] = await db.select({ totalUnits: roomTypesView.total_units })
    .from(roomTypesView)
    .where(eq(roomTypesView.id, roomTypeId))
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
    console.log("📅 [AVAILABILITY] Atualizando disponibilidade após reserva");
    console.log("🔍 RoomTypeId:", roomTypeId, "HotelId:", hotelId);
    console.log("📆 CheckIn:", checkIn, "CheckOut:", checkOut, "Units:", units);
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);

    const [roomType] = await db
      .select({ totalUnits: roomTypesView.total_units, basePrice: roomTypesView.base_price })
      .from(roomTypesView)
      .where(eq(roomTypesView.id, roomTypeId))
      .limit(1);

    const totalUnits = roomType?.totalUnits ?? 0;
    const basePrice = roomType?.basePrice ?? "0.00";

    console.log("📊 Total Units:", totalUnits, "Base Price:", basePrice);

    while (current < end) {
      const dateObj = new Date(current);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      console.log("📅 Processando data:", dateStr);

      const [existing] = await db
        .select()
        .from(roomAvailability)
        .where(and(
          eq(roomAvailability.roomTypeId, roomTypeId),
          eq(roomAvailability.date, dateObj)
        ))
        .limit(1);

      if (!existing) {
        console.log("➕ Criando novo registro para", dateStr);
        
        const newRecord: any = {
          hotelId,
          roomTypeId,
          date: dateObj,
          availableUnits: totalUnits - units,
          stopSell: null,
          minNights: 1,
          updatedAt: new Date(),
        };
        
        newRecord.price = null;
        
        await db.insert(roomAvailability).values(newRecord);
      } else {
        console.log("✏️ Atualizando registro existente para", dateStr);
        const newUnits = Number(existing.availableUnits) - units;
        await db
          .update(roomAvailability)
          .set({
            availableUnits: newUnits,
            updatedAt: new Date(),
          })
          .where(eq(roomAvailability.id, existing.id));
      }

      current.setDate(current.getDate() + 1);
    }

    console.log("✅ Disponibilidade atualizada com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao atualizar disponibilidade após reserva:", error);
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
    console.log("📅 [AVAILABILITY] Liberando disponibilidade após cancelamento");
    console.log("🔍 RoomTypeId:", roomTypeId, "HotelId:", hotelId);
    console.log("📆 CheckIn:", checkIn, "CheckOut:", checkOut, "Units:", units);
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const current = new Date(start);

    const [roomType] = await db
      .select({ totalUnits: roomTypesView.total_units })
      .from(roomTypesView)
      .where(eq(roomTypesView.id, roomTypeId))
      .limit(1);

    const totalUnits = roomType?.totalUnits ?? 0;

    while (current < end) {
      const dateObj = new Date(current);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      console.log("📅 Processando data:", dateStr);

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

        if (newUnits >= totalUnits && existing.stopSell !== true && existing.price === null) {
          console.log("🗑️ Removendo registro (voltou ao padrão) para", dateStr);
          await db.delete(roomAvailability).where(eq(roomAvailability.id, existing.id));
        } else {
          console.log("✏️ Atualizando registro para", dateStr, "Novas unidades:", newUnits);
          await db
            .update(roomAvailability)
            .set({
              availableUnits: newUnits,
              updatedAt: new Date(),
            })
            .where(eq(roomAvailability.id, existing.id));
        }
      } else {
        console.log("ℹ️ Nenhum registro encontrado para", dateStr);
      }

      current.setDate(current.getDate() + 1);
    }

    console.log("✅ Disponibilidade liberada com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao liberar disponibilidade após cancelamento:", error);
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
    price?: number | null;
    stopSell?: boolean | null;
    minNights?: number;
    availableUnits?: number | null;
    reset?: boolean;
  }[]
): Promise<number> => {
  if (updates.length === 0) return 0;

  console.log("📊 [BULK UPDATE] Iniciando atualização em lote");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📅 Updates recebidos:", updates.length);
  
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    console.error("❌ RoomType não encontrado:", roomTypeId);
    throw new Error("RoomType inválido");
  }

  const maxUnits = roomType.total_units || 0;
  const hotelId = roomType.hotel_id!;
  let updatedCount = 0;

  console.log("🏨 Informações do RoomType:", {
    maxUnits,
    hotelId,
    roomTypeName: roomType.name
  });

  await db.transaction(async (tx) => {
    for (const u of updates) {
      console.log("📅 Processando update para data:", u.date);
      
      const dateObj = new Date(u.date);
      
      const [existing] = await tx.select().from(roomAvailability).where(and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        eq(roomAvailability.date, dateObj)
      ));

      const isReset = u.reset === true;
      
      console.log("🔄 Estado do reset para", u.date, ":", isReset);
      
      let priceValue = isReset 
        ? null
        : (u.price !== undefined ? u.price : existing?.price ?? null);
      
      let stopSellValue = isReset
        ? false
        : (u.stopSell !== undefined ? u.stopSell : existing?.stopSell ?? false);
      
      let unitsValue = isReset
        ? null
        : (u.availableUnits !== undefined ? u.availableUnits : existing?.availableUnits ?? maxUnits);
      
      let minNightsValue = isReset
        ? 1
        : (u.minNights ?? existing?.minNights ?? 1);

      if (stopSellValue === true) {
        unitsValue = 0;
        console.log(`🔒 [STOP SELL] Forçando availableUnits para 0 para ${u.date}`);
      }

      if (unitsValue !== null && (unitsValue < 0 || unitsValue > maxUnits)) {
        throw new Error(`Unidades inválidas para ${u.date}: ${unitsValue} (máximo: ${maxUnits})`);
      }

      if (isReset && existing) {
        console.log("🗑️ [RESET EXPLÍCITO] Removendo registro para", u.date);
        await tx.delete(roomAvailability).where(eq(roomAvailability.id, existing.id));
        updatedCount++;
        continue;
      }

      const isAllNull = priceValue === null && 
                       stopSellValue === false && 
                       unitsValue === null && 
                       minNightsValue === 1;
      
      if (isAllNull && existing) {
        console.log("🗑️ [TUDO PADRÃO] Removendo registro para", u.date);
        await tx.delete(roomAvailability).where(eq(roomAvailability.id, existing.id));
        updatedCount++;
        continue;
      }

      const dataToInsert: any = {
        hotelId,
        roomTypeId,
        date: dateObj,
        price: priceValue,
        stopSell: stopSellValue,
        minNights: minNightsValue,
        updatedAt: new Date(),
      };
      
      if (unitsValue !== null) {
        dataToInsert.availableUnits = unitsValue;
      }

      console.log("💾 Dados preparados para banco:", {
        ...dataToInsert,
        price: dataToInsert.price ?? 'null (usa base_price)',
        availableUnits: dataToInsert.availableUnits ?? 'null (usa maxUnits)'
      });

      if (existing) {
        await tx.update(roomAvailability).set(dataToInsert).where(eq(roomAvailability.id, existing.id));
        console.log("✏️ Atualizado registro existente para", u.date);
      } else {
        await tx.insert(roomAvailability).values(dataToInsert);
        console.log("➕ Criado novo registro para", u.date);
      }
      
      updatedCount++;
    }
  });

  console.log("✅ [BULK UPDATE] Concluído. Registros processados:", updatedCount);
  return updatedCount;
};

// ==================== FUNÇÕES DE LEITURA / RELATÓRIOS ====================

/**
 * Obtém o calendário de disponibilidade para um tipo de quarto em um período
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
  console.log("📅 [CALENDAR] Buscando calendário de disponibilidade");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
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

  console.log("📊 Registros encontrados:", availability.length);

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

    const entryPrice = entry?.price;
    const finalPrice = (entryPrice !== null && entryPrice !== undefined) 
      ? entryPrice 
      : basePrice;

    result.push({
      date: dateStr,
      price: finalPrice,
      availableUnits: entry ? Number(entry.availableUnits) : totalUnits,
      stopSell: entry ? entry.stopSell : null,
      minNights: entry ? Number(entry.minNights) : 1,
    });

    current.setDate(current.getDate() + 1);
  }

  console.log("📅 Dias processados:", result.length);
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
  console.log("📊 [SUMMARY] Buscando resumo de disponibilidade do hotel");
  console.log("🔍 HotelId:", hotelId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const result = await db
    .select({
      roomType: roomTypesView,
      date: roomAvailability.date,
      price: roomAvailability.price,
      availableUnits: roomAvailability.availableUnits,
      stopSell: roomAvailability.stopSell,
    })
    .from(roomAvailability)
    .innerJoin(roomTypesView, eq(roomTypesView.id, roomAvailability.roomTypeId))
    .where(
      and(
        eq(roomAvailability.hotelId, hotelId),
        gte(roomAvailability.date, startDateObj),
        lte(roomAvailability.date, endDateObj)
      )
    )
    .orderBy(roomTypesView.name, roomAvailability.date);

  console.log("📊 Registros encontrados:", result.length);
  return result;
};

/**
 * Verifica se um tipo de quarto tem reservas ativas (para prevenir desativação)
 */
export const hasActiveBookings = async (roomTypeId: string): Promise<boolean> => {
  console.log("🔍 [ACTIVE BOOKINGS] Verificando reservas ativas");
  console.log("🔍 RoomTypeId:", roomTypeId);
  
  const active = await db
    .select({ count: sql<number>`count(*)` })
    .from(hotelBookings)
    .where(
      and(
        eq(hotelBookings.roomTypeId, roomTypeId),
        inArray(hotelBookings.status, ["pending", "confirmed", "checked_in"])
      )
    );

  const count = active[0]?.count || 0;
  console.log("📊 Reservas ativas encontradas:", count);
  
  return count > 0;
};

// ==================== FUNÇÕES ADICIONAIS ====================

/**
 * Inicializa ou atualiza disponibilidade para um tipo de quarto
 */
export const initializeAvailability = async (
  roomTypeId: string,
  startDate: string,
  endDate: string,
  defaultPrice?: number | null,
  defaultUnits: number = 1,
  minNights: number = 1
): Promise<number> => {
  console.log("🔧 [INIT AVAILABILITY] Inicializando disponibilidade");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  console.log("💰 Preço padrão:", defaultPrice ?? 'null (usa base_price)', "Unidades:", defaultUnits, "Noites mínimas:", minNights);
  
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType || !roomType.hotel_id) {
    throw new Error("Tipo de quarto não encontrado ou sem hotel associado");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  let createdCount = 0;

  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateObj = new Date(currentDate);

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
      const priceValue = defaultPrice && defaultPrice > 0 ? defaultPrice.toString() : null;

      await db.insert(roomAvailability).values({
        roomTypeId: roomTypeId,
        hotelId: roomType.hotel_id,
        date: dateObj,
        price: priceValue,
        availableUnits: defaultUnits,
        stopSell: null,
        minNights: minNights,
        maxStay: null,
        minStay: 1
      });
      createdCount++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log("✅ Registros criados:", createdCount);
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
  console.log("💰 [PRICES] Buscando preços disponíveis");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
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

  console.log("📊 [MULTI AVAILABILITY] Buscando disponibilidade para múltiplos room types");
  console.log("🔍 RoomTypeIds:", roomTypeIds.length);
  console.log("📆 Start:", startDate, "End:", endDate);

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

  console.log("✅ Room types processados:", Object.keys(result).length);
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
  console.log("📅 [MIN NIGHTS] Verificando compatibilidade de noites mínimas");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 CheckIn:", checkIn, "CheckOut:", checkOut);
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const actualNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  console.log("🌙 Noites reais:", actualNights);

  const availability = await getAvailabilityCalendar(roomTypeId, checkIn, checkOut);
  
  if (availability.length === 0) {
    console.log("ℹ️ Nenhuma restrição de disponibilidade encontrada");
    return {
      compliant: actualNights >= 1,
      requiredMinNights: 1,
      actualNights
    };
  }

  const maxMinNights = Math.max(...availability.map(a => a.minNights));
  const compliant = actualNights >= maxMinNights;

  console.log("📊 Noites mínimas requeridas:", maxMinNights, "Compatível:", compliant);
  
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
  console.log("📈 [OCCUPANCY STATS] Buscando estatísticas de ocupação");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate || "N/A", "End:", endDate || "N/A");
  
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType) {
    throw new Error("Tipo de quarto não encontrado");
  }

  const totalUnits = roomType.total_units || 0;
  console.log("🏨 Total de unidades:", totalUnits);
  
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
    console.log("📅 Aplicando filtro de datas");
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

  console.log("📊 Estatísticas:", {
    bookedUnits,
    availableUnits,
    occupancyRate: occupancyRate.toFixed(2) + "%",
    averagePrice: averagePrice.toFixed(2)
  });

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
  console.log("🔄 [SYNC] Sincronizando disponibilidade com total de unidades");
  console.log("🔍 RoomTypeId:", roomTypeId);
  
  const roomType = await getRoomTypeById(roomTypeId);
  if (!roomType || !roomType.total_units) {
    throw new Error("Tipo de quarto não encontrado ou sem total_units definido");
  }

  const totalUnits = roomType.total_units;
  console.log("🏨 Total de unidades:", totalUnits);

  await db
    .update(roomAvailability)
    .set({
      availableUnits: sql`LEAST(${roomAvailability.availableUnits}, ${totalUnits})`,
      updatedAt: new Date()
    })
    .where(
      eq(roomAvailability.roomTypeId, roomTypeId)
    );

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        sql`${roomAvailability.availableUnits} > ${totalUnits}`
      )
    );

  const updatedCount = Number(result[0]?.count || 0);
  console.log("✅ Registros atualizados:", updatedCount);
  
  return updatedCount;
};

/**
 * Verificar conflitos de preços (preços inconsistentes em datas consecutivas)
 */
export const checkPriceConsistency = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; price: number; previousPrice: number; differencePercent: number }>> => {
  console.log("⚠️ [PRICE CHECK] Verificando consistência de preços");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  if (availability.length < 2) {
    console.log("ℹ️ Dados insuficientes para verificação");
    return [];
  }

  const inconsistencies: Array<{ date: string; price: number; previousPrice: number; differencePercent: number }> = [];

  for (let i = 1; i < availability.length; i++) {
    const current = availability[i];
    const previous = availability[i - 1];
    
    const currentPrice = Number(current.price || 0);
    const previousPrice = Number(previous.price || 0);
    
    if (previousPrice === 0) continue;
    
    const differencePercent = Math.abs((currentPrice - previousPrice) / previousPrice) * 100;
    
    if (differencePercent > 30) {
      inconsistencies.push({
        date: current.date,
        price: currentPrice,
        previousPrice: previousPrice,
        differencePercent: Math.round(differencePercent * 100) / 100
      });
    }
  }

  console.log("📊 Inconsistências encontradas:", inconsistencies.length);
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
  console.log("📤 [EXPORT] Exportando calendário de disponibilidade");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  const result = availability.map(entry => ({
    date: entry.date,
    price: `MZN ${Number(entry.price).toFixed(2)}`,
    availableUnits: entry.availableUnits,
    status: entry.stopSell === true ? "Não Disponível" : entry.availableUnits > 0 ? "Disponível" : "Esgotado",
    minNights: entry.minNights || 1
  }));

  console.log("📊 Registros exportados:", result.length);
  return result;
};

/**
 * Atualizar preço base para todas as datas futuras
 */
export const updateBasePriceForFutureDates = async (
  roomTypeId: string,
  newBasePrice: number,
  effectiveFrom: string = new Date().toISOString().split("T")[0]
): Promise<number> => {
  console.log("💰 [BASE PRICE UPDATE] Atualizando preço base para datas futuras");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("💰 Novo preço:", newBasePrice);
  console.log("📆 Data efetiva:", effectiveFrom);
  
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
        gte(roomAvailability.date, effectiveDate),
        sql`${roomAvailability.price} IS NULL`
      )
    );

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.roomTypeId, roomTypeId),
        gte(roomAvailability.date, effectiveDate),
        sql`${roomAvailability.price} IS NULL`
      )
    );

  const updatedCount = Number(countResult[0]?.count || 0);
  console.log("✅ Linhas atualizadas:", updatedCount);
  
  return updatedCount;
};

/**
 * Obter todas as datas com disponibilidade zero (esgotado)
 */
export const getSoldOutDates = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<string[]> => {
  console.log("❌ [SOLD OUT] Buscando datas esgotadas");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
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

  const result = availability.map(entry => entry.date.toISOString().split("T")[0]);
  console.log("📊 Datas esgotadas encontradas:", result.length);
  
  return result;
};

/**
 * Obter datas com stop sell ativo
 */
export const getStopSellDates = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<string[]> => {
  console.log("🚫 [STOP SELL] Buscando datas com stop sell");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
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

  const result = availability.map(entry => entry.date.toISOString().split("T")[0]);
  console.log("📊 Datas com stop sell encontradas:", result.length);
  
  return result;
};

/**
 * Calcular receita potencial para um período
 */
export const calculatePotentialRevenue = async (
  roomTypeId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  console.log("💰 [POTENTIAL REVENUE] Calculando receita potencial");
  console.log("🔍 RoomTypeId:", roomTypeId);
  console.log("📆 Start:", startDate, "End:", endDate);
  
  const availability = await getAvailabilityCalendar(roomTypeId, startDate, endDate);
  
  const revenue = availability.reduce((total, entry) => {
    if (entry.availableUnits > 0 && entry.stopSell !== true) {
      return total + (Number(entry.price) * entry.availableUnits);
    }
    return total;
  }, 0);

  console.log("💰 Receita potencial calculada:", revenue.toFixed(2));
  
  return revenue;
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