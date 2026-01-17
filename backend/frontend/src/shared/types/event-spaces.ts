/**
 * src/shared/types/event-spaces.ts
 * Tipos TypeScript para módulo de Event Spaces
 * Compatível 100% com backend eventController.ts
 * Versão: 15/01/2026
 */

import type { EventSpaceBooking, CreateEventSpaceBookingRequest } from './bookings';
import type { EventSpacePayment, EventSpaceSecurityDeposit } from './payments';

// ==================== EVENT SPACE ====================
/**
 * Representa um espaço para eventos dentro de um hotel
 * Exemplos: Sala de conferências, Banquete, Área exterior, Salão
 */
export interface EventSpace {
  id: string;
  hotelId: string; // Hotel ao qual pertence
  name: string; // (ex: "Grand Ballroom", "Conference Room A")
  slug?: string;
  description?: string | null;
  
  // Capacidade
  capacityMin: number; // Mínimo de pessoas
  capacityMax: number; // Máximo de pessoas
  areaSqm?: number | null; // Área em metros quadrados
  
  // Preços (várias estratégias)
  basePriceHourly?: string | null; // Por hora (ex: "50.00")
  basePriceHalfDay?: string | null; // Meia dia 4h (ex: "150.00")
  basePriceFullDay?: string | null; // Dia inteiro 8h (ex: "250.00")
  pricePerHour?: string | null;
  pricePerDay?: string | null;
  pricePerEvent?: string | null; // Preço fixo por evento
  weekendSurchargePercent?: number; // (ex: 20 = 20% mais caro)
  
  // Características Físicas
  spaceType?: string | null; // (ex: "conference", "banquet", "outdoor")
  ceilingHeight?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string | null; // (ex: "10m x 8m")
  loadingAccess?: boolean; // Acesso para descarregar equipamento
  dressingRooms?: number | null; // Salas de banho/vestiários
  
  // Segurança e Restrições
  securityDeposit?: string | null; // Depósito de segurança
  insuranceRequired?: boolean;
  maxDurationHours?: number | null; // Duração máxima
  minBookingHours?: number | null; // Duração mínima
  noiseRestriction?: string | null; // (ex: "até 22:00")
  alcoholAllowed?: boolean;
  
  // Serviços Incluídos
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  
  // Configuração
  approvalRequired?: boolean; // Booking precisa aprovação manual?
  
  // Media
  images: string[];
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  
  // Tipos de Eventos
  amenities: string[];
  eventTypes: string[];
  allowedEventTypes: string[];
  prohibitedEventTypes: string[];
  equipment?: Record<string, any>; // Equipamento disponível
  setupOptions: string[];
  
  // Metadados
  isActive: boolean;
  isFeatured?: boolean;
  rating: number; // 0-5
  totalReviews: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}


export interface CreateEventSpaceRequest {
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  
  // Preços
  base_price_hourly?: string | number;
  base_price_half_day?: string | number;
  base_price_full_day?: string | number;
  price_per_hour?: string | number;
  price_per_day?: string | number;
  price_per_event?: string | number;
  weekend_surcharge_percent?: number;
  
  // Características
  area_sqm?: number;
  space_type?: string;
  ceiling_height?: string | number;
  natural_light?: boolean;
  has_stage?: boolean;
  stage_dimensions?: string;
  loading_access?: boolean;
  dressing_rooms?: number;
  
  // Segurança
  security_deposit?: string | number;
  insurance_required?: boolean;
  max_duration_hours?: number;
  min_booking_hours?: number;
  noise_restriction?: string;
  alcohol_allowed?: boolean;
  
  // Serviços
  approval_required?: boolean;
  includes_catering?: boolean;
  includes_furniture?: boolean;
  includes_cleaning?: boolean;
  includes_security?: boolean;
  
  // Media
  images?: string[];
  floor_plan_image?: string;
  virtual_tour_url?: string;
  
