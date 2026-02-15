// src/shared/types/event-spaces.ts
// VERSÃO FINAL CORRIGIDA - 12/02/2026
// ✅ CORREÇÃO CRÍTICA: Adicionado campo weekendSurcharge ao EventBooking
// ✅ CORREÇÃO: Alinhado com o backend (cálculo de diárias com surcharge)

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

  // Preços (diárias) - ✅ CORREÇÃO CRÍTICA: Adicionado pricePerDay
  pricePerDay?: string;           // ✅ CAMPO REAL DO BANCO (prioridade máxima)
  price_per_day?: string;         // ✅ snake_case para compatibilidade
  basePricePerDay: string;        // string para evitar problemas de precisão
  base_price_per_day?: string;    // snake_case para compatibilidade
  weekendSurchargePercent: number;
  weekend_surcharge_percent?: number; // snake_case para compatibilidade
  securityDeposit?: string | null;
  security_deposit?: string | null;

  // Catering
  offersCatering: boolean;
  offers_catering?: boolean;      // snake_case para compatibilidade
  cateringDiscountPercent: number;
  catering_discount_percent?: number; // snake_case para compatibilidade
  cateringMenuUrls: string[];
  catering_menu_urls?: string[];  // snake_case para compatibilidade

  // ✅ ADICIONADO: Amenities e equipamentos
  amenities: string[];           // ✅ ADICIONADO: Campo crítico que estava faltando
  amenities_list?: string[];    // ✅ ADICIONADO: Alias para compatibilidade
  equipment: Record<string, any>; // jsonb
  setupOptions: string[];
  setup_options?: string[];     // snake_case para compatibilidade

  // Configurações
  spaceType: string | null;
  space_type?: string | null;   // snake_case para compatibilidade
  naturalLight: boolean;
  natural_light?: boolean;      // snake_case para compatibilidade
  hasStage: boolean;
  has_stage?: boolean;          // snake_case para compatibilidade
  loadingAccess: boolean;
  loading_access?: boolean;     // snake_case para compatibilidade
  dressingRooms: number | null;
  dressing_rooms?: number | null; // snake_case para compatibilidade
  insuranceRequired: boolean;
  insurance_required?: boolean; // snake_case para compatibilidade
  alcoholAllowed: boolean;
  alcohol_allowed?: boolean;    // snake_case para compatibilidade
  approvalRequired: boolean;
  approval_required?: boolean;  // snake_case para compatibilidade
  noiseRestriction: string | null;
  noise_restriction?: string | null; // snake_case para compatibilidade

  // Capacidades por setup
  capacityTheater?: number | null;
  capacity_theater?: number | null; // snake_case para compatibilidade
  capacityClassroom?: number | null;
  capacity_classroom?: number | null; // snake_case para compatibilidade
  capacityBanquet?: number | null;
  capacity_banquet?: number | null; // snake_case para compatibilidade
  capacityStanding?: number | null;
  capacity_standing?: number | null; // snake_case para compatibilidade
  capacityCocktail?: number | null;
  capacity_cocktail?: number | null; // snake_case para compatibilidade

  // Restrições
  allowedEventTypes: string[];
  allowed_event_types?: string[]; // snake_case para compatibilidade
  prohibitedEventTypes: string[];
  prohibited_event_types?: string[]; // snake_case para compatibilidade

  // Mídia
  images: string[];
  floorPlanImage: string | null;
  floor_plan_image?: string | null; // snake_case para compatibilidade
  virtualTourUrl: string | null;
  virtual_tour_url?: string | null; // snake_case para compatibilidade

  // Status e metadados
  isActive: boolean;
  is_active?: boolean;          // snake_case para compatibilidade
  isFeatured: boolean;
  is_featured?: boolean;        // snake_case para compatibilidade
  slug: string;
  viewCount?: number;           // ✅ ADICIONADO: Contador de visualizações

  // Reviews e stats (calculados)
  rating?: number;
  average_rating?: number;      // ✅ ADICIONADO: snake_case para compatibilidade
  totalReviews?: number;
  review_count?: number;        // ✅ ADICIONADO: snake_case para compatibilidade
  total_bookings?: number;      // ✅ ADICIONADO: Total de reservas

  // ✅ CORREÇÃO: Campos de localização completos
  locality?: string | null;
  province?: string | null;
  location?: string | null;     // ✅ ADICIONADO: Campo de localização formatada
  lat?: string | null;
  lng?: string | null;
  location_id?: string | null;
  inherits_hotel_location?: boolean;

  createdAt: string;
  created_at?: string;          // snake_case para compatibilidade
  updatedAt: string;
  updated_at?: string;          // snake_case para compatibilidade

  // Campos extras úteis no frontend
  thumbnail?: string;           // primeira imagem
  mainImage?: string | null;    // ✅ ADICIONADO: Imagem principal
  termsAndRules?: string | null; // ✅ ADICIONADO: Termos e regras
  terms_and_rules?: string | null; // snake_case para compatibilidade

  // ✅ CORREÇÃO: Hotel com todos os campos necessários
  hotel?: {
    id?: string;               // ✅ ADICIONADO: ID do hotel (opcional)
    name: string;
    locality: string;
    province: string;
    address?: string | null;   // ✅ ADICIONADO: Endereço completo
    city?: string | null;      // ✅ ADICIONADO: Cidade
    lat?: string | null;
    lng?: string | null;
    location_id?: string | null;
    contact_phone?: string | null; // ✅ ADICIONADO: Telefone de contato
    contact_email?: string | null; // ✅ ADICIONADO: Email de contato
  } | null;

  // ✅ ADICIONADO: Campos específicos para detalhes
  facilities?: string[];
  accessibility_features?: string[];
  nearby_attractions?: string[];
  parking_info?: string | null;
  public_transport_info?: string | null;
  
  // ✅ ADICIONADO: Flags de disponibilidade
  available_for_immediate_booking?: boolean;
  is_favorite?: boolean;
  
  // ✅ ADICIONADO: Preços formatados
  formatted_base_price?: string;
  formatted_weekend_price?: string;
  formatted_security_deposit?: string;
}

