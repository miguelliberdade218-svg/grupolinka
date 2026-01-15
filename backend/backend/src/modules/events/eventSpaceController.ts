// src/modules/events/eventController.ts - VERSÃO FINAL COMPLETA CORRIGIDA (13/01/2026)

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
  getEventSpaceDetails,
  getEventSpacesByHotel,
  getEventDashboardSummary,
  getEventStatsForHotel,
  getUpcomingEventsForHotel,
  getEventSpacesOverview,
  checkEventSpaceAvailability,
  getMultiDateAvailability,
  checkBookingConflicts,
  calculateEventBasePrice,
  getFutureEventsBySpace,
  updateEventAvailabilityAfterBooking,
  releaseEventAvailabilityAfterCancellation,
  getEventsByOrganizer,
  incrementEventSpaceViewCount,
  isEventSpaceAvailableForImmediateBooking,
  getFeaturedEventSpaces,
  getEventBookingSecurityDeposit,
  isAlcoholAllowed,
  getSpaceMaxCapacity,
  includesCatering,
  includesFurniture
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
  upsertEventAvailability,
  getMultiSpaceAvailabilityForDate,
  updateEventSlots,
  addTimeSlot,
  removeTimeSlot,
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
  generateEventSpaceSlug
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

// CORREÇÃO: Importar o eventPaymentService corretamente
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
  basePriceHourly?: string | null;
  pricePerHour?: string | null;
  pricePerDay?: string | null;
  basePriceHalfDay?: string | null;
  basePriceFullDay?: string | null;
  pricePerEvent?: string | null;
  weekendSurchargePercent?: number;
  areaSqm?: number | null;
  spaceType?: string | null;
  ceilingHeight?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string | null;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  securityDeposit?: string | null;
  insuranceRequired?: boolean;
  maxDurationHours?: number | null;
  minBookingHours?: number | null;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean;
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  approvalRequired?: boolean;
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  amenities?: string[];
  eventTypes?: string[];
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

const extractPricingFields = (space: any) => {
  return {
    base_price_hourly: space.basePriceHourly,
    base_price_half_day: space.basePriceHalfDay,
    base_price_full_day: space.basePriceFullDay,
    price_per_hour: space.pricePerHour,
    price_per_day: space.pricePerDay,
    price_per_event: space.pricePerEvent,
    security_deposit: space.securityDeposit,
  };
};

