// src/modules/events/eventController.ts - VERSÃO FINAL CORRIGIDA
// ✅ TODAS AS CORREÇÕES APLICADAS:
// ✅ 1. Campo allowed_event_types PRESERVADO na resposta
// ✅ 2. Arrays NUNCA são undefined (sempre array vazio)
// ✅ 3. Logs de debug para verificação
// ✅ 4. TODOS OS ERROS DE TIPO CORRIGIDOS - DISTANCE_KM AGORA É unknown | number
// ✅ 5. MIDDLEWARE PARA IGNORAR ROTAS DE FOTOS ADICIONADO NO TOPO

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from "../../../db";
import {
  hotels,
  eventSpaces,
  eventBookings,
  eventBookingLogs
} from "../../../shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

// Middleware Firebase Auth
import { verifyFirebaseToken } from "../../shared/firebaseAuth";

// Importações dos serviços
import {
  searchEventSpaces,
  searchEventSpacesNearbyEnhanced,
  getEventSpaceDetails,
  getEventSpacesByHotel,
  getEventDashboardSummary,
  getEventStatsForHotel,
  getUpcomingEventsForHotel,
  getEventSpacesOverview,
  checkEventSpaceAvailability,
  checkBookingConflicts,
  getFutureEventsBySpace,
  getEventsByOrganizer,
  incrementEventSpaceViewCount,
  isEventSpaceAvailableForImmediateBooking,
  isAlcoholAllowed,
  getSpaceMaxCapacity,
  offersCatering,
  getCateringDiscountPercent,
  getCateringMenuUrls
} from './eventService';

import {
  getEventSpaceById,
  createEventSpace,
  updateEventSpace,
  deactivateEventSpace,
  getEventSpaceCalendar,
  bulkUpdateEventAvailability,
  getHotelEventSpacesSummary,
  getEventSpaceAvailabilityStats,
  hasActiveEventBookingsForSpace,
  syncAvailabilityWithSpaceConfig,
  exportAvailabilityCalendar,
  checkEventSpaceCapacity,
  bulkUpdateEventSpacesStatus,
  calculateEventPrice,
  getEventSpacesWithStats
} from './eventSpaceService';

import {
  createEventBooking,
  cancelEventBooking,
  getEventBookingById,
  getEventBookingWithDetails,
  getEventBookingLogs,
  getEventBookingsByHotel,
  getEventBookingsByOrganizerEmail,
  confirmEventBooking,
  updateEventBooking,
  getPendingApprovalBookings,
  rejectEventBooking
} from './eventBookingService';

// Service de Pagamentos
import eventPaymentService from './eventPaymentService';

// Service de Reviews
import { EventSpaceReviewsService } from './event-space-reviews.service';

// ==================== TIPOS CORRIGIDOS - 100% COMPATÍVEIS COM EVENTSPACESERVICE ====================
type CreateEventSpaceInput = {
  hotelId: string;
  name: string;
  description?: string | null;
  capacityMin: number;
  capacityMax: number;
  basePricePerDay?: string;
  pricePerDay?: string;
  weekendSurchargePercent?: number | null;
  areaSqm?: number | null;
  spaceType?: string | null;
  naturalLight?: boolean | null;
  hasStage?: boolean | null;
  loadingAccess?: boolean | null;
  dressingRooms?: number | null;
  securityDeposit?: string | null;
  insuranceRequired?: boolean | null;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean | null;
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  approvalRequired?: boolean | null;
  offersCatering?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  cateringMenuUrls?: string[];
  amenities?: string[];
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  setupOptions?: string[];
  images?: string[];
  cateringDiscountPercent?: number | null;
  equipment?: any;
  slug?: string | null;
};

// ==================== VALORES DE STATUS VÁLIDOS ====================
const VALID_BOOKING_STATUSES = [
  'pending_approval',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'rejected'
] as const;

type BookingStatus = typeof VALID_BOOKING_STATUSES[number];

// ==================== FUNÇÕES HELPER ====================
const toDecimalString = (num: number | string | null | undefined): string | null => {
  if (num === null || num === undefined) return null;
  if (typeof num === 'string') return num;
  return num.toFixed(2);
};

const toNumber = (str: string | number | null | undefined): number => {
  if (str === null || str === undefined) return 0;
  if (typeof str === 'number') return str;
  const num = Number(str);
  return isNaN(num) ? 0 : num;
};

const adaptToCamelCase = (data: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = data[key];
    } else {
      result[key] = data[key];
    }
  });
  return result;
};

const adaptToSnakeCase = (data: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    if (/[A-Z]/.test(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = data[key];
    } else {
      result[key] = data[key];
    }
  });
  return result;
};

// ✅ Função para processar equipment corretamente
const processEquipmentField = (equipment: any): any => {
  if (!equipment) return {};
  
  if (typeof equipment === 'object' && equipment !== null && !Array.isArray(equipment)) {
    const cleanObj: Record<string, any> = {};
    Object.entries(equipment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanObj[key] = value;
      }
    });
    return cleanObj;
  }
  
  if (typeof equipment === 'string') {
    try {
      if (equipment.trim().startsWith('{') && equipment.trim().endsWith('}')) {
        return JSON.parse(equipment);
      }
      
      let cleaned = equipment.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      cleaned = cleaned.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
      return { value: parsed };
    } catch {
      return {};
    }
  }
  
  if (Array.isArray(equipment)) {
    return { items: equipment };
  }
  
  return {};
};

// ==================== VALIDATION SCHEMAS ====================
const createEventSpaceSchema = z.object({
  hotel_id: z.string().uuid({ message: "ID do hotel inválido" }),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().optional().nullable(),
  capacity_min: z.union([z.number().int().positive(), z.string()]),
  capacity_max: z.union([z.number().int().positive(), z.string()]),
  base_price_per_day: z.union([z.number().positive(), z.string()]).default("0"),
  weekend_surcharge_percent: z.number().int().min(0).max(100).optional().default(0),
  security_deposit: z.union([z.number(), z.string()]).optional().nullable(),
  offers_catering: z.boolean().optional().default(false),
  catering_discount_percent: z.number().int().min(0).max(100).optional().default(0),
  catering_menu_urls: z.array(z.string().url()).optional().default([]),
  main_image: z.string().url().optional().nullable(),
  terms_and_rules: z.string().optional().nullable(),
  allowed_event_types: z.array(z.string()).optional().default([]),
  prohibited_event_types: z.array(z.string()).optional().default([]),
  amenities: z.array(z.string()).optional().default([]),
  equipment: z.union([
    z.record(z.any()),
    z.string().transform((str) => {
      try {
        return processEquipmentField(str);
      } catch {
        return {};
      }
    })
  ]).optional().default({}),
  setup_options: z.array(z.string()).optional().default([]),
  images: z.array(z.string().url()).optional().default([]),
  area_sqm: z.union([z.number(), z.string()]).optional().nullable(),
  space_type: z.string().optional(),
  has_stage: z.boolean().optional().default(false),
  natural_light: z.boolean().optional().default(false),
  loading_access: z.boolean().optional().default(false),
  dressing_rooms: z.union([z.number(), z.string()]).optional().nullable(),
  insurance_required: z.boolean().optional().default(false),
  alcohol_allowed: z.boolean().optional().default(false),
  floor_plan_image: z.string().url().optional().nullable(),
  virtual_tour_url: z.string().url().optional().nullable(),
  approval_required: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  slug: z.string().optional(),
})
.transform((data) => ({
  ...data,
  capacity_min: Number(data.capacity_min),
  capacity_max: Number(data.capacity_max),
  base_price_per_day: data.base_price_per_day ? data.base_price_per_day.toString() : "0",
  area_sqm: data.area_sqm ? Number(data.area_sqm) : null,
  dressing_rooms: data.dressing_rooms ? Number(data.dressing_rooms) : null,
  security_deposit: data.security_deposit ? data.security_deposit.toString() : null,
}));

