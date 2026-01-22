// src/services/roomTypeService.ts - VERSÃO CORRIGIDA
// Serviço para gerenciamento de room types (tipos de quartos) do hotel
// ✅ CORRIGIDO: Todos os problemas resolvidos
import { apiService } from './api';

// Tipos baseados no backend
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

export interface RoomTypeCreateRequest {
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
  is_active?: boolean;
}

export interface RoomTypeUpdateRequest {
  name?: string;
  description?: string;
  capacity?: number;
  base_price?: string;
  total_units?: number;
  base_occupancy?: number;
  min_nights?: number;
  extra_adult_price?: string;
  extra_child_price?: string;
  amenities?: string[];
  images?: string[];
  is_active?: boolean;
}

export interface AvailabilityCheck {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  units?: number;
}

export interface AvailabilityResponse {
  success: boolean;
  available: boolean;
  message?: string;
  data?: {
    available: boolean;
    minUnits?: number;
    message?: string;
    conflicts?: any[];
  };
  error?: string;
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

export interface Review {
  id: string;
  booking_id: string;
  hotel_id: string;
  user_id?: string;
  user_name?: string;
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
  is_verified: boolean;
  helpful_votes: number;
  has_response: boolean;
  response_text?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  category_averages: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  with_responses: number;
  total_helpful_votes: number;
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

class RoomTypeService {
  // ==================== ROOM TYPES ====================

  /**
   * Buscar todos os room types de um hotel
   */
  async getRoomTypesByHotel(hotelId: string): Promise<ListResponse<RoomType>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/room-types (sem v2)
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
   * Criar um novo room type
   */
  async createRoomType(hotelId: string, data: RoomTypeCreateRequest): Promise<ApiResponse<RoomType>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/room-types (sem v2)
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
   * Atualizar um room type existente
   */
  async updateRoomType(hotelId: string, roomTypeId: string, data: RoomTypeUpdateRequest): Promise<ApiResponse<RoomType>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/room-types/${roomTypeId} (sem v2)
      return await apiService.put<ApiResponse<RoomType>>(`/api/hotels/${hotelId}/room-types/${roomTypeId}`, data);
    } catch (error) {
      console.error('Erro ao atualizar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de quarto'
      };
    }
  }