// ==================== VALIDATION SCHEMAS ====================
const createEventSpaceSchema = z.object({
  hotel_id: z.string().uuid({ message: "ID do hotel inválido" }),
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().optional().nullable(),
  capacity_min: z.union([z.number().int().positive(), z.string()]),
  capacity_max: z.union([z.number().int().positive(), z.string()]),
  base_price_hourly: z.union([z.number(), z.string()]).optional().nullable(),
  base_price_half_day: z.union([z.number(), z.string()]).optional().nullable(),
  base_price_full_day: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_hour: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_day: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_event: z.union([z.number(), z.string()]).optional().nullable(),
  weekend_surcharge_percent: z.number().int().min(0).max(100).optional().default(0),
  area_sqm: z.union([z.number(), z.string()]).optional().nullable(),
  space_type: z.string().optional().nullable(),
  ceiling_height: z.union([z.number(), z.string()]).optional().nullable(),
  natural_light: z.boolean().optional().default(false),
  has_stage: z.boolean().optional().default(false),
  stage_dimensions: z.string().optional().nullable(),
  loading_access: z.boolean().optional().default(false),
  dressing_rooms: z.union([z.number(), z.string()]).optional().nullable(),
  security_deposit: z.union([z.number(), z.string()]).optional().nullable(),
  insurance_required: z.boolean().optional().default(false),
  max_duration_hours: z.union([z.number(), z.string()]).optional().nullable(),
  min_booking_hours: z.union([z.number(), z.string()]).optional().nullable(),
  noise_restriction: z.string().optional().nullable(),
  alcohol_allowed: z.boolean().optional().default(false),
  floor_plan_image: z.string().url().optional().nullable(),
  virtual_tour_url: z.string().url().optional().nullable(),
  approval_required: z.boolean().optional().default(false),
  includes_catering: z.boolean().optional().default(false),
  includes_furniture: z.boolean().optional().default(true),
  includes_cleaning: z.boolean().optional().default(false),
  includes_security: z.boolean().optional().default(false),
  amenities: z.array(z.string()).optional().default([]),
  event_types: z.array(z.string()).optional().default([]),
  allowed_event_types: z.array(z.string()).optional().default([]),
  prohibited_event_types: z.array(z.string()).optional().default([]),
  equipment: z.record(z.any()).optional().default({}),
  setup_options: z.array(z.string()).optional().default([]),
  images: z.array(z.string().url()).optional().default([]),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
})
.transform((data) => ({
  ...data,
  capacity_min: Number(data.capacity_min),
  capacity_max: Number(data.capacity_max),
  base_price_hourly: data.base_price_hourly ? data.base_price_hourly.toString() : null,
  base_price_half_day: data.base_price_half_day ? data.base_price_half_day.toString() : null,
  base_price_full_day: data.base_price_full_day ? data.base_price_full_day.toString() : null,
  price_per_hour: data.price_per_hour ? data.price_per_hour.toString() : null,
  price_per_day: data.price_per_day ? data.price_per_day.toString() : null,
  price_per_event: data.price_per_event ? data.price_per_event.toString() : null,
  area_sqm: data.area_sqm ? Number(data.area_sqm) : null,
  ceiling_height: data.ceiling_height ? data.ceiling_height.toString() : null,
  dressing_rooms: data.dressing_rooms ? Number(data.dressing_rooms) : null,
  security_deposit: data.security_deposit ? data.security_deposit.toString() : null,
  max_duration_hours: data.max_duration_hours ? Number(data.max_duration_hours) : null,
  min_booking_hours: data.min_booking_hours ? Number(data.min_booking_hours) : null,
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
  base_price_hourly: z.union([z.number(), z.string()]).optional().nullable(),
  base_price_half_day: z.union([z.number(), z.string()]).optional().nullable(),
  base_price_full_day: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_hour: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_day: z.union([z.number(), z.string()]).optional().nullable(),
  price_per_event: z.union([z.number(), z.string()]).optional().nullable(),
  weekend_surcharge_percent: z.number().int().min(0).max(100).optional(),
  area_sqm: z.union([z.number(), z.string()]).optional().nullable(),
  space_type: z.string().optional().nullable(),
  ceiling_height: z.union([z.number(), z.string()]).optional().nullable(),
  natural_light: z.boolean().optional(),
  has_stage: z.boolean().optional(),
  stage_dimensions: z.string().optional().nullable(),
  loading_access: z.boolean().optional(),
  dressing_rooms: z.union([z.number(), z.string()]).optional().nullable(),
  security_deposit: z.union([z.number(), z.string()]).optional().nullable(),
  insurance_required: z.boolean().optional(),
  max_duration_hours: z.union([z.number(), z.string()]).optional().nullable(),
  min_booking_hours: z.union([z.number(), z.string()]).optional().nullable(),
  noise_restriction: z.string().optional().nullable(),
  alcohol_allowed: z.boolean().optional(),
  floor_plan_image: z.string().url().optional().nullable(),
  virtual_tour_url: z.string().url().optional().nullable(),
  approval_required: z.boolean().optional(),
  includes_catering: z.boolean().optional(),
  includes_furniture: z.boolean().optional(),
  includes_cleaning: z.boolean().optional(),
  includes_security: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  event_types: z.array(z.string()).optional(),
  allowed_event_types: z.array(z.string()).optional(),
  prohibited_event_types: z.array(z.string()).optional(),
  equipment: z.record(z.any()).optional(),
  setup_options: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})
.transform((data) => ({
  ...data,
  capacity_min: data.capacity_min !== undefined ? Number(data.capacity_min) : undefined,
  capacity_max: data.capacity_max !== undefined ? Number(data.capacity_max) : undefined,
  base_price_hourly: data.base_price_hourly !== undefined
    ? (data.base_price_hourly ? data.base_price_hourly.toString() : null)
    : undefined,
  base_price_half_day: data.base_price_half_day !== undefined
    ? (data.base_price_half_day ? data.base_price_half_day.toString() : null)
    : undefined,
  base_price_full_day: data.base_price_full_day !== undefined
    ? (data.base_price_full_day ? data.base_price_full_day.toString() : null)
    : undefined,
  price_per_hour: data.price_per_hour !== undefined
    ? (data.price_per_hour ? data.price_per_hour.toString() : null)
    : undefined,
  price_per_day: data.price_per_day !== undefined
    ? (data.price_per_day ? data.price_per_day.toString() : null)
    : undefined,
  price_per_event: data.price_per_event !== undefined
    ? (data.price_per_event ? data.price_per_event.toString() : null)
    : undefined,
  area_sqm: data.area_sqm !== undefined ? Number(data.area_sqm) : undefined,
  ceiling_height: data.ceiling_height !== undefined
    ? (data.ceiling_height ? data.ceiling_height.toString() : null)
    : undefined,
  dressing_rooms: data.dressing_rooms !== undefined ? Number(data.dressing_rooms) : undefined,
  security_deposit: data.security_deposit !== undefined
    ? (data.security_deposit ? data.security_deposit.toString() : null)
    : undefined,
  max_duration_hours: data.max_duration_hours !== undefined ? Number(data.max_duration_hours) : undefined,
  min_booking_hours: data.min_booking_hours !== undefined ? Number(data.min_booking_hours) : undefined,
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

const createEventBookingSchema = z.object({
  organizer_name: z.string().min(2),
  organizer_email: z.string().email(),
  organizer_phone: z.string().optional(),
  event_title: z.string().min(3),
  event_description: z.string().optional(),
  event_type: z.string().min(2),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  expected_attendees: z.number().int().positive(),
  special_requests: z.string().optional(),
  additional_services: z.record(z.any()).optional().default({}),
  user_id: z.string().uuid().optional(),
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
  min_booking_hours: z.number().int().positive().optional(),
  slots: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    bookingId: z.string().optional(),
    status: z.string().optional(),
  })).optional().default([]),
});

const bulkAvailabilitySchema = z.array(eventAvailabilitySchema);

const checkCapacitySchema = z.object({
  expected_attendees: z.number().int().positive(),
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
    if (hotel.host_id !== userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
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
    const [hotel] = await db.select({ hostId: hotels.host_id }).from(hotels).where(eq(hotels.id, space.hotelId));
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    if (hotel.hostId !== userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
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
    if (!hotel || hotel.host_id !== userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
    next();
  } catch (error) {
    console.error('Erro no middleware isEventSpaceOwnerOrPublic:', error);
    res.status(500).json({ success: false, message: 'Erro ao verificar acesso' });
  }
};

// ==================== ROUTER PRINCIPAL ====================
const router = Router();
const eventSpaceReviewsService = new EventSpaceReviewsService();

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
    if (new Date(booking.endDatetime) > new Date()) {
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

// ======================= ESPAÇOS =======================
router.get('/spaces', async (req: Request, res: Response) => {
  try {
    const filters = {
      query: req.query.query as string | undefined,
      locality: req.query.locality as string | undefined,
      province: req.query.province as string | undefined,
      eventDate: req.query.eventDate as string | undefined,
      capacity: req.query.capacity ? Number(req.query.capacity) : undefined,
      eventType: req.query.eventType as string | undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      amenities: req.query.amenities ? (req.query.amenities as string).split(',') : undefined,
      hotelId: req.query.hotelId as string | undefined,
    };
    const result = await searchEventSpaces(filters);
    const formattedResult = result.map(item => ({
      space: adaptToSnakeCase(item.space),
      hotel: adaptToSnakeCase(item.hotel),
      base_price: item.basePrice,
      price_half_day: item.priceHalfDay,
      price_full_day: item.priceFullDay,
      price_per_hour: item.pricePerHour,
    }));
    res.json({ success: true, data: formattedResult, count: formattedResult.length });
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
    const response = {
      space: adaptToSnakeCase(spaceDetails.space),
      hotel: adaptToSnakeCase(spaceDetails.hotel),
      pricing: extractPricingFields(spaceDetails.space),
      available_for_immediate_booking: await isEventSpaceAvailableForImmediateBooking(req.params.id),
      alcohol_allowed: await isAlcoholAllowed(req.params.id),
      max_capacity: await getSpaceMaxCapacity(req.params.id),
      includes_catering: await includesCatering(req.params.id),
      includes_furniture: await includesFurniture(req.params.id),
    };
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do espaço:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar espaço: ' + (error as Error).message });
  }
});

router.post('/spaces', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    if (!rawData.hotel_id) return res.status(400).json({ success: false, message: 'hotel_id obrigatório' });
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, rawData.hotel_id)).limit(1);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });
    if (hotel.host_id !== userId) return res.status(403).json({ success: false, message: 'Acesso negado' });
    const validatedData = createEventSpaceSchema.parse({
      ...rawData,
      name: rawData.name || 'Espaço Sem Nome',
      capacity_min: Number(rawData.capacity_min) || 10,
      capacity_max: Number(rawData.capacity_max) || 50,
      base_price_hourly: rawData.base_price_hourly || '100.00',
      price_per_hour: rawData.price_per_hour || '90.00',
    });
    const createData: any = {
      hotelId: validatedData.hotel_id,
      name: validatedData.name,
      description: validatedData.description || null,
      capacityMin: validatedData.capacity_min,
      capacityMax: validatedData.capacity_max,
      basePriceHourly: validatedData.base_price_hourly,
      basePriceHalfDay: validatedData.base_price_half_day || null,
      basePriceFullDay: validatedData.base_price_full_day || null,
      pricePerHour: validatedData.price_per_hour,
      pricePerDay: validatedData.price_per_day || null,
      pricePerEvent: validatedData.price_per_event || null,
      weekendSurchargePercent: validatedData.weekend_surcharge_percent,
      isActive: validatedData.is_active !== false,
      isFeatured: validatedData.is_featured === true,
      areaSqm: validatedData.area_sqm || null,
      spaceType: validatedData.space_type || 'conference',
      naturalLight: validatedData.natural_light === true,
      hasStage: validatedData.has_stage === true,
      loadingAccess: validatedData.loading_access === true,
      securityDeposit: validatedData.security_deposit || null,
      alcoholAllowed: validatedData.alcohol_allowed === true,
      approvalRequired: validatedData.approval_required === true,
      includesCatering: validatedData.includes_catering === true,
      includesFurniture: validatedData.includes_furniture === true,
      includesCleaning: validatedData.includes_cleaning === true,
      includesSecurity: validatedData.includes_security === true,
      amenities: validatedData.amenities || [],
      eventTypes: validatedData.event_types || [],
      images: validatedData.images || [],
    };
    const newSpace = await createEventSpace(createData);
    res.status(201).json({
      success: true,
      message: 'Espaço criado com sucesso (disponível por padrão para todas as datas futuras)',
      data: {
        id: newSpace.id,
        hotel_id: newSpace.hotelId,
        name: newSpace.name,
        description: newSpace.description,
        capacity_min: newSpace.capacityMin,
        capacity_max: newSpace.capacityMax,
        base_price_hourly: newSpace.basePriceHourly,
        price_per_hour: newSpace.pricePerHour,
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

// ======================= ROTA DE RESERVA COM DISPONIBILIDADE IMPLÍCITA =======================
router.post('/spaces/:id/bookings', async (req: Request, res: Response) => {
  try {
    const space = await getEventSpaceById(req.params.id);
    if (!space || !space.isActive) {
      return res.status(404).json({ success: false, message: 'Espaço não encontrado ou inativo' });
    }

    const validated = createEventBookingSchema.parse(req.body);
    const startDatetime = new Date(validated.start_datetime);
    const endDatetime = new Date(validated.end_datetime);
    const date = startDatetime.toISOString().split('T')[0];
    const startTime = startDatetime.toTimeString().slice(0, 5);
    const endTime = endDatetime.toTimeString().slice(0, 5);

    // IMPORTANTE: isEventSpaceAvailable agora retorna { available: true } quando não há registo
    const availability = await isEventSpaceAvailable(
      req.params.id,
      date,
      startTime,
      endTime
    );

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: `Espaço indisponível para esta data/horário: ${availability.message || 'Motivo desconhecido'}`
      });
    }

    const conflicts = await checkBookingConflicts(
      req.params.id,
      startDatetime,
      endDatetime
    );
    if (conflicts.hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Conflito de horário com reserva existente',
        conflicting_bookings: conflicts.conflictingBookings
      });
    }

    const capacityCheck = await checkEventSpaceCapacity(
      req.params.id,
      validated.expected_attendees
    );
    if (!capacityCheck.valid) {
      return res.status(400).json({ success: false, message: capacityCheck.message });
    }

    const durationHours = (endDatetime.getTime() - startDatetime.getTime()) / (1000 * 60 * 60);
    const totalPrice = await calculateEventPrice(req.params.id, date, durationHours);

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
      startDatetime: startDatetime.toISOString(),
      endDatetime: endDatetime.toISOString(),
      expectedAttendees: validated.expected_attendees,
      specialRequests: validated.special_requests || undefined,
      additionalServices: validated.additional_services || {},
      userId: validated.user_id || userId,
    };

    const booking = await createEventBooking(bookingData, userId);

    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
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
    res.status(400).json({ success: false, message: (error as Error).message || 'Erro ao criar reserva' });
  }
});

