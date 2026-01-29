// src/services/eventSpaceService.ts
// VERSÃO FINAL CORRIGIDA - 26/01/2026 - COM TODAS AS MELHORIAS APLICADAS
// Completa, alinhada com apiService.ts e shared/types/event-spaces.ts
// Usa SOMENTE métodos do apiService, retorna formato uniforme { success, data?, error?, message? }

import { apiService } from './api'; // ← Ajusta o path se for '@/services/apiService' ou outro
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
  EventSpaceSearchResponse,
  EventBookingResponse,
} from '@/shared/types/event-spaces';

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any; // Para erros de validação detalhados
}

// ✅ FUNÇÃO MELHORADA: toSnakeCase que preserva campos JSON com recursão controlada
const toSnakeCaseForEventSpaces = (obj: Record<string, any>, depth = 0): Record<string, any> => {
  // Prevenir recursão infinita
  if (depth > 5 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // Se for undefined, pular (não incluir no resultado)
    if (value === undefined) {
      return;
    }
    
    let snakeKey = key;
    // Converter para snake_case apenas se tiver letras maiúsculas
    if (/[A-Z]/.test(key)) {
      snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    
    // Preservar campos especiais que já são objetos JSON
    if (['equipment', 'additionalServices', 'equipmentValue'].includes(key) && 
        typeof value === 'object' && value !== null) {
      result[snakeKey] = value;
      return;
    }
    
    // Processar arrays
    if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return toSnakeCaseForEventSpaces(item, depth + 1);
        }
        return item;
      });
      return;
    }
    
    // Processar objetos aninhados (exceto os campos especiais)
    if (typeof value === 'object' && value !== null) {
      result[snakeKey] = toSnakeCaseForEventSpaces(value, depth + 1);
      return;
    }
    
    // Valores primitivos
    result[snakeKey] = value;
  });
  
  return result;
};

// ✅ CORREÇÃO MELHORADA: Função para processar equipment corretamente
const processEquipmentField = (equipment: any): any => {
  // Se não existir, retornar objeto vazio
  if (!equipment) return {};
  
  // Se já for objeto válido, usar diretamente
  if (typeof equipment === 'object' && equipment !== null && !Array.isArray(equipment)) {
    // Garantir que não tenha propriedades undefined
    const cleanObj: Record<string, any> = {};
    Object.entries(equipment).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanObj[key] = value;
      }
    });
    return cleanObj;
  }
  
  // Se for string, tentar parsear
  if (typeof equipment === 'string') {
    try {
      // Remover escapes duplos e aspas extras
      let cleaned = equipment.trim();
      
      // Remover aspas externas se existirem
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Remover escapes
      cleaned = cleaned.replace(/\\"/g, '"');
      cleaned = cleaned.replace(/\\\\/g, '\\');
      
      const parsed = JSON.parse(cleaned);
      
      // Verificar se é objeto (não array)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
      
      // Se for array, transformar em objeto com chave "items"
      if (Array.isArray(parsed)) {
        console.log('⚠️ Equipment é array, convertendo para objeto');
        return { items: parsed };
      }
      
      // Se não for objeto nem array, criar objeto com o valor
      return { value: parsed };
    } catch (e) {
      console.warn('⚠️ equipment não é JSON válido, usando objeto vazio:', equipment);
      return {};
    }
  }
  
  // Se for array, transformar em objeto com chave "items"
  if (Array.isArray(equipment)) {
    console.log('⚠️ Equipment é array, convertendo para objeto');
    return { items: equipment };
  }
  
  // Qualquer outro caso, objeto vazio
  return {};
};

// ✅ FUNÇÃO AUXILIAR: Extrair EventSpace de EventSpaceDetails
const extractEventSpace = (data: any): EventSpace | null => {
  if (!data) return null;
  
  // Se já for EventSpace (tem id, name, etc)
  if (data.id && data.name) {
    return data as EventSpace;
  }
  
  // Se for EventSpaceDetails (tem propriedade space)
  if (data.space && typeof data.space === 'object' && data.space.id) {
    return data.space as EventSpace;
  }
  
  return null;
};

