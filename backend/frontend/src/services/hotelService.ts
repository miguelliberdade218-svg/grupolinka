// src/services/hotelService.ts
// Serviço para gerenciamento de hotéis - Integração com API real
// VERSÃO ATUALIZADA COM getMyHotels() E getActiveHotel()
// ✅ CORRIGIDO: Todas as rotas ajustadas para backend existente (sem /api/v2 prefix)
import { apiService } from './api';

// ==================== TIPOS ====================
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country: string;
  lat?: string;
  lng?: string;
  contact_email: string;
  contact_phone?: string;
  host_id: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  rating?: number;
  total_reviews?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelCreateRequest {
  name: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country?: string;
  lat?: string;
  lng?: string;
  contact_email: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface HotelUpdateRequest {
  name?: string;
  description?: string;
  address?: string;
  locality?: string;
  province?: string;
  lat?: string;
  lng?: string;
  contact_email?: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  capacity: number;
  base_price: string;
  total_units: number;
  base_occupancy: number;
  min_nights?: number;
  extra_adult_price?: string;
  extra_child_price?: string;
  amenities?: string[];
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  units: number;
  nights?: number;
  total_price: string;
  base_price: string;
  taxes?: string;
  special_requests?: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'rejected' | 'pending';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  promo_code?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  hotel_id: string;
  promo_code: string;
  name: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelReview {
  id: string;
  booking_id: string;
  hotel_id: string;
  user_id?: string;
  ratings: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
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
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

export interface HotelDashboard {
  hotel: Hotel;
  total_bookings: number;
  upcoming_bookings: number;
  total_revenue: string;
  occupancy_rate: number;
  room_types: RoomType[];
  active_promotions: Promotion[];
  recent_reviews: HotelReview[];
  payment_options: any[];
}

export interface AvailabilityUpdate {
  date: string;
  available_units?: number;
  price_override?: number | string;
  stop_sell?: boolean;
  min_nights?: number;
}

class HotelService {
  // ==================== HOTÉIS ====================

  /**
   * Buscar hotéis com filtros
   */
  async searchHotels(filters?: {
    query?: string;
    locality?: string;
    province?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }): Promise<ListResponse<Hotel>> {
    try {
      const params = new URLSearchParams();
      if (filters?.query) params.append('query', filters.query);
      if (filters?.locality) params.append('locality', filters.locality);
      if (filters?.province) params.append('province', filters.province);
      if (filters?.checkIn) params.append('checkIn', filters.checkIn);
      if (filters?.checkOut) params.append('checkOut', filters.checkOut);
      if (filters?.guests) params.append('guests', filters.guests.toString());

      const queryString = params.toString();
      const url = `/api/hotels${queryString ? '?' + queryString : ''}`;
      
      return await apiService.get<ListResponse<Hotel>>(url);
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Obter hotel por ID
   */
  async getHotelById(hotelId: string): Promise<ApiResponse<Hotel>> {
    try {
      return await apiService.get<ApiResponse<Hotel>>(`/api/hotels/${hotelId}`);
    } catch (error) {
      console.error('Erro ao buscar hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotel'
      };
    }
  }

  /**
   * Criar novo hotel
   */
  async createHotel(data: HotelCreateRequest): Promise<ApiResponse<Hotel>> {
    try {
      return await apiService.post<ApiResponse<Hotel>>('/api/hotels', data);
    } catch (error) {
      console.error('Erro ao criar hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar hotel'
      };
    }
  }

  /**
   * Atualizar hotel
   */
  async updateHotel(hotelId: string, data: HotelUpdateRequest): Promise<ApiResponse<Hotel>> {
    try {
      return await apiService.put<ApiResponse<Hotel>>(`/api/hotels/${hotelId}`, data);
    } catch (error) {
      console.error('Erro ao atualizar hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar hotel'
      };
    }
  }

  /**
   * Buscar hotéis do proprietário
   */
  async getHotelsByHost(hostId: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/host/${hostId}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis do proprietário:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Obter dashboard do hotel
   */
  async getHotelDashboard(hotelId: string): Promise<ApiResponse<HotelDashboard>> {
    try {
      return await apiService.get<ApiResponse<HotelDashboard>>(`/api/hotels/${hotelId}/dashboard`);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar dashboard'
      };
    }
  }

  // ==================== ROOM TYPES ====================

  /**
   * Buscar tipos de quarto do hotel
   */
  async getRoomTypesByHotel(hotelId: string): Promise<ListResponse<RoomType>> {
    try {
      return await apiService.get<ListResponse<RoomType>>(`/api/hotels/${hotelId}/room-types`);
    } catch (error) {
      console.error('Erro ao buscar room types:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar tipos de quarto'
      };
    }
  }

  /**
   * Criar tipo de quarto
   */
  async createRoomType(hotelId: string, data: any): Promise<ApiResponse<RoomType>> {
    try {
      return await apiService.post<ApiResponse<RoomType>>(`/api/hotels/${hotelId}/room-types`, data);
    } catch (error) {
      console.error('Erro ao criar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar tipo de quarto'
      };
    }
  }

  /**
   * Atualizar tipo de quarto
   * ✅ CORRIGIDO: Ajustado para rota correta do backend
   */
  async updateRoomType(hotelId: string, roomTypeId: string, data: any): Promise<ApiResponse<RoomType>> {
    try {
      const response = await apiService.put<ApiResponse<RoomType>>(
        `/api/hotels/${hotelId}/room-types/${roomTypeId}`, 
        data
      );
      
      if (!response.success) {
        console.error('Erro ao atualizar room type:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao atualizar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de quarto'
      };
    }
  }

  /**
   * Deletar tipo de quarto
   */
  async deleteRoomType(hotelId: string, roomTypeId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<ApiResponse<void>>(`/api/hotels/${hotelId}/room-types/${roomTypeId}`);
    } catch (error) {
      console.error('Erro ao deletar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar tipo de quarto'
      };
    }
  }

  // ==================== PROMOÇÕES ====================

  /**
   * Buscar promoções do hotel
   */
  async getPromotionsByHotel(hotelId: string): Promise<ListResponse<Promotion>> {
    try {
      return await apiService.get<ListResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar promoções'
      };
    }
  }

  /**
   * Criar promoção
   * ✅ CORRIGIDO: Garante que promo_code está presente
   */
  async createPromotion(hotelId: string, data: any): Promise<ApiResponse<Promotion>> {
    try {
      // Garante que promo_code está presente
      if (!data.promo_code) {
        return {
          success: false,
          error: 'promo_code é obrigatório'
        };
      }

      const payload = {
        ...data,
        promo_code: data.promo_code,
        name: data.name || `Promoção ${data.promo_code}`,
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: data.is_active !== false
      };

      return await apiService.post<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`, payload);
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar promoção'
      };
    }
  }

  /**
   * Atualizar promoção
   */
  async updatePromotion(hotelId: string, promotionId: string, data: any): Promise<ApiResponse<Promotion>> {
    try {
      return await apiService.put<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions/${promotionId}`, data);
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar promoção'
      };
    }
  }

  /**
   * Deletar promoção
   */
  async deletePromotion(hotelId: string, promotionId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<ApiResponse<void>>(
        `/api/hotels/${hotelId}/promotions/${promotionId}`
      );
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ==================== DISPONIBILIDADE / CALENDÁRIO ====================

  /**
   * Obter calendário de disponibilidade
   * ✅ CORRIGIDO: Usa rota correta do backend (/api/hotels/...)
   */
  async getAvailabilityCalendar(hotelId: string, roomTypeId: string, start: string, end: string): Promise<ApiResponse<any[]>> {
    try {
      // ✅ CORREÇÃO: Usa a rota correta /api/hotels/:hotelId/availability (sem v2)
      const url = `/api/hotels/${hotelId}/availability?startDate=${start}&endDate=${end}&roomTypeId=${roomTypeId}`;
      
      console.log('📅 Buscando disponibilidade:', url);
      return await apiService.get<ApiResponse<any[]>>(url);
    } catch (error) {
      console.error('Erro ao carregar calendário de disponibilidade:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar calendário de disponibilidade',
        data: [] 
      };
    }
  }

  /**
   * Obter reservas por tipo de quarto
   * ✅ NOVA FUNÇÃO: Filtra reservas por roomTypeId de forma eficiente
   */
  async getBookingsByRoomType(hotelId: string, roomTypeId: string): Promise<ListResponse<Booking>> {
    try {
      // ✅ CORREÇÃO: Busca todas as reservas do hotel e filtra por roomTypeId
      const allBookings = await this.getBookingsByHotel(hotelId);
      
      if (!allBookings.success) {
        return allBookings;
      }
      
      // Filtra as reservas pelo roomTypeId
      const filteredBookings = allBookings.data.filter(booking => booking.room_type_id === roomTypeId);
      
      return {
        success: true,
        data: filteredBookings,
        count: filteredBookings.length
      };
    } catch (error) {
      console.error('Erro ao carregar reservas por tipo de quarto:', error);
      return { 
        success: false, 
        data: [], 
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao carregar reservas' 
      };
    }
  }

  /**
   * Atualização em massa de disponibilidade
   * ✅ CORRIGIDO: Usa rota correta do backend (/api/hotels/...)
   */
  async bulkUpdateAvailability(hotelId: string, roomTypeId: string, updates: AvailabilityUpdate[]): Promise<ApiResponse<void>> {
    try {
      // ✅ CORREÇÃO: Usa a rota correta /api/hotels/:hotelId/availability/bulk (sem v2)
      const payload = {
        roomTypeId,
        updates
      };
      
      console.log('📅 Atualizando disponibilidade em massa:', { hotelId, roomTypeId, updatesCount: updates.length });
      return await apiService.post<ApiResponse<void>>(
        `/api/hotels/${hotelId}/availability/bulk`,
        payload
      );
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade em massa:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade' 
      };
    }
  }

  /**
   * Atualizar disponibilidade de um dia específico
   * ✅ CORRIGIDO: Usa rota de bulk update com um único item
   */
  async updateDayAvailability(hotelId: string, roomTypeId: string, date: string, update: AvailabilityUpdate): Promise<ApiResponse<void>> {
    try {
      return await this.bulkUpdateAvailability(hotelId, roomTypeId, [{ ...update, date }]);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade de um dia:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade' 
      };
    }
  }

  // ==================== REVIEWS ====================

  /**
   * Buscar reviews do hotel
   */
  async getReviewsByHotel(hotelId: string, limit = 10, offset = 0): Promise<ListResponse<HotelReview>> {
    try {
      return await apiService.get<ListResponse<HotelReview>>(
        `/api/hotels/${hotelId}/reviews?limit=${limit}&offset=${offset}`
      );
    } catch (error) {
      console.error('Erro ao buscar reviews:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar reviews'
      };
    }
  }

  /**
   * Buscar estatísticas de reviews
   */
  async getReviewStats(hotelId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/hotels/${hotelId}/reviews/stats`);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  // ==================== RESERVAS ====================

  /**
   * Buscar reservas do hotel
   */
  async getBookingsByHotel(hotelId: string, status?: string[]): Promise<ListResponse<Booking>> {
    try {
      const statusQuery = status && status.length > 0 ? `?status=${status.join(',')}` : '';
      return await apiService.get<ListResponse<Booking>>(`/api/hotels/${hotelId}/bookings${statusQuery}`);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar reservas'
      };
    }
  }

  /**
   * Obter detalhes de uma reserva
   */
  async getBookingById(hotelId: string, bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.get<ApiResponse<Booking>>(`/api/hotels/${hotelId}/bookings/${bookingId}`);
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reserva'
      };
    }
  }

  /**
   * Criar reserva
   */
  async createBooking(hotelId: string, data: any): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/${hotelId}/bookings`, data);
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar reserva'
      };
    }
  }

  /**
   * Fazer check-in
   */
  async checkInBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/bookings/${bookingId}/check-in`, {});
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer check-in'
      };
    }
  }

  /**
   * Fazer check-out
   */
  async checkOutBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/bookings/${bookingId}/check-out`, {});
    } catch (error) {
      console.error('Erro ao fazer check-out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer check-out'
      };
    }
  }

  /**
   * Cancelar reserva
   */
  async cancelBooking(bookingId: string, reason: string): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/bookings/${bookingId}/cancel`, { reason });
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar reserva'
      };
    }
  }

  /**
   * Calcular preço da reserva
   */
  async calculateBookingPrice(hotelId: string, data: any): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(`/api/hotels/${hotelId}/bookings/calculate-price`, data);
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular preço'
      };
    }
  }

  // ==================== MÉTODOS PARA O DASHBOARD DO HOST ====================

  /**
   * Lista todos os hotéis do usuário autenticado atual (host logado)
   * Usa a rota /host/me que infere o host_id automaticamente do token
   */
  async getMyHotels(): Promise<ListResponse<Hotel>> {
    try {
      const response = await apiService.get<any>('/api/hotels/host/me');

      // Normaliza resposta (caso o backend retorne { success: true, data: [...] })
      const hotels = response.data?.data || response.data || [];

      return {
        success: true,
        data: hotels,
        count: hotels.length,
      };
    } catch (error) {
      console.error('Erro ao buscar meus hotéis:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Falha ao carregar hotéis do host',
      };
    }
  }

  /**
   * Pega o hotel atualmente ativo (salvo no localStorage ou fallback para o primeiro)
   */
  async getActiveHotel(): Promise<Hotel | null> {
    const savedId = localStorage.getItem('activeHotelId');
    
    // Tenta carregar o hotel salvo
    if (savedId) {
      try {
        const result = await this.getHotelById(savedId);
        if (result.success && result.data) {
          return result.data;
        }
      } catch (err) {
        console.warn('Hotel salvo não encontrado:', err);
        localStorage.removeItem('activeHotelId'); // limpa se inválido
      }
    }

    // Fallback: carrega todos e pega o primeiro
    const myHotels = await this.getMyHotels();
    if (myHotels.success && myHotels.data.length > 0) {
      const first = myHotels.data[0];
      localStorage.setItem('activeHotelId', first.id);
      return first;
    }

    return null;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar disponibilidade para datas específicas
   */
  async checkAvailability(hotelId: string, roomTypeId: string, checkIn: string, checkOut: string, units: number = 1): Promise<ApiResponse<any>> {
    try {
      const url = `/api/hotels/${hotelId}/availability/check?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&units=${units}`;
      return await apiService.get<ApiResponse<any>>(url);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade'
      };
    }
  }

  // ==================== NOVAS ROTAS ADICIONAIS (para completude) ====================

  /**
   * Obter hotel por slug
   */
  async getHotelBySlug(slug: string): Promise<ApiResponse<Hotel>> {
    try {
      return await apiService.get<ApiResponse<Hotel>>(`/api/hotels/slug/${slug}`);
    } catch (error) {
      console.error('Erro ao buscar hotel por slug:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotel'
      };
    }
  }

  /**
   * Buscar hotéis por província
   */
  async getHotelsByProvince(province: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/province/${province}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis por província:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Buscar hotéis por localidade
   */
  async getHotelsByLocality(locality: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/locality/${locality}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis por localidade:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Buscar hotéis próximos (por localização)
   */
  async getNearbyHotels(lat: number, lng: number, radius: number = 60): Promise<ListResponse<Hotel>> {
    try {
      const url = `/api/hotels/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      return await apiService.get<ListResponse<Hotel>>(url);
    } catch (error) {
      console.error('Erro ao buscar hotéis próximos:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Rejeitar reserva
   */
  async rejectBooking(bookingId: string, reason: string): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/bookings/${bookingId}/reject`, { reason });
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao rejeitar reserva'
      };
    }
  }

  /**
   * Submeter review de hotel
   */
  async submitReview(data: any): Promise<ApiResponse<HotelReview>> {
    try {
      return await apiService.post<ApiResponse<HotelReview>>('/api/hotels/reviews/submit', data);
    } catch (error) {
      console.error('Erro ao submeter review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao submeter review'
      };
    }
  }

  /**
   * Votar review como útil/não útil
   */
  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<void>> {
    try {
      return await apiService.post<ApiResponse<void>>(`/api/hotels/reviews/${reviewId}/vote-helpful`, { isHelpful });
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
  async respondToReview(hotelId: string, reviewId: string, responseText: string): Promise<ApiResponse<HotelReview>> {
    try {
      return await apiService.post<ApiResponse<HotelReview>>(
        `/api/hotels/${hotelId}/reviews/${reviewId}/respond`, 
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

  /**
   * Gerar relatório de reservas (CSV/JSON)
   */
  async generateBookingsReport(hotelId: string, startDate: string, endDate: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    try {
      const url = `/api/hotels/${hotelId}/reports/bookings?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      
      if (format === 'csv') {
        return await apiService.getRaw(url, { responseType: 'blob' });
      } else {
        return await apiService.get<ApiResponse<any>>(url);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório'
      };
    }
  }

  /**
   * Gerar relatório de pagamentos (CSV/JSON)
   */
  async generatePaymentsReport(hotelId: string, startDate: string, endDate: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    try {
      const url = `/api/hotels/${hotelId}/reports/payments?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      
      if (format === 'csv') {
        return await apiService.getRaw(url, { responseType: 'blob' });
      } else {
        return await apiService.get<ApiResponse<any>>(url);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de pagamentos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório de pagamentos'
      };
    }
  }

  /**
   * Processar reserva com pagamento
   */
  async processBookingWithPayment(hotelId: string, bookingId: string, paymentOptionId: string, selectedPromotionId?: string): Promise<ApiResponse<any>> {
    try {
      const payload: any = { paymentOptionId };
      if (selectedPromotionId) {
        payload.selectedPromotionId = selectedPromotionId;
      }
      
      return await apiService.post<ApiResponse<any>>(
        `/api/hotels/${hotelId}/bookings/${bookingId}/process-payment`,
        payload
      );
    } catch (error) {
      console.error('Erro ao processar reserva com pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar reserva'
      };
    }
  }
}

export const hotelService = new HotelService();