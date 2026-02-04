// src/modules/hotels/hotelController.ts - VERSÃO FINAL CORRIGIDA (03/02/2026)
// ✅ CORREÇÃO APLICADA: País sempre "Moçambique" (forçado em POST e PUT)
// ✅ CORREÇÕES APLICADAS: Validação de available_units vs total_units e price com null/undefined
// ✅ CORREÇÃO DO BULK UPDATE: Aceitar ambos os formatos (snake_case e camelCase) do frontend
// ✅ CORREÇÃO CRÍTICA: Transformação automática de snake_case para camelCase no schema
// ✅ ATUALIZADO: Adicionado campo location_id nos schemas de hotel

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import {
  searchHotels,
  getHotelById,
  getHotelBySlug,
  getHotelsByHost,
  createHotel,
  updateHotel,
  isHotelOwner,
  getHotelWithRoomTypes,
  getHotelsByProvince,
  getHotelsByLocality,
  getHostDashboardSummary,
  syncHotelLocation, // ✅ NOVO: Adicionado para sincronização de localização
} from './hotelService';

import {
  getRoomTypesByHotel,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deactivateRoomType,
  getAvailabilityCalendar,
  checkAvailabilityForDates,
  bulkUpdateAvailability,
} from './roomTypeService';

import {
  createHotelBooking,
  CreateBookingData,
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  rejectBooking,
  getBookingById,
  getBookingsByHotel,
  getBookingsByGuestEmail,
  getUpcomingCheckIns,
} from './hotelBookingService';

import {
  getActivePromotions,
  getPromotionsByHotel,
  getSeasonsByHotel,
  getLongStaySettings,
  calculateFinalBookingPrice,
  createPromotion,
  updatePromotion as serviceUpdatePromotion,
} from './hotelPromotionService';

import {
  getBookingPaymentDetails,
  registerManualPayment,
  getPaymentOptionsForHotel,
  calculateRequiredDeposit,
  getRecentPaymentsByHotel,
  getPendingPayments,
  processHotelBookingWithPayment,
  cancelHotelBookingForNonPayment,
  getHotelPaymentsByBooking,
  refreshInvoiceStatus,
  getInvoiceDetails,
  type PaymentMethod,
  type PaymentType
} from './hotelPaymentService';

// Reviews Service
import { HotelReviewsService } from './hotel-reviews.service';
const hotelReviewsService = new HotelReviewsService();

// ==================== VALIDATION SCHEMAS ====================

// Schema base sem transform
const createHotelBaseSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(5),
  locality: z.string().min(2), // Obrigatório!
  province: z.string().min(2),
  country: z.string().default('Moçambique'),
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).optional(), // String com formato numérico
  lng: z.string().regex(/^-?\d+(\.\d+)?$/).optional(), // String com formato numérico
  location_id: z.string().uuid().optional(), // ✅ NOVO: Referência à localização real
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  policies: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(), // Apenas HH:mm
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(), // Apenas HH:mm
  host_id: z.string().min(1),
});

// Schema com transform aplicado
const createHotelSchema = createHotelBaseSchema.transform((data) => ({
  ...data,
  slug: data.slug || generateSlug(data.name), // Garante que slug nunca seja undefined
}));

// Schema para update (usando partial do schema base)
const updateHotelSchema = createHotelBaseSchema.partial();

// Schema para criação/atualização de promoção
const createPromotionSchema = z.object({
  promo_code: z.string().min(3).max(50),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  max_uses: z.number().int().min(0).optional(),
  is_active: z.boolean().optional().default(true),
});

const updatePromotionSchema = createPromotionSchema.partial();

// Schema de criação de booking (ATUALIZADO: hotelId removido pois vem da rota e validação de datas)
const createBookingSchema = z.object({
  roomTypeId: z.string().uuid(),
  guestName: z.string().min(2, "Nome do hóspede obrigatório"),
  guestEmail: z.string().email("Email inválido"),
  guestPhone: z.string().optional().nullable(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  adults: z.number().int().min(1, "Pelo menos 1 adulto"),
  children: z.number().int().min(0).optional().default(0),
  units: z.number().int().min(1).optional().default(1),
  specialRequests: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  status: z.string().optional().default('confirmed'),
  paymentStatus: z.string().optional().default('pending'),
  userId: z.string().optional().nullable(),
}).refine((data) => {
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  return checkOutDate > checkInDate;
}, {
  message: "Data de check-out deve ser posterior à data de check-in",
  path: ["checkOut"],
});

// ✅ CORREÇÃO: Schema de room type atualizado para usar min_nights_default
const createRoomTypeSchema = z.object({
  hotel_id: z.string().uuid(),
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  capacity: z.number().int().min(1).default(2),
  base_price: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "base_price deve ser um número positivo"
  }),
  total_units: z.number().int().positive(),
  base_occupancy: z.number().int().positive(),
  min_nights_default: z.number().int().positive().optional().default(1), // ✅ CORREÇÃO: min_nights_default em vez de min_nights
  extra_adult_price: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "extra_adult_price deve ser um número não negativo"
  }).optional(),
  extra_child_price: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "extra_child_price deve ser um número não negativo"
  }).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  is_active: z.boolean().optional().default(true),
}).refine((data) => data.capacity >= data.base_occupancy, {
  message: "A capacidade total deve ser maior ou igual à ocupação base",
  path: ["capacity"],
});

const manualPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(["mpesa", "bank_transfer", "card", "cash", "mobile_money"]),
  reference: z.string().min(1, "Referência é obrigatória"),
  notes: z.string().optional(),
  paymentType: z.enum(["partial", "full"]).optional().default("partial"),
});

// Schemas de Reviews
const submitReviewSchema = z.object({
  bookingId: z.string().uuid(),
  ratings: z.object({
    cleanliness: z.number().int().min(1).max(5),
    comfort: z.number().int().min(1).max(5),
    location: z.number().int().min(1).max(5),
    facilities: z.number().int().min(1).max(5),
    staff: z.number().int().min(1).max(5),
    value: z.number().int().min(1).max(5),
  }),
  title: z.string().min(5).max(200),
  comment: z.string().min(20).max(2000),
  pros: z.string().optional(),
  cons: z.string().optional(),
});

const voteHelpfulSchema = z.object({
  isHelpful: z.boolean(),
});

const respondReviewSchema = z.object({
  responseText: z.string().min(10).max(1000),
});

// ✅ NOVO: Schema para sincronização de localização
const syncLocationSchema = z.object({
  maxDistanceKm: z.number().min(0.1).max(100).optional().default(5),
});

