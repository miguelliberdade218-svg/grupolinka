// src/services/eventSpaceService.ts
// Serviço para gerenciamento de espaços de eventos - CORRIGIDO para usar a estrutura real do backend (sem /v2)
import { apiService } from './api';

// ==================== TIPOS ====================
export interface EventSpace {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  base_price_hourly?: string;
  base_price_half_day?: string;
  base_price_full_day?: string;
  price_per_hour?: string;
  price_per_day?: string;
  price_per_event?: string;
  weekend_surcharge_percent?: number;
  area_sqm?: number;
  space_type?: string;
  ceiling_height?: string;
  natural_light: boolean;
  has_stage: boolean;
  stage_dimensions?: string;
  loading_access: boolean;
  dressing_rooms?: number;
  security_deposit?: string;
  insurance_required: boolean;
  max_duration_hours?: number;
  min_booking_hours?: number;
  noise_restriction?: string;
  alcohol_allowed: boolean;
  floor_plan_image?: string;
  virtual_tour_url?: string;
  approval_required: boolean;
  includes_catering: boolean;
  includes_furniture: boolean;
  includes_cleaning: boolean;
  includes_security: boolean;
  amenities?: string[];
  event_types?: string[];
  allowed_event_types?: string[];
  prohibited_event_types?: string[];
  equipment?: Record<string, any>;
  setup_options?: string[];
  images?: string[];
  is_active: boolean;
  is_featured: boolean;
  slug?: string;
  rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
}

