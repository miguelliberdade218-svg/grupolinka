// src/modules/events/eventController.ts - VERSÃO CORRIGIDA (COM BUSCA POR PROXIMIDADE) - COMPLETO E OTIMIZADO

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

// Importações dos serviços (APENAS FUNÇÕES DIÁRIAS)
import {
  searchEventSpaces,
  searchEventSpacesNearby,
  searchEventSpacesNearbyEnhanced,
  getEventSpaceDetails,
  getEventSpacesByHotel,
  getEventDashboardSummary,
  getEventStatsForHotel,
  getUpcomingEventsForHotel,
  getEventSpacesOverview,
  checkEventSpaceAvailability,
  checkBookingConflicts,
  calculateEventBasePrice,
  getFutureEventsBySpace,
  getEventsByOrganizer,
  incrementEventSpaceViewCount,
  isEventSpaceAvailableForImmediateBooking,
  getFeaturedEventSpaces,
  getEventBookingSecurityDeposit,
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
  isEventSpaceAvailable,
  bulkUpdateEventAvailability,
  getHotelEventSpacesSummary,
  getEventSpaceAvailabilityStats,
  hasActiveEventBookingsForSpace,
  syncAvailabilityWithSpaceConfig,
  exportAvailabilityCalendar,
  getEventSpacesByEventType,
  updateEventSpacePricing,
  checkEventSpaceCapacity,
  bulkUpdateEventSpacesStatus,
  searchEventSpacesWithFilters,
  calculateEventPrice,
  getEventSpacesWithStats,
  isEventSpaceSlugAvailable,
  generateEventSpaceSlug,
  upsertEventAvailability
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
  updateEventBookingPaymentStatus,
  getPendingApprovalBookings,
  rejectEventBooking
} from './eventBookingService';

// Service de Pagamentos
import eventPaymentService from './eventPaymentService';

// Service de Reviews
import { EventSpaceReviewsService } from './event-space-reviews.service';

// ==================== TIPOS ====================
type CreateEventSpaceInput = {
  hotelId: string;
  name: string;
  description?: string | null;
  capacityMin: number;
  capacityMax: number;
  basePricePerDay?: string;
  weekendSurchargePercent?: number;
  areaSqm?: number | null;
  spaceType?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  securityDeposit?: string | null;
  insuranceRequired?: boolean;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean;
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  approvalRequired?: boolean;
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  amenities?: string[];
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  equipment?: any;
  setupOptions?: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  slug?: string;
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

// ✅ CORREÇÃO MELHORADA: Função para processar equipment corretamente
const processEquipmentField = (equipment: any): any => {
  // Debug: mostrar o que está chegando
  console.log('🔍 processEquipmentField - entrada:', {
    type: typeof equipment,
    value: equipment,
    isObject: typeof equipment === 'object' && equipment !== null,
    isString: typeof equipment === 'string'
  });
  
  // Se não existir ou for null/undefined, retornar objeto vazio
  if (!equipment) return {};
  
  // ✅ CORREÇÃO: Se já for objeto, usar diretamente (SEM tentar parsear)
  if (typeof equipment === 'object' && equipment !== null && !Array.isArray(equipment)) {
    // Garantir que não tenha propriedades undefined
    const cleanObj: Record<string, any> = {};
    Object.entries(equipment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanObj[key] = value;
      }
    });
    return cleanObj;
  }
  
  // ✅ CORREÇÃO: Só processar como string se realmente for string
  if (typeof equipment === 'string') {
    try {
      // Debug: mostrar o que está chegando
      console.log('📥 equipment recebido como string:', equipment.substring(0, 100));
      
      // ✅ CORREÇÃO: Verificar se já é JSON válido
      if (equipment.trim().startsWith('{') && equipment.trim().endsWith('}')) {
        // Já é JSON, parsear diretamente
        return JSON.parse(equipment);
      }
      
      // Se não for JSON direto, tentar limpar
      let cleaned = equipment.trim();
      
      // Remover aspas externas se existirem
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Remover escapes
      cleaned = cleaned.replace(/\\"/g, '"');
      cleaned = cleaned.replace(/\\\\/g, '\\');
      
      // Tentar parsear
      const parsed = JSON.parse(cleaned);
      
      // Verificar se é objeto (não array)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      
      // Se for array, transformar em objeto com chave "items"
      if (Array.isArray(parsed)) {
        console.log('⚠️ Equipment é array, convertendo para objeto');
        return { items: parsed };
      }
      
      // Se não for objeto nem array, criar objeto com o valor
      return { value: parsed };
    } catch (e) {
      console.warn('⚠️ Erro ao parsear equipment:', (e as Error).message);
      console.warn('⚠️ Valor original:', equipment);
      return {};
    }
  }
  
  // Se for array, transformar em objeto com chave "items"
  if (Array.isArray(equipment)) {
    console.log('⚠️ Equipment é array, convertendo para objeto');
    return { items: equipment };
  }
  
  // Qualquer outro tipo, retornar objeto vazio
  return {};
};