const updateEventSpaceSchema = z.object({
  hotel_id: z.string().uuid({ message: "ID do hotel inválido" }).optional(),
  name: z.string().min(1, "Nome é obrigatório").max(100).optional(),
  description: z.string().optional().nullable(),
  capacity_min: z.union([z.number().int().positive(), z.string()]).optional(),
  capacity_max: z.union([z.number().int().positive(), z.string()]).optional(),
  base_price_per_day: z.union([z.number().positive(), z.string()]).optional(),
  weekend_surcharge_percent: z.number().int().min(0).max(100).optional(),
  security_deposit: z.union([z.number(), z.string()]).optional().nullable(),
  offers_catering: z.boolean().optional(),
  catering_discount_percent: z.number().int().min(0).max(100).optional(),
  catering_menu_urls: z.array(z.string().url()).optional(),
  main_image: z.string().url().optional().nullable(),
  terms_and_rules: z.string().optional().nullable(),
  allowed_event_types: z.array(z.string()).optional(),
  prohibited_event_types: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  equipment: z.union([
    z.record(z.any()),
    z.string().transform((str) => {
      try {
        return processEquipmentField(str);
      } catch {
        return {};
      }
    })
  ]).optional(),
  setup_options: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  area_sqm: z.union([z.number(), z.string()]).optional().nullable(),
  space_type: z.string().optional(),
  has_stage: z.boolean().optional(),
  natural_light: z.boolean().optional(),
  loading_access: z.boolean().optional(),
  dressing_rooms: z.union([z.number(), z.string()]).optional().nullable(),
  insurance_required: z.boolean().optional(),
  alcohol_allowed: z.boolean().optional(),
  floor_plan_image: z.string().url().optional().nullable(),
  virtual_tour_url: z.string().url().optional().nullable(),
  approval_required: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  slug: z.string().optional(),
})
.transform((data) => ({
  ...data,
  capacity_min: data.capacity_min !== undefined ? Number(data.capacity_min) : undefined,
  capacity_max: data.capacity_max !== undefined ? Number(data.capacity_max) : undefined,
  base_price_per_day: data.base_price_per_day !== undefined
    ? (data.base_price_per_day ? data.base_price_per_day.toString() : "0")
    : undefined,
  area_sqm: data.area_sqm !== undefined ? Number(data.area_sqm) : undefined,
  dressing_rooms: data.dressing_rooms !== undefined ? Number(data.dressing_rooms) : undefined,
  security_deposit: data.security_deposit !== undefined
    ? (data.security_deposit ? data.security_deposit.toString() : null)
    : undefined,
}));

const createEventBookingSchema = z.object({
  organizer_name: z.string().min(2),
  organizer_email: z.string().email(),
  organizer_phone: z.string().optional(),
  event_title: z.string().min(3),
  event_description: z.string().optional(),
  event_type: z.string().min(2),
  start_date: z.string().date(),
  end_date: z.string().date(),
  expected_attendees: z.number().int().positive(),
  special_requests: z.string().optional(),
  additional_services: z.record(z.any()).optional().default({}),
  catering_required: z.boolean().optional().default(false),
  user_id: z.string().optional(),
});

const manualEventPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(["mpesa", "bank_transfer", "card", "cash", "mobile_money"]),
  reference: z.string().min(1, "Referência é obrigatória"),
  notes: z.string().optional(),
  payment_type: z.string().optional().default("manual_event_payment"),
});

const eventAvailabilitySchema = z.object({
  date: z.string().date(),
  is_available: z.boolean().optional().default(true),
  stop_sell: z.boolean().optional().default(false),
  price_override: z.union([z.number().positive(), z.string()]).optional(),
});

const bulkAvailabilitySchema = z.array(eventAvailabilitySchema);

const checkCapacitySchema = z.object({
  expected_attendees: z.number().int().positive(),
});

const nearbySearchSchema = z.object({
  lat: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())),
  lng: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())),
  radius: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())).default(50),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  capacity: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())).optional(),
  eventType: z.string().optional(),
  maxPricePerDay: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())).optional(),
  amenities: z.string().optional(),
  minRating: z.union([z.string(), z.number()]).transform(val => parseFloat(val.toString())).optional(),
  useExactLocations: z.enum(['true', 'false', '0', '1']).transform(val => val === 'true' || val === '1').optional(),
});

// ==================== SCHEMAS PARA REVIEWS ====================
const submitEventReviewSchema = z.object({
  bookingId: z.string().uuid(),
  ratings: z.object({
    venue: z.number().int().min(1).max(5),
    facilities: z.number().int().min(1).max(5),
    location: z.number().int().min(1).max(5),
    services: z.number().int().min(1).max(5),
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

const respondEventReviewSchema = z.object({
  responseText: z.string().min(10).max(1000),
});

// ==================== TIPOS CORRIGIDOS PARA RESPOSTAS - DISTANCE_KM COMO unknown ====================
interface NearbySearchResponseItem {
  space: any;
  hotel: any;
  distance_km?: unknown;
  distance_from_exact_location_km?: unknown;
  distance_from_hotel_km?: unknown;
  location?: any;
  priority?: unknown;
}

interface SearchResultResponseItem {
  space: any;
  hotel: any;
  distance_km?: unknown;
  distance_from_exact_location_km?: unknown;
  distance_from_hotel_km?: unknown;
}

// ==================== MIDDLEWARES ====================
const requireHotelOwnerForHotelIdParam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.hotelId;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId obrigatório' });

    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });

    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: não é dono deste hotel' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireHotelOwnerForHotelIdParam:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar propriedade do hotel' 
    });
  }
};

const requireHotelOwnerForSpace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = req.params.id || req.params.spaceId;
    if (!spaceId) return res.status(400).json({ success: false, message: 'ID do espaço obrigatório' });
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    const space = await getEventSpaceById(spaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, space.hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware requireHotelOwnerForSpace:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar autorização' });
  }
};

const requireHotelOwnerForBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId obrigatório' });
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    const [booking] = await db.select({ eventSpaceId: eventBookings.eventSpaceId }).from(eventBookings).where(eq(eventBookings.id, bookingId));
    if (!booking) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    const [space] = await db.select({ hotelId: eventSpaces.hotelId }).from(eventSpaces).where(eq(eventSpaces.id, booking.eventSpaceId));
    if (!space) return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    const [hotel] = await db.select({ host_id: hotels.host_id }).from(hotels).where(eq(hotels.id, space.hotelId));
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware requireHotelOwnerForBooking:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar autorização' });
  }
};

const requireEventBookingAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId obrigatório' });
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const booking = await getEventBookingById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    const space = await getEventSpaceById(booking.eventSpaceId);
    if (space) {
      const [hotel] = await db.select().from(hotels).where(eq(hotels.id, space.hotelId)).limit(1);
      if (hotel?.host_id === userId) return next();
    }
    if (booking.organizerEmail === userEmail) return next();
    if ((req as any).user?.roles?.includes('admin')) return next();
    return res.status(403).json({ success: false, message: 'Acesso negado' });
  } catch (error) {
    console.error('Erro no middleware requireEventBookingAccess:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar acesso' });
  }
};

const isEventSpaceOwnerOrPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const spaceId = req.params.id || req.params.spaceId;
    if (!spaceId) return res.status(400).json({ success: false, message: 'ID do espaço obrigatório' });
    const userId = (req as any).user?.id;
    const space = await getEventSpaceById(spaceId);
    if (!space) return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    if (space.isActive && req.method === 'GET') return next();
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, space.hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware isEventSpaceOwnerOrPublic:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar acesso' });
  }
};

// ==================== ROUTER PRINCIPAL ====================
const router = Router();
const eventSpaceReviewsService = new EventSpaceReviewsService();

// ==================== ✅ MIDDLEWARE CRÍTICO PARA FOTOS ====================
// ✅ IGNORAR rotas de fotos - deixar passar para o eventSpacePhotoRoutes
// ✅ ESTE MIDDLEWARE DEVE ESTAR NO TOPO, ANTES DE QUALQUER OUTRA ROTA!
router.use('/spaces/:spaceId/photos', (req, res, next) => {
  console.log(`⏭️ [eventController] Ignorando rota de fotos: /spaces/${req.params.spaceId}/photos - passando para o próximo handler`);
  // 'route' faz o Express pular para o próximo router que corresponder à rota
  next('route'); 
});

