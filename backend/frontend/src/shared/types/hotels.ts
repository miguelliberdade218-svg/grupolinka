/**
 * src/shared/types/hotels.ts
 * Tipos TypeScript para módulo de Hotéis
 * Compatível 100% com backend hotelController.ts
 * Versão: 07/02/2026 - Status de booking corrigidos
 * NOTA: Usando snake_case para compatibilidade total com backend
 */

import type { HotelBooking, CreateHotelBookingRequest } from './bookings';
import type { HotelPayment, HotelInvoice, RequiredDeposit } from './payments';

// ==================== TIPOS DE STATUS CORRIGIDOS ====================

/**
 * ✅ CORREÇÃO: Status válidos para bookings de hotel (conforme banco de dados)
 * IMPORTANTE: 'rejected' não existe para hotéis, usa 'cancelled' com motivo
 */
export type HotelBookingStatus = 
  | 'pending_confirmation'  // ✅ NOVO: Estado padrão após criação
  | 'confirmed'             // ✅ Reserva confirmada pelo gestor
  | 'checked_in'            // ✅ Check-in realizado
  | 'checked_out'           // ✅ Check-out realizado
  | 'cancelled'             // ✅ Cancelada (pode ser por rejeição)
  | 'no_show';              // ✅ No-show (não compareceu)

/**
 * ✅ CORREÇÃO: Status de pagamento para hotéis
 */
export type HotelPaymentStatus = 
  | 'pending'               // Aguardando pagamento
  | 'partial'               // Pagamento parcial
  | 'paid'                  // Pagamento completo
  | 'refunded'              // Reembolsado
  | 'failed';               // Falhou