// ✅ CORREÇÃO CRÍTICA: Schema para bulk update de disponibilidade com transformação automática
// Primeiro definimos o tipo das atualizações após transformação
const updateItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  price: z.number().positive().optional().nullable(),
  stopSell: z.boolean().optional().nullable(),
  availableUnits: z.number().int().min(0).optional().nullable(),
  minNights: z.number().int().positive().optional(),
  reset: z.boolean().optional().default(false),
});

// Schema base que aceita ambos os formatos
const bulkAvailabilityUpdateBaseSchema = z.object({
  roomTypeId: z.string().uuid(),
  updates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
    
    // ✅ ACEITAR CAMPOS DO FRONTEND (snake_case)
    price_override: z.number().positive().optional().nullable(),
    stop_sell: z.boolean().optional().nullable(),
    available_units: z.number().int().min(0).optional().nullable(),
    min_nights: z.number().int().positive().optional(),
    reset: z.boolean().optional().default(false),
    
    // ✅ MANTER CAMPOS ORIGINAIS (camelCase) para compatibilidade
    price: z.number().positive().optional().nullable(),
    stopSell: z.boolean().optional().nullable(),
    availableUnits: z.number().int().min(0).optional().nullable(),
    minNights: z.number().int().positive().optional(),
  })).min(1, "Pelo menos uma atualização é necessária"),
});

// Schema final com transformação
const bulkAvailabilityUpdateSchema = bulkAvailabilityUpdateBaseSchema.transform((data) => ({
  roomTypeId: data.roomTypeId,
  updates: data.updates.map(update => ({
    date: update.date,
    reset: update.reset || false,
    // ✅ MAPEAR snake_case → camelCase (prioridade: campos do frontend primeiro)
    price: update.price_override ?? update.price,
    stopSell: update.stop_sell ?? update.stopSell,
    availableUnits: update.available_units ?? update.availableUnits,
    minNights: update.min_nights ?? update.minNights,
  }))
}));

// Tipo inferido do schema
type BulkAvailabilityUpdate = z.infer<typeof bulkAvailabilityUpdateSchema>;

// ==================== TIPOS ADICIONAIS ====================
interface PaymentServiceData {
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentType?: PaymentType;
  proofImageUrl?: string;
  confirmedBy?: string;
  isFinalPayment?: boolean;
  extraNotes?: string;
}

// ==================== FUNÇÕES HELPER ====================
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const toNumber = (str: string | number | null | undefined): number => {
  if (str === null || str === undefined) return 0;
  if (typeof str === 'number') return str;
  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

const parseDateSafe = (dateString: string | Date | null): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

// Helper para validar preços
const validatePrice = (price: any): { isValid: boolean; error?: string; value?: string } => {
  if (price === undefined || price === null) {
    return { isValid: true, value: undefined };
  }
  
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Preço deve ser um número válido' };
  }
  
  if (num < 0) {
    return { isValid: false, error: 'Preço não pode ser negativo' };
  }
  
  return { isValid: true, value: num.toString() };
};

// ✅ ADICIONADA: Função para normalizar campos de snake_case para camelCase (manter para compatibilidade)
const normalizeUpdateFields = (update: any) => {
  const normalized: any = {
    date: update.date,
    reset: update.reset || false,
  };
 
  // ✅ Mapear snake_case → camelCase
  normalized.price = update.price_override ?? update.price;
  normalized.stopSell = update.stop_sell ?? update.stopSell;
  normalized.availableUnits = update.available_units ?? update.availableUnits;
  normalized.minNights = update.min_nights ?? update.minNights;
 
  return normalized;
};

// ==================== MIDDLEWARE ====================
const requireHotelOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.id || req.params.hotelId;
    const userId = (req as any).user?.id || (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    }

    if (process.env.NODE_ENV === 'test' && userId === 'bB88VrzVx8dbUUpXV7qSrGA5eiy2') {
      return next();
    }

    const isOwner = await isHotelOwner(hotelId, userId);
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado: não é dono deste hotel' });
    }

    next();
  } catch (error) {
    console.error('❌ [OWNER CHECK] Erro:', error);
    return res.status(500).json({ success: false, message: 'Erro ao verificar propriedade' });
  }
};

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token Bearer não fornecido' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token || token.trim() === '') {
      return res.status(401).json({ success: false, message: 'Token vazio' });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({ success: false, message: 'Token inválido: não é um JWT' });
    }

    try {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      
      const firebaseUid = payload.sub || payload.user_id || payload.uid;
      
      if (!firebaseUid) {
        return res.status(401).json({ success: false, message: 'Token sem identificador de usuário' });
      }

      (req as any).user = {
        id: firebaseUid,
        uid: firebaseUid,
        email: payload.email || '',
        name: payload.name || '',
        userType: payload.userType || 'host',
        roles: payload.roles || ['host'],
      };

      next();
    } catch (parseError) {
      return res.status(401).json({ success: false, message: 'Token malformado' });
    }
  } catch (error) {
    console.error('❌ [AUTH] Erro:', error);
    return res.status(401).json({ success: false, message: 'Autenticação falhou' });
  }
};

// ==================== ROUTER PRINCIPAL ====================
const router = Router();

// ======================= HOTÉIS =======================
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      query: req.query.query as string | undefined,
      locality: req.query.locality as string | undefined,
      province: req.query.province as string | undefined,
      checkIn: req.query.checkIn as string | undefined,
      checkOut: req.query.checkOut as string | undefined,
      guests: Number(req.query.guests) || undefined,
      isActive: req.query.isActive !== 'false',
    };

    const result = await searchHotels(filters);
    res.json({ success: true, data: result, count: result.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar hotéis' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hotel = await getHotelWithRoomTypes(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar hotel' });
  }
});

// ✅ CORRIGIDO: Rota de criação de hotel com host_id do usuário autenticado E país fixo Moçambique
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });

    const rawData = req.body;

    if (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Nome obrigatório (mínimo 3 caracteres)' });
    }

    // ✅ CORREÇÃO: Forçar país como "Moçambique" sempre
    const validated = createHotelSchema.parse({
      ...rawData,
      host_id: userId,  // Força host_id do usuário logado
      country: 'Moçambique', // ✅ FORÇAR sempre Moçambique
      slug: rawData.slug || generateSlug(rawData.name.trim()),
      lat: rawData.lat?.toString(),
      lng: rawData.lng?.toString(),
      location_id: rawData.location_id || undefined,
    });

    const newHotel = await createHotel(validated);

    res.status(201).json({
      success: true,
      message: 'Hotel criado com sucesso',
      data: newHotel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao criar hotel:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar hotel' });
  }
});