// ======================= ✅ GET BOOKING BY ID - ACESSO CONTROLADO POR EMAIL =======================
/**
 * @route GET /api/events/bookings/:bookingId?email=cliente@email.com
 * @description Buscar reserva de evento por ID - ACESSO PRIVADO
 * @access Private - apenas o organizador que fez a reserva
 * 
 * ✅ USADO PELA PÁGINA DE CONFIRMAÇÃO DE RESERVA
 * ✅ NÃO REQUER FIREBASE TOKEN (reserva acabou de ser feita)
 * ✅ VALIDA SE O EMAIL CORRESPONDE AO ORGANIZADOR
 * ✅ RETORNA booking, space E hotel
 */
router.get('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId;
    const { email } = req.query;
    
    console.log(`🔍 Buscando reserva de evento: ${bookingId}`);
    console.log(`📧 Email fornecido: ${email}`);
    
    // Validar ID
    if (!bookingId || bookingId.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID da reserva inválido' 
      });
    }

    // Validar email
    if (!email || typeof email !== 'string') {
      return res.status(401).json({ 
        success: false, 
        message: 'Email é obrigatório para aceder à reserva' 
      });
    }

    // Buscar reserva
    const booking = await getEventBookingById(bookingId);
    
    if (!booking) {
      console.log(`❌ Reserva não encontrada: ${bookingId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    // ✅ VERIFICAR SE O EMAIL CORRESPONDE AO ORGANIZADOR
    if (booking.organizerEmail.toLowerCase() !== email.toLowerCase()) {
      console.log(`❌ Acesso negado: email ${email} não corresponde ao organizador ${booking.organizerEmail}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Esta reserva não pertence a este email.' 
      });
    }

    // Buscar espaço
    const space = await getEventSpaceById(booking.eventSpaceId);
    
    // Buscar hotel se existir
    let hotel = null;
    if (space?.hotelId) {
      const [hotelData] = await db
        .select()
        .from(hotels)
        .where(eq(hotels.id, space.hotelId))
        .limit(1);
      hotel = hotelData ? adaptToCamelCase(hotelData) : null;
    }

    // Formatar resposta - TUDO em snake_case para o frontend
    const response = {
      success: true,
      data: {
        booking: adaptToSnakeCase(booking),
        space: space ? adaptToSnakeCase(space) : null,
        hotel: hotel ? adaptToSnakeCase(hotel) : null,
      }
    };

    console.log(`✅ Reserva encontrada: ${bookingId} - Acesso autorizado para ${email}`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erro ao buscar reserva:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar reserva',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// ======================= BUSCA POR PROXIMIDADE =======================
// ✅ CORRIGIDO: Usando any no parâmetro para evitar erro de tipo com distance_km
router.get('/spaces/search/nearby', async (req: Request, res: Response) => {
  try {
    const validated = nearbySearchSchema.parse(req.query);
    
    const {
      lat,
      lng,
      radius = 50,
      startDate,
      endDate,
      capacity,
      eventType,
      maxPricePerDay,
      amenities,
      minRating,
      useExactLocations = false
    } = validated;
    
    const spaces = await searchEventSpacesNearbyEnhanced(
      lat,
      lng,
      radius,
      {
        startDate,
        endDate,
        capacity,
        eventType,
        maxPricePerDay,
        amenities: amenities ? amenities.split(',').filter(a => a.trim() !== '') : undefined,
        minRating
      },
      useExactLocations
    );
    
    // ✅ CORRIGIDO: Usando any para evitar erro de tipo com distance_km
    const formattedSpaces = spaces.map((item: any) => {
      const result: any = {
        space: adaptToSnakeCase(item.space),
        hotel: adaptToSnakeCase(item.hotel),
      };
      
      if (item.distance_km !== undefined) {
        result.distance_km = item.distance_km;
      }
      if (item.distance_from_exact_location_km !== undefined) {
        result.distance_from_exact_location_km = item.distance_from_exact_location_km;
      }
      if (item.distance_from_hotel_km !== undefined) {
        result.distance_from_hotel_km = item.distance_from_hotel_km;
      }
      if (item.location) {
        result.location = adaptToSnakeCase(item.location);
      }
      if (item.priority !== undefined) {
        result.priority = item.priority;
      }
      
      return result;
    });
    
    res.json({
      success: true,
      data: formattedSpaces,
      count: formattedSpaces.length,
      center: { lat, lng },
      radius_km: radius,
      search_params: {
        lat,
        lng,
        radius,
        startDate,
        endDate,
        capacity,
        eventType,
        maxPricePerDay,
        amenities: amenities ? amenities.split(',').filter(a => a.trim() !== '') : undefined,
        minRating,
        useExactLocations
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos para busca por proximidade',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    console.error('Erro na busca por proximidade de event spaces:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno na busca por proximidade'
    });
  }
});

// ======================= REVIEWS =======================
router.get('/spaces/:id/reviews', async (req: Request, res: Response) => {
  try {
    const eventSpaceId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const minRating = parseInt(req.query.minRating as string) || 0;
    const sortBy = (req.query.sortBy as "recent" | "highest_rating" | "most_helpful") || "recent";
    const reviews = await eventSpaceReviewsService.getReviews(eventSpaceId, limit, offset, minRating, sortBy);
    res.json({
      success: true,
      data: reviews,
      count: reviews.length,
      pagination: { limit, offset, hasMore: reviews.length === limit },
    });
  } catch (error) {
    console.error('Erro ao buscar reviews:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar reviews' });
  }
});

router.get('/spaces/:id/reviews/stats', async (req: Request, res: Response) => {
  try {
    const eventSpaceId = req.params.id;
    const stats = await eventSpaceReviewsService.getStats(eventSpaceId);
    res.json({
      success: true,
      data: stats || {
        total_reviews: 0,
        average_rating: 0,
        with_responses: 0,
        category_averages: {},
        rating_distribution: {},
        total_helpful_votes: 0,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de reviews:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas de reviews' });
  }
});

router.post('/spaces/reviews/submit', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const validated = submitEventReviewSchema.parse(req.body);
    const booking = await getEventBookingById(validated.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }
    if (booking.organizerEmail !== userEmail && booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Só pode avaliar a sua própria reserva' });
    }
    if (new Date(booking.endDate) > new Date()) {
      return res.status(400).json({ success: false, message: 'Só pode avaliar após o término do evento' });
    }
    const result = await eventSpaceReviewsService.submitReview(
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
    res.status(500).json({ success: false, message: 'Erro ao submeter review' });
  }
});

router.post('/spaces/reviews/:reviewId/vote-helpful', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { isHelpful } = voteHelpfulSchema.parse(req.body);
    const result = await eventSpaceReviewsService.voteHelpful(
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
    res.status(500).json({ success: false, message: 'Erro ao votar review' });
  }
});

router.post('/spaces/:spaceId/reviews/:reviewId/respond', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { responseText } = respondEventReviewSchema.parse(req.body);
    const result = await eventSpaceReviewsService.respondToReview(
      req.params.reviewId,
      req.params.spaceId,
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
    res.status(500).json({ success: false, message: 'Erro ao responder review' });
  }
});

// ==================== CALENDÁRIO DE DISPONIBILIDADE ====================
router.get('/spaces/:id/calendar', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }

    const calendar = await getEventSpaceCalendar(
      req.params.id,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: calendar,
      count: calendar.length,
    });
  } catch (error) {
    console.error('Erro ao buscar calendário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar calendário'
    });
  }
});

router.post('/spaces/:id/availability/day', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const validated = eventAvailabilitySchema.parse(req.body);
    
    const updateData = {
      date: validated.date,
      isAvailable: validated.is_available,
      stopSell: validated.stop_sell,
      priceOverride: validated.price_override ? toNumber(validated.price_override) : undefined,
    };

    const updates = [updateData];
    await bulkUpdateEventAvailability(req.params.id, updates);

    res.json({
      success: true,
      message: 'Dia atualizado com sucesso',
      data: updateData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    console.error('Erro ao atualizar dia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar disponibilidade do dia'
    });
  }
});

