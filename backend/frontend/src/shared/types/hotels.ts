/**
 * src/shared/types/hotels.ts
 * Tipos TypeScript para módulo de Hotéis
 * Compatível 100% com backend hotelController.ts
 * Versão: 19/01/2026 - Corrigido e completo com export interface Hotel
 * NOTA: Usando snake_case para compatibilidade total com backend
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
  contact_email: string;
  contact_phone?: string | null;
  policies?: string | null;
  images: string[]; // URLs de imagens
  amenities: string[]; // Facilidades (WiFi, Piscina, etc)
  check_in_time?: string | null; // HH:mm (ex: "14:00")
  check_out_time?: string | null; // HH:mm (ex: "11:00")
  rating: number; // 0-5
  total_reviews: number;
  is_active: boolean;
  is_featured?: boolean;
  host_id: string; // ID do proprietário
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
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
  name: string; // (ex: "Duplo Deluxe", "Suite")
  description?: string | null;
  capacity: number; // Número máximo de pessoas
  base_price: string; // Decimal como string (ex: "100.00")
  total_units: number; // Número total de quartos deste tipo
  base_occupancy: number; // Ocupação padrão (ex: 2)
  min_nights?: number | null; // Noites mínimas
  extra_adult_price?: string | null; // Preço por adulto extra
  extra_child_price?: string | null; // Preço por criança extra
  amenities: string[]; // Amenidades do quarto
  images: string[]; // URLs das imagens
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
  query?: string; // Busca por nome do hotel
  locality?: string; // Localidade/Cidade
  province?: string; // Província
  check_in?: string; // YYYY-MM-DD
  check_out?: string; // YYYY-MM-DD
  guests?: number; // Número de hóspedes
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
  promo_code: string; // (ex: "WELCOME10")
  name: string;
  description?: string | null;
  discount_percent?: number | null; // (ex: 10 = 10%)
  discount_amount?: number | null; // Valor fixo
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  room_type_id: string;
  is_available: boolean;
  available_units: number; // Unidades disponíveis
  total_units: number; // Total de unidades
  price?: string;
  min_booking_nights?: number;
}

export interface CheckAvailabilityRequest {
  room_type_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  units?: number; // Quantos quartos
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
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
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
    cleanliness: number; // 1-5
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  average_rating: number; // Média das 6 categorias
  pros?: string; // O que gostou
  cons?: string; // O que não gostou
  helpful_count: number;
  unhelpful_count: number;
  manager_response?: string; // Resposta do hotel
  manager_response_date?: string;
  verified: boolean; // Se a estadia foi verificada
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
  rating_distribution: Record<number, number>; // {5: 45, 4: 30, 3: 15, 2: 5, 1: 5}
  with_responses: number;
}

// ==================== BOOKINGS (Integração) ====================
export interface HotelBookingData extends HotelBooking {
  room_type?: RoomType;
  hotel?: Hotel;
  payment?: HotelPayment;
  invoice?: HotelInvoice;
}

// ==================== DASHBOARD ====================
/**
 * Resumo para host/proprietário com múltiplos hotéis
 */
export interface HostDashboardSummary {
  total_hotels: number;
  total_bookings: number;
  total_revenue: number;
  avg_occupancy_rate: number;
  avg_rating: number;
  total_guests: number;
  pending_payments: number;
  recent_bookings: HotelBooking[];
}

/**
 * Dashboard de um hotel específico
 */
export interface HotelDashboardStats {
  hotel: Hotel;
  occupancy_rate: number; // % (ex: 75.5)
  monthly_revenue: string; // Decimal
  total_bookings_month: number;
  average_nightly_rate: string; // Preço médio/noite
  upcoming_check_ins: number; // Check-ins próximos 7 dias
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
  required_deposit: RequiredDeposit;
  balance: {
    total_due: number;
    total_paid: number;
    balance_remaining: number;
  };
}

// ==================== LAZY LOADING / CALENDÁRIO ====================

/**
 * Opções para chamadas de calendário com suporte a lazy loading
 * Usado em hotelService.getAvailabilityCalendar e similares
 */
export interface CalendarOptions {
  /**
   * Tamanho sugerido do chunk em dias (ex: 90 para 3 meses)
   * O backend pode ignorar ou usar como orientação
   */
  chunkSize?: number;

  /**
   * Forçar recarregamento ignorando qualquer cache no backend
   * Útil no botão "Recarregar" do painel do gestor
   */
  forceReload?: boolean;
}

/**
 * Período carregado no estado do calendário lazy loading
 * Usado em RoomTypesManagement.tsx para rastrear chunks já buscados
 */
export interface LoadedPeriod {
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
}

/**
 * Chunk completo de dados do calendário (disponibilidade + reservas filtradas)
 * Pode ser usado para cache ou hooks futuros
 */
export interface CalendarChunk {
  hotelId: string;
  roomTypeId: string;
  startDate: string;
  endDate: string;
  availability: any[];    // Array de dias (como retornado pela API)
  bookings: HotelBooking[];    // Reservas que se sobrepõem ao chunk
  events: any[];          // Eventos formatados para react-big-calendar
  loadedAt: string;       // ISO timestamp de quando foi carregado
}

/**
 * Opções gerais de configuração do lazy loading (pode ser usado em hooks)
 */
export interface LazyLoadingConfig {
  /**
   * Tamanho padrão do chunk em dias (usado se não especificado)
   * @default 90
   */
  defaultChunkSize?: number;

  /**
   * Máximo de meses no futuro permitido (limite suave)
   * @default 60 (5 anos)
   */
  maxMonthsFuture?: number;

  /**
   * Duração do cache local em milissegundos (opcional)
   * @default 300000 (5 minutos)
   */
  cacheDuration?: number;
}