// ✅ CORRIGIDO: Rota de atualização de hotel com país fixo Moçambique
router.put('/:id', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log("🔵 [HOTEL UPDATE] Payload recebido:", JSON.stringify(req.body, null, 2));
    
    const rawData = req.body;
    
    // ✅ CORREÇÃO: Forçar país como "Moçambique" sempre
    const normalizedData = {
      ...rawData,
      country: 'Moçambique', // ✅ FORÇAR sempre Moçambique
    };
    
    // Validação de campos obrigatórios
    if (normalizedData.name !== undefined && (!normalizedData.name || typeof normalizedData.name !== 'string' || normalizedData.name.trim().length < 3)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome obrigatório (mínimo 3 caracteres)' 
      });
    }

    const data = {
      ...normalizedData,
      lat: normalizedData.lat?.toString(),
      lng: normalizedData.lng?.toString(),
      location_id: normalizedData.location_id || undefined,
      slug: normalizedData.slug || (normalizedData.name ? generateSlug(normalizedData.name) : undefined),
    };

    const validatedData = updateHotelSchema.parse(data);
    console.log("✅ Dados validados para update:", JSON.stringify(validatedData, null, 2));

    const updated = await updateHotel(req.params.id, validatedData);

    if (!updated) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });

    res.json({
      success: true,
      message: 'Hotel atualizado com sucesso',
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erro de validação:", error.errors);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('Erro ao atualizar hotel:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar hotel' });
  }
});

// ✅ NOVA ROTA: Sincronização de localização
router.post('/:id/sync-location', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const { maxDistanceKm = 5 } = req.body;
    
    const validated = syncLocationSchema.parse({ maxDistanceKm });
    
    // Buscar hotel
    const hotel = await getHotelById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    }
    
    if (!hotel.lat || !hotel.lng) {
      return res.status(400).json({ 
        success: false, 
        message: 'Hotel não tem coordenadas para sincronizar' 
      });
    }
    
    // Sincronizar localização
    const result = await syncHotelLocation(hotelId);
    
    if (!result.success) {
      return res.json({
        success: true,
        message: 'Nenhuma localização próxima encontrada',
        data: null,
      });
    }
    
    // Buscar informações da localização
    const location = await db.execute(sql`
      SELECT 
        id,
        name,
        province,
        district,
        type,
        lat,
        lng
      FROM mozambique_locations
      WHERE id = ${result.locationId}
    `);
    
    const locationData = (location as any).rows?.[0] || null;
    
    // Buscar hotel atualizado
    const updatedHotel = await getHotelById(hotelId);
    
    res.json({
      success: true,
      message: 'Localização sincronizada com sucesso',
      data: {
        hotel: updatedHotel,
        location: locationData,
      }
    });
  } catch (error) {
    console.error('Erro ao sincronizar localização:', error);
    res.status(500).json({ success: false, message: 'Erro ao sincronizar localização' });
  }
});

// ======================= ROTA /host/me (NOVA) =======================
// ✅ ADICIONADA: Rota para listar hotéis do usuário autenticado atual
router.get('/host/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    const hotels = await getHotelsByHost(userId);
    
    res.json({ 
      success: true, 
      data: hotels, 
      count: hotels.length 
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis do host:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar seus hotéis' 
    });
  }
});

// ======================= ROTA /host/:hostId (MANTIDA) =======================
router.get('/host/:hostId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const requestedHostId = req.params.hostId;

    // Verificar se é admin ou se está acessando seus próprios hotéis
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    
    if (userId !== requestedHostId && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: só pode ver seus próprios hotéis ou precisa ser admin' 
      });
    }

    const hotels = await getHotelsByHost(requestedHostId);
    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis do host:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar hotéis' });
  }
});

// ======================= PROMOÇÕES =======================
router.get('/:id/promotions', async (req: Request, res: Response) => {
  try {
    const promotions = await getPromotionsByHotel(req.params.id);
    res.json({ success: true, data: promotions });
  } catch (error) {
    console.error('Erro ao listar promoções:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar promoções' });
  }
});

router.post('/:id/promotions', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const validated = createPromotionSchema.parse(req.body);

    const promotionData = {
      hotel_id: hotelId,
      promo_code: validated.promo_code,
      name: validated.name,
      description: validated.description || null,
      discount_percent: validated.discount_percent || null,
      discount_amount: validated.discount_amount || null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      max_uses: validated.max_uses || null,
      current_uses: 0,
      is_active: validated.is_active ?? true,
    };

    const newPromotion = await createPromotion(promotionData);

    res.status(201).json({
      success: true,
      message: 'Promoção criada com sucesso',
      data: newPromotion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao criar promoção:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar promoção' });
  }
});

router.put('/:id/promotions/:promotionId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const validated = updatePromotionSchema.parse(req.body);
    const updated = await serviceUpdatePromotion(req.params.promotionId, validated);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Promoção não encontrada' });
    }

    res.json({
      success: true,
      message: 'Promoção atualizada',
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: 'Erro ao atualizar promoção' });
  }
});

router.delete('/:id/promotions/:promotionId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const updated = await serviceUpdatePromotion(req.params.promotionId, { is_active: false });
    if (!updated) return res.status(404).json({ success: false, message: 'Promoção não encontrada' });

    res.json({ success: true, message: 'Promoção desativada', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao desativar promoção' });
  }
});

// ======================= REVIEWS DE HOTÉIS =======================
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const minRating = parseInt(req.query.minRating as string) || 0;
    const sortBy = (req.query.sortBy as "recent" | "highest_rating" | "most_helpful") || "recent";

    const reviews = await hotelReviewsService.getReviews(
      hotelId,
      limit,
      offset,
      minRating,
      sortBy
    );

    res.json({
      success: true,
      data: reviews,
      count: reviews.length,
      pagination: {
        limit,
        offset,
        hasMore: reviews.length === limit,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar reviews do hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reviews do hotel',
    });
  }
});

router.get('/:id/reviews/stats', async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const stats = await hotelReviewsService.getStats(hotelId);

    res.json({
      success: true,
      data: stats || {
        total_reviews: 0,
        average_rating: 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas de reviews',
    });
  }
});

