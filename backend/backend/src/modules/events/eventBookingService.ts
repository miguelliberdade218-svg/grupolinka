import { db } from "../../../db";
import {
  hotelBookings,
  hotelBookingUnits,
  hotelBookingLogs,
  roomTypes,
  invoices,
} from "../../../shared/schema";
import {
  eq,
  and,
  sql,
  desc,
} from "drizzle-orm";

// 🆕 Import do serviço de comissões automáticas
import providerPaymentService from "../payments/providerPaymentService";

// ✅ Import dos serviços de hotéis (reutilizados)
import { calculateFinalBookingPrice } from "../hotels/hotelPromotionService";
import { 
  checkAvailabilityForDates, 
  updateAvailabilityAfterBooking, 
  releaseAvailabilityAfterCancellation 
} from "../hotels/roomTypeService";

// ==================== TIPOS ====================
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type HotelBookingInsert = typeof hotelBookings.$inferInsert;
export type HotelBookingLogInsert = typeof hotelBookingLogs.$inferInsert;
export type InvoiceInsert = typeof invoices.$inferInsert;

// ✅ NOVO: Tipo para unidade disponível
interface AvailableUnit {
  date: string;
  unitNumber: number;
}

// ✅ CORREÇÃO: Tipo para dados de criação de booking com todos os campos
export interface CreateBookingData {
  hotelId: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  units?: number;
  specialRequests?: string;
  promoCode?: string;
  userId?: string | null;
  status?: string;
  paymentStatus?: string;
  createdBy?: string | null;
  // Campos opcionais do schema
  roomId?: string | null;
  extraCharges?: string;
  discountAmount?: string;
  baseTotalPrice?: string;
  longStayDiscountPercent?: string;
  longStayDiscountAmount?: string;
  longStayTier?: string;
  cancellationReason?: string;
  paymentReference?: string;
  invoiceNumber?: string;
  reservationToken?: string;
  checkedInAt?: Date | null;
  checkedOutAt?: Date | null;
  cancelledAt?: Date | null;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
  holdExpiresAt?: Date | null;
  companyId?: string | null;
  reminderSent?: boolean;
  lastReminderSent?: Date | null;
  reminderCount?: number;
}

// ==================== FUNÇÕES HELPER ====================
const formatDateForDB = (date: Date | string): string => {
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
};

const formatDecimalForDB = (num: number): string => num.toFixed(2);