// ✅ CORREÇÃO ADICIONADA: Função para normalizar booking para resposta de pagamento
const normalizeEventBookingForPaymentResponse = (booking: any) => {
  if (!booking) return null;
  
  // Converter de camelCase para snake_case
  return {
    id: booking.id,
    event_space_id: booking.eventSpaceId,
    hotel_id: booking.hotelId,
    organizer_name: booking.organizerName,
    organizer_email: booking.organizerEmail,
    event_title: booking.eventTitle,
    event_type: booking.eventType,
    start_date: booking.startDate,
    end_date: booking.endDate,
    expected_attendees: booking.expectedAttendees,
    total_price: booking.totalPrice || "0",
    base_price: booking.basePrice || "0",
    security_deposit: booking.securityDeposit || "0",
    deposit_paid: booking.depositPaid || "0",
    balance_due: booking.balanceDue || (booking.totalPrice || "0"), // ✅ Campo crítico
    status: booking.status || 'pending_approval',
    payment_status: booking.paymentStatus || 'pending',
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
};

// ==================== VALIDATION SCHEMAS (SISTEMA DE DIÁRIAS) ====================
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
  // ✅ CORREÇÃO: Schema para equipment que aceita string ou objeto
  equipment: z.union([
    z.record(z.any()),
    z.string().transform((str, ctx) => {
      try {
        return processEquipmentField(str);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "equipment deve ser um objeto JSON válido",
        });
        return z.NEVER;
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
}))
.superRefine((data, ctx) => {
  if (data.capacity_max <= data.capacity_min) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Capacidade máxima deve ser maior que capacidade mínima",
      path: ["capacity_max"],
    });
  }
});

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
  // ✅ CORREÇÃO: Schema para equipment que aceita string ou objeto
  equipment: z.union([
    z.record(z.any()),
    z.string().transform((str, ctx) => {
      try {
        return processEquipmentField(str);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "equipment deve ser um objeto JSON válido",
        });
        return z.NEVER;
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
}))
.superRefine((data, ctx) => {
  if (data.capacity_min !== undefined && data.capacity_max !== undefined) {
    if (data.capacity_max <= data.capacity_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Capacidade máxima deve ser maior que capacidade mínima",
        path: ["capacity_max"],
      });
    }
  }
});

// ✅ CORRIGIDO: SCHEMA DE BOOKING REMOVENDO status e paymentStatus - controlados pelo backend
const createEventBookingSchema = z.object({
  organizer_name: z.string().min(2),
  organizer_email: z.string().email(),
  organizer_phone: z.string().optional(),
  event_title: z.string().min(3),
  event_description: z.string().optional(),
  event_type: z.string().min(2),
  start_date: z.string().date(),      // YYYY-MM-DD (sistema de diárias)
  end_date: z.string().date(),        // YYYY-MM-DD (sistema de diárias)
  expected_attendees: z.number().int().positive(),
  special_requests: z.string().optional(),
  additional_services: z.record(z.any()).optional().default({}),
  catering_required: z.boolean().optional().default(false),
  user_id: z.string().optional(), // ✅ CORREÇÃO: Não precisa ser UUID, pode ser Firebase UID (string)
  // ✅ REMOVIDO: status e payment_status - sempre controlados pelo backend
});

const manualEventPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_method: z.enum(["mpesa", "bank_transfer", "card", "cash", "mobile_money"]),
  reference: z.string().min(1, "Referência é obrigatória"),
  notes: z.string().optional(),
  payment_type: z.string().optional().default("manual_event_payment"),
});