router.post('/reviews/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    const validated = submitReviewSchema.parse(req.body);

    const booking = await getBookingById(validated.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada',
      });
    }

    if (booking.guestEmail !== userEmail && booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Só pode avaliar a sua própria reserva',
      });
    }

    if (booking.status !== 'checked_out') {
      return res.status(400).json({
        success: false,
        message: 'Só pode avaliar após o check-out',
      });
    }

    const result = await hotelReviewsService.submitReview(
      validated.bookingId,
      validated.ratings,
      validated.title,
      validated.comment,
      validated.pros,
      validated.cons,
      userId
    );

    res.status(201).json({
      success: true,
      message: 'Review submetido com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('Erro ao submeter review:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao submeter review',
    });
  }
});

router.post('/reviews/:reviewId/vote-helpful', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { isHelpful } = voteHelpfulSchema.parse(req.body);

    const result = await hotelReviewsService.voteHelpful(
      req.params.reviewId,
      userId,
      isHelpful
    );

    res.json({
      success: true,
      message: 'Voto registrado com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('Erro ao votar review:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao votar review',
    });
  }
});

router.post('/:hotelId/reviews/:reviewId/respond', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { responseText } = respondReviewSchema.parse(req.body);

    const result = await hotelReviewsService.respondToReview(
      req.params.reviewId,
      req.params.hotelId,
      responseText,
      userId
    );

    res.json({
      success: true,
      message: 'Resposta enviada com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('Erro ao responder review:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao responder review',
    });
  }
});

// ======================= BUSCA POR RAIO (NOVA ROTA) - VERSÃO SIMPLIFICADA =======================
router.get('/search/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 60, useExactLocations = false } = req.query;

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    const radiusMeters = Number(radius) * 1000;

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ success: false, message: "lat e lng obrigatórios" });
    }

    let query;
    
    if (useExactLocations === 'true') {
      // ✅ NOVO: Busca usando localizações exatas (mozambique_locations)
      query = sql`
        SELECT 
          h.*,
          ml.name as exact_location_name,
          ml.type as location_type,
          ml.province as exact_province,
          ml.district as exact_district,
          ml.locality as exact_locality,
          -- Distância da localização exata
          ST_Distance(
            ST_SetSRID(ST_MakePoint(ml.lng, ml.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography
          ) / 1000 as distance_from_exact_location_km,
          -- Distância do hotel (fallback)
          (6371 * acos(
            cos(radians(${latNum})) * 
            cos(radians(CAST(h.lat AS numeric))) * 
            cos(radians(CAST(h.lng AS numeric)) - radians(${lngNum})) + 
            sin(radians(${latNum})) * 
            sin(radians(CAST(h.lat AS numeric)))
          )) AS distance_from_hotel_km
        FROM hotels h
        LEFT JOIN mozambique_locations ml ON h.location_id = ml.id
        WHERE h.is_active = true
        AND (
          -- Se tem location_id, usa distância da localização exata
          (h.location_id IS NOT NULL AND 
           ST_Distance(
             ST_SetSRID(ST_MakePoint(ml.lng, ml.lat), 4326)::geography,
             ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography
           ) <= ${radiusMeters})
          OR
          -- Se não tem location_id, usa distância do hotel (fallback)
          (h.location_id IS NULL AND h.lat IS NOT NULL AND h.lng IS NOT NULL AND
           (6371 * acos(
             cos(radians(${latNum})) * 
             cos(radians(CAST(h.lat AS numeric))) * 
             cos(radians(CAST(h.lng AS numeric)) - radians(${lngNum})) + 
             sin(radians(${latNum})) * 
             sin(radians(CAST(h.lat AS numeric)))
           )) <= ${Number(radius)})
        )
        ORDER BY 
          CASE 
            WHEN h.location_id IS NOT NULL THEN 1  -- Prioridade para hotéis com localização exata
            ELSE 2
          END,
          COALESCE(distance_from_exact_location_km, distance_from_hotel_km) ASC
        LIMIT 50
      `;
    } else {
      // Busca tradicional (mantida para compatibilidade)
      query = sql`
        SELECT 
          h.*,
          (6371 * acos(
            cos(radians(${latNum})) * 
            cos(radians(CAST(h.lat AS numeric))) * 
            cos(radians(CAST(h.lng AS numeric)) - radians(${lngNum})) + 
            sin(radians(${latNum})) * 
            sin(radians(CAST(h.lat AS numeric)))
          )) AS distance_km
        FROM hotels h
        WHERE h.is_active = true
        AND h.lat IS NOT NULL
        AND h.lng IS NOT NULL
        AND (6371 * acos(
          cos(radians(${latNum})) * 
          cos(radians(CAST(h.lat AS numeric))) * 
          cos(radians(CAST(h.lng AS numeric)) - radians(${lngNum})) + 
          sin(radians(${latNum})) * 
          sin(radians(CAST(h.lat AS numeric)))
        )) <= ${Number(radius)}
        ORDER BY distance_km ASC
        LIMIT 20
      `;
    }

    const hotels = await db.execute(query);
    const hotelsArray = Array.isArray(hotels) ? hotels : 
                       (hotels as any).rows ? (hotels as any).rows : 
                       hotels as any[];

    res.json({
      success: true,
      data: hotelsArray,
      center: { lat: latNum, lng: lngNum },
      radius_km: Number(radius),
      useExactLocations: useExactLocations === 'true',
      count: hotelsArray.length,
      stats: {
        withExactLocation: hotelsArray.filter((h: any) => h.location_id).length,
        withCoordinatesOnly: hotelsArray.filter((h: any) => h.lat && h.lng && !h.location_id).length,
      }
    });
  } catch (error) {
    console.error("Erro na busca por proximidade:", error);
    res.status(500).json({ success: false, message: "Erro interno" });
  }
});