// ==================== EVENT SPACE DATA (PARA DETALHES) ====================
export interface EventSpaceData extends EventSpace {
  // ✅ CORREÇÃO: Garantir que amenities esteja presente e seja array
  amenities: string[];
  
  // ✅ CORREÇÃO CRÍTICA: Garantir que pricePerDay esteja disponível
  pricePerDay?: string;
  price_per_day?: string;
  
  // ✅ ADICIONADO: Todos os campos extras de detalhes
  facilities?: string[];
  accessibility_features?: string[];
  nearby_attractions?: string[];
  parking_info?: string | null;
  public_transport_info?: string | null;
  
  average_rating?: number;
  review_count?: number;
  total_bookings?: number;
  is_favorite?: boolean;
  
  formatted_base_price?: string;
  formatted_weekend_price?: string;
  formatted_security_deposit?: string;
  
  // Aliases para compatibilidade
  amenitiesList?: string[];
}

// ==================== REQUESTS ====================
export interface CreateEventSpaceRequest {
  hotelId: string;
  name: string;
  description?: string | null;
  capacityMin: number;
  capacityMax: number;
  areaSqm?: number | null;
  
  // ✅ CORREÇÃO CRÍTICA: Adicionar pricePerDay na criação
  pricePerDay?: string | number;     // ✅ CAMPO REAL DO BANCO
  basePricePerDay: string | number;
  weekendSurchargePercent?: number;
  securityDeposit?: string | null;
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  
  // ✅ ADICIONADO: Amenities e equipamentos
  amenities?: string[];
  equipment?: Record<string, any>;
  setupOptions?: string[];
  
  spaceType?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  insuranceRequired?: boolean;
  alcoholAllowed?: boolean;
  approvalRequired?: boolean;
  noiseRestriction?: string | null;
  allowedEventTypes?: string[];
  prohibitedEventTypes?: string[];
  images?: string[];
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  
  // Campos de localização
  locality?: string | null;
  province?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  location_id?: string | null;
  inherits_hotel_location?: boolean;
}