router.put('/spaces/:id', verifyFirebaseToken, requireHotelOwnerForSpace, async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    const validatedData = updateEventSpaceSchema.parse(rawData);
    const adaptedData = adaptToCamelCase(validatedData);
    const updateData: any = { ...adaptedData };
    
    if (rawData.base_price_hourly !== undefined) {
      updateData.basePriceHourly = rawData.base_price_hourly ? toDecimalString(rawData.base_price_hourly) : null;
    }
    if (rawData.base_price_half_day !== undefined) {
      updateData.basePriceHalfDay = rawData.base_price_half_day ? toDecimalString(rawData.base_price_half_day) : null;
    }
    if (rawData.base_price_full_day !== undefined) {
      updateData.basePriceFullDay = rawData.base_price_full_day ? toDecimalString(rawData.base_price_full_day) : null;
    }
    if (rawData.price_per_hour !== undefined) {
      updateData.pricePerHour = rawData.price_per_hour ? toDecimalString(rawData.price_per_hour) : null;
    }
    if (rawData.price_per_day !== undefined) {
      updateData.pricePerDay = rawData.price_per_day ? toDecimalString(rawData.price_per_day) : null;
    }
    if (rawData.price_per_event !== undefined) {
      updateData.pricePerEvent = rawData.price_per_event ? toDecimalString(rawData.price_per_event) : null;
    }
    if (rawData.security_deposit !== undefined) {
      updateData.securityDeposit = rawData.security_deposit ? toDecimalString(rawData.security_deposit) : null;
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
    if (rawData.ceiling_height !== undefined) {
      updateData.ceilingHeight = toDecimalString(rawData.ceiling_height);
    }
    if (rawData.dressing_rooms !== undefined) {
      updateData.dressingRooms = Number(rawData.dressing_rooms);
    }
    if (rawData.max_duration_hours !== undefined) {
      updateData.maxDurationHours = Number(rawData.max_duration_hours);
    }
    if (rawData.min_booking_hours !== undefined) {
      updateData.minBookingHours = Number(rawData.min_booking_hours);
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
    const { date, startTime, endTime } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Data é obrigatória'
      });
    }
    
    const result = await isEventSpaceAvailable(
      req.params.id,
      date,
      startTime,
      endTime
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
      minBookingHours: av.min_booking_hours,
      slots: av.slots
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
        sql`${eventBookings.startDatetime} >= ${startDateObj} AND ${eventBookings.endDatetime} <= ${endDateObj}`
      );
    }
    
    const query = db
      .select()
      .from(eventBookings)
      .where(and(...conditions))
      .orderBy(desc(eventBookings.startDatetime));
    
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
// ROTA PARA DETALHES DA RESERVA (GET /bookings/:bookingId)
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

