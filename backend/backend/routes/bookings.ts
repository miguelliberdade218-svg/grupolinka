import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { bookings, rides, users } from '../shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { verifyFirebaseToken } from '../middleware/role-auth';
import { AuthenticatedUser } from '../shared/types';

const router = Router();

// ===== SCHEMAS DE VALIDAÇÃO =====
const createBookingSchema = z.object({
  rideId: z.string().optional(),
  accommodationId: z.string().optional(), // ✅ CORRIGIDO: accommodationId em vez de hotelId
  roomTypeId: z.string().optional(), // ✅ ADICIONADO: campo para roomTypeId
  type: z.enum(['ride', 'accommodation']),
  guestInfo: z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(1, "Telefone é obrigatório"),
  }),
  details: z.object({
    passengers: z.number().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    totalAmount: z.number().positive("Valor deve ser positivo"),
  }),
});

// ===== BOOKINGS API =====

// ✅ ROTA COMPATÍVEL TEMPORÁRIA (APENAS PARA RIDES) - RESOLVE O ERRO 404
router.post("/", verifyFirebaseToken, async (req: any, res) => {
  try {
    console.log('📦 [BOOKING-COMPAT] Dados recebidos para reserva:', req.body);
    
    // ✅ VALIDAÇÃO SIMPLES: Aceitar apenas rides
    const { rideId, passengers, pickupLocation, notes } = req.body;

    if (!rideId || !passengers) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados incompletos para reserva de ride: rideId e passengers são obrigatórios' 
      });
    }

    const userId = (req.user as AuthenticatedUser)?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // ✅ BUSCAR RIDE ESPECÍFICO
    const [ride] = await db
      .select()
      .from(rides)
      .where(eq(rides.id, rideId));

    if (!ride) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    // ✅ VERIFICAR ASSENTOS DISPONÍVEIS
    if ((ride.availableSeats || 0) < passengers) {
      return res.status(400).json({ 
        error: `Apenas ${ride.availableSeats} assentos disponíveis` 
      });
    }

    // ✅ CALCULAR PREÇO
    const pricePerSeat = parseFloat(ride.pricePerSeat);
    const totalAmount = pricePerSeat * passengers;

    // ✅ EXTRAIR INFORMAÇÕES DO CLIENTE DAS NOTES
    let guestName = 'Cliente';
    let guestEmail = '';
    let guestPhone = '';
    
    if (notes) {
      // Tentar extrair telefone e email das notes
      const phoneMatch = notes.match(/Telefone:\s*([+\d\s()-]+)/i);
      const emailMatch = notes.match(/Email:\s*([^\s,.]+@[^\s,.]+\.[^\s,.]+)/i);
      
      if (phoneMatch) guestPhone = phoneMatch[1].trim();
      if (emailMatch) guestEmail = emailMatch[1].trim();
      
      // Se não encontrar padrão específico, usar o usuário autenticado
      if (!guestEmail) {
        // Buscar email do usuário autenticado
        const [user] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, userId));
        if (user?.email) guestEmail = user.email;
      }
    }

    // ✅ CRIAR BOOKING APENAS PARA RIDE
    const [newBooking] = await db
      .insert(bookings)
      .values({
        passengerId: userId,
        rideId: rideId,
        accommodationId: null, // ✅ CORRIGIDO: usar accommodationId em vez de hotelId
        roomTypeId: null, // ✅ CORRIGIDO: usar roomTypeId
        status: 'confirmed',
        totalPrice: totalAmount.toString(),
        guestName: guestName,
        guestEmail: guestEmail,
        guestPhone: guestPhone,
        passengers: passengers,
        seatsBooked: passengers,
        type: 'ride', // ✅ FIXO COMO RIDE
      })
      .returning();

    // ✅ ATUALIZAR ASSENTOS DO RIDE
    await db
      .update(rides)
      .set({
        availableSeats: (ride.availableSeats || 0) - passengers
      })
      .where(eq(rides.id, rideId));

    console.log('✅ [BOOKING-COMPAT] Reserva de ride criada com sucesso:', newBooking.id);

    res.status(201).json({
      success: true,
      booking: newBooking,
      message: 'Reserva de viagem confirmada com sucesso!'
    });

  } catch (error) {
    console.error('❌ [BOOKING-COMPAT] Erro ao criar reserva de ride:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao criar reserva de viagem'
    });
  }
});