export interface EventSpaceCreateRequest {
  hotel_id: string;
  name: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  base_price_hourly?: string;
  base_price_half_day?: string;
  base_price_full_day?: string;
  price_per_hour?: string;
  price_per_day?: string;
  price_per_event?: string;
  weekend_surcharge_percent?: number;
  area_sqm?: number;
  space_type?: string;
  ceiling_height?: string;
  natural_light?: boolean;
  has_stage?: boolean;
  stage_dimensions?: string;
  loading_access?: boolean;
  dressing_rooms?: number;
  security_deposit?: string;
  insurance_required?: boolean;
  max_duration_hours?: number;
  min_booking_hours?: number;
  noise_restriction?: string;
  alcohol_allowed?: boolean;
  floor_plan_image?: string;
  virtual_tour_url?: string;
  approval_required?: boolean;
  includes_catering?: boolean;
  includes_furniture?: boolean;
  includes_cleaning?: boolean;
  includes_security?: boolean;
  amenities?: string[];
  event_types?: string[];
  allowed_event_types?: string[];
  prohibited_event_types?: string[];
  equipment?: Record<string, any>;
  setup_options?: string[];
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface EventSpaceUpdateRequest {
  name?: string;
  description?: string | null;
  capacity_min?: number;
  capacity_max?: number;
  base_price_hourly?: string | null;
  base_price_half_day?: string | null;
  base_price_full_day?: string | null;
  price_per_hour?: string | null;
  price_per_day?: string | null;
  price_per_event?: string | null;
  weekend_surcharge_percent?: number;
  area_sqm?: number | null;
  space_type?: string | null;
  ceiling_height?: string | null;
  natural_light?: boolean;
  has_stage?: boolean;
  stage_dimensions?: string | null;
  loading_access?: boolean;
  dressing_rooms?: number | null;
  security_deposit?: string | null;
  insurance_required?: boolean;
  max_duration_hours?: number | null;
  min_booking_hours?: number | null;
  noise_restriction?: string | null;
  alcohol_allowed?: boolean;
  floor_plan_image?: string | null;
  virtual_tour_url?: string | null;
  approval_required?: boolean;
  includes_catering?: boolean;
  includes_furniture?: boolean;
  includes_cleaning?: boolean;
  includes_security?: boolean;
  amenities?: string[];
  event_types?: string[];
  allowed_event_types?: string[];
  prohibited_event_types?: string[];
  equipment?: Record<string, any>;
  setup_options?: string[];
  images?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface EventBooking {
  id: string;
  event_space_id: string;
  hotel_id: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string;
  event_title: string;
  event_description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  expected_attendees: number;
  special_requests?: string;
  additional_services?: Record<string, any>;
  base_price?: string;
  total_price?: string;
  security_deposit?: string;
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_reference?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface EventSpaceReview {
  id: string;
  booking_id: string;
  event_space_id: string;
  hotel_id: string;
  user_id?: string;
  ratings: {
    venue: number;
    facilities: number;
    location: number;
    services: number;
    staff: number;
    value: number;
  };
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

// ✅ CORREÇÃO: Expandir ListResponse para incluir propriedades de erro
export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  message?: string;
  error?: string; // ✅ ADICIONADO
  errors?: Array<{ path: string; message: string }>; // ✅ ADICIONADO
}

// ✅ CORREÇÃO: Criar uma interface para respostas de erro específicas
export interface ErrorResponse {
  success: false;
  error: string;
  data?: never;
  count?: number;
  message?: string;
}

// ✅ CORREÇÃO: Criar um tipo union para lidar com ambos os casos
export type ServiceResponse<T> = ListResponse<T> | ErrorResponse;

export interface EventSpaceWithHotel {
  space: EventSpace;
  hotel: any;
  base_price?: string;
  price_half_day?: string;
  price_full_day?: string;
  price_per_hour?: string;
}

export interface EventAvailability {
  date: string;
  is_available: boolean;
  stop_sell?: boolean;
  price_override?: string;
  min_booking_hours?: number;
  slots?: Array<{
    startTime: string;
    endTime: string;
    bookingId?: string;
    status?: string;
  }>;
}

export interface EventBookingDetails {
  booking: EventBooking;
  space: EventSpace;
  hotel: any;
}

export interface CreateEventBookingRequest {
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string;
  event_title: string;
  event_description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  expected_attendees: number;
  special_requests?: string;
  additional_services?: Record<string, any>;
  user_id?: string;
}

class EventSpaceService {
  // ==================== ESPAÇOS DE EVENTOS ====================

  /**
   * Buscar espaços de eventos com filtros
   */
  async searchEventSpaces(filters?: {
    query?: string;
    locality?: string;
    province?: string;
    eventDate?: string;
    capacity?: number;
    eventType?: string;
    maxPrice?: number;
    amenities?: string[];
    hotelId?: string;
  }): Promise<ServiceResponse<EventSpaceWithHotel>> {
    try {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.locality) params.append('locality', filters.locality);
      if (filters?.province) params.append('province', filters.province);
      if (filters?.eventDate) params.append('eventDate', filters.eventDate);
      if (filters?.capacity) params.append('capacity', filters.capacity.toString());
      if (filters?.eventType) params.append('eventType', filters.eventType);
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters?.amenities?.length) params.append('amenities', filters.amenities.join(','));
      if (filters?.hotelId) params.append('hotelId', filters.hotelId);

      const queryString = params.toString();
      const url = `/api/events/spaces${queryString ? '?' + queryString : ''}`;
      
      const response = await apiService.get<ListResponse<EventSpaceWithHotel>>(url);
      
      if (response.success && response.data) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse quando falha
      return {
        success: false,
        error: response.error || 'Erro ao buscar espaços'
      };
    } catch (error) {
      console.error('Erro ao buscar espaços de eventos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar espaços'
      };
    }
  }

  /**
   * Obter espaço de evento por ID
   */
  async getEventSpaceById(spaceId: string): Promise<ApiResponse<{
    space: EventSpace;
    hotel: any;
    pricing: Record<string, string | null>;
    available_for_immediate_booking: boolean;
    alcohol_allowed: boolean;
    max_capacity: number;
    includes_catering: boolean;
    includes_furniture: boolean;
  }>> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/api/events/spaces/${spaceId}`);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        message: response.message || 'Espaço não encontrado',
        error: response.error
      };
    } catch (error) {
      console.error('Erro ao buscar espaço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar espaço'
      };
    }
  }

  /**
   * Criar novo espaço de evento
   */
  async createEventSpace(data: EventSpaceCreateRequest): Promise<ApiResponse<EventSpace>> {
    try {
      if (!data.hotel_id) {
        return {
          success: false,
          error: 'hotel_id é obrigatório'
        };
      }

      const payload = {
        ...data,
        capacity_min: Number(data.capacity_min) || 10,
        capacity_max: Number(data.capacity_max) || 50,
        base_price_hourly: data.base_price_hourly || '100.00',
        price_per_hour: data.price_per_hour || '90.00',
        name: data.name || 'Espaço Sem Nome',
        description: data.description || null,
        natural_light: data.natural_light !== false,
        has_stage: data.has_stage === true,
        loading_access: data.loading_access === true,
        insurance_required: data.insurance_required === true,
        alcohol_allowed: data.alcohol_allowed === true,
        approval_required: data.approval_required === true,
        includes_catering: data.includes_catering === true,
        includes_furniture: data.includes_furniture !== false,
        includes_cleaning: data.includes_cleaning === true,
        includes_security: data.includes_security === true,
        is_active: data.is_active !== false,
        is_featured: data.is_featured === true,
        amenities: data.amenities || [],
        event_types: data.event_types || [],
        images: data.images || [],
        weekend_surcharge_percent: data.weekend_surcharge_percent || 0
      };

      const response = await apiService.post<ApiResponse<EventSpace>>('/api/events/spaces', payload);
      
      return response;
    } catch (error) {
      console.error('Erro ao criar espaço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar espaço'
      };
    }
  }

  /**
   * Atualizar espaço de evento
   */
  async updateEventSpace(spaceId: string, data: EventSpaceUpdateRequest): Promise<ApiResponse<EventSpace>> {
    try {
      const payload = { ...data };
      
      if (payload.capacity_min !== undefined) {
        payload.capacity_min = Number(payload.capacity_min);
      }
      if (payload.capacity_max !== undefined) {
        payload.capacity_max = Number(payload.capacity_max);
      }
      if (payload.weekend_surcharge_percent !== undefined) {
        payload.weekend_surcharge_percent = Number(payload.weekend_surcharge_percent);
      }
      if (payload.area_sqm !== undefined) {
        payload.area_sqm = payload.area_sqm ? Number(payload.area_sqm) : null;
      }
      if (payload.dressing_rooms !== undefined) {
        payload.dressing_rooms = payload.dressing_rooms ? Number(payload.dressing_rooms) : null;
      }
      if (payload.max_duration_hours !== undefined) {
        payload.max_duration_hours = payload.max_duration_hours ? Number(payload.max_duration_hours) : null;
      }
      if (payload.min_booking_hours !== undefined) {
        payload.min_booking_hours = payload.min_booking_hours ? Number(payload.min_booking_hours) : null;
      }

      const response = await apiService.put<ApiResponse<EventSpace>>(`/api/events/spaces/${spaceId}`, payload);
      
      return response;
    } catch (error) {
      console.error('Erro ao atualizar espaço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar espaço'
      };
    }
  }

  /**
   * Deletar espaço de evento
   */
  async deleteEventSpace(spaceId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<ApiResponse<void>>(`/api/events/spaces/${spaceId}`);
    } catch (error) {
      console.error('Erro ao deletar espaço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar espaço'
      };
    }
  }

  /**
   * Buscar espaços de eventos do hotel
   */
  async getEventSpacesByHotel(hotelId: string, includeInactive = false): Promise<ServiceResponse<EventSpace>> {
    try {
      const url = `/api/events/hotel/${hotelId}/spaces${includeInactive ? '?includeInactive=true' : ''}`;
      const response = await apiService.get<ListResponse<EventSpace>>(url);
      
      if (response.success && response.data) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar espaços do hotel'
      };
    } catch (error) {
      console.error('Erro ao buscar espaços do hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar espaços'
      };
    }
  }

  /**
   * Buscar espaços em destaque
   */
  async getFeaturedEventSpaces(limit = 10): Promise<ServiceResponse<EventSpaceWithHotel>> {
    try {
      const response = await apiService.get<ListResponse<EventSpaceWithHotel>>(
        `/api/events/spaces/featured?limit=${limit}`
      );
      
      if (response.success && response.data) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar espaços em destaque'
      };
    } catch (error) {
      console.error('Erro ao buscar espaços em destaque:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar espaços em destaque'
      };
    }
  }

  // ==================== RESERVAS DE EVENTOS ====================

  /**
   * Criar reserva de evento
   */
  async createEventBooking(spaceId: string, data: CreateEventBookingRequest): Promise<ApiResponse<EventBooking>> {
    try {
      if (!data.start_datetime || !data.end_datetime) {
        return {
          success: false,
          error: 'start_datetime e end_datetime são obrigatórios'
        };
      }

      const response = await apiService.post<ApiResponse<EventBooking>>(
        `/api/events/spaces/${spaceId}/bookings`, 
        data
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar reserva'
      };
    }
  }

  /**
   * Obter reserva de evento por ID com detalhes completos
   */
  async getEventBookingById(bookingId: string): Promise<ApiResponse<EventBookingDetails>> {
    try {
      const response = await apiService.get<ApiResponse<EventBookingDetails>>(`/api/events/bookings/${bookingId}`);
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reserva'
      };
    }
  }

  /**
   * Buscar reservas do espaço
   */
  async getEventBookingsBySpace(
    spaceId: string, 
    options?: {
      status?: string[];
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const params = new URLSearchParams();
      if (options?.status?.length) params.append('status', options.status.join(','));
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/api/events/spaces/${spaceId}/bookings${queryString ? '?' + queryString : ''}`;
      
      const response = await apiService.get<ListResponse<EventBooking>>(url);
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar reservas'
      };
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reservas'
      };
    }
  }

  /**
   * Buscar próximas reservas do espaço
   */
  async getUpcomingEventBookings(spaceId: string, limit = 10): Promise<ServiceResponse<EventBooking>> {
    try {
      const response = await apiService.get<ListResponse<EventBooking>>(
        `/api/events/spaces/${spaceId}/bookings/upcoming?limit=${limit}`
      );
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar próximas reservas'
      };
    } catch (error) {
      console.error('Erro ao buscar próximas reservas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar próximas reservas'
      };
    }
  }

  /**
   * Buscar minhas reservas (organizador)
   */
  async getMyEventBookings(email?: string): Promise<ServiceResponse<EventBooking>> {
    try {
      const url = email 
        ? `/api/events/my-bookings?email=${email}`
        : `/api/events/my-bookings`;
      
      const response = await apiService.get<ListResponse<EventBooking>>(url);
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar minhas reservas'
      };
    } catch (error) {
      console.error('Erro ao buscar minhas reservas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar minhas reservas'
      };
    }
  }

  /**
   * Buscar eventos do organizador
   */
  async getOrganizerEvents(email?: string): Promise<ServiceResponse<EventBooking>> {
    try {
      const url = email
        ? `/api/events/organizer/events?email=${email}`
        : `/api/events/organizer/events`;
      
      const response = await apiService.get<ListResponse<EventBooking>>(url);
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar eventos'
      };
    } catch (error) {
      console.error('Erro ao buscar eventos do organizador:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar eventos'
      };
    }
  }

  /**
   * Confirmar reserva de evento
   */
  async confirmEventBooking(bookingId: string, notes?: string): Promise<ApiResponse<EventBooking>> {
    try {
      return await apiService.post<ApiResponse<EventBooking>>(
        `/api/events/bookings/${bookingId}/confirm`, 
        { notes }
      );
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao confirmar reserva'
      };
    }
  }

  /**
   * Rejeitar reserva de evento
   */
  async rejectEventBooking(bookingId: string, reason: string): Promise<ApiResponse<EventBooking>> {
    try {
      return await apiService.post<ApiResponse<EventBooking>>(
        `/api/events/bookings/${bookingId}/reject`, 
        { reason }
      );
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao rejeitar reserva'
      };
    }
  }

  /**
   * Cancelar reserva de evento
   */
  async cancelEventBooking(bookingId: string, reason?: string): Promise<ApiResponse<EventBooking>> {
    try {
      return await apiService.post<ApiResponse<EventBooking>>(
        `/api/events/bookings/${bookingId}/cancel`, 
        { reason }
      );
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar reserva'
      };
    }
  }

  /**
   * Atualizar reserva de evento
   */
  async updateEventBooking(bookingId: string, data: Partial<EventBooking>): Promise<ApiResponse<EventBooking>> {
    try {
      return await apiService.put<ApiResponse<EventBooking>>(
        `/api/events/bookings/${bookingId}`,
        data
      );
    } catch (error) {
      console.error('Erro ao atualizar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar reserva'
      };
    }
  }

  // ==================== DISPONIBILIDADE ====================

  /**
   * Verificar disponibilidade de evento
   */
  async checkEventAvailability(spaceId: string, data: {
    date: string;
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{ available: boolean; message?: string }>> {
    try {
      return await apiService.post<ApiResponse<{ available: boolean; message?: string }>>(
        `/api/events/spaces/${spaceId}/availability/check`, 
        data
      );
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade'
      };
    }
  }

  /**
   * Obter calendário de disponibilidade
   */
  async getEventAvailability(
    spaceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<EventAvailability>> {
    try {
      const response = await apiService.get<ListResponse<EventAvailability>>(
        `/api/events/spaces/${spaceId}/availability?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar disponibilidade'
      };
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar disponibilidade'
      };
    }
  }

  /**
   * Atualizar disponibilidade em massa
   */
  async bulkUpdateAvailability(spaceId: string, updates: EventAvailability[]): Promise<ApiResponse<void>> {
    try {
      const formattedUpdates = updates.map(update => ({
        date: update.date,
        is_available: update.is_available,
        stop_sell: update.stop_sell,
        price_override: update.price_override,
        min_booking_hours: update.min_booking_hours,
        slots: update.slots
      }));

      return await apiService.post<ApiResponse<void>>(
        `/api/events/spaces/${spaceId}/availability/bulk`, 
        formattedUpdates
      );
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade'
      };
    }
  }

  /**
   * Buscar estatísticas de disponibilidade
   */
  async getAvailabilityStats(spaceId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(
        `/api/events/spaces/${spaceId}/availability/stats?startDate=${startDate}&endDate=${endDate}`
      );
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  /**
   * Verificar capacidade do espaço
   */
  async checkEventSpaceCapacity(spaceId: string, expectedAttendees: number): Promise<ApiResponse<{
    valid: boolean;
    message?: string;
  }>> {
    try {
      return await apiService.post<ApiResponse<{ valid: boolean; message?: string }>>(
        `/api/events/spaces/${spaceId}/capacity/check`,
        { expected_attendees: expectedAttendees }
      );
    } catch (error) {
      console.error('Erro ao verificar capacidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar capacidade'
      };
    }
  }

  // ==================== REVIEWS ====================

  /**
   * Buscar reviews do espaço
   */
  async getEventSpaceReviews(
    spaceId: string, 
    options?: {
      limit?: number;
      offset?: number;
      minRating?: number;
      sortBy?: 'recent' | 'highest_rating' | 'most_helpful';
    }
  ): Promise<ServiceResponse<EventSpaceReview>> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.minRating) params.append('minRating', options.minRating.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);

      const queryString = params.toString();
      const url = `/api/events/spaces/${spaceId}/reviews${queryString ? '?' + queryString : ''}`;
      
      const response = await apiService.get<ListResponse<EventSpaceReview>>(url);
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar reviews'
      };
    } catch (error) {
      console.error('Erro ao buscar reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reviews'
      };
    }
  }

  /**
   * Buscar estatísticas de reviews
   */
  async getEventSpaceReviewStats(spaceId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/events/spaces/${spaceId}/reviews/stats`);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  /**
   * Submeter review
   */
  async submitEventSpaceReview(data: {
    bookingId: string;
    ratings: {
      venue: number;
      facilities: number;
      location: number;
      services: number;
      staff: number;
      value: number;
    };
    title: string;
    comment: string;
    pros?: string;
    cons?: string;
  }): Promise<ApiResponse<EventSpaceReview>> {
    try {
      return await apiService.post<ApiResponse<EventSpaceReview>>(
        `/api/events/spaces/reviews/submit`, 
        data
      );
    } catch (error) {
      console.error('Erro ao submeter review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao submeter review'
      };
    }
  }

  /**
   * Votar em review como útil
   */
  async voteHelpfulReview(reviewId: string, isHelpful: boolean): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(
        `/api/events/spaces/reviews/${reviewId}/vote-helpful`,
        { isHelpful }
      );
    } catch (error) {
      console.error('Erro ao votar review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao votar review'
      };
    }
  }

  /**
   * Responder a um review
   */
  async respondToEventSpaceReview(
    spaceId: string, 
    reviewId: string, 
    responseText: string
  ): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(
        `/api/events/spaces/${spaceId}/reviews/${reviewId}/respond`,
        { responseText }
      );
    } catch (error) {
      console.error('Erro ao responder review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao responder review'
      };
    }
  }

  // ==================== PAGAMENTOS ====================

  /**
   * Registrar pagamento manual
   */
  async registerEventPayment(bookingId: string, data: {
    amount: number;
    payment_method: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
    reference: string;
    notes?: string;
    payment_type?: string;
  }): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(
        `/api/events/bookings/${bookingId}/payments`, 
        data
      );
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar pagamento'
      };
    }
  }

  /**
   * Obter detalhes de pagamento
   */
  async getEventPaymentDetails(bookingId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/events/bookings/${bookingId}/payment`);
    } catch (error) {
      console.error('Erro ao buscar detalhes de pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar pagamento'
      };
    }
  }

  /**
   * Calcular depósito necessário
   */
  async calculateEventDeposit(bookingId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/events/bookings/${bookingId}/deposit`);
    } catch (error) {
      console.error('Erro ao calcular depósito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular depósito'
      };
    }
  }

  /**
   * Obter recibo
   */
  async getEventReceipt(bookingId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/events/bookings/${bookingId}/receipt`);
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar recibo'
      };
    }
  }

  /**
   * Confirmar pagamento (apenas hotel owner/admin)
   */
  async confirmEventPayment(bookingId: string, paymentId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(
        `/api/events/bookings/${bookingId}/payments/confirm`,
        { paymentId }
      );
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao confirmar pagamento'
      };
    }
  }

  // ==================== DASHBOARD E RELATÓRIOS ====================

  /**
   * Obter dashboard do hotel (eventos)
   */
  async getEventDashboard(hotelId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/events/hotel/${hotelId}/dashboard`);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar dashboard'
      };
    }
  }

  /**
   * Obter resumo financeiro do hotel
   */
  async getEventFinancialSummary(
    hotelId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryString = params.toString();
      const url = `/api/events/hotel/${hotelId}/financial-summary${queryString ? '?' + queryString : ''}`;
      
      return await apiService.get<ApiResponse<any>>(url);
    } catch (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar resumo financeiro'
      };
    }
  }

  /**
   * Obter estatísticas dos espaços do hotel
   */
  async getHotelEventSpacesStats(hotelId: string): Promise<ServiceResponse<any>> {
    try {
      const response = await apiService.get<ListResponse<any>>(`/api/events/hotel/${hotelId}/spaces/stats`);
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar estatísticas'
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas dos espaços:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  /**
   * Obter reservas do hotel
   */
  async getHotelEventBookings(
    hotelId: string, 
    status?: string[]
  ): Promise<ServiceResponse<EventBooking>> {
    try {
      const statusQuery = status && status.length > 0 ? `?status=${status.join(',')}` : '';
      const response = await apiService.get<ListResponse<EventBooking>>(
        `/api/events/hotel/${hotelId}/bookings${statusQuery}`
      );
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao buscar reservas'
      };
    } catch (error) {
      console.error('Erro ao buscar reservas do hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reservas'
      };
    }
  }

  // ==================== GESTÃO AVANÇADA ====================

  /**
   * Atualizar status em massa de espaços
   */
  async bulkUpdateEventSpacesStatus(spaceIds: string[], isActive: boolean): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      return await apiService.post<ApiResponse<{ updated_count: number }>>(
        '/api/events/spaces/bulk/status',
        { spaceIds, is_active: isActive }
      );
    } catch (error) {
      console.error('Erro ao atualizar status em massa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Sincronizar disponibilidade com configuração do espaço
   */
  async syncEventSpaceAvailability(spaceId: string, startDate: string, endDate: string): Promise<ApiResponse<{ updated_days: number }>> {
    try {
      return await apiService.post<ApiResponse<{ updated_days: number }>>(
        `/api/events/spaces/${spaceId}/sync-availability`,
        { startDate, endDate }
      );
    } catch (error) {
      console.error('Erro ao sincronizar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao sincronizar disponibilidade'
      };
    }
  }

  /**
   * Exportar calendário de disponibilidade
   */
  async exportEventSpaceAvailability(
    spaceId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResponse<EventAvailability>> {
    try {
      const response = await apiService.get<ListResponse<EventAvailability>>(
        `/api/events/spaces/${spaceId}/export-availability?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.success) {
        return response;
      }
      
      // ✅ CORREÇÃO: Retornar ErrorResponse
      return {
        success: false,
        error: response.error || 'Erro ao exportar calendário'
      };
    } catch (error) {
      console.error('Erro ao exportar calendário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao exportar calendário'
      };
    }
  }

  /**
   * Verificar saúde do módulo
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>('/api/events/health');
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no health check'
      };
    }
  }

  // ==================== FUNÇÕES AUXILIARES ====================

  /**
   * Formatar preço para exibição
   */
  formatPrice(price?: string | number | null): string {
    if (!price) return 'A combinar';
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'A combinar';
    
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(numPrice);
  }

  /**
   * Calcular preço estimado
   */
  async calculateEstimatedPrice(spaceId: string, date: string, durationHours: number): Promise<ApiResponse<{ price: number }>> {
    try {
      return {
        success: false,
        error: 'Função não implementada - use createEventBooking para cálculo automático'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular preço'
      };
    }
  }

  /**
   * Verificar disponibilidade para múltiplas datas
   */
  async checkMultiDateAvailability(
    spaceId: string, 
    dates: string[]
  ): Promise<ApiResponse<Record<string, boolean>>> {
    try {
      const results: Record<string, boolean> = {};
      
      for (const date of dates) {
        const result = await this.checkEventAvailability(spaceId, { date });
        results[date] = result.success && result.data?.available === true;
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade para múltiplas datas'
      };
    }
  }
}

export const eventSpaceService = new EventSpaceService();