// ROTA DE UPDATE (COM CORREÇÃO APLICADA)
router.put('/bookings/:bookingId',
  verifyFirebaseToken,
  requireEventBookingAccess,
  async (req: Request, res: Response) => {
    try {
      const bookingData = adaptToCamelCase(req.body);
      const userId = (req as any).user?.id;

      // Validação e conversão segura de datas
      if (bookingData.startDatetime) {
        const startDate = new Date(bookingData.startDatetime);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Data de início inválida (formato esperado: ISO 8601)'
          });
        }
        bookingData.startDatetime = startDate;
      }

      if (bookingData.endDatetime) {
        const endDate = new Date(bookingData.endDatetime);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Data de fim inválida (formato esperado: ISO 8601)'
          });
        }
        bookingData.endDatetime = endDate;
      }
      
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
      if (bookingData.equipmentFees !== undefined) {
        bookingData.equipmentFees = bookingData.equipmentFees ? toDecimalString(bookingData.equipmentFees) : undefined;
      }
      if (bookingData.serviceFees !== undefined) {
        bookingData.serviceFees = bookingData.serviceFees ? toDecimalString(bookingData.serviceFees) : undefined;
      }
      if (bookingData.weekendSurcharge !== undefined) {
        bookingData.weekendSurcharge = bookingData.weekendSurcharge ? toDecimalString(bookingData.weekendSurcharge) : undefined;
      }
      if (bookingData.securityDeposit !== undefined) {
        bookingData.securityDeposit = bookingData.securityDeposit ? toDecimalString(bookingData.securityDeposit) : undefined;
      }
      if (bookingData.depositPaid !== undefined) {
        bookingData.depositPaid = bookingData.depositPaid ? toDecimalString(bookingData.depositPaid) : undefined;
      }
      if (bookingData.balanceDue !== undefined) {
        bookingData.balanceDue = bookingData.balanceDue ? toDecimalString(bookingData.balanceDue) : undefined;
      }
      if (bookingData.durationHours !== undefined) {
        bookingData.durationHours = toDecimalString(bookingData.durationHours);
      }
      if (bookingData.organizerPhone === null) bookingData.organizerPhone = undefined;
      if (bookingData.eventDescription === null) bookingData.eventDescription = undefined;
      if (bookingData.specialRequests === null) bookingData.specialRequests = undefined;
      if (bookingData.paymentReference === null) bookingData.paymentReference = undefined;
      if (bookingData.invoiceNumber === null) bookingData.invoiceNumber = undefined;
      if (bookingData.cancellationReason === null) bookingData.cancellationReason = undefined;
      if (bookingData.contractUrl === null) bookingData.contractUrl = undefined;
      
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
    
    const payment = await eventPaymentService.registerManualEventPayment(bookingId, {
      amount: validated.amount,
      paymentMethod: validated.payment_method,
      referenceNumber: validated.reference,
      paymentType: validated.payment_type,
      registeredBy: userId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Pagamento registrado com sucesso',
      data: payment,
    });
  } catch (error) {
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

// ROTA DE CONFIRMAÇÃO DE PAGAMENTO
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
router.get('/hotel/:hotelId/dashboard', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hotelId = req.params.hotelId;
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel || hotel.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: não é dono do hotel'
      });
    }
    
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

router.get('/hotel/:hotelId/financial-summary', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hotelId = req.params.hotelId;
    const { startDate, endDate } = req.query;
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel || hotel.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: não é dono do hotel'
      });
    }
    
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

router.get('/hotel/:hotelId/spaces/summary', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hotelId = req.params.hotelId;
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel || hotel.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: não é dono do hotel'
      });
    }
    
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

router.get('/hotel/:hotelId/bookings', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hotelId = req.params.hotelId;
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel || hotel.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: não é dono do hotel'
      });
    }
    
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

router.get('/hotel/:hotelId/spaces/stats', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const hotelId = req.params.hotelId;
    
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId)).limit(1);
    if (!hotel || hotel.host_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: não é dono do hotel'
      });
    }
    
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
        if (!hotel || hotel.host_id !== userId) {
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
      message: 'Event Spaces module is healthy (disponibilidade implícita ativa)',
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
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
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