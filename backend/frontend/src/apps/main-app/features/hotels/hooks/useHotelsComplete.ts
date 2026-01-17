/**
 * src/apps/main-app/features/hotels/hooks/useHotelsComplete.ts
 * NOVO: Hook completo com bookings, pagamentos e gestão
 * Substituir o antigo useHotels.ts
 * Versão: 14/01/2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/shared/lib/api';
import type {
  Hotel,
  HotelSearchParams,
  RoomType,
  Promotion,
  PricingCalculation,
  HotelReview,
  ReviewStats,
  HotelDashboardStats,
  BookingReport,
} from '@/shared/types/hotels';
import type {
  HotelBooking,
  CreateHotelBookingRequest,
  HotelBookingDetails,
  HotelBookingFilters,
} from '@/shared/types/bookings';
import type {
  HotelPayment,
  HotelInvoice,
  RequiredDeposit,
  PaymentDetails,
  CreateHotelPaymentRequest,
} from '@/shared/types/payments';

const HOTELS_QUERY_KEYS = {
  all: ['hotels'] as const,
  lists: () => [...HOTELS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: HotelSearchParams) => [...HOTELS_QUERY_KEYS.lists(), filters] as const,
  detail: (id: string) => [...HOTELS_QUERY_KEYS.all, 'detail', id] as const,
  roomTypes: (hotelId: string) => [...HOTELS_QUERY_KEYS.all, 'roomTypes', hotelId] as const,
  bookings: (hotelId: string) => [...HOTELS_QUERY_KEYS.all, 'bookings', hotelId] as const,
  booking: (bookingId: string) => [...HOTELS_QUERY_KEYS.all, 'booking', bookingId] as const,
  payments: (bookingId: string) => [...HOTELS_QUERY_KEYS.all, 'payments', bookingId] as const,
  reviews: (hotelId: string) => [...HOTELS_QUERY_KEYS.all, 'reviews', hotelId] as const,
  dashboard: (hotelId: string) => [...HOTELS_QUERY_KEYS.all, 'dashboard', hotelId] as const,
};

// ==================== BUSCA DE HOTÉIS ====================
export function useHotels(filters?: HotelSearchParams) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.list(filters || {}),
    queryFn: async () => {
      const response = await apiService.get<Hotel[]>('/api/hotels', { params: filters });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// ==================== DETALHE DO HOTEL ====================
export function useHotelDetail(hotelId: string) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.detail(hotelId),
    queryFn: async () => {
      const response = await apiService.get<Hotel>(`/api/hotels/${hotelId}`);
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== TIPOS DE QUARTO ====================
export function useRoomTypes(hotelId: string) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.roomTypes(hotelId),
    queryFn: async () => {
      const response = await apiService.get<RoomType[]>(`/api/hotels/${hotelId}/room-types`);
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== BOOKING: CRIAR ====================
export function useCreateHotelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { hotelId: string; booking: CreateHotelBookingRequest }) => {
      const response = await apiService.post<HotelBooking>(
        `/api/hotels/${data.hotelId}/bookings`,
        data.booking
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.booking(booking.id) });
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.bookings(booking.hotelId) });
    },
  });
}

// ==================== BOOKING: DETALHES ====================
export function useHotelBookingDetails(hotelId: string, bookingId: string) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.booking(bookingId),
    queryFn: async () => {
      const response = await apiService.get<HotelBookingDetails>(
        `/api/hotels/${hotelId}/bookings/${bookingId}`
      );
      return response.data;
    },
    enabled: !!bookingId && !!hotelId,
  });
}

// ==================== BOOKING: CHECK-IN ====================
export function useCheckInBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiService.post<HotelBooking>(
        `/api/bookings/${bookingId}/check-in`,
        {}
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.booking(booking.id) });
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.bookings(booking.hotelId) });
    },
  });
}

// ==================== BOOKING: CHECK-OUT ====================
export function useCheckOutBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiService.post<HotelBooking>(
        `/api/bookings/${bookingId}/check-out`,
        {}
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.booking(booking.id) });
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.bookings(booking.hotelId) });
    },
  });
}

// ==================== BOOKING: CANCELAR ====================
export function useCancelHotelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason: string }) => {
      const response = await apiService.post<HotelBooking>(
        `/api/bookings/${data.bookingId}/cancel`,
        { reason: data.reason }
      );
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.booking(booking.id) });
    },
  });
}

// ==================== LISTAR BOOKINGS DO HOTEL ====================
export function useHotelBookings(hotelId: string, filters?: HotelBookingFilters) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.bookings(hotelId),
    queryFn: async () => {
      const response = await apiService.get<HotelBooking[]>(
        `/api/hotels/${hotelId}/bookings`,
        { params: filters }
      );
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== CALCULAR PREÇO ====================
export function useCalculateHotelPrice() {
  return useMutation({
    mutationFn: async (data: {
      hotelId: string;
      roomTypeId: string;
      checkIn: string;
      checkOut: string;
      units?: number;
      promoCode?: string;
    }) => {
      const response = await apiService.post<PricingCalculation>(
        `/api/hotels/${data.hotelId}/bookings/calculate-price`,
        {
          room_type_id: data.roomTypeId,
          check_in: data.checkIn,
          check_out: data.checkOut,
          units: data.units || 1,
          promo_code: data.promoCode,
        }
      );
      return response.data;
    },
  });
}

// ==================== PAGAMENTOS ====================
export function useHotelPaymentDetails(hotelId: string, bookingId: string) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.payments(bookingId),
    queryFn: async () => {
      const response = await apiService.get<PaymentDetails>(
        `/api/hotels/${hotelId}/bookings/${bookingId}/invoice`
      );
      return response.data;
    },
    enabled: !!bookingId && !!hotelId,
  });
}

// ==================== CALCULAR DEPÓSITO ====================
export function useCalculateRequiredDeposit() {
  return useMutation({
    mutationFn: async (data: { hotelId: string; bookingId: string }) => {
      const response = await apiService.get<RequiredDeposit>(
        `/api/hotels/${data.hotelId}/bookings/${data.bookingId}/deposit`
      );
      return response.data;
    },
  });
}

// ==================== REGISTRAR PAGAMENTO MANUAL ====================
export function useRegisterHotelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      hotelId: string;
      bookingId: string;
      payment: CreateHotelPaymentRequest;
    }) => {
      const response = await apiService.post<HotelPayment>(
        `/api/hotels/${data.hotelId}/bookings/${data.bookingId}/payments`,
        data.payment
      );
      return response.data;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: HOTELS_QUERY_KEYS.payments(payment.bookingId) });
    },
  });
}

// ==================== REVIEWS ====================
export function useHotelReviews(hotelId: string, limit = 10, offset = 0) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.reviews(hotelId),
    queryFn: async () => {
      const response = await apiService.get<HotelReview[]>(
        `/api/hotels/${hotelId}/reviews`,
        { params: { limit, offset } }
      );
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHotelReviewStats(hotelId: string) {
  return useQuery({
    queryKey: [...HOTELS_QUERY_KEYS.reviews(hotelId), 'stats'],
    queryFn: async () => {
      const response = await apiService.get<ReviewStats>(
        `/api/hotels/${hotelId}/reviews/stats`
      );
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== SUBMETER REVIEW ====================
export function useSubmitHotelReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiService.post<HotelReview>('/api/hotels/reviews/submit', data);
      return response.data;
    },
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: HOTELS_QUERY_KEYS.reviews(review.hotelId),
      });
    },
  });
}

// ==================== DASHBOARD HOTEL ====================
export function useHotelDashboard(hotelId: string) {
  return useQuery({
    queryKey: HOTELS_QUERY_KEYS.dashboard(hotelId),
    queryFn: async () => {
      const response = await apiService.get<HotelDashboardStats>(
        `/api/hotels/${hotelId}/dashboard`
      );
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== RELATÓRIO DE BOOKINGS ====================
export function useBookingReport() {
  return useMutation({
    mutationFn: async (data: {
      hotelId: string;
      startDate: string;
      endDate: string;
      format?: 'json' | 'csv';
    }) => {
      const response = await apiService.get<BookingReport | string>(
        `/api/hotels/${data.hotelId}/reports/bookings`,
        {
          params: {
            startDate: data.startDate,
            endDate: data.endDate,
            format: data.format || 'json',
          },
        }
      );
      return response.data;
    },
  });
}

// ==================== PRÓXIMOS CHECK-INS ====================
export function useUpcomingCheckIns(hotelId: string) {
  return useQuery({
    queryKey: [...HOTELS_QUERY_KEYS.bookings(hotelId), 'upcoming'],
    queryFn: async () => {
      const response = await apiService.get<HotelBooking[]>(
        `/api/hotels/${hotelId}/bookings`,
        { params: { status: 'confirmed' } }
      );
      return response.data.filter((b) => {
        const today = new Date().toISOString().split('T')[0];
        return b.checkIn >= today && b.status === 'confirmed';
      });
    },
    enabled: !!hotelId,
    staleTime: 1 * 60 * 1000,
  });
}
