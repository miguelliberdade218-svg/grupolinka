// src/services/eventSpaceService.ts
// VERSÃO FINAL CORRIGIDA - COM SUPORTE A EMAIL NA QUERY STRING
// ✅ CORREÇÃO CRÍTICA: Preservar durationDays e weekendSurcharge do backend
// ✅ CORREÇÃO: Normalização correta do número de noites
// ✅ CORREÇÃO: getBookingById agora requer email do organizador para validação

import { apiService } from './api';
import type {
  EventSpace,
  EventSpaceSearchParams,
  EventBooking,
  EventBookingRequest,
  EventAvailabilityResponse,
  EventSpaceReview,
  EventDashboardSummary,
  CreateEventSpaceRequest,
  UpdateEventSpaceRequest,
  EventSpaceDetailsResponse,
  EventSpaceData,
  PaymentStatusType,
  BookingPayment,
  PaymentDetailsResponse,
  ManualPaymentRequest,
  NearbyEventSpaceParams,
} from '@/shared/types/event-spaces';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Converte objeto camelCase para snake_case para envio ao backend
 */
const toSnakeCaseForEventSpaces = (obj: Record<string, any>, depth = 0): Record<string, any> => {
  if (depth > 5 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    
    const locationFields = [
      'location_id', 'lat', 'lng', 'locality', 'province',
      'inherits_hotel_location'
    ];
    
    let snakeKey = key;
    
    if (!locationFields.includes(key) && /[A-Z]/.test(key)) {
      snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    
    if (['equipment', 'additionalServices', 'equipmentValue'].includes(key) && 
        typeof value === 'object' && value !== null) {
      result[snakeKey] = value;
      return;
    }
    
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return toSnakeCaseForEventSpaces(item, depth + 1);
        }
        return item;
      });
      return;
    }
    
    if (typeof value === 'object' && value !== null) {
      result[snakeKey] = toSnakeCaseForEventSpaces(value, depth + 1);
      return;
    }
    
    result[snakeKey] = value;
  });
  
  return result;
};

/**
 * Processa o campo equipment para garantir formato correto
 */
const processEquipmentField = (equipment: any): any => {
  if (!equipment) return {};
  
  if (typeof equipment === 'object' && equipment !== null && !Array.isArray(equipment)) {
    const cleanObj: Record<string, any> = {};
    Object.entries(equipment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanObj[key] = value;
      }
    });
    return cleanObj;
  }
  
  if (typeof equipment === 'string') {
    try {
      let cleaned = equipment.trim();
      
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      cleaned = cleaned.replace(/\\"/g, '"');
      cleaned = cleaned.replace(/\\\\/g, '\\');
      
      const parsed = JSON.parse(cleaned);
      
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      
      if (Array.isArray(parsed)) {
        console.log('⚠️ Equipment é array, convertendo para objeto');
        return { items: parsed };
      }
      
      return { value: parsed };
    } catch (e) {
      console.warn('⚠️ equipment não é JSON válido, usando objeto vazio:', equipment);
      return {};
    }
  }
  
  if (Array.isArray(equipment)) {
    console.log('⚠️ Equipment é array, convertendo para objeto');
    return { items: equipment };
  }
  
  return {};
};

/**
 * Prepara dados de localização para envio à API
 */
const prepareLocationData = (data: any): any => {
  const prepared = { ...data };
  
  if (prepared.lat !== undefined && prepared.lat !== null) {
    prepared.lat = String(prepared.lat);
  }
  if (prepared.lng !== undefined && prepared.lng !== null) {
    prepared.lng = String(prepared.lng);
  }
  
  if (prepared.lat === '') delete prepared.lat;
  if (prepared.lng === '') delete prepared.lng;
  if (prepared.location_id === '') delete prepared.location_id;
  if (prepared.locality === '') delete prepared.locality;
  if (prepared.province === '') delete prepared.province;
  
  if (prepared.inherits_hotel_location !== undefined) {
    prepared.inherits_hotel_location = Boolean(prepared.inherits_hotel_location);
  }
  
  return prepared;
};

/**
 * Processa string de localização que pode conter vírgula
 */
const parseLocationString = (location: string): { locality: string; province?: string } => {
  if (!location) return { locality: '' };
  
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length > 1) {
    return {
      locality: parts[0],
      province: parts[1]
    };
  }
  
  return { locality: parts[0] };
};

/**
 * Extrai EventSpace dos dados da resposta
 */
const extractEventSpace = (data: any): EventSpace | null => {
  if (!data) return null;
  
  if (data.id && data.name) {
    return data as EventSpace;
  }
  
  if (data.space && typeof data.space === 'object' && data.space.id) {
    return data.space as EventSpace;
  }
  
  return null;
};

/**
 * Extrai EventSpaceData dos dados da resposta
 */