// ✅ CORREÇÃO: Função helper para criar logs corretamente
const createBookingLog = async (
  bookingId: string,
  action: string,
  performedBy: string,
  notes?: string | null,
  metadata?: any
): Promise<void> => {
  try {
    // ✅ CORREÇÃO: Converter para string vazia se for null
    const performedByString = performedBy || '';
    
    await db.insert(hotelBookingLogs).values({
      bookingId,
      action,
      performedBy: performedByString, // ✅ Agora é string, não nullable
      notes: notes || null,
      metadata: metadata || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
};

// ✅ CORREÇÃO: Função para criar HotelBookingInsert completo - VERSÃO CORRIGIDA
const createCompleteBookingData = (
  data: CreateBookingData,
  pricing: any,
  createdByUserId?: string
): HotelBookingInsert => {
  const now = new Date();
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ✅ CORREÇÃO: Cálculos de preço corrigidos
  const basePrice = pricing.basePrice; // Já é o total para todas as noites (1200)
  const totalPrice = pricing.priceAfterLongStay; // Preço final com desconto (900)
  const discountAmount = pricing.totalDiscount; // Total de desconto (300)
  
  return {
    // Campos obrigatórios
    hotelId: data.hotelId,
    roomTypeId: data.roomTypeId,
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    nights: nights,
    basePrice: formatDecimalForDB(basePrice),
    totalPrice: formatDecimalForDB(totalPrice),
    
    // Campos opcionais com defaults
    guestPhone: data.guestPhone || null,
    units: data.units || 1,
    adults: data.adults || 2,
    children: data.children || 0,
    extraCharges: "0.00",
    discountAmount: formatDecimalForDB(discountAmount),
    // ✅ CORREÇÃO AQUI: baseTotalPrice deve ser igual a basePrice (1200), não basePrice * nights * units
    baseTotalPrice: formatDecimalForDB(basePrice),
    longStayDiscountPercent: pricing.longStayDiscountPercent?.toString() || "0.00",
    longStayDiscountAmount: formatDecimalForDB(discountAmount),
    specialRequests: data.specialRequests || null,
    promoCode: data.promoCode || null,
    // ✅ CORREÇÃO CRÍTICA: Alterado de 'confirmed' para 'pending_confirmation' conforme constraint do banco
    status: data.status || 'pending_confirmation',
    paymentStatus: data.paymentStatus || 'pending',
    paymentReference: data.paymentReference || null,
    
    // Campos técnicos
    createdAt: now,
    updatedAt: now,
    
    // Campos adicionais do schema
    roomId: null,
    longStayTier: null,
    cancellationReason: null,
    invoiceNumber: null,
    reservationToken: null,
    checkedInAt: null,
    checkedOutAt: null,
    cancelledAt: null,
    confirmedAt: null,
    confirmedBy: null,
    holdExpiresAt: null,
    companyId: null,
    reminderSent: false,
    lastReminderSent: null,
    reminderCount: 0,
  };
};

// ✅ NOVA FUNÇÃO: Encontrar unidades disponíveis específicas
const findAvailableUnits = async (
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  unitsNeeded: number
): Promise<AvailableUnit[][]> => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const dateArray: string[] = [];
  for (let i = 0; i < nights; i++) {
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + i);
    dateArray.push(formatDateForDB(date));
  }
  
  // Para cada data, buscar unidades já reservadas
  const unitAssignments: AvailableUnit[][] = [];
  
  for (const date of dateArray) {
    const alreadyReserved = await db
      .select({
        unitNumber: hotelBookingUnits.unitNumber,
      })
      .from(hotelBookingUnits)
      .where(
        and(
          eq(hotelBookingUnits.roomTypeId, roomTypeId),
          eq(hotelBookingUnits.date, date)
        )
      );
    
    const reservedNumbers = alreadyReserved.map(u => u.unitNumber);
    
    // Encontrar unidades livres (não reservadas)
    const availableForDate: AvailableUnit[] = [];
    for (let unitNumber = 1; unitNumber <= 20; unitNumber++) { // Assumindo máximo 20 unidades por tipo
      if (!reservedNumbers.includes(unitNumber)) {
        availableForDate.push({ date, unitNumber });
        if (availableForDate.length >= unitsNeeded) break;
      }
    }
    
    if (availableForDate.length < unitsNeeded) {
      throw new Error(`Não há ${unitsNeeded} unidade(s) disponíveis para ${date}`);
    }
    
    unitAssignments.push(availableForDate.slice(0, unitsNeeded));
  }
  
  return unitAssignments;
};

// ==================== CRIAÇÃO DE RESERVA - VERSÃO CORRIGIDA COM DISPONIBILIDADE ETERNA ====================

export const createHotelBooking = async (
  data: CreateBookingData,
  createdByUserId?: string
): Promise<{
  booking: HotelBooking;
  unitsReserved: number;
}> => {
  const {
    hotelId,
    roomTypeId,
    guestName,
    guestEmail,
    guestPhone,
    checkIn,
    checkOut,
    adults,
    children = 0,
    units = 1,
    specialRequests,
    promoCode,
  } = data;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Validações básicas
      const [roomType] = await tx
        .select()
        .from(roomTypes)
        .where(and(eq(roomTypes.id, roomTypeId), eq(roomTypes.hotel_id, hotelId)));

      if (!roomType || !roomType.is_active) {
        throw new Error("Tipo de quarto inválido ou inativo");
      }

      if ((roomType.capacity ?? 0) < adults + children) {
        throw new Error("Número de hóspedes excede a capacidade do quarto");
      }

      if ((roomType.total_units ?? 0) < units) {
        throw new Error("Não há unidades suficientes deste tipo de quarto");
      }

      // 2. ✅ ATUALIZADO: Verifica disponibilidade usando o novo modelo
      const availabilityCheck = await checkAvailabilityForDates(
        roomTypeId,
        checkIn,
        checkOut,
        units
      );

      if (!availabilityCheck.available) {
        throw new Error(
          `Indisponível para ${units} unidade(s). ${availabilityCheck.message}`
        );
      }

      // ✅ NOVO: Verificar disponibilidade de UNIDADES ESPECÍFICAS
      const availableUnits = await findAvailableUnits(roomTypeId, checkIn, checkOut, units);
      
      // 3. Calcula preço final
      const pricing = await calculateFinalBookingPrice(
        hotelId,
        roomTypeId,
        checkIn,
        checkOut,
        units,
        promoCode
      );

      // 4. Cria a reserva principal usando função helper
      const bookingData = createCompleteBookingData(data, pricing, createdByUserId);
      
      // ✅ CORREÇÃO: Adicionar createdBy se fornecido
      if (createdByUserId) {
        (bookingData as any).createdBy = createdByUserId;
      }

      const [booking] = await tx
        .insert(hotelBookings)
        .values(bookingData)
        .returning();

      // ✅ MELHORIA: Reservar unidades específicas encontradas
      const unitAssignments = [];
      
      for (let nightIndex = 0; nightIndex < availableUnits.length; nightIndex++) {
        const nightlyUnits = availableUnits[nightIndex];
        for (let unitIndex = 0; unitIndex < nightlyUnits.length; unitIndex++) {
          const unit = nightlyUnits[unitIndex];
          unitAssignments.push({
            bookingId: booking.id,
            roomTypeId,
            hotelId,
            date: unit.date,
            unitNumber: unit.unitNumber,
            status: "reserved",
          });
        }
      }

      if (unitAssignments.length > 0) {
        await tx.insert(hotelBookingUnits).values(unitAssignments);
      }

      // 5. ✅ ATUALIZADO: Atualizar disponibilidade usando a nova função
      const availabilityUpdated = await updateAvailabilityAfterBooking(
        roomTypeId,
        hotelId,
        checkIn,
        checkOut,
        units
      );

      if (!availabilityUpdated) {
        throw new Error("Falha ao atualizar disponibilidade");
      }

      // 6. Cria log da reserva (fora da transaction para evitar bloqueio)
      // Marcamos para criar após commit
      const logData = {
        bookingId: booking.id,
        action: "booking_created",
        performedBy: createdByUserId || "system",
        notes: `Reserva criada: ${guestName} (${units} unidade(s)) de ${checkIn} a ${checkOut}`,
        metadata: {
          units,
          promoCode,
          totalPrice: pricing.priceAfterLongStay,
          discount: pricing.totalDiscount,
          createdBy: createdByUserId || 'system',
          availabilityCheck: availabilityCheck
        }
      };

      // 7. Criar fatura (invoice)
      const today = new Date();
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const invoiceData: InvoiceInsert = {
        hotel_booking_id: booking.id,
        booking_id: null,
        invoice_number: null,
        issue_date: formatDateForDB(today),
        due_date: formatDateForDB(dueDate),
        total_amount: formatDecimalForDB(pricing.priceAfterLongStay),
        tax_amount: "0.00",
        status: "pending",
        payment_terms: "Pagamento até 30 dias após emissão",
        notes: `Fatura automática - Reserva de ${guestName} (${units} unidade(s)) de ${checkIn} a ${checkOut}`,
        created_at: today,
        updated_at: today,
      };

      await tx.insert(invoices).values(invoiceData);

      // Retorna os dados para uso após o commit
      return { 
        booking, 
        unitsReserved: unitAssignments.length, 
        logData,
        availabilityUpdated
      };
    });

    // ✅ CORREÇÃO: Cria o log APÓS a transaction ser completada
    await createBookingLog(
      result.logData.bookingId,
      result.logData.action,
      result.logData.performedBy,
      result.logData.notes,
      result.logData.metadata
    );

    console.log(`✅ Reserva ${result.booking.id} criada com sucesso. Disponibilidade atualizada: ${result.availabilityUpdated}`);
    console.log(`✅ Fatura criada para reserva ${result.booking.id}`);
    
    return {
      booking: result.booking,
      unitsReserved: result.unitsReserved,
    };

  } catch (error) {
    console.error('Erro na criação da reserva:', error);
    throw error;
  }
};