router.get('/spaces/:id/bookings/filtered', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    let conditions: any[] = [eq(eventBookings.eventSpaceId, req.params.id)];
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      const validStatuses = statuses.filter(s => VALID_BOOKING_STATUSES.includes(s as BookingStatus));
      if (validStatuses.length > 0) {
        conditions.push(inArray(eventBookings.status, validStatuses as string[]));
      }
    }
    
    if (startDate && endDate) {
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);
      conditions.push(
        sql`${eventBookings.startDate}::date >= ${startDateObj}::date AND ${eventBookings.endDate}::date <= ${endDateObj}::date`
      );
    }
    
    const query = db
      .select()
      .from(eventBookings)
      .where(and(...conditions))
      .orderBy(desc(eventBookings.startDate))
      .limit(Number(limit))
      .offset(Number(offset));
    
    const bookings = await query;
    const formattedBookings = bookings.map(booking => adaptToSnakeCase(booking));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: bookings.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar reservas filtradas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reservas'
    });
  }
});

// ======================= ESPAÇOS =======================
router.get('/spaces', async (req: Request, res: Response) => {
  try {
    const filters = {
      query: req.query.query as string | undefined,
      locality: req.query.locality as string | undefined,
      province: req.query.province as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      capacity: req.query.capacity ? Number(req.query.capacity) : undefined,
      eventType: req.query.eventType as string | undefined,
      maxPricePerDay: req.query.maxPricePerDay ? Number(req.query.maxPricePerDay) : undefined,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      hotelId: req.query.hotelId as string | undefined,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lng: req.query.lng ? Number(req.query.lng) : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : 50,
      sortBy: (req.query.sortBy as 'distance' | 'price' | 'capacity' | 'rating') || 'distance',
      useExactLocations: req.query.useExactLocations === 'true' || req.query.useExactLocations === '1'
    };
    
    const result = await searchEventSpaces(filters);
    
    // ✅ CORRIGIDO: Usando any para evitar erro de tipo com distance_km
    const formattedResult = result.map((item: any) => {
      const baseResult: any = {
        space: adaptToSnakeCase(item.space),
        hotel: adaptToSnakeCase(item.hotel),
        base_price_per_day: item.space.basePricePerDay || "0",
        weekend_surcharge_percent: item.space.weekendSurchargePercent || 0,
        offers_catering: item.space.offersCatering || false,
        max_capacity: item.space.capacityMax,
        allowed_event_types: item.space.allowedEventTypes || [],
      };
      
      if (item.distance_km !== undefined) {
        baseResult.distance_km = item.distance_km;
      }
      if (item.distance_from_exact_location_km !== undefined) {
        baseResult.distance_from_exact_location_km = item.distance_from_exact_location_km;
      }
      if (item.distance_from_hotel_km !== undefined) {
        baseResult.distance_from_hotel_km = item.distance_from_hotel_km;
      }
      
      return baseResult;
    });
    
    const response: any = {
      success: true, 
      data: formattedResult, 
      count: formattedResult.length,
      search_type: filters.lat !== undefined && filters.lng !== undefined ? 'nearby' : 'traditional'
    };
    
    if (filters.lat !== undefined && filters.lng !== undefined) {
      response.center = { lat: filters.lat, lng: filters.lng };
      response.radius_km = filters.radiusKm;
      response.use_exact_locations = filters.useExactLocations;
    }
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar espaços:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar espaços' });
  }
});

// ✅ ROTA CORRIGIDA - CAMPO allowed_event_types PRESERVADO!
// ✅ TODOS OS ARRAYS SÃO SEMPRE ENVIADOS (NUNCA UNDEFINED)
router.get('/spaces/:id', async (req: Request, res: Response) => {
  try {
    await incrementEventSpaceViewCount(req.params.id);
    const spaceDetails = await getEventSpaceDetails(req.params.id);
    
    if (!spaceDetails) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    }
    
    const cateringUrls = await getCateringMenuUrls(req.params.id);
    const cateringDiscount = await getCateringDiscountPercent(req.params.id);
    
    const priceValue = String(
      spaceDetails.space.basePricePerDay || 
      spaceDetails.space.pricePerDay || 
      "0"
    );
    
    // ✅ 1. PEGAR O SPACE ORIGINAL (COM TODOS OS CAMPOS)
    const originalSpace = spaceDetails.space;
    
    // ✅ 2. CONVERTER PARA SNAKE CASE (MAS PRESERVAR OS ARRAYS)
    const snakeCaseSpace = adaptToSnakeCase(originalSpace);
    
    // ✅ 3. CONSTRUIR RESPOSTA COM TODOS OS CAMPOS NECESSÁRIOS
    const response = {
      space: {
        ...snakeCaseSpace,
        // Campos de preço
        base_price_per_day: priceValue,
        price_per_day: priceValue,
        basePricePerDay: priceValue,
        pricePerDay: priceValue,
        
        // ✅ CAMPO CRÍTICO #1: Tipos permitidos - NUNCA undefined!
        allowed_event_types: originalSpace.allowedEventTypes || [],
        
        // ✅ CAMPO CRÍTICO #2: Tipos proibidos - NUNCA undefined!
        prohibited_event_types: originalSpace.prohibitedEventTypes || [],
        
        // ✅ TODOS OS OUTROS ARRAYS - NUNCA undefined!
        amenities: originalSpace.amenities || [],
        setup_options: originalSpace.setupOptions || [],
        images: originalSpace.images || [],
        catering_menu_urls: originalSpace.cateringMenuUrls || [],
      },
      hotel: adaptToSnakeCase(spaceDetails.hotel),
      
      // Campos adicionais
      base_price_per_day: priceValue,
      weekend_surcharge_percent: originalSpace.weekendSurchargePercent || 0,
      available_for_immediate_booking: await isEventSpaceAvailableForImmediateBooking(req.params.id),
      alcohol_allowed: await isAlcoholAllowed(req.params.id),
      max_capacity: originalSpace.capacityMax,
      offers_catering: originalSpace.offersCatering || false,
      catering_discount_percent: cateringDiscount,
      catering_menu_urls: cateringUrls,
      security_deposit: originalSpace.securityDeposit || "0",
    };
    
    // ✅ 4. LOGS PARA DEBUG - CONFIRMAR QUE O CAMPO ESTÁ PRESENTE
    console.log(`✅ [SPACE DETAILS] ID: ${req.params.id}`);
    console.log(`✅ allowed_event_types:`, response.space.allowed_event_types);
    console.log(`✅ Quantidade: ${response.space.allowed_event_types.length} tipos`);
    
    // ✅ 5. SE ESTIVER VAZIO, AVISAR (MAS AINDA ENVIAR ARRAY VAZIO)
    if (response.space.allowed_event_types.length === 0) {
      console.log(`⚠️ ATENÇÃO: Espaço ${req.params.id} não tem tipos de evento configurados!`);
    }
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar detalhes do espaço:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar espaço: ' + (error as Error).message 
    });
  }
});