// ======================= DASHBOARD DO HOTEL =======================
router.get('/:id/dashboard', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    
    const hotelStats = await getHostDashboardSummary(hotelId);
    const upcomingCheckIns = await getUpcomingCheckIns(hotelId, 5);
    
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // ✅ CORREÇÃO: Usa apenas as propriedades disponíveis do retorno de checkAvailabilityForDates
    const roomTypes = await getRoomTypesByHotel(hotelId);
    const availabilitySummary = await Promise.all(
      roomTypes.map(async (roomType) => {
        try {
          const availability = await checkAvailabilityForDates(
            roomType.id,
            today,
            nextWeek
          );
          
          // Retorna apenas o que está disponível no objeto
          return {
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            totalUnits: roomType.total_units,
            available: availability.available,
            minUnits: availability.minUnits,
            message: availability.message,
            // Para obter mais detalhes, usaríamos getAvailabilityCalendar
            // mas isso retorna um array completo de datas
          };
        } catch (error) {
          console.error(`Erro ao verificar disponibilidade para roomType ${roomType.id}:`, error);
          return {
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            totalUnits: roomType.total_units,
            available: false,
            minUnits: 0,
            message: 'Erro ao verificar disponibilidade',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          };
        }
      })
    );
    
    const activePromotions = await getActivePromotions(hotelId);
    const longStaySettings = await getLongStaySettings(hotelId);
    const paymentOptions = await getPaymentOptionsForHotel(hotelId);

    const recentPayments = await getRecentPaymentsByHotel(hotelId, 10);

    res.json({
      success: true,
      data: {
        hotel: hotelStats,
        upcomingCheckIns,
        availabilitySummary,
        activePromotions,
        longStaySettings,
        paymentOptions,
        recentPayments,
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar dashboard' });
  }
});

// ======================= TIPOS DE QUARTO =======================
router.get('/:id/room-types', async (req: Request, res: Response) => {
  try {
    const roomTypesList = await getRoomTypesByHotel(req.params.id);
    res.json({ success: true, data: roomTypesList });
  } catch (error) {
    console.error('Erro ao buscar tipos de quarto:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar tipos de quarto' });
  }
});

router.post('/:id/room-types', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    console.log("🔵 [ROOM TYPE CREATE] Payload recebido:", JSON.stringify(rawData, null, 2));
    
    // Validação básica
    if (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome obrigatório (mínimo 3 caracteres)' 
      });
    }

    const data = {
      ...rawData,
      hotel_id: req.params.id,
      capacity: rawData.capacity || 2,
      base_price: toNumber(rawData.base_price).toString(),
      extra_adult_price: rawData.extra_adult_price ? toNumber(rawData.extra_adult_price).toString() : undefined,
      extra_child_price: rawData.extra_child_price ? toNumber(rawData.extra_child_price).toString() : undefined,
      // ✅ CORREÇÃO: Usar min_nights_default sempre
      min_nights_default: rawData.min_nights_default ? toNumber(rawData.min_nights_default) : 
                         (rawData.min_nights ? toNumber(rawData.min_nights) : 1),
    };

    // ✅ REMOVER min_nights se existir para evitar conflitos
    if (data.min_nights !== undefined) {
      delete data.min_nights;
    }

    const validatedData = createRoomTypeSchema.parse(data);
    
    const { id: _, ...roomTypeData } = validatedData as any;
    
    console.log("✅ Dados validados para criação:", JSON.stringify(roomTypeData, null, 2));
    
    const newRoomType = await createRoomType(roomTypeData);

    res.status(201).json({
      success: true,
      message: 'Tipo de quarto criado',
      data: newRoomType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erro de validação:", error.errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos',
        errors: error.errors 
      });
    }
    console.error('Erro ao criar tipo de quarto:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar tipo de quarto' });
  }
});

// ✅ CORREÇÃO APLICADA: Rota PUT de room-types com conversão de min_nights para min_nights_default
router.put('/:hotelId/room-types/:roomTypeId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log("🔵 [ROOM TYPE UPDATE] Payload recebido:", JSON.stringify(req.body, null, 2));
    console.log("📝 Hotel ID:", req.params.hotelId);
    console.log("📝 Room Type ID:", req.params.roomTypeId);
    
    const rawData = req.body;
    const updateData: any = { ...rawData };
    
    // Log detalhado do que está sendo recebido
    console.log("🔍 Campos recebidos no controller:", Object.keys(rawData));
    
    // Validação básica
    if (rawData.name !== undefined && (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length < 3)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome obrigatório (mínimo 3 caracteres)' 
      });
    }
    
    // Conversão de preços - garantir que sejam strings para o banco
    if (rawData.base_price !== undefined) {
      const price = toNumber(rawData.base_price);
      if (price <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Preço base deve ser maior que 0' 
        });
      }
      updateData.base_price = price.toString();
    }
    
    if (rawData.extra_adult_price !== undefined) {
      updateData.extra_adult_price = toNumber(rawData.extra_adult_price).toString();
    }
    
    if (rawData.extra_child_price !== undefined) {
      updateData.extra_child_price = toNumber(rawData.extra_child_price).toString();
    }

    // ✅ CORREÇÃO CRÍTICA: Converter min_nights para min_nights_default
    // O frontend envia "min_nights" mas o campo no banco é "min_nights_default"
    if (rawData.min_nights !== undefined) {
      console.log("🔄 [CONTROLLER] Convertendo min_nights para min_nights_default:", rawData.min_nights);
      // Converter min_nights para min_nights_default
      updateData.min_nights_default = parseInt(rawData.min_nights);
      if (isNaN(updateData.min_nights_default) || updateData.min_nights_default < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'min_nights deve ser um número maior que 0' 
        });
      }
      // Remover o campo min_nights para evitar conflitos
      delete updateData.min_nights;
      console.log("✅ min_nights_default definido como:", updateData.min_nights_default);
    }
    
    // Se o frontend enviar min_nights_default diretamente, também processar
    if (rawData.min_nights_default !== undefined) {
      console.log("🔄 [CONTROLLER] Usando min_nights_default diretamente:", rawData.min_nights_default);
      updateData.min_nights_default = parseInt(rawData.min_nights_default);
      if (isNaN(updateData.min_nights_default) || updateData.min_nights_default < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'min_nights_default deve ser um número maior que 0' 
        });
      }
    }

    // Remover campo id se presente
    delete updateData.id;

    console.log("🔄 Dados processados para envio ao service:", JSON.stringify(updateData, null, 2));
    
    const updated = await updateRoomType(req.params.roomTypeId, updateData);
    
    if (!updated) {
      console.error("❌ Room type não encontrado ou erro na atualização");
      return res.status(404).json({ success: false, message: 'Tipo de quarto não encontrado' });
    }

    console.log("✅ Room type atualizado com sucesso");
    res.json({ 
      success: true, 
      message: 'Tipo de quarto atualizado', 
      data: updated 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar tipo de quarto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar tipo de quarto',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

router.delete('/:hotelId/room-types/:roomTypeId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const deactivated = await deactivateRoomType(req.params.roomTypeId);
    if (!deactivated) {
      return res.status(404).json({ success: false, message: 'Tipo de quarto não encontrado' });
    }

    res.json({
      success: true,
      message: 'Tipo de quarto desativado',
      data: deactivated,
    });
  } catch (error) {
    console.error('Erro ao desativar tipo de quarto:', error);
    res.status(500).json({ success: false, message: 'Erro ao desativar tipo de quarto' });
  }
});

