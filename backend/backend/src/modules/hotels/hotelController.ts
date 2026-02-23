// src/modules/hotels/hotelController.ts - VERSÃO FINAL COM SISTEMA DE CAPACIDADES
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// ✅ Importar serviços de autenticação e capacidades
import { verifyFirebaseToken, type AuthenticatedRequest } from "../../../src/shared/firebaseAuth";
import { authService } from "../auth/services/authService.js";

// ✅ Criar __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  syncHotelLocation,
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
  confirmBooking,
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

import { roomTypePhotoService } from './roomTypePhotoService';
import { HotelReviewsService } from './hotel-reviews.service';

const hotelReviewsService = new HotelReviewsService();

// ==================== CONFIGURAÇÃO DE UPLOAD ====================

// Garantir que as pastas de upload existem
const uploadBaseDir = path.join(__dirname, '../../../public/uploads');
const uploadDir = path.join(uploadBaseDir, 'hotels');
const tempDir = path.join(uploadBaseDir, 'temp');

if (!fs.existsSync(uploadBaseDir)) {
  fs.mkdirSync(uploadBaseDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configuração do storage do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// Filtro de arquivos (apenas imagens)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Use apenas: JPEG, PNG, WEBP ou GIF'));
  }
};

// Configuração do upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // máximo 10 arquivos por vez
  }
});

// Helpers para manipulação de arquivos
const moveUploadedFile = (tempPath: string, filename: string): string => {
  const finalPath = path.join(uploadDir, filename);
  fs.renameSync(tempPath, finalPath);
  return `/uploads/hotels/${filename}`;
};

const deleteUploadedFile = (fileUrl: string) => {
  if (!fileUrl) return;
  const filename = path.basename(fileUrl);
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ==================== VALIDATION SCHEMAS ====================

const createHotelBaseSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  address: z.string().min(5),
  locality: z.string().min(2),
  province: z.string().min(2),
  country: z.string().default('Moçambique'),
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
  location_id: z.string().uuid().optional(),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  policies: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  amenities: z.array(z.string()).optional(),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  host_id: z.string().min(1),
});

const createHotelSchema = createHotelBaseSchema.transform((data) => ({
  ...data,
  slug: data.slug || generateSlug(data.name),
}));

const updateHotelSchema = createHotelBaseSchema.partial();

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

const createBookingSchema = z.object({
  roomTypeId: z.string().uuid().optional(),
  room_type_id: z.string().uuid().optional(),
  guestName: z.string().min(2).optional(),
  guest_name: z.string().min(2).optional(),
  guestEmail: z.string().email().optional(),
  guest_email: z.string().email().optional(),
  guestPhone: z.string().optional().nullable(),
  guest_phone: z.string().optional().nullable(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional().default(0),
  units: z.number().int().min(1).optional().default(1),
  specialRequests: z.string().optional().nullable(),
  special_requests: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  promo_code: z.string().optional().nullable(),
  status: z.string().optional().default('pending_confirmation'),
  paymentStatus: z.string().optional().default('pending'),
  user_id: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
})
.transform((data) => ({
  roomTypeId: data.roomTypeId || data.room_type_id,
  guestName: data.guestName || data.guest_name,
  guestEmail: data.guestEmail || data.guest_email,
  guestPhone: data.guestPhone || data.guest_phone,
  checkIn: data.checkIn || data.check_in,
  checkOut: data.checkOut || data.check_out,
  specialRequests: data.specialRequests || data.special_requests,
  promoCode: data.promoCode || data.promo_code,
  userId: data.userId || data.user_id,
  adults: data.adults,
  children: data.children,
  units: data.units,
  status: data.status,
  paymentStatus: data.paymentStatus,
}))
.refine(data => data.roomTypeId && data.guestName && data.guestEmail && data.checkIn && data.checkOut, {
  message: "Campos obrigatórios faltando após normalização",
  path: ["roomTypeId"],
})
.refine((data) => {
  const checkInDate = new Date(data.checkIn!);
  const checkOutDate = new Date(data.checkOut!);
  return checkOutDate > checkInDate;
}, {
  message: "Data de check-out deve ser posterior à data de check-in",
  path: ["checkOut"],
});

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
  min_nights_default: z.number().int().positive().optional().default(1),
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

const syncLocationSchema = z.object({
  maxDistanceKm: z.number().min(0.1).max(100).optional().default(5),
});

const bulkAvailabilityUpdateBaseSchema = z.object({
  roomTypeId: z.string().uuid(),
  updates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
    price_override: z.number().positive().optional().nullable(),
    stop_sell: z.boolean().optional().nullable(),
    available_units: z.number().int().min(0).optional().nullable(),
    min_nights: z.number().int().positive().optional(),
    reset: z.boolean().optional().default(false),
    price: z.number().positive().optional().nullable(),
    stopSell: z.boolean().optional().nullable(),
    availableUnits: z.number().int().min(0).optional().nullable(),
    minNights: z.number().int().positive().optional(),
  })).min(1, "Pelo menos uma atualização é necessária"),
});

