// src/services/apiService.ts - VERSÃO CORRIGIDA 16/02/2026
// ✅ CORREÇÃO COMPLETA: Todas as rotas /api/v2/hotels substituídas por /api/hotels
// ✅ CORREÇÃO: Funções de normalização de status de hotel adicionadas
// ✅ CORREÇÃO: Métodos de booking atualizados para usar rotas corretas
// ✅ CORREÇÃO: Tipo EventSpaceDetails corrigido para EventSpaceDetailsResponse
// ✅ CORREÇÃO CRÍTICA: Método getEventSpaceDetails corrigido para acessar res.data.space corretamente
// ✅ CORREÇÃO 3: Normalização de Dados na API - campos de localização, amenities e preços adicionados
// ✅ CORREÇÃO CRÍTICA: Adicionado suporte para pricePerDay (campo real do banco)
// ✅ NOVO: Método debugEventSpaceData adicionado para diagnóstico
// Mantém rides e events intactos
// ✅ NOVO: Métodos para fotos de hotéis (room type photos) adicionados
// ✅ NOVO: Métodos para fotos de event spaces adicionados
// ✅ CORREÇÃO CRÍTICA: Adicionada detecção de FormData no método request para uploads funcionarem

import { auth } from '@/shared/lib/firebaseConfig';
import { formatDateOnly, formatTimeOnly, formatLongDate, formatWeekday, formatDateTime } from '../utils/dateFormatter';

// ====================== IMPORTAÇÕES DOS TIPOS ======================
import {
  Hotel,
  RoomType,
  HotelCreateRequest,
  HotelUpdateRequest,
  RoomTypeCreateRequest,
  RoomTypeUpdateRequest,
  BulkAvailabilityUpdate,
  HotelOperationResponse,
  HotelListResponse,
  RoomTypeListResponse,
  HotelStatistics,
  HotelPerformance,
  SearchParams,
  SearchResponse,
  HotelSearchResponse,
  AvailabilityCheck,
  NightlyPrice,
  AvailabilityResponse,
  HotelBookingRequest,
  HotelBookingResponse,
  HotelBookingData,
  MyHotelBookingsResponse,
  BookingStatus,
  PaymentStatus,
  ChatMessage,
  ChatThread,
  SendMessageRequest,
  SendMessageResponse,
  Notification,
  NotificationsResponse,
  UploadResponse,
  ApiResponse,
  HotelByIdResponse,
  RoomTypesResponse,
  Ride as LocalRide,
  RideSearchParams as LocalRideSearchParams,
  MatchStats as LocalMatchStats,
  RideSearchResponse as LocalRideSearchResponse,
  RideBookingRequest as LocalRideBookingRequest,
  Booking,
} from '../types/index';

// ====================== TIPOS ESPECÍFICOS PARA EVENTS (IMPORTADOS DO SHARED/TYPES) ======================
import {
  EventSpace,
  EventSpaceSearchParams,
  EventSpaceSearchResponse,
  EventAvailabilityCheck,
  EventAvailabilityResponse,
  EventBookingRequest,
  EventBookingResponse,
  EventBooking,
  EventDashboardSummary,
  EventSpaceDetailsResponse,
  EventSpaceData,
  CreateEventSpaceRequest,
  UpdateEventSpaceRequest,
  PaymentStatusType,
} from '@/shared/types/event-spaces';

// ====================== 🆕 TIPOS PARA FOTOS DE HOTÉIS ======================
import type {
  RoomTypePhoto,
  RoomTypePhotoUploadRequest,
  RoomTypePhotoReorderRequest,
  RoomTypePhotoUpdateRequest,
  PhotoUploadResponse,
  PhotoListResponse,
} from '@/shared/types/hotel-photos';

// ====================== 🆕 TIPOS PARA FOTOS DE EVENT SPACES ======================
import type {
  EventSpacePhoto,
  EventSpacePhotoUpdateRequest,
  EventSpacePhotoReorderRequest,
} from '@/shared/types/event-space-photos';

// ====================== EXPORTAÇÕES ======================
export type { Booking };
export type { LocalRide as Ride };
export type { LocalRideSearchParams as RideSearchParams };
export type { LocalMatchStats as MatchStats };
export type { LocalRideSearchResponse as RideSearchResponse };
export type { LocalRideBookingRequest as RideBookingRequest };

// ====================== FUNÇÃO AUXILIAR ======================

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// ====================== FUNÇÕES DE NORMALIZAÇÃO DE STATUS (HOTÉIS) ======================

/**
 * ✅ CORREÇÃO: Normaliza status do frontend para o backend
 * Converte status como 'rejected', 'pending' para os status válidos do banco
 */
function normalizeHotelBookingStatus(frontendStatus: string | undefined): string {
  if (!frontendStatus) return 'pending_confirmation';
  
  const statusMap: Record<string, string> = {
    'pending': 'pending_confirmation',
    'pending_confirmation': 'pending_confirmation',
    'confirmed': 'confirmed',
    'checked_in': 'checked_in',
    'checked_out': 'checked_out',
    'cancelled': 'cancelled',
    'no_show': 'no_show',
    'rejected': 'cancelled',
    'pending_approval': 'pending_confirmation',
    'in_progress': 'checked_in',
    'completed': 'checked_out',
  };
  
  return statusMap[frontendStatus.toLowerCase()] || 'pending_confirmation';
}

/**
 * ✅ CORREÇÃO: Normaliza status do backend para o frontend
 */
function denormalizeHotelBookingStatus(backendStatus: string | undefined): string {
  if (!backendStatus) return 'pending_confirmation';
  
  const validStatuses = [
    'pending_confirmation',
    'confirmed', 
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show'
  ];
  
  if (validStatuses.includes(backendStatus)) {
    return backendStatus;
  }
  
  return 'pending_confirmation';
}

/**
 * ✅ CORREÇÃO: Normaliza um booking completo de hotel
 */