// ==================== CHECK-IN / CHECK-OUT ====================

export const checkInBooking = async (
  bookingId: string,
  performedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const [updated] = await db
      .update(hotelBookings)
      .set({ 
        status: 'checked_in',
        checkedInAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hotelBookings.id, bookingId))
      .returning();

    if (updated) {
      await createBookingLog(
        bookingId,
        "check_in",
        performedBy || "system",
        `Check-in realizado`,
        { 
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'system'
        }
      );
      
      return updated;
    }
    
    return null;
  } catch (error) {
    console.error('Erro no check-in:', error);
    throw new Error(`Falha no check-in: ${(error as Error).message}`);
  }
};

export const checkOutBooking = async (
  bookingId: string,
  performedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const [updated] = await db
      .update(hotelBookings)
      .set({ 
        status: 'checked_out',
        checkedOutAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hotelBookings.id, bookingId))
      .returning();



























    if (updated) {
          await createBookingLog(
            bookingId,
            "check_out",
            performedBy || "system",
            `Check-out realizado`,
            { 
              timestamp: new Date().toISOString(),
              performedBy: performedBy || 'system'
            }
          );
      
          return updated;
        }
    
        return null;
      } catch (error) {
        console.error('Erro no check-out:', error);
        throw new Error(`Falha no check-out: ${(error as Error).message}`);
      }
    };

    /**
     * 🆕 Check-out de EVENTO - cria comissão automaticamente
     * - Atualiza status para 'completed'
     * - Cria comissão via providerPaymentService.createEventCommission
     */
    export const checkOutEventBooking = async (
      bookingId: string,
      performedBy?: string
    ): Promise<EventBooking | null> => {
      try {
        const [updated] = await db
          .update(eventBookings)
          .set({ 
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(eventBookings.id, bookingId))
          .returning();

        if (updated) {
          // 🆕 GANCHO AUTOMÁTICO: Criar comissão (não bloqueante)
          console.log('🔗 [EVENT-BOOKING] Gatilho: criando comissão para event booking', bookingId);
          providerPaymentService.createEventCommission(bookingId).catch((error: any) => {
            console.error('❌ [EVENT-BOOKING] Erro ao criar comissão (não crítico):', error.message);
          });

          await db.insert(eventBookingLogs).values({
            bookingId,
            action: 'check_out',
            performedBy: performedBy || null,
            details: {
              message: `Check-out de evento realizado`,
              performedBy: performedBy || 'system',
              timestamp: new Date().toISOString()
            }
          });

          return updated;
        }
    
        return null;
      } catch (error) {
        console.error('Erro no check-out de evento:', error);
        throw new Error(`Falha no check-out de evento: ${(error as Error).message}`);
      }
    };

// ✅ NOVA FUNÇÃO: Confirmar reserva (atualiza status para 'confirmed')
export const confirmBooking = async (
  bookingId: string,
  confirmedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    // Verificar se a reserva pode ser confirmada
    if (booking.status === 'cancelled') {
      throw new Error("Não é possível confirmar uma reserva cancelada");
    }

    if (booking.status === 'checked_in' || booking.status === 'checked_out') {
      throw new Error(`Reserva já está com status ${booking.status}`);
    }

    // Atualizar status para confirmed
    const [updated] = await db
      .update(hotelBookings)
      .set({ 
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: confirmedBy || null,
        updatedAt: new Date(),
      })
      .where(eq(hotelBookings.id, bookingId))
      .returning();

    if (!updated) {
      throw new Error("Falha ao confirmar reserva");
    }

    // Criar log da confirmação
    await createBookingLog(
      bookingId,
      "booking_confirmed",
      confirmedBy || "system",
      `Reserva confirmada`,
      { 
        timestamp: new Date().toISOString(),
        confirmedBy: confirmedBy || 'system',
        previousStatus: booking.status,
        newStatus: 'confirmed'
      }
    );

    console.log(`✅ Reserva ${bookingId} confirmada por ${confirmedBy || 'system'}`);
    return updated;

  } catch (error) {
    console.error('Erro ao confirmar reserva:', error);
    throw new Error(`Falha na confirmação: ${(error as Error).message}`);
  }
};