export interface UpdateEventSpaceRequest extends Partial<CreateEventSpaceRequest> {
  id: string;
}

// ==================== SEARCH PARAMS ====================
export interface EventSpaceSearchParams {
  query?: string;
  locality?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  eventType?: string;
  maxPricePerDay?: number;
  amenities?: string[];
  hotelId?: string;
  minRating?: number;
  
  // ✅ ADICIONADO: Parâmetros de busca por proximidade
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: 'distance' | 'price' | 'capacity' | 'rating';
  useExactLocations?: boolean;
}

// ==================== EVENT BOOKING ====================
export interface EventBooking {
  id: string;
  eventSpaceId?: string;
  event_space_id?: string;     // snake_case para compatibilidade
  hotelId: string;
  hotel_id?: string;           // snake_case para compatibilidade
  organizerName: string;
  organizer_name?: string;     // snake_case para compatibilidade
  organizerEmail: string;
  organizer_email?: string;    // snake_case para compatibilidade
  organizerPhone?: string | null;
  organizer_phone?: string | null; // snake_case para compatibilidade
  eventTitle: string;
  event_title?: string;        // snake_case para compatibilidade
  eventDescription?: string | null;
  event_description?: string | null; // snake_case para compatibilidade
  eventType: string;
  event_type?: string;         // snake_case para compatibilidade
  
  startDate: string;
  start_date?: string;
  endDate: string;
  end_date?: string;
  
  durationDays: number;
  duration_days?: number;      // snake_case para compatibilidade
  expectedAttendees: number;
  expected_attendees?: number; // snake_case para compatibilidade
  cateringRequired: boolean;
  catering_required?: boolean; // snake_case para compatibilidade
  specialRequests?: string | null;
  special_requests?: string | null; // snake_case para compatibilidade
  additionalServices?: Record<string, any>;
  additional_services?: Record<string, any>; // snake_case para compatibilidade
  
  basePrice: string;
  base_price?: string;         // snake_case para compatibilidade
  // ✅ CORREÇÃO CRÍTICA: Adicionado weekendSurcharge (campo do backend)
  weekendSurcharge?: string;
  weekend_surcharge?: string;  // snake_case para compatibilidade
  totalPrice: string;
  total_price?: string;
  securityDeposit: string;
  security_deposit?: string;
  
  depositPaid: string;
  deposit_paid?: string;
  balanceDue: string;
  balance_due?: string;
  
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: PaymentStatusType;
  payment_status?: string;
  
  userId?: string;             // ✅ ADICIONADO: ID do usuário (Firebase UID)
  user_id?: string;            // snake_case para compatibilidade
  
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;

  dateRange?: string;
  statusDisplay?: string;
  
  payments?: BookingPayment[];
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
  userId?: string;
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

// ==================== EVENT SPACE DETAILS RESPONSE ====================
export interface EventSpaceDetailsResponse {
  space: EventSpaceData;
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
  amenities?: string[];
  
  // ✅ ADICIONADO: price_per_day no nível superior também
  price_per_day?: string;
}

// ==================== PAYMENT TYPES ====================
export type PaymentStatusType = 
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'failed'
  | 'cancelled'
  | 'processing';

export type BookingStatusType = 
  | 'pending_approval'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface ManualPaymentPayload {
  amount: number;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  referenceNumber: string;
  notes?: string;
}

export interface ManualPaymentRequest {
  amount: number;
  payment_method: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference: string;
  notes?: string;
  payment_type?: string;
}

export interface UpdatePaymentStatusRequest {
  status: PaymentStatusType;
  notes?: string;
}

export interface PaymentConfirmationRequest {
  paymentId: string;
  confirmedBy: string;
  notes?: string;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  booking_id?: string;
  amount: string;
  paymentMethod: string;
  payment_method?: string;
  referenceNumber: string;
  reference_number?: string;
  status: PaymentStatusType;
  paymentType: string;
  payment_type?: string;
  registeredBy?: string;
  registered_by?: string;
  confirmedBy?: string;
  confirmed_by?: string;
  paidAt: string | null;
  paid_at?: string | null;
  confirmedAt: string | null;
  confirmed_at?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
  notes?: string;
}

export interface BookingLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  created_at?: string;
  performedBy?: string;
  performed_by?: string;
}