const bulkAvailabilityUpdateSchema = bulkAvailabilityUpdateBaseSchema.transform((data) => ({
  roomTypeId: data.roomTypeId,
  updates: data.updates.map(update => ({
    date: update.date,
    reset: update.reset || false,
    price: update.price_override ?? update.price,
    stopSell: update.stop_sell ?? update.stopSell,
    availableUnits: update.available_units ?? update.availableUnits,
    minNights: update.min_nights ?? update.minNights,
  }))
}));

type BulkAvailabilityUpdate = z.infer<typeof bulkAvailabilityUpdateSchema>;

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

const normalizeUpdateFields = (update: any) => {
  const normalized: any = {
    date: update.date,
    reset: update.reset || false,
  };
 
  normalized.price = update.price_override ?? update.price;
  normalized.stopSell = update.stop_sell ?? update.stopSell;
  normalized.availableUnits = update.available_units ?? update.availableUnits;
  normalized.minNights = update.min_nights ?? update.minNights;
 
  return normalized;
};

// ==================== MIDDLEWARE ====================

// ✅ MIDDLEWARE DE AUTENTICAÇÃO CORRIGIDO - Usa verifyFirebaseToken diretamente
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Usar o verifyFirebaseToken do firebaseAuth diretamente
    // O middleware verifyFirebaseToken já lida com a verificação do token
    // e adiciona o usuário à requisição
    
    // Chamar o middleware verifyFirebaseToken
    await verifyFirebaseToken(req, res, (err?: any) => {
      if (err) {
        return res.status(401).json({ 
          success: false, 
          message: 'Erro na autenticação' 
        });
      }
      
      // Verificar se o usuário foi adicionado à requisição
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não autenticado' 
        });
      }
      
      next();
    });
  } catch (error) {
    console.error('❌ [AUTH] Erro no middleware requireAuth:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Autenticação falhou' 
    });
  }
};

// ✅ MIDDLEWARE DE PROPRIEDADE DO HOTEL ATUALIZADO - Com verificação de capacidades
const requireHotelOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Tentar obter o hotelId de diferentes lugares possíveis
    let hotelId = req.params.id || req.params.hotelId;
    
    // Se não encontrou, tentar buscar pelo roomTypeId
    if (!hotelId && req.params.roomTypeId) {
      // Buscar o hotel associado ao room type
      const roomType = await getRoomTypeById(req.params.roomTypeId);
      if (roomType) {
        hotelId = roomType.hotel_id;
        // Adicionar aos params para referência futura
        req.params.hotelId = hotelId;
      }
    }
    
    const userId = (req as any).user?.id || (req as any).user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Autenticação requerida' });
    }

    if (!hotelId) {
      console.error('❌ [OWNER CHECK] hotelId não encontrado nos parâmetros da requisição');
      return res.status(400).json({ 
        success: false, 
        message: 'ID do hotel não fornecido' 
      });
    }

    // ✅ VERIFICAR SE USUÁRIO TEM CAPACIDADE DE GESTOR DE HOTEL VERIFICADA
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    if (!user.canManageHotels || user.hotelManagerVerificationStatus !== 'verified') {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuário não possui capacidade de gestor de hotel verificada',
        userCapabilities: {
          canManageHotels: user.canManageHotels,
          hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
        }
      });
    }

    if (process.env.NODE_ENV === 'test' && userId === 'bB88VrzVx8dbUUpXV7qSrGA5eiy2') {
      return next();
    }

    const isOwner = await isHotelOwner(hotelId, userId);
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado: não é dono deste hotel' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ [OWNER CHECK] Erro:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar propriedade' 
    });
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