// ==================== CANCELAMENTO - VERSÃO CORRIGIDA COM DISPONIBILIDADE ETERNA ====================

export const cancelBooking = async (
  bookingId: string,
  reason?: string,
  cancelledBy?: string
): Promise<HotelBooking | null> => {
  try {
    // Buscar a reserva
    const [booking] = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }
    
    if (["checked_in", "checked_out", "cancelled"].includes(booking.status)) {
      throw new Error(`Não é possível cancelar reserva com status ${booking.status}`);
    }

    return await db.transaction(async (tx) => {
      // Atualizar status para cancelado
      const [cancelled] = await tx
        .update(hotelBookings)
        .set({ 
          status: 'cancelled',
          cancellationReason: reason || "Cancelado pelo cliente",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hotelBookings.id, bookingId))
        .returning();

      if (!cancelled) {
        throw new Error("Falha ao cancelar reserva");
      }

      // Remove unidades reservadas
      await tx.delete(hotelBookingUnits)
        .where(eq(hotelBookingUnits.bookingId, bookingId));

      // ✅ ATUALIZADO: Liberar disponibilidade usando a nova função
      const availabilityReleased = await releaseAvailabilityAfterCancellation(
        booking.roomTypeId,
        booking.hotelId,
        booking.checkIn,
        booking.checkOut,
        booking.units
      );

      if (!availabilityReleased) {
        console.warn(`⚠️ Disponibilidade não foi liberada completamente para reserva ${bookingId}`);
      }

      // Log do cancelamento (fora da transaction)
      const logData = {
        bookingId,
        action: "booking_cancelled",
        performedBy: cancelledBy || "system",
        notes: reason || "Reserva cancelada",
        metadata: { 
          reason: reason || "Sem motivo informado",
          cancelledBy: cancelledBy || 'system',
          timestamp: new Date().toISOString(),
          units: booking.units,
          availabilityReleased: availabilityReleased
        }
      };

      return { cancelled, logData, availabilityReleased };
    }).then(async (result) => {
      // Cria log após commit
      await createBookingLog(
        result.logData.bookingId,
        result.logData.action,
        result.logData.performedBy,
        result.logData.notes,
        result.logData.metadata
      );
      
      console.log(`✅ Reserva ${bookingId} cancelada. Disponibilidade liberada: ${result.availabilityReleased}`);
      return result.cancelled;
    });

  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    throw new Error(`Falha no cancelamento: ${(error as Error).message}`);
  }
};