// ======================= DISPONIBILIDADE =======================
// ✅ ATUALIZADO: Rota para verificar disponibilidade (usando o checkAvailabilityForDates)
router.get('/:id/availability/check', async (req: Request, res: Response) => {
  try {
    const { roomTypeId, checkIn, checkOut, units = 1 } = req.query;

    if (!roomTypeId || !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'roomTypeId, checkIn e checkOut são obrigatórios' 
      });
    }

    // Validação de datas
    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);
    
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data de check-out deve ser posterior à data de check-in' 
      });
    }

    const availability = await checkAvailabilityForDates(
      roomTypeId as string,
      checkIn as string,
      checkOut as string,
      Number(units)
    );

    res.json({ 
      success: true, 
      data: availability,
      available: availability.available 
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar disponibilidade' });
  }
});

router.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, roomTypeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Datas obrigatórias' });
    }

    if (!roomTypeId) {
      return res.status(400).json({ success: false, message: 'roomTypeId obrigatório' });
    }

    const calendar = await getAvailabilityCalendar(
      roomTypeId as string,
      startDate as string,
      endDate as string
    );

    res.json({ success: true, data: calendar });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar disponibilidade' });
  }
});

// ✅ CORREÇÃO COMPLETA: Rota bulk update com transformação automática no schema
router.post('/:id/availability/bulk', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log('📤 Received bulk payload:', JSON.stringify(req.body, null, 2));
    
    // ✅ O schema já faz a transformação automática de snake_case para camelCase
    const validated: BulkAvailabilityUpdate = bulkAvailabilityUpdateSchema.parse(req.body);
    const { updates, roomTypeId } = validated;
    
    // Verificar se o roomType pertence ao hotel
    const roomType = await getRoomTypeById(roomTypeId);
    if (!roomType || roomType.hotel_id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Room type não pertence a este hotel'
      });
    }

    // ✅ VALIDAÇÃO: Total de unidades do room type
    const maxUnits = roomType.total_units || 0;
    console.log("🏨 Validando contra total de unidades:", maxUnits);

    // ✅ Processar os updates já normalizados pelo schema
    const processedUpdates = updates.map(update => {
      const processed: any = {
        date: update.date,
        reset: update.reset || false,
      };

      // ✅ VALIDAÇÃO DE PREÇO (com suporte a reset)
      if (update.price !== undefined) {
        if (update.reset) {
          processed.price = null; // Reset explícito
        } else if (update.price !== null) {
          const price = parseFloat(update.price.toString());
          if (isNaN(price) || price <= 0) {
            throw new Error(`Preço inválido para ${update.date}: ${update.price}`);
          }
          processed.price = price;
        }
      }

      // ✅ VALIDAÇÃO DE UNIDADES (com suporte a reset)
      if (update.availableUnits !== undefined) {
        if (update.reset) {
          processed.availableUnits = null; // Reset explícito
        } else if (update.availableUnits !== null) {
          const units = Math.max(0, update.availableUnits);
          
          if (units > maxUnits) {
            throw new Error(
              `Unidades disponíveis (${units}) excedem o total do room type (${maxUnits}) para ${update.date}`
            );
          }
          
          processed.availableUnits = units;
        }
      }

      // ✅ VALIDAÇÃO DE STOP_SELL (com suporte a reset)
      if (update.stopSell !== undefined) {
        processed.stopSell = update.reset ? false : Boolean(update.stopSell);
      }

      // ✅ MIN_NIGHTS (com suporte a reset)
      if (update.minNights !== undefined) {
        if (update.reset) {
          processed.minNights = 1; // Reset para padrão
        } else if (update.minNights < 1) {
          throw new Error(`Mínimo de noites deve ser >= 1 para ${update.date}`);
        }
        processed.minNights = update.minNights;
      }

      return processed;
    });

    console.log("🔄 [BULK UPDATE] Processando atualizações:", {
      roomTypeId,
      hotelId: req.params.id,
      maxUnits,
      updatesCount: processedUpdates.length,
      sampleUpdate: processedUpdates[0],
      resetFlags: processedUpdates.filter(u => u.reset).length
    });

    const updatedCount = await bulkUpdateAvailability(roomTypeId, processedUpdates);

    res.json({
      success: true,
      message: 'Disponibilidade atualizada com sucesso',
      updatedCount,
      processedUpdates: processedUpdates.length,
      maxUnitsValidated: maxUnits,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erro de validação no bulk update:", error.errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos',
        errors: error.errors 
      });
    }
    
    // ✅ Erros de validação customizados
    if (error.message?.includes('excede') || error.message?.includes('inválido')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar disponibilidade',
      error: error.message 
    });
  }
});

// ======================= RESERVAS =======================
// ✅ CORRIGIDO: Rota de criação de booking com hotelId da rota
router.post('/:id/bookings', requireAuth, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const userId = (req as any).user?.id;

    const hotel = await getHotelById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });

    const validated = createBookingSchema.parse(req.body);

    const bookingData: CreateBookingData = {
      hotelId,
      roomTypeId: validated.roomTypeId,
      guestName: validated.guestName,
      guestEmail: validated.guestEmail,
      guestPhone: validated.guestPhone || undefined,
      checkIn: validated.checkIn,
      checkOut: validated.checkOut,
      adults: validated.adults,
      children: validated.children,
      units: validated.units,
      specialRequests: validated.specialRequests || undefined,
      promoCode: validated.promoCode || undefined,
      userId: validated.userId || userId,
      status: validated.status,
      paymentStatus: validated.paymentStatus,
    };

    const result = await createHotelBooking(bookingData, userId);

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Dados inválidos', errors: error.errors });
    }
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar reserva' });
  }
});

router.get('/:id/bookings', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const statusArray = status ? status.split(',') : undefined;
    
    const bookings = await getBookingsByHotel(req.params.id, statusArray);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar reservas' });
  }
});

router.get('/:id/bookings/:bookingId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da reserva:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar detalhes da reserva' 
    });
  }
});