// ✅ FUNÇÃO AUXILIAR: Normalizar EventBooking - CORRIGIDA para usar organizerName em vez de guestName
const normalizeEventBooking = (data: any): EventBooking => {
  if (!data) return data;
  
  // Usar normalizeEventBooking do apiService se existir
  if ((apiService as any).normalizeEventBooking) {
    return (apiService as any).normalizeEventBooking(data);
  }
  
  // Fallback: mapear campos manualmente
  return {
    id: data.id || data.booking_id || '',
    eventSpaceId: data.eventSpaceId || data.event_space_id || data.spaceId || '',
    hotelId: data.hotelId || data.hotel_id || '',
    organizerName: data.organizerName || data.organizer_name || data.guestName || data.guest_name || '', // CORREÇÃO: guestName → organizerName
    organizerEmail: data.organizerEmail || data.organizer_email || data.guestEmail || data.guest_email || '', // CORREÇÃO: guestEmail → organizerEmail
    organizerPhone: data.organizerPhone || data.organizer_phone || data.guestPhone || data.guest_phone || null, // CORREÇÃO: guestPhone → organizerPhone
    eventTitle: data.eventTitle || data.event_title || '',
    eventDescription: data.eventDescription || data.event_description || null,
    eventType: data.eventType || data.event_type || '',
    startDate: data.startDate || data.start_date || '',
    endDate: data.endDate || data.end_date || '',
    durationDays: Number(data.durationDays || data.duration_days || 1),
    expectedAttendees: Number(data.expectedAttendees || data.expected_attendees || 0),
    cateringRequired: !!data.cateringRequired || !!data.catering_required || false,
    specialRequests: data.specialRequests || data.special_requests || null,
    additionalServices: data.additionalServices || data.additional_services || {},
    basePrice: String(data.basePrice || data.base_price || '0'),
    totalPrice: String(data.totalPrice || data.total_price || '0'),
    securityDeposit: String(data.securityDeposit || data.security_deposit || '0'),
    status: data.status || 'pending_approval',
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
  };
};

class EventSpaceService {
  // ==================== ESPAÇOS ====================

  async createEventSpace(data: CreateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    // ✅ CORREÇÃO: Vamos assumir que o apiService não suporta AbortSignal
    // Se necessário, implemente timeout de outra forma
    try {
      // ✅ CORREÇÃO: Preparar dados com campos JSON corretos
      const preparedData = {
        ...data,
        // ✅ CORREÇÃO: Usar a função processEquipmentField para garantir objeto válido
        equipment: processEquipmentField(data.equipment),
        // Outros campos que devem ser arrays
        setupOptions: Array.isArray(data.setupOptions) ? data.setupOptions : [],
        allowedEventTypes: Array.isArray(data.allowedEventTypes) ? data.allowedEventTypes : [],
        prohibitedEventTypes: Array.isArray(data.prohibitedEventTypes) ? data.prohibitedEventTypes : [],
        cateringMenuUrls: Array.isArray(data.cateringMenuUrls) ? data.cateringMenuUrls : [],
        images: Array.isArray(data.images) ? data.images : [],
      };
      
      // ✅ IMPORTANTE: Log detalhado para debug
      console.log('🔍 Dados FINAIS antes de enviar para backend:', {
        equipment: preparedData.equipment,
        equipmentType: typeof preparedData.equipment,
        equipmentStringified: JSON.stringify(preparedData.equipment),
        isObject: typeof preparedData.equipment === 'object' && preparedData.equipment !== null,
        isString: typeof preparedData.equipment === 'string',
      });
      
      // ✅ CORREÇÃO: Usar a nova função toSnakeCaseForEventSpaces
      const backendData = toSnakeCaseForEventSpaces(preparedData);
      
      // ✅ Log do backendData após conversão
      console.log('🔍 backendData após toSnakeCaseForEventSpaces:', {
        equipment: backendData.equipment,
        equipmentType: typeof backendData.equipment,
      });
      
      const res = await apiService.post<any>('/api/events/spaces', backendData);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao criar espaço' };
      }
      
      // Extrair EventSpace da resposta
      const eventSpace = extractEventSpace(res.data);
      if (!eventSpace) {
        return { success: false, error: 'Dados do espaço não retornados corretamente' };
      }
      
      return { success: true, data: eventSpace, message: 'Espaço criado com sucesso' };
    } catch (err: any) {
      console.error('[createEventSpace]', err);
      
      // ✅ CORREÇÃO: Tratamento granular de erros (incluindo validação Zod do backend)
      let errorMessage = err.message || 'Falha ao criar espaço';
      let validationErrors = null;

      // Se o backend retornar Zod errors no formato { errors: [...] }
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

  async updateEventSpace(spaceId: string, data: UpdateEventSpaceRequest): Promise<ServiceResponse<EventSpace>> {
    try {
      // ✅ CORREÇÃO: Preparar dados com campos JSON corretos
      const preparedData: any = { ...data };
      
      // ✅ CORREÇÃO: Processar equipment se existir usando a função correta
      if (data.equipment !== undefined) {
        preparedData.equipment = processEquipmentField(data.equipment);
      }
      
      // Processar outros campos de array se existirem
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
      
      // ✅ IMPORTANTE: Log para debug
      if (data.equipment !== undefined) {
        console.log('🔍 Dados para atualizar espaço (antes da conversão):', {
          equipment: preparedData.equipment,
          equipmentType: typeof preparedData.equipment,
          equipmentStringified: JSON.stringify(preparedData.equipment),
          isObject: typeof preparedData.equipment === 'object' && preparedData.equipment !== null,
          isString: typeof preparedData.equipment === 'string',
        });
      }
      
      // Remover campos undefined (para evitar sobrescrever com undefined)
      const cleanData: any = {};
      Object.entries(preparedData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') { // Não enviar id no corpo
          cleanData[key] = value;
        }
      });
      
      // ✅ CORREÇÃO: Usar a nova função toSnakeCaseForEventSpaces
      const backendData = toSnakeCaseForEventSpaces(cleanData);
      
      // ✅ Log do backendData após conversão
      console.log('🔍 backendData após toSnakeCaseForEventSpaces:', {
        equipment: backendData.equipment,
        equipmentType: typeof backendData.equipment,
      });
      
      const res = await apiService.put<any>(`/api/events/spaces/${spaceId}`, backendData);
      
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao atualizar espaço' };
      }
      