// ✅ FUNÇÃO CORRIGIDA: Rejeitar reserva usando 'cancelled' em vez de 'rejected'
export const rejectBooking = async (
  bookingId: string,
  reason: string,
  rejectedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva não encontrada");
    }

    if (booking.status === "cancelled") {
      throw new Error("Reserva já está cancelada");
    }

    return await db.transaction(async (tx) => {
      // ✅ ALTERADO: Usar 'cancelled' em vez de 'rejected' para respeitar a constraint do banco
      const [rejected] = await tx
        .update(hotelBookings)
        .set({ 
          status: 'cancelled',
          cancellationReason: `Rejeitada: ${reason}`,
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hotelBookings.id, bookingId))
        .returning();

      if (!rejected) {
        throw new Error("Falha ao rejeitar reserva");
      }

      // Remove unidades reservadas
      await tx.delete(hotelBookingUnits)
        .where(eq(hotelBookingUnits.bookingId, bookingId));

      // ✅ Liberar disponibilidade usando a nova função
      const availabilityReleased = await releaseAvailabilityAfterCancellation(
        booking.roomTypeId,
        booking.hotelId,
        booking.checkIn,
        booking.checkOut,
        booking.units
      );

      const logData = {
        bookingId,
        action: "booking_rejected",
        performedBy: rejectedBy || "system",
        notes: `Reserva rejeitada: ${reason}`,
        metadata: { 
          reason,
          rejectedBy: rejectedBy || 'system',
          timestamp: new Date().toISOString(),
          units: booking.units,
          availabilityReleased: availabilityReleased
        }
      };

      return { rejected, logData, availabilityReleased };
    }).then(async (result) => {
      await createBookingLog(
        result.logData.bookingId,
        result.logData.action,
        result.logData.performedBy,
        result.logData.notes,
        result.logData.metadata
      );
      
      console.log(`✅ Reserva ${bookingId} rejeitada. Disponibilidade liberada: ${result.availabilityReleased}`);
      return result.rejected;
    });

  } catch (error) {
    console.error('Erro ao rejeitar reserva:', error);
    throw new Error(`Falha na rejeição: ${(error as Error).message}`);
  }
};

// ==================== LISTAGEM E DETALHES ====================

export const getBookingById = async (id: string): Promise<HotelBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.id, id));
    
    return booking || null;
  } catch (error) {
    console.error('Erro ao buscar booking:', error);
    return null;
  }
};

export const getBookingsByHotel = async (
  hotelId: string,
  status?: string[]
): Promise<HotelBooking[]> => {
  try {
    let conditions: any[] = [eq(hotelBookings.hotelId, hotelId)];
    
    if (status && status.length > 0) {
      conditions.push(sql`${hotelBookings.status} IN (${status.join(', ')})`);
    }
    
    return await db
      .select()
      .from(hotelBookings)
      .where(and(...conditions))
      .orderBy(desc(hotelBookings.createdAt));
  } catch (error) {
    console.error('Erro ao buscar bookings do hotel:', error);
    return [];
  }
};

export const getBookingsByGuestEmail = async (email: string): Promise<HotelBooking[]> => {
  try {
    return await db
      .select()
      .from(hotelBookings)
      .where(eq(hotelBookings.guestEmail, email))
      .orderBy(desc(hotelBookings.checkIn));
  } catch (error) {
    console.error('Erro ao buscar bookings por email:', error);
    return [];
  }
};

export const getUpcomingCheckIns = async (hotelId: string, daysAhead: number = 7) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    const futureStr = future.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(hotelBookings)
      .where(and(
        eq(hotelBookings.hotelId, hotelId),
        eq(hotelBookings.status, 'confirmed'),
        sql`${hotelBookings.checkIn}::date >= ${today}::date`,
        sql`${hotelBookings.checkIn}::date <= ${futureStr}::date`
      ))
      .orderBy(hotelBookings.checkIn);
  } catch (error) {
    console.error('Erro ao buscar check-ins próximos:', error);
    return [];
  }
};

// ✅ NOVA FUNÇÃO: Verificar disponibilidade (wrapper para o roomTypeService)
export const checkAvailability = async (
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
  units: number = 1
) => {
  return await checkAvailabilityForDates(roomTypeId, checkIn, checkOut, units);
};

// ==================== FUNÇÕES ADICIONAIS ====================

/**
 * Obter logs de uma reserva
 */
export const getBookingLogs = async (bookingId: string) => {
  try {
    return await db
      .select()
      .from(hotelBookingLogs)
      .where(eq(hotelBookingLogs.bookingId, bookingId))
      .orderBy(desc(hotelBookingLogs.createdAt));
  } catch (error) {
    console.error('Erro ao buscar logs da reserva:', error);
    return [];
  }
};

/**
 * Verificar status atual de uma reserva
 */
export const getBookingStatus = async (bookingId: string): Promise<string | null> => {
  try {
    const booking = await getBookingById(bookingId);
    return booking?.status || null;
  } catch (error) {
    console.error('Erro ao verificar status da reserva:', error);
    return null;
  }
};

/**
 * Atualizar informações do hóspede
 */
