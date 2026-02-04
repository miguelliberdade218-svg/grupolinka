// src/services/eventSpaceService.ts
// VERSÃO CORRIGIDA - 28/01/2026 - COM SUPORTE A CAMPOS DE LOCALIZAÇÃO
// ✅ ADICIONADO: Suporte para location_id, lat, lng, inherits_hotel_location
// ✅ ATUALIZADO: Funções auxiliares preparam dados de localização corretamente

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
  EventSpaceDetails,
  PaymentStatusType,
  BookingPayment,
  PaymentDetailsResponse,
  ManualPaymentRequest,
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
 * ✅ ATUALIZADO: Preserva campos de localização especiais
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
    
    // ✅ EXCEÇÃO: Campos de localização especiais - preservar como estão
    const locationFields = [
      'location_id', 'lat', 'lng', 'locality', 'province',
      'inherits_hotel_location'
    ];
    
    let snakeKey = key;
    
    // Se não for um campo de localização especial, converter camelCase para snake_case
    if (!locationFields.includes(key) && /[A-Z]/.test(key)) {
      snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    
    // ✅ Campos que devem ser mantidos como objetos sem conversão
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
 * ✅ NOVA FUNÇÃO: Prepara dados de localização para envio à API
 */
const prepareLocationData = (data: any): any => {
  const prepared = { ...data };
  
  // ✅ Converte números para strings se necessário (para lat/lng)
  if (prepared.lat !== undefined && prepared.lat !== null) {
    prepared.lat = String(prepared.lat);
  }
  if (prepared.lng !== undefined && prepared.lng !== null) {
    prepared.lng = String(prepared.lng);
  }
  
  // ✅ Remove campos vazios (string vazia)
  if (prepared.lat === '') delete prepared.lat;
  if (prepared.lng === '') delete prepared.lng;
  if (prepared.location_id === '') delete prepared.location_id;
  if (prepared.locality === '') delete prepared.locality;
  if (prepared.province === '') delete prepared.province;
  
  // ✅ Garante que inherits_hotel_location seja booleano
  if (prepared.inherits_hotel_location !== undefined) {
    prepared.inherits_hotel_location = Boolean(prepared.inherits_hotel_location);
  }
  
  return prepared;
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
 * Normaliza EventBooking para formato do frontend
 * ✅ ATUALIZADO: Garante balanceDue correto
 */
const normalizeEventBooking = (data: any): EventBooking => {
  if (!data) return data as EventBooking;
  
  // ✅ Verificar se o apiService tem uma função de normalização própria
  if ((apiService as any).normalizeEventBooking) {
    return (apiService as any).normalizeEventBooking(data);
  }
  
  // ✅ Extrair datas corretamente com ambos formatos
  const startDate = data.startDate || data.start_date || data.startDatetime || '';
  const endDate = data.endDate || data.end_date || data.endDatetime || '';
  
  // ✅ Extrair campos financeiros corretamente
  const totalPrice = String(data.totalPrice || data.total_price || data.totalPriceAmount || '0');
  const depositPaid = String(data.depositPaid || data.deposit_paid || data.depositPaidAmount || '0');
  
  // ✅ CORREÇÃO CRÍTICA: Calcular balanceDue corretamente
  let balanceDue = String(data.balanceDue || data.balance_due || data.balanceDueAmount || '0');
  
  // ✅ Se balanceDue não estiver definido, calcular com base em pagamentos
  if (balanceDue === '0' || balanceDue === '0.00') {
    if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
      const totalPaid = data.payments.reduce((sum: number, payment: any) => {
        return sum + Number(payment.amount || 0);
      }, 0);
      const totalPriceNum = Number(totalPrice) || 0;
      const calculatedBalance = Math.max(0, totalPriceNum - totalPaid);
      balanceDue = String(calculatedBalance);
    } else if (data.deposit_paid || data.depositPaid) {
      // Se houver depósito pago, calcular saldo
      const totalPriceNum = Number(totalPrice) || 0;
      const depositPaidNum = Number(depositPaid) || 0;
      balanceDue = String(Math.max(0, totalPriceNum - depositPaidNum));
    }
  }
  
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
    
    // ✅ Datas com ambos formatos para compatibilidade
    startDate: startDate,
    start_date: data.start_date || startDate,
    endDate: endDate,
    end_date: data.end_date || endDate,
    
    durationDays: Number(data.durationDays || data.duration_days || 1),
    expectedAttendees: Number(data.expectedAttendees || data.expected_attendees || 0),
    cateringRequired: !!data.cateringRequired || !!data.catering_required || false,
    specialRequests: data.specialRequests || data.special_requests || null,
    additionalServices: data.additionalServices || data.additional_services || {},
    basePrice: String(data.basePrice || data.base_price || '0'),
    
    // ✅ Campos financeiros completos
    totalPrice: totalPrice,
    total_price: totalPrice,
    securityDeposit: String(data.securityDeposit || data.security_deposit || '0'),
    depositPaid: depositPaid,
    balanceDue: balanceDue,
    balance_due: balanceDue, // ✅ Garantir que ambos formatos existem
    
    // ✅ Status atualizados
    status: (data.status || 'pending_approval') as EventBooking['status'],
    paymentStatus: (data.paymentStatus || data.payment_status || 'pending') as PaymentStatusType,
    
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    
    // Campos calculados/display
    dateRange: data.dateRange,
    statusDisplay: data.statusDisplay,
    
    // ✅ Campos do backend (snake_case para compatibilidade)
    deposit_paid: data.deposit_paid || depositPaid,
    payment_status: data.payment_status || data.paymentStatus,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
    
    // ✅ Campos de compatibilidade adicionais
    event_title: data.event_title || data.eventTitle,
    organizer_name: data.organizer_name || data.organizerName,
    organizer_email: data.organizer_email || data.organizerEmail,
    expected_attendees: data.expected_attendees || data.expectedAttendees,
    
    // Campo para compatibilidade com getFullBookingDetails
    payments: data.payments || [],
  };
};

