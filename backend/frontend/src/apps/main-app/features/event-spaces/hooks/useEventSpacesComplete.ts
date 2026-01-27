/**
 * src/apps/main-app/features/event-spaces/hooks/useEventSpacesComplete.ts
 * Hook completo com bookings, pagamentos e gestão - VERSÃO CORRIGIDA 26/01/2026
 * TOTALMENTE ALINHADO com apiService.ts atual e shared/types/event-spaces.ts
 * Usa prefixo correto /api/events/... e tipos reais da aplicação
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type {
  EventSpace,
  EventSpaceSearchParams,
  EventSpaceSearchResponse,
  EventSpaceDetails,
  EventSpaceReview,
  EventSpaceReviewStats,
  EventDashboardSummary,
  EventBooking,
  EventBookingRequest,
  EventBookingResponse,
  EventAvailabilityResponse,
} from '@/shared/types/event-spaces';

// ==================== QUERY KEYS CORRIGIDAS ====================
const EVENT_SPACES_QUERY_KEYS = {
  all: ['events'] as const,
  spaces: () => [...EVENT_SPACES_QUERY_KEYS.all, 'spaces'] as const,
  spacesList: (filters?: EventSpaceSearchParams) => 
    [...EVENT_SPACES_QUERY_KEYS.spaces(), 'list', filters || {}] as const,
  spaceDetail: (id: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'detail', id] as const,
  featured: () => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'featured'] as const,
  byHotel: (hotelId: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'hotel', hotelId] as const,
  
  // Bookings
  bookings: () => [...EVENT_SPACES_QUERY_KEYS.all, 'bookings'] as const,
  bookingsList: (spaceId?: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'list', spaceId || 'all'] as const,
  bookingDetail: (bookingId: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'detail', bookingId] as const,
  myBookings: (email?: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'my', email || 'all'] as const,
  
  // Availability
  availability: (spaceId: string, startDate?: string, endDate?: string) => 
    [...EVENT_SPACES_QUERY_KEYS.spaces(), 'availability', spaceId, startDate, endDate] as const,
  
  // Reviews
  reviews: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'reviews', spaceId] as const,
  reviewStats: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.reviews(spaceId), 'stats'] as const,
  
  // Dashboard
  dashboard: (hotelId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'dashboard', hotelId] as const,
  
  // Price calculation
  price: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'price', spaceId] as const,
};

// ==================== BUSCA DE ESPAÇOS (CORRIGIDO) ====================
export function useEventSpaces(filters?: EventSpaceSearchParams) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spacesList(filters),
    queryFn: async () => {
      const response = await apiService.searchEventSpaces(filters || {});
      return {
        data: response.data || [],
        count: response.count || 0,
        success: response.success,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ==================== ESPAÇOS EM DESTAQUE (CORRIGIDO) ====================
export function useFeaturedEventSpaces(limit = 10) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.featured(),
    queryFn: async () => {
      const response = await apiService.getFeaturedEventSpaces(limit);
      return {
        data: response.data || [],
        count: response.count || 0,
        success: response.success,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== ESPAÇOS POR HOTEL (CORRIGIDO) ====================
export function useEventSpacesByHotel(hotelId: string, includeInactive = false) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.byHotel(hotelId),
    queryFn: async () => {
      const response = await apiService.getEventSpacesByHotel(hotelId, includeInactive);
      return {
        data: response.data || [],
        count: response.count || 0,
        success: response.success,
      };
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== DETALHE DO ESPAÇO (CORRIGIDO) ====================
export function useEventSpaceDetail(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spaceDetail(spaceId),
    queryFn: async () => {
      const response = await apiService.getEventSpaceDetails(spaceId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar detalhes do espaço');
      }
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== CRIAR BOOKING (CORRIGIDO) ====================
export function useCreateEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: EventBookingRequest) => {
      const response = await apiService.createEventBooking(bookingData);
      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || 'Erro ao criar reserva');
      }
      return response.data;
    },
    onSuccess: (booking) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingsList(booking.eventSpaceId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.myBookings() 
      });
    },
  });
}

// ==================== DETALHES DO BOOKING (CORRIGIDO) ====================
export function useEventSpaceBookingDetails(bookingId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(bookingId),
    queryFn: async () => {
      const response = await apiService.getEventBookingDetails(bookingId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar detalhes da reserva');
      }
      return response.data;
    },
    enabled: !!bookingId,
  });
}

// ==================== CONFIRMAR BOOKING (CORRIGIDO) ====================
export function useConfirmEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiService.confirmEventBooking(bookingId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao confirmar reserva');
      }
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingsList(booking.eventSpaceId) 
      });
    },
  });
}

// ==================== CANCELAR BOOKING (CORRIGIDO) ====================
export function useCancelEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason?: string }) => {
      const response = await apiService.cancelEventBooking(data.bookingId, data.reason);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao cancelar reserva');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Para invalidar, precisamos buscar o booking primeiro
      // ou invalidar todas as queries de bookings
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(variables.bookingId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingsList() 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.myBookings() 
      });
    },
  });
}

// ==================== VERIFICAR DISPONIBILIDADE (CORRIGIDO) ====================
export function useEventSpaceAvailability(
  spaceId: string, 
  startDate: string, 
  endDate: string
) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.availability(spaceId, startDate, endDate),
    queryFn: async () => {
      const response = await apiService.checkEventSpaceAvailability(spaceId, startDate, endDate);
      return {
        success: response.success,
        isAvailable: response.isAvailable,
        message: response.message,
      };
    },
    enabled: !!spaceId && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

export function useCheckEventSpaceAvailability() {
  return useMutation({
    mutationFn: async (data: { spaceId: string; startDate: string; endDate: string }) => {
      const response = await apiService.checkEventSpaceAvailability(
        data.spaceId, 
        data.startDate, 
        data.endDate
      );
      if (!response.success) {
        throw new Error(response.message || 'Erro ao verificar disponibilidade');
      }
      return response;
    },
  });
}

// ==================== CALCULAR PREÇO (NOVO) ====================
export function useCalculateEventPrice() {
  return useMutation({
    mutationFn: async (data: { 
      eventSpaceId: string; 
      startDate: string; 
      endDate: string; 
      cateringRequired?: boolean;
    }) => {
      const response = await apiService.calculateEventPrice(
        data.eventSpaceId,
        data.startDate,
        data.endDate,
        data.cateringRequired || false
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao calcular preço');
      }
      return response.data;
    },
  });
}

// ==================== MINHAS RESERVAS (CORRIGIDO) ====================
export function useMyEventSpaceBookings(email?: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.myBookings(email),
    queryFn: async () => {
      const response = await apiService.getMyEventBookings(email);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar minhas reservas');
      }
      return {
        data: response.data || [],
        success: response.success,
      };
    },
    enabled: !!email,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== REVIEWS DO ESPAÇO (CORRIGIDO) ====================
export function useEventSpaceReviews(
  spaceId: string, 
  limit = 10, 
  offset = 0,
  minRating = 0,
  sortBy: "recent" | "highest_rating" | "most_helpful" = "recent"
) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.reviews(spaceId), { limit, offset, minRating, sortBy }],
    queryFn: async () => {
      const response = await apiService.getEventSpaceReviews(
        spaceId, 
        limit, 
        offset, 
        minRating, 
        sortBy
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar reviews');
      }
      return {
        data: response.data || [],
        success: response.success,
      };
    },
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventSpaceReviewStats(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.reviewStats(spaceId),
    queryFn: async () => {
      // Nota: O endpoint de stats específico pode não existir no backend
      // Usamos a resposta normal e calculamos stats localmente se necessário
      const response = await apiService.getEventSpaceReviews(spaceId, 100, 0, 0, "recent");
      if (!response.success || !response.data) {
        throw new Error('Erro ao buscar estatísticas de reviews');
      }
      
      // Calcular estatísticas básicas localmente
      const reviews = response.data.reviews || response.data;
      const stats: EventSpaceReviewStats = {
        averageRating: response.data.averageRating || 0,
        totalReviews: reviews.length,
        ratingDistribution: {
          5: reviews.filter((r: any) => r.overallRating >= 4.5).length,
          4: reviews.filter((r: any) => r.overallRating >= 3.5 && r.overallRating < 4.5).length,
          3: reviews.filter((r: any) => r.overallRating >= 2.5 && r.overallRating < 3.5).length,
          2: reviews.filter((r: any) => r.overallRating >= 1.5 && r.overallRating < 2.5).length,
          1: reviews.filter((r: any) => r.overallRating < 1.5).length,
        },
      };
      
      return stats;
    },
    enabled: !!spaceId,
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== DASHBOARD DE EVENTOS (CORRIGIDO) ====================
export function useEventSpacesDashboard(hotelId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.dashboard(hotelId),
    queryFn: async () => {
      const response = await apiService.getEventDashboardSummary(hotelId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar dashboard');
      }
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== SUBMETER REVIEW (SIMPLIFICADO) ====================
export function useSubmitEventSpaceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      eventSpaceId: string;
      bookingId: string;
      userId: string;
      overallRating: number;
      venueRating?: number;
      facilitiesRating?: number;
      locationRating?: number;
      servicesRating?: number;
      staffRating?: number;
      valueRating?: number;
      title: string;
      comment: string;
      pros?: string;
      cons?: string;
    }) => {
      // Nota: O endpoint específico pode não existir ainda
      // Usamos o apiService.post genérico por enquanto
      const response = await apiService.post<any>('/api/events/reviews', data);
      if (!response.success) {
        throw new Error('Erro ao submeter review');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.reviews(variables.eventSpaceId),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.reviewStats(variables.eventSpaceId),
      });
    },
  });
}

// ==================== RESERVA UNIFICADA (ride/hotel/event) ====================
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'ride' | 'hotel' | 'event';
      bookingData: any;
    }) => {
      const response = await apiService.createBooking(data.type, data.bookingData);
      if (!response.success) {
        throw new Error(response.error || `Erro ao criar reserva de ${data.type}`);
      }
      return response.data?.booking;
    },
    onSuccess: (booking, variables) => {
      if (booking) {
        if (variables.type === 'event') {
          queryClient.invalidateQueries({ 
            queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id) 
          });
          queryClient.invalidateQueries({ 
            queryKey: EVENT_SPACES_QUERY_KEYS.myBookings() 
          });
        }
        // Adicionar invalidates para rides/hotels se necessário
      }
    },
  });
}