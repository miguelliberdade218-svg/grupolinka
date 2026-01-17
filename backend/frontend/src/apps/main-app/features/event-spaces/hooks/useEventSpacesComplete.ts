/**
 * src/apps/main-app/features/event-spaces/hooks/useEventSpacesComplete.ts
 * NOVO: Hook completo com bookings, pagamentos e gestão
 * Substituir o antigo useEventSpaces.ts
 * Versão: 14/01/2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/shared/lib/api';
import type {
  EventSpace,
  EventSpaceSearchParams,
  EventSpaceReview,
  EventSpaceReviewStats,
  EventDashboardStats,
} from '@/shared/types/event-spaces-v2';
import type {
  EventSpaceBooking,
  CreateEventSpaceBookingRequest,
  EventSpaceBookingDetails,
  EventSpaceBookingFilters,
} from '@/shared/types/bookings';
import type {
  EventSpacePayment,
  EventSpaceSecurityDeposit,
  CreateEventSpacePaymentRequest,
  FinancialSummary,
} from '@/shared/types/payments';

const EVENT_SPACES_QUERY_KEYS = {
  all: ['event-spaces'] as const,
  lists: () => [...EVENT_SPACES_QUERY_KEYS.all, 'list'] as const,
  list: (filters: EventSpaceSearchParams) => [...EVENT_SPACES_QUERY_KEYS.lists(), filters] as const,
  detail: (id: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'detail', id] as const,
  bookings: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'bookings', spaceId] as const,
  booking: (bookingId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'booking', bookingId] as const,
  payments: (bookingId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'payments', bookingId] as const,
  reviews: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'reviews', spaceId] as const,
  availability: (spaceId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'availability', spaceId] as const,
  dashboard: (hotelId: string) => [...EVENT_SPACES_QUERY_KEYS.all, 'dashboard', hotelId] as const,
};

// ==================== BUSCA DE ESPAÇOS ====================
export function useEventSpaces(filters?: EventSpaceSearchParams) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.list(filters || {}),
    queryFn: async () => {
      const response = await apiService.get<EventSpace[]>('/api/spaces', { params: filters });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ==================== ESPAÇOS EM DESTAQUE ====================
export function useFeaturedEventSpaces(limit = 10) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.lists(), 'featured'],
    queryFn: async () => {
      const response = await apiService.get<EventSpace[]>('/api/spaces/featured', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== DETALHE DO ESPAÇO ====================
export function useEventSpaceDetail(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.detail(spaceId),
    queryFn: async () => {
      const response = await apiService.get<EventSpace>(`/api/spaces/${spaceId}`);
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== BOOKING: CRIAR ====================
export function useCreateEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { spaceId: string; booking: CreateEventSpaceBookingRequest }) => {
      const response = await apiService.post<EventSpaceBooking>(
        `/api/spaces/${data.spaceId}/bookings`,
        data.booking
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: EVENT_SPACES_QUERY_KEYS.booking(booking.id) });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookings(booking.eventSpaceId),
      });
    },
  });
}

// ==================== BOOKING: DETALHES ====================
export function useEventSpaceBookingDetails(bookingId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.booking(bookingId),
    queryFn: async () => {
      const response = await apiService.get<EventSpaceBookingDetails>(
        `/api/bookings/${bookingId}`
      );
      return response.data;
    },
    enabled: !!bookingId,
  });
}

// ==================== BOOKING: CONFIRMAR ====================
export function useConfirmEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiService.post<EventSpaceBooking>(
        `/api/bookings/${bookingId}/confirm`,
        {}
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: EVENT_SPACES_QUERY_KEYS.booking(booking.id) });
    },
  });
}

// ==================== BOOKING: REJEITAR ====================
export function useRejectEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason: string }) => {
      const response = await apiService.post<EventSpaceBooking>(
        `/api/bookings/${data.bookingId}/reject`,
        { reason: data.reason }
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: EVENT_SPACES_QUERY_KEYS.booking(booking.id) });
    },
  });
}

// ==================== BOOKING: CANCELAR ====================
export function useCancelEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason?: string }) => {
      const response = await apiService.post<EventSpaceBooking>(
        `/api/bookings/${data.bookingId}/cancel`,
        { reason: data.reason }
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: EVENT_SPACES_QUERY_KEYS.booking(booking.id) });
    },
  });
}

// ==================== LISTAR BOOKINGS DO ESPAÇO ====================
export function useEventSpaceBookings(spaceId: string, filters?: EventSpaceBookingFilters) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.bookings(spaceId),
    queryFn: async () => {
      const response = await apiService.get<EventSpaceBooking[]>(
        `/api/spaces/${spaceId}/bookings`,
        { params: filters }
      );
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== PRÓXIMOS EVENTOS ====================
export function useUpcomingEventSpaceBookings(spaceId: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.bookings(spaceId), 'upcoming'],
    queryFn: async () => {
      const response = await apiService.get<EventSpaceBooking[]>(
        `/api/spaces/${spaceId}/bookings/upcoming`,
        { params: { limit: 10 } }
      );
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 1 * 60 * 1000,
  });
}

// ==================== DISPONIBILIDADE ====================
export function useEventSpaceAvailability(spaceId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.availability(spaceId), startDate, endDate],
    queryFn: async () => {
      const response = await apiService.get<any>(
        `/api/spaces/${spaceId}/availability`,
        { params: { startDate, endDate } }
      );
      return response.data;
    },
    enabled: !!spaceId && !!startDate && !!endDate,
  });
}

export function useCheckEventSpaceAvailability() {
  return useMutation({
    mutationFn: async (data: {
      spaceId: string;
      date: string;
      startTime?: string;
      endTime?: string;
    }) => {
      const response = await apiService.post<any>(
        `/api/spaces/${data.spaceId}/availability/check`,
        {
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
        }
      );
      return response.data;
    },
  });
}

// ==================== VERIFICAR CAPACIDADE ====================
export function useCheckEventSpaceCapacity() {
  return useMutation({
    mutationFn: async (data: { spaceId: string; expectedAttendees: number }) => {
      const response = await apiService.post<any>(
        `/api/spaces/${data.spaceId}/capacity/check`,
        { expected_attendees: data.expectedAttendees }
      );
      return response.data;
    },
  });
}

// ==================== PAGAMENTOS ====================
export function useEventSpacePaymentDetails(bookingId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.payments(bookingId),
    queryFn: async () => {
      const response = await apiService.get<any>(
        `/api/bookings/${bookingId}/payment`
      );
      return response.data;
    },
    enabled: !!bookingId,
  });
}

// ==================== SEGURO/DEPÓSITO ====================
export function useCalculateEventSecurityDeposit() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiService.get<EventSpaceSecurityDeposit>(
        `/api/bookings/${bookingId}/deposit`
      );
      return response.data;
    },
  });
}

// ==================== REGISTRAR PAGAMENTO MANUAL ====================
export function useRegisterEventSpacePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bookingId: string;
      payment: CreateEventSpacePaymentRequest;
    }) => {
      const response = await apiService.post<EventSpacePayment>(
        `/api/bookings/${data.bookingId}/payments`,
        data.payment
      );
      return response.data;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: EVENT_SPACES_QUERY_KEYS.payments(payment.bookingId) });
    },
  });
}

// ==================== REVIEWS ====================
export function useEventSpaceReviews(spaceId: string, limit = 10, offset = 0) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.reviews(spaceId),
    queryFn: async () => {
      const response = await apiService.get<EventSpaceReview[]>(
        `/api/spaces/${spaceId}/reviews`,
        { params: { limit, offset } }
      );
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEventSpaceReviewStats(spaceId: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.reviews(spaceId), 'stats'],
    queryFn: async () => {
      const response = await apiService.get<EventSpaceReviewStats>(
        `/api/spaces/${spaceId}/reviews/stats`
      );
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== SUBMETER REVIEW ====================
export function useSubmitEventSpaceReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiService.post<EventSpaceReview>(
        '/api/spaces/reviews/submit',
        data
      );
      return response.data;
    },
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.reviews(review.eventSpaceId),
      });
    },
  });
}

// ==================== DASHBOARD ====================
export function useEventSpacesDashboard(hotelId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.dashboard(hotelId),
    queryFn: async () => {
      const response = await apiService.get<EventDashboardStats>(
        `/api/hotel/${hotelId}/dashboard`
      );
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== RELATÓRIO FINANCEIRO ====================
export function useEventFinancialSummary() {
  return useMutation({
    mutationFn: async (data: {
      hotelId: string;
      startDate: string;
      endDate: string;
    }) => {
      const response = await apiService.get<FinancialSummary>(
        `/api/hotel/${data.hotelId}/financial-summary`,
        {
          params: {
            startDate: data.startDate,
            endDate: data.endDate,
          },
        }
      );
      return response.data;
    },
  });
}

// ==================== MINHAS RESERVAS (ORGANIZADOR) ====================
export function useMyEventSpaceBookings(email?: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.all, 'my-bookings', email],
    queryFn: async () => {
      const response = await apiService.get<EventSpaceBooking[]>('/api/my-bookings', {
        params: email ? { email } : {},
      });
      return response.data;
    },
    enabled: !!email,
    staleTime: 2 * 60 * 1000,
  });
}