export const updateGuestInfo = async (
  bookingId: string,
  updates: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    specialRequests?: string;
  },
  updatedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const updateData: any = { updatedAt: new Date() };
    
    if (updates.guestName) updateData.guestName = updates.guestName;
    if (updates.guestEmail) updateData.guestEmail = updates.guestEmail;
    if (updates.guestPhone !== undefined) updateData.guestPhone = updates.guestPhone;
    if (updates.specialRequests !== undefined) updateData.specialRequests = updates.specialRequests;

    const [updated] = await db
      .update(hotelBookings)
      .set(updateData)
      .where(eq(hotelBookings.id, bookingId))
      .returning();

    if (updated) {
      await createBookingLog(
        bookingId,
        "guest_info_updated",
        updatedBy || "system",
        `Informações do hóspede atualizadas`,
        { 
          updates,
          performedBy: updatedBy || 'system',
          timestamp: new Date().toISOString()
        }
      );
      
      return updated;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao atualizar informações do hóspede:', error);
    throw new Error(`Falha na atualização: ${(error as Error).message}`);
  }
};

/**
 * Atualizar status de pagamento
 */
export const updatePaymentStatus = async (
  bookingId: string,
  paymentStatus: string,
  paymentReference?: string,
  updatedBy?: string
): Promise<HotelBooking | null> => {
  try {
    const updateData: any = { 
      paymentStatus,
      updatedAt: new Date()
    };
    
    if (paymentReference !== undefined) {
      updateData.paymentReference = paymentReference;
    }

    const [updated] = await db
      .update(hotelBookings)
      .set(updateData)
      .where(eq(hotelBookings.id, bookingId))
      .returning();

    if (updated) {
      await createBookingLog(
        bookingId,
        "payment_status_updated",
        updatedBy || "system",
        `Status de pagamento alterado para ${paymentStatus}`,
        { 
          paymentStatus,
          paymentReference: paymentReference || null,
          updatedBy: updatedBy || 'system',
          timestamp: new Date().toISOString()
        }
      );
      
      return updated;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao atualizar status de pagamento:', error);
    throw new Error(`Falha na atualização: ${(error as Error).message}`);
  }
};

/**
 * ✅ NOVA FUNÇÃO: Obter unidades reservadas para uma reserva
 */
export const getBookingUnits = async (bookingId: string) => {
  try {
    return await db
      .select()
      .from(hotelBookingUnits)
      .where(eq(hotelBookingUnits.bookingId, bookingId))
      .orderBy(hotelBookingUnits.date, hotelBookingUnits.unitNumber);
  } catch (error) {
    console.error('Erro ao buscar unidades da reserva:', error);
    return [];
  }
};

/**
 * ✅ NOVA FUNÇÃO: Calcular noites de estadia
 */
export const calculateStayNights = (checkIn: string, checkOut: string): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
};

/**
 * Função para converter snake_case para camelCase (compatibilidade)
 */
export const normalizeBookingData = (data: any): CreateBookingData => {
  return {
    hotelId: data.hotelId || data.hotel_id,
    roomTypeId: data.roomTypeId || data.room_type_id,
    guestName: data.guestName || data.guest_name,
    guestEmail: data.guestEmail || data.guest_email,
    guestPhone: data.guestPhone || data.guest_phone,
    checkIn: data.checkIn || data.check_in,
    checkOut: data.checkOut || data.check_out,
    adults: data.adults || 2,
    children: data.children || 0,
    units: data.units || 1,
    specialRequests: data.specialRequests || data.special_requests,
    promoCode: data.promoCode || data.promo_code,
    userId: data.userId || data.user_id,
    // ✅ CORREÇÃO: Alterado de 'confirmed' para 'pending_confirmation'
    status: data.status || 'pending_confirmation',
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
  };
};

// ==================== FUNÇÕES DE RESERVA DE ESPAÇOS DE EVENTOS ====================
// ⚠️ ESTAS FUNÇÕES SÃO USADAS PELO eventSpaceController.ts
// Import necessário para event bookings
import { eventBookings, eventBookingLogs, eventSpaces } from "../../../shared/schema";

// ==================== TIPOS PARA EVENTOS ====================
export interface CreateEventBookingData {
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: Record<string, any>;
  cateringRequired?: boolean;
  userId?: string;
  userEmail?: string;
  basePrice: string;
  cateringPrice?: string;
  totalPrice: string;
  securityDeposit: string;
  status: string;
  paymentStatus: string;
  depositPaid?: string;
  balanceDue?: string;
}

export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;

/**
 * Criar uma reserva de espaço de evento
 */