export interface FullBookingDetails {
  booking: EventBooking;
  payments: BookingPayment[];
  logs: BookingLog[];
}

export interface PaymentDetailsResponse {
  bookingId: string;
  totalAmount: string;
  depositRequired: string;
  depositPaid: string;
  balanceDue: string;
  payments: BookingPayment[];
  paymentStatus: PaymentStatusType;
  lastPaymentDate?: string | null;
}

export interface DepositCalculation {
  bookingId: string;
  totalAmount: string;
  depositPercentage: number;
  depositAmount: string;
  minimumDeposit: string;
  requiredDeposit: string;
  alreadyPaid: string;
  remainingDeposit: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  bookingId: string;
  paymentId: string;
  amount: string;
  paymentMethod: string;
  referenceNumber: string;
  paidAt: string;
  issuedAt: string;
  issuedBy: string;
  notes?: string;
  qrCode?: string;
}

export interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  averageBookingValue: string;
  paymentMethods: {
    method: string;
    count: number;
    amount: string;
  }[];
  dailyRevenue: Array<{
    date: string;
    revenue: string;
    bookings: number;
  }>;
}

export interface PaymentAction {
  type: 'register' | 'confirm' | 'refund' | 'update_status';
  payload: any;
}

export interface PaymentRegisterData {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes?: string;
}

export interface PaymentConfirmData {
  paymentId: string;
  confirmedBy: string;
  notes?: string;
}

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle: string;
  balanceDue: number;
  onSuccess: () => void;
}

export interface PaymentCalculation {
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  depositRequired: number;
  alreadyPaid: number;
  remaining: number;
}

// ==================== NEARBY SEARCH ====================
export interface NearbyEventSpaceParams {
  lat: number;
  lng: number;
  radius?: number;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  eventType?: string;
  maxPricePerDay?: number;
  amenities?: string[];
  minRating?: number;
  useExactLocations?: boolean;
}

// ==================== CALENDAR ====================
export interface EventSpaceCalendarDay {
  date: string;
  isAvailable: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  priceOverride?: number | null;
  bookingId?: string | null;
}

export interface EventSpaceCalendarResponse {
  success: boolean;
  data: EventSpaceCalendarDay[];
  count: number;
  message?: string;
}

// ==================== STATS ====================
export interface EventSpaceStats {
  totalViews: number;
  totalBookings: number;
  totalRevenue: string;
  averageRating: number;
  bookingRate: number;
  popularEventTypes: Array<{
    eventType: string;
    count: number;
  }>;
}

export interface HotelEventStats {
  totalSpaces: number;
  activeSpaces: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingApprovals: number;
  totalRevenue: string;
  averageOccupancyRate: number;
}

// ==================== TYPE GUARDS ====================
// ✅ ADICIONADO: Type guards para verificar campos
export function hasPricePerDay(space: any): space is { pricePerDay: string } {
  return space && typeof space.pricePerDay !== 'undefined' && space.pricePerDay !== null;
}

export function hasBasePricePerDay(space: any): space is { basePricePerDay: string } {
  return space && typeof space.basePricePerDay !== 'undefined' && space.basePricePerDay !== null;
}

export function hasAmenities(space: any): space is { amenities: string[] } {
  return space && Array.isArray(space.amenities);
}

export function hasEquipmentAmenities(space: any): space is { equipment: { amenities: string[] } } {
  return space?.equipment && Array.isArray(space.equipment.amenities);
}

// ✅ CORREÇÃO: Type guard para verificar se tem weekendSurcharge
export function hasWeekendSurcharge(booking: any): booking is { weekendSurcharge: string } {
  return booking && typeof booking.weekendSurcharge !== 'undefined' && booking.weekendSurcharge !== null;
}