      // Extrair EventSpace da resposta
      const eventSpace = extractEventSpace(res.data);
      if (!eventSpace) {
        return { success: false, error: 'Dados do espaço não retornados corretamente' };
      }
      
      return { success: true, data: eventSpace, message: 'Espaço atualizado com sucesso' };
    } catch (err: any) {
      console.error('[updateEventSpace]', err);
      
      // ✅ CORREÇÃO: Tratamento granular de erros (incluindo validação Zod do backend)
      let errorMessage = err.message || 'Falha ao atualizar espaço';
      let validationErrors = null;

      // Se o backend retornar Zod errors no formato { errors: [...] }
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

  async getEventSpaceById(spaceId: string): Promise<ServiceResponse<EventSpace>> {
    try {
      const res = await apiService.getEventSpaceDetails(spaceId);
      if (!res.success) {
        return { success: false, error: res.error || 'Espaço não encontrado' };
      }
      
      // ✅ CORREÇÃO: Extrair EventSpace corretamente
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

  async getEventSpacesByHotel(hotelId: string, includeInactive = false): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const res = await apiService.getEventSpacesByHotel(hotelId, includeInactive);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao listar espaços' };
      }
      
      // Garantir que seja array de EventSpace
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[getEventSpacesByHotel]', err);
      return { success: false, error: err.message || 'Falha ao buscar espaços do hotel' };
    }
  }

  async searchEventSpaces(filters: EventSpaceSearchParams): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const res = await apiService.searchEventSpaces(filters);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro na busca de espaços' };
      }
      
      // Garantir que seja array de EventSpace
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[searchEventSpaces]', err);
      return { success: false, error: err.message || 'Falha na busca de espaços' };
    }
  }

  async getFeaturedEventSpaces(limit = 10): Promise<ServiceResponse<EventSpace[]>> {
    try {
      const res = await apiService.getFeaturedEventSpaces(limit);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar espaços em destaque' };
      }
      
      // Garantir que seja array de EventSpace
      const eventSpaces = Array.isArray(res.data) 
        ? res.data.map(item => extractEventSpace(item) || item)
        : [];
        
      return { success: true, data: eventSpaces };
    } catch (err: any) {
      console.error('[getFeaturedEventSpaces]', err);
      return { success: false, error: err.message || 'Falha ao buscar destacados' };
    }
  }

  // ==================== DELETE ====================

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

  // ==================== BOOKINGS ====================

  async createBooking(bookingData: EventBookingRequest): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.createEventBooking(bookingData);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao criar reserva' };
      }
      
      return { 
        success: true, 
        data: res.data, 
        message: res.message || 'Reserva criada (aguardando aprovação)' 
      };
    } catch (err: any) {
      console.error('[createBooking]', err);
      return { success: false, error: err.message || 'Falha ao criar reserva' };
    }
  }

  async getBookingDetails(bookingId: string): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.getEventBookingDetails(bookingId);
      if (!res.success) {
        return { success: false, error: res.error || 'Reserva não encontrada' };
      }
      if (!res.data) {
        return { success: false, error: 'Dados da reserva não retornados' };
      }
      return { success: true, data: res.data };
    } catch (err: any) {
      console.error('[getBookingDetails]', err);
      return { success: false, error: err.message || 'Erro ao buscar detalhes da reserva' };
    }
  }

  async confirmBooking(bookingId: string): Promise<ServiceResponse<EventBooking>> {
    try {
      const res = await apiService.confirmEventBooking(bookingId);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao confirmar reserva' };
      }
      if (!res.data) {
        return { success: false, error: 'Dados da reserva não retornados após confirmação' };
      }
      return { success: true, data: res.data, message: 'Reserva confirmada com sucesso' };
    } catch (err: any) {
      console.error('[confirmBooking]', err);
      return { success: false, error: err.message || 'Falha ao confirmar reserva' };
    }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      const res = await apiService.cancelEventBooking(bookingId, reason);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao cancelar reserva' };
      }
      return { success: true, data: { message: res.message || 'Cancelada com sucesso' } };
    } catch (err: any) {
      console.error('[cancelBooking]', err);
      return { success: false, error: err.message || 'Falha ao cancelar reserva' };
    }
  }

  async getMyBookings(email?: string): Promise<ServiceResponse<EventBooking[]>> {
    try {
      const res = await apiService.getMyEventBookings(email);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao buscar minhas reservas' };
      }
      return { success: true, data: res.data || [] };
    } catch (err: any) {
      console.error('[getMyBookings]', err);
      return { success: false, error: err.message || 'Falha ao buscar reservas' };
    }
  }

  // ✅ NOVO: Método para buscar reservas de um espaço específico
  async getBookings(
    spaceId: string,
    params?: { status?: string; startDate?: string; endDate?: string; limit?: number }
  ): Promise<ServiceResponse<EventBooking[]>> {
    try {
      const res = await apiService.getEventSpaceBookings(spaceId, params);
      if (!res.success) {
        return { success: false, error: res.error || 'Erro ao listar reservas' };
      }
      return { success: true, data: res.data || [] };
    } catch (err: any) {
      console.error('[getBookings]', err);
      return { success: false, error: err.message || 'Falha ao buscar reservas do espaço' };
    }
  }

  // ==================== DISPONIBILIDADE & PREÇO ====================

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

  // ==================== DISPONIBILIDADE (CALENDÁRIO) ====================

  // ✅ NOVO: Wrapper para calendário de disponibilidade - CORRIGIDO: priceOverride sem null
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

  // ✅ NOVO: Wrapper para atualizar disponibilidade de um dia - CORRIGIDO: priceOverride sem null
  async updateDayAvailability(
    spaceId: string,
    data: { date: string; isAvailable?: boolean; stopSell?: boolean; priceOverride?: number }
  ): Promise<ServiceResponse<any>> {
    try {
      // Remover null do priceOverride se existir
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

  // ✅ NOVO: Wrapper para atualização em massa de disponibilidade - CORRIGIDO: priceOverride sem null
  async bulkUpdateAvailability(
    spaceId: string,
    updates: Array<{ date: string; isAvailable?: boolean; stopSell?: boolean; priceOverride?: number }>
  ): Promise<ServiceResponse<{ updated: number; message: string }>> {
    try {
      // Remover null de priceOverride em todos os updates
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
      // ✅ CORREÇÃO: Adicionar fallback para message
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

  // ==================== REVIEWS ====================

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

  // ==================== DASHBOARD ====================

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

  // ==================== PAGAMENTOS ====================

  async getBookingPayments(bookingId: string): Promise<ServiceResponse<any[]>> {
    try {
      const res = await apiService.get<any>(`/api/events/bookings/${bookingId}/payments`);
      return { success: true, data: res.data || [] };
    } catch (err: any) {
      console.error('[getBookingPayments]', err);
      return { success: false, error: err.message || 'Erro ao buscar pagamentos' };
    }
  }

  // ==================== GESTÃO DE RESERVAS (STATUS) ====================

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

  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled' | 'completed' | 'rejected',
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

  // ==================== PAGAMENTOS MANUAIS ====================

  async registerManualPayment(
    bookingId: string,
    payload: {
      amount: number;
      paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
      referenceNumber: string;
      notes?: string;
    }
  ): Promise<ServiceResponse<any>> {
    try {
      const res = await apiService.post<any>(`/api/events/bookings/${bookingId}/payments`, payload);
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

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed' | 'cancelled',
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

  // ==================== DETALHES COMPLETOS (BOOKING + PAGAMENTOS + LOGS) ====================

  async getFullBookingDetails(bookingId: string): Promise<ServiceResponse<any>> {
    try {
      const res = await apiService.get<any>(`/api/events/bookings/${bookingId}/full-details`);
      if (!res.success) {
        return { success: false, error: res.error || 'Reserva não encontrada' };
      }
      return { 
        success: true, 
        data: {
          booking: normalizeEventBooking(res.data.booking),
          payments: res.data.payments || [],
          logs: res.data.logs || [],
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao obter detalhes completos' };
    }
  }

  // ==================== RESUMO FINANCEIRO ====================

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