// ✅ Rota de criação de espaço - 100% COMPATÍVEL COM EVENTSPACESERVICE
router.post('/spaces', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    }
    
    if (!rawData.hotel_id) {
      return res.status(400).json({ success: false, message: 'hotel_id obrigatório' });
    }
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, rawData.hotel_id)).limit(1);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    }
    
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    const processedData = {
      ...rawData,
      equipment: processEquipmentField(rawData.equipment),
    };
    
    const validatedData = createEventSpaceSchema.parse({
      ...processedData,
      name: processedData.name || 'Espaço Sem Nome',
      capacity_min: Number(processedData.capacity_min) || 10,
      capacity_max: Number(processedData.capacity_max) || 50,
      base_price_per_day: processedData.base_price_per_day || '1000.00',
    });
    
    // Garantir que basePricePerDay e pricePerDay sejam strings, nunca null
    const priceValue = validatedData.base_price_per_day || "0";
    
    const createData: CreateEventSpaceInput = {
      hotelId: validatedData.hotel_id,
      name: validatedData.name,
      description: validatedData.description || null,
      capacityMin: validatedData.capacity_min,
      capacityMax: validatedData.capacity_max,
      basePricePerDay: priceValue,
      pricePerDay: priceValue,
      weekendSurchargePercent: validatedData.weekend_surcharge_percent ?? null,
      securityDeposit: validatedData.security_deposit || null,
      
      // Campos booleanos - SEMPRE usar undefined, NUNCA null
      offersCatering: validatedData.offers_catering ?? undefined,
      isActive: validatedData.is_active ?? undefined,
      isFeatured: validatedData.is_featured ?? undefined,
      
      // ✅ Arrays - converter null para undefined, NUNCA passar null
      cateringMenuUrls: validatedData.catering_menu_urls?.length ? validatedData.catering_menu_urls : undefined,
      amenities: validatedData.amenities?.length ? validatedData.amenities : undefined,
      allowedEventTypes: validatedData.allowed_event_types?.length ? validatedData.allowed_event_types : undefined,
      prohibitedEventTypes: validatedData.prohibited_event_types?.length ? validatedData.prohibited_event_types : undefined,
      setupOptions: validatedData.setup_options?.length ? validatedData.setup_options : undefined,
      images: validatedData.images?.length ? validatedData.images : undefined,
      
      // Campos que aceitam null
      cateringDiscountPercent: validatedData.catering_discount_percent ?? null,
      equipment: validatedData.equipment || null,
      areaSqm: validatedData.area_sqm ?? null,
      spaceType: validatedData.space_type || null,
      hasStage: validatedData.has_stage ?? null,
      naturalLight: validatedData.natural_light ?? null,
      loadingAccess: validatedData.loading_access ?? null,
      dressingRooms: validatedData.dressing_rooms ?? null,
      insuranceRequired: validatedData.insurance_required ?? null,
      alcoholAllowed: validatedData.alcohol_allowed ?? null,
      floorPlanImage: validatedData.floor_plan_image || null,
      virtualTourUrl: validatedData.virtual_tour_url || null,
      approvalRequired: validatedData.approval_required ?? null,
      slug: validatedData.slug || null
    };
    
    const newSpace = await createEventSpace(createData);
    
    res.status(201).json({
      success: true,
      message: 'Espaço criado com sucesso',
      data: {
        id: newSpace.id,
        hotel_id: newSpace.hotelId,
        name: newSpace.name,
        description: newSpace.description,
        capacity_min: newSpace.capacityMin,
        capacity_max: newSpace.capacityMax,
        base_price_per_day: newSpace.basePricePerDay,
        price_per_day: newSpace.pricePerDay,
        weekend_surcharge_percent: newSpace.weekendSurchargePercent,
        offers_catering: newSpace.offersCatering,
        is_active: newSpace.isActive,
        is_featured: newSpace.isFeatured,
        created_at: newSpace.createdAt,
        updated_at: newSpace.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({ path: err.path.join('.'), message: err.message })),
      });
    }
    console.error('Erro ao criar espaço:', error);
    res.status(500).json({ success: false, message: 'Erro ao criar espaço' });
  }
});

// ✅ Rota de atualização de espaço - 100% COMPATÍVEL COM EVENTSPACESERVICE
router.put('/spaces/:id', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    
    const processedData = {
      ...rawData,
      equipment: processEquipmentField(rawData.equipment),
    };
    
    const validatedData = updateEventSpaceSchema.parse(processedData);
    const adaptedData = adaptToCamelCase(validatedData);
    const updateData: any = { ...adaptedData };
    
    if (rawData.base_price_per_day !== undefined) {
      const priceValue = rawData.base_price_per_day ? toDecimalString(rawData.base_price_per_day) : "0";
      updateData.basePricePerDay = priceValue;
      updateData.pricePerDay = priceValue;
    }
    
    if (rawData.security_deposit !== undefined) {
      updateData.securityDeposit = rawData.security_deposit ? toDecimalString(rawData.security_deposit) : "0";
    }
    
    if (rawData.capacity_min !== undefined) {
      updateData.capacityMin = Number(rawData.capacity_min);
    }
    
    if (rawData.capacity_max !== undefined) {
      updateData.capacityMax = Number(rawData.capacity_max);
    }
    
    if (rawData.weekend_surcharge_percent !== undefined) {
      updateData.weekendSurchargePercent = Number(rawData.weekend_surcharge_percent);
    }
    
    if (rawData.area_sqm !== undefined) {
      updateData.areaSqm = Number(rawData.area_sqm);
    }
    
    if (rawData.dressing_rooms !== undefined) {
      updateData.dressingRooms = Number(rawData.dressing_rooms);
    }
    
    if (rawData.catering_discount_percent !== undefined) {
      updateData.cateringDiscountPercent = Number(rawData.catering_discount_percent);
    }
    
    if (rawData.equipment !== undefined) {
      updateData.equipment = processEquipmentField(rawData.equipment);
    }
    
    // ✅ CORREÇÃO: Campos booleanos - converter null para undefined
    if (rawData.offers_catering !== undefined) {
      updateData.offersCatering = rawData.offers_catering === null ? undefined : rawData.offers_catering;
    }
    
    if (rawData.is_active !== undefined) {
      updateData.isActive = rawData.is_active === null ? undefined : rawData.is_active;
    }
    
    if (rawData.is_featured !== undefined) {
      updateData.isFeatured = rawData.is_featured === null ? undefined : rawData.is_featured;
    }
    
    // ✅ CORREÇÃO: Arrays - converter null para undefined
    if (rawData.catering_menu_urls !== undefined) {
      updateData.cateringMenuUrls = rawData.catering_menu_urls === null ? undefined : rawData.catering_menu_urls;
    }
    
    if (rawData.amenities !== undefined) {
      updateData.amenities = rawData.amenities === null ? undefined : rawData.amenities;
    }
    
    if (rawData.allowed_event_types !== undefined) {
      updateData.allowedEventTypes = rawData.allowed_event_types === null ? undefined : rawData.allowed_event_types;
    }
    
    if (rawData.prohibited_event_types !== undefined) {
      updateData.prohibitedEventTypes = rawData.prohibited_event_types === null ? undefined : rawData.prohibited_event_types;
    }
    
    if (rawData.setup_options !== undefined) {
      updateData.setupOptions = rawData.setup_options === null ? undefined : rawData.setup_options;
    }
    
    if (rawData.images !== undefined) {
      updateData.images = rawData.images === null ? undefined : rawData.images;
    }
    
    const updated = await updateEventSpace(req.params.id, updateData);
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    }
    
    res.json({
      success: true,
      message: 'Espaço atualizado',
      data: adaptToSnakeCase(updated),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    console.error('Erro ao atualizar espaço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar espaço: ' + (error as Error).message
    });
  }
});

router.delete('/spaces/:id', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const hasActiveBookings = await hasActiveEventBookingsForSpace(req.params.id);
    if (hasActiveBookings) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível desativar espaço com reservas ativas'
      });
    }
    
    const deactivated = await deactivateEventSpace(req.params.id);
    
    if (!deactivated) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    }
    
    res.json({
      success: true,
      message: 'Espaço desativado com sucesso',
      data: adaptToSnakeCase(deactivated),
    });
  } catch (error) {
    console.error('Erro ao desativar espaço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar espaço: ' + (error as Error).message
    });
  }
});

// ======================= DISPONIBILIDADE =======================
router.get('/spaces/:id/availability', isEventSpaceOwnerOrPublic, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const availability = await getEventSpaceCalendar(
      req.params.id,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: availability,
      count: availability.length,
    });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar disponibilidade: ' + (error as Error).message
    });
  }
});

router.post('/spaces/:id/availability/check', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.body;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'start_date e end_date são obrigatórios'
      });
    }
    
    const result = await checkEventSpaceAvailability(
      req.params.id,
      start_date,
      end_date
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar disponibilidade: ' + (error as Error).message
    });
  }
});

router.post('/spaces/:id/availability/bulk', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const validated = bulkAvailabilitySchema.parse(req.body);
    
    const updates = validated.map(av => ({
      date: av.date,
      isAvailable: av.is_available,
      stopSell: av.stop_sell,
      priceOverride: av.price_override ? toNumber(av.price_override) : undefined,
    }));
    
    await bulkUpdateEventAvailability(req.params.id, updates);
    
    res.json({
      success: true,
      message: 'Disponibilidade atualizada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar disponibilidade: ' + (error as Error).message
    });
  }
});

router.get('/spaces/:id/availability/stats', isEventSpaceOwnerOrPublic, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const stats = await getEventSpaceAvailabilityStats(
      req.params.id,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas: ' + (error as Error).message
    });
  }
});