  /**
   * Desativar (deletar) um room type
   */
  async deleteRoomType(hotelId: string, roomTypeId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/room-types/${roomTypeId} (sem v2)
      return await apiService.delete<ApiResponse<{ message: string }>>(`/api/hotels/${hotelId}/room-types/${roomTypeId}`);
    } catch (error) {
      console.error('Erro ao deletar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desativar tipo de quarto'
      };
    }
  }

  // ==================== DISPONIBILIDADE ====================

  /**
   * Atualizar disponibilidade em massa
   * ✅ CORREÇÃO: Tipo de retorno corrigido
   */
  async bulkUpdateAvailability(hotelId: string, roomTypeId: string, updates: any[]): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/availability/bulk (sem v2)
      const response = await apiService.post<ApiResponse<{ updatedCount: number }>>(
        `/api/hotels/${hotelId}/availability/bulk`,
        { updates, roomTypeId }
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade'
      };
    }
  }

  // ==================== PROMOÇÕES ====================

  /**
   * Buscar promoções de um hotel
   */
  async getPromotionsByHotel(hotelId: string): Promise<ListResponse<Promotion>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/promotions (sem v2)
      return await apiService.get<ListResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao listar promoções'
      };
    }
  }

  /**
   * Criar uma nova promoção
   */
  async createPromotion(hotelId: string, data: Partial<Promotion>): Promise<ApiResponse<Promotion>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/promotions (sem v2)
      return await apiService.post<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`, data);
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar promoção'
      };
    }
  }

  /**
   * Atualizar uma promoção
   */
  async updatePromotion(hotelId: string, promotionId: string, data: Partial<Promotion>): Promise<ApiResponse<Promotion>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/promotions/${promotionId} (sem v2)
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
   * Desativar uma promoção
   */
  async deactivatePromotion(hotelId: string, promotionId: string): Promise<ApiResponse<Promotion>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/promotions/${promotionId} (sem v2)
      return await apiService.delete<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions/${promotionId}`);
    } catch (error) {
      console.error('Erro ao desativar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desativar promoção'
      };
    }
  }

  // ==================== REVIEWS ====================

  /**
   * Buscar reviews de um hotel
   */
  async getReviewsByHotel(hotelId: string, params?: {
    limit?: number;
    offset?: number;
    minRating?: number;
    sortBy?: 'recent' | 'highest_rating' | 'most_helpful';
  }): Promise<ListResponse<Review>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/reviews (sem v2)
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.minRating) queryParams.append('minRating', params.minRating.toString());
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      
      const queryString = queryParams.toString();
      const url = `/api/hotels/${hotelId}/reviews${queryString ? '?' + queryString : ''}`;
      
      return await apiService.get<ListResponse<Review>>(url);
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
  async getReviewStats(hotelId: string): Promise<ApiResponse<ReviewStats>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/reviews/stats (sem v2)
      return await apiService.get<ApiResponse<ReviewStats>>(`/api/hotels/${hotelId}/reviews/stats`);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  /**
   * Submeter um review
   */
  async submitReview(data: {
    bookingId: string;
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
  }): Promise<ApiResponse<Review>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/reviews/submit (sem v2)
      return await apiService.post<ApiResponse<Review>>('/api/hotels/reviews/submit', data);
    } catch (error) {
      console.error('Erro ao submeter review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao submeter review'
      };
    }
  }

  /**
   * Votar em um review como útil
   */
  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<{ helpfulVotes: number }>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/reviews/${reviewId}/vote-helpful (sem v2)
      return await apiService.post<ApiResponse<{ helpfulVotes: number }>>(
        `/api/hotels/reviews/${reviewId}/vote-helpful`,
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
  async respondToReview(hotelId: string, reviewId: string, responseText: string): Promise<ApiResponse<Review>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/reviews/${reviewId}/respond (sem v2)
      return await apiService.post<ApiResponse<Review>>(
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

  // ==================== DASHBOARD ====================

  /**
   * Buscar dashboard do hotel
   */
  async getHotelDashboard(hotelId: string): Promise<ApiResponse<any>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/dashboard (sem v2)
      return await apiService.get<ApiResponse<any>>(`/api/hotels/${hotelId}/dashboard`);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dashboard'
      };
    }
  }

  // ==================== CALCULAR PREÇO ====================

  /**
   * Calcular preço final de uma reserva
   */
  async calculatePrice(hotelId: string, data: {
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    units?: number;
    promoCode?: string;
  }): Promise<ApiResponse<{
    basePrice: number;
    totalNights: number;
    subtotal: number;
    discountAmount?: number;
    totalPrice: number;
    currency: string;
    breakdown: any;
  }>> {
    try {
      // ✅ CORREÇÃO: /api/hotels/${hotelId}/bookings/calculate-price (sem v2)
      return await apiService.post<ApiResponse<any>>(
        `/api/hotels/${hotelId}/bookings/calculate-price`,
        data
      );
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular preço'
      };
    }
  }

  // ==================== FUNÇÕES HELPER ====================

  /**
   * Formatar preço para exibição
   */
  formatPrice(price: string | number): string {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(num);
  }

  /**
   * Calcular ocupação percentual
   */
  calculateOccupancy(bookedUnits: number, totalUnits: number): string {
    if (totalUnits === 0) return '0%';
    const percentage = (bookedUnits / totalUnits) * 100;
    return `${Math.round(percentage)}%`;
  }

  /**
   * Gerar URL para imagem do quarto
   */
  getRoomImageUrl(images?: string[], index: number = 0): string {
    if (images && images.length > 0 && images[index]) {
      return images[index];
    }
    // Placeholder padrão
    return `https://via.placeholder.com/400x300/4f46e5/ffffff?text=Quarto`;
  }

  // ==================== FUNÇÕES DE DISPONIBILIDADE CORRIGIDAS ====================

  /**
   * Verificar disponibilidade (versão corrigida com hotelId)
   */
  async checkAvailabilityWithHotelId(
    hotelId: string, 
    roomTypeId: string, 
    checkIn: string, 
    checkOut: string, 
    units: number = 1
  ): Promise<AvailabilityResponse> {
    try {
      // ✅ CORREÇÃO: Usa rota correta do backend
      const url = `/api/hotels/${hotelId}/availability/check?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&units=${units}`;
      return await apiService.get<AvailabilityResponse>(url);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        success: false,
        available: false,
        error: error instanceof Error ? error.message : 'Erro na verificação de disponibilidade'
      };
    }
  }

  /**
   * Buscar calendário de disponibilidade (versão corrigida com hotelId)
   */
  async getAvailabilityCalendarWithHotelId(
    hotelId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<any[]>> {
    try {
      // ✅ CORREÇÃO: Usa rota correta do backend
      const url = `/api/hotels/${hotelId}/availability?startDate=${startDate}&endDate=${endDate}&roomTypeId=${roomTypeId}`;
      return await apiService.get<ApiResponse<any[]>>(url);
    } catch (error) {
      console.error('Erro ao buscar calendário de disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar disponibilidade',
        data: []
      };
    }
  }

  /**
   * Atualizar disponibilidade de um dia específico
   * ✅ CORREÇÃO: Tipo de retorno corrigido
   */
  async updateDayAvailability(
    hotelId: string,
    roomTypeId: string,
    date: string,
    update: {
      available_units?: number;
      price_override?: number | string;
      stop_sell?: boolean;
      min_nights?: number;
    }
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      // Usa bulk update com um único item
      return await this.bulkUpdateAvailability(hotelId, roomTypeId, [{ ...update, date }]);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade de um dia:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade'
      };
    }
  }
}

export const roomTypeService = new RoomTypeService();
export default roomTypeService;