interface EventBookingWithPayments extends EventBooking {
  payments?: BookingPayment[];
  logs?: any[];
}

class EventSpaceService {
  /**
   * Criar novo espaço de eventos
   * ✅ ATUALIZADO: Inclui preparação de dados de localização
   */
  async createEventSpace(data: CreateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    try {
      // ✅ CORREÇÃO: Prepara dados de localização
      const locationPreparedData = prepareLocationData(data);
      
      const preparedData = {
        ...locationPreparedData,
        equipment: processEquipmentField(data.equipment),
        setupOptions: Array.isArray(data.setupOptions) ? data.setupOptions : [],
        allowedEventTypes: Array.isArray(data.allowedEventTypes) ? data.allowedEventTypes : [],
        prohibitedEventTypes: Array.isArray(data.prohibitedEventTypes) ? data.prohibitedEventTypes : [],
        cateringMenuUrls: Array.isArray(data.cateringMenuUrls) ? data.cateringMenuUrls : [],
        images: Array.isArray(data.images) ? data.images : [],
      };
      
      // ✅ Aplicar conversão para snake_case (exceto campos de localização já tratados)
      const backendData = toSnakeCaseForEventSpaces(preparedData);
      
      console.log('📤 Criando espaço com dados:', {
        locality: backendData.locality,
        province: backendData.province,
        lat: backendData.lat,
        lng: backendData.lng,
        location_id: backendData.location_id,
        inherits_hotel_location: backendData.inherits_hotel_location
      });
      
      const res = await apiService.post<any>('/api/events/spaces', backendData);
      
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
   * ✅ ATUALIZADO: Inclui preparação de dados de localização
   */
  async updateEventSpace(spaceId: string, data: UpdateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    try {
      // ✅ CORREÇÃO: Prepara dados de localização
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
      
      const cleanData: any = {};
      Object.entries(preparedData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          cleanData[key] = value;
        }
      });
      
      // ✅ Aplicar conversão para snake_case
      const backendData = toSnakeCaseForEventSpaces(cleanData);
      
      console.log('📤 Atualizando espaço com dados de localização:', {
        spaceId,
        locality: backendData.locality,
        province: backendData.province,
        lat: backendData.lat,
        lng: backendData.lng,
        location_id: backendData.location_id,
        inherits_hotel_location: backendData.inherits_hotel_location
      });
      
      const res = await apiService.put<any>(`/api/events/spaces/${spaceId}`, backendData);
      
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
      const res = await apiService.searchEventSpaces(filters);
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
      const res = await apiService.delete<any>(`/api/events/spaces/${spaceId}`);
      
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
   * Criar reserva
   * ✅ CORREÇÃO: Preparar dados para garantir compatibilidade
   */
  async createBooking(bookingData: EventBookingRequest): Promise<ServiceResponse<EventBooking>> {
    try {
      // ✅ CORREÇÃO: Preparar dados para garantir compatibilidade
      const preparedData = {
        ...bookingData,
        // Garantir que ambos formatos de data estejam presentes
        startDate: bookingData.startDate,
        start_date: bookingData.startDate, // snake_case também
        endDate: bookingData.endDate,
        end_date: bookingData.endDate, // snake_case também
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
   * ✅ CORREÇÃO CRÍTICA: Método confirmBooking atualizado com logs de debug
   */
  async confirmBooking(bookingId: string): Promise<ServiceResponse<EventBooking>> {
    try {
      console.log('🔍 [eventSpaceService.confirmBooking] Chamado com bookingId:', bookingId);
      
      const res = await apiService.confirmEventBooking(bookingId);
      
      console.log('✅ [confirmBooking] Resposta do apiService:', res);
      
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
   * ✅ CORREÇÃO: Função cancelBooking atualizada para enviar apenas reason
   */
  async cancelBooking(
    bookingId: string, 
    reason?: string
  ): Promise<ServiceResponse<{ message: string }>> {
    try {
      // ✅ CORREÇÃO: O backend já trata reembolso automaticamente
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
      
      // ✅ CORREÇÃO: Normalizar todos os bookings
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
      
      // ✅ CORREÇÃO: Normalizar todos os bookings
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
      const res = await apiService.post<any>(`/api/events/bookings/${bookingId}/reject`, { reason });
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
   * ✅ CORREÇÃO: Método updateBookingStatus atualizado para todos os status
   */
  async updateBookingStatus(
    bookingId: string,
    status: 'pending_approval' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed' | 'rejected',
    notes?: string
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.put<any>(`/api/events/bookings/${bookingId}/status`, { 
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

      const res = await apiService.post<any>(`/api/events/bookings/${bookingId}/payments`, backendPayload);
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
      const res = await apiService.put<any>(`/api/events/bookings/${bookingId}/payment-status`, { 
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
      
      const res = await apiService.get<any>(`/api/events/hotels/${hotelId}/financial-summary`, { params });
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