// ======================= ✅ ROTA DE CRIAÇÃO DE RESERVA =======================
router.post('/spaces/:id/bookings', async (req: Request, res: Response) => {
  try {
    const spaceId = req.params.id;
    
    console.log(`📝 [CRIAR RESERVA] Iniciando criação para espaço: ${spaceId}`);
    
    // 1. Buscar o espaço
    const space = await getEventSpaceById(spaceId);
    if (!space) {
      console.log(`❌ [CRIAR RESERVA] Espaço não encontrado: ${spaceId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Espaço não encontrado' 
      });
    }
    
    if (!space.isActive) {
      console.log(`❌ [CRIAR RESERVA] Espaço inativo: ${spaceId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Este espaço não está disponível para reservas' 
      });
    }

    // 2. Validar dados da reserva
    const validated = createEventBookingSchema.parse(req.body);
    
    const startDate = validated.start_date;
    const endDate = validated.end_date;
    const expectedAttendees = validated.expected_attendees;

    console.log(`📋 [CRIAR RESERVA] Dados validados:`, {
      spaceId,
      startDate,
      endDate,
      expectedAttendees,
      eventTitle: validated.event_title
    });

    // 3. Verificar disponibilidade
    const availability = await checkEventSpaceAvailability(spaceId, startDate, endDate);
    if (!availability.isAvailable) {
      console.log(`❌ [CRIAR RESERVA] Espaço indisponível:`, availability);
      return res.status(400).json({ 
        success: false, 
        message: availability.message || 'Espaço indisponível para este período',
        data: availability 
      });
    }

    // 4. Verificar conflitos de reserva
    const conflicts = await checkBookingConflicts(spaceId, startDate, endDate);
    if (conflicts.hasConflict) {
      console.log(`❌ [CRIAR RESERVA] Conflito de período:`, conflicts);
      return res.status(409).json({ 
        success: false, 
        message: 'Este período já está reservado ou em análise',
        data: conflicts 
      });
    }

    // 5. Verificar capacidade
    const capacityCheck = await checkEventSpaceCapacity(spaceId, expectedAttendees);
    if (!capacityCheck.valid) {
      console.log(`❌ [CRIAR RESERVA] Capacidade insuficiente:`, capacityCheck);
      return res.status(400).json({ 
        success: false, 
        message: capacityCheck.message,
        data: {
          expected: expectedAttendees,
          min_capacity: space.capacityMin,
          max_capacity: space.capacityMax
        }
      });
    }

    // 6. Calcular preço total
    const totalPriceCalculation = await calculateEventPrice(
      spaceId,
      startDate,
      endDate,
      validated.catering_required || false
    );

    // Extrair valores de forma segura
    let basePrice = "0";
    let cateringPrice = "0";
    let totalPrice = "0";
    
    if (typeof totalPriceCalculation === 'object' && totalPriceCalculation !== null) {
      const obj = totalPriceCalculation as any;
      basePrice = obj.basePrice !== undefined ? String(obj.basePrice) : "0";
      cateringPrice = obj.cateringPrice !== undefined ? String(obj.cateringPrice) : "0";
      totalPrice = obj.totalPrice !== undefined ? String(obj.totalPrice) : "0";
    } else if (typeof totalPriceCalculation === 'string' || typeof totalPriceCalculation === 'number') {
      totalPrice = String(totalPriceCalculation);
      const total = parseFloat(totalPrice) || 0;
      basePrice = String(total * 0.8);
    }

    console.log(`💰 [CRIAR RESERVA] Preço calculado:`, { basePrice, cateringPrice, totalPrice });

    // 7. Obter depósito de segurança
    const securityDeposit = space.securityDeposit || "0";

    // 8. Preparar dados da reserva
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    const bookingData = {
      eventSpaceId: spaceId,
      hotelId: space.hotelId,
      organizerName: validated.organizer_name,
      organizerEmail: validated.organizer_email,
      organizerPhone: validated.organizer_phone || undefined,
      eventTitle: validated.event_title,
      eventDescription: validated.event_description || undefined,
      eventType: validated.event_type,
      startDate,
      endDate,
      expectedAttendees: validated.expected_attendees,
      specialRequests: validated.special_requests || undefined,
      additionalServices: validated.additional_services || {},
      cateringRequired: validated.catering_required || false,
      userId: validated.user_id || userId,
      userEmail: userEmail || validated.organizer_email,
      
      // Campos financeiros - como strings, nunca null
      basePrice: String(basePrice),
      cateringPrice: String(cateringPrice),
      totalPrice: String(totalPrice),
      securityDeposit: String(securityDeposit),
      
      // Status inicial
      status: space.approvalRequired ? 'pending_approval' : 'confirmed',
      paymentStatus: 'pending',
      depositPaid: "0",
      balanceDue: String(totalPrice)
    };

    // 9. Criar a reserva
    console.log(`💾 [CRIAR RESERVA] Salvando reserva...`);
    const booking = await createEventBooking(bookingData, userId);
    
    console.log(`✅ [CRIAR RESERVA] Reserva criada com sucesso! ID: ${booking.id}`);

    // 10. Registrar log
    await db.insert(eventBookingLogs).values({
      bookingId: booking.id,
      action: 'created',
      performedBy: userId || null,
      details: {
        message: `Reserva criada por ${booking.organizerName}`,
        start_date: startDate,
        end_date: endDate,
        attendees: expectedAttendees,
        total_price: booking.totalPrice
      }
    });

    // 11. Retornar resposta
    const response = {
      ...adaptToSnakeCase(booking),
      payment_options: {
        deposit_required: space.approvalRequired ? toNumber(securityDeposit) : 0,
        total_price: booking.totalPrice,
        deposit_paid: booking.depositPaid,
        balance_due: booking.balanceDue
      }
    };

    res.status(201).json({
      success: true,
      message: space.approvalRequired 
        ? 'Reserva criada com sucesso! Aguardando aprovação do hotel.'
        : 'Reserva confirmada com sucesso!',
      data: response,
      booking_id: booking.id
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(`❌ [CRIAR RESERVA] Erro de validação:`, error.errors);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    if (error instanceof Error) {
      if (error.message.includes('sobreposição') || error.message.includes('conflito')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('capacidade')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    console.error('❌ [CRIAR RESERVA] Erro inesperado:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar reserva. Por favor, tente novamente.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// ======================= RESERVAS DE ESPAÇOS DE EVENTOS =======================
router.get('/spaces/:id/bookings', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, limit, offset } = req.query;
    
    let conditions: any[] = [eq(eventBookings.eventSpaceId, req.params.id)];
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      const validStatuses = statuses.filter(s => VALID_BOOKING_STATUSES.includes(s as BookingStatus));
      if (validStatuses.length > 0) {
        conditions.push(inArray(eventBookings.status, validStatuses as string[]));
      }
    }
    
    if (startDate && endDate) {
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);
      conditions.push(
        sql`${eventBookings.startDate}::date >= ${startDateObj}::date AND ${eventBookings.endDate}::date <= ${endDateObj}::date`
      );
    }
    
    const query = db
      .select()
      .from(eventBookings)
      .where(and(...conditions))
      .orderBy(desc(eventBookings.startDate));
    
    if (limit) {
      query.limit(Number(limit));
    }
    if (offset) {
      query.offset(Number(offset));
    }
    
    const bookings = await query;
    const formattedBookings = bookings.map(booking => adaptToSnakeCase(booking));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error('Erro ao listar reservas do espaço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar reservas: ' + (error as Error).message
    });
  }
});

router.get('/spaces/:id/bookings/upcoming', isEventSpaceOwnerOrPublic, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const futureEvents = await getFutureEventsBySpace(req.params.id, limit);
    
    const formattedEvents = futureEvents.map(event => adaptToSnakeCase(event));
    
    res.json({
      success: true,
      data: formattedEvents,
      count: formattedEvents.length,
    });
  } catch (error) {
    console.error('Erro ao buscar próximas reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar próximas reservas'
    });
  }
});

router.post('/spaces/:id/capacity/check', async (req: Request, res: Response) => {
  try {
    const validated = checkCapacitySchema.parse(req.body);
    
    const result = await checkEventSpaceCapacity(
      req.params.id,
      validated.expected_attendees
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    console.error('Erro ao verificar capacidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar capacidade'
    });
  }
});