// ✅ CORRIGIDO: Check-in com validação de propriedade
router.post('/bookings/:bookingId/check-in', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'AUTH_REQUIRED',
      });
    }

    console.log(`🔵 [CONTROLLER] Check-in booking: ${bookingId}`);
    
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada',
        error: 'BOOKING_NOT_FOUND',
      });
    }

    // Verificar se o usuário é dono do hotel ou admin
    const isOwner = await isHotelOwner(booking.hotelId, user.id);
    const isAdmin = user.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para realizar check-in',
        error: 'PERMISSION_DENIED',
      });
    }

    const result = await checkInBooking(bookingId, user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada ou erro no check-in',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Check-in realizado com sucesso',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Erro no controller check-in:', error);
    return res.status(400).json({
      success: false,
      message: `Falha no check-in: ${error.message}`,
      error: error.message,
    });
  }
});

// ✅ CORRIGIDO: Check-out com validação de propriedade
router.post('/bookings/:bookingId/check-out', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const user = (req as any).user;
    
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'AUTH_REQUIRED',
      });
    }

    console.log(`🔵 [CONTROLLER] Check-out booking: ${bookingId}`);
    
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada',
        error: 'BOOKING_NOT_FOUND',
      });
    }

    // Verificar se o usuário é dono do hotel ou admin
    const isOwner = await isHotelOwner(booking.hotelId, user.id);
    const isAdmin = user.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para realizar check-out',
        error: 'PERMISSION_DENIED',
      });
    }

    const result = await checkOutBooking(bookingId, user.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Reserva não encontrada ou erro no check-out',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Check-out realizado com sucesso',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Erro no controller check-out:', error);
    return res.status(400).json({
      success: false,
      message: `Falha no check-out: ${error.message}`,
      error: error.message,
    });
  }
});

// ✅ ATUALIZADO: Cancelamento usando função corrigida do service
router.post('/bookings/:bookingId/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const userId = (req as any).user?.id;
    
    const booking = await getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    // Verificar permissão
    const isOwner = await isHotelOwner(booking.hotelId, userId);
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para cancelar esta reserva',
        error: 'PERMISSION_DENIED',
      });
    }

    const cancelled = await cancelBooking(req.params.bookingId, reason, userId);
    
    if (!cancelled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Reserva cancelada com sucesso', 
      data: cancelled 
    });
  } catch (error: any) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ NOVA ROTA: Rejeitar reserva
router.post('/bookings/:bookingId/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const userId = (req as any).user?.id;
    
    const booking = await getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    // Verificar permissão
    const isOwner = await isHotelOwner(booking.hotelId, userId);
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para rejeitar esta reserva',
        error: 'PERMISSION_DENIED',
      });
    }

    const rejected = await rejectBooking(req.params.bookingId, reason, userId);
    
    if (!rejected) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Reserva rejeitada com sucesso', 
      data: rejected 
    });
  } catch (error: any) {
    console.error('Erro ao rejeitar reserva:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======================= PAGAMENTOS =======================
router.get('/:id/bookings/:bookingId/invoice', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const invoiceDetails = await getBookingPaymentDetails(bookingId);
    
    res.json({
      success: true,
      data: invoiceDetails,
    });
  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar fatura: ' + (error as Error).message 
    });
  }
});

router.post('/:id/invoices/:invoiceId/refresh', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const result = await refreshInvoiceStatus(invoiceId);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro no controller de refresh invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar invoice'
    });
  }
});

router.get('/:id/invoices/:invoiceId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoiceDetails = await getInvoiceDetails(invoiceId);
    
    if (!invoiceDetails) {
      return res.status(404).json({
        success: false,
        message: 'Invoice não encontrado'
      });
    }
    
    res.json({
      success: true,
      data: invoiceDetails,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar invoice'
    });
  }
});

router.get('/:id/bookings/:bookingId/deposit', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const deposit = await calculateRequiredDeposit(bookingId);
    
    res.json({
      success: true,
      data: deposit,
    });
  } catch (error) {
    console.error('Erro ao calcular depósito:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao calcular depósito: ' + (error as Error).message 
    });
  }
});

router.post('/:id/bookings/:bookingId/payments', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id;
    
    const validated = manualPaymentSchema.parse(req.body);
    
    const paymentMethod: PaymentMethod = validated.paymentMethod as PaymentMethod;
    const paymentType: PaymentType = (validated.paymentType as PaymentType) || "partial";
    
    const paymentData: PaymentServiceData = {
      amount: validated.amount,
      paymentMethod: paymentMethod,
      referenceNumber: validated.reference,
      paymentType: paymentType,
      confirmedBy: userId,
    };
    
    if (validated.notes) {
      paymentData.extraNotes = validated.notes;
    }

    const payment = await registerManualPayment(bookingId, paymentData);

    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: payment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao registrar pagamento: ' + (error as Error).message 
    });
  }
});

router.get('/:id/bookings/:bookingId/payments', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const payments = await getHotelPaymentsByBooking(bookingId);
    
    res.json({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos do booking:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar pagamentos: ' + (error as Error).message 
    });
  }
});

router.get('/:id/payments/recent', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    
    const recentPayments = await getRecentPaymentsByHotel(hotelId, limit);
    
    res.json({
      success: true,
      data: recentPayments,
      count: recentPayments.length,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos recentes:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamentos' });
  }
});

router.get('/:id/payments/pending', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    
    const pendingPayments = await getPendingPayments(limit, offset);
    
    res.json({
      success: true,
      data: pendingPayments,
      count: pendingPayments.length,
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar pagamentos pendentes: ' + (error as Error).message 
    });
  }
});

router.post('/:id/bookings/:bookingId/process-payment', requireAuth, requireHotelOwner, async (req: Request, res:Response) => {
  try {
    const { bookingId } = req.params;
    const { paymentOptionId, selectedPromotionId } = req.body;
    
    if (!paymentOptionId) {
      return res.status(400).json({
        success: false,
        message: 'paymentOptionId é obrigatório'
      });
    }
    
    const result = await processHotelBookingWithPayment(
      bookingId,
      paymentOptionId,
      selectedPromotionId
    );
    
    res.json({
      success: true,
      message: 'Reserva processada com pagamento',
      data: result,
    });
  } catch (error) {
    console.error('Erro ao processar reserva com pagamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao processar reserva: ' + (error as Error).message 
    });
  }
});

router.post('/:id/bookings/:bookingId/cancel-non-payment', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { invoiceId, reason } = req.body;
    const userId = (req as any).user?.id;
    
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: 'invoiceId é obrigatório'
      });
    }
    
    const result = await cancelHotelBookingForNonPayment(
      invoiceId,
      userId
    );
    
    res.json({
      success: true,
      message: reason || 'Reserva cancelada por falta de pagamento',
      data: result,
    });
  } catch (error) {
    console.error('Erro ao cancelar reserva por falta de pagamento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao cancelar reserva: ' + (error as Error).message 
    });
  }
});

