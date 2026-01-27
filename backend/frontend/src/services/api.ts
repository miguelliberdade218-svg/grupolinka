// src/services/apiService.ts - VERSÃO CORRIGIDA 26/01/2026 - SUPORTE COMPLETO A DIÁRIAS (EVENTS)
// Mantém rides e hotels intactos | Corrige e completa tudo de events / eventSpaces
// ALINHADO COM shared/types/event-spaces.ts (usando camelCase)

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
  EventSpaceDetails,
  CreateEventSpaceRequest,
  UpdateEventSpaceRequest
} from '@/shared/types/event-spaces';

// ====================== EXPORTAÇÕES ======================
export type { Booking };
export type { LocalRide as Ride };
export type { LocalRideSearchParams as RideSearchParams };
export type { LocalMatchStats as MatchStats };
export type { LocalRideSearchResponse as RideSearchResponse };
export type { LocalRideBookingRequest as RideBookingRequest };

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
    
    // Aliases para compatibilidade
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

export function normalizeEventSpace(apiSpace: any): EventSpace {
  const space = apiSpace.space || apiSpace;
  
  // Campos camelCase (frontend-friendly) conforme shared/types/event-spaces.ts
  const normalized: EventSpace = {
    id: space.id || '',
    hotelId: space.hotelId || space.hotel_id || '',
    hotel_id: space.hotel_id || space.hotelId || '',
    name: space.name || 'Espaço sem nome',
    description: space.description || null,
    capacityMin: Number(space.capacityMin || space.capacity_min || 10),
    capacityMax: Number(space.capacityMax || space.capacity_max || 50),
    areaSqm: space.areaSqm || space.area_sqm || null,
    basePricePerDay: String(space.basePricePerDay || space.base_price_per_day || '0'),
    weekendSurchargePercent: Number(space.weekendSurchargePercent || space.weekend_surcharge_percent || 0),
    offersCatering: !!space.offersCatering || !!space.offers_catering,
    cateringDiscountPercent: Number(space.cateringDiscountPercent || space.catering_discount_percent || 0),
    cateringMenuUrls: space.cateringMenuUrls || space.catering_menu_urls || [],
    spaceType: space.spaceType || space.space_type || null,
    naturalLight: !!space.naturalLight || !!space.natural_light,
    hasStage: !!space.hasStage || !!space.has_stage,
    loadingAccess: !!space.loadingAccess || !!space.loading_access,
    dressingRooms: space.dressingRooms || space.dressing_rooms || null,
    insuranceRequired: !!space.insuranceRequired || !!space.insurance_required,
    alcoholAllowed: !!space.alcoholAllowed || !!space.alcohol_allowed,
    approvalRequired: !!space.approvalRequired || !!space.approval_required,
    noiseRestriction: space.noiseRestriction || space.noise_restriction || null,
    allowedEventTypes: space.allowedEventTypes || space.allowed_event_types || [],
    prohibitedEventTypes: space.prohibitedEventTypes || space.prohibited_event_types || [],
    equipment: space.equipment || {},
    setupOptions: space.setupOptions || space.setup_options || [],
    images: space.images || [],
    floorPlanImage: space.floorPlanImage || space.floor_plan_image || null,
    virtualTourUrl: space.virtualTourUrl || space.virtual_tour_url || null,
    isActive: space.isActive ?? space.is_active ?? true,
    isFeatured: space.isFeatured ?? space.is_featured ?? false,
    slug: space.slug || '',
    createdAt: space.createdAt || space.created_at || new Date().toISOString(),
    updatedAt: space.updatedAt || space.updated_at || new Date().toISOString(),
    
    // Campos opcionais/com calculados
    rating: space.rating || undefined,
    totalReviews: space.totalReviews || undefined,
    thumbnail: (space.images?.[0] || ''),
    location: apiSpace.hotel?.locality 
      ? `${apiSpace.hotel?.locality}, ${apiSpace.hotel?.province}`
      : undefined,
    hotel: apiSpace.hotel ? {
      name: apiSpace.hotel.name,
      locality: apiSpace.hotel.locality,
      province: apiSpace.hotel.province,
    } : null,
  };
  
  // Campos específicos de capacidade por setup (opcionais)
  if (space.capacityTheater !== undefined || space.capacity_theater !== undefined) {
    normalized.capacityTheater = Number(space.capacityTheater || space.capacity_theater);
  }
  if (space.capacityClassroom !== undefined || space.capacity_classroom !== undefined) {
    normalized.capacityClassroom = Number(space.capacityClassroom || space.capacity_classroom);
  }
  if (space.capacityBanquet !== undefined || space.capacity_banquet !== undefined) {
    normalized.capacityBanquet = Number(space.capacityBanquet || space.capacity_banquet);
  }
  if (space.capacityStanding !== undefined || space.capacity_standing !== undefined) {
    normalized.capacityStanding = Number(space.capacityStanding || space.capacity_standing);
  }
  if (space.capacityCocktail !== undefined || space.capacity_cocktail !== undefined) {
    normalized.capacityCocktail = Number(space.capacityCocktail || space.capacity_cocktail);
  }
  
  return normalized;
}

