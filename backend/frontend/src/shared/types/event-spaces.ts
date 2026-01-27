// src/shared/types/event-spaces.ts
// VERSÃO COMPLETA E ALINHADA COM SCHEMA.TS (25/01/2026)
// Usa camelCase para frontend, reflete exatamente o backend

// ==================== EVENT SPACE ====================
export interface EventSpace {
  id: string;
  hotelId: string;                // camelCase para frontend
  hotel_id: string;               // snake_case do backend (opcional, para compatibilidade)

  name: string;
  description: string | null;

  // Capacidade
  capacityMin: number;
  capacityMax: number;
  areaSqm: number | null;

  // Preços (diárias)
  basePricePerDay: string;        // string para evitar problemas de precisão
  weekendSurchargePercent: number;

  // Catering
  offersCatering: boolean;
  cateringDiscountPercent: number;
  cateringMenuUrls: string[];

  // Configurações
  spaceType: string | null;
  naturalLight: boolean;
  hasStage: boolean;
  loadingAccess: boolean;
  dressingRooms: number | null;
  insuranceRequired: boolean;
  alcoholAllowed: boolean;
  approvalRequired: boolean;
  noiseRestriction: string | null;
  securityDeposit?: string | null; // ✅ ADICIONADO: conforme schema real

  // Capacidades por setup
  capacityTheater?: number | null;
  capacityClassroom?: number | null;
  capacityBanquet?: number | null;
  capacityStanding?: number | null;
  capacityCocktail?: number | null;

  // Equipamentos e setups
  equipment: Record<string, any>; // jsonb
  setupOptions: string[];

  // Restrições
  allowedEventTypes: string[];
  prohibitedEventTypes: string[];

  // Mídia
  images: string[];
  floorPlanImage: string | null;
  virtualTourUrl: string | null;

  // Status e metadados
  isActive: boolean;
  isFeatured: boolean;
  slug: string;

  // Reviews e stats (calculados)
  rating?: number;
  totalReviews?: number;

  createdAt: string;
  updatedAt: string;

  // Campos extras úteis no frontend
  thumbnail?: string;             // primeira imagem
  location?: string;              // locality + province
  hotel?: {
    name: string;
    locality: string;
    province: string;
  } | null;
}

// ==================== REQUESTS ====================
export interface CreateEventSpaceRequest {
  hotelId: string;
  name: string;
  description?: string | null;
  capacityMin: number;
  capacityMax: number;
  areaSqm?: number | null;
  basePricePerDay: string | number;
  weekendSurchargePercent?: number;
  spaceType?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  insuranceRequired?: boolean;
  alcoholAllowed?: boolean;
  approvalRequired?: boolean;
  noiseRestriction?: string | null;
  securityDeposit?: string | null; // ✅ ADICIONADO: conforme schema real
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  equipment?: Record<string, any>;
  setupOptions?: string[];
  images?: string[];
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateEventSpaceRequest extends Partial<CreateEventSpaceRequest> {
  id: string; // obrigatório para update
}

// ==================== SEARCH PARAMS ====================
export interface EventSpaceSearchParams {
  query?: string;
  locality?: string;
  province?: string;
  startDate?: string;          // YYYY-MM-DD
  endDate?: string;            // YYYY-MM-DD
  capacity?: number;
  eventType?: string;
  maxPricePerDay?: number;
  amenities?: string[];
  hotelId?: string;
}

// ==================== EVENT BOOKING ====================
export interface EventBooking {
  id: string;
  eventSpaceId?: string;      // CORREÇÃO: Tornado opcional para compatibilidade
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string | null;
  eventTitle: string;
  eventDescription?: string | null;
  eventType: string;
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  durationDays: number;
  expectedAttendees: number;
  cateringRequired: boolean;
  specialRequests?: string | null;
  additionalServices?: Record<string, any>;
  basePrice: string;
  totalPrice: string;
  securityDeposit: string;
  status: 'pending_approval' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  createdAt: string;
  updatedAt: string;

  // Campos calculados/display
  dateRange?: string;
  statusDisplay?: string;
}

export interface EventBookingRequest {
  eventSpaceId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  expectedAttendees: number;
  cateringRequired?: boolean;
  specialRequests?: string;
  additionalServices?: Record<string, any>;
  userId?: string; // CORREÇÃO: Adicionado para compatibilidade
}

// ==================== AVAILABILITY ====================
export interface EventAvailabilityCheck {
  eventSpaceId: string;
  startDate: string;
  endDate: string;
}

export interface EventAvailabilityResponse {
  success: boolean;
  isAvailable: boolean;
  message?: string;
}

// ==================== REVIEWS ====================
export interface EventSpaceReview {
  id: string;
  eventSpaceId: string;
  bookingId: string;
  userId: string;
  userName?: string;
  venueRating: number;
  facilitiesRating: number;
  locationRating: number;
  servicesRating: number;
  staffRating: number;
  valueRating: number;
  overallRating: number;
  title: string;
  comment: string;
  pros?: string | null;
  cons?: string | null;
  helpfulVotes: number;
  reportCount: number;
  organizerResponse?: string | null;
  organizerResponseAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  isPublished: boolean;
}

export interface EventSpaceReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

// ==================== SEARCH RESPONSE ====================
export interface EventSpaceSearchResponse {
  success: boolean;
  data: EventSpace[];
  count: number;
  error?: string;
}

// ==================== BOOKING RESPONSE ====================
export interface EventBookingResponse {
  success: boolean;
  data?: EventBooking;
  message?: string;
  error?: string;
}

// ==================== DASHBOARD ====================
export interface EventDashboardSummary {
  totalSpaces: number;
  upcomingEvents: number;
  todayEvents: number;
  totalRevenueThisMonth: number;
  occupancyRate: number;
  pendingApprovals: number;
}

// ==================== EVENT SPACE DETAILS ====================
export interface EventSpaceDetails {
  space: EventSpace;
  hotel: any;
  base_price_per_day: string;
  weekend_surcharge_percent: number;
  available_for_immediate_booking: boolean;
  alcohol_allowed: boolean;
  max_capacity: number;
  offers_catering: boolean;
  catering_discount_percent: number;
  catering_menu_urls: string[];
  security_deposit: string;
}