// ==================== HOTEL ====================
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  locality: string;
  province: string;
  country?: string;
  
  location_id?: string | null;
  lat?: string | null;
  lng?: string | null;
  
  contact_email: string;
  contact_phone?: string | null;
  policies?: string | null;
  images: string[];
  amenities: string[];
  check_in_time?: string | null;
  check_out_time?: string | null;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  is_featured?: boolean;
  host_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHotelRequest {
  name: string;
  slug?: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country?: string;
  
  location_id?: string;
  lat?: string | number;
  lng?: string | number;
  
  contact_email: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface UpdateHotelRequest {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  locality?: string;
  province?: string;
  country?: string;
  
  location_id?: string;
  lat?: string | number;
  lng?: string | number;
  
  contact_email?: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

// ==================== ROOM TYPES ====================
export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string | null;
  capacity: number;
  base_price: string;
  total_units: number;
  base_occupancy: number;
  min_nights?: number | null;
  extra_adult_price?: string | null;
  extra_child_price?: string | null;
  amenities: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  capacity: number;
  base_price: string | number;
  total_units: number;
  base_occupancy: number;
  min_nights?: number;
  extra_adult_price?: string | number;
  extra_child_price?: string | number;
  amenities?: string[];
  images?: string[];
  is_active?: boolean;
}

export interface UpdateRoomTypeRequest {
  name?: string;
  description?: string;
  capacity?: number;
  base_price?: string | number;
  total_units?: number;
  base_occupancy?: number;
  min_nights?: number;
  extra_adult_price?: string | number;
  extra_child_price?: string | number;
  amenities?: string[];
  images?: string[];
  is_active?: boolean;
}

// ==================== SEARCH ====================
export interface HotelSearchParams {
  query?: string;
  locality?: string;
  province?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  is_active?: boolean;
}

export interface HotelSearchResult {
  hotel: Hotel;
  room_types: RoomType[];
  min_price?: number;
  max_price?: number;
  available_rooms?: number;
}

// ==================== PROMOTIONS ====================
export interface Promotion {
  id: string;
  hotel_id: string;
  promo_code: string;
  name: string;
  description?: string | null;
  discount_percent?: number | null;
  discount_amount?: number | null;
  start_date: string;
  end_date: string;
  max_uses?: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePromotionRequest {
  promo_code: string;
  name: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  max_uses?: number;
  is_active?: boolean;
}

export interface UpdatePromotionRequest {
  promo_code?: string;
  name?: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  start_date?: string;
  end_date?: string;
  max_uses?: number;
  is_active?: boolean;
}

// ==================== AVAILABILITY ====================
export interface RoomAvailability {
  date: string;
  room_type_id: string;
  is_available: boolean;
  available_units: number;
  total_units: number;
  price?: string;
  min_booking_nights?: number;
}

export interface CheckAvailabilityRequest {
  room_type_id: string;
  check_in: string;
  check_out: string;
  units?: number;
}

export interface CheckAvailabilityResponse {
  available: boolean;
  min_units: number;
  max_units: number;
  message?: string;
}

export interface AvailabilityUpdate {
  date: string;
  is_available?: boolean;
  price?: string;
  min_nights?: number;
}

// ==================== PRICING ====================
export interface PricingCalculation {
  room_type_id: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  units: number;
  price_per_night: string;
  subtotal: string;
  discount?: string;
  discount_percent?: number;
  taxes?: string;
  total_price: string;
  price_breakdown: {
    base_price: string;
    extra_adult_charges: string;
    extra_child_charges: string;
    discount_amount: string;
    final_price: string;
  };
}

export interface CalculatePriceRequest {
  room_type_id: string;
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
  units?: number;
  promo_code?: string;
}

// ==================== REVIEWS ====================
export interface HotelReview {
  id: string;
  hotel_id: string;
  booking_id: string;
  guest_name: string;
  guest_email: string;
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
  average_rating: number;
  pros?: string;
  cons?: string;
  helpful_count: number;
  unhelpful_count: number;
  manager_response?: string;
  manager_response_date?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewRequest {
  booking_id: string;
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
  total_reviews: number;
  average_rating: number;
  category_averages: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  rating_distribution: Record<number, number>;
  with_responses: number;
}

// ==================== BOOKINGS ====================

/**
 * ✅ CORREÇÃO: Interface para booking de hotel
 * Usa os status corrigidos conforme banco de dados
 */
export interface HotelBookingData {
  id: string;
  hotel_id: string;
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  units: number;
  nights?: number;
  total_price: string;
  base_price: string;
  taxes?: string;
  special_requests?: string | null;
  
  // ✅ CORREÇÃO: Status válidos para hotéis
  status: HotelBookingStatus;
  payment_status: HotelPaymentStatus;
  
  promo_code?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (opcionais)
  room_type?: RoomType;
  hotel?: Hotel;
  payment?: HotelPayment;
  invoice?: HotelInvoice;
}

/**
 * ✅ CORREÇÃO: Interface para request de criação de booking
 */
export interface CreateHotelBookingRequestData {
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  adults: number;
  children?: number;
  units?: number;
  special_requests?: string;
  promo_code?: string;
  user_id?: string;
  
  // ✅ Status será definido como 'pending_confirmation' no service
  status?: HotelBookingStatus;
  payment_status?: HotelPaymentStatus;
}

// ==================== DASHBOARD ====================
export interface HostDashboardSummary {
  total_hotels: number;
  total_bookings: number;
  total_revenue: number;
  avg_occupancy_rate: number;
  avg_rating: number;
  total_guests: number;
  pending_payments: number;
  recent_bookings: HotelBookingData[];
}

export interface HotelDashboardStats {
  hotel: Hotel;
  occupancy_rate: number;
  monthly_revenue: string;
  total_bookings_month: number;
  average_nightly_rate: string;
  upcoming_check_ins: number;
  pending_payments: number;
  total_reviews: number;
  average_rating: number;
  room_occupancy: Array<{
    room_type_id: string;
    room_type_name: string;
    occupancy_percent: number;
    revenue: string;
  }>;
}

// ==================== RELATÓRIOS ====================
export interface BookingReport {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_revenue: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    paid_bookings: number;
  };
  bookings: HotelBookingData[];
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
  booking: HotelBookingData;
  invoice: HotelInvoice;
  payments: HotelPayment[];
  required_deposit: RequiredDeposit;
  balance: {
    total_due: number;
    total_paid: number;
    balance_remaining: number;
  };
}

// ==================== FUNÇÕES HELPER ====================

/**
 * ✅ CORREÇÃO: Normaliza status de booking para hotéis
 * Converte status antigos/incompatíveis para os status válidos
 */
export function normalizeHotelBookingStatus(frontendStatus: string | undefined): HotelBookingStatus {
  if (!frontendStatus) return 'pending_confirmation';
  
  const statusMap: Record<string, HotelBookingStatus> = {
    'pending': 'pending_confirmation',
    'pending_confirmation': 'pending_confirmation',
    'confirmed': 'confirmed',
    'checked_in': 'checked_in',
    'checked_out': 'checked_out',
    'cancelled': 'cancelled',
    'no_show': 'no_show',
    
    // Mapear status que não existem para hotéis
    'rejected': 'cancelled',               // ❌ 'rejected' não existe → 'cancelled'
    'pending_approval': 'pending_confirmation', // Para compatibilidade
    'in_progress': 'checked_in',           // Para compatibilidade
    'completed': 'checked_out',            // Para compatibilidade
  };
  
  return statusMap[frontendStatus.toLowerCase()] || 'pending_confirmation';
}

/**
 * ✅ CORREÇÃO: Obtém display em português para status de hotel
 */
export function getHotelBookingStatusDisplay(status: HotelBookingStatus): string {
  const displayMap: Record<HotelBookingStatus, string> = {
    'pending_confirmation': 'Aguardando confirmação',
    'confirmed': 'Confirmado',
    'checked_in': 'Check-in realizado',
    'checked_out': 'Check-out realizado',
    'cancelled': 'Cancelado',
    'no_show': 'No-show',
  };
  
  return displayMap[status] || status.replace('_', ' ');
}

/**
 * ✅ CORREÇÃO: Obtém display em português para status de pagamento
 */
export function getHotelPaymentStatusDisplay(status: HotelPaymentStatus): string {
  const displayMap: Record<HotelPaymentStatus, string> = {
    'pending': 'Pendente',
    'partial': 'Parcial',
    'paid': 'Pago',
    'refunded': 'Reembolsado',
    'failed': 'Falhou',
  };
  
  return displayMap[status] || status;
}

// ==================== LAZY LOADING / CALENDÁRIO ====================
export interface CalendarOptions {
  chunkSize?: number;
  forceReload?: boolean;
}

export interface LoadedPeriod {
  start: string;
  end: string;
}

export interface CalendarChunk {
  hotelId: string;
  roomTypeId: string;
  startDate: string;
  endDate: string;
  availability: any[];
  bookings: HotelBookingData[];
  events: any[];
  loadedAt: string;
}

export interface LazyLoadingConfig {
  defaultChunkSize?: number;
  maxMonthsFuture?: number;
  cacheDuration?: number;
}

// ==================== EXPORTAÇÕES ====================
export type {
  HotelBookingData as HotelBooking,
  CreateHotelBookingRequestData as CreateHotelBookingRequest
};