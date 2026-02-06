// src/apps/hotels-app/pages/bookings/hooks/useHotelBookings.ts
import { useState, useCallback, useEffect } from 'react';
import { HotelBooking, HotelBookingFilters, ApiResponse, ListResponse } from '@/shared/types/bookings';
import { hotelService } from '@/services/hotelService'; // ✅ Usa o hotelService atualizado
import { useToast } from '@/shared/hooks/use-toast';

export interface UseHotelBookingsOptions {
  hotelId?: string;
  initialFilters?: HotelBookingFilters;
  autoLoad?: boolean;
}

// ✅ Função para converter Booking do serviço para HotelBooking
// Remove propriedades que não existem em HotelBooking (como 'taxes')
function convertServiceBookingToHotelBooking(serviceBooking: any): HotelBooking {
  // Extrai apenas as propriedades que existem no tipo HotelBooking
  const hotelBooking: HotelBooking = {
    id: serviceBooking.id,
    hotel_id: serviceBooking.hotel_id,
    room_type_id: serviceBooking.room_type_id,
    guest_name: serviceBooking.guest_name,
    guest_email: serviceBooking.guest_email,
    guest_phone: serviceBooking.guest_phone || undefined,
    check_in: serviceBooking.check_in,
    check_out: serviceBooking.check_out,
    adults: serviceBooking.adults,
    children: serviceBooking.children || 0,
    units: serviceBooking.units,
    nights: serviceBooking.nights || 0,
    total_price: serviceBooking.total_price,
    base_price: serviceBooking.base_price,
    // ❌ 'taxes' não existe em HotelBooking, então não incluímos
    special_requests: serviceBooking.special_requests || undefined,
    status: serviceBooking.status,
    // ✅ Converte 'refunded' para 'paid' pois HotelBooking não suporta 'refunded'
    payment_status: serviceBooking.payment_status === 'refunded' ? 'paid' : serviceBooking.payment_status,
    promo_code: serviceBooking.promo_code || undefined,
    user_id: serviceBooking.user_id || undefined,
    created_at: serviceBooking.created_at,
    updated_at: serviceBooking.updated_at,
  };

  return hotelBooking;
}

export const useHotelBookings = (options: UseHotelBookingsOptions = {}) => {
  const { hotelId, initialFilters = {}, autoLoad = true } = options;
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HotelBookingFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  
  const { toast } = useToast();

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!hotelId) {
      setError('Hotel ID é obrigatório');
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      // ✅ Chama o método correto do hotelService
      const response = await hotelService.getHotelBookings(hotelId, filters);
      
      if (response.success && response.data) {
        // ✅ Converte os bookings do serviço para o tipo HotelBooking
        const convertedBookings = response.data.map(convertServiceBookingToHotelBooking);
        
        setBookings(convertedBookings);
        setPagination(prev => ({
          ...prev,
          total: response.count || response.data.length,
          hasMore: false, // O backend não tem paginação, então assume sem mais páginas
        }));
      } else {
        setError(response.error || 'Erro ao carregar reservas');
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao carregar reservas',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro de conexão';
      setError(errorMsg);
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelId, filters, toast]);

  const updateFilters = useCallback((newFilters: Partial<HotelBookingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const loadMore = useCallback(() => {
    if (!pagination.hasMore || loading) return;
    
    setPagination(prev => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, [pagination.hasMore, loading]);

  const refresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  const performAction = useCallback(async (
    bookingId: string,
    action: 'checkIn' | 'checkOut' | 'cancel' | 'reject',
    data?: any
  ) => {
    try {
      let response: ApiResponse<any>;
      
      switch (action) {
        case 'checkIn':
          // ✅ Chama o método correto
          response = await hotelService.checkInBooking(bookingId);
          break;
        case 'checkOut':
          // ✅ Chama o método correto
          response = await hotelService.checkOutBooking(bookingId);
          break;
        case 'cancel':
          // ✅ Chama o método correto
          response = await hotelService.cancelBooking(bookingId, data?.reason);
          break;
        case 'reject':
          // ✅ Chama o método correto
          response = await hotelService.rejectBooking(bookingId, data?.reason);
          break;
        default:
          throw new Error('Ação não suportada');
      }

      if (response.success && response.data) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Ação realizada com sucesso',
        });
        
        // ✅ Atualiza a lista com conversão
        const updatedBooking = convertServiceBookingToHotelBooking(response.data);
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? updatedBooking
            : booking
        ));
        
        return { success: true, data: updatedBooking };
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao realizar ação',
          variant: 'destructive',
        });
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao realizar ação',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const registerPayment = useCallback(async (
    bookingId: string,
    paymentData: {
      amount: number;
      paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
      reference: string;
      notes?: string;
      paymentType?: 'partial' | 'full';
    }
  ) => {
    if (!hotelId) {
      toast({
        title: 'Erro',
        description: 'Hotel ID é obrigatório',
        variant: 'destructive',
      });
      return { success: false, error: 'Hotel ID é obrigatório' };
    }

    try {
      // ✅ Chama o método correto
      const response = await hotelService.registerManualPayment(
        hotelId,
        bookingId,
        paymentData
      );

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Pagamento registrado com sucesso',
        });
        
        // ✅ Atualiza localmente com conversão se houver dados retornados
        if (response.data) {
          const updatedBooking = convertServiceBookingToHotelBooking(response.data);
          setBookings(prev => prev.map(booking => 
            booking.id === bookingId 
              ? updatedBooking
              : booking
          ));
        } else {
          // Fallback: atualiza manualmente apenas o payment_status
          setBookings(prev => prev.map(booking => {
            if (booking.id === bookingId) {
              return {
                ...booking,
                payment_status: paymentData.paymentType === 'full' ? 'paid' : 'partial'
              };
            }
            return booking;
          }));
        }
        
        return { 
          success: true, 
          data: response.data ? convertServiceBookingToHotelBooking(response.data) : null 
        };
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Erro ao registrar pagamento',
          variant: 'destructive',
        });
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao registrar pagamento',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, [hotelId, toast]);

  // Carrega automaticamente
  useEffect(() => {
    if (autoLoad && hotelId) {
      fetchBookings();
    }
  }, [autoLoad, hotelId, fetchBookings]);

  // Recarrega quando filtros mudam
  useEffect(() => {
    if (hotelId) {
      const timeoutId = setTimeout(() => {
        fetchBookings();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hotelId, filters, fetchBookings]);

  return {
    // Estado
    bookings,
    loading,
    refreshing,
    error,
    filters,
    pagination,
    
    // Ações
    fetchBookings,
    updateFilters,
    loadMore,
    refresh,
    performAction,
    registerPayment,
    
    // Utilitários
    hasMore: pagination.hasMore,
    totalCount: pagination.total,
  };
};