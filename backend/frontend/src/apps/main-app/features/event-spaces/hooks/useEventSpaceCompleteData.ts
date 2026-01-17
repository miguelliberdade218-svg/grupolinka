import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/shared/lib/api';
import type { EventSpace, EventSpaceReview } from '@/shared/types/event-spaces-v2';

export interface EventSpaceCompleteData {
  space: EventSpace;
  reviews: EventSpaceReview[];
}

const EVENT_SPACE_COMPLETE_QUERY_KEYS = {
  all: ['event-space-complete'] as const,
  detail: (id: string) => [...EVENT_SPACE_COMPLETE_QUERY_KEYS.all, 'detail', id] as const,
};

/**
 * Hook que retorna todos os dados de um espaço de evento em uma única chamada
 * Usa dados mockados como fallback quando a API falha
 */
export function useEventSpaceCompleteData(spaceId: string) {
  return useQuery({
    queryKey: EVENT_SPACE_COMPLETE_QUERY_KEYS.detail(spaceId),
    queryFn: async () => {
      try {
        // Tenta buscar da API
        const [spaceResponse, reviewsResponse] = await Promise.all([
          apiService.get<EventSpace>(`/api/spaces/${spaceId}`),
          apiService.get<EventSpaceReview[]>(`/api/spaces/${spaceId}/reviews`),
        ]);
        
        return {
          space: spaceResponse.data,
          reviews: reviewsResponse.data,
        };
      } catch (error) {
        console.warn('API falhou, usando dados mockados:', error);
        // Retorna dados mockados como fallback
        return {
          space: {
            id: spaceId,
            name: 'Espaço de Eventos Exemplo',
            description: 'Espaço moderno para eventos corporativos e sociais',
            spaceType: 'conference_room',
            capacityMin: 50,
            capacityMax: 200,
            pricePerHour: 2500,
            priceHalfDay: 8000,
            priceFullDay: 15000,
            weekendSurchargePercent: 20,
            securityDeposit: 5000,
            mainImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865',
            images: ['https://images.unsplash.com/photo-1511578314322-379afb476865'],
            amenities: ['WiFi', 'Projetor', 'Ar Condicionado', 'Cozinha'],
            equipment: ['Mesas', 'Cadeiras', 'Som', 'Iluminação'],
            includesCatering: false,
            includesFurniture: true,
            includesCleaning: true,
            includesSecurity: false,
            alcoholAllowed: true,
            insuranceRequired: true,
            maxDurationHours: 12,
            noiseRestriction: 'Até 22h',
            rating: 4.5,
            reviewCount: 24,
            isActive: true,
            isFeatured: true,
            hostId: 'host-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
          reviews: [
            {
              id: 'review-1',
              eventSpaceId: spaceId,
              bookingId: 'booking-1',
              userName: 'João Silva',
              userEmail: 'joao@example.com',
              eventType: 'Conferência',
              numberOfGuests: 80,
              comment: 'Espaço excelente, equipamentos de qualidade',
              rating: 5,
              pros: 'Equipamentos, localização',
              cons: 'Estacionamento limitado',
              helpfulCount: 8,
              unhelpfulCount: 0,
              verified: true,
              createdAt: '2024-01-10T00:00:00Z',
              updatedAt: '2024-01-10T00:00:00Z',
            },
          ],
        };
      }
    },
    enabled: !!spaceId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}