function normalizeHotelBooking(apiBooking: any): any {
  const booking = apiBooking.booking || apiBooking;
  
  const normalizedStatus = denormalizeHotelBookingStatus(booking.status);
  
  return {
    id: booking.id || '',
    bookingId: booking.id || '',
    hotelId: booking.hotelId || booking.hotel_id || '',
    roomTypeId: booking.roomTypeId || booking.room_type_id || '',
    guestName: booking.guestName || booking.guest_name || '',
    guestEmail: booking.guestEmail || booking.guest_email || '',
    guestPhone: booking.guestPhone || booking.guest_phone || null,
    checkIn: booking.checkIn || booking.check_in || '',
    checkOut: booking.checkOut || booking.check_out || '',
    adults: Number(booking.adults || 1),
    children: Number(booking.children || 0),
    units: Number(booking.units || 1),
    nights: Number(booking.nights || 
      (booking.checkIn && booking.checkOut ? 
        Math.max(1, Math.ceil(
          (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 
          (1000 * 60 * 60 * 24)
        )) : 1
      )
    ),
    status: normalizedStatus,
    paymentStatus: booking.paymentStatus || booking.payment_status || 'pending',
    totalPrice: booking.totalPrice || booking.total_price || '0',
    basePrice: booking.basePrice || booking.base_price || '0',
    taxes: booking.taxes || '0',
    specialRequests: booking.specialRequests || booking.special_requests || null,
    promoCode: booking.promoCode || booking.promo_code || null,
    userId: booking.userId || booking.user_id || null,
    createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
    updatedAt: booking.updatedAt || booking.updated_at || new Date().toISOString(),
    guest_name: booking.guestName || booking.guest_name || '',
    guest_email: booking.guestEmail || booking.guest_email || '',
    check_in: booking.checkIn || booking.check_in || '',
    check_out: booking.checkOut || booking.check_out || '',
    total_price: booking.totalPrice || booking.total_price || '0',
    created_at: booking.createdAt || booking.created_at || new Date().toISOString(),
  };
}

// ====================== FUNÇÕES UTILITÁRIAS RIDES (INTACTAS) ======================

export function normalizeRide(apiRide: any): any {
  const normalized = {
    ride_id: apiRide.ride_id || apiRide.id || '',
    driver_id: apiRide.driver_id || apiRide.driverId || '',
    driver_name: apiRide.driver_name || apiRide.driverName || 'Motorista',
    driver_rating: Number(apiRide.driver_rating ?? apiRide.driverRating ?? 4.5),
    vehicle_make: apiRide.vehicle_make || apiRide.vehicleMake || '',
    vehicle_model: apiRide.vehicle_model || apiRide.vehicleModel || '',
    vehicle_type: apiRide.vehicle_type || apiRide.vehicleType || 'economy',
    vehicle_plate: apiRide.vehicle_plate || apiRide.vehiclePlate || '',
    vehicle_color: apiRide.vehicle_color || apiRide.vehicleColor || '',
    max_passengers: Number(apiRide.max_passengers ?? apiRide.maxPassengers ?? 4),
    from_city: apiRide.from_city || apiRide.fromCity || '',
    to_city: apiRide.to_city || apiRide.toCity || '',
    from_lat: Number(apiRide.from_lat ?? apiRide.fromLat ?? 0),
    from_lng: Number(apiRide.from_lng ?? apiRide.fromLng ?? 0),
    to_lat: Number(apiRide.to_lat ?? apiRide.toLat ?? 0),
    to_lng: Number(apiRide.to_lng ?? apiRide.toLng ?? 0),
    departuredate: apiRide.departuredate || apiRide.departureDate || new Date().toISOString(),
    availableseats: Number(apiRide.availableseats ?? apiRide.availableSeats ?? 0),
    priceperseat: Number(apiRide.priceperseat ?? apiRide.pricePerSeat ?? 0),
    distance_from_city_km: Number(apiRide.distance_from_city_km ?? apiRide.distanceFromCityKm ?? 0),
    distance_to_city_km: Number(apiRide.distance_to_city_km ?? apiRide.distanceToCityKm ?? 0),
    match_type: apiRide.match_type || 'traditional',
    direction_score: Number(apiRide.direction_score ?? 0),
    from_province: apiRide.from_province || apiRide.fromProvince,
    to_province: apiRide.to_province || apiRide.toProvince,
    id: apiRide.ride_id || apiRide.id || '',
    driverId: apiRide.driver_id || apiRide.driverId || '',
    driverName: apiRide.driver_name || apiRide.driverName || 'Motorista',
    driverRating: Number(apiRide.driver_rating ?? apiRide.driverRating ?? 4.5),
    fromLocation: apiRide.from_city || apiRide.fromCity || '',
    toLocation: apiRide.to_city || apiRide.toCity || '',
    fromAddress: apiRide.from_city || apiRide.fromCity || '',
    toAddress: apiRide.to_city || apiRide.toCity || '',
    fromCity: apiRide.from_city || apiRide.fromCity || '',
    toCity: apiRide.to_city || apiRide.toCity || '',
    fromProvince: apiRide.from_province || apiRide.fromProvince,
    toProvince: apiRide.to_province || apiRide.toProvince,
    departureDate: apiRide.departuredate || apiRide.departureDate || new Date().toISOString(),
    departureTime: apiRide.departureTime || '08:00',
    price: Number(apiRide.priceperseat ?? apiRide.pricePerSeat ?? 0),
    pricePerSeat: Number(apiRide.priceperseat ?? apiRide.pricePerSeat ?? 0),
    availableSeats: Number(apiRide.availableseats ?? apiRide.availableSeats ?? 0),
    maxPassengers: Number(apiRide.max_passengers ?? apiRide.maxPassengers ?? 4),
    currentPassengers: apiRide.currentPassengers || 0,
    vehicle: apiRide.vehicle_type || apiRide.vehicleType || 'Veículo',
    vehicleType: apiRide.vehicle_type || apiRide.vehicleType || 'economy',
    vehicleMake: apiRide.vehicle_make || apiRide.vehicleMake || '',
    vehicleModel: apiRide.vehicle_model || apiRide.vehicleModel || '',
    vehiclePlate: apiRide.vehicle_plate || apiRide.vehiclePlate || '',
    vehicleColor: apiRide.vehicle_color || apiRide.vehicleColor || '',
    status: apiRide.status || 'available',
    type: apiRide.type || apiRide.vehicle_type || 'economy',
    vehicleInfo: {
      make: apiRide.vehicle_make || apiRide.vehicleMake || '',
      model: apiRide.vehicle_model || apiRide.vehicleModel || '',
      type: apiRide.vehicle_type || apiRide.vehicleType || 'economy',
      typeDisplay: 'Económico',
      typeIcon: '🚗',
      plate: apiRide.vehicle_plate || apiRide.vehiclePlate || '',
      color: apiRide.vehicle_color || apiRide.vehicleColor || '',
      maxPassengers: Number(apiRide.max_passengers ?? apiRide.maxPassengers ?? 4)
    },
    route_compatibility: Number(apiRide.direction_score ?? apiRide.route_compatibility ?? 0),
    distanceFromCityKm: Number(apiRide.distance_from_city_km ?? apiRide.distanceFromCityKm ?? 0),
    distanceToCityKm: Number(apiRide.distance_to_city_km ?? apiRide.distanceToCityKm ?? 0),
    departureDateFormatted: formatDateOnly(apiRide.departuredate || apiRide.departureDate),
    departureTimeFormatted: formatTimeOnly(apiRide.departuredate || apiRide.departureDate),
    departureDateTimeFormatted: formatDateTime(apiRide.departuredate || apiRide.departureDate),
    departureLongDate: formatLongDate(apiRide.departuredate || apiRide.departureDate),
    departureWeekday: formatWeekday(apiRide.departuredate || apiRide.departureDate)
  };
  
  return normalized;
}

export function normalizeRides(backendRides: any[]): any[] {
  return (backendRides || []).map(normalizeRide);
}

export function createDefaultMatchStats(): any {
  return {
    exact_match: 0,
    same_segment: 0,
    same_direction: 0,
    potential: 0,
    traditional: 0,
    smart_matches: 0,
    drivers_with_ratings: 0,
    average_driver_rating: 0,
    vehicle_types: {},
    match_types: {},
    total_smart_matches: 0,
    average_direction_score: 0,
    total: 0
  };
}

// ====================== NORMALIZADORES EVENTS (OTIMIZADOS) ======================

/**
 * ✅ CORREÇÃO 3 + CRÍTICA: Normalização completa de EventSpace com todos os campos necessários
 * ✅ ADICIONADO: Suporte para pricePerDay (campo real do banco)
 */
export function normalizeEventSpace(apiSpace: any): EventSpace {
  const space = apiSpace.space || apiSpace;
  const hotel = apiSpace.hotel || space.hotel || null;
  
  // ✅ DEBUG: Ver o que está chegando
  console.log('🔍 normalizeEventSpace - raw space:', {
    id: space.id,
    name: space.name,
    pricePerDay: space.pricePerDay,
    basePricePerDay: space.basePricePerDay,
    base_price_per_day: space.base_price_per_day,
  });
  
  // ✅ CORREÇÃO: Extrair amenities de múltiplas fontes
  const amenities = [
    ...(space.amenities || []),
    ...(apiSpace.amenities || []),
    ...(space.equipment?.amenities || []),
    ...(hotel?.amenities || [])
  ].filter(Boolean);

  // Remover duplicatas
  const uniqueAmenities = [...new Set(amenities)];

  // ✅ CORREÇÃO: Extrair localização com prioridade correta
  const locality = space.locality || hotel?.locality || null;
  const province = space.province || hotel?.province || null;
  const location = space.location || 
                  (locality && province ? `${locality}, ${province}` : null);
  
  // ✅ CORREÇÃO CRÍTICA: Extrair preços com PRIORIDADE para pricePerDay (campo real do banco)
  const basePricePerDay = String(
    space.pricePerDay ||                // 👈 CAMPO REAL DO BANCO (AGORA EXISTE!)
    space.basePricePerDay || 
    space.base_price_per_day || 
    apiSpace.base_price_per_day || 
    '0'
  );
  
  // ✅ CORREÇÃO: Também manter o pricePerDay original para compatibilidade
  const pricePerDay = String(
    space.pricePerDay || 
    basePricePerDay || 
    '0'
  );
  
  const weekendSurchargePercent = Number(
    space.weekendSurchargePercent || 
    space.weekend_surcharge_percent || 
    apiSpace.weekend_surcharge_percent || 
    0
  );
  
  const securityDeposit = String(
    space.securityDeposit || 
    space.security_deposit || 
    apiSpace.security_deposit || 
    '0'
  );

  // ✅ CORREÇÃO: Extrair capacidade
  const capacityMin = Number(
    space.capacityMin || 
    space.capacity_min || 
    10
  );
  
  const capacityMax = Number(
    space.capacityMax || 
    space.capacity_max || 
    capacityMin || 
    50
  );

  // ✅ CORREÇÃO: Extrair coordenadas
  const lat = space.lat || hotel?.lat || null;
  const lng = space.lng || hotel?.lng || null;
  const location_id = space.location_id || hotel?.location_id || null;

  const normalized: EventSpace = {
    id: space.id || '',
    hotelId: space.hotelId || space.hotel_id || '',
    hotel_id: space.hotel_id || space.hotelId || '',
    name: space.name || 'Espaço sem nome',
    description: space.description || null,
    
    // ✅ CORREÇÃO: Capacidade
    capacityMin,
    capacityMax,
    
    // ✅ CORREÇÃO CRÍTICA: Preços com TODAS as variações
    basePricePerDay,
    base_price_per_day: basePricePerDay,
    pricePerDay,                        // 👈 NOVO CAMPO
    price_per_day: pricePerDay,         // 👈 NOVO CAMPO (snake_case)
    weekendSurchargePercent,
    weekend_surcharge_percent: weekendSurchargePercent,
    securityDeposit,
    security_deposit: securityDeposit,
    
    areaSqm: space.areaSqm || space.area_sqm || null,
    
    // ✅ CORREÇÃO: Catering
    offersCatering: !!space.offersCatering || !!space.offers_catering,
    offers_catering: !!space.offers_catering || !!space.offersCatering,
    cateringDiscountPercent: Number(space.cateringDiscountPercent || space.catering_discount_percent || 0),
    catering_discount_percent: Number(space.catering_discount_percent || space.cateringDiscountPercent || 0),
    cateringMenuUrls: space.cateringMenuUrls || space.catering_menu_urls || [],
    catering_menu_urls: space.catering_menu_urls || space.cateringMenuUrls || [],
    
    spaceType: space.spaceType || space.space_type || null,
    naturalLight: !!space.naturalLight || !!space.natural_light,
    hasStage: !!space.hasStage || !!space.has_stage,
    loadingAccess: !!space.loadingAccess || !!space.loading_access,
    dressingRooms: space.dressingRooms || space.dressing_rooms || null,
    insuranceRequired: !!space.insuranceRequired || !!space.insurance_required,
    alcoholAllowed: !!space.alcoholAllowed || !!space.alcohol_allowed,
    approvalRequired: !!space.approvalRequired || !!space.approval_required,
    noiseRestriction: space.noiseRestriction || space.noise_restriction || null,
    
    // ✅ CORREÇÃO: Event types
    allowedEventTypes: space.allowedEventTypes || space.allowed_event_types || [],
    allowed_event_types: space.allowed_event_types || space.allowedEventTypes || [],
    prohibitedEventTypes: space.prohibitedEventTypes || space.prohibited_event_types || [],
    prohibited_event_types: space.prohibited_event_types || space.prohibitedEventTypes || [],
    
    // ✅ CORREÇÃO: Amenities (com duplicatas removidas)
    amenities: uniqueAmenities,
    amenities_list: uniqueAmenities,
    
    equipment: space.equipment || {},
    setupOptions: space.setupOptions || space.setup_options || [],
    setup_options: space.setup_options || space.setupOptions || [],
    images: space.images || [],
    floorPlanImage: space.floorPlanImage || space.floor_plan_image || null,
    virtualTourUrl: space.virtualTourUrl || space.virtual_tour_url || null,
    
    isActive: space.isActive ?? space.is_active ?? true,
    is_active: space.is_active ?? space.isActive ?? true,
    isFeatured: space.isFeatured ?? space.is_featured ?? false,
    is_featured: space.is_featured ?? space.isFeatured ?? false,
    
    slug: space.slug || '',
    
    // ✅ CORREÇÃO: Localização
    locality,
    province,
    location,
    lat,
    lng,
    location_id,
    
    rating: space.rating || undefined,
    totalReviews: space.totalReviews || space.total_reviews || 0,
    
    thumbnail: (space.images?.[0] || ''),
    hotel: hotel ? {
      id: hotel.id,
      name: hotel.name,
      locality: hotel.locality,
      province: hotel.province,
      lat: hotel.lat || null,
      lng: hotel.lng || null,
      location_id: hotel.location_id || null,
    } : null,
    
    createdAt: space.createdAt || space.created_at || new Date().toISOString(),
    created_at: space.created_at || space.createdAt || new Date().toISOString(),
    updatedAt: space.updatedAt || space.updated_at || new Date().toISOString(),
    updated_at: space.updated_at || space.updatedAt || new Date().toISOString(),
  };
  
  // Configurações de capacidade alternativas
  if (space.capacityTheater !== undefined || space.capacity_theater !== undefined) {
    normalized.capacityTheater = Number(space.capacityTheater || space.capacity_theater);
    normalized.capacity_theater = Number(space.capacity_theater || space.capacityTheater);
  }
  if (space.capacityClassroom !== undefined || space.capacity_classroom !== undefined) {
    normalized.capacityClassroom = Number(space.capacityClassroom || space.capacity_classroom);
    normalized.capacity_classroom = Number(space.capacity_classroom || space.capacityClassroom);
  }
  if (space.capacityBanquet !== undefined || space.capacity_banquet !== undefined) {
    normalized.capacityBanquet = Number(space.capacityBanquet || space.capacity_banquet);
    normalized.capacity_banquet = Number(space.capacity_banquet || space.capacityBanquet);
  }
  if (space.capacityStanding !== undefined || space.capacity_standing !== undefined) {
    normalized.capacityStanding = Number(space.capacityStanding || space.capacity_standing);
    normalized.capacity_standing = Number(space.capacity_standing || space.capacityStanding);
  }
  if (space.capacityCocktail !== undefined || space.capacity_cocktail !== undefined) {
    normalized.capacityCocktail = Number(space.capacityCocktail || space.capacity_cocktail);
    normalized.capacity_cocktail = Number(space.capacity_cocktail || space.capacityCocktail);
  }
  
  // ✅ DEBUG: Mostrar resultado da normalização
  console.log('✅ normalizeEventSpace - resultado:', {
    id: normalized.id,
    name: normalized.name,
    pricePerDay: normalized.pricePerDay,
    basePricePerDay: normalized.basePricePerDay,
    base_price_per_day: normalized.base_price_per_day,
  });
  
  return normalized;
}

export function normalizeEventSpaces(apiSpaces: any[]): EventSpace[] {
  return (apiSpaces || []).map(normalizeEventSpace);
}

export function normalizeEventBooking(apiBooking: any): EventBooking {
  const booking = apiBooking.booking || apiBooking;
  
  const totalPrice = toNumber(booking.totalPrice || booking.total_price || '0');
  const depositPaid = toNumber(booking.depositPaid || booking.deposit_paid || '0');
  const basePrice = toNumber(booking.basePrice || booking.base_price || '0');
  const securityDeposit = toNumber(booking.securityDeposit || booking.security_deposit || '0');
  
  let balanceDue = toNumber(booking.balanceDue || booking.balance_due || '0');
  if (balanceDue === 0 && totalPrice > 0 && depositPaid < totalPrice) {
    balanceDue = Math.max(0, totalPrice - depositPaid);
  }
  
  let paymentStatus = booking.paymentStatus || booking.payment_status || 'pending';
  if (balanceDue <= 0 && totalPrice > 0) {
    paymentStatus = 'paid';
  } else if (depositPaid > 0 && depositPaid < totalPrice) {
    paymentStatus = 'partial';
  }
  
  const normalized: EventBooking = {
    id: (booking.id || '') as string,
    eventSpaceId: (booking.eventSpaceId || booking.event_space_id || '') as string,
    hotelId: (booking.hotelId || booking.hotel_id || '') as string,
    organizerName: (booking.organizerName || booking.organizer_name || '') as string,
    organizerEmail: (booking.organizerEmail || booking.organizer_email || '') as string,
    organizerPhone: booking.organizerPhone || booking.organizer_phone || null,
    eventTitle: (booking.eventTitle || booking.event_title || '') as string,
    eventDescription: booking.eventDescription || booking.event_description || null,
    eventType: (booking.eventType || booking.event_type || '') as string,
    startDate: (booking.startDate || booking.start_date || '') as string,
    endDate: (booking.endDate || booking.end_date || '') as string,
    durationDays: Number(booking.durationDays || booking.duration_days || 1),
    expectedAttendees: Number(booking.expectedAttendees || booking.expected_attendees || 0),
    cateringRequired: !!booking.cateringRequired || !!booking.catering_required,
    specialRequests: booking.specialRequests || booking.special_requests || null,
    additionalServices: booking.additionalServices || booking.additional_services || {},
    basePrice: String(basePrice),
    totalPrice: String(totalPrice),
    securityDeposit: String(securityDeposit),
    depositPaid: String(depositPaid),
    balanceDue: String(balanceDue),
    status: (booking.status || 'pending_approval') as 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected',
    paymentStatus: paymentStatus as PaymentStatusType,
    createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
    updatedAt: booking.updatedAt || booking.updated_at || new Date().toISOString(),
    dateRange: `${booking.startDate || booking.start_date} - ${booking.endDate || booking.end_date}`,
    statusDisplay: getEventStatusDisplay(booking.status),
    deposit_paid: String(depositPaid),
    balance_due: String(balanceDue),
    payment_status: paymentStatus,
    created_at: booking.created_at || booking.createdAt,
    updated_at: booking.updated_at || booking.updatedAt,
  };
  
  return normalized;
}

export function normalizeEventBookings(apiBookings: any[]): EventBooking[] {
  return (apiBookings || []).map(normalizeEventBooking);
}

function getEventStatusDisplay(status: string): string {
  const map: Record<string, string> = {
    pending_approval: 'Aguardando aprovação',
    confirmed: 'Confirmado',
    in_progress: 'Em andamento',
    cancelled: 'Cancelado',
    rejected: 'Rejeitado',
    completed: 'Concluído',
  };
  return map[status] || status.replace('_', ' ');
}

// ====================== API SERVICE PRINCIPAL ======================

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    console.log('🚀 ApiService →', this.baseURL);
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      let token: string | null = null;
      
      const firebaseToken = localStorage.getItem('firebaseToken') as string | null;
      const storedToken = localStorage.getItem('token') as string | null;
      
      const possibleTokens = [firebaseToken, storedToken];
      
      for (const possibleToken of possibleTokens) {
        if (possibleToken !== null && typeof possibleToken === 'string' && possibleToken.trim().length > 0) {
          token = possibleToken;
          break;
        }
      }
      
      if (!token && auth.currentUser) {
        try {
          const freshToken = await auth.currentUser.getIdToken();
          if (freshToken && typeof freshToken === 'string' && freshToken.trim().length > 0) {
            token = freshToken;
            localStorage.setItem('token', token);
            localStorage.setItem('firebaseToken', token);
          }
        } catch (firebaseError) {
          console.warn('⚠️ Erro ao obter token fresco:', (firebaseError as Error).message);
        }
      }
      
      if (token && typeof token === 'string' && token.trim().length > 0) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
    } catch (error) {
      console.error('❌ Erro ao construir headers:', error);
    }
    
    return headers;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const baseHeaders = await this.getAuthHeaders();
    const headers = { ...baseHeaders, ...customHeaders };
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = { 
      method, 
      headers,
      mode: 'cors',
      credentials: 'include',
    };
    
    // ✅ CORREÇÃO CRÍTICA: Detectar FormData e NÃO fazer stringify
    if (data instanceof FormData) {
      // Para FormData, não definir Content-Type (o browser define automaticamente com boundary)
      delete headers['Content-Type'];
      config.body = data;
      console.log(`📸 Enviando FormData com ${Array.from((data as FormData).entries()).length} campos`);
    } else if (data && method !== 'GET') {
      // Para dados normais, fazer JSON.stringify
      config.body = JSON.stringify(data);
      console.log(`🔐 ${method} ${url}`, `Data: ${JSON.stringify(data).substring(0, 200)}...`);
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorText = 'Erro desconhecido';
        try {
          errorText = await response.text();
        } catch (e) {}
        
        if (response.status === 0) {
          throw new Error('Erro de CORS/Network');
        }
        
        if (response.status === 403) {
          throw new Error('403 Forbidden: Sem permissão');
        }
        
        if (response.status === 401) {
          throw new Error('401 Unauthorized: Sessão expirada');
        }
        
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const responseText = await response.text();
      
      try {
        const result = JSON.parse(responseText) as T;
        console.log(`✅ ${method} ${endpoint}:`, (result as any)?.success ? 'Sucesso' : 'Erro');
        return result;
      } catch (jsonError) {
        return { success: true, data: responseText } as T;
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  }

  async get<T>(url: string, params?: any, customHeaders?: Record<string, string>): Promise<T> {
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
    }
    return this.request<T>('GET', url, undefined, customHeaders);
  }

  async post<T>(url: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', url, body, customHeaders);
  }

  async put<T>(url: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', url, body, customHeaders);
  }

  async patch<T>(url: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', url, body, customHeaders);
  }

  async delete<T>(url: string, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', url, undefined, customHeaders);
  }

  async getRaw(url: string, options?: { responseType?: 'blob' | 'json' | 'text' }): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const fullUrl = `${this.baseURL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      if (options?.responseType === 'blob') {
        return await response.blob();
      } else if (options?.responseType === 'text') {
        return await response.text();
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('❌ getRaw error:', error);
      throw error;
    }
  }

  async testCorsConnection(): Promise<{ success: boolean; message: string; corsWorking: boolean }> {
    try {
      const testUrl = `${this.baseURL}/api/health`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        return {
          success: true,
          message: `✅ Conexão CORS funcionando!`,
          corsWorking: true
        };
      } else {
        return {
          success: false,
          message: `❌ Servidor respondeu com ${response.status}`,
          corsWorking: false
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Erro CORS: ${error.message}`,
        corsWorking: false
      };
    }
  }

  private async rpcRequest<T>(
    functionName: string,
    parameters: Record<string, any> = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseURL}/api/rpc`;
    
    const payload = {
      function: functionName,
      parameters: parameters
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText || 'RPC request failed'}`);
    }
    
    return await response.json() as T;
  }

  // ====================== ✅ NOVO: MÉTODO DE DEBUG ======================

  async debugEventSpaceData(spaceId: string) {
    try {
      console.group('🔧 DEBUG EVENT SPACE DATA - ANÁLISE COMPLETA');
      
      const response = await fetch(`${this.baseURL}/api/events/spaces/${spaceId}`, {
        headers: await this.getAuthHeaders()
      });
      
      const rawText = await response.text();
      console.log('📦 Resposta bruta (texto):', rawText.substring(0, 500) + '...');
      
      const rawJson = JSON.parse(rawText);
      console.log('📦 JSON parseado:', JSON.stringify(rawJson, null, 2).substring(0, 1000) + '...');
      
      if (rawJson.success && rawJson.data) {
        console.log('📊 DATA OBJECT ANALYSIS:');
        console.log('  1. Keys em data:', Object.keys(rawJson.data));
        console.log('  2. Tem space?', !!rawJson.data.space);
        
        if (rawJson.data.space) {
          console.log('  3. Keys em space:', Object.keys(rawJson.data.space));
          console.log('  4. pricePerDay em space?', 'pricePerDay' in rawJson.data.space);
          console.log('  5. Valor pricePerDay:', rawJson.data.space.pricePerDay);
          console.log('  6. base_price_per_day em space?', 'base_price_per_day' in rawJson.data.space);
          console.log('  7. Valor base_price_per_day:', rawJson.data.space.base_price_per_day);
        }
        
        console.log('  8. base_price_per_day em data:', rawJson.data.base_price_per_day);
      }
      
      let normalizedSpace;
      if (rawJson.data) {
        normalizedSpace = normalizeEventSpace(rawJson.data.space);
        console.log('🧪 TESTE DE NORMALIZAÇÃO:', {
          pricePerDay: normalizedSpace?.pricePerDay,
          basePricePerDay: normalizedSpace?.basePricePerDay,
          base_price_per_day: normalizedSpace?.base_price_per_day,
        });
      }
      
      console.groupEnd();
      
      return { 
        rawResponse: rawJson, 
        normalizedSpace,
        analysis: {
          hasPricePerDay: !!(rawJson.data?.space?.pricePerDay),
          hasBasePricePerDay: !!(rawJson.data?.space?.basePricePerDay),
          priceValue: rawJson.data?.space?.pricePerDay || rawJson.data?.space?.basePricePerDay,
        }
      };
    } catch (error) {
      console.error('❌ Debug failed:', error);
      console.groupEnd();
      throw error;
    }
  }

  // ====================== EVENTS / EVENT SPACES ======================

  async searchEventSpaces(params: EventSpaceSearchParams): Promise<EventSpaceSearchResponse> {
    try {
      const backendParams = {
        query: params.query,
        locality: params.locality,
        province: params.province,
        start_date: params.startDate,
        end_date: params.endDate,
        capacity: params.capacity,
        event_type: params.eventType,
        max_price_per_day: params.maxPricePerDay,
        amenities: params.amenities?.join(','),
        hotel_id: params.hotelId,
      };

      const res = await this.get<any>('/api/events/spaces', backendParams);

      const spaces = Array.isArray(res.data)
        ? normalizeEventSpaces(res.data)
        : [];

      return {
        success: !!res.success,
        data: spaces,
        count: res.count || spaces.length,
      } as EventSpaceSearchResponse;
    } catch (err) {
      console.error('[searchEventSpaces]', err);
      return { success: false, data: [], count: 0 };
    }
  }

  // ✅ CORREÇÃO CRÍTICA: Método getEventSpaceDetails com suporte a pricePerDay
  async getEventSpaceDetails(spaceId: string): Promise<ApiResponse<EventSpaceDetailsResponse>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}`);

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Espaço não encontrado');
      }

      // ✅ CORREÇÃO CRÍTICA: Passar res.data.space, não res.data
      const normalizedSpace = normalizeEventSpace(res.data.space);
      
      // ✅ DEBUG: Verificar preços
      console.log('💰 getEventSpaceDetails - preços normalizados:', {
        pricePerDay: normalizedSpace.pricePerDay,
        basePricePerDay: normalizedSpace.basePricePerDay,
        base_price_per_day: normalizedSpace.base_price_per_day,
      });
      
      return {
        success: true,
        data: {
          space: normalizedSpace,
          hotel: res.data.hotel || null,
          base_price_per_day: res.data.base_price_per_day || normalizedSpace.basePricePerDay || normalizedSpace.pricePerDay || "0",
          weekend_surcharge_percent: res.data.weekend_surcharge_percent || normalizedSpace.weekendSurchargePercent || 0,
          available_for_immediate_booking: res.data.available_for_immediate_booking || false,
          alcohol_allowed: res.data.alcohol_allowed || normalizedSpace.alcoholAllowed || false,
          max_capacity: res.data.max_capacity || normalizedSpace.capacityMax || 0,
          offers_catering: res.data.offers_catering || normalizedSpace.offersCatering || false,
          catering_discount_percent: res.data.catering_discount_percent || normalizedSpace.cateringDiscountPercent || 0,
          catering_menu_urls: res.data.catering_menu_urls || normalizedSpace.cateringMenuUrls || [],
          security_deposit: res.data.security_deposit || normalizedSpace.securityDeposit || "0",
          amenities: res.data.amenities || normalizedSpace.amenities || [],
        } as EventSpaceDetailsResponse,
      };
    } catch (err) {
      console.error('[getEventSpaceDetails]', err);
      
      try {
        await this.debugEventSpaceData(spaceId);
      } catch (debugError) {
        console.error('Debug também falhou:', debugError);
      }
      
      return { success: false, error: (err as Error).message };
    }
  }

  async checkEventSpaceAvailability(
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<EventAvailabilityResponse> {
    try {
      const res = await this.post<any>(`/api/events/spaces/${spaceId}/availability/check`, {
        start_date: startDate,
        end_date: endDate,
      });

      return {
        success: res.success ?? true,
        isAvailable: res.is_available ?? res.data?.is_available ?? res.isAvailable ?? false,
        message: res.data?.message || res.message || 'Verificação concluída',
      } as EventAvailabilityResponse;
    } catch (err) {
      console.error('[checkEventSpaceAvailability]', err);
      return { success: false, isAvailable: false, message: (err as Error).message };
    }
  }

  async createEventBooking(frontendReq: EventBookingRequest): Promise<EventBookingResponse> {
    try {
      const backendPayload = {
        event_space_id: frontendReq.eventSpaceId,
        organizer_name: frontendReq.organizerName,
        organizer_email: frontendReq.organizerEmail,
        organizer_phone: frontendReq.organizerPhone,
        event_title: frontendReq.eventTitle,
        event_description: frontendReq.eventDescription,
        event_type: frontendReq.eventType,
        start_date: frontendReq.startDate,
        end_date: frontendReq.endDate,
        expected_attendees: frontendReq.expectedAttendees,
        special_requests: frontendReq.specialRequests,
        additional_services: frontendReq.additionalServices,
        catering_required: frontendReq.cateringRequired ?? false,
        user_id: frontendReq.userId ?? auth.currentUser?.uid,
      };

      const res = await this.post<any>(`/api/events/spaces/${backendPayload.event_space_id}/bookings`, backendPayload);

      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : undefined,
        message: res.message || 'Reserva criada (aguardando aprovação)',
      } as EventBookingResponse;
    } catch (err) {
      console.error('[createEventBooking]', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async getMyEventBookings(email?: string): Promise<ApiResponse<EventBooking[]>> {
    try {
      const res = await this.get<any>('/api/events/my-bookings', email ? { email } : {});

      return {
        success: res.success ?? true,
        data: Array.isArray(res.data) ? normalizeEventBookings(res.data) : [],
      };
    } catch (err) {
      console.error('[getMyEventBookings]', err);
      return { success: false, data: [], error: (err as Error).message };
    }
  }

  async cancelEventBooking(
    bookingId: string, 
    data?: { reason?: string }
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('🎯 [cancelEventBooking] Chamado com bookingId:', bookingId, 'reason:', data?.reason);
      
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/cancel`, { reason: data?.reason });
      
      console.log('📥 [cancelEventBooking] Resposta recebida:', res);
      
      return {
        success: res.success ?? true,
        data: { message: res.message || 'Cancelada com sucesso' },
      };
    } catch (err) {
      console.error('❌ [cancelEventBooking] ERRO:', err);
      return { 
        success: false, 
        error: (err as Error).message || 'Falha ao cancelar reserva' 
      };
    }
  }

  async getEventBookingDetails(bookingId: string): Promise<ApiResponse<EventBooking>> {
    try {
      const res = await this.get<any>(`/api/events/bookings/${bookingId}`);
      
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Reserva não encontrada');
      }

      return {
        success: true,
        data: normalizeEventBooking(res.data),
      };
    } catch (err) {
      console.error('[getEventBookingDetails]', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async confirmEventBooking(bookingId: string): Promise<ApiResponse<EventBooking>> {
    try {
      console.log('🎯 [confirmEventBooking] Chamado com bookingId:', bookingId);
      
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/confirm`, {});
      
      console.log('📥 [confirmEventBooking] Resposta recebida:', res);
      
      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : undefined,
      };
    } catch (err) {
      console.error('❌ [confirmEventBooking] ERRO:', err);
      return { 
        success: false, 
        error: (err as Error).message || 'Falha ao confirmar reserva' 
      };
    }
  }

  async getFeaturedEventSpaces(limit: number = 10): Promise<EventSpaceSearchResponse> {
    try {
      const res = await this.get<any>('/api/events/spaces/featured', { limit });

      const spaces = Array.isArray(res.data)
        ? normalizeEventSpaces(res.data)
        : [];

      return {
        success: !!res.success,
        data: spaces,
        count: res.count || spaces.length,
      } as EventSpaceSearchResponse;
    } catch (err) {
      console.error('[getFeaturedEventSpaces]', err);
      return { success: false, data: [], count: 0 };
    }
  }

  async getEventSpacesByHotel(hotelId: string, includeInactive: boolean = false): Promise<EventSpaceSearchResponse> {
    try {
      const res = await this.get<any>(`/api/events/hotel/${hotelId}/spaces`, { includeInactive });

      const spaces = Array.isArray(res.data)
        ? normalizeEventSpaces(res.data)
        : [];

      return {
        success: !!res.success,
        data: spaces,
        count: res.count || spaces.length,
      } as EventSpaceSearchResponse;
    } catch (err) {
      console.error('[getEventSpacesByHotel]', err);
      return { success: false, data: [], count: 0 };
    }
  }

  async getEventDashboardSummary(hotelId: string): Promise<ApiResponse<EventDashboardSummary>> {
    try {
      const res = await this.get<any>(`/api/events/hotel/${hotelId}/dashboard`);
      
      if (!res.success) {
        throw new Error(res.message || 'Erro ao buscar dashboard');
      }

      const raw = res.data?.summary || res.data;

      return {
        success: true,
        data: {
          totalSpaces: raw.total_spaces || raw.totalSpaces || 0,
          upcomingEvents: raw.upcoming_events || raw.upcomingEvents || 0,
          todayEvents: raw.today_events || raw.todayEvents || 0,
          totalRevenueThisMonth: raw.total_revenue_this_month || raw.totalRevenueThisMonth || 0,
          occupancyRate: raw.occupancy_rate || raw.occupancyRate || 0,
          pendingApprovals: raw.pending_approvals || raw.pendingApprovals || 0,
        },
      };
    } catch (err) {
      console.error('[getEventDashboardSummary]', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async calculateEventPrice(
    eventSpaceId: string,
    startDate: string,
    endDate: string,
    cateringRequired: boolean = false
  ): Promise<ApiResponse<{ price: number; breakdown: any }>> {
    try {
      const res = await this.post<any>(`/api/events/spaces/${eventSpaceId}/calculate-price`, {
        start_date: startDate,
        end_date: endDate,
        catering_required: cateringRequired,
      });

      return {
        success: res.success ?? true,
        data: res.data || { price: 0, breakdown: {} },
      };
    } catch (err) {
      console.error('[calculateEventPrice]', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async getEventSpaceReviews(
    spaceId: string,
    params?: {
      limit?: number;
      offset?: number;
      minRating?: number;
      sortBy?: "recent" | "highest_rating" | "most_helpful";
    }
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/reviews`, params);
      
      return {
        success: res.success ?? true,
        data: res.data,
        count: res.count,
        message: res.message,
        error: res.error,
      };
    } catch (err) {
      console.error('[getEventSpaceReviews]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async getEventBookingPaymentDetails(bookingId: string): Promise<ApiResponse<any>> {
    try {
      const res = await this.get<any>(`/api/events/bookings/${bookingId}/payment`);
      
      return {
        success: res.success ?? true,
        data: res.data,
        message: res.message,
      };
    } catch (err) {
      console.error('[getEventBookingPaymentDetails]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async registerEventPayment(
    bookingId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      reference: string;
      notes?: string;
      payment_type?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/payments`, {
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        payment_type: paymentData.payment_type || 'manual_event_payment',
      });
      
      return {
        success: res.success ?? true,
        data: res.data,
        message: res.message || 'Pagamento registrado com sucesso',
      };
    } catch (err) {
      console.error('[registerEventPayment]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async confirmEventPayment(
    bookingId: string,
    paymentId: string
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/payments/confirm`, {
        paymentId,
      });
      
      return {
        success: res.success ?? true,
        data: res.data,
        message: res.message || 'Pagamento confirmado com sucesso',
      };
    } catch (err) {
      console.error('[confirmEventPayment]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async getEventBookingPayments(bookingId: string): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get<any>(`/api/events/bookings/${bookingId}/payment-history`);
      
      return {
        success: res.success ?? true,
        data: res.data || [],
        count: res.count || 0,
      };
    } catch (err) {
      console.error('[getEventBookingPayments]', err);
      return { 
        success: false, 
        error: (err as Error).message,
        data: [] 
      };
    }
  }

  async getEventFinancialSummary(
    hotelId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.get<any>(`/api/events/hotel/${hotelId}/financial-summary`, {
        startDate,
        endDate,
      });
      
      return {
        success: res.success ?? true,
        data: res.data,
        message: res.message,
      };
    } catch (err) {
      console.error('[getEventFinancialSummary]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  // ====================== 🆕 NOVOS MÉTODOS PARA GESTÃO DE RESERVAS E PAGAMENTOS ======================

  async rejectEventBooking(bookingId: string, reason: string): Promise<ApiResponse<any>> {
    try {
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/reject`, { reason });
      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : res.data,
        message: res.message || 'Reserva rejeitada com sucesso',
      };
    } catch (err) {
      console.error('[rejectEventBooking]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async updateEventBookingStatus(
    bookingId: string,
    status: string,
    notes?: string
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.put<any>(`/api/events/bookings/${bookingId}/status`, { status, notes });
      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : res.data,
        message: res.message || `Status atualizado para ${status}`,
      };
    } catch (err) {
      console.error('[updateEventBookingStatus]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async updateEventPaymentStatus(
    bookingId: string,
    paymentStatus: string,
    reference?: string
  ): Promise<ApiResponse<any>> {
    try {
      const res = await this.put<any>(`/api/events/bookings/${bookingId}/payment-status`, { 
        paymentStatus, 
        reference 
      });
      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : res.data,
        message: res.message || `Status de pagamento atualizado para ${paymentStatus}`,
      };
    } catch (err) {
      console.error('[updateEventPaymentStatus]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async getFullEventBookingDetails(bookingId: string): Promise<ApiResponse<any>> {
    try {
      const res = await this.get<any>(`/api/events/bookings/${bookingId}/full-details`);
      return {
        success: res.success ?? true,
        data: res.data ? {
          booking: normalizeEventBooking(res.data.booking),
          payments: res.data.payments || [],
          logs: res.data.logs || [],
        } : null,
        message: res.message,
      };
    } catch (err) {
      console.error('[getFullEventBookingDetails]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  // ====================== 🆕 NOVOS MÉTODOS PARA ENDPOINTS FALTANTES ======================

  async getEventSpaceCalendar(
    spaceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/calendar`, { 
        startDate, 
        endDate 
      });

      return {
        success: res.success ?? true,
        data: res.data || [],
        count: res.count,
        message: res.message,
      };
    } catch (err) {
      console.error('[getEventSpaceCalendar]', err);
      return { 
        success: false, 
        error: (err as Error).message,
        data: [] 
      };
    }
  }

  async updateEventSpaceDayAvailability(
    spaceId: string, 
    data: { 
      date: string; 
      isAvailable?: boolean; 
      stopSell?: boolean; 
      priceOverride?: number 
    }
  ): Promise<ApiResponse<any>> {
    try {
      const backendData = {
        date: data.date,
        is_available: data.isAvailable,
        stop_sell: data.stopSell,
        price_override: data.priceOverride,
      };

      const res = await this.post<any>(`/api/events/spaces/${spaceId}/availability/day`, backendData);

      return {
        success: res.success ?? true,
        data: res.data,
        message: res.message || 'Dia atualizado com sucesso',
      };
    } catch (err) {
      console.error('[updateEventSpaceDayAvailability]', err);
      return { 
        success: false, 
        error: (err as Error).message 
      };
    }
  }

  async bulkUpdateEventSpaceAvailability(
    spaceId: string, 
    updates: Array<{ 
      date: string; 
      isAvailable?: boolean; 
      stopSell?: boolean; 
      priceOverride?: number 
    }>
  ): Promise<ApiResponse<{ updated: number }>> {
    try {
      const backendUpdates = updates.map(update => ({
        date: update.date,
        is_available: update.isAvailable,
        stop_sell: update.stopSell,
        price_override: update.priceOverride,
      }));

      const res = await this.post<any>(`/api/events/spaces/${spaceId}/availability/bulk`, backendUpdates);

      return {
        success: res.success ?? true,
        data: { 
          updated: res.data?.updated_days || updates.length 
        },
        message: res.message || `${updates.length} dias atualizados`,
      };
    } catch (err) {
      console.error('[bulkUpdateEventSpaceAvailability]', err);
      return { 
        success: false, 
        error: (err as Error).message,
        data: { updated: 0 }
      };
    }
  }

  async getEventSpaceBookings(
    spaceId: string,
    params?: { 
      status?: string; 
      startDate?: string; 
      endDate?: string; 
      limit?: number; 
      offset?: number 
    }
  ): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/bookings/filtered`, params);

      return {
        success: res.success ?? true,
        data: res.data || [],
        count: res.count || 0,
        message: res.message,
      };
    } catch (err) {
      console.error('[getEventSpaceBookings]', err);
      return { 
        success: false, 
        error: (err as Error).message,
        data: [] 
      };
    }
  }

  async getEventSpaceAvailability(
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any[]>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/availability`, {
        startDate,
        endDate,
      });

      return {
        success: res.success ?? true,
        data: res.data || [],
      };
    } catch (err) {
      console.error('[getEventSpaceAvailability]', err);
      return { success: false, error: (err as Error).message };
    }
  }

  async getEventSpaceBookingsLegacy(
    spaceId: string,
    params?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ApiResponse<EventBooking[]>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/bookings`, {
        status: params?.status,
        startDate: params?.startDate,
        endDate: params?.endDate,
        limit: params?.limit,
      });

      return {
        success: res.success ?? true,
        data: Array.isArray(res.data) ? normalizeEventBookings(res.data) : [],
      };
    } catch (err) {
      console.error('[getEventSpaceBookingsLegacy]', err);
      return { success: false, data: [], error: (err as Error).message };
    }
  }

  async getFutureEventsBySpace(
    spaceId: string,
    limit: number = 10
  ): Promise<ApiResponse<EventBooking[]>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}/bookings/upcoming`, {
        limit,
      });

      return {
        success: res.success ?? true,
        data: Array.isArray(res.data) ? normalizeEventBookings(res.data) : [],
      };
    } catch (err) {
      console.error('[getFutureEventsBySpace]', err);
      return { success: false, data: [], error: (err as Error).message };
    }
  }

  // ====================== 🆕 NOVOS MÉTODOS PARA FOTOS DE EVENT SPACES ======================

  /**
   * Upload de uma foto para um event space
   */
  async uploadEventSpacePhoto(
    eventSpaceId: string,
    file: File,
    data?: { alt_text?: string; is_featured?: boolean; is_primary?: boolean }
  ): Promise<ApiResponse<EventSpacePhoto>> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      if (data?.alt_text) formData.append('alt_text', data.alt_text);
      if (data?.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
      if (data?.is_primary !== undefined) formData.append('is_primary', String(data.is_primary));

      // ✅ Usando o método request que agora detecta FormData automaticamente
      return await this.post<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${eventSpaceId}/photos`,
        formData
      );
    } catch (error) {
      console.error('[uploadEventSpacePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  /**
   * Upload de múltiplas fotos para um event space
   */
  async uploadMultipleEventSpacePhotos(
    eventSpaceId: string,
    files: File[],
    options?: { is_featured?: boolean }
  ): Promise<ApiResponse<EventSpacePhoto[]>> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadEventSpacePhoto(eventSpaceId, file, {
          is_featured: options?.is_featured,
          is_primary: false
        })
      );
      
      const results = await Promise.all(uploadPromises);
      
      // Verificar se todos foram bem sucedidos
      const allSuccess = results.every(r => r.success);
      const allData = results.flatMap(r => r.data ? [r.data] : []);
      
      return {
        success: allSuccess,
        data: allData,
        error: allSuccess ? undefined : 'Alguns uploads falharam'
      };
    } catch (error) {
      console.error('[uploadMultipleEventSpacePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  /**
   * Listar fotos de um event space
   */
  async getEventSpacePhotos(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto[]>> {
    try {
      return await this.get<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos`
      );
    } catch (error) {
      console.error('[getEventSpacePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar fotos',
      };
    }
  }

  /**
   * Obter fotos destacadas de um event space
   */
  async getEventSpaceFeaturedPhotos(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto[]>> {
    try {
      return await this.get<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos/featured`
      );
    } catch (error) {
      console.error('[getEventSpaceFeaturedPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar fotos destacadas',
      };
    }
  }

  /**
   * Obter uma foto específica de um event space
   */
  async getEventSpacePhoto(eventSpaceId: string, photoId: string): Promise<ApiResponse<EventSpacePhoto>> {
    try {
      return await this.get<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}`
      );
    } catch (error) {
      console.error('[getEventSpacePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar foto',
      };
    }
  }

  /**
   * Atualizar meta-dados de uma foto de event space
   */
  async updateEventSpacePhoto(
    eventSpaceId: string,
    photoId: string,
    updates: EventSpacePhotoUpdateRequest
  ): Promise<ApiResponse<EventSpacePhoto>> {
    try {
      return await this.put<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}`,
        updates
      );
    } catch (error) {
      console.error('[updateEventSpacePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar foto',
      };
    }
  }

  /**
   * Alternar status featured de uma foto de event space
   */
  async toggleEventSpacePhotoFeatured(
    eventSpaceId: string,
    photoId: string
  ): Promise<ApiResponse<EventSpacePhoto>> {
    try {
      return await this.patch<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}/toggle-featured`,
        {}
      );
    } catch (error) {
      console.error('[toggleEventSpacePhotoFeatured]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alternar destaque',
      };
    }
  }

  /**
   * Deletar uma foto de event space (soft delete)
   */
  async deleteEventSpacePhoto(eventSpaceId: string, photoId: string): Promise<ApiResponse<null>> {
    try {
      return await this.delete<ApiResponse<null>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}`
      );
    } catch (error) {
      console.error('[deleteEventSpacePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar foto',
      };
    }
  }

  /**
   * Reordenar fotos de um event space
   */
  async reorderEventSpacePhotos(
    eventSpaceId: string,
    photoIds: string[]
  ): Promise<ApiResponse<EventSpacePhoto[]>> {
    try {
      return await this.put<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos/reorder`,
        { photoIds }
      );
    } catch (error) {
      console.error('[reorderEventSpacePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reordenar fotos',
      };
    }
  }

  /**
   * Obter foto principal de um event space
   */
  async getEventSpacePrimaryPhoto(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto | null>> {
    try {
      return await this.get<ApiResponse<EventSpacePhoto | null>>(
        `/api/events/spaces/${eventSpaceId}/photos/primary`
      );
    } catch (error) {
      console.error('[getEventSpacePrimaryPhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar foto principal',
      };
    }
  }

  /**
   * Contar fotos de um event space
   */
  async countEventSpacePhotos(eventSpaceId: string): Promise<ApiResponse<{ total: number; featured: number; withPrimary: boolean }>> {
    try {
      return await this.get<ApiResponse<{ total: number; featured: number; withPrimary: boolean }>>(
        `/api/events/spaces/${eventSpaceId}/photos/count`
      );
    } catch (error) {
      console.error('[countEventSpacePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao contar fotos',
      };
    }
  }

  // ====================== RIDES API (INTACTA) ======================
  
  async searchRides(params: any): Promise<any> {
    try {
      const rpcParams = {
        search_from: params.from || '',
        search_to: params.to || '',
        radius_km: params.radiusKm || params.maxDistance || 100,
        max_results: 50
      };
      
      const rpcResponse = await this.rpcRequest<any[]>('get_rides_smart_final', rpcParams);
      const ridesData = Array.isArray(rpcResponse) ? rpcResponse : [];
      
      const matchStats = {
        total: ridesData.length,
        match_types: ridesData.reduce((acc, ride) => {
          const matchType = ride.match_type || 'traditional';
          acc[matchType] = (acc[matchType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        total_smart_matches: ridesData.filter(ride => ride.match_type && ride.match_type !== 'traditional').length,
        average_direction_score: ridesData.length > 0 ? 
          ridesData.reduce((sum, ride) => sum + (ride.direction_score || 0), 0) / ridesData.length : 0,
        average_driver_rating: ridesData.length > 0 ?
          ridesData.reduce((sum, ride) => sum + (ride.driver_rating || 0), 0) / ridesData.length : 0
      };
      
      return {
        success: true,
        rides: normalizeRides(ridesData),
        matchStats: matchStats,
        searchParams: {
          from: params.from || '',
          to: params.to || '',
          date: params.date,
          passengers: params.passengers,
          smartSearch: true,
          radiusKm: rpcParams.radius_km,
          searchMethod: 'get_rides_smart_final',
          functionUsed: 'get_rides_smart_final',
          appliedFilters: params
        },
        total: ridesData.length,
        smart_search: true
      };
      
    } catch (error) {
      try {
        const searchParams = new URLSearchParams();
        if (params.from) searchParams.append('from', params.from);
        if (params.to) searchParams.append('to', params.to);
        if (params.date) searchParams.append('date', params.date);
        if (params.passengers) searchParams.append('passengers', params.passengers.toString());

        const response = await this.request<any>('GET', `/api/rides/search?${searchParams.toString()}`);
        const rides = response.results || response.data?.rides || response.rides || [];
        
        return {
          success: true,
          rides: normalizeRides(rides),
          matchStats: response.matchStats || response.data?.stats || createDefaultMatchStats(),
          searchParams: {
            from: params.from || '',
            to: params.to || '',
            date: params.date,
            passengers: params.passengers,
            smartSearch: false,
            appliedFilters: params
          },
          total: response.total || rides.length || 0,
          smart_search: response.smart_search || false
        };
      } catch (fallbackError) {
        throw error;
      }
    }
  }

  async searchSmartRides(params: {
    from: string;
    to: string;
    date?: string;
    passengers?: number;
    radiusKm?: number;
  }): Promise<any> {
    return this.searchRides({
      from: params.from,
      to: params.to,
      date: params.date,
      passengers: params.passengers,
      radiusKm: params.radiusKm,
      smartSearch: true
    });
  }

  async createRide(rideData: {
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    departureTime: string;
    pricePerSeat: number;
    availableSeats: number;
    vehicleType?: string;
    additionalInfo?: string;
    fromProvince?: string;
    toProvince?: string;
  }): Promise<any> {
    return this.request('POST', '/api/rides', rideData);
  }

  async getRideDetails(rideId: string): Promise<{ success: boolean; data: { ride: any } }> {
    const response = await this.request<any>('GET', `/api/rides/${rideId}`);
    if (response.success) {
      return {
        success: true,
        data: {
          ride: normalizeRide(response.data?.ride || response.ride || response)
        }
      };
    }
    return response;
  }

  getRideById(rideId: string): Promise<{ success: boolean; data: { ride: any } }> {
    return this.getRideDetails(rideId);
  }

  async createRideBooking(data: any) {
    return this.post('/api/rides/book', data);
  }

  async getDriverRides(params?: any) {
    return this.get('/api/rides/driver', params);
  }

  // ====================== ✅ CORRIGIDO: HOTELS API (TODAS AS ROTAS /api/v2 REMOVIDAS) ======================
  
  async searchHotels(params: SearchParams): Promise<HotelSearchResponse> {
    try {
      return await this.get<HotelSearchResponse>('/api/hotels', params);
    } catch (error) {
      return {
        success: false,
        data: [],
        hotels: [],
        count: 0
      };
    }
  }

  async getAllHotels(params?: { 
    limit?: number; 
    offset?: number;
    active?: boolean;
  }): Promise<HotelListResponse> {
    try {
      const corsTest = await this.testCorsConnection();
      if (!corsTest.corsWorking) {
        throw new Error(`Problema de CORS: ${corsTest.message}`);
      }
      
      return await this.get<HotelListResponse>('/api/hotels', params);
    } catch (error) {
      console.error('❌ Erro ao buscar hotéis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar hotéis',
        data: [],
        hotels: [],
        count: 0
      };
    }
  }

  async getHotelById(hotelId: string): Promise<HotelByIdResponse> {
    try {
      return await this.get<HotelByIdResponse>(`/api/hotels/${hotelId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotel'
      };
    }
  }

  async checkAvailability(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    units?: number;
    promoCode?: string;
  }): Promise<AvailabilityResponse> {
    try {
      return await this.get<AvailabilityResponse>(`/api/hotels/${params.hotelId}/availability/check`, {
        roomTypeId: params.roomTypeId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        units: params.units,
        promoCode: params.promoCode
      });
    } catch (error) {
      return {
        success: false,
        error: 'Erro na verificação de disponibilidade'
      };
    }
  }

  async createHotelBooking(bookingData: HotelBookingRequest): Promise<HotelBookingResponse> {
    try {
      const { hotelId, ...bookingPayload } = bookingData;
      
      return await this.post<HotelBookingResponse>(
        `/api/hotels/${hotelId}/bookings`, 
        bookingPayload
      );
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao criar reserva'
      };
    }
  }

  async createHotel(data: HotelCreateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.post<HotelOperationResponse>('/api/hotels', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar hotel'
      };
    }
  }

  async updateHotel(hotelId: string, data: HotelUpdateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.put<HotelOperationResponse>(`/api/hotels/${hotelId}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar hotel'
      };
    }
  }

  async deleteHotel(hotelId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.delete<ApiResponse<{ message: string }>>(`/api/hotels/${hotelId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desativar hotel'
      };
    }
  }

  async getHotelStatsDetailed(hotelId: string): Promise<ApiResponse<HotelStatistics>> {
    try {
      return await this.get<ApiResponse<HotelStatistics>>(`/api/hotels/${hotelId}/stats`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter estatísticas'
      };
    }
  }

  async checkQuickAvailability(params: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    units?: number;
  }): Promise<{ 
    success: boolean; 
    available?: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await this.get<AvailabilityResponse>('/api/hotels/availability/quick', params);
      return {
        success: response.success || false,
        available: response.data?.available,
        data: response.data,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na verificação de disponibilidade'
      };
    }
  }

  async getBookingsByEmail(email: string, status?: BookingStatus): Promise<MyHotelBookingsResponse> {
    try {
      return await this.get<MyHotelBookingsResponse>('/api/hotels/my-bookings', { email, status });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter reservas'
      };
    }
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<HotelBookingData>> {
    try {
      const response = await this.get<ApiResponse<any>>(`/api/hotels/bookings/${bookingId}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: normalizeHotelBooking(response.data)
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter detalhes da reserva'
      };
    }
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.post<ApiResponse<{ message: string }>>(`/api/hotels/bookings/${bookingId}/cancel`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar reserva'
      };
    }
  }

  async createRoomType(hotelId: string, data: RoomTypeCreateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.post<HotelOperationResponse>(`/api/hotels/${hotelId}/room-types`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar tipo de quarto'
      };
    }
  }

  async updateRoomType(roomTypeId: string, data: RoomTypeUpdateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.put<HotelOperationResponse>(`/api/hotels/room-types/${roomTypeId}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de quarto'
      };
    }
  }

  async getRoomTypeById(roomTypeId: string): Promise<ApiResponse<RoomType>> {
    try {
      return await this.get<ApiResponse<RoomType>>(`/api/hotels/room-types/${roomTypeId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter detalhes do tipo de quarto'
      };
    }
  }

  async deleteRoomType(roomTypeId: string): Promise<ApiResponse<{ message: string }>> {
    if (!roomTypeId || roomTypeId === 'undefined' || roomTypeId === 'null' || roomTypeId.trim() === '') {
      return {
        success: false,
        error: 'ID do tipo de quarto inválido.'
      };
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomTypeId)) {
      return {
        success: false,
        error: 'Formato do ID do tipo de quarto inválido.'
      };
    }

    try {
      const headers = await this.getAuthHeaders();
      return await this.delete<ApiResponse<{ message: string }>>(
        `/api/hotels/room-types/${roomTypeId}`,
        headers
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          return {
            success: false,
            error: 'Você não tem permissão para deletar este tipo de quarto.'
          };
        } else if (error.message.includes('401')) {
          return {
            success: false,
            error: 'Autenticação expirada.'
          };
        } else if (error.message.includes('404')) {
          return {
            success: false,
            error: 'Tipo de quarto não encontrado.'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: 'Erro ao desativar tipo de quarto.'
      };
    }
  }

  async getRoomTypesByHotel(hotelId: string, params?: {
    available?: boolean;
    checkIn?: string;
    checkOut?: string;
  }): Promise<RoomTypeListResponse> {
    try {
      return await this.get<RoomTypeListResponse>(`/api/hotels/${hotelId}/room-types`, params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar tipos de quarto'
      };
    }
  }

  async getRoomTypeDetails(hotelId: string, roomTypeId: string): Promise<ApiResponse<RoomType>> {
    try {
      return await this.get<ApiResponse<RoomType>>(`/api/hotels/${hotelId}/room-types/${roomTypeId}`);
    } catch (error) {
      try {
        const response = await this.getRoomTypesByHotel(hotelId);
        if (response.success && Array.isArray(response.data)) {
          const roomType = response.data.find((rt: any) => rt.id === roomTypeId || rt.roomTypeId === roomTypeId);
          if (roomType) {
            return {
              success: true,
              data: roomType
            };
          }
        }
        throw new Error('Tipo de quarto não encontrado');
      } catch (fallbackError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao obter detalhes do tipo de quarto'
        };
      }
    }
  }

  async bulkUpdateAvailability(hotelId: string, data: BulkAvailabilityUpdate): Promise<ApiResponse<{ updated: number; message: string }>> {
    try {
      return await this.post<ApiResponse<{ updated: number; message: string }>>(`/api/hotels/${hotelId}/availability/bulk`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade'
      };
    }
  }

  async getHotelPerformance(hotelId: string, params?: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month' | 'year';
  }): Promise<ApiResponse<HotelPerformance>> {
    try {
      return await this.get<ApiResponse<HotelPerformance>>(`/api/hotels/${hotelId}/performance`, params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter performance'
      };
    }
  }

  // ====================== 🆕 FOTOS DOS HOTÉIS (ROOM TYPE PHOTOS) ======================

  /**
   * Upload de uma foto para um room type
   */
  async uploadRoomTypePhoto(
    roomTypeId: string,
    file: File,
    data?: { alt_text?: string; is_featured?: boolean; is_primary?: boolean }
  ): Promise<ApiResponse<RoomTypePhoto>> {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      if (data?.alt_text) formData.append('alt_text', data.alt_text);
      if (data?.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
      if (data?.is_primary !== undefined) formData.append('is_primary', String(data.is_primary));

      // ✅ Usando o método request que agora detecta FormData automaticamente
      return await this.post<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos`,
        formData
      );
    } catch (error) {
      console.error('[uploadRoomTypePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  /**
   * Upload de múltiplas fotos
   */
  async uploadMultipleRoomTypePhotos(
    roomTypeId: string,
    files: File[],
    options?: { is_featured?: boolean }
  ): Promise<ApiResponse<RoomTypePhoto[]>> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadRoomTypePhoto(roomTypeId, file, {
          is_featured: options?.is_featured,
          is_primary: false
        })
      );
      
      const results = await Promise.all(uploadPromises);
      
      // Verificar se todos foram bem sucedidos
      const allSuccess = results.every(r => r.success);
      const allData = results.flatMap(r => r.data ? [r.data] : []);
      
      return {
        success: allSuccess,
        data: allData,
        error: allSuccess ? undefined : 'Alguns uploads falharam'
      };
    } catch (error) {
      console.error('[uploadMultipleRoomTypePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      };
    }
  }

  /**
   * Listar fotos de um room type
   */
  async getRoomTypePhotos(roomTypeId: string): Promise<ApiResponse<RoomTypePhoto[]>> {
    try {
      return await this.get<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/room-types/${roomTypeId}/photos`
      );
    } catch (error) {
      console.error('[getRoomTypePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar fotos',
      };
    }
  }

  /**
   * Obter uma foto específica
   */
  async getRoomTypePhoto(roomTypeId: string, photoId: string): Promise<ApiResponse<RoomTypePhoto>> {
    try {
      return await this.get<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`
      );
    } catch (error) {
      console.error('[getRoomTypePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar foto',
      };
    }
  }

  /**
   * Atualizar meta-dados de uma foto
   */
  async updateRoomTypePhoto(
    roomTypeId: string,
    photoId: string,
    updates: RoomTypePhotoUpdateRequest
  ): Promise<ApiResponse<RoomTypePhoto>> {
    try {
      return await this.put<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`,
        updates
      );
    } catch (error) {
      console.error('[updateRoomTypePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar foto',
      };
    }
  }

  /**
   * Alternar status featured de uma foto
   */
  async toggleRoomTypePhotoFeatured(
    roomTypeId: string,
    photoId: string
  ): Promise<ApiResponse<RoomTypePhoto>> {
    try {
      return await this.patch<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}/toggle-featured`,
        {}
      );
    } catch (error) {
      console.error('[toggleRoomTypePhotoFeatured]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alternar destaque',
      };
    }
  }

  /**
   * Deletar uma foto
   */
  async deleteRoomTypePhoto(roomTypeId: string, photoId: string): Promise<ApiResponse<null>> {
    try {
      return await this.delete<ApiResponse<null>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`
      );
    } catch (error) {
      console.error('[deleteRoomTypePhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar foto',
      };
    }
  }

  /**
   * Reordenar fotos de um room type
   */
  async reorderRoomTypePhotos(
    roomTypeId: string,
    photoIds: string[]
  ): Promise<ApiResponse<RoomTypePhoto[]>> {
    try {
      return await this.put<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/room-types/${roomTypeId}/photos/reorder`,
        { photoIds }
      );
    } catch (error) {
      console.error('[reorderRoomTypePhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reordenar fotos',
      };
    }
  }

  /**
   * Obter todas as fotos de um hotel
   */
  async getHotelPhotos(hotelId: string): Promise<ApiResponse<RoomTypePhoto[]>> {
    try {
      return await this.get<ApiResponse<RoomTypePhoto[]>>(`/api/hotels/${hotelId}/photos`);
    } catch (error) {
      console.error('[getHotelPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar fotos do hotel',
      };
    }
  }

  /**
   * Obter apenas fotos destacadas de um hotel
   */
  async getHotelFeaturedPhotos(hotelId: string): Promise<ApiResponse<RoomTypePhoto[]>> {
    try {
      return await this.get<ApiResponse<RoomTypePhoto[]>>(`/api/hotels/${hotelId}/photos/featured`);
    } catch (error) {
      console.error('[getHotelFeaturedPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar fotos destacadas',
      };
    }
  }

  /**
   * Obter foto principal de um hotel
   */
  async getHotelPrimaryPhoto(hotelId: string): Promise<ApiResponse<RoomTypePhoto | null>> {
    try {
      return await this.get<ApiResponse<RoomTypePhoto | null>>(`/api/hotels/${hotelId}/photos/primary`);
    } catch (error) {
      console.error('[getHotelPrimaryPhoto]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar foto principal',
      };
    }
  }

  /**
   * Obter hotel com fotos (para search results)
   */
  async getHotelWithPhotos(hotelId: string): Promise<ApiResponse<any>> {
    try {
      return await this.get<ApiResponse<any>>(`/api/hotels/${hotelId}/with-photos`);
    } catch (error) {
      console.error('[getHotelWithPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotel com fotos',
      };
    }
  }

  /**
   * Obter room type com fotos (para details page)
   */
  async getRoomTypeWithPhotos(roomTypeId: string): Promise<ApiResponse<any>> {
    try {
      return await this.get<ApiResponse<any>>(`/api/hotels/room-types/${roomTypeId}/with-photos`);
    } catch (error) {
      console.error('[getRoomTypeWithPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar room type com fotos',
      };
    }
  }

  /**
   * Contar fotos de um hotel
   */
  async countHotelPhotos(hotelId: string): Promise<ApiResponse<{ total: number; featured: number; withPrimary: boolean }>> {
    try {
      return await this.get<ApiResponse<{ total: number; featured: number; withPrimary: boolean }>>(
        `/api/hotels/${hotelId}/photos/count`
      );
    } catch (error) {
      console.error('[countHotelPhotos]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao contar fotos',
      };
    }
  }

  // ====================== OUTROS MÉTODOS (ATUALIZADOS) ======================
  
  async login(data: { email: string; password: string }) {
    return this.post('/api/auth/login', data);
  }

  async register(data: any) {
    return this.post('/api/auth/register', data);
  }

  async logout() {
    return this.post('/api/auth/logout');
  }

  async refreshToken() {
    return this.post('/api/auth/refresh-token');
  }

  async getProfile() {
    return this.get('/api/auth/me');
  }

  async updateProfile(data: any) {
    return this.post('/api/auth/update', data);
  }

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(`${this.baseURL}/api/upload`, {
      method: "POST",
      credentials: "include",
      mode: 'cors',
      body: formData
    }).then(r => r.json());
  }

  async getNotifications(): Promise<NotificationsResponse> {
    return this.get<NotificationsResponse>('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.post(`/api/notifications/${notificationId}/read`);
  }

  async getChatThread(threadId: string): Promise<ApiResponse<ChatThread>> {
    return this.get<ApiResponse<ChatThread>>(`/api/chat/${threadId}`);
  }

  async sendChatMessage(threadId: string, message: string): Promise<SendMessageResponse> {
    return this.post<SendMessageResponse>(`/api/chat/${threadId}/send`, { message });
  }

  async getHotelStats(hotelId: string) {
    return this.get(`/api/hotels/${hotelId}/stats`);
  }

  async getHotelEvents(hotelId: string, params?: { status?: BookingStatus; upcoming?: boolean }) {
    return this.get(`/api/hotels/${hotelId}/events`, params);
  }

  async getChat(hotelId: string, params?: { threadId?: string; limit?: number }) {
    return this.get(`/api/hotels/${hotelId}/chat`, params);
  }

  async cancelHotelBooking(bookingId: string) {
    return this.cancelBooking(bookingId);
  }

  async checkInHotelBooking(bookingId: string) {
    return this.post(`/api/hotels/bookings/${bookingId}/check-in`);
  }

  async checkOutHotelBooking(bookingId: string) {
    return this.post(`/api/hotels/bookings/${bookingId}/check-out`);
  }

  async getMyHotelBookings(email: string, status?: BookingStatus): Promise<MyHotelBookingsResponse> {
    return this.getBookingsByEmail(email, status);
  }

  async getHotels() {
    return this.getAllHotels();
  }

  async testHotelsV2(): Promise<ApiResponse<{ message: string; count?: number }>> {
    try {
      const response = await fetch(`${this.baseURL}/api/hotels?location=Maputo&limit=1`, {
        mode: 'cors'
      });
      const v2Working = response.ok;
      const v2Data = v2Working ? await response.json() : null;
      
      return {
        success: v2Working,
        data: {
          message: v2Working 
            ? `✅ API funcionando (${v2Data?.count || 0} hotéis)` 
            : '❌ API não está respondendo',
          count: v2Data?.count
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      };
    }
  }

  async getNightlyPrices(params: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    units?: number;
  }): Promise<ApiResponse<NightlyPrice[]>> {
    try {
      return await this.get<ApiResponse<NightlyPrice[]>>('/api/hotels/availability/nightly-prices', params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter preços'
      };
    }
  }

  async getBookingStatus(bookingId: string): Promise<ApiResponse<{ status: BookingStatus; paymentStatus: PaymentStatus }>> {
    try {
      return await this.get<ApiResponse<{ status: BookingStatus; paymentStatus: PaymentStatus }>>(`/api/hotels/bookings/${bookingId}/status`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter status da reserva'
      };
    }
  }

  async sendChatMessageFull(threadId: string, messageData: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      return await this.post<SendMessageResponse>(`/api/chat/${threadId}/send`, messageData);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
      };
    }
  }

  async getNotificationsByType(type: string): Promise<ApiResponse<Notification[]>> {
    try {
      return await this.get<ApiResponse<Notification[]>>(`/api/notifications/type/${type}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter notificações'
      };
    }
  }

  async bookRide(bookingData: LocalRideBookingRequest): Promise<{ success: boolean; data: { booking: Booking } }> {
    return this.request('POST', '/api/bookings', bookingData);
  }

  async createBooking(
    type: 'ride' | 'hotel' | 'event',
    bookingData: any
  ): Promise<{ success: boolean; data?: { booking: Booking }; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { 
          success: false, 
          error: 'Usuário não autenticado' 
        };
      }

      if (type === 'ride') {
        const payload: LocalRideBookingRequest = {
          rideId: bookingData.rideId,
          passengerId: user.uid,
          seatsBooked: bookingData.passengers,
          totalPrice: bookingData.totalAmount,
          guestName: bookingData.guestInfo?.name,
          guestEmail: bookingData.guestInfo?.email,
          guestPhone: bookingData.guestInfo?.phone,
          rideDetails: bookingData.rideDetails,
          type: 'ride'
        };
        
        const result = await this.bookRide(payload);
        return { success: true, data: result.data };
        
      } else if (type === 'hotel') {
        const normalizedBookingData = {
          ...bookingData,
          status: normalizeHotelBookingStatus(bookingData.status),
        };
        
        const payload: HotelBookingRequest = {
          hotelId: normalizedBookingData.hotelId,
          roomTypeId: normalizedBookingData.roomTypeId,
          checkIn: normalizedBookingData.checkIn,
          checkOut: normalizedBookingData.checkOut,
          guestName: normalizedBookingData.guestName,
          guestEmail: normalizedBookingData.guestEmail,
          guestPhone: normalizedBookingData.guestPhone,
          adults: normalizedBookingData.adults || 1,
          children: normalizedBookingData.children || 0,
          units: normalizedBookingData.units || 1,
          specialRequests: normalizedBookingData.specialRequests,
          promoCode: normalizedBookingData.promoCode
        };
        
        const result = await this.createHotelBooking(payload);
        
        return { 
          success: result.success, 
          data: result.booking ? { 
            booking: normalizeHotelBooking(result.booking)
          } : undefined,
          error: result.error
        };
        
      } else if (type === 'event') {
        const result = await this.createEventBooking({
          eventSpaceId: bookingData.eventSpaceId,
          organizerName: bookingData.organizerName || bookingData.guestName,
          organizerEmail: bookingData.organizerEmail || bookingData.guestEmail,
          organizerPhone: bookingData.organizerPhone || bookingData.guestPhone,
          eventTitle: bookingData.eventTitle,
          eventDescription: bookingData.eventDescription,
          eventType: bookingData.eventType,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          expectedAttendees: bookingData.expectedAttendees || bookingData.attendees || 1,
          specialRequests: bookingData.specialRequests,
          additionalServices: bookingData.additionalServices,
          cateringRequired: bookingData.cateringRequired || false,
          userId: user.uid
        });

        if (!result.success || !result.data) {
          return { 
            success: false, 
            error: result.error || 'Erro ao criar reserva de evento' 
          };
        }

        return {
          success: true,
          data: {
            booking: {
              id: result.data.id,
              type: 'event',
              bookingDate: result.data.createdAt || new Date().toISOString().split('T')[0],
              status: result.data.status,
              passengerId: result.data.organizerEmail,
              guestName: result.data.organizerName,
              guestEmail: result.data.organizerEmail,
              guestPhone: result.data.organizerPhone,
              totalPrice: result.data.totalPrice,
              rideId: result.data.eventSpaceId || '',
              seatsBooked: result.data.expectedAttendees,
              eventTitle: result.data.eventTitle,
              startDate: result.data.startDate,
              endDate: result.data.endDate,
              durationDays: result.data.durationDays,
              createdAt: result.data.createdAt,
            } as Booking
          }
        };
        
      } else {
        return { 
          success: false, 
          error: 'Tipo de booking inválido' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erro ao criar reserva' 
      };
    }
  }

  async getUserBookings(): Promise<{ success: boolean; data: { bookings: Booking[] } }> {
    return this.request('GET', '/api/bookings/user');
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('GET', '/api/auth/profile');
  }

  async updateUserProfile(userData: any): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('PUT', '/api/auth/profile', userData);
  }

  async checkHealth(): Promise<{ success: boolean; services: Record<string, string> }> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        mode: 'cors'
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, services: data.services || {} };
      }
      return { success: false, services: {} };
    } catch (error) {
      return { success: false, services: {} };
    }
  }
}

export const apiService = new ApiService();
export default apiService;