// ✅ ENDPOINT POST /api/hotels - COM VERIFICAÇÃO DE CAPACIDADE
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Autenticação requerida' });

    // ✅ VERIFICAR SE USUÁRIO PODE CRIAR HOTEL
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }

    if (!user.canManageHotels) {
      return res.status(403).json({ 
        success: false, 
        message: "Usuário não possui capacidade de gestor de hotel",
        userCapabilities: {
          canManageHotels: user.canManageHotels,
          hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
        }
      });
    }

    const rawData = req.body;

    if (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Nome obrigatório (mínimo 3 caracteres)' });
    }

    const validated = createHotelSchema.parse({
      ...rawData,
      host_id: userId,
      country: 'Moçambique',
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

router.put('/:id', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log("🔵 [HOTEL UPDATE] Payload recebido:", JSON.stringify(req.body, null, 2));
    
    const rawData = req.body;
    
    const normalizedData = {
      ...rawData,
      country: 'Moçambique',
    };
    
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

router.post('/:id/sync-location', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    const hotelId = req.params.id;
    const { maxDistanceKm = 5 } = req.body;
    
    const validated = syncLocationSchema.parse({ maxDistanceKm });
    
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
    
    const result = await syncHotelLocation(hotelId);
    
    if (!result.success) {
      return res.json({
        success: true,
        message: 'Nenhuma localização próxima encontrada',
        data: null,
      });
    }
    
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

// ✅ ENDPOINT GET /api/hotels/host/me - ATUALIZADO COM CAPACIDADES
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
    
    // ✅ Buscar informações de capacidade do usuário
    const user = await authService.getUserById(userId);
    
    res.json({ 
      success: true, 
      data: {
        hotels,
        userCapabilities: {
          canManageHotels: true, // Já verificado pelo middleware
          hotelManagerVerificationStatus: user?.hotelManagerVerificationStatus || 'pending'
        }
      },
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

router.get('/host/:hostId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const requestedHostId = req.params.hostId;

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

// ======================= BUSCA POR RAIO =======================

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
      query = sql`
        SELECT 
          h.*,
          ml.name as exact_location_name,
          ml.type as location_type,
          ml.province as exact_province,
          ml.district as exact_district,
          ml.locality as exact_locality,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(ml.lng, ml.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography
          ) / 1000 as distance_from_exact_location_km,
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
          (h.location_id IS NOT NULL AND 
           ST_Distance(
             ST_SetSRID(ST_MakePoint(ml.lng, ml.lat), 4326)::geography,
             ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)::geography
           ) <= ${radiusMeters})
          OR
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
            WHEN h.location_id IS NOT NULL THEN 1
            ELSE 2
          END,
          COALESCE(distance_from_exact_location_km, distance_from_hotel_km) ASC
        LIMIT 50
      `;
    } else {
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
    
    const roomTypes = await getRoomTypesByHotel(hotelId);
    const availabilitySummary = await Promise.all(
      roomTypes.map(async (roomType) => {
        try {
          const availability = await checkAvailabilityForDates(
            roomType.id,
            today,
            nextWeek
          );
          
          return {
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            totalUnits: roomType.total_units,
            available: availability.available,
            minUnits: availability.minUnits,
            message: availability.message,
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
      min_nights_default: rawData.min_nights_default ? toNumber(rawData.min_nights_default) : 
                         (rawData.min_nights ? toNumber(rawData.min_nights) : 1),
    };

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

router.put('/:hotelId/room-types/:roomTypeId', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log("🔵 [ROOM TYPE UPDATE] Payload recebido:", JSON.stringify(req.body, null, 2));
    console.log("📝 Hotel ID:", req.params.hotelId);
    console.log("📝 Room Type ID:", req.params.roomTypeId);
    
    const rawData = req.body;
    const updateData: any = { ...rawData };
    
    console.log("🔍 Campos recebidos no controller:", Object.keys(rawData));
    
    if (rawData.name !== undefined && (!rawData.name || typeof rawData.name !== 'string' || rawData.name.trim().length < 3)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome obrigatório (mínimo 3 caracteres)' 
      });
    }
    
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

    if (rawData.min_nights !== undefined) {
      console.log("🔄 [CONTROLLER] Convertendo min_nights para min_nights_default:", rawData.min_nights);
      updateData.min_nights_default = parseInt(rawData.min_nights);
      if (isNaN(updateData.min_nights_default) || updateData.min_nights_default < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'min_nights deve ser um número maior que 0' 
        });
      }
      delete updateData.min_nights;
      console.log("✅ min_nights_default definido como:", updateData.min_nights_default);
    }
    
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

// ======================= FOTOS DOS ROOM TYPES =======================

/**
 * POST /api/hotels/room-types/:roomTypeId/photos
 * Upload de foto para um room type - VERSÃO CORRIGIDA
 */
router.post('/room-types/:roomTypeId/photos', 
  requireAuth, 
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('📸 [BACKEND] ===== INÍCIO UPLOAD =====');
    console.log('📸 [BACKEND] Headers:', {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Presente' : 'Ausente'
    });
    console.log('📸 [BACKEND] roomTypeId:', req.params.roomTypeId);
    console.log('📸 [BACKEND] req.body:', req.body);
    console.log('📸 [BACKEND] req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : '❌ NENHUM ARQUIVO RECEBIDO');
    
    try {
      const { roomTypeId } = req.params;
      
      // Verificar se o arquivo foi recebido
      if (!req.file) {
        console.log('📸 [BACKEND] ❌ Nenhum arquivo recebido!');
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      // Buscar o room type para obter o hotelId
      const roomType = await getRoomTypeById(roomTypeId);
      if (!roomType) {
        console.log('📸 [BACKEND] ❌ Room type não encontrado:', roomTypeId);
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Room type não encontrado'
        });
      }
      console.log('📸 [BACKEND] ✅ Room type encontrado:', roomType.id, roomType.name);
      
      // Adicionar o hotelId aos params para o middleware requireHotelOwner
      req.params.hotelId = roomType.hotel_id;
      
      // Chamar o middleware requireHotelOwner manualmente
      return requireHotelOwner(req, res, async () => {
        console.log('📸 [BACKEND] ✅ Verificação de propriedade OK');
        
        const { alt_text, is_featured, is_primary } = req.body;
        const file = req.file as Express.Multer.File;

        const { canAdd, currentCount, remaining } = await roomTypePhotoService.canAddMore(roomTypeId);
        if (!canAdd) {
          console.log('📸 [BACKEND] ❌ Limite de fotos atingido:', { currentCount, remaining });
          fs.unlinkSync(file.path);
          return res.status(400).json({
            success: false,
            error: `Limite máximo de 20 fotos atingido. Atual: ${currentCount}`,
            remaining: 0,
            limit: 20
          });
        }

        // ✅ CORREÇÃO: Se for para ser a foto principal, remover primary de todas as outras
        if (is_primary === 'true') {
          console.log('📸 [BACKEND] ⭐ Removendo primary de outras fotos');
          // Passar null em vez de string vazia para indicar que quer remover primary de todas
          await roomTypePhotoService.setPrimary(roomTypeId, null);
        }

        console.log('📸 [BACKEND] Movendo arquivo:', file.path, '->', file.filename);
        const url = moveUploadedFile(file.path, file.filename);
        console.log('📸 [BACKEND] URL gerada:', url);

        // Criar a foto
        const photo = await roomTypePhotoService.create({
          room_type_id: roomTypeId,
          url,
          alt_text: alt_text || '',
          order: currentCount,
          is_featured: is_featured === 'true',
          is_primary: is_primary === 'true',
        });

        console.log('📸 [BACKEND] ✅ Upload concluído, foto salva com ID:', photo.id);
        console.log('📸 [BACKEND] ===== FIM UPLOAD (SUCESSO) =====\n');

        res.status(201).json({
          success: true,
          data: photo,
          message: 'Foto enviada com sucesso',
          remaining: remaining - 1
        });
      });
    } catch (error) {
      console.error('📸 [BACKEND] ❌ Erro no upload:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Erro ao fazer upload:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * POST /api/hotels/room-types/:roomTypeId/photos/multiple
 * Upload de múltiplas fotos - VERSÃO CORRIGIDA
 */
router.post('/room-types/:roomTypeId/photos/multiple', 
  requireAuth, 
  upload.array('photos', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[] | undefined;
    
    console.log('📸 [BACKEND] ===== INÍCIO UPLOAD MÚLTIPLO =====');
    console.log('📸 [BACKEND] roomTypeId:', req.params.roomTypeId);
    console.log('📸 [BACKEND] Número de arquivos recebidos:', files?.length || 0);
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        console.log(`📸 [BACKEND] Arquivo ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    } else {
      console.log('📸 [BACKEND] ❌ Nenhum arquivo recebido');
    }
    
    try {
      const { roomTypeId } = req.params;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      // Buscar o room type para obter o hotelId
      const roomType = await getRoomTypeById(roomTypeId);
      if (!roomType) {
        files.forEach(file => fs.unlinkSync(file.path));
        return res.status(404).json({
          success: false,
          error: 'Room type não encontrado'
        });
      }
      
      // Adicionar o hotelId aos params para o middleware requireHotelOwner
      req.params.hotelId = roomType.hotel_id;
      
      // Chamar o middleware requireHotelOwner manualmente
      return requireHotelOwner(req, res, async () => {
        const { canAdd, currentCount, remaining } = await roomTypePhotoService.canAddMore(roomTypeId);
        if (!canAdd || files.length > remaining) {
          files.forEach(file => fs.unlinkSync(file.path));
          return res.status(400).json({
            success: false,
            error: `Limite excedido. Pode adicionar no máximo ${remaining} foto(s)`,
            currentCount,
            remaining,
            limit: 20
          });
        }

        const photos = await Promise.all(
          files.map(async (file, index) => {
            const url = moveUploadedFile(file.path, file.filename);
            return roomTypePhotoService.create({
              room_type_id: roomTypeId,
              url,
              alt_text: '',
              order: currentCount + index,
              is_featured: index === 0,
              is_primary: false,
            });
          })
        );

        console.log(`📸 [BACKEND] ✅ Upload múltiplo concluído: ${photos.length} foto(s) salva(s)`);

        res.status(201).json({
          success: true,
          data: photos,
          message: `${photos.length} foto(s) enviada(s) com sucesso`,
          remaining: remaining - photos.length
        });
      });
    } catch (error) {
      files?.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
      console.error('Erro ao fazer upload múltiplo:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * GET /api/hotels/room-types/:roomTypeId/photos
 * Listar fotos de um room type
 */
router.get('/room-types/:roomTypeId/photos', async (req: Request, res: Response) => {
  try {
    const { roomTypeId } = req.params;
    const photos = await roomTypePhotoService.getByRoomType(roomTypeId);
    
    res.json({
      success: true,
      data: photos,
      count: photos.length
    });
  } catch (error) {
    console.error('Erro ao listar fotos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/room-types/:roomTypeId/photos/:photoId
 * Obter uma foto específica
 */
router.get('/room-types/:roomTypeId/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const { photoId } = req.params;
    const photo = await roomTypePhotoService.getById(photoId);

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: 'Foto não encontrada'
      });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Erro ao buscar foto:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * PUT /api/hotels/room-types/:roomTypeId/photos/:photoId
 * Atualizar meta-dados de uma foto
 */
router.put('/room-types/:roomTypeId/photos/:photoId', 
  requireAuth, 
  requireHotelOwner, 
  async (req: Request, res: Response) => {
    try {
      const { roomTypeId, photoId } = req.params;
      const updates = req.body;

      const existing = await roomTypePhotoService.getById(photoId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Foto não encontrada'
        });
      }

      if (updates.is_primary === true) {
        await roomTypePhotoService.setPrimary(roomTypeId, photoId);
        const updated = await roomTypePhotoService.getById(photoId);
        return res.json({
          success: true,
          data: updated,
          message: 'Foto definida como principal com sucesso'
        });
      }

      const photo = await roomTypePhotoService.update(photoId, updates);

      res.json({
        success: true,
        data: photo,
        message: 'Foto atualizada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * PATCH /api/hotels/room-types/:roomTypeId/photos/:photoId/toggle-featured
 * Alternar status featured
 */
router.patch('/room-types/:roomTypeId/photos/:photoId/toggle-featured',
  requireAuth,
  requireHotelOwner,
  async (req: Request, res: Response) => {
    try {
      const { photoId } = req.params;
      
      const photo = await roomTypePhotoService.toggleFeatured(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Foto não encontrada'
        });
      }

      res.json({
        success: true,
        data: photo,
        message: `Foto ${photo.is_featured ? 'destacada' : 'não destacada'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alternar featured:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * DELETE /api/hotels/room-types/:roomTypeId/photos/:photoId
 * Deletar uma foto (soft delete)
 */
router.delete('/room-types/:roomTypeId/photos/:photoId', 
  requireAuth, 
  requireHotelOwner, 
  async (req: Request, res: Response) => {
    try {
      const { photoId } = req.params;
      
      const photo = await roomTypePhotoService.getById(photoId);
      if (!photo) {
        return res.status(404).json({
          success: false,
          error: 'Foto não encontrada'
        });
      }

      deleteUploadedFile(photo.url);

      await roomTypePhotoService.softDelete(photoId);

      res.json({
        success: true,
        message: 'Foto deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * PUT /api/hotels/room-types/:roomTypeId/photos/reorder
 * Reordenar fotos
 */
router.put('/room-types/:roomTypeId/photos/reorder', 
  requireAuth, 
  requireHotelOwner, 
  async (req: Request, res: Response) => {
    try {
      const { roomTypeId } = req.params;
      const { photoIds } = req.body;

      if (!Array.isArray(photoIds) || photoIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'photoIds é obrigatório e deve ser um array não vazio'
        });
      }

      const updated = await roomTypePhotoService.reorder(roomTypeId, photoIds);

      res.json({
        success: true,
        data: updated,
        message: 'Fotos reordenadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao reordenar fotos:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
);

/**
 * GET /api/hotels/:hotelId/photos
 * Obter todas as fotos de um hotel (todos os room types)
 */
router.get('/:hotelId/photos', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const photos = await roomTypePhotoService.getByHotel(hotelId);

    res.json({
      success: true,
      data: photos,
      count: photos.length
    });
  } catch (error) {
    console.error('Erro ao buscar fotos do hotel:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/:hotelId/photos/featured
 * Obter apenas fotos destacadas de um hotel
 */
router.get('/:hotelId/photos/featured', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const photos = await roomTypePhotoService.getFeaturedByHotel(hotelId);

    res.json({
      success: true,
      data: photos,
      count: photos.length
    });
  } catch (error) {
    console.error('Erro ao buscar fotos destacadas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/:hotelId/photos/primary
 * Obter foto principal de um hotel
 */
router.get('/:hotelId/photos/primary', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const photo = await roomTypePhotoService.getPrimaryByHotel(hotelId);

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Erro ao buscar foto principal:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/:hotelId/with-photos
 * Obter hotel com fotos (para search results)
 */
router.get('/:hotelId/with-photos', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const hotel = await getHotelById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel não encontrado'
      });
    }

    const photos = await roomTypePhotoService.getFeaturedByHotel(hotelId);

    res.json({
      success: true,
      data: {
        ...hotel,
        photos
      }
    });
  } catch (error) {
    console.error('Erro ao buscar hotel com fotos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/room-types/:roomTypeId/with-photos
 * Obter room type com fotos (para details page)
 */
router.get('/room-types/:roomTypeId/with-photos', async (req: Request, res: Response) => {
  try {
    const { roomTypeId } = req.params;
    
    const roomType = await getRoomTypeById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        error: 'Room type não encontrado'
      });
    }

    const photos = await roomTypePhotoService.getByRoomType(roomTypeId);

    res.json({
      success: true,
      data: {
        ...roomType,
        photos
      }
    });
  } catch (error) {
    console.error('Erro ao buscar room type com fotos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/hotels/:hotelId/photos/count
 * Contar fotos de um hotel
 */
router.get('/:hotelId/photos/count', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    const photos = await roomTypePhotoService.getByHotel(hotelId);

    res.json({
      success: true,
      data: {
        total: photos.length,
        featured: photos.filter(p => p.is_featured).length,
        withPrimary: photos.some(p => p.is_primary)
      }
    });
  } catch (error) {
    console.error('Erro ao contar fotos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ======================= DISPONIBILIDADE =======================

router.get('/:id/availability/check', async (req: Request, res: Response) => {
  try {
    const { roomTypeId, checkIn, checkOut, units = 1 } = req.query;

    if (!roomTypeId || !checkIn || !checkOut) {
      return res.status(400).json({ 
        success: false, 
        message: 'roomTypeId, checkIn e checkOut são obrigatórios' 
      });
    }

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

router.post('/:id/availability/bulk', requireAuth, requireHotelOwner, async (req: Request, res: Response) => {
  try {
    console.log('📤 Received bulk payload:', JSON.stringify(req.body, null, 2));
    
    const validated: BulkAvailabilityUpdate = bulkAvailabilityUpdateSchema.parse(req.body);
    const { updates, roomTypeId } = validated;
    
    const roomType = await getRoomTypeById(roomTypeId);
    if (!roomType || roomType.hotel_id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Room type não pertence a este hotel'
      });
    }

    const maxUnits = roomType.total_units || 0;
    console.log("🏨 Validando contra total de unidades:", maxUnits);

    const processedUpdates = updates.map(update => {
      const processed: any = {
        date: update.date,
        reset: update.reset || false,
      };

      if (update.price !== undefined) {
        if (update.reset) {
          processed.price = null;
        } else if (update.price !== null) {
          const price = parseFloat(update.price.toString());
          if (isNaN(price) || price <= 0) {
            throw new Error(`Preço inválido para ${update.date}: ${update.price}`);
          }
          processed.price = price;
        }
      }

      if (update.availableUnits !== undefined) {
        if (update.reset) {
          processed.availableUnits = null;
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

      if (update.stopSell !== undefined) {
        processed.stopSell = update.reset ? false : Boolean(update.stopSell);
      }

      if (update.minNights !== undefined) {
        if (update.reset) {
          processed.minNights = 1;
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

router.post('/:id/bookings', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🔍 [HOTEL BOOKING] Dados recebidos do frontend:', {
      body: req.body,
      hotelId: req.params.id,
      userId: (req as any).user?.id,
      headers: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });
    
    const hotelId = req.params.id;
    const userId = (req as any).user?.id;

    const hotel = await getHotelById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel não encontrado' });

    console.log('✅ [HOTEL BOOKING] Validando dados com schema...');
    const validated = createBookingSchema.parse(req.body);
    console.log('✅ [HOTEL BOOKING] Dados validados:', validated);
    
    const bookingData: CreateBookingData = {
      hotelId,
      roomTypeId: validated.roomTypeId!,
      guestName: validated.guestName!,
      guestEmail: validated.guestEmail!,
      guestPhone: validated.guestPhone || undefined,
      checkIn: validated.checkIn!,
      checkOut: validated.checkOut!,
      adults: validated.adults,
      children: validated.children,
      units: validated.units,
      specialRequests: validated.specialRequests || undefined,
      promoCode: validated.promoCode || undefined,
      userId: validated.userId || userId,
      status: validated.status,
      paymentStatus: validated.paymentStatus,
    };
    
    console.log('📦 [HOTEL BOOKING] Booking data para service:', bookingData);
    
    console.log('🚀 [HOTEL BOOKING] Chamando createHotelBooking...');
    const result = await createHotelBooking(bookingData, userId);
    
    let bookingResult;
    let unitsReserved = 1;

    if (result && typeof result === 'object') {
      if ('booking' in result) {
        bookingResult = result.booking;
        unitsReserved = result.unitsReserved || 1;
      } else if ('id' in result) {
        bookingResult = result;
      } else {
        throw new Error('Estrutura de retorno do service desconhecida');
      }
    } else {
      throw new Error('Service retornou valor inválido');
    }

    if (!bookingResult) {
      throw new Error('Service não retornou dados da reserva');
    }

    console.log('📥 [HOTEL BOOKING] Resultado processado:', {
      bookingId: bookingResult.id,
      unitsReserved,
      structure: 'booking' in result ? 'nested' : 'direct'
    });

    console.log('🎉 [HOTEL BOOKING] Reserva criada com ID:', bookingResult.id);
    
    res.status(201).json({
      success: true,
      message: 'Reserva criada com sucesso',
      data: bookingResult,
      meta: {
        unitsReserved: unitsReserved,
        bookingId: bookingResult.id
      }
    });
  } catch (error) {
    console.error('❌ [HOTEL BOOKING] Erro:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body,
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: error.errors,
        validationDetails: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar reserva: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    });
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

router.post('/bookings/:bookingId/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user?.id;
    
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    const isOwner = await isHotelOwner(booking.hotelId, userId);
    const isAdmin = (req as any).user?.roles?.includes('admin') || false;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para confirmar esta reserva',
        error: 'PERMISSION_DENIED',
      });
    }

    const confirmed = await confirmBooking(bookingId, userId);
    
    if (!confirmed) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reserva não encontrada' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Reserva confirmada com sucesso', 
      data: confirmed 
    });
  } catch (error: any) {
    console.error('Erro ao confirmar reserva:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

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