const extractEventSpaceData = (data: any): EventSpaceData | null => {
  if (!data) return null;
  
  if (data.id && data.name) {
    const spaceData = data as any;
    
    if (!Array.isArray(spaceData.amenities) || spaceData.amenities.length === 0) {
      spaceData.amenities = 
        (Array.isArray(data.amenities) ? data.amenities : null) ||
        (spaceData.equipment?.amenities && Array.isArray(spaceData.equipment.amenities) ? spaceData.equipment.amenities : null) ||
        (Array.isArray(spaceData.amenities_list) ? spaceData.amenities_list : null) ||
        [];
    }
    
    return spaceData as EventSpaceData;
  }
  
  if (data.space && typeof data.space === 'object' && data.space.id) {
    const spaceData = data.space as any;
    
    if (!Array.isArray(spaceData.amenities) || spaceData.amenities.length === 0) {
      spaceData.amenities = 
        (Array.isArray(data.amenities) ? data.amenities : null) ||
        (Array.isArray(spaceData.amenities) ? spaceData.amenities : null) ||
        (spaceData.equipment?.amenities && Array.isArray(spaceData.equipment.amenities) ? spaceData.equipment.amenities : null) ||
        (Array.isArray(spaceData.amenities_list) ? spaceData.amenities_list : null) ||
        [];
    }
    
    return spaceData as EventSpaceData;
  }
  
  return null;
};

/**
 * ✅ CORREÇÃO CRÍTICA: Normaliza EventBooking para formato do frontend
 * ✅ PRESERVA: durationDays, weekendSurcharge, totalPrice do backend
 */
const normalizeEventBooking = (data: any): EventBooking => {
  if (!data) return data as EventBooking;
  
  const startDate = data.startDate || data.start_date || data.startDatetime || '';
  const endDate = data.endDate || data.end_date || data.endDatetime || '';
  
  // ✅ CRÍTICO: Usar o valor REAL do backend, NÃO usar default 1!
  const durationDays = data.durationDays ?? data.duration_days ?? 1;
  const weekendSurcharge = String(data.weekendSurcharge || data.weekend_surcharge || '0');
  const totalPrice = String(data.totalPrice || data.total_price || data.totalPriceAmount || '0');
  const depositPaid = String(data.depositPaid || data.deposit_paid || data.depositPaidAmount || '0');
  const basePrice = String(data.basePrice || data.base_price || '0');
  
  let balanceDue = String(data.balanceDue || data.balance_due || data.balanceDueAmount || '0');
  
  if (balanceDue === '0' || balanceDue === '0.00') {
    if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
      const totalPaid = data.payments.reduce((sum: number, payment: any) => {
        return sum + Number(payment.amount || 0);
      }, 0);
      const totalPriceNum = Number(totalPrice) || 0;
      const calculatedBalance = Math.max(0, totalPriceNum - totalPaid);
      balanceDue = String(calculatedBalance);
    } else if (data.deposit_paid || data.depositPaid) {
      const totalPriceNum = Number(totalPrice) || 0;
      const depositPaidNum = Number(depositPaid) || 0;
      balanceDue = String(Math.max(0, totalPriceNum - depositPaidNum));
    }
  }
  
  // ✅ DEBUG: Verificar o que está a ser normalizado
  console.log('🔄 Normalizando booking:', {
    id: data.id,
    durationDays_original: data.durationDays,
    duration_days_original: data.duration_days,
    durationDays_normalized: durationDays,
    weekendSurcharge_original: data.weekendSurcharge,
    weekend_surcharge_original: data.weekend_surcharge,
    weekendSurcharge_normalized: weekendSurcharge,
    totalPrice_normalized: totalPrice
  });
  
  return {
    id: data.id || data.booking_id || '',
    eventSpaceId: data.eventSpaceId || data.event_space_id || data.spaceId || '',
    hotelId: data.hotelId || data.hotel_id || '',
    organizerName: data.organizerName || data.organizer_name || data.guestName || data.guest_name || '',
    organizerEmail: data.organizerEmail || data.organizer_email || data.guestEmail || data.guest_email || '',
    organizerPhone: data.organizerPhone || data.organizer_phone || data.guestPhone || data.guest_phone || null,
    eventTitle: data.eventTitle || data.event_title || '',
    eventDescription: data.eventDescription || data.event_description || null,
    eventType: data.eventType || data.event_type || '',
    startDate: startDate,
    start_date: data.start_date || startDate,
    endDate: endDate,
    end_date: data.end_date || endDate,
    // ✅ CORREÇÃO: Usar o valor REAL do backend!
    durationDays: Number(durationDays),
    expectedAttendees: Number(data.expectedAttendees || data.expected_attendees || 0),
    cateringRequired: !!data.cateringRequired || !!data.catering_required || false,
    specialRequests: data.specialRequests || data.special_requests || null,
    additionalServices: data.additionalServices || data.additional_services || {},
    basePrice: basePrice,
    // ✅ CORREÇÃO: Incluir weekendSurcharge!
    weekendSurcharge: weekendSurcharge,
    totalPrice: totalPrice,
    total_price: totalPrice,
    securityDeposit: String(data.securityDeposit || data.security_deposit || '0'),
    depositPaid: depositPaid,
    balanceDue: balanceDue,
    balance_due: balanceDue,
    status: (data.status || 'pending_approval') as EventBooking['status'],
    paymentStatus: (data.paymentStatus || data.payment_status || 'pending') as PaymentStatusType,
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    dateRange: data.dateRange,
    statusDisplay: data.statusDisplay,
    deposit_paid: data.deposit_paid || depositPaid,
    payment_status: data.payment_status || data.paymentStatus,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
    event_title: data.event_title || data.eventTitle,
    organizer_name: data.organizer_name || data.organizerName,
    organizer_email: data.organizer_email || data.organizerEmail,
    expected_attendees: data.expected_attendees || data.expectedAttendees,
    payments: data.payments || [],
  };
};

