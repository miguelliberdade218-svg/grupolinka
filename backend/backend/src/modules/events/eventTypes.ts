// src/modules/events/eventTypes.ts - VERSÃO CORRIGIDA

export interface EventSpaceDetails {
  space: {
    id: string;
    hotelId: string;
    name: string;
    description: string | null;
    capacityMin: number;
    capacityMax: number;
    basePriceHourly: string | null;
    basePriceHalfDay: string | null;
    basePriceFullDay: string | null;
    pricePerHour: string | null;
    pricePerDay: string | null;
    pricePerEvent: string | null;
    weekendSurchargePercent: number | null;
    areaSqm: number | null;
    amenities: string[] | null;
    eventTypes: string[] | null;
    images: string[] | null;
    spaceType: string | null;
    ceilingHeight: string | null;
    naturalLight: boolean | null;
    hasStage: boolean | null;
    stageDimensions: string | null;
    loadingAccess: boolean | null;
    dressingRooms: number | null;
    securityDeposit: string | null;
    insuranceRequired: boolean | null;
    maxDurationHours: number | null;
    minBookingHours: number | null;
    noiseRestriction: string | null;
    alcoholAllowed: boolean | null;
    includesCatering: boolean | null;
    includesFurniture: boolean | null;
    includesCleaning: boolean | null;
    includesSecurity: boolean | null;
    floorPlanImage: string | null;
    virtualTourUrl: string | null;
    approvalRequired: boolean | null;
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
    distanceFromCenterKm: string | null;
    popularityScore: number | null;
    capacityTheater: number | null;
    capacityClassroom: number | null;
    capacityBanquet: number | null;
    capacityStanding: number | null;
    capacityCocktail: number | null;
    allowedEventTypes: string[] | null;
    prohibitedEventTypes: string[] | null;
    equipment: any;
    setupOptions: string[] | null;
  };
  hotel: any;
  basePrice?: string | null;
  priceHalfDay?: string | null;
  priceFullDay?: string | null;
  pricePerHour?: string | null;
}

export interface CreateEventSpaceInput {
  hotelId: string;
  name: string;
  description?: string;
  capacityMin: number;
  capacityMax: number;
  basePriceHourly?: string | null;
  basePriceHalfDay?: string | null;
  basePriceFullDay?: string | null;
  pricePerHour?: string | null;
  pricePerDay?: string | null;
  pricePerEvent?: string | null;
  weekendSurchargePercent?: number;
  areaSqm?: number | null;
  amenities?: string[] | null;
  eventTypes?: string[] | null;
  images?: string[] | null;
  spaceType?: string | null;
  ceilingHeight?: string | null;
  naturalLight?: boolean;
  hasStage?: boolean;
  stageDimensions?: string | null;
  loadingAccess?: boolean;
  dressingRooms?: number | null;
  securityDeposit?: string | null;
  insuranceRequired?: boolean;
  maxDurationHours?: number | null;
  minBookingHours?: number | null;
  noiseRestriction?: string | null;
  alcoholAllowed?: boolean;
  includesCatering?: boolean;
  includesFurniture?: boolean;
  includesCleaning?: boolean;
  includesSecurity?: boolean;
  floorPlanImage?: string | null;
  virtualTourUrl?: string | null;
  approvalRequired?: boolean;
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
  distanceFromCenterKm?: string | null;
  popularityScore?: number | null;
  capacityTheater?: number | null;
  capacityClassroom?: number | null;
  capacityBanquet?: number | null;
  capacityStanding?: number | null;
  capacityCocktail?: number | null;
  allowedEventTypes?: string[] | null;
  prohibitedEventTypes?: string[] | null;
  equipment?: any;
  setupOptions?: string[] | null;
}

// Tipo para criar reserva - deve corresponder EXATAMENTE ao serviço
export interface CreateEventBookingInput {
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string | undefined;  // ✅ CORRIGIDO: apenas string | undefined (não null)
  companyName?: string | undefined;     // ✅ CORRIGIDO: apenas string | undefined (não null)
  eventTitle: string;
  eventDescription?: string | undefined; // ✅ CORRIGIDO: apenas string | undefined
  eventType: string;
  startDatetime: string;
  endDatetime: string;
  expectedAttendees: number;
  specialRequests?: string | undefined;  // ✅ CORRIGIDO: apenas string | undefined
  additionalServices?: any;
  setupTimeStart?: string | undefined;   // ✅ CORRIGIDO: apenas string | undefined
  teardownTimeEnd?: string | undefined;  // ✅ CORRIGIDO: apenas string | undefined
  staffRequired?: number | undefined;
  setupConfiguration?: string | undefined;
  specialSetupRequirements?: string | undefined;
  cateringRequired?: boolean;
  avEquipmentRequired?: boolean;
  securityRequired?: boolean;
  cleaningRequired?: boolean;
  durationHours?: string;  // ✅ APENAS string
  basePrice?: string;      // ✅ APENAS string
  equipmentFees?: string | undefined;
  serviceFees?: string | undefined;
  weekendSurcharge?: string | undefined;
  securityDeposit?: string | undefined;
  totalPrice?: string;     // ✅ APENAS string
  depositPaid?: string | undefined;
  balanceDue?: string | undefined;
  userId?: string;
  status?: string;
  paymentStatus?: string;
  paymentReference?: string | undefined;
  invoiceNumber?: string | undefined;
  cancellationReason?: string | undefined;
  cancelledAt?: Date | undefined;
  confirmedAt?: Date | undefined;
  reminderSent?: boolean;
  lastReminderSent?: Date | undefined;
  reminderType?: string | undefined;
  reminderCount?: number | undefined;
  contractSigned?: boolean;
  contractUrl?: string | undefined;
  termsAccepted?: boolean;
}

export interface SearchEventSpaceResult {
  space: EventSpaceDetails['space'];
  hotel: any;
  basePrice?: string | null;
  priceHalfDay?: string | null;
  priceFullDay?: string | null;
  pricePerHour?: string | null;
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
  date: Date;
  isAvailable: boolean;
  stopSell: boolean;
  priceOverride?: string | null;
  minBookingHours?: number;
  slots?: TimeSlot[];
  createdAt?: Date;
  updatedAt?: Date;
}