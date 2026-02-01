// src/shared/types/event-spaces.ts
// VERSÃO CORRIGIDA E ALINHADA COM REALIDADE DA APP - 26/01/2026
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
  
  // ✅ CORREÇÃO CRÍTICA: ADICIONAR AMBOS FORMATOS PARA COMPATIBILIDADE
  startDate: string;           // YYYY-MM-DD - camelCase para frontend
  start_date?: string;         // YYYY-MM-DD - snake_case do backend (opcional)
  endDate: string;             // YYYY-MM-DD - camelCase para frontend
  end_date?: string;           // YYYY-MM-DD - snake_case do backend (opcional)
  
  durationDays: number;
  expectedAttendees: number;
  cateringRequired: boolean;
  specialRequests?: string | null;
  additionalServices?: Record<string, any>;
  basePrice: string;
  totalPrice: string;
  total_price?: string;        // ✅ ADICIONADO: para compatibilidade com backend
  securityDeposit: string;
  
  // ✅ CORREÇÃO: CAMPOS FINANCEIROS ADICIONADOS
  depositPaid: string;      // ✅ ADICIONADO: depósito já pago
  balanceDue: string;       // ✅ ADICIONADO: saldo pendente
  
  // ✅ CORREÇÃO: Status atualizado para incluir 'in_progress' e 'completed'
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: PaymentStatusType; // ✅ ALTERADO: usa o tipo completo
  
  createdAt: string;
  updatedAt: string;

  // Campos calculados/display
  dateRange?: string;
  statusDisplay?: string;
  
  // ✅ CORREÇÃO: CAMPOS DO BACKEND (snake_case para compatibilidade)
  deposit_paid?: string;
  balance_due?: string;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
  
  // ✅ CORREÇÃO: CAMPOS DE COMPATIBILIDADE ADICIONAIS
  event_title?: string;                // Para compatibilidade com backend
  organizer_name?: string;             // Para compatibilidade com backend
  organizer_email?: string;            // Para compatibilidade com backend
  expected_attendees?: number;         // Para compatibilidade com backend
  
  // Campo para compatibilidade com getFullBookingDetails
  payments?: BookingPayment[];
}

// ✅ CORREÇÃO: Interface EventBookingRequest atualizada para compatibilidade
export interface EventBookingRequest {
  eventSpaceId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  
  // ✅ CORREÇÃO: Usar ambos formatos para compatibilidade
  startDate: string;      // YYYY-MM-DD - camelCase
  start_date?: string;    // YYYY-MM-DD - snake_case (opcional)
  endDate: string;        // YYYY-MM-DD - camelCase
  end_date?: string;      // YYYY-MM-DD - snake_case (opcional)
  
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

// ==================== 🆕 NOVOS TIPOS PARA GESTÃO DE RESERVAS E PAGAMENTOS ====================

// ✅ CORREÇÃO: BookingStatusType atualizado para incluir status completos
export type BookingStatusType = 
  | 'pending_approval' 
  | 'confirmed' 
  | 'in_progress'        // ✅ ADICIONADO: Evento em andamento
  | 'completed'          // ✅ ADICIONADO: Evento concluído
  | 'cancelled' 
  | 'rejected';

// ✅ CORREÇÃO: PaymentStatusType COMPLETO
export type PaymentStatusType = 
  | 'pending'           // Aguardando pagamento
  | 'confirmed'         // Pagamento confirmado manualmente pelo gestor
  | 'paid'              // Pagamento completo
  | 'partial'           // Pagamento parcial
  | 'refunded'          // Reembolsado
  | 'failed'            // Falhou (gateway rejeitou)
  | 'cancelled'         // Cancelado
  | 'processing';       // Em processamento (para gateways)

export interface ManualPaymentPayload {
  amount: number;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  referenceNumber: string;
  notes?: string;
}

// ✅ CORREÇÃO: TIPOS PARA REQUESTS DE PAGAMENTO
export interface ManualPaymentRequest {
  amount: number;
  payment_method: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference: string;
  notes?: string;
  payment_type?: string; // 'manual_event_payment' conforme backend
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

// ✅ CORREÇÃO: BookingPayment COMPLETO PARA REFLETIR O BACKEND
export interface BookingPayment {
  id: string;
  bookingId: string;
  amount: string;                    // Decimal como string
  paymentMethod: string;             // 'mpesa', 'bank_transfer', etc.
  referenceNumber: string;
  status: PaymentStatusType;
  paymentType: string;               // 'manual_event_payment', 'deposit', etc.
  registeredBy?: string;             // ID do usuário que registrou
  confirmedBy?: string;              // ID do usuário que confirmou
  paidAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  
  // Campos do backend (snake_case para compatibilidade)
  payment_method?: string;
  reference_number?: string;
  payment_type?: string;
  registered_by?: string;
  confirmed_by?: string;
  paid_at?: string | null;
  confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BookingLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  performedBy?: string;
}

export interface FullBookingDetails {
  booking: EventBooking;
  payments: BookingPayment[];
  logs: BookingLog[];
}

// ✅ CORREÇÃO: TIPOS PARA RESPONSES DE PAGAMENTO
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
  qrCode?: string; // Base64 para QR code
}

// ✅ CORREÇÃO: TIPOS PARA FINANCIAL SUMMARY
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

// ✅ CORREÇÃO: TIPOS PARA AÇÕES DE PAGAMENTO
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

// Tipos para modais/diálogos
export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle: string;
  balanceDue: number;
  onSuccess: () => void;
}

// Tipos para cálculos
export interface PaymentCalculation {
  subtotal: number;
  taxes: number;
  fees: number;
  total: number;
  depositRequired: number;
  alreadyPaid: number;
  remaining: number;
}