interface EventBookingWithPayments extends EventBooking {
  payments?: BookingPayment[];
  logs?: any[];
}

/**
 * Buscar espaços de eventos por proximidade
 */
async function searchNearbyEventSpaces(
  lat: number, 
  lng: number, 
  radius: number = 50,
  filters?: {
    startDate?: string;
    endDate?: string;
    capacity?: number;
    eventType?: string;
    maxPricePerDay?: number;
    amenities?: string[];
    minRating?: number;
    useExactLocations?: boolean;
  }
): Promise<ServiceResponse<EventSpace[]>> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    });
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.capacity) params.append('capacity', filters.capacity.toString());
    if (filters?.eventType) params.append('eventType', filters.eventType);
    if (filters?.maxPricePerDay) params.append('maxPricePerDay', filters.maxPricePerDay.toString());
    if (filters?.amenities?.length) params.append('amenities', filters.amenities.join(','));
    if (filters?.minRating) params.append('minRating', filters.minRating.toString());
    if (filters?.useExactLocations) params.append('useExactLocations', 'true');
    
    const url = `/api/events/spaces/search/nearby?${params.toString()}`;
    console.log('📍 Buscando espaços por proximidade:', url);
    
    const res = await apiService.get<any>(url);
    
    if (!res.success) {
      return { success: false, error: res.error || 'Erro na busca por proximidade' };
    }
    
    const eventSpaces = Array.isArray(res.data) 
      ? res.data.map((item: any) => extractEventSpace(item.space) || item.space || item)
      : [];
    
    return { success: true, data: eventSpaces };
  } catch (err: any) {
    console.error('[searchNearbyEventSpaces]', err);
    return { success: false, error: err.message || 'Falha na busca por proximidade' };
  }
}

class EventSpaceService {
  /**
   * Obter detalhes do espaço de eventos
   */
  async getEventSpaceDetails(spaceId: string): Promise<ServiceResponse<EventSpaceDetailsResponse>> {
    try {
      const response = await apiService.get<ApiResponse<EventSpaceDetailsResponse>>(`/api/events/spaces/${spaceId}`);
      
      if (!response.success) {
        return { success: false, error: response.error || 'Erro ao buscar detalhes do espaço' };
      }
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (err: any) {
      console.error('[getEventSpaceDetails]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar detalhes do espaço' 
      };
    }
  }

  /**
   * Obter apenas os dados do espaço
   */
  async getEventSpaceData(spaceId: string): Promise<ServiceResponse<EventSpaceData>> {
    try {
      const response = await this.getEventSpaceDetails(spaceId);
      
      if (!response.success || !response.data) {
        return { 
          success: false, 
          error: response.error || 'Erro ao buscar dados do espaço' 
        };
      }
      
      const spaceData = extractEventSpaceData(response.data);
      if (!spaceData) {
        return { 
          success: false, 
          error: 'Dados do espaço não retornados corretamente' 
        };
      }
      
      return { 
        success: true, 
        data: spaceData 
      };
    } catch (err: any) {
      console.error('[getEventSpaceData]', err);
      return { 
        success: false, 
        error: err.message || 'Erro ao buscar dados do espaço' 
      };
    }
  }

  /**
   * Criar reserva de evento
   * Endpoint: POST /api/events/spaces/:spaceId/bookings
   */
  async createEventBooking(spaceId: string, bookingData: any): Promise<ServiceResponse<EventBooking>> {
    try {
      console.log('📤 Enviando reserva para o backend:', {
        url: `/api/events/spaces/${spaceId}/bookings`,
        data: bookingData
      });
      
      const response = await apiService.post<ApiResponse<EventBooking>>(
        `/api/events/spaces/${spaceId}/bookings`, 
        bookingData
      );
      
      console.log('📥 Resposta do backend:', response);
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.error || 'Erro ao criar reserva' 
        };
      }
      
      if (!response.data) {
        return { 
          success: false, 
          error: 'Resposta do backend não contém dados' 
        };
      }
      
      const normalizedBooking = normalizeEventBooking(response.data);
      
      console.log('✅ Booking normalizado:', {
        id: normalizedBooking.id,
        durationDays: normalizedBooking.durationDays,
        totalPrice: normalizedBooking.totalPrice
      });
      
      return { 
        success: true, 
        data: normalizedBooking, 
        message: response.message || 'Reserva criada com sucesso' 
      };
    } catch (err: any) {
      console.error('[createEventBooking] ERRO CRÍTICO:', err);
      
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Dados:', err.response.data);
        console.error('Headers:', err.response.headers);
      }
      
