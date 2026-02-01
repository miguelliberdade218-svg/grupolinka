// src/modules/events/eventTypes.ts - VERSÃO CORRIGIDA (SISTEMA DE DIÁRIAS)

export interface EventSpaceDetails {
  space: {
    id: string;
    hotelId: string;
    name: string;
    description: string | null;
    capacityMin: number;
    capacityMax: number;
    // ✅ CORREÇÃO: Campo correto para sistema diário
    basePricePerDay: string;
    weekendSurchargePercent: number | null;
    areaSqm: number | null;
    amenities: string[] | null;
    allowedEventTypes: string[] | null;
    prohibitedEventTypes: string[] | null;
    images: string[] | null;
    spaceType: string | null;
    naturalLight: boolean | null;
    hasStage: boolean | null;
    loadingAccess: boolean | null;
    dressingRooms: number | null;
    securityDeposit: string | null;
    insuranceRequired: boolean | null;
    noiseRestriction: string | null;
    alcoholAllowed: boolean | null;
    floorPlanImage: string | null;
    virtualTourUrl: string | null;
    approvalRequired: boolean | null;
    // ✅ CORREÇÃO: Campos de catering (sistema diário)
    offersCatering: boolean;
    cateringDiscountPercent: number;
    cateringMenuUrls: string[];
    equipment: any;
    setupOptions: string[] | null;
    slug: string | null;
    isActive: boolean | null;
    isFeatured: boolean | null;
    viewCount: number | null;
    averageRating: string | null;
    bookingCount: number | null;
    lastBookedDate: Date | null;
    managedByHotelManagerId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    lat: string | null;
    lng: string | null;
    locationGeom: any;
    capacityTheater: number | null;
    capacityClassroom: number | null;
    capacityBanquet: number | null;
    capacityStanding: number | null;
    capacityCocktail: number | null;
    mainImage: string | null;
    termsAndRules: string | null;
    // ✅ REMOVIDO: Campos do sistema horário
    // basePriceHourly: string | null;
    // basePriceHalfDay: string | null;
    // basePriceFullDay: string | null;
    // pricePerHour: string | null;
    // pricePerDay: string | null;
    // pricePerEvent: string | null;
    // ceilingHeight: string | null;
    // stageDimensions: string | null;
    // maxDurationHours: number | null;
    // minBookingHours: number | null;
    // includesCatering: boolean | null;
    // includesFurniture: boolean | null;
    // includesCleaning: boolean | null;
    // includesSecurity: boolean | null;
    // distanceFromCenterKm: string | null;
    // popularityScore: number | null;
  };
  hotel: any;
  basePrice?: string | null;
  // ✅ REMOVIDO: Campos do sistema horário
  // priceHalfDay?: string | null;
  // priceFullDay?: string | null;
  // pricePerHour?: string | null;
}

export interface CreateEventSpaceInput {
  hotelId: string;
  name: string;
  description?: string;
  capacityMin: number;
  capacityMax: number;
  // ✅ CORREÇÃO: Campo correto para sistema diário
  basePricePerDay: string;
  weekendSurchargePercent?: number;
  areaSqm?: number | null;
  amenities?: string[] | null;
  allowedEventTypes?: string[] | null;
  prohibitedEventTypes?: string[] | null;
  images?: string[] | null;
  spaceType?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  securityDeposit?: string | null;
  insuranceRequired?: boolean;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean;
  // ✅ CORREÇÃO: Campos de catering (sistema diário)
  offersCatering?: boolean;
  cateringDiscountPercent?: number;
  cateringMenuUrls?: string[];
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  approvalRequired?: boolean;
  equipment?: any;
  setupOptions?: string[] | null;
  slug?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  viewCount?: number | null;
  averageRating?: string | null;
  bookingCount?: number | null;
  lastBookedDate?: Date | null;
  managedByHotelManagerId?: string | null;
  lat?: string | null;
  lng?: string | null;
  capacityTheater?: number | null;
  capacityClassroom?: number | null;
  capacityBanquet?: number | null;
  capacityStanding?: number | null;
  capacityCocktail?: number | null;
  mainImage?: string | null;
  termsAndRules?: string | null;
  // ✅ REMOVIDO: Campos do sistema horário
  // basePriceHourly?: string | null;
  // basePriceHalfDay?: string | null;
  // basePriceFullDay?: string | null;
  // pricePerHour?: string | null;
  // pricePerDay?: string | null;
  // pricePerEvent?: string | null;
  // ceilingHeight?: string | null;
  // stageDimensions?: string | null;
  // maxDurationHours?: number | null;
  // minBookingHours?: number | null;
  // includesCatering?: boolean;
  // includesFurniture?: boolean;
  // includesCleaning?: boolean;
  // includesSecurity?: boolean;
  // distanceFromCenterKm?: string | null;
  // popularityScore?: number | null;
}