// ✅ CORRIGIDO: Schema simplificado sem campos multi-day (se não usar)
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

// ✅ NOVO: Schema para busca por proximidade
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

// ==================== MIDDLEWARES ====================

const requireHotelOwnerForHotelIdParam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotelId = req.params.hotelId;
    if (!hotelId) return res.status(400).json({ success: false, message: 'hotelId obrigatório' });

    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });

    // Permitir admin também
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
    
    // Permitir admin também
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
    
    // Permitir admin também
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
    if (!booking) return res.status(404).json({ success: false, message: 'Reserva não encontrado' });
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
    
    // Permitir admin também
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

// ======================= NOVA ROTA: BUSCA POR PROXIMIDADE =======================
/**
 * @route GET /spaces/search/nearby
 * @description Busca espaços de eventos por proximidade (similar aos hotéis)
 * @query lat, lng - Coordenadas do centro da busca
 * @query radius - Raio em km (default: 50)
 * @query startDate, endDate - Filtro por datas
 * @query capacity - Filtro por capacidade mínima
 * @query eventType - Filtro por tipo de evento
 * @query maxPricePerDay - Filtro por preço máximo
 * @query amenities - Filtro por amenities (separados por vírgula)
 * @query minRating - Filtro por rating mínimo (averageRating)
 * @query useExactLocations - Priorizar locations exatas (true/false)
 * @access Public
 */