      return { 
        success: false, 
        error: err.message || 'Erro ao criar reserva',
        details: err.response?.data || err
      };
    }
  }

  /**
   * ✅ BUSCAR RESERVA POR ID - COM VALIDAÇÃO DE EMAIL
   * Endpoint: GET /api/events/bookings/:bookingId?email=cliente@email.com
   */
  async getBookingById(bookingId: string, organizerEmail?: string): Promise<ServiceResponse<EventBooking>> {
    try {
      if (!organizerEmail) {
        console.warn('[getBookingById] Email do organizador não fornecido. A tentar buscar sem validação...');
      }
      
      let url = `/api/events/bookings/${bookingId}`;
      if (organizerEmail) {
        url += `?email=${encodeURIComponent(organizerEmail)}`;
      }
      
      console.log(`🔍 Buscando reserva de evento: ${url}`);
      
      const response = await apiService.get<ApiResponse<any>>(url);
      
      console.log('📥 Resposta getBookingById:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.error || 'Reserva não encontrada' 
        };
      }
      
      if (!response.data) {
        return { 
          success: false, 
          error: 'Dados da reserva não retornados' 
        };
      }

      let bookingData = response.data;
      if (response.data.booking) {
        bookingData = response.data.booking;
      }
      
      // ✅ DEBUG: Verificar o que o backend enviou
      console.log('📦 Dados brutos do backend:', {
        id: bookingData.id,
        durationDays: bookingData.durationDays,
        duration_days: bookingData.duration_days,
        weekendSurcharge: bookingData.weekendSurcharge,
        weekend_surcharge: bookingData.weekend_surcharge,
        totalPrice: bookingData.totalPrice,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate
      });
      
      const normalizedBooking = normalizeEventBooking(bookingData);
      
      // ✅ DEBUG: Verificar o que foi normalizado
      console.log('✅ Booking normalizado:', {
        id: normalizedBooking.id,
        durationDays: normalizedBooking.durationDays,
        weekendSurcharge: normalizedBooking.weekendSurcharge,
        totalPrice: normalizedBooking.totalPrice,
        nights: normalizedBooking.durationDays
      });
      
      return { 
        success: true, 
        data: normalizedBooking,
        message: response.message 
      };
      
    } catch (err: any) {
      console.error('[getBookingById] ERRO:', err);
      
      if (err.response?.status === 403) {
        return { 
          success: false, 
          error: 'Acesso negado. Esta reserva não pertence a este email.',
          details: err.response?.data
        };
      }
      
      if (err.response?.status === 404) {
        return { 
          success: false, 
          error: 'Reserva não encontrada',
          details: err.response?.data
        };
      }
      
      return { 
        success: false, 
        error: err.message || 'Erro ao buscar reserva',
        details: err.response?.data || err
      };
    }
  }

  /**
   * Criar novo espaço de eventos
   */
  async createEventSpace(data: CreateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    try {
      const locationPreparedData = prepareLocationData(data);
      
      const preparedData = {
        ...locationPreparedData,
        equipment: processEquipmentField(data.equipment),
        setupOptions: Array.isArray(data.setupOptions) ? data.setupOptions : [],
        allowedEventTypes: Array.isArray(data.allowedEventTypes) ? data.allowedEventTypes : [],
        prohibitedEventTypes: Array.isArray(data.prohibitedEventTypes) ? data.prohibitedEventTypes : [],
        cateringMenuUrls: Array.isArray(data.cateringMenuUrls) ? data.cateringMenuUrls : [],
        images: Array.isArray(data.images) ? data.images : [],
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
      };
      
      const backendData = toSnakeCaseForEventSpaces(preparedData);
      
      const res = await apiService.post<ApiResponse<EventSpace>>('/api/events/spaces', backendData);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao criar espaço' };
      }
      
      const eventSpace = extractEventSpace(res.data);
      if (!eventSpace) {
        return { success: false, error: 'Dados do espaço não retornados corretamente' };
      }
      
      return { success: true, data: eventSpace, message: 'Espaço criado com sucesso' };
    } catch (err: any) {
      console.error('[createEventSpace]', err);
      
      let errorMessage = err.message || 'Falha ao criar espaço';
      let validationErrors = null;

      if (err.response?.data?.errors) {
        validationErrors = err.response.data.errors;
        errorMessage = 'Dados inválidos: verifique os campos obrigatórios';
      }

      return { 
        success: false, 
        error: errorMessage,
        details: validationErrors 
      };
    }
  }

  /**
   * Atualizar espaço de eventos
   */
  async updateEventSpace(spaceId: string, data: UpdateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    try {
      const locationPreparedData = prepareLocationData(data);
      
      const preparedData: any = { ...locationPreparedData };
      
      if (data.equipment !== undefined) {
        preparedData.equipment = processEquipmentField(data.equipment);
      }
      
      if (data.setupOptions !== undefined) {
        preparedData.setupOptions = Array.isArray(data.setupOptions) ? data.setupOptions : [];
      }
      
      if (data.allowedEventTypes !== undefined) {
        preparedData.allowedEventTypes = Array.isArray(data.allowedEventTypes) ? data.allowedEventTypes : [];
      }
      
      if (data.prohibitedEventTypes !== undefined) {
        preparedData.prohibitedEventTypes = Array.isArray(data.prohibitedEventTypes) ? data.prohibitedEventTypes : [];
      }
      
      if (data.cateringMenuUrls !== undefined) {
        preparedData.cateringMenuUrls = Array.isArray(data.cateringMenuUrls) ? data.cateringMenuUrls : [];
      }
      
      if (data.images !== undefined) {
        preparedData.images = Array.isArray(data.images) ? data.images : [];
      }
      
      if (data.amenities !== undefined) {
        preparedData.amenities = Array.isArray(data.amenities) ? data.amenities : [];
      }
      
      const cleanData: any = {};
      Object.entries(preparedData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          cleanData[key] = value;
        }
      });
      
      const backendData = toSnakeCaseForEventSpaces(cleanData);
      
      const res = await apiService.put<ApiResponse<EventSpace>>(`/api/events/spaces/${spaceId}`, backendData);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao atualizar espaço' };
      }
      
      const eventSpace = extractEventSpace(res.data);
      if (!eventSpace) {
        return { success: false, error: 'Dados do espaço não retornados corretamente' };
      }
      
      return { success: true, data: eventSpace, message: 'Espaço atualizado com sucesso' };
    } catch (err: any) {
      console.error('[updateEventSpace]', err);
      
      let errorMessage = err.message || 'Falha ao atualizar espaço';
      let validationErrors = null;

      if (err.response?.data?.errors) {
        validationErrors = err.response.data.errors;
        errorMessage = 'Dados inválidos: verifique os campos obrigatórios';
      }

      return { 
        success: false, 
        error: errorMessage,
        details: validationErrors 
      };
    }
  }

  /**
   * Obter espaço por ID
   */
  async getEventSpaceById(spaceId: string): Promise<ServiceResponse<EventSpace>> {
    try {
      const res = await apiService.getEventSpaceDetails(spaceId);
      if (!res.success) {
        return { success: false, error: res.error || 'Espaço não encontrado' };
      }
      
      const eventSpace = extractEventSpace(res.data);
      if (!eventSpace) {
        return { success: false, error: 'Dados do espaço não retornados corretamente' };
      }
      
      return { success: true, data: eventSpace };
    } catch (err: any) {
      console.error('[getEventSpaceById]', err);
      return { success: false, error: err.message || 'Erro ao buscar espaço' };
    }
  }

  /**
   * Obter espaços por hotel
   */
  async getEventSpacesByHotel(hotelId: string, includeInactive = false): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const res = await apiService.getEventSpacesByHotel(hotelId, includeInactive);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao listar espaços' };
      }
      
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[getEventSpacesByHotel]', err);
      return { success: false, error: err.message || 'Falha ao buscar espaços do hotel' };
    }
  }

  /**
   * Pesquisar espaços
   */
  async searchEventSpaces(filters: EventSpaceSearchParams): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const cleanFilters: Record<string, any> = {};
      
      if (filters.locality) {
        const parsedLocation = parseLocationString(filters.locality);
        if (parsedLocation.locality) {
          cleanFilters.locality = parsedLocation.locality;
        }
        if (parsedLocation.province) {
          cleanFilters.province = parsedLocation.province;
        }
      }
      
      if (filters.province && !filters.locality?.includes(filters.province)) {
        cleanFilters.province = filters.province;
      }
      if (filters.query) cleanFilters.query = filters.query;
      if (filters.startDate) cleanFilters.startDate = filters.startDate;
      if (filters.endDate) cleanFilters.endDate = filters.endDate;
      if (filters.capacity) cleanFilters.capacity = filters.capacity;
      if (filters.eventType) cleanFilters.eventType = filters.eventType;
      if (filters.maxPricePerDay) cleanFilters.maxPricePerDay = filters.maxPricePerDay;
      if (filters.hotelId) cleanFilters.hotelId = filters.hotelId;
      if (filters.amenities?.length) cleanFilters.amenities = filters.amenities;
      
      const res = await apiService.searchEventSpaces(cleanFilters);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro na busca de espaços' };
      }
      
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[searchEventSpaces]', err);
      return { success: false, error: err.message || 'Falha na busca de espaços' };
    }
  }

  /**
   * Buscar espaços por proximidade
   */
  async searchNearbyEventSpaces(
    lat: number, 
    lng: number, 
    radius: number = 50,
    filters?: {
      startDate?: string;
      endDate?: string;
      capacity?: number;
      eventType?: string;
      maxPricePerDay?: number;
      amenities?: string[];
      minRating?: number;
      useExactLocations?: boolean;
    }
  ): Promise<ServiceResponse<EventSpace[]>> {
    return await searchNearbyEventSpaces(lat, lng, radius, filters);
  }

  /**
   * Obter espaços em destaque
   */
  async getFeaturedEventSpaces(limit = 10): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const res = await apiService.getFeaturedEventSpaces(limit);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar espaços em destaque' };
      }
      
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[getFeaturedEventSpaces]', err);
      return { success: false, error: err.message || 'Falha ao buscar destacados' };
    }
  }

  /**
   * Deletar espaço
   */
  async deleteEventSpace(spaceId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      const res = await apiService.delete<ApiResponse<{ message: string }>>(`/api/events/spaces/${spaceId}`);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao deletar espaço' };
      }
      
      return { 
        success: true, 
        data: { message: res.message || 'Espaço deletado com sucesso' },
        message: 'Espaço removido'
      };
    } catch (err: any) {
      console.error('[deleteEventSpace]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao deletar espaço. Verifique permissões ou conexão.' 
      };
    }
  }

  /**
   * Criar reserva (método genérico)
   */
  async createBooking(bookingData: EventBookingRequest): Promise<ServiceResponse<EventBooking>> {
    try {
      const preparedData = {
        ...bookingData,
        startDate: bookingData.startDate,
        start_date: bookingData.startDate,
        endDate: bookingData.endDate,
        end_date: bookingData.endDate,
      };
      
      const res = await apiService.createEventBooking(preparedData);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao criar reserva' };
      }
      
      return { 
        success: true, 
        data: normalizeEventBooking(res.data), 
        message: res.message || 'Reserva criada (aguardando aprovação)' 
      };
    } catch (err: any) {
      console.error('[createBooking]', err);
      return { success: false, error: err.message || 'Falha ao criar reserva' };
    }
  }

  /**
   * Obter detalhes da reserva
   */
  async getBookingDetails(bookingId: string): Promise<ServiceResponse<EventBookingWithPayments>> {
    try {
      const res = await apiService.getEventBookingDetails(bookingId);
      if (!res.success) {
        return { success: false, error: res.error || 'Reserva não encontrada' };
      }
      if (!res.data) {
        return { success: false, error: 'Dados da reserva não retornados' };
      }
      return { success: true, data: normalizeEventBooking(res.data) as EventBookingWithPayments };
    } catch (err: any) {
      console.error('[getBookingDetails]', err);
      return { success: false, error: err.message || 'Erro ao buscar detalhes da reserva' };
    }
  }

  /**
   * Confirmar reserva
   */
  async confirmBooking(bookingId: string): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.confirmEventBooking(bookingId);
      
      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao confirmar reserva' 
        };
      }
      
      if (!res.data) {
        return { 
          success: false, 
          error: 'Dados da reserva não retornados após confirmação' 
        };
      }
      
      return { 
        success: true, 
        data: normalizeEventBooking(res.data), 
        message: 'Reserva confirmada com sucesso' 
      };
    } catch (err: any) {
      console.error('❌ [confirmBooking] ERRO:', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao confirmar reserva' 
      };
    }
  }

  /**
   * Cancelar reserva
   */
  async cancelBooking(
    bookingId: string, 
    reason?: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      const res = await apiService.cancelEventBooking(bookingId, { reason });
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao cancelar reserva' };
      }
      
      return { 
        success: true, 
        data: { message: res.message || 'Cancelada com sucesso' },
        message: 'Reserva cancelada'
      };
    } catch (err: any) {
      console.error('[cancelBooking]', err);
      return { success: false, error: err.message || 'Falha ao cancelar reserva' };
    }
  }

  /**
   * Obter minhas reservas
   */
  async getMyBookings(email?: string): Promise<ServiceResponse<EventBooking[]>> {
    try {
      const res = await apiService.getMyEventBookings(email);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar minhas reservas' };
      }
      
      const bookings = Array.isArray(res.data) 
        ? res.data.map(booking => normalizeEventBooking(booking))
        : [];
      
      return { success: true, data: bookings };
    } catch (err: any) {
      console.error('[getMyBookings]', err);
      return { success: false, error: err.message || 'Falha ao buscar reservas' };
    }
  }

  /**
   * Obter reservas por espaço
   */
  async getBookings(
    spaceId: string,
    params?: { status?: string; startDate?: string; endDate?: string; limit?: number }
  ): Promise<ServiceResponse<EventBooking[]>> {
    try {
      const res = await apiService.getEventSpaceBookings(spaceId, params);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao listar reservas' };
      }
      
      const bookings = Array.isArray(res.data) 
        ? res.data.map(booking => normalizeEventBooking(booking))
        : [];
      
      return { success: true, data: bookings };
    } catch (err: any) {
      console.error('[getBookings]', err);
      return { success: false, error: err.message || 'Falha ao buscar reservas do espaço' };
    }
  }

  /**
   * Verificar disponibilidade
   */
  async checkAvailability(
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<EventAvailabilityResponse>> {
    try {
      const res = await apiService.checkEventSpaceAvailability(spaceId, startDate, endDate);
      if (!res.success) {
        return { success: false, error: res.message || 'Erro na verificação de disponibilidade' };
      }
      return { success: true, data: res };
    } catch (err: any) {
      console.error('[checkAvailability]', err);
      return { success: false, error: err.message || 'Falha na verificação de disponibilidade' };
    }
  }

  /**
   * Calcular preço
   */
  async calculatePrice(
    spaceId: string,
    startDate: string,
    endDate: string,
    cateringRequired = false
  ): Promise<ServiceResponse<{ price: number; breakdown: any }>> {
    try {
      const res = await apiService.calculateEventPrice(spaceId, startDate, endDate, cateringRequired);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao calcular preço' };
      }
      return { success: true, data: res.data || { price: 0, breakdown: {} } };
    } catch (err: any) {
      console.error('[calculatePrice]', err);
      return { success: false, error: err.message || 'Falha ao calcular preço' };
    }
  }

  /**
   * Obter calendário
   */
  async getCalendar(
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResponse<any[]>> {
    try {
      const res = await apiService.getEventSpaceCalendar(spaceId, startDate, endDate);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao carregar calendário' };
      }
      return { success: true, data: res.data || [] };
    } catch (err: any) {
      console.error('[getCalendar]', err);
      return { success: false, error: err.message || 'Falha ao carregar disponibilidade' };
    }
  }

  /**
   * Atualizar disponibilidade de um dia
   */
  async updateDayAvailability(
    spaceId: string,
    data: { date: string; isAvailable?: boolean; stopSell?: boolean; priceOverride?: number }
  ): Promise<ServiceResponse<any>> {
    try {
      const cleanData = {
        date: data.date,
        isAvailable: data.isAvailable,
        stopSell: data.stopSell,
        priceOverride: data.priceOverride !== null && data.priceOverride !== undefined ? data.priceOverride : undefined
      };
      
      const res = await apiService.updateEventSpaceDayAvailability(spaceId, cleanData);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao atualizar dia' };
      }
      return { success: true, data: res.data, message: 'Dia atualizado' };
    } catch (err: any) {
      console.error('[updateDayAvailability]', err);
      return { success: false, error: err.message || 'Falha ao atualizar disponibilidade' };
    }
  }

  /**
   * Atualização em massa de disponibilidade
   */
  async bulkUpdateAvailability(
    spaceId: string,
    updates: Array<{ date: string; isAvailable?: boolean; stopSell?: boolean; priceOverride?: number }>
  ): Promise<ServiceResponse<{ updated: number; message: string }>> {
    try {
      const cleanUpdates = updates.map(update => ({
        date: update.date,
        isAvailable: update.isAvailable,
        stopSell: update.stopSell,
        priceOverride: update.priceOverride !== null && update.priceOverride !== undefined ? update.priceOverride : undefined
      }));
      
      const res = await apiService.bulkUpdateEventSpaceAvailability(spaceId, cleanUpdates);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro na atualização em massa' };
      }
      return { 
        success: true, 
        data: { 
          updated: res.data?.updated || cleanUpdates.length,
          message: res.message || `${cleanUpdates.length} dias atualizados` 
        }, 
        message: 'Atualização em massa concluída' 
      };
    } catch (err: any) {
      console.error('[bulkUpdateAvailability]', err);
      return { success: false, error: err.message || 'Falha na atualização em massa' };
    }
  }

  /**
   * Obter avaliações
   */
  async getReviews(
    spaceId: string,
    limit = 10,
    offset = 0
  ): Promise<ServiceResponse<EventSpaceReview[]>> {
    try {
      const res = await apiService.getEventSpaceReviews(spaceId, { limit, offset });
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar reviews' };
      }
      return { success: true, data: res.data || [] };
    } catch (err: any) {
      console.error('[getReviews]', err);
      return { success: false, error: err.message || 'Falha ao buscar avaliações' };
    }
  }

  /**
   * Obter resumo do dashboard
   */
  async getDashboardSummary(hotelId: string): Promise<ServiceResponse<EventDashboardSummary>> {
    try {
      const res = await apiService.getEventDashboardSummary(hotelId);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar dashboard' };
      }
      return { success: true, data: res.data };
    } catch (err: any) {
      console.error('[getDashboardSummary]', err);
      return { success: false, error: err.message || 'Falha ao buscar resumo do dashboard' };
    }
  }

  /**
   * Obter pagamentos da reserva
   */
  async getBookingPayments(bookingId: string): Promise<ServiceResponse<BookingPayment[]>> {
    try {
      const res = await apiService.get<ApiResponse<PaymentDetailsResponse>>(`/api/events/bookings/${bookingId}/payment`);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar pagamentos' };
      }

      if (!res.data) {
        return { success: false, error: 'Nenhum dado de pagamento retornado' };
      }

      const payments = res.data.payments || [];
      
      return { success: true, data: payments };
    } catch (err: any) {
      console.error('[getBookingPayments]', err);
      return { success: false, error: err.message || 'Erro ao buscar pagamentos' };
    }
  }

  /**
   * Rejeitar reserva
   */
  async rejectBooking(
    bookingId: string,
    reason: string
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.post<ApiResponse<EventBooking>>(`/api/events/bookings/${bookingId}/reject`, { reason });
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao rejeitar reserva' };
      }
      return { 
        success: true, 
        data: normalizeEventBooking(res.data), 
        message: 'Reserva rejeitada com sucesso' 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao rejeitar reserva' };
    }
  }

  /**
   * Atualizar status da reserva
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'pending_approval' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed' | 'rejected',
    notes?: string
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.put<ApiResponse<EventBooking>>(`/api/events/bookings/${bookingId}/status`, { 
        status,
        notes 
      });
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao atualizar status' };
      }
      return { 
        success: true, 
        data: normalizeEventBooking(res.data), 
        message: `Status atualizado para ${status}` 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao atualizar status da reserva' };
    }
  }

  /**
   * Registrar pagamento manual
   */
  async registerManualPayment(
    bookingId: string,
    payload: {
      amount: number;
      paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
      reference: string;
      notes?: string;
      paymentType?: string;
    }
  ): Promise<ServiceResponse<any>> {
    try {
      const backendPayload: ManualPaymentRequest = {
        amount: payload.amount,
        payment_method: payload.paymentMethod,
        reference: payload.reference,
        notes: payload.notes,
        payment_type: payload.paymentType || 'manual_event_payment',
      };

      const res = await apiService.post<ApiResponse<any>>(`/api/events/bookings/${bookingId}/payments`, backendPayload);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao registrar pagamento' };
      }
      return { 
        success: true, 
        data: res.data, 
        message: 'Pagamento manual registrado com sucesso' 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao registrar pagamento manual' };
    }
  }

  /**
   * Atualizar status de pagamento
   */
  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: PaymentStatusType,
    reference?: string
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.put<ApiResponse<EventBooking>>(`/api/events/bookings/${bookingId}/payment-status`, { 
        paymentStatus,
        reference 
      });
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao atualizar status de pagamento' };
      }
      return { 
        success: true, 
        data: normalizeEventBooking(res.data), 
        message: `Pagamento atualizado para ${paymentStatus}` 
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao atualizar status de pagamento' };
    }
  }

  /**
   * Obter detalhes completos da reserva
   */
  async getFullBookingDetails(bookingId: string): Promise<ServiceResponse<{
    booking: EventBookingWithPayments;
    payments: BookingPayment[];
    logs: any[];
  }>> {
    try {
      const bookingRes = await this.getBookingDetails(bookingId);
      
      if (!bookingRes.success) {
        return { success: false, error: bookingRes.error };
      }

      if (!bookingRes.data) {
        return { success: false, error: 'Dados da reserva não encontrados' };
      }

      let payments: BookingPayment[] = [];
      try {
        const paymentsRes = await apiService.get<ApiResponse<PaymentDetailsResponse>>(`/api/events/bookings/${bookingId}/payment`);
        if (paymentsRes.success && paymentsRes.data?.payments) {
          payments = paymentsRes.data.payments;
        }
      } catch (error) {
        console.warn('⚠️ Endpoint de pagamentos não disponível:', error);
        const bookingData = bookingRes.data;
        if (bookingData.payments) {
          payments = Array.isArray(bookingData.payments) 
            ? bookingData.payments 
            : [bookingData.payments];
        }
      }

      let logs = [];
      try {
        const logsRes = await apiService.get<any>(`/api/events/bookings/${bookingId}/logs`);
        if (logsRes.success && Array.isArray(logsRes.data)) {
          logs = logsRes.data;
        }
      } catch (error) {
        console.warn('⚠️ Endpoint de logs não disponível:', error);
      }

      return {
        success: true,
        data: {
          booking: bookingRes.data,
          payments: payments,
          logs: logs
        }
      };
    } catch (err: any) {
      console.error('[getFullBookingDetails]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao carregar detalhes da reserva' 
      };
    }
  }

  /**
   * Obter resumo financeiro do hotel
   */
  async getHotelFinancialSummary(
    hotelId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await apiService.get<ApiResponse<any>>(`/api/events/hotels/${hotelId}/financial-summary`, { params });
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar resumo financeiro' };
      }
      return { 
        success: true, 
        data: res.data 
      };
    } catch (err: any) {
      console.error('[getHotelFinancialSummary]', err);
      return { success: false, error: err.message || 'Falha ao buscar resumo financeiro' };
    }
  }
}

export const eventSpaceService = new EventSpaceService();
export default eventSpaceService;