// ======================= PREÇO FINAL =======================
router.post('/:id/bookings/calculate-price', async (req: Request, res: Response) => {
  try {
    const {
      roomTypeId,
      checkIn,
      checkOut,
      units = 1,
      promoCode,
    } = req.body;

    const room_type_id = roomTypeId || req.body.room_type_id;
    const check_in = checkIn || req.body.check_in;
    const check_out = checkOut || req.body.check_out;
    const promo_code = promoCode || req.body.promo_code;

    if (!room_type_id || !check_in || !check_out) {
      return res.status(400).json({ 
        success: false, 
        message: 'roomTypeId, checkIn e checkOut são obrigatórios' 
      });
    }

    const pricing = await calculateFinalBookingPrice(
      req.params.id,
      room_type_id,
      check_in,
      check_out,
      units,
      promo_code
    );

    res.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Erro ao calcular preço:', error);
    res.status(400).json({ 
      success: false, 
      message: (error as Error).message 
    });
  }
});

// ======================= ROTAS ADICIONAIS =======================
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const hotel = await getHotelBySlug(req.params.slug);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    }

    const roomTypesList = await getRoomTypesByHotel(hotel.id);

    res.json({
      success: true,
      data: { ...hotel, roomTypes: roomTypesList },
    });
  } catch (error) {
    console.error('Erro ao buscar hotel por slug:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar hotel' });
  }
});

router.get('/province/:province', async (req: Request, res: Response) => {
  try {
    const hotels = await getHotelsByProvince(req.params.province);
    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis por província:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar hotéis' });
  }
});

router.get('/locality/:locality', async (req: Request, res: Response) => {
  try {
    const hotels = await getHotelsByLocality(req.params.locality);
    res.json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error) {
    console.error('Erro ao buscar hotéis por localidade:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar hotéis' });
  }
});

// ======================= RELATÓRIOS =======================
router.get('/:id/reports/bookings', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const bookings = await getBookingsByHotel(hotelId);
    
    const filteredBookings = bookings.filter((booking: any) => {
      const bookingDate = parseDateSafe(booking.createdAt);
      const start = parseDateSafe(startDate as string);
      const end = parseDateSafe(endDate as string);
      
      if (!bookingDate || !start || !end) return false;
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      return bookingDate >= start && bookingDate <= endOfDay;
    });
    
    if (format === 'csv') {
      const headers = [
        'ID', 'Hóspede', 'Email', 'Telefone', 'Check-in', 'Check-out', 
        'Noites', 'Unidades', 'Valor Total', 'Status', 'Status Pagamento',
        'Data Criação'
      ];
      
      const csvRows = filteredBookings.map((b: any) => {
        const checkInDate = parseDateSafe(b.checkIn);
        const checkOutDate = parseDateSafe(b.checkOut);
        const createdAtDate = parseDateSafe(b.createdAt);
        
        return [
          b.id,
          b.guestName,
          b.guestEmail,
          b.guestPhone || '',
          checkInDate ? checkInDate.toLocaleDateString('pt-MZ') : '',
          checkOutDate ? checkOutDate.toLocaleDateString('pt-MZ') : '',
          b.nights || 0,
          b.units || 1,
          toNumber(b.totalPrice).toFixed(2),
          b.status,
          b.paymentStatus,
          createdAtDate ? createdAtDate.toLocaleDateString('pt-MZ') : '',
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...csvRows.map((row: any) => row.join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reservas-${hotelId}-${Date.now()}.csv`);
      return res.send(csvContent);
    }
    
    res.json({
      success: true,
      data: filteredBookings,
      count: filteredBookings.length,
      period: { startDate, endDate },
      summary: {
        totalRevenue: filteredBookings.reduce((sum: number, b: any) => sum + toNumber(b.totalPrice), 0),
        confirmedBookings: filteredBookings.filter((b: any) => b.status === 'confirmed').length,
        cancelledBookings: filteredBookings.filter((b: any) => b.status === 'cancelled').length,
        paidBookings: filteredBookings.filter((b: any) => b.paymentStatus === 'paid').length,
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
  }
});

router.get('/:id/reports/payments', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const { startDate, endDate, format = 'json' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const recentPayments = await getRecentPaymentsByHotel(hotelId, 1000);
    
    const filteredPayments = recentPayments.filter((payment: any) => {
      const paymentDate = parseDateSafe(payment.payment.paidAt || payment.payment.createdAt);
      const start = parseDateSafe(startDate as string);
      const end = parseDateSafe(endDate as string);
      
      if (!paymentDate || !start || !end) return false;
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      return paymentDate >= start && paymentDate <= endOfDay;
    });
    
    if (format === 'csv') {
      const headers = [
        'ID Pagamento', 'ID Reserva', 'Hóspede', 'Check-in', 'Check-out',
        'Valor', 'Método Pagamento', 'Referência', 'Status', 'Data Pagamento'
      ];
      
      const csvRows = filteredPayments.map((p: any) => {
        const booking = p.booking || {};
        const payment = p.payment || {};
        const checkInDate = parseDateSafe(booking.checkIn);
        const checkOutDate = parseDateSafe(booking.checkOut);
        const paidAtDate = parseDateSafe(payment.paidAt || payment.createdAt);
        
        return [
          payment.id || '',
          booking.id || '',
          booking.guestName || '',
          checkInDate ? checkInDate.toLocaleDateString('pt-MZ') : '',
          checkOutDate ? checkOutDate.toLocaleDateString('pt-MZ') : '',
          payment.amount?.toFixed(2) || '0.00',
          payment.paymentMethod || '',
          payment.paymentReference || '',
          payment.status || '',
          paidAtDate ? paidAtDate.toLocaleDateString('pt-MZ') : '',
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...csvRows.map((row: any) => row.join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=pagamentos-${hotelId}-${Date.now()}.csv`);
      return res.send(csvContent);
    }
    
    const summary = {
      totalAmount: filteredPayments.reduce((sum: number, p: any) => sum + (p.payment?.amount || 0), 0),
      byPaymentMethod: filteredPayments.reduce((acc: Record<string, number>, p: any) => {
        const method = p.payment?.paymentMethod || 'unknown';
        acc[method] = (acc[method] || 0) + (p.payment?.amount || 0);
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      success: true,
      data: filteredPayments,
      count: filteredPayments.length,
      period: { startDate, endDate },
      summary
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de pagamentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar relatório de pagamentos' });
  }
});

export default router;