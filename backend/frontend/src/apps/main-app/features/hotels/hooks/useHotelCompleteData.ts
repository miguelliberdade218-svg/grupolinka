import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/shared/lib/api';
import { mockHotelData } from '../mockHotelData';
import type { Hotel, RoomType, HotelReview } from '@/shared/types/hotels';

export interface HotelCompleteData {
  hotel: Hotel;
  roomTypes: RoomType[];
  reviews: HotelReview[];
}

const HOTEL_COMPLETE_QUERY_KEYS = {
  all: ['hotel-complete'] as const,
  detail: (id: string) => [...HOTEL_COMPLETE_QUERY_KEYS.all, 'detail', id] as const,
};

/**
 * Hook que retorna todos os dados de um hotel em uma única chamada
 * Usa dados mockados como fallback quando a API falha
 */
export function useHotelCompleteData(hotelId: string) {
  return useQuery({
    queryKey: HOTEL_COMPLETE_QUERY_KEYS.detail(hotelId),
    queryFn: async () => {
      try {
        // Tenta buscar da API
        const [hotelResponse, roomTypesResponse, reviewsResponse] = await Promise.all([
          apiService.get<Hotel>(`/api/hotels/${hotelId}`),
          apiService.get<RoomType[]>(`/api/hotels/${hotelId}/room-types`),
          apiService.get<HotelReview[]>(`/api/hotels/${hotelId}/reviews`),
        ]);
        
        return {
          hotel: hotelResponse.data,
          roomTypes: roomTypesResponse.data,
          reviews: reviewsResponse.data,
        };
      } catch (error) {
        console.warn('API falhou, usando dados mockados:', error);
        // Retorna dados mockados como fallback
        return mockHotelData;
      }
    },
    enabled: !!hotelId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}