router.get('/spaces/search/nearby', async (req: Request, res: Response) => {
  try {
    // Validar parâmetros
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
    
    // Buscar espaços por proximidade
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
    
    // Formatar resposta
    const formattedSpaces = spaces.map(item => {
      const result: any = {
        space: adaptToSnakeCase(item.space),
        hotel: adaptToSnakeCase(item.hotel),
      };
      
      // Adicionar campos de distância se existirem
      if ('distance_km' in item) {
        result.distance_km = item.distance_km;
      }
      if ('distance_from_exact_location_km' in item) {
        result.distance_from_exact_location_km = item.distance_from_exact_location_km;
      }
      if ('distance_from_hotel_km' in item) {
        result.distance_from_hotel_km = item.distance_from_hotel_km;
      }
      if ('location' in item && item.location) {
        result.location = adaptToSnakeCase(item.location);
      }
      if ('priority' in item) {
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

// ======================= DEBUG =======================
router.post('/spaces/debug', async (req: Request, res: Response) => {
  try {
    console.log('=== DEBUGGING ESPAÇOS ===');
    console.log('Headers:', req.headers);
    console.log('User:', (req as any).user);
    console.log('Body:', req.body);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    console.log('Token (primeiros 50):', token.substring(0, 50) + '...');
    res.json({ success: true, message: 'Debug OK' });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, message: 'Debug failed' });
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

// ==================== 🔧 NOVOS ENDPOINTS CORRIGIDOS ====================

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

// ==================== ATUALIZAÇÃO DE DIA ÚNICO ====================
router.post('/spaces/:id/availability/day', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const validated = eventAvailabilitySchema.parse(req.body);
    
    const updateData = {
      date: validated.date,
      isAvailable: validated.is_available,
      stopSell: validated.stop_sell,
      priceOverride: validated.price_override ? toNumber(validated.price_override) : undefined,
    };

    // Usar bulk update com um único item
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

// ==================== RESERVAS COM FILTROS ====================
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
    // ✅ ATUALIZADO: Adicionar parâmetros de proximidade
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
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined, // ✅ averageRating
      // ✅ NOVO: Parâmetros de proximidade
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lng: req.query.lng ? Number(req.query.lng) : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : 50,
      sortBy: (req.query.sortBy as 'distance' | 'price' | 'capacity' | 'rating') || 'distance',
      useExactLocations: req.query.useExactLocations === 'true' || req.query.useExactLocations === '1'
    };
    
    const result = await searchEventSpaces(filters);
    
    // ✅ CORREÇÃO: Response melhorado com mais campos úteis
    const formattedResult = result.map(item => {
      const baseResult = {
        space: adaptToSnakeCase(item.space),
        hotel: adaptToSnakeCase(item.hotel),
        base_price_per_day: item.space.basePricePerDay || "0",
        weekend_surcharge_percent: item.space.weekendSurchargePercent || 0,
        offers_catering: item.space.offersCatering || false,
        max_capacity: item.space.capacityMax,
        allowed_event_types: item.space.allowedEventTypes || [],
      };
      
      // Adicionar campos de distância se existirem (busca por proximidade)
      if ('distance_km' in item) {
        (baseResult as any).distance_km = item.distance_km;
      }
      if ('distance_from_exact_location_km' in item) {
        (baseResult as any).distance_from_exact_location_km = item.distance_from_exact_location_km;
      }
      if ('distance_from_hotel_km' in item) {
        (baseResult as any).distance_from_hotel_km = item.distance_from_hotel_km;
      }
      
      return baseResult;
    });
    
    // ✅ ATUALIZADO: Incluir informações da busca no response
    const response: any = {
      success: true, 
      data: formattedResult, 
      count: formattedResult.length,
      search_type: filters.lat !== undefined && filters.lng !== undefined ? 'nearby' : 'traditional'
    };
    
    // Se for busca por proximidade, incluir dados do centro
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

router.get('/spaces/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const featuredSpaces = await getFeaturedEventSpaces(limit);
    const formattedSpaces = featuredSpaces.map(item => ({
      space: adaptToSnakeCase(item.space),
      hotel: adaptToSnakeCase(item.hotel),
    }));
    res.json({
      success: true,
      data: formattedSpaces,
      count: formattedSpaces.length,
    });
  } catch (error) {
    console.error('Erro ao buscar espaços em destaque:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar espaços em destaque' });
  }
});

router.get('/spaces/:id', async (req: Request, res: Response) => {
  try {
    await incrementEventSpaceViewCount(req.params.id);
    const spaceDetails = await getEventSpaceDetails(req.params.id);
    
    if (!spaceDetails) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado' });
    }
    
    const cateringUrls = await getCateringMenuUrls(req.params.id);
    const cateringDiscount = await getCateringDiscountPercent(req.params.id);
    
    const response = {
      space: adaptToSnakeCase(spaceDetails.space),
      hotel: adaptToSnakeCase(spaceDetails.hotel),
      base_price_per_day: spaceDetails.space.basePricePerDay || "0",
      weekend_surcharge_percent: spaceDetails.space.weekendSurchargePercent || 0,
      available_for_immediate_booking: await isEventSpaceAvailableForImmediateBooking(req.params.id),
      alcohol_allowed: await isAlcoholAllowed(req.params.id),
      max_capacity: await getSpaceMaxCapacity(req.params.id),
      offers_catering: await offersCatering(req.params.id),
      catering_discount_percent: cateringDiscount,
      catering_menu_urls: cateringUrls,
      security_deposit: spaceDetails.space.securityDeposit || "0",
    };
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do espaço:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar espaço: ' + (error as Error).message 
    });
  }
});

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
    
    // Permitir admin também
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;
    if (hotel.host_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }
    
    // ✅ CORREÇÃO: Processar equipment antes da validação
    const processedData = {
      ...rawData,
      // Garantir que equipment seja objeto JSON válido
      equipment: processEquipmentField(rawData.equipment),
    };
    
    const validatedData = createEventSpaceSchema.parse({
      ...processedData,
      name: processedData.name || 'Espaço Sem Nome',
      capacity_min: Number(processedData.capacity_min) || 10,
      capacity_max: Number(processedData.capacity_max) || 50,
      base_price_per_day: processedData.base_price_per_day || '1000.00',
    });
    
    const createData: any = {
      hotelId: validatedData.hotel_id,
      name: validatedData.name,
      description: validatedData.description || null,
      capacityMin: validatedData.capacity_min,
      capacityMax: validatedData.capacity_max,
      basePricePerDay: validatedData.base_price_per_day,
      weekendSurchargePercent: validatedData.weekend_surcharge_percent,
      securityDeposit: validatedData.security_deposit || "0",
      offersCatering: validatedData.offers_catering,
      cateringDiscountPercent: validatedData.catering_discount_percent,
      cateringMenuUrls: validatedData.catering_menu_urls,
      mainImage: validatedData.main_image,
      termsAndRules: validatedData.terms_and_rules,
      allowedEventTypes: validatedData.allowed_event_types,
      prohibitedEventTypes: validatedData.prohibited_event_types,
      amenities: validatedData.amenities,
      equipment: validatedData.equipment, // ✅ Já processado e validado
      setupOptions: validatedData.setup_options,
      images: validatedData.images,
      isActive: validatedData.is_active !== false,
      isFeatured: validatedData.is_featured === true,
      areaSqm: validatedData.area_sqm || null,
      spaceType: validatedData.space_type || null,
      hasStage: validatedData.has_stage === true,
      naturalLight: validatedData.natural_light === true,
      loadingAccess: validatedData.loading_access === true,
      dressingRooms: validatedData.dressing_rooms || null,
      insuranceRequired: validatedData.insurance_required === true,
      alcoholAllowed: validatedData.alcohol_allowed === true,
      floorPlanImage: validatedData.floor_plan_image,
      virtualTourUrl: validatedData.virtual_tour_url,
      approvalRequired: validatedData.approval_required === true,
    };
    
    const newSpace = await createEventSpace(createData);
    
    res.status(201).json({
      success: true,
      message: 'Espaço criado com sucesso (sistema de diárias)',
      data: {
        id: newSpace.id,
        hotel_id: newSpace.hotelId,
        name: newSpace.name,
        description: newSpace.description,
        capacity_min: newSpace.capacityMin,
        capacity_max: newSpace.capacityMax,
        base_price_per_day: newSpace.basePricePerDay,
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

// ======================= ROTA DE RESERVA COM DATAS (DIÁRIAS) =======================
router.post('/spaces/:id/bookings', async (req: Request, res: Response) => {
  try {
    const space = await getEventSpaceById(req.params.id);
    if (!space || !space.isActive) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado ou inativo' });
    }

    const validated = createEventBookingSchema.parse(req.body);
    
    const startDate = validated.start_date;
    const endDate = validated.end_date;

    // Verifica disponibilidade (sistema de diárias)
    const availability = await checkEventSpaceAvailability(req.params.id, startDate, endDate);
    if (!availability.isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: availability.message || 'Espaço indisponível para este período' 
      });
    }

    // Conflitos
    const conflicts = await checkBookingConflicts(req.params.id, startDate, endDate);
    if (conflicts.hasConflict) {
      return res.status(409).json({ 
        success: false, 
        message: 'Conflito de período' 
      });
    }

    // Capacidade
    const capacityCheck = await checkEventSpaceCapacity(req.params.id, validated.expected_attendees);
    if (!capacityCheck.valid) {
      return res.status(400).json({ 
        success: false, 
        message: capacityCheck.message 
      });
    }

    // Preço (diárias)
    const totalPrice = await calculateEventPrice(
      req.params.id,
      startDate,
      endDate,
      validated.catering_required
    );

    const userId = (req as any).user?.id;

    const bookingData = {
      eventSpaceId: req.params.id,
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
      cateringRequired: validated.catering_required,
      userId: validated.user_id || userId,
      // ✅ REMOVIDO: status e paymentStatus - sempre controlados pelo service
    };

    // ✅ CORREÇÃO: O service sempre cria como pending_approval
    const booking = await createEventBooking(bookingData, userId);

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso (aguardando aprovação do hotel)', // ✅ Mensagem sempre pendente
      data: adaptToSnakeCase(booking),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }
    console.error('Erro ao criar reserva:', error);
    res.status(400).json({ 
      success: false, 
      message: (error as Error).message || 'Erro ao criar reserva' 
    });
  }
});

