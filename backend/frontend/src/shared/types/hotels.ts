/**
 * src/shared/types/hotels.ts
 * Tipos TypeScript para módulo de Hotéis
 * Compatível 100% com backend hotelController.ts
 * Versão: 15/01/2026
 */

import type { HotelBooking, CreateHotelBookingRequest } from './bookings';
import type { HotelPayment, HotelInvoice, RequiredDeposit } from './payments';

// ==================== HOTEL ====================
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  locality: string; // OBRIGATÓRIO - Localidade/Cidade
  province: string;
  country?: string;
  lat?: string | null; // String numérico (ex: "-23.8544")
  lng?: string | null; // String numérico (ex: "35.4735")
  contactEmail: string;
  contactPhone?: string | null;
  policies?: string | null;
  images: string[]; // URLs de imagens
  amenities: string[]; // Facilidades (WiFi, Piscina, etc)
  checkInTime?: string | null; // HH:mm (ex: "14:00")
  checkOutTime?: string | null; // HH:mm (ex: "11:00")
  rating: number; // 0-5
  totalReviews: number;
  isActive: boolean;
  isFeatured?: boolean;
  hostId: string; // ID do proprietário
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface CreateHotelRequest {
  name: string;
  slug?: string;
  description?: string;
  address: string;
  locality: string; // OBRIGATÓRIO
  province: string;
  country?: string;
  lat?: string | number;
  lng?: string | number;
  contactEmail: string;
  contactPhone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
}

export interface UpdateHotelRequest {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  locality?: string;
  province?: string;
  country?: string;
  lat?: string | number;
  lng?: string | number;
  contactEmail?: string;
  contactPhone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  checkInTime?: string;
  checkOutTime?: string;
}

// ==================== ROOM TYPES ====================
export interface RoomType {
  id: string;
  hotelId: string;
  name: string; // (ex: "Duplo Deluxe", "Suite")
  description?: string | null;
  capacity: number; // Número máximo de pessoas
  basePrice: string; // Decimal como string (ex: "100.00")
  totalUnits: number; // Número total de quartos deste tipo
  baseOccupancy: number; // Ocupação padrão (ex: 2)
  minNights?: number | null; // Noites mínimas
  extraAdultPrice?: string | null; // Preço por adulto extra
  extraChildPrice?: string | null; // Preço por criança extra
  amenities: string[]; // Amenidades do quarto
  images: string[]; // URLs das imagens
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  capacity: number;
  basePrice: string | number;
  totalUnits: number;
  baseOccupancy: number;
  minNights?: number;
  extraAdultPrice?: string | number;
  extraChildPrice?: string | number;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
}

export interface UpdateRoomTypeRequest {
  name?: string;
  description?: string;
  capacity?: number;
  basePrice?: string | number;
  totalUnits?: number;
  baseOccupancy?: number;
  minNights?: number;
  extraAdultPrice?: string | number;
  extraChildPrice?: string | number;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
}

// ==================== SEARCH ====================
export interface HotelSearchParams {
  query?: string; // Busca por nome do hotel
  locality?: string; // Localidade/Cidade
  province?: string; // Província
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  guests?: number; // Número de hóspedes
  isActive?: boolean;
}

export interface HotelSearchResult {
  hotel: Hotel;
  roomTypes: RoomType[];
  minPrice?: number;
  maxPrice?: number;
  availableRooms?: number;
}