// Criar reserva
router.post('/create', verifyFirebaseToken, async (req: any, res) => {
  try {
    const bookingData = createBookingSchema.parse(req.body);
    const userId = (req.user as AuthenticatedUser)?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('📦 [BOOKING] Criando reserva:', { 
      type: bookingData.type, 
      userId,
      rideId: bookingData.rideId,
      accommodationId: bookingData.accommodationId, // ✅ CORRIGIDO
      roomTypeId: bookingData.roomTypeId // ✅ ADICIONADO
    });

    const passengers = bookingData.details.passengers || 1;

    // Verificar se é reserva de ride
    if (bookingData.type === 'ride' && bookingData.rideId) {
      const [ride] = await db
        .select()
        .from(rides)
        .where(eq(rides.id, bookingData.rideId));

      if (!ride) {
        return res.status(404).json({ error: 'Viagem não encontrada' });
      }

      // Verificar lugares disponíveis
      if ((ride.availableSeats || 0) < passengers) {
        return res.status(400).json({ error: 'Lugares insuficientes' });
      }

      // Atualizar lugares disponíveis
      await db
        .update(rides)
        .set({
          availableSeats: (ride.availableSeats || 0) - passengers
        })
        .where(eq(rides.id, bookingData.rideId));
    }

    // ✅ CORREÇÃO: Adicionar seatsBooked (conforme schema)
    const [newBooking] = await db
      .insert(bookings)
      .values({
        passengerId: userId,
        rideId: bookingData.rideId || null,
        accommodationId: bookingData.accommodationId || null, // ✅ CORRIGIDO
        roomTypeId: bookingData.roomTypeId || null, // ✅ CORRIGIDO
        status: 'confirmed',
        totalPrice: bookingData.details.totalAmount.toString(),
        guestName: bookingData.guestInfo.name,
        guestEmail: bookingData.guestInfo.email,
        guestPhone: bookingData.guestInfo.phone,
        checkInDate: bookingData.details.checkIn ? new Date(bookingData.details.checkIn) : null,
        checkOutDate: bookingData.details.checkOut ? new Date(bookingData.details.checkOut) : null,
        passengers: passengers,
        seatsBooked: passengers, // ✅ ADICIONADO: propriedade obrigatória
      })
      .returning();

    console.log('✅ [BOOKING] Reserva criada:', newBooking.id);

    res.status(201).json({
      success: true,
      booking: {
        ...newBooking,
        serviceType: bookingData.type
      },
      message: `Reserva de ${bookingData.type} confirmada com sucesso!`
    });

  } catch (error) {
    console.error('❌ [BOOKING] Erro ao criar reserva:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Buscar reservas do usuário
router.get('/user', verifyFirebaseToken, async (req: any, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('🔍 [BOOKING] Buscando reservas do usuário:', userId);

    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.passengerId, userId))
      .orderBy(desc(bookings.createdAt))
      .limit(50);

    console.log(`✅ [BOOKING] Encontradas ${userBookings.length} reservas`);

    const bookingsWithServiceType = userBookings.map(booking => ({
      ...booking,
      serviceType: booking.rideId ? 'ride' : 
                  booking.accommodationId ? 'accommodation' : 'unknown' // ✅ CORRIGIDO
    }));

    res.json({
      success: true,
      bookings: bookingsWithServiceType
    });

  } catch (error) {
    console.error('❌ [BOOKING] Erro ao buscar reservas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Cancelar reserva
router.delete('/:bookingId', verifyFirebaseToken, async (req: any, res) => {
  try {
    const { bookingId } = req.params;
    const userId = (req.user as AuthenticatedUser)?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar reserva
    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(
        eq(bookings.id, bookingId),
        eq(bookings.passengerId, userId)
      ));

    if (!booking) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    // Se for reserva de ride, devolver lugares
    if (booking.rideId) {
      await db
        .update(rides)
        .set({
          availableSeats: sql`available_seats + ${booking.passengers || 1}`
        })
        .where(eq(rides.id, booking.rideId));
    }

    // Cancelar reserva
    await db
      .update(bookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(bookings.id, bookingId));

    console.log('✅ [BOOKING] Reserva cancelada:', bookingId);

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    });

  } catch (error) {
    console.error('❌ [BOOKING] Erro ao cancelar reserva:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Link-A Bookings API',
    timestamp: new Date().toISOString()
  });
});

export default router;