export const createEventBooking = async (
  data: CreateEventBookingData,
  userId?: string
): Promise<EventBooking> => {
  try {
    const now = new Date();
    
        // ✅ CORREÇÃO: Incluir todos os campos obrigatórios
        const bookingData: EventBookingInsert = {
          eventSpaceId: data.eventSpaceId,
          hotelId: data.hotelId,                          // ✅ ESSENCIAL: hotelId NÃO pode ser nulo!
          organizerName: data.organizerName,              // ✅ ESSENCIAL
          organizerEmail: data.organizerEmail,            // ✅ ESSENCIAL
          organizerPhone: data.organizerPhone || null,
          eventTitle: data.eventTitle,                    // ✅ ESSENCIAL
          eventDescription: data.eventDescription || null,
          eventType: data.eventType,                      // ✅ ESSENCIAL
          startDate: data.startDate,                       // ✅ ESSENCIAL
          endDate: data.endDate,                           // ✅ ESSENCIAL
          expectedAttendees: data.expectedAttendees,
          specialRequests: data.specialRequests || null,
          additionalServices: data.additionalServices || {},
          cateringRequired: data.cateringRequired || false,
          userId: userId || data.userId || null,
          userEmail: data.userEmail || data.organizerEmail || null,
          basePrice: data.basePrice || "0",
          cateringPrice: data.cateringPrice || "0",
          totalPrice: data.totalPrice || "0",
          securityDeposit: data.securityDeposit || "0",
          depositPaid: data.depositPaid || "0",
          balanceDue: String(Number(data.totalPrice || "0") - Number(data.depositPaid || "0")),
          status: data.status || 'pending_approval',
          paymentStatus: data.paymentStatus || 'pending',
          createdAt: now,
          updatedAt: now,
        };

    const [booking] = await db
      .insert(eventBookings)
      .values(bookingData)
      .returning();

    console.log(`✅ [EVENT-BOOKING] Reserva de evento criada: ${booking.id}`);
    return booking;
  } catch (error) {
    console.error('❌ [EVENT-BOOKING] Erro ao criar reserva de evento:', error);
    throw error;
  }
};

/**
 * Buscar reserva de evento por ID
 */
export const getEventBookingById = async (id: string): Promise<EventBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, id));
    
    return booking || null;
  } catch (error) {
    console.error('Erro ao buscar event booking:', error);
    return null;
  }
};

/**
 * Buscar reservas de evento por hotel
 */
export const getEventBookingsByHotel = async (
  hotelId: string,
  status?: string[]
): Promise<EventBooking[]> => {
  try {
    let conditions: any[] = [eq(eventBookings.hotelId, hotelId)];
    
    if (status && status.length > 0) {
      conditions.push(sql`${eventBookings.status} IN (${status.join(', ')})`);
    }
    
    return await db
      .select()
      .from(eventBookings)
      .where(and(...conditions))
      .orderBy(desc(eventBookings.createdAt));
  } catch (error) {
    console.error('Erro ao buscar event bookings do hotel:', error);
    return [];
  }
};

/**
 * Buscar reservas de evento por email do organizador
 */
export const getEventBookingsByOrganizerEmail = async (email: string): Promise<EventBooking[]> => {
  try {
    return await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.organizerEmail, email))
      .orderBy(desc(eventBookings.createdAt));
  } catch (error) {
    console.error('Erro ao buscar event bookings por email:', error);
    return [];
  }
};

/**
 * Obter logs de uma reserva de evento
 */
export const getEventBookingLogs = async (bookingId: string) => {
  try {
    return await db
      .select()
      .from(eventBookingLogs)
      .where(eq(eventBookingLogs.bookingId, bookingId))
      .orderBy(desc(eventBookingLogs.createdAt));
  } catch (error) {
    console.error('Erro ao buscar logs da event booking:', error);
    return [];
  }
};

/**
 * Confirmar uma reserva de evento
 */
export const confirmEventBooking = async (
  bookingId: string,
  confirmedBy?: string
): Promise<EventBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva de evento não encontrada");
    }

    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      throw new Error("Não é possível confirmar uma reserva cancelada ou rejeitada");
    }

    const [updated] = await db
      .update(eventBookings)
      .set({
        status: 'confirmed',
        updatedAt: new Date(),
      })
      .where(eq(eventBookings.id, bookingId))
      .returning();

    if (updated) {
      await db.insert(eventBookingLogs).values({
        bookingId,
        action: 'confirmed',
        performedBy: confirmedBy || null,
        details: {
          message: 'Reserva confirmada',
          confirmedBy: confirmedBy || 'system',
          timestamp: new Date().toISOString()
        }
      });
      return updated;
    }

    return null;
  } catch (error) {
    console.error('Erro ao confirmar event booking:', error);
    throw error;
  }
};

/**
 * Cancelar uma reserva de evento
 */
