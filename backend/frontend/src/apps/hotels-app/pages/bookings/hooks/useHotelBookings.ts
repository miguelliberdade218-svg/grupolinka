// src/apps/hotels-app/pages/bookings/hooks/useHotelBookings.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { HotelBooking, HotelBookingFilters, ApiResponse, ListResponse } from '@/shared/types/bookings';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';

// ✅ IMPORTAR CONSTANTES ATUALIZADAS
import { normalizeBookingStatus } from '@/shared/constants/bookingStatus';

export interface UseHotelBookingsOptions {
  hotelId?: string;
  initialFilters?: HotelBookingFilters;
  autoLoad?: boolean;
}

// ✅ FUNÇÃO ATUALIZADA: Converte Booking do serviço para HotelBooking
function convertServiceBookingToHotelBooking(serviceBooking: any): HotelBooking {
  console.log('🔄 [CONVERSION] Booking raw data:', serviceBooking);
  
  // ✅ CRITICAL FIX: Se o serviceBooking tiver uma propriedade 'data', use-a
  const bookingData = serviceBooking.data || serviceBooking;
  
  const hotelBooking: HotelBooking = {
    id: bookingData.id || '',
    hotel_id: bookingData.hotel_id || bookingData.hotelId || '',
    room_type_id: bookingData.room_type_id || bookingData.roomTypeId || '',
    guest_name: bookingData.guest_name || bookingData.guestName || 'Hóspede não informado',
    guest_email: bookingData.guest_email || bookingData.guestEmail || '',
    guest_phone: bookingData.guest_phone || bookingData.guestPhone || undefined,
    check_in: bookingData.check_in || bookingData.checkIn || '',
    check_out: bookingData.check_out || bookingData.checkOut || '',
    adults: Number(bookingData.adults) || 1,
    children: Number(bookingData.children) || 0,
    units: Number(bookingData.units) || 1,
    nights: Number(bookingData.nights) || 0,
    
    // ✅ CORREÇÃO CRÍTICA: Converter preços
    total_price: String(bookingData.total_price || bookingData.totalPrice || bookingData.totalPrice || '0'),
    base_price: String(bookingData.base_price || bookingData.basePrice || '0'),
    taxes: bookingData.taxes ? String(bookingData.taxes) : undefined,
    
    special_requests: bookingData.special_requests || bookingData.specialRequests || undefined,
    status: normalizeBookingStatus(bookingData.status),
    payment_status: (bookingData.payment_status || bookingData.paymentStatus || 'pending') as 'pending' | 'partial' | 'paid' | 'refunded',
    promo_code: bookingData.promo_code || bookingData.promoCode || undefined,
    user_id: bookingData.user_id || bookingData.userId || undefined,
    created_at: bookingData.created_at || bookingData.createdAt || '',
    updated_at: bookingData.updated_at || bookingData.updatedAt || '',
  };

  console.log('✅ [CONVERSION] Converted booking:', {
    id: hotelBooking.id,
    guest: hotelBooking.guest_name,
    price: hotelBooking.total_price,
    dates: `${hotelBooking.check_in} → ${hotelBooking.check_out}`,
    payment_status: hotelBooking.payment_status,
    status: hotelBooking.status
  });

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
  
  // ✅ REF para evitar loops infinitos
  const isFetchingRef = useRef(false);
  const lastFiltersRef = useRef<string>('');

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!hotelId) {
      setError('Hotel ID é obrigatório');
      return;
    }

    // ✅ Evitar múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      console.log('⏸️ [useHotelBookings] Fetch já em andamento, ignorando...');
      return;
    }

    const currentFiltersString = JSON.stringify(filters);
    
    // ✅ Verificar se os filtros realmente mudaram
    if (!isRefresh && lastFiltersRef.current === currentFiltersString) {
      console.log('⏸️ [useHotelBookings] Filtros não mudaram, ignorando...');
      return;
    }

    isFetchingRef.current = true;
    lastFiltersRef.current = currentFiltersString;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      // ✅ IMPORTANTE: Se a tab ativa for 'pending_payment', não filtrar por status
      const backendFilters = { ...filters };
      
      const response = await hotelService.getHotelBookings(hotelId, backendFilters);
      
      if (response.success && response.data) {
        // ✅ Converte os bookings do serviço para o tipo HotelBooking
        const convertedBookings = response.data.map(convertServiceBookingToHotelBooking);
        
        setBookings(convertedBookings);
        setPagination(prev => ({
          ...prev,
          total: response.count || response.data.length,
          hasMore: false,
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
      isFetchingRef.current = false;
    }
  }, [hotelId, filters, toast]);

  const updateFilters = useCallback((newFilters: Partial<HotelBookingFilters>) => {
    // ✅ Usar comparação profunda para evitar atualizações desnecessárias
    const hasChanged = Object.keys(newFilters).some(key => {
      const typedKey = key as keyof HotelBookingFilters;
      return JSON.stringify(filters[typedKey]) !== JSON.stringify(newFilters[typedKey]);
    });
    
    if (hasChanged) {
      setFilters(prev => ({ ...prev, ...newFilters }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filters]);

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

  // ✅ NOVA FUNÇÃO: Confirmar reserva
  const confirmBooking = useCallback(async (
    bookingId: string,
  ) => {
    try {
      const response = await hotelService.confirmBooking(bookingId);

      if (response.success && response.data) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Reserva confirmada com sucesso',
        });
        
        // ✅ CORREÇÃO: Usar response.data (não o response inteiro)
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
          description: response.error || 'Erro ao confirmar reserva',
          variant: 'destructive',
        });
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao confirmar reserva',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  // ✅ NOVA FUNÇÃO: Rejeitar reserva
  const rejectBooking = useCallback(async (
    bookingId: string,
    reason: string
  ) => {
    try {
      const response = await hotelService.rejectBooking(bookingId, reason);

      if (response.success && response.data) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Reserva rejeitada com sucesso',
        });
        
        // ✅ CORREÇÃO: Usar response.data (não o response inteiro)
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
          description: response.error || 'Erro ao rejeitar reserva',
          variant: 'destructive',
        });
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao rejeitar reserva',
        variant: 'destructive',
      });
      return { success: false, error: err.message };
    }
  }, [toast]);

  const performAction = useCallback(async (
    bookingId: string,
    action: 'checkIn' | 'checkOut' | 'cancel' | 'reject' | 'confirm',
    data?: any
  ) => {
    try {
      let response: ApiResponse<any>;
      
      switch (action) {
        case 'checkIn':
          response = await hotelService.checkInBooking(bookingId);
          break;
        case 'checkOut':
          response = await hotelService.checkOutBooking(bookingId);
          break;
        case 'cancel':
          response = await hotelService.cancelBooking(bookingId, data?.reason);
          break;
        case 'reject':
          response = await hotelService.rejectBooking(bookingId, data?.reason);
          break;
        case 'confirm':
          response = await hotelService.confirmBooking(bookingId);
          break;
        default:
          throw new Error('Ação não suportada');
      }

      if (response.success && response.data) {
        toast({
          title: 'Sucesso',
          description: response.message || 'Ação realizada com sucesso',
        });
        
        // ✅ CORREÇÃO: Usar response.data (não o response inteiro)
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
        
        // ✅ CORREÇÃO CRÍTICA: O backend retorna {success, message, data}
        // Precisamos usar response.data para a conversão
        if (response.data) {
          console.log('💰 [useHotelBookings] Dados retornados do pagamento:', response.data);
          const updatedBooking = convertServiceBookingToHotelBooking(response.data);
          console.log('💰 [useHotelBookings] Booking atualizado após pagamento:', updatedBooking);
          
          setBookings(prev => prev.map(booking => 
            booking.id === bookingId 
              ? updatedBooking
              : booking
          ));
        } else {
          console.warn('⚠️ [useHotelBookings] Nenhum booking retornado após pagamento');
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

  // ✅ Carrega automaticamente - APENAS quando hotelId mudar
  useEffect(() => {
    if (autoLoad && hotelId) {
      console.log('🚀 [useHotelBookings] Carregamento inicial');
      fetchBookings();
    }
  }, [autoLoad, hotelId]); // Removido fetchBookings da dependência

  // ✅ Recarrega quando filtros mudam - com debounce melhorado
  useEffect(() => {
    if (hotelId) {
      console.log('🎯 [useHotelBookings] Filtros atualizados, aguardando para buscar...');
      const timeoutId = setTimeout(() => {
        fetchBookings();
      }, 500); // Aumentado para 500ms
      
      return () => {
        console.log('🧹 [useHotelBookings] Limpando timeout anterior');
        clearTimeout(timeoutId);
      };
    }
  }, [hotelId, filters]); // Removido fetchBookings da dependência

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
    confirmBooking,
    rejectBooking,
    registerPayment,
    
    // Utilitários
    hasMore: pagination.hasMore,
    totalCount: pagination.total,
  };
};