export function normalizeEventSpaces(apiSpaces: any[]): EventSpace[] {
  return (apiSpaces || []).map(normalizeEventSpace);
}

export function normalizeEventBooking(apiBooking: any): EventBooking {
  const booking = apiBooking.booking || apiBooking;
  
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
    basePrice: String(booking.basePrice || booking.base_price || '0'),
    totalPrice: String(booking.totalPrice || booking.total_price || '0'),
    securityDeposit: String(booking.securityDeposit || booking.security_deposit || '0'),
    status: booking.status || 'pending_approval',
    paymentStatus: booking.paymentStatus || booking.payment_status || 'pending',
    createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
    updatedAt: booking.updatedAt || booking.updated_at || new Date().toISOString(),
  };
  
  // Campos display (opcionais)
  normalized.dateRange = `${normalized.startDate} - ${normalized.endDate}`;
  normalized.statusDisplay = getEventStatusDisplay(normalized.status);
  
  return normalized;
}

export function normalizeEventBookings(apiBookings: any[]): EventBooking[] {
  return (apiBookings || []).map(normalizeEventBooking);
}

function getEventStatusDisplay(status: string): string {
  const map: Record<string, string> = {
    pending_approval: 'Aguardando aprovação',
    confirmed: 'Confirmado',
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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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
    
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    console.log(`🔐 ${method} ${url}`, data ? `Data: ${JSON.stringify(data).substring(0, 200)}...` : '');
    
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

  // Métodos HTTP básicos
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

  // ====================== EVENTS / EVENT SPACES ======================

  async searchEventSpaces(params: EventSpaceSearchParams): Promise<EventSpaceSearchResponse> {
    try {
      // Converter camelCase para snake_case para o backend
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

  async getEventSpaceDetails(spaceId: string): Promise<ApiResponse<EventSpaceDetails>> {
    try {
      const res = await this.get<any>(`/api/events/spaces/${spaceId}`);

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Espaço não encontrado');
      }

      const normalizedSpace = normalizeEventSpace(res.data.space || res.data);
      
      return {
        success: true,
        data: {
          space: normalizedSpace,
          hotel: res.data.hotel || null,
          base_price_per_day: String(res.data.base_price_per_day || normalizedSpace.basePricePerDay || '0'),
          weekend_surcharge_percent: Number(res.data.weekend_surcharge_percent || normalizedSpace.weekendSurchargePercent || 0),
          available_for_immediate_booking: !!res.data.available_for_immediate_booking,
          alcohol_allowed: !!res.data.alcohol_allowed || normalizedSpace.alcoholAllowed,
          max_capacity: Number(res.data.max_capacity || normalizedSpace.capacityMax || 0),
          offers_catering: !!res.data.offers_catering || normalizedSpace.offersCatering,
          catering_discount_percent: Number(res.data.catering_discount_percent || normalizedSpace.cateringDiscountPercent || 0),
          catering_menu_urls: res.data.catering_menu_urls || normalizedSpace.cateringMenuUrls || [],
          security_deposit: String(res.data.security_deposit || normalizedSpace.securityDeposit || '0'),
        },
      };
    } catch (err) {
      console.error('[getEventSpaceDetails]', err);
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
      // Converter camelCase para snake_case para o backend
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

      // ✅ Endpoint correto conforme backend - /api/events/spaces/:id/bookings
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

  async cancelEventBooking(bookingId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/cancel`, { reason });
      return {
        success: res.success ?? true,
        data: { message: res.message || 'Cancelada com sucesso' },
      };
    } catch (err) {
      console.error('[cancelEventBooking]', err);
      return { success: false, error: (err as Error).message };
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
      const res = await this.post<any>(`/api/events/bookings/${bookingId}/confirm`);
      
      return {
        success: res.success ?? true,
        data: res.data ? normalizeEventBooking(res.data) : undefined,
      };
    } catch (err) {
      console.error('[confirmEventBooking]', err);
      return { success: false, error: (err as Error).message };
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

  /**
   * 📝 Busca avaliações de um espaço de eventos (CORRIGIDO)
   * ✅ CORREÇÃO: Assinatura corrigida para aceitar parâmetros opcionais
   * Endpoint: GET /api/events/spaces/:id/reviews
   */
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

  // ====================== 🆕 NOVOS MÉTODOS PARA ENDPOINTS FALTANTES ======================

  /**
   * 🔄 Busca o calendário de disponibilidade de um espaço (NOVO ENDPOINT)
   * Endpoint: GET /api/events/spaces/:id/calendar
   * Para: EventSpaceAvailabilityCalendar.tsx
   */
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

  /**
   * 🔄 Atualiza disponibilidade de UM dia específico (NOVO ENDPOINT)
   * Endpoint: POST /api/events/spaces/:id/availability/day
   * Para: Atualizar um dia específico no calendário
   */
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
      // Converter camelCase para snake_case
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

  /**
   * 🔄 Atualiza disponibilidade em massa (vários dias)
   * Endpoint: POST /api/events/spaces/:id/availability/bulk
   * Para: Bulk actions no calendário
   */
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
      // Converter camelCase para snake_case
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

  /**
   * 🔄 Busca reservas com filtros (NOVO ENDPOINT)
   * ✅ CORREÇÃO: Removida propriedade 'pagination' que não existe no tipo
   * Endpoint: GET /api/events/spaces/:id/bookings/filtered
   * Para: Listar reservas com filtros avançados
   */
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

  // ====================== MÉTODOS EXISTENTES DE DISPONIBILIDADE (COMPATIBILIDADE) ======================

  /**
   * 📅 Busca disponibilidade (método existente - mantido para compatibilidade)
   * Endpoint: GET /api/events/spaces/:id/availability
   */
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

  /**
   * 📊 Lista reservas de um espaço (método existente - mantido para compatibilidade)
   * Endpoint: GET /api/events/spaces/:id/bookings
   */
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

  /**
   * 📅 Busca eventos futuros de um espaço (método existente)
   * Endpoint: GET /api/events/spaces/:id/bookings/upcoming
   */
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

  // ====================== HOTELS API (INTACTA) ======================
  
  async searchHotels(params: SearchParams): Promise<HotelSearchResponse> {
    try {
      return await this.get<HotelSearchResponse>('/api/v2/hotels/search', params);
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
      
      return await this.get<HotelListResponse>('/api/v2/hotels', params);
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
      return await this.get<HotelByIdResponse>(`/api/v2/hotels/${hotelId}`);
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
      return await this.get<AvailabilityResponse>('/api/v2/hotels/availability', params);
    } catch (error) {
      return {
        success: false,
        error: 'Erro na verificação de disponibilidade'
      };
    }
  }

  async createHotelBooking(bookingData: HotelBookingRequest): Promise<HotelBookingResponse> {
    try {
      return await this.post<HotelBookingResponse>('/api/v2/hotels/bookings', bookingData);
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao criar reserva'
      };
    }
  }

  async createHotel(data: HotelCreateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.post<HotelOperationResponse>('/api/v2/hotels', data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar hotel'
      };
    }
  }

  async updateHotel(hotelId: string, data: HotelUpdateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.put<HotelOperationResponse>(`/api/v2/hotels/${hotelId}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar hotel'
      };
    }
  }

  async deleteHotel(hotelId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.delete<ApiResponse<{ message: string }>>(`/api/v2/hotels/${hotelId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desativar hotel'
      };
    }
  }

  async getHotelStatsDetailed(hotelId: string): Promise<ApiResponse<HotelStatistics>> {
    try {
      return await this.get<ApiResponse<HotelStatistics>>(`/api/v2/hotels/${hotelId}/stats`);
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
      const response = await this.get<AvailabilityResponse>('/api/v2/hotels/availability/quick', params);
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
      return await this.get<MyHotelBookingsResponse>('/api/v2/hotels/my-bookings', { email, status });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter reservas'
      };
    }
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<HotelBookingData>> {
    try {
      return await this.get<ApiResponse<HotelBookingData>>(`/api/v2/hotels/bookings/${bookingId}`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter detalhes da reserva'
      };
    }
  }

  async cancelBooking(bookingId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.post<ApiResponse<{ message: string }>>(`/api/v2/hotels/bookings/${bookingId}/cancel`);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar reserva'
      };
    }
  }

  async createRoomType(hotelId: string, data: RoomTypeCreateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.post<HotelOperationResponse>(`/api/v2/hotels/${hotelId}/room-types`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar tipo de quarto'
      };
    }
  }

  async updateRoomType(roomTypeId: string, data: RoomTypeUpdateRequest): Promise<HotelOperationResponse> {
    try {
      return await this.put<HotelOperationResponse>(`/api/v2/hotels/room-types/${roomTypeId}`, data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de quarto'
      };
    }
  }

  async getRoomTypeById(roomTypeId: string): Promise<ApiResponse<RoomType>> {
    try {
      return await this.get<ApiResponse<RoomType>>(`/api/v2/hotels/room-types/${roomTypeId}`);
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
        `/api/v2/hotels/room-types/${roomTypeId}`,
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
      return await this.get<RoomTypeListResponse>(`/api/v2/hotels/${hotelId}/room-types`, params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar tipos de quarto'
      };
    }
  }

  async getRoomTypeDetails(hotelId: string, roomTypeId: string): Promise<ApiResponse<RoomType>> {
    try {
      return await this.get<ApiResponse<RoomType>>(`/api/v2/hotels/${hotelId}/room-types/${roomTypeId}`);
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
      return await this.post<ApiResponse<{ updated: number; message: string }>>(`/api/v2/hotels/${hotelId}/availability/bulk`, data);
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
      return await this.get<ApiResponse<HotelPerformance>>(`/api/v2/hotels/${hotelId}/performance`, params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter performance'
      };
    }
  }

  // ====================== OUTROS MÉTODOS (INTACTOS) ======================
  
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
    return this.get(`/api/v2/hotels/${hotelId}/stats`);
  }

  async getHotelEvents(hotelId: string, params?: { status?: BookingStatus; upcoming?: boolean }) {
    return this.get(`/api/v2/hotels/${hotelId}/events`, params);
  }

  async getChat(hotelId: string, params?: { threadId?: string; limit?: number }) {
    return this.get(`/api/v2/hotels/${hotelId}/chat`, params);
  }

  async cancelHotelBooking(bookingId: string) {
    return this.cancelBooking(bookingId);
  }

  async checkInHotelBooking(bookingId: string) {
    return this.post(`/api/v2/hotels/bookings/${bookingId}/check-in`);
  }

  async checkOutHotelBooking(bookingId: string) {
    return this.post(`/api/v2/hotels/bookings/${bookingId}/check-out`);
  }

  async getMyHotelBookings(email: string, status?: BookingStatus): Promise<MyHotelBookingsResponse> {
    return this.getBookingsByEmail(email, status);
  }

  async getHotels() {
    return this.getAllHotels();
  }

  async testHotelsV2(): Promise<ApiResponse<{ message: string; count?: number }>> {
    try {
      const response = await fetch(`${this.baseURL}/api/v2/hotels/search?location=Maputo&limit=1`, {
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
      return await this.get<ApiResponse<NightlyPrice[]>>('/api/v2/hotels/availability/nightly-prices', params);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter preços'
      };
    }
  }

  async getBookingStatus(bookingId: string): Promise<ApiResponse<{ status: BookingStatus; paymentStatus: PaymentStatus }>> {
    try {
      return await this.get<ApiResponse<{ status: BookingStatus; paymentStatus: PaymentStatus }>>(`/api/v2/hotels/bookings/${bookingId}/status`);
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
        const payload: HotelBookingRequest = {
          hotelId: bookingData.hotelId,
          roomTypeId: bookingData.roomTypeId,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guestName: bookingData.guestName,
          guestEmail: bookingData.guestEmail,
          guestPhone: bookingData.guestPhone,
          adults: bookingData.adults || 1,
          children: bookingData.children || 0,
          units: bookingData.units || 1,
          specialRequests: bookingData.specialRequests,
          promoCode: bookingData.promoCode
        };
        
        const result = await this.createHotelBooking(payload);
        
        return { 
          success: result.success, 
          data: result.booking ? { 
            booking: {
              id: result.booking.bookingId || result.booking.booking_id || '',
              type: 'hotel',
              bookingDate: result.booking.createdAt || result.booking.created_at || new Date().toISOString().split('T')[0],
              status: result.booking.status || 'pending',
              guestName: result.booking.guestName || result.booking.guest_name,
              guestEmail: result.booking.guestEmail || result.booking.guest_email,
              guestPhone: result.booking.guestPhone || result.booking.guest_phone,
              totalPrice: result.booking.totalPrice || result.booking.total_price || 0,
              hotelId: result.booking.hotelId || result.booking.hotel_id,
              startDate: result.booking.checkIn || result.booking.check_in,
              endDate: result.booking.checkOut || result.booking.check_out,
              adults: result.booking.adults || 0,
              children: result.booking.children || 0,
              units: result.booking.units || 0,
              createdAt: result.booking.createdAt || result.booking.created_at,
            } as Booking
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