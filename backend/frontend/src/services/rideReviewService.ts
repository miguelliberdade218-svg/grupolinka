// src/services/rideReviewService.ts
// Serviço para gerenciamento de reviews de rides
// ✅ NOVO: Integração completa com backend de reviews
// ✅ Reviews passageiro → motorista (6 dimensões)
// ✅ Reviews motorista → passageiro (5 dimensões)
// ✅ Auto-suspensão de motoristas com rating < 3.5

import { apiService } from './api';

// ==================== TIPOS ====================

export interface PassengerReviewData {
  ride_id: string;
  booking_id?: string;
  from_user_id: string;
  to_user_id: string; // Driver ID
  driver_rating: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  vehicle_condition_rating?: number;
  route_quality_rating?: number;
  safety_rating?: number;
  title?: string;
  comment: string;
  pros?: string;
  cons?: string;
}

export interface DriverReviewData {
  ride_id: string;
  from_driver_id: string;
  to_passenger_id: string;
  passenger_behavior_rating: number;
  cleanliness_rating?: number;
  communication_rating?: number;
  payment_behavior_rating?: number;
  punctuality_rating?: number;
  title?: string;
  comment: string;
}

export interface RideReviewResponse {
  id: string;
  ride_id: string;
  from_user_id: string;
  to_user_id: string;
  overall_rating: number;
  title?: string;
  comment: string;
  created_at: string;
  is_verified: boolean;
  is_published: boolean;
  helpful_votes: number;
}

export interface DriverStatsResponse {
  totalReviews: number;
  averageRating: number;
  byRating: {
    [key: number]: number; // 5★: 12, 4★: 8, etc
  };
}

// ==================== SERVICE ====================

export const rideReviewService = {
  /**
   * Criar review do passageiro para motorista
   */
  async createPassengerReview(data: PassengerReviewData) {
    try {
      const response = await apiService.post<any>(
        `/api/ride-reviews/${data.ride_id}/passenger-review`,
        {
          from_user_id: data.from_user_id,
          to_user_id: data.to_user_id,
          driver_rating: data.driver_rating,
          cleanliness_rating: data.cleanliness_rating,
          communication_rating: data.communication_rating,
          vehicle_condition_rating: data.vehicle_condition_rating,
          route_quality_rating: data.route_quality_rating,
          safety_rating: data.safety_rating,
          title: data.title,
          comment: data.comment,
          pros: data.pros,
          cons: data.cons,
          booking_id: data.booking_id,
        }
      );

      console.log('✅ Passenger review criado:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar passenger review:', error);
      throw error;
    }
  },

  /**
   * Criar review do motorista para passageiro
   */
  async createDriverReview(data: DriverReviewData) {
    try {
      const response = await apiService.post<any>(
        `/api/ride-reviews/${data.ride_id}/driver-review`,
        {
          from_driver_id: data.from_driver_id,
          to_passenger_id: data.to_passenger_id,
          passenger_behavior_rating: data.passenger_behavior_rating,
          cleanliness_rating: data.cleanliness_rating,
          communication_rating: data.communication_rating,
          payment_behavior_rating: data.payment_behavior_rating,
          punctuality_rating: data.punctuality_rating,
          title: data.title,
          comment: data.comment,
        }
      );

      console.log('✅ Driver review criado:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar driver review:', error);
      throw error;
    }
  },

  /**
   * Obter reviews recebidos pelo motorista
   */
  async getDriverReviews(driverId: string, limit = 10): Promise<RideReviewResponse[]> {
    try {
      const response = await apiService.get<RideReviewResponse[]>(
        `/api/ride-reviews/drivers/${driverId}/reviews?limit=${limit}`
      );

      console.log('✅ Reviews do motorista carregados:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Erro ao obter reviews do motorista:', error);
      return [];
    }
  },

  /**
   * Obter estatísticas de rating do motorista
   */
  async getDriverStats(driverId: string): Promise<DriverStatsResponse> {
    try {
      const response = await apiService.get<DriverStatsResponse>(
        `/api/ride-reviews/drivers/${driverId}/stats`
      );

      console.log('✅ Stats do motorista carregadas:', response);
      return (response as DriverStatsResponse) || { totalReviews: 0, averageRating: 0, byRating: {} };
    } catch (error) {
      console.error('❌ Erro ao obter stats do motorista:', error);
      return { totalReviews: 0, averageRating: 0, byRating: {} };
    }
  },

  /**
   * Obter reviews de uma ride específica
   */
  async getRideReviews(rideId: string): Promise<RideReviewResponse[]> {
    try {
      const response = await apiService.get<RideReviewResponse[]>(
        `/api/ride-reviews/rides/${rideId}/reviews`
      );

      console.log('✅ Reviews da ride carregados:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Erro ao obter reviews da ride:', error);
      return [];
    }
  },

  /**
   * Obter reviews recebidas pelo passageiro
   */
  async getPassengerReviews(passengerId: string, limit = 10): Promise<RideReviewResponse[]> {
    try {
      const response = await apiService.get<RideReviewResponse[]>(
        `/api/ride-reviews/passengers/${passengerId}/reviews?limit=${limit}`
      );

      console.log('✅ Reviews do passageiro carregados:', response);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('❌ Erro ao obter reviews do passageiro:', error);
      return [];
    }
  },

  /**
   * Verificar reputação do motorista (manual trigger)
   */
  async checkDriverReputation(driverId: string): Promise<any> {
    try {
      const response = await apiService.post<any>(
        `/api/ride-reviews/drivers/${driverId}/check-reputation`,
        {}
      );

      console.log('✅ Reputação do motorista verificada:', response);
      return response || {};
    } catch (error) {
      console.error('❌ Erro ao verificar reputação:', error);
      return {};
    }
  },

  /**
   * Calcular rating geral baseado em array de reviews
   */
  calculateAverageRating(reviews: RideReviewResponse[]): number {
    if (!reviews || reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, review) => {
      return acc + parseFloat(review.overall_rating?.toString() || '0');
    }, 0);

    return Math.round((sum / reviews.length) * 2) / 2; // Round to nearest 0.5
  },

  /**
   * Formatar rating como estrelas
   */
  formatStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '½';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return `${stars} (${rating})`;
  },
};

export default rideReviewService;