  // Conteúdo
  amenities?: string[];
  event_types?: string[];
  allowed_event_types?: string[];
  prohibited_event_types?: string[];
  equipment?: Record<string, any>;
  setup_options?: string[];
  
  is_active?: boolean;
  is_featured?: boolean;
}

export interface UpdateEventSpaceRequest {
  name?: string;
  description?: string;
  capacity_min?: number;
  capacity_max?: number;
  base_price_hourly?: string | number;
  base_price_half_day?: string | number;
  base_price_full_day?: string | number;
  price_per_hour?: string | number;
  price_per_day?: string | number;
  price_per_event?: string | number;
  weekend_surcharge_percent?: number;
  area_sqm?: number;
  space_type?: string;
  ceiling_height?: string | number;
  natural_light?: boolean;
  has_stage?: boolean;
  stage_dimensions?: string;
  loading_access?: boolean;
  dressing_rooms?: number;
  security_deposit?: string | number;
  insurance_required?: boolean;
  max_duration_hours?: number;
  min_booking_hours?: number;
  noise_restriction?: string;
  alcohol_allowed?: boolean;
  approval_required?: boolean;
  includes_catering?: boolean;
  includes_furniture?: boolean;
  includes_cleaning?: boolean;
  includes_security?: boolean;
  images?: string[];
  floor_plan_image?: string;
  virtual_tour_url?: string;
  amenities?: string[];
  event_types?: string[];
  allowed_event_types?: string[];
  prohibited_event_types?: string[];
  equipment?: Record<string, any>;
  setup_options?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

// ==================== SEARCH ====================
export interface EventSpaceSearchParams {
  query?: string; // Busca por nome
  locality?: string; // Localidade
  province?: string; // Província
  eventDate?: string; // YYYY-MM-DD
  capacity?: number; // Mínimo de pessoas
  eventType?: string; // Tipo de evento
  maxPrice?: number; // Preço máximo
  amenities?: string[];
  hotelId?: string;
}

export interface EventSpaceSearchResult {
  space: EventSpace;
  hotel: {
    id: string;
    name: string;
    locality: string;
    province: string;
  };
  basePrice?: string;
  priceHalfDay?: string;
  priceFullDay?: string;
  pricePerHour?: string;
}

// ==================== AVAILABILITY ====================
/**
 * Disponibilidade de um espaço num dia específico
 * Por padrão, assume-se disponível se não houver bookings
 */
export interface EventSpaceAvailability {
  date: string; // YYYY-MM-DD
  eventSpaceId: string;
  isAvailable: boolean;
  stopSell: boolean; // Bloquear manualmente
  priceOverride?: string; // Preço especial para este dia
  minBookingHours?: number;
  slots?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:mm (ex: "09:00")
  endTime: string; // HH:mm (ex: "17:00")
  bookingId?: string;
  status?: string;
}

export interface CheckAvailabilityRequest {
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface CheckAvailabilityResponse {
  available: boolean;
  message?: string;
}

export interface AvailabilityStats {
  totalDays: number;
  availableDays: number;
  blockedDays: number;
  avgOccupancyPercent: number;
}

// ==================== CAPACITY ====================
/**
 * Verificação de capacidade para um evento
 */
export interface CheckCapacityRequest {
  expectedAttendees: number;
}

export interface CheckCapacityResponse {
  available: boolean;
  canAccommodate: boolean;
  message?: string;
}

// ==================== REVIEWS ====================
export interface EventSpaceReview {
  id: string;
  eventSpaceId: string;
  bookingId: string;
  organizerName: string;
  organizerEmail: string;
  eventType: string;
  attendeeCount: number;
  title: string;
  comment: string;
  ratings: {
    venue: number; // 1-5
    facilities: number;
    location: number;
    services: number;
    staff: number;
    value: number;
  };
  averageRating: number; // Média das 6 categorias
  pros?: string;
  cons?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  managerResponse?: string;
  managerResponseDate?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventSpaceReviewRequest {
  bookingId: string;
  title: string;
  comment: string;
  ratings: {
    venue: number;
    facilities: number;
    location: number;
    services: number;
    staff: number;
    value: number;
  };
  pros?: string;
  cons?: string;
}

export interface EventSpaceReviewStats {
  totalReviews: number;
  averageRating: number;
  categoryAverages: {
    venue: number;
    facilities: number;
    location: number;
    services: number;
    staff: number;
    value: number;
  };
  ratingDistribution: Record<number, number>;
  withResponses: number;
}

// ==================== PRICING ====================
/**
 * Cálculo de preço para uma reserva de espaço
 * Exemplo:
 * - Data: 20/01/2026 09:00 até 17:00 (8 horas)
 * - Preço por hora: 50 MZN
 * - Suplemento fim de semana: +20%
 * - Serviços adicionais: Catering (200 MZN), Limpeza (100 MZN)
 * 
 * Cálculo:
 * - Base: 50 × 8 = 400 MZN
 * - Fim de semana: 400 × 0.20 = 80 MZN
 * - Total base: 480 MZN
 * - Serviços: 300 MZN
 * - Total: 780 MZN
 */
export interface EventSpacePricing {
  eventSpaceId: string;
  startDatetime: string; // ISO datetime
  endDatetime: string; // ISO datetime
  durationHours: number;
  