// ==================== PROMOTIONS ====================
export interface Promotion {
  id: string;
  hotelId: string;
  promoCode: string; // (ex: "WELCOME10")
  name: string;
  description?: string | null;
  discountPercent?: number | null; // (ex: 10 = 10%)
  discountAmount?: number | null; // Valor fixo
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  maxUses?: number | null;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionRequest {
  promoCode: string;
  name: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  isActive?: boolean;
}

export interface UpdatePromotionRequest {
  promoCode?: string;
  name?: string;
  description?: string;
  discountPercent?: number;
  discountAmount?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  isActive?: boolean;
}

// ==================== AVAILABILITY ====================
export interface RoomAvailability {
  date: string; // YYYY-MM-DD
  roomTypeId: string;
  isAvailable: boolean;
  availableUnits: number; // Unidades disponíveis
  totalUnits: number; // Total de unidades
  price?: string;
  minBookingNights?: number;
}

export interface CheckAvailabilityRequest {
  roomTypeId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  units?: number; // Quantos quartos
}

export interface CheckAvailabilityResponse {
  available: boolean;
  minUnits: number;
  maxUnits: number;
  message?: string;
}

export interface AvailabilityUpdate {
  date: string;
  isAvailable?: boolean;
  price?: string;
  minNights?: number;
}

// ==================== PRICING ====================
/**
 * Cálculo de preço para uma reserva
 * Exemplo:
 * - Check-in: 20/01/2026
 * - Check-out: 23/01/2026 (3 noites)
 * - Quarto: Duplo Deluxe (100 MZN/noite)
 * - Ocupação: 2 adultos, 1 criança
 * - Promo: WELCOME10 (10% desconto)
 * 
 * Cálculo:
 * - Noites: 3
 * - Subtotal: 100 × 3 = 300 MZN
 * - Desconto: 300 × 0.10 = 30 MZN
 * - Total: 300 - 30 = 270 MZN
 */
export interface PricingCalculation {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  units: number;
  pricePerNight: string;
  subtotal: string;
  discount?: string;
  discountPercent?: number;
  taxes?: string;
  totalPrice: string;
  priceBreakdown: {
    basePrice: string;
    extraAdultCharges: string;
    extraChildCharges: string;
    discountAmount: string;
    finalPrice: string;
  };
}

export interface CalculatePriceRequest {
  roomTypeId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  units?: number;
  promoCode?: string;
}

// ==================== REVIEWS ====================
export interface HotelReview {
  id: string;
  hotelId: string;
  bookingId: string;
  guestName: string;
  guestEmail: string;
  title: string;
  comment: string;
  ratings: {
    cleanliness: number; // 1-5
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  averageRating: number; // Média das 6 categorias
  pros?: string; // O que gostou
  cons?: string; // O que não gostou
  helpfulCount: number;
  unhelpfulCount: number;
  managerResponse?: string; // Resposta do hotel
  managerResponseDate?: string;
  verified: boolean; // Se a estadia foi verificada
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  title: string;
  comment: string;
  ratings: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  pros?: string;
  cons?: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  categoryAverages: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  ratingDistribution: Record<number, number>; // {5: 45, 4: 30, 3: 15, 2: 5, 1: 5}
  withResponses: number;
}

// ==================== BOOKINGS (Integração) ====================
export interface HotelBookingData extends HotelBooking {
  roomType?: RoomType;
  hotel?: Hotel;
  payment?: HotelPayment;
  invoice?: HotelInvoice;
}

// ==================== DASHBOARD ====================
/**
 * Resumo para host/proprietário com múltiplos hotéis
 */
export interface HostDashboardSummary {
  totalHotels: number;
  totalBookings: number;
  totalRevenue: number;
  avgOccupancyRate: number;
  avgRating: number;
  totalGuests: number;
  pendingPayments: number;
  recentBookings: HotelBooking[];
}

/**
 * Dashboard de um hotel específico
 */
export interface HotelDashboardStats {
  hotel: Hotel;
  occupancyRate: number; // % (ex: 75.5)
  monthlyRevenue: string; // Decimal
  totalBookingsMonth: number;
  averageNightlyRate: string; // Preço médio/noite
  upcomingCheckIns: number; // Check-ins próximos 7 dias
  pendingPayments: number;
  totalReviews: number;
  averageRating: number;
  roomOccupancy: Array<{
    roomTypeId: string;
    roomTypeName: string;
    occupancyPercent: number;
    revenue: string;
  }>;
}

// ==================== RELATÓRIOS ====================
export interface BookingReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    confirmedBookings: number;
    cancelledBookings: number;
    paidBookings: number;
  };
  bookings: HotelBooking[];
}

// ==================== RESPOSTAS API ====================
export interface HotelResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface HotelsListResponse {
  success: boolean;
  data: Hotel[] | HotelSearchResult[];
  count: number;
}

export interface RoomTypesListResponse {
  success: boolean;
  data: RoomType[];
  count: number;
}

// ==================== PAGAMENTO ====================
export interface HotelPaymentData {
  booking: HotelBooking;
  invoice: HotelInvoice;
  payments: HotelPayment[];
  requiredDeposit: RequiredDeposit;
  balance: {
    totalDue: number;
    totalPaid: number;
    balanceRemaining: number;
  };
}