// ✅ CORREÇÃO COMPLETA: Tipo para criar reserva no SISTEMA DE DIÁRIAS
export interface CreateEventBookingInput {
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string | undefined;
  eventTitle: string;
  eventDescription?: string | undefined;
  eventType: string;
  // ✅ CORREÇÃO: Usar startDate e endDate (sistema diário)
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  expectedAttendees: number;
  specialRequests?: string | undefined;
  additionalServices?: any;
  // ✅ CORREÇÃO: Campo cateringRequired (sistema diário)
  cateringRequired?: boolean;
  durationDays?: string;
  basePrice?: string;
  totalPrice?: string;
  securityDeposit?: string | undefined;
  depositPaid?: string | undefined;
  balanceDue?: string | undefined;
  userId?: string;
  // ✅ CORREÇÃO: Status controlado pelo backend
  status?: 'pending_approval' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string | undefined;
  invoiceNumber?: string | undefined;
  cancellationReason?: string | undefined;
  cancelledAt?: Date | undefined;
  confirmedAt?: Date | undefined;
  // ✅ REMOVIDO: Campos do sistema horário
  // startDatetime: string;
  // endDatetime: string;
  // companyName?: string | undefined;
  // setupTimeStart?: string | undefined;
  // teardownTimeEnd?: string | undefined;
  // staffRequired?: number | undefined;
  // setupConfiguration?: string | undefined;
  // specialSetupRequirements?: string | undefined;
  // avEquipmentRequired?: boolean;
  // securityRequired?: boolean;
  // cleaningRequired?: boolean;
  // equipmentFees?: string | undefined;
  // serviceFees?: string | undefined;
  // weekendSurcharge?: string | undefined;
  // reminderSent?: boolean;
  // lastReminderSent?: Date | undefined;
  // reminderType?: string | undefined;
  // reminderCount?: number | undefined;
  // contractSigned?: boolean;
  // contractUrl?: string | undefined;
  // termsAccepted?: boolean;
}

// ✅ CORREÇÃO: Interface para EventBooking completo (usado em queries)
export interface EventBookingType {
  id: string;
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  eventTitle: string;
  eventDescription?: string;
  eventType: string;
  // ✅ CORREÇÃO: Campos de data no sistema diário
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  durationDays: number;
  expectedAttendees: number;
  specialRequests?: string;
  additionalServices?: any;
  // ✅ CORREÇÃO: Campo cateringRequired
  cateringRequired: boolean;
  basePrice: string;
  totalPrice: string;
  securityDeposit: string;
  depositPaid: string;
  balanceDue: string;
  status: 'pending_approval' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  invoiceNumber?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  // ✅ REMOVIDO: Campos do sistema horário
  // startDatetime: string;
  // endDatetime: string;
  // equipmentFees: string;
  // serviceFees: string;
  // weekendSurcharge: string;
}

export interface SearchEventSpaceResult {
  space: EventSpaceDetails['space'];
  hotel: any;
  // ✅ CORREÇÃO: Preço no sistema diário
  basePricePerDay?: string;
  // ✅ REMOVIDO: Campos do sistema horário
  // basePrice?: string | null;
  // priceHalfDay?: string | null;
  // priceFullDay?: string | null;
  // pricePerHour?: string | null;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  bookingId?: string;
  status?: string;
}

export interface EventAvailability {
  id?: string;
  eventSpaceId: string;
  date: Date | string;  // ✅ Aceita Date ou string (YYYY-MM-DD)
  isAvailable: boolean;
  stopSell: boolean;
  priceOverride?: string | null;
  // ✅ CORREÇÃO CRÍTICA: Mudado para minBookingHoursDefault (consistente com banco)
  minBookingHoursDefault?: number;  // ✅ CORREÇÃO: "Default" adicionado
  slots?: TimeSlot[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ ADICIONADO: Interface para resposta de criação de booking
export interface CreateEventBookingResponse {
  success: boolean;
  message: string;
  data?: EventBookingType;
}

// ✅ ADICIONADO: Interface para pagamento manual de evento
export interface ManualEventPaymentInput {
  amount: number;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference: string;
  notes?: string;
  paymentType?: string;
}

// ✅ ADICIONADO: Interface para confirmação de booking
export interface ConfirmEventBookingInput {
  bookingId: string;
  notes?: string;
  confirmedBy: string;
}

// ✅ ADICIONADO: Interface para resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}