// ======================= LOGS DE RESERVAS (PRIVADO) =======================
router.get('/bookings/:bookingId/logs', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const logs = await getEventBookingLogs(req.params.bookingId);
    
    const formattedLogs = logs.map(log => adaptToSnakeCase(log));
    
    res.json({
      success: true,
      data: formattedLogs,
    });
  } catch (error) {
    console.error('Erro ao buscar logs da reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs: ' + (error as Error).message
    });
  }
});

// ======================= CONFIRMAR/REJEITAR RESERVAS (PRIVADO) =======================
router.post('/bookings/:bookingId/confirm',
  verifyFirebaseToken,
  requireHotelOwnerForBooking,
  async (req: Request, res: Response) => {
    try {
      const { notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Autenticação requerida' });
      }

      const confirmed = await confirmEventBooking(req.params.bookingId, userId);

      if (!confirmed) {
        return res.status(404).json({
          success: false,
          message: 'Reserva não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Reserva confirmada com sucesso',
        data: adaptToSnakeCase(confirmed)
      });
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Erro ao confirmar reserva'
      });
    }
  }
);

router.post('/bookings/:bookingId/reject',
  verifyFirebaseToken,
  requireHotelOwnerForBooking,
  async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Motivo obrigatório (mín. 5 caracteres)' });
      }

      const rejected = await rejectEventBooking(req.params.bookingId, reason, userId);

      if (!rejected) {
        return res.status(404).json({
          success: false,
          message: 'Reserva não encontrada ou não pôde ser rejeitada'
        });
      }

      res.json({
        success: true,
        message: 'Reserva rejeitada com sucesso',
        data: adaptToSnakeCase(rejected)
      });
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      res.status(400).json({ 
        success: false, 
        message: (error as Error).message || 'Erro ao rejeitar reserva' 
      });
    }
  }
);

router.post('/bookings/:bookingId/cancel',
  verifyFirebaseToken,
  requireEventBookingAccess,
  async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const userId = (req as any).user?.id;
      
      const cancelled = await cancelEventBooking(req.params.bookingId, reason, userId);
      
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: 'Reserva não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Reserva cancelada',
        data: adaptToSnakeCase(cancelled)
      });
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }
);

router.put('/bookings/:bookingId',
  verifyFirebaseToken,
  requireEventBookingAccess,
  async (req: Request, res: Response) => {
    try {
      const bookingData = adaptToCamelCase(req.body);
      const userId = (req as any).user?.id;

      if (bookingData.status && !VALID_BOOKING_STATUSES.includes(bookingData.status)) {
        return res.status(400).json({
          success: false,
          message: `Status inválido. Valores permitidos: ${VALID_BOOKING_STATUSES.join(', ')}`
        });
      }
      
      if (bookingData.basePrice !== undefined) {
        bookingData.basePrice = toDecimalString(bookingData.basePrice);
      }
      
      if (bookingData.totalPrice !== undefined) {
        bookingData.totalPrice = toDecimalString(bookingData.totalPrice);
      }
      
      if (bookingData.securityDeposit !== undefined) {
        bookingData.securityDeposit = bookingData.securityDeposit ? toDecimalString(bookingData.securityDeposit) : "0";
      }
      
      if (bookingData.depositPaid !== undefined) {
        bookingData.depositPaid = bookingData.depositPaid ? toDecimalString(bookingData.depositPaid) : "0";
      }
      
      if (bookingData.balanceDue !== undefined) {
        bookingData.balanceDue = bookingData.balanceDue ? toDecimalString(bookingData.balanceDue) : "0";
      }
      
      const updated = await updateEventBooking(req.params.bookingId, bookingData, userId);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Reserva não encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Reserva atualizada',
        data: adaptToSnakeCase(updated)
      });
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Erro ao atualizar reserva'
      });
    }
  }
);

// ======================= PAGAMENTOS DE EVENTOS =======================
router.get('/bookings/:bookingId/payment', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const paymentDetails = await eventPaymentService.getEventBookingPaymentDetails(req.params.bookingId);
    
    res.json({
      success: true,
      data: paymentDetails,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pagamento: ' + (error as Error).message
    });
  }
});

router.get('/bookings/:bookingId/deposit', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const deposit = await eventPaymentService.calculateRequiredEventDeposit(req.params.bookingId);
    
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

router.post('/bookings/:bookingId/payments', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id;
    
    const validated = manualEventPaymentSchema.parse(req.body);
    
    const booking = await getEventBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }
    
    const result = await eventPaymentService.registerManualEventPayment(bookingId, {
      amount: validated.amount,
      paymentMethod: validated.payment_method,
      referenceNumber: validated.reference,
      paymentType: validated.payment_type,
      registeredBy: userId,
      notes: validated.notes,
    });
    
    const normalizedBooking = {
      id: result.booking.id,
      event_space_id: result.booking.eventSpaceId,
      hotel_id: result.booking.hotelId,
      organizer_name: result.booking.organizerName,
      organizer_email: result.booking.organizerEmail,
      event_title: result.booking.eventTitle,
      event_type: result.booking.eventType,
      start_date: result.booking.startDate,
      end_date: result.booking.endDate,
      expected_attendees: result.booking.expectedAttendees,
      total_price: result.booking.totalPrice || "0",
      base_price: result.booking.basePrice || "0",
      security_deposit: result.booking.securityDeposit || "0",
      deposit_paid: result.booking.depositPaid || "0",
      balance_due: result.booking.balanceDue || result.booking.totalPrice || "0",
      status: result.booking.status || 'pending_approval',
      payment_status: result.booking.paymentStatus || 'pending',
      created_at: result.booking.createdAt,
      updated_at: result.booking.updatedAt,
    };
    
    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: {
        paymentId: result.paymentId,
        booking: normalizedBooking,
        message: result.message,
        paymentSummary: result.paymentSummary || {
          totalPrice: toNumber(booking.totalPrice),
          amountPaid: toNumber(booking.depositPaid),
          amountDue: toNumber(booking.balanceDue),
          paymentStatus: booking.paymentStatus,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
    }
    console.error('❌ Erro ao registrar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar pagamento: ' + (error as Error).message
    });
  }
});

router.get('/bookings/:bookingId/receipt', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    const booking = await getEventBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }
    
    const payments = await eventPaymentService.getPaymentsByEventBooking(req.params.bookingId);
    
    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum pagamento encontrado'
      });
    }
    
    const lastPayment = payments[0];
    const receipt = await eventPaymentService.generateEventReceipt(lastPayment.id, userId);
    
    res.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar recibo: ' + (error as Error).message
    });
  }
});

router.post('/bookings/:bookingId/payments/confirm',
  verifyFirebaseToken,
  requireHotelOwnerForBooking,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.body;
      const userId = (req as any).user?.id;
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'paymentId é obrigatório'
        });
      }
      
      const result = await eventPaymentService.confirmEventPayment(paymentId, userId);
      
      res.json({
        success: true,
        message: 'Pagamento confirmado',
        data: result,
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao confirmar pagamento: ' + (error as Error).message
      });
    }
  }
);

// ======================= DASHBOARD DO HOTEL =======================
router.get('/hotel/:hotelId/dashboard', verifyFirebaseToken, requireHotelOwnerForHotelIdParam, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId;
    
    const summary = await getEventDashboardSummary(hotelId);
    const stats = await getEventStatsForHotel(hotelId);
    const upcomingEvents = await getUpcomingEventsForHotel(hotelId, 10);
    
    const formattedEvents = upcomingEvents.map((item: any) => ({
      booking: adaptToSnakeCase(item.booking),
      space: adaptToSnakeCase(item.space),
    }));
    
    const spacesOverview = await getEventSpacesOverview(hotelId);
    const formattedSpaces = spacesOverview.map((item: any) => ({
      space: adaptToSnakeCase(item.space),
      total_bookings: item.totalBookings,
      revenue: item.revenue,
    }));
    
    const pendingApproval = await getPendingApprovalBookings(hotelId);
    const formattedPending = pendingApproval.map(booking => adaptToSnakeCase(booking));
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    
    res.json({
      success: true,
      data: {
        summary,
        stats,
        upcoming_events: formattedEvents,
        spaces_overview: formattedSpaces,
        pending_approval_bookings: formattedPending,
        hotel: adaptToSnakeCase(hotel),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dashboard: ' + (error as Error).message
    });
  }
});