export const cancelEventBooking = async (
  bookingId: string,
  reason?: string,
  cancelledBy?: string
): Promise<EventBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva de evento não encontrada");
    }

    if (booking.status === 'cancelled') {
      throw new Error("Reserva já está cancelada");
    }

    const [updated] = await db
      .update(eventBookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(eventBookings.id, bookingId))
      .returning();

    if (updated) {
      await db.insert(eventBookingLogs).values({
        bookingId,
        action: 'cancelled',
        performedBy: cancelledBy || null,
        details: {
          message: reason || 'Reserva cancelada',
          cancelledBy: cancelledBy || 'system',
          timestamp: new Date().toISOString()
        }
      });
      return updated;
    }

    return null;
  } catch (error) {
    console.error('Erro ao cancelar event booking:', error);
    throw error;
  }
};

/**
 * Rejeitar uma reserva de evento
 */
export const rejectEventBooking = async (
  bookingId: string,
  reason: string,
  rejectedBy?: string
): Promise<EventBooking | null> => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, bookingId));

    if (!booking) {
      throw new Error("Reserva de evento não encontrada");
    }

    const [updated] = await db
      .update(eventBookings)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(eventBookings.id, bookingId))
      .returning();

    if (updated) {
      await db.insert(eventBookingLogs).values({
        bookingId,
        action: 'rejected',
        performedBy: rejectedBy || null,
        details: {
          message: `Reserva rejeitada: ${reason}`,
          rejectedBy: rejectedBy || 'system',
          reason,
          timestamp: new Date().toISOString()
        }
      });
      return updated;
    }

    return null;
  } catch (error) {
    console.error('Erro ao rejeitar event booking:', error);
    throw error;
  }
};

/**
 * Obter reserva de evento com detalhes (booking + space)
 */
export const getEventBookingWithDetails = async (bookingId: string) => {
  try {
    const [booking] = await db
      .select()
      .from(eventBookings)
      .where(eq(eventBookings.id, bookingId));

    if (!booking) return null;

    const [space] = await db
      .select()
      .from(eventSpaces)
      .where(eq(eventSpaces.id, booking.eventSpaceId));

    return {
      booking,
      space: space || null,
    };
  } catch (error) {
    console.error('Erro ao buscar event booking com detalhes:', error);
    return null;
  }
};

/**
 * Atualizar uma reserva de evento
 */
export const updateEventBooking = async (
  bookingId: string,
  data: Partial<CreateEventBookingData>,
  userId?: string
): Promise<EventBooking | null> => {
  try {
    const updateData: any = { updatedAt: new Date() };
    
    const fieldsToUpdate = [
      'organizerName', 'organizerEmail', 'organizerPhone',
      'eventTitle', 'eventDescription', 'eventType',
      'expectedAttendees', 'specialRequests', 'additionalServices',
      'cateringRequired', 'basePrice', 'cateringPrice',
      'totalPrice', 'securityDeposit', 'depositPaid',
      'balanceDue', 'status', 'paymentStatus'
    ];

    for (const field of fieldsToUpdate) {
      if ((data as any)[field] !== undefined) {
        updateData[field] = (data as any)[field];
      }
    }

    const [updated] = await db
      .update(eventBookings)
      .set(updateData)
      .where(eq(eventBookings.id, bookingId))
      .returning();

    if (updated) {
      await db.insert(eventBookingLogs).values({
        bookingId,
        action: 'updated',
        performedBy: userId || null,
        details: {
          message: 'Reserva atualizada',
          updatedBy: userId || 'system',
          timestamp: new Date().toISOString()
        }
      });
      return updated;
    }

    return null;
  } catch (error) {
    console.error('Erro ao atualizar event booking:', error);
    throw error;
  }
};

/**
 * Obter reservas pendentes de aprovação para um hotel
 */
export const getPendingApprovalBookings = async (hotelId: string): Promise<EventBooking[]> => {
  try {
    return await db
      .select()
      .from(eventBookings)
      .where(
        and(
          eq(eventBookings.hotelId, hotelId),
          eq(eventBookings.status, 'pending_approval')
        )
      )
      .orderBy(desc(eventBookings.createdAt));
  } catch (error) {
    console.error('Erro ao buscar event bookings pendentes:', error);
    return [];
  }
};

/**
 * Exportar TODAS as funções do serviço (hotéis + eventos)
 */
export default {
  // Funções de hotéis
  createHotelBooking,
  getBookingById,
  getBookingsByHotel,
  getBookingsByGuestEmail,
  getUpcomingCheckIns,
  checkInBooking,
  checkOutBooking,
  confirmBooking,
  cancelBooking,
  rejectBooking,
  checkAvailability,
  updateGuestInfo,
  updatePaymentStatus,
  getBookingLogs,
  getBookingStatus,
  getBookingUnits,
  calculateStayNights,
  normalizeBookingData,
  
  // Funções de eventos
  createEventBooking,
  getEventBookingById,
  getEventBookingsByHotel,
  getEventBookingsByOrganizerEmail,
  getEventBookingLogs,
  confirmEventBooking,
  cancelEventBooking,
  rejectEventBooking,
  getEventBookingWithDetails,
  updateEventBooking,
  getPendingApprovalBookings,
};