import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { rides, bookings } from '../shared/schema';
import { eq, and, gte, ilike, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ===== SCHEMAS DE VALIDAÇÃO =====
const createRideSchema = z.object({
  driverId: z.string().min(1, "ID do motorista é obrigatório"),
  driverName: z.string().optional(),
  fromAddress: z.string().min(1, "Origem é obrigatória"),
  toAddress: z.string().min(1, "Destino é obrigatório"),
  departureDate: z.string().min(1, "Data é obrigatória"),
  departureTime: z.string().optional(),
  pricePerSeat: z.number().positive("Preço deve ser positivo"),
  availableSeats: z.number().min(1).max(8), // 👈 Alterado de maxPassengers para availableSeats
  type: z.string().optional(),
  description: z.string().optional(),
});

const searchRidesSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  passengers: z.number().default(1),
});

const bookRideSchema = z.object({
  rideId: z.string(),
  passengerId: z.string(),
  seatsBooked: z.number().min(1),
  phone: z.string(),
  email: z.string().email(),
  notes: z.string().optional(),
});

// ===== MIDDLEWARE PARA JSON =====
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ===== RIDES API =====

// Criar viagem (Drizzle ORM)
router.post('/create', async (req, res) => {
  try {
    const rideData = createRideSchema.parse(req.body);
    
    console.log('🚗 [DRIZZLE] Criando viagem:', rideData);

    // Preparar dados para inserção
    const newRideData = {
      id: uuidv4(),
      driverId: rideData.driverId,
      driverName: rideData.driverName || 'Motorista',
      fromAddress: rideData.fromAddress,
      toAddress: rideData.toAddress,
      departureDate: new Date(rideData.departureDate),
      departureTime: rideData.departureTime || '08:00',
      availableSeats: rideData.availableSeats, // 👈 Alterado para usar availableSeats
      pricePerSeat: rideData.pricePerSeat.toString(),
      vehicleType: rideData.type || 'sedan',
      additionalInfo: rideData.description || '',
      status: 'active',
      type: 'regular',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [newRide] = await db
      .insert(rides)
      .values(newRideData)
      .returning();

    console.log('✅ [DRIZZLE] Viagem criada:', newRide.id);

    res.status(201).json({
      success: true,
      ride: newRide
    });

  } catch (error) {
    console.error('❌ [DRIZZLE] Erro ao criar viagem:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Buscar viagens (Drizzle ORM) - CORRIGIDO E OTIMIZADO
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 [DRIZZLE] Query params recebidos:', req.query);
    
    // Converter query params para tipos adequados
    const queryParams = {
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      passengers: req.query.passengers 
        ? parseInt(String(req.query.passengers)) 
        : 1
    };

    console.log('📊 [DRIZZLE] Parâmetros processados:', queryParams);

    const { from, to, passengers = 1 } = searchRidesSchema.parse(queryParams);

    console.log('🔍 [DRIZZLE] Busca:', { from, to, passengers });

    let conditions = [
      gte(rides.availableSeats, passengers)
    ];

    // ✅ FILTROS OTIMIZADOS - ILIKE com % apenas no final
    if (from) {
      conditions.push(ilike(rides.fromAddress, `${from}%`));
    }
    if (to) {
      conditions.push(ilike(rides.toAddress, `${to}%`));
    }

    const results = await db
      .select()
      .from(rides)
      .where(and(...conditions))
      .orderBy(desc(rides.departureDate))
      .limit(20);

    console.log(`✅ [DRIZZLE] Encontradas ${results.length} viagens`);

    // Transformar para formato compatível com frontend
    const ridesFormatted = results.map(ride => ({
      id: ride.id,
      fromAddress: ride.fromAddress || '',
      toAddress: ride.toAddress || '',
      departureDate: ride.departureDate?.toISOString() || '',
      pricePerSeat: ride.pricePerSeat || '0',
      availableSeats: ride.availableSeats || 0,
      currentPassengers: 0,
      type: ride.vehicleType || 'sedan',
      driverName: ride.driverName || 'Motorista',
      driverRating: '4.50',
      vehiclePhoto: null,
    }));

    res.json(ridesFormatted);

  } catch (error) {
    console.error('❌ [DRIZZLE] Erro ao buscar viagens:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Parâmetros de busca inválidos',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reservar viagem (Drizzle ORM) - ✅✅✅ VERSÃO MELHORADA
router.post('/book', async (req, res) => {
  try {
    const bookingData = bookRideSchema.parse(req.body);
    
    console.log('📦 [DRIZZLE] Criando reserva:', bookingData);

    // Verificar se a viagem existe
    const [ride] = await db
      .select()
      .from(rides)
      .where(eq(rides.id, bookingData.rideId));

    if (!ride) {
      return res.status(404).json({
        error: 'Viagem não encontrada'
      });
    }

    // ✅✅✅ VERIFICAÇÃO MELHORADA DE DISPONIBILIDADE
    const availableSeats = ride.availableSeats || 0;
    
    // Verificar se há pelo menos 1 lugar disponível
    if (availableSeats < 1) {
      return res.status(400).json({
        error: 'Viagem lotada. Não há lugares disponíveis.',
        availableSeats: availableSeats,
        requestedSeats: bookingData.seatsBooked
      });
    }

    // Verificar se há lugares suficientes para a reserva
    if (availableSeats < bookingData.seatsBooked) {
      return res.status(400).json({
        error: `Apenas ${availableSeats} lugar(es) disponível(is)`,
        availableSeats: availableSeats,
        requestedSeats: bookingData.seatsBooked
      });
    }

    // Calcular preço total
    const totalPrice = (parseFloat(ride.pricePerSeat || '0') * bookingData.seatsBooked);

    // Criar reserva COMPLETA
    const [newBooking] = await db
      .insert(bookings)
      .values({
        id: uuidv4(),
        passengerId: bookingData.passengerId,
        rideId: bookingData.rideId,
        type: 'ride',
        status: 'confirmed',
        totalPrice: totalPrice.toString(),
        seatsBooked: bookingData.seatsBooked,
        passengers: bookingData.seatsBooked,
        guestEmail: bookingData.email,
        guestPhone: bookingData.phone,
        guestName: 'Passageiro',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Atualizar lugares disponíveis
    await db
      .update(rides)
      .set({
        availableSeats: availableSeats - bookingData.seatsBooked
      })
      .where(eq(rides.id, bookingData.rideId));

    console.log('✅ [DRIZZLE] Reserva criada:', newBooking.id);

    res.status(201).json({
      success: true,
      booking: newBooking,
      availableSeats: availableSeats - bookingData.seatsBooked // ✅ Informação útil
    });

  } catch (error) {
    console.error('❌ [DRIZZLE] Erro ao criar reserva:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados de reserva inválidos',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Link-A Drizzle API',
    timestamp: new Date().toISOString(),
    database: 'SQLite + Drizzle ORM'
  });
});

export default router;