  hourlyRate?: string;
  halfDayRate?: string;
  fullDayRate?: string;
  
  basePrice: string;
  weekendSurcharge?: string;
  securityDeposit?: string;
  equipmentFees?: string;
  serviceFees?: string;
  
  totalPrice: string;
}

export interface CalculateEventPriceRequest {
  startDatetime: string; // ISO datetime
  endDatetime: string; // ISO datetime
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
}

// ==================== BOOKINGS (Integração) ====================
export interface EventSpaceBookingData extends EventSpaceBooking {
  space?: EventSpace;
  hotel?: {
    id: string;
    name: string;
  };
  payment?: EventSpacePayment;
  securityDeposit?: EventSpaceSecurityDeposit;
}

// ==================== DASHBOARD ====================
/**
 * Resumo para proprietário com múltiplos espaços
 */
export interface EventSpacesDashboardSummary {
  totalSpaces: number;
  totalBookings: number;
  totalRevenue: string;
  avgOccupancyRate: number;
  avgRating: number;
  pendingApprovals: number; // Bookings pendentes de aprovação
  upcomingEvents: EventSpaceBooking[];
}

/**
 * Dashboard de um evento/espaço específico
 */
export interface EventDashboardStats {
  summary: {
    totalBookings: number;
    confirmedBookings: number;
    pendingApprovalBookings: number;
    cancelledBookings: number;
    totalRevenue: string;
  };
  upcomingEvents: Array<{
    booking: EventSpaceBooking;
    space: EventSpace;
  }>;
  spacesOverview: Array<{
    space: EventSpace;
    totalBookings: number;
    revenue: string;
  }>;
  pendingApprovalBookings: EventSpaceBooking[];
}

// ==================== RESPOSTAS API ====================
export interface EventSpaceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface EventSpacesListResponse {
  success: boolean;
  data: EventSpace[] | EventSpaceSearchResult[];
  count: number;
}

export interface EventSpaceDetailsResponse {
  success: boolean;
  data: {
    space: EventSpace;
    hotel: {
      id: string;
      name: string;
      locality: string;
    };
    pricing: {
      basePriceHourly?: string;
      basePriceHalfDay?: string;
      basePriceFullDay?: string;
    };
    availableForImmediateBooking: boolean;
    alcoholAllowed: boolean;
    maxCapacity: number;
    includesCatering: boolean;
    includesFurniture: boolean;
  };
}

// ==================== PAYMENT ====================
export interface EventSpacePaymentData {
  booking: EventSpaceBooking;
  payments: EventSpacePayment[];
  securityDeposit: EventSpaceSecurityDeposit;
  balance: {
    totalDue: string;
    totalPaid: string;
    balanceRemaining: string;
  };
}