router.get('/hotel/:hotelId/financial-summary', verifyFirebaseToken, requireHotelOwnerForHotelIdParam, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId;
    const { startDate, endDate } = req.query;
    
    const financialSummary = await eventPaymentService.getEventFinancialSummary(
      hotelId,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: financialSummary,
    });
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo financeiro'
    });
  }
});

// ======================= ESPAÇOS POR HOTEL =======================
router.get('/hotel/:hotelId/spaces', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const spaces = await getEventSpacesByHotel(req.params.hotelId, includeInactive);
    
    const formattedSpaces = spaces.map(space => adaptToSnakeCase(space));
    
    res.json({
      success: true,
      data: formattedSpaces,
      count: formattedSpaces.length,
    });
  } catch (error) {
    console.error('Erro ao buscar espaços do hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar espaços: ' + (error as Error).message
    });
  }
});

router.get('/hotel/:hotelId/spaces/summary', verifyFirebaseToken, requireHotelOwnerForHotelIdParam, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId;
    
    const summary = await getHotelEventSpacesSummary(hotelId);
    
    const formattedSummary = summary.map((item: any) => ({
      space: adaptToSnakeCase(item.space),
      total_days_available: item.totalDaysAvailable,
    }));
    
    res.json({
      success: true,
      data: formattedSummary,
      count: formattedSummary.length,
    });
  } catch (error) {
    console.error('Erro ao buscar resumo dos espaços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo'
    });
  }
});

router.get('/hotel/:hotelId/bookings', verifyFirebaseToken, requireHotelOwnerForHotelIdParam, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId;
    
    const status = req.query.status ? (req.query.status as string).split(',') : undefined;
    const validStatuses = status?.filter(s => VALID_BOOKING_STATUSES.includes(s as BookingStatus));
    const bookings = await getEventBookingsByHotel(hotelId, validStatuses);
    
    const formattedBookings = bookings.map(booking => adaptToSnakeCase(booking));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error('Erro ao buscar reservas do hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reservas: ' + (error as Error).message
    });
  }
});

router.get('/hotel/:hotelId/spaces/stats', verifyFirebaseToken, requireHotelOwnerForHotelIdParam, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.hotelId;
    
    const spacesWithStats = await getEventSpacesWithStats(hotelId);
    
    const formattedStats = spacesWithStats.map((item: any) => ({
      space: adaptToSnakeCase(item),
      total_bookings: item.totalBookings,
      total_revenue: item.totalRevenue,
      last_booking_date: item.lastBookingDate,
    }));
    
    res.json({
      success: true,
      data: formattedStats,
      count: formattedStats.length,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos espaços:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

// ======================= FUNÇÕES DO ORGANIZADOR =======================
router.get('/my-bookings', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const userId = (req as any).user?.id;
    
    let bookings;
    
    if (userId) {
      const userEmail = (req as any).user?.email;
      if (userEmail) {
        bookings = await getEventBookingsByOrganizerEmail(userEmail);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Email não encontrado no perfil'
        });
      }
    } else if (email) {
      bookings = await getEventBookingsByOrganizerEmail(email);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório ou faça login'
      });
    }
    
    const formattedBookings = bookings.map(booking => adaptToSnakeCase(booking));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
    });
  } catch (error) {
    console.error('Erro ao buscar minhas reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reservas: ' + (error as Error).message
    });
  }
});

router.get('/organizer/events', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    const userId = (req as any).user?.id;
    
    let organizerEmail;
    
    if (userId) {
      organizerEmail = (req as any).user?.email;
    } else if (email) {
      organizerEmail = email;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório ou faça login'
      });
    }
    
    if (!organizerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email não encontrado'
      });
    }
    
    const events = await getEventsByOrganizer(organizerEmail);
    const formattedEvents = events.map(event => adaptToSnakeCase(event));
    
    res.json({
      success: true,
      data: formattedEvents,
      count: formattedEvents.length,
    });
  } catch (error) {
    console.error('Erro ao buscar eventos do organizador:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar eventos'
    });
  }
});

// ======================= OPÇÕES DE PAGAMENTO =======================
router.get('/spaces/:id/payment-options', isEventSpaceOwnerOrPublic, async (req: Request, res: Response) => {
  try {
    const options = await eventPaymentService.getPaymentOptionsForEventSpace(req.params.id);
    
    res.json({
      success: true,
      data: options || { message: 'Usando opções padrão' },
    });
  } catch (error) {
    console.error('Erro ao buscar opções de pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar opções: ' + (error as Error).message
    });
  }
});

router.get('/spaces/:id/available-payment-options', async (req: Request, res: Response) => {
  try {
    const { eventDate, totalAmount } = req.query;
    
    const options = await eventPaymentService.getAvailableEventPaymentOptions(
      req.params.id,
      eventDate as string,
      totalAmount ? Number(totalAmount) : 0
    );
    
    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Erro ao buscar opções de pagamento disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar opções'
    });
  }
});

// ======================= GESTÃO AVANÇADA =======================
router.post('/spaces/bulk/status', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { spaceIds, is_active } = req.body;
    
    if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de IDs de espaços é obrigatória'
      });
    }
    
    for (const spaceId of spaceIds) {
      const space = await getEventSpaceById(spaceId);
      if (space) {
        const [hotel] = await db.select().from(hotels).where(eq(hotels.id, space.hotelId)).limit(1);
        if (!hotel) {
          return res.status(404).json({
            success: false,
            message: `Hotel do espaço ${spaceId} não encontrado`
          });
        }
        
        const isAdmin = (req as any).user?.roles?.includes('admin') || false;
        if (hotel.host_id !== userId && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: `Acesso negado para espaço ${spaceId}`
          });
        }
      }
    }
    
    const updatedCount = await bulkUpdateEventSpacesStatus(spaceIds, is_active);
    
    res.json({
      success: true,
      message: `Status de ${updatedCount} espaços atualizado`,
      data: { updated_count: updatedCount },
    });
  } catch (error) {
    console.error('Erro ao atualizar status em massa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status: ' + (error as Error).message
    });
  }
});

router.post('/spaces/:id/sync-availability', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const updatedCount = await syncAvailabilityWithSpaceConfig(
      req.params.id,
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      message: `Disponibilidade sincronizada para ${updatedCount} dias`,
      data: { updated_days: updatedCount },
    });
  } catch (error) {
    console.error('Erro ao sincronizar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sincronizar disponibilidade: ' + (error as Error).message
    });
  }
});

router.get('/spaces/:id/export-availability', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate e endDate são obrigatórios'
      });
    }
    
    const calendar = await exportAvailabilityCalendar(
      req.params.id,
      startDate as string,
      endDate as string
    );
    
    res.json({
      success: true,
      data: calendar,
      count: calendar.length,
    });
  } catch (error) {
    console.error('Erro ao exportar calendário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao exportar calendário'
    });
  }
});

// ======================= HEALTH CHECK =======================
router.get('/health', async (req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    
    const eventCount = await db.select({ count: sql<number>`COUNT(*)` }).from(eventSpaces);
    const bookingCount = await db.select({ count: sql<number>`COUNT(*)` }).from(eventBookings);
    const hotelCount = await db.select({ count: sql<number>`COUNT(*)` }).from(hotels);
    const logsCount = await db.select({ count: sql<number>`COUNT(*)` }).from(eventBookingLogs);
    
    res.json({
      success: true,
      message: 'Event Spaces module is healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        hotels: hotelCount[0]?.count || 0,
        event_spaces: eventCount[0]?.count || 0,
        event_bookings: bookingCount[0]?.count || 0,
        event_booking_logs: logsCount[0]?.count || 0,
      },
      modules: {
        event_service: true,
        event_space_service: true,
        event_booking_service: true,
        event_payment_service: true,
      },
      version: '1.2.0',
      environment: process.env.NODE_ENV || 'development',
      pricing_model: 'daily_rate',
      features: {
        nearby_search: true,
        exact_locations: true,
        distance_calculation: true,
        haversine_formula: true
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Event Spaces module is unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

export default router;