router.put('/spaces/:id', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    
    // ✅ CORREÇÃO: Processar equipment antes da validação
    const processedData = {
      ...rawData,
      equipment: processEquipmentField(rawData.equipment),
    };
    
    const validatedData = updateEventSpaceSchema.parse(processedData);
    const adaptedData = adaptToCamelCase(validatedData);
    const updateData: any = { ...adaptedData };
    
    if (rawData.base_price_per_day !== undefined) {
      updateData.basePricePerDay = rawData.base_price_per_day ? toDecimalString(rawData.base_price_per_day) : "0";
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
    
    // ✅ CORREÇÃO: Garantir que equipment seja processado
    if (rawData.equipment !== undefined) {
      updateData.equipment = processEquipmentField(rawData.equipment);
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
    
    // ✅ CORREÇÃO: Updates simplificados sem campos multi-day
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

// ======================= DETALHES DE RESERVAS =======================
router.get('/bookings/:bookingId', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const bookingDetails = await getEventBookingWithDetails(req.params.bookingId);
    if (!bookingDetails) {
      return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }

    const formattedDetails = {
      booking: adaptToSnakeCase(bookingDetails.booking),
      space: adaptToSnakeCase(bookingDetails.space),
      hotel: adaptToSnakeCase(bookingDetails.hotel),
    };

    res.json({
      success: true,
      data: formattedDetails,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reserva: ' + (error as Error).message
    });
  }
});

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

// ROTA DE CONFIRMAÇÃO DE BOOKING
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

// ROTA DE REJEIÇÃO DE BOOKING
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

// ROTA DE CANCELAMENTO
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

// ROTA DE UPDATE DE BOOKING
router.put('/bookings/:bookingId',
  verifyFirebaseToken,
  requireEventBookingAccess,
  async (req: Request, res: Response) => {
    try {
      const bookingData = adaptToCamelCase(req.body);
      const userId = (req as any).user?.id;

      // Validação de status
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

// ✅ CORREÇÃO CRÍTICA: Endpoint de pagamentos atualizado (agora com Firebase UIDs)
router.post('/bookings/:bookingId/payments', verifyFirebaseToken, requireEventBookingAccess, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id; // ✅ Firebase UID direto
    
    const validated = manualEventPaymentSchema.parse(req.body);
    
    // Verificar se a reserva existe
    const booking = await getEventBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reserva não encontrada' });
    }
    
    // ✅ CORREÇÃO: Passa o userId diretamente (Firebase UID)
    const result = await eventPaymentService.registerManualEventPayment(bookingId, {
      amount: validated.amount,
      paymentMethod: validated.payment_method,
      referenceNumber: validated.reference,
      paymentType: validated.payment_type,
      registeredBy: userId, // ✅ Firebase UID direto
      notes: validated.notes,
    });
    
    // ✅ CORREÇÃO: Normalizar booking para resposta
    const normalizedBooking = normalizeEventBookingForPaymentResponse(result.booking);
    
    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: {
        paymentId: result.paymentId,
        booking: normalizedBooking, // ✅ Booking normalizado e atualizado
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
    const userId = (req as any).user?.id; // ✅ Firebase UID direto
    
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
    const receipt = await eventPaymentService.generateEventReceipt(lastPayment.id, userId); // ✅ Firebase UID direto
    
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

// ✅ CORREÇÃO: ROTA DE CONFIRMAÇÃO DE PAGAMENTO (com Firebase UIDs)
router.post('/bookings/:bookingId/payments/confirm',
  verifyFirebaseToken,
  requireHotelOwnerForBooking,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.body;
      const userId = (req as any).user?.id; // ✅ Firebase UID direto
      
      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'paymentId é obrigatório'
        });
      }
      
      // ✅ CORREÇÃO: Passa o userId diretamente (Firebase UID)
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
    
    const formattedEvents = upcomingEvents.map(item => ({
      booking: adaptToSnakeCase(item.booking),
      space: adaptToSnakeCase(item.space),
    }));
    
    const spacesOverview = await getEventSpacesOverview(hotelId);
    const formattedSpaces = spacesOverview.map(item => ({
      space: adaptToSnakeCase(item.space),
      total_bookings: item.totalBookings,
      revenue: item.revenue,
    }));
    
    const pendingApproval = await getPendingApprovalBookings(hotelId);
    const formattedPending = pendingApproval.map(booking => adaptToSnakeCase(booking));
    
    // Obter detalhes do hotel para exibir no dashboard
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
    
    const formattedSummary = summary.map(item => ({
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
    
    const formattedStats = spacesWithStats.map(item => ({
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
      message: 'Event Spaces module is healthy (sistema de diárias ativo)',
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
      version: '1.2.0', // ✅ Atualizado para versão 1.2.0 com busca por proximidade
      environment: process.env.NODE_ENV || 'development',
      pricing_model: 'daily_rate',
      features: {
        nearby_search: true, // ✅ Nova feature
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