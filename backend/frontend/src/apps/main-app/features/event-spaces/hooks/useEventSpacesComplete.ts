/**
 * src/apps/main-app/features/event-spaces/hooks/useEventSpacesComplete.ts
 * Hook completo com bookings, pagamentos e gestão - VERSÃO CORRIGIDA
 * TOTALMENTE ALINHADO com eventSpaceService.ts atual e shared/types/event-spaces.ts
 * Usa o Service CORRETO e tipos reais da aplicação
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventSpaceService, type ServiceResponse } from '@/services/eventSpaceService';
import type {
  EventSpace,
  EventSpaceSearchParams,
  EventSpaceSearchResponse,
  EventSpaceDetailsResponse,  // ✅ CORREÇÃO: Usar o tipo correto
  EventSpaceData,              // ✅ ADICIONADO para extração de espaço
  EventBooking,
  EventBookingRequest,
  EventBookingResponse,
  EventAvailabilityResponse,
  EventDashboardSummary,
} from '@/shared/types/event-spaces';

// ==================== QUERY KEYS CORRIGIDAS ====================
const EVENT_SPACES_QUERY_KEYS = {
  all: ['events'] as const,
  spaces: () => [...EVENT_SPACES_QUERY_KEYS.all, 'spaces'] as const,
  spacesList: (filters?: EventSpaceSearchParams) => 
    [...EVENT_SPACES_QUERY_KEYS.spaces(), 'list', filters || {}] as const,
  spaceDetail: (id: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'detail', id] as const,
  spaceData: (id: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'data', id] as const, // ✅ NOVO: Para EventSpaceData
  featured: () => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'featured'] as const,
  byHotel: (hotelId: string) => [...EVENT_SPACES_QUERY_KEYS.spaces(), 'hotel', hotelId] as const,
  
  // Bookings
  bookings: () => [...EVENT_SPACES_QUERY_KEYS.all, 'bookings'] as const,
  bookingsList: (spaceId?: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'list', spaceId || 'all'] as const,
  bookingDetail: (bookingId: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'detail', bookingId] as const,
  bookingById: (bookingId: string) => 
    [...EVENT_SPACES_QUERY_KEYS.bookings(), 'by-id', bookingId] as const, // ✅ NOVO: Para getBookingById
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
  
  // Calendar
  calendar: (spaceId: string, startDate?: string, endDate?: string) =>
    [...EVENT_SPACES_QUERY_KEYS.spaces(), 'calendar', spaceId, startDate, endDate] as const,
};

// Interface para debug
interface DebugIntegrationResult {
  detailSuccess: boolean;
  detailHasData: boolean;
  detailStructure: string[];
  dataSuccess: boolean;
  dataHasData: boolean;
  dataHasAmenities: boolean;
  dataHasPrice: boolean;
  dataHasLocation: boolean;
  detailError?: string;
  dataError?: string;
  detailDataSample: {
    spaceId?: string;
    hotelId?: string;
    hasSpace: boolean;
    hasHotel: boolean;
  } | null;
  dataDataSample: {
    id?: string;
    name?: string;
    amenitiesCount: number;
    imagesCount: number;
  } | null;
}

// ==================== BUSCA DE ESPAÇOS (CORRIGIDO - usa eventSpaceService) ====================
export function useEventSpaces(filters?: EventSpaceSearchParams) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spacesList(filters),
    queryFn: async () => {
      const response = await eventSpaceService.searchEventSpaces(filters || {});
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar espaços');
      }
      return {
        data: response.data || [],
        count: response.data?.length || 0,
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
      const response = await eventSpaceService.getFeaturedEventSpaces(limit);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar espaços em destaque');
      }
      return {
        data: response.data || [],
        count: response.data?.length || 0,
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
      const response = await eventSpaceService.getEventSpacesByHotel(hotelId, includeInactive);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar espaços do hotel');
      }
      return {
        data: response.data || [],
        count: response.data?.length || 0,
        success: response.success,
      };
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== DETALHE DO ESPAÇO (CORRIGIDO - usa EventSpaceDetailsResponse) ====================
export function useEventSpaceDetail(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spaceDetail(spaceId),
    queryFn: async (): Promise<EventSpaceDetailsResponse> => {
      const response = await eventSpaceService.getEventSpaceDetails(spaceId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar detalhes do espaço');
      }
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== DADOS DO ESPAÇO (NOVO - extrai apenas o EventSpaceData) ====================
export function useEventSpaceData(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spaceData(spaceId),
    queryFn: async (): Promise<EventSpaceData> => {
      const response = await eventSpaceService.getEventSpaceData(spaceId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar dados do espaço');
      }
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== ESPAÇO POR ID (simples - EventSpace básico) ====================
export function useEventSpaceById(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.spaceDetail(spaceId),
    queryFn: async (): Promise<EventSpace> => {
      const response = await eventSpaceService.getEventSpaceById(spaceId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar espaço');
      }
      return response.data;
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000,
  });
}

// ==================== CRIAR BOOKING (CORRIGIDO - usa eventSpaceService) ====================
export function useCreateEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { spaceId: string; bookingData: any }) => {
      const response = await eventSpaceService.createEventBooking(data.spaceId, data.bookingData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao criar reserva');
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

// ==================== CRIAR RESERVA (método genérico) ====================
export function useCreateEventBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: EventBookingRequest) => {
      const response = await eventSpaceService.createBooking(bookingData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao criar reserva');
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
      const response = await eventSpaceService.getBookingDetails(bookingId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar detalhes da reserva');
      }
      return response.data;
    },
    enabled: !!bookingId,
  });
}

// ==================== BUSCAR BOOKING POR ID (NOVO - consistente) ====================
export function useEventSpaceBookingById(bookingId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(bookingId),
    queryFn: async () => {
      const response = await eventSpaceService.getBookingById(bookingId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar reserva');
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
      const response = await eventSpaceService.confirmBooking(bookingId);
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
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(booking.id) 
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

// ==================== CANCELAR BOOKING (CORRIGIDO) ====================
export function useCancelEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason?: string }) => {
      const response = await eventSpaceService.cancelBooking(data.bookingId, data.reason);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao cancelar reserva');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(variables.bookingId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(variables.bookingId) 
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
    queryFn: async (): Promise<EventAvailabilityResponse> => {
      const response = await eventSpaceService.checkAvailability(spaceId, startDate, endDate);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao verificar disponibilidade');
      }
      return response.data;
    },
    enabled: !!spaceId && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000,
  });
}

export function useCheckEventSpaceAvailability() {
  return useMutation({
    mutationFn: async (data: { spaceId: string; startDate: string; endDate: string }) => {
      const response = await eventSpaceService.checkAvailability(
        data.spaceId, 
        data.startDate, 
        data.endDate
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || response.data?.message || 'Erro ao verificar disponibilidade');
      }
      return response.data;
    },
  });
}

// ==================== CALCULAR PREÇO (CORRIGIDO) ====================
export function useCalculateEventPrice() {
  return useMutation({
    mutationFn: async (data: { 
      spaceId: string; 
      startDate: string; 
      endDate: string; 
      cateringRequired?: boolean;
    }) => {
      const response = await eventSpaceService.calculatePrice(
        data.spaceId,
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
      const response = await eventSpaceService.getMyBookings(email);
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

// ==================== RESERVAS POR ESPAÇO (NOVO) ====================
export function useEventSpaceBookings(
  spaceId: string,
  params?: { status?: string; startDate?: string; endDate?: string; limit?: number }
) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.bookingsList(spaceId), params || {}],
    queryFn: async () => {
      const response = await eventSpaceService.getBookings(spaceId, params);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar reservas do espaço');
      }
      return {
        data: response.data || [],
        success: response.success,
      };
    },
    enabled: !!spaceId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== CALENDÁRIO DO ESPAÇO (NOVO) ====================
export function useEventSpaceCalendar(
  spaceId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.calendar(spaceId, startDate, endDate),
    queryFn: async () => {
      const response = await eventSpaceService.getCalendar(spaceId, startDate, endDate);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao carregar calendário');
      }
      return {
        data: response.data || [],
        success: response.success,
      };
    },
    enabled: !!spaceId && !!startDate && !!endDate,
    staleTime: 1 * 60 * 1000,
  });
}

// ==================== REVIEWS DO ESPAÇO (SIMPLIFICADO) ====================
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
      const response = await eventSpaceService.getReviews(spaceId, limit, offset);
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

// ==================== DASHBOARD DE EVENTOS (CORRIGIDO) ====================
export function useEventSpacesDashboard(hotelId: string) {
  return useQuery({
    queryKey: EVENT_SPACES_QUERY_KEYS.dashboard(hotelId),
    queryFn: async (): Promise<EventDashboardSummary> => {
      const response = await eventSpaceService.getDashboardSummary(hotelId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar dashboard');
      }
      return response.data;
    },
    enabled: !!hotelId,
    staleTime: 2 * 60 * 1000,
  });
}

// ==================== ATUALIZAR DISPONIBILIDADE DO DIA (NOVO) ====================
export function useUpdateEventSpaceDayAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      spaceId: string; 
      date: string; 
      isAvailable?: boolean; 
      stopSell?: boolean; 
      priceOverride?: number 
    }) => {
      const response = await eventSpaceService.updateDayAvailability(
        data.spaceId,
        { date: data.date, isAvailable: data.isAvailable, stopSell: data.stopSell, priceOverride: data.priceOverride }
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar disponibilidade');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar calendário e disponibilidade
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.calendar(variables.spaceId),
      });
    },
  });
}

// ==================== ATUALIZAÇÃO EM MASSA DE DISPONIBILIDADE (NOVO) ====================
export function useBulkUpdateEventSpaceAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      spaceId: string; 
      updates: Array<{ 
        date: string; 
        isAvailable?: boolean; 
        stopSell?: boolean; 
        priceOverride?: number 
      }> 
    }) => {
      const response = await eventSpaceService.bulkUpdateAvailability(
        data.spaceId,
        data.updates
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro na atualização em massa');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.calendar(variables.spaceId),
      });
    },
  });
}

// ==================== PAGAMENTOS DA RESERVA (NOVO) ====================
export function useEventSpaceBookingPayments(bookingId: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.bookingDetail(bookingId), 'payments'],
    queryFn: async () => {
      const response = await eventSpaceService.getBookingPayments(bookingId);
      if (!response.success) {
        throw new Error(response.error || 'Erro ao buscar pagamentos');
      }
      return {
        data: response.data || [],
        success: response.success,
      };
    },
    enabled: !!bookingId,
  });
}

// ==================== DETALHES COMPLETOS DA RESERVA (NOVO) ====================
export function useFullEventSpaceBookingDetails(bookingId: string) {
  return useQuery({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.bookingDetail(bookingId), 'full'],
    queryFn: async () => {
      const response = await eventSpaceService.getFullBookingDetails(bookingId);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar detalhes completos');
      }
      return response.data;
    },
    enabled: !!bookingId,
  });
}

// ==================== REGISTRAR PAGAMENTO MANUAL (NOVO) ====================
export function useRegisterManualEventPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bookingId: string;
      amount: number;
      paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
      reference: string;
      notes?: string;
      paymentType?: string;
    }) => {
      const response = await eventSpaceService.registerManualPayment(
        data.bookingId,
        {
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          paymentType: data.paymentType,
        }
      );
      if (!response.success) {
        throw new Error(response.error || 'Erro ao registrar pagamento');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...EVENT_SPACES_QUERY_KEYS.bookingDetail(variables.bookingId), 'payments'],
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(variables.bookingId),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(variables.bookingId),
      });
    },
  });
}

// ==================== ATUALIZAR STATUS DO BOOKING (NOVO) ====================
export function useUpdateEventSpaceBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bookingId: string;
      status: 'pending_approval' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed' | 'rejected';
      notes?: string;
    }) => {
      const response = await eventSpaceService.updateBookingStatus(
        data.bookingId,
        data.status,
        data.notes
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao atualizar status');
      }
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(booking.id),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingsList(booking.eventSpaceId),
      });
    },
  });
}

// ==================== REJEITAR BOOKING (NOVO) ====================
export function useRejectEventSpaceBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bookingId: string; reason: string }) => {
      const response = await eventSpaceService.rejectBooking(data.bookingId, data.reason);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao rejeitar reserva');
      }
      return response.data;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingById(booking.id),
      });
      queryClient.invalidateQueries({
        queryKey: EVENT_SPACES_QUERY_KEYS.bookingsList(booking.eventSpaceId),
      });
    },
  });
}

// ==================== RESERVA UNIFICADA (mantido para compatibilidade) ====================
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'ride' | 'hotel' | 'event';
      bookingData: any;
    }) => {
      // Para eventos, usar o eventSpaceService
      if (data.type === 'event') {
        const response = await eventSpaceService.createBooking(data.bookingData);
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Erro ao criar reserva de evento');
        }
        return response.data;
      }
      // Para rides/hotels, usar o apiService (outro hook deve ser criado)
      throw new Error(`Tipo de booking não suportado: ${data.type}`);
    },
    onSuccess: (booking, variables) => {
      if (booking && variables.type === 'event') {
        queryClient.invalidateQueries({ 
          queryKey: EVENT_SPACES_QUERY_KEYS.bookingDetail(booking.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: EVENT_SPACES_QUERY_KEYS.myBookings() 
        });
      }
    },
  });
}

// ==================== DEBUG INTEGRATION (NOVO - para testar) ====================
export function useDebugEventSpaceIntegration(spaceId: string) {
  return useQuery<DebugIntegrationResult>({
    queryKey: [...EVENT_SPACES_QUERY_KEYS.spaceDetail(spaceId), 'debug'],
    queryFn: async (): Promise<DebugIntegrationResult> => {
      try {
        // Testar múltiplos endpoints
        const [detailResponse, dataResponse] = await Promise.all([
          eventSpaceService.getEventSpaceDetails(spaceId),
          eventSpaceService.getEventSpaceData(spaceId),
        ]);

        const detailData = detailResponse.data;
        const eventData = dataResponse.data;

        return {
          detailSuccess: detailResponse.success,
          detailHasData: !!detailData,
          detailStructure: detailData ? Object.keys(detailData) : [],
          dataSuccess: dataResponse.success,
          dataHasData: !!eventData,
          dataHasAmenities: (eventData?.amenities?.length || 0) > 0,
          dataHasPrice: !!eventData?.basePricePerDay,
          dataHasLocation: !!eventData?.location,
          detailError: detailResponse.error,
          dataError: dataResponse.error,
          detailDataSample: detailData ? {
            spaceId: detailData.space?.id,
            hotelId: detailData.hotel?.id,
            hasSpace: !!detailData.space,
            hasHotel: !!detailData.hotel
          } : null,
          dataDataSample: eventData ? {
            id: eventData.id,
            name: eventData.name,
            amenitiesCount: eventData.amenities?.length || 0,
            imagesCount: eventData.images?.length || 0
          } : null
        };
      } catch (error) {
        throw new Error(`Erro no debug: ${(error as Error).message}`);
      }
    },
    enabled: !!spaceId,
  });
}