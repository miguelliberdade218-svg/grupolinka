/**
 * src/shared/types/event-spaces-unified.ts
 * TIPOS UNIFICADOS PARA EVENT SPACES
 * ✅ Compatível com backend eventController.ts
 * ✅ Resolve todas as incompatibilidades
 * ✅ Sistema de diárias (startDate/endDate)
 * Versão: 25/01/2026
 */

// ==================== TIPOS PRINCIPAIS ====================

/**
 * Espaço de evento - Formato FRONTEND (camelCase)
 */
export interface EventSpace {
  id: string;
  hotelId: string;
  name: string;
  slug?: string;
  description?: string | null;
  
  // Capacidade
  capacityMin: number;
  capacityMax: number;
  areaSqm?: number | null;
  
  // ✅ SISTEMA DE DIÁRIAS
  basePricePerDay?: string | null;
  weekendSurchargePercent?: number;
  
  // Características Físicas
  spaceType?: string | null;
  ceilingHeight?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string | null;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  
  // Segurança e Restrições
  securityDeposit?: string | null;
  insuranceRequired?: boolean;
  maxDurationHours?: number | null;
  minBookingHours?: number | null;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean;
  
  // Serviços
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  approvalRequired?: boolean;
  
  // ✅ NOVOS CAMPOS DO BACKEND
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  
  // Media
  images: string[];
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  
  // Tipos de Eventos
  amenities: string[];
  eventTypes: string[];
  allowedEventTypes: string[];
  prohibitedEventTypes: string[];
  equipment?: Record<string, any>;
  setupOptions: string[];
  
  // Metadados
  isActive: boolean;
  isFeatured?: boolean;
  rating: number;
  totalReviews: number;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Espaço de evento - Formato BACKEND (snake_case)
 * Para comunicação direta com API
 */
export interface EventSpaceBackend {
  id: string;
  hotel_id: string;
  name: string;
  slug?: string;
  description?: string | null;
  capacity_min: number;
  capacity_max: number;
  area_sqm?: number | null;
  base_price_per_day?: string | null;
  weekend_surcharge_percent?: number;
  space_type?: string | null;
  ceiling_height?: string | null;
  natural_light: boolean;
  has_stage: boolean;
  stage_dimensions?: string | null;
  loading_access: boolean;
  dressing_rooms?: number | null;
  security_deposit?: string | null;
  insurance_required: boolean;
  max_duration_hours?: number | null;
  min_booking_hours?: number | null;
  noise_restriction?: string | null;
  alcohol_allowed: boolean;
  includes_catering: boolean;
  includes_furniture: boolean;
  includes_cleaning: boolean;
  includes_security: boolean;
  approval_required: boolean;
  offers_catering?: boolean;
  catering_discount_percent?: number;
  catering_menu_urls?: string[];
  images: string[];
  floor_plan_image?: string | null;
  virtual_tour_url?: string | null;
  amenities: string[];
  event_types: string[];
  allowed_event_types: string[];
  prohibited_event_types: string[];
  equipment?: Record<string, any>;
  setup_options: string[];
  is_active: boolean;
  is_featured: boolean;
  rating: number;
  total_reviews: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

// ==================== REQUESTS ====================

/**
 * Criar espaço de evento - Formato FRONTEND
 */
export interface CreateEventSpaceRequest {
  hotelId: string; // ✅ camelCase
  name: string;
  description?: string;
  capacityMin: number;
  capacityMax: number;
  basePricePerDay?: string | number;
  weekendSurchargePercent?: number;
  areaSqm?: number;
  spaceType?: string;
  ceilingHeight?: string | number;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string;
  loadingAccess?: boolean;
  dressingRooms?: number;
  securityDeposit?: string | number;
  insuranceRequired?: boolean;
  maxDurationHours?: number;
  minBookingHours?: number;
  noiseRestriction?: string;
  alcoholAllowed?: boolean;
  approvalRequired?: boolean;
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  images?: string[];
  floorPlanImage?: string;
  virtualTourUrl?: string;
  amenities?: string[];
  eventTypes?: string[];
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  equipment?: Record<string, any>;
  setupOptions?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

/**
 * Criar espaço de evento - Formato BACKEND (para API)
 */
export interface CreateEventSpaceBackendRequest {
  hotel_id: string; // ✅ snake_case
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  base_price_per_day?: string | number;
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
  offers_catering?: boolean;
  catering_discount_percent?: number;
  catering_menu_urls?: string[];
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

/**
 * Atualizar espaço de evento
 */
export interface UpdateEventSpaceRequest {
  name?: string;
  description?: string;
  capacityMin?: number;
  capacityMax?: number;
  basePricePerDay?: string | number;
  weekendSurchargePercent?: number;
  areaSqm?: number;
  spaceType?: string;
  ceilingHeight?: string | number;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string;
  loadingAccess?: boolean;
  dressingRooms?: number;
  securityDeposit?: string | number;
  insuranceRequired?: boolean;
  maxDurationHours?: number;
  minBookingHours?: number;
  noiseRestriction?: string;
  alcoholAllowed?: boolean;
  approvalRequired?: boolean;
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  images?: string[];
  floorPlanImage?: string;
  virtualTourUrl?: string;
  amenities?: string[];
  eventTypes?: string[];
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  equipment?: Record<string, any>;
  setupOptions?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

// ==================== SEARCH ====================

export interface EventSpaceSearchParams {
  query?: string;
  locality?: string;
  province?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  capacity?: number;
  eventType?: string;
  maxPricePerDay?: number;
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
  basePricePerDay?: string;
  weekendSurchargePercent?: number;
}

// ==================== BOOKINGS ====================

export interface EventSpaceBooking {
  id: string;
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: Record<string, any>;
  basePrice?: string;
  totalPrice?: string;
  securityDeposit?: string;
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentReference?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventSpaceBookingRequest {
  eventSpaceId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: Record<string, any>;
  userId?: string;
}

// ==================== RESPONSES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  message?: string;
  error?: string;
}

export interface EventSpaceWithHotel {
  space: EventSpace;
  hotel: {
    id: string;
    name: string;
    locality: string;
    province: string;
  };
  basePricePerDay?: string;
  weekendSurchargePercent?: number;
}

// ==================== DASHBOARD ====================

export interface EventSpacesDashboardSummary {
  totalSpaces: number;
  activeSpaces: number;
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: string;
  revenueThisMonth: string;
  avgOccupancyRate: number;
  avgRating: number;
  pendingApprovals: number;
  upcomingEvents: EventSpaceBooking[];
}

export interface EventSpaceStats {
  spaceId: string;
  spaceName: string;
  totalBookings: number;
  revenue: string;
  occupancyRate: number;
  avgRating: number;
}

// ==================== UTILITY TYPES ====================

export type ServiceResponse<T> = ListResponse<T> | { success: false; error: string };

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}