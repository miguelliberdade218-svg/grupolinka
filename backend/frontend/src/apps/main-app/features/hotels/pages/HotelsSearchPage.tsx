import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HotelSearch } from '@/shared/components/hotels/HotelSearch';
import { HotelCard } from '@/shared/components/hotels/HotelCard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useHotels } from '../hooks/useHotelsComplete';
import type { HotelSearchParams } from '@/shared/types/hotels';

/**
 * Página de busca e listagem de hotéis
 * MVP completo com busca, filtros e grid de resultados
 */
export const HotelsSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<HotelSearchParams | undefined>();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useHotels(searchParams);

  const handleSearch = (params: HotelSearchParams) => {
    setSearchParams(params);
  };

  const toggleFavorite = (hotelId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(hotelId)) {
      newFavorites.delete(hotelId);
    } else {
      newFavorites.add(hotelId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Banner */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-dark py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl font-bold mb-2">Encontre o hotel perfeito</h1>
          <p className="text-lg opacity-90">
            Milhares de hotéis a preços que você gosta
          </p>
        </div>
      </div>

      {/* Busca Sticky */}
      <HotelSearch onSearch={handleSearch} isLoading={isLoading} sticky />

      {/* Resultados */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">Erro ao buscar hotéis</p>
            <p className="text-red-600 text-sm mt-2">Por favor, tente novamente</p>
          </div>
        ) : data && data.data.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark">
                {data.total} hotéis encontrados
              </h2>
              {searchParams?.location && (
                <p className="text-muted-foreground">em {searchParams.location}</p>
              )}
            </div>

            {/* Grid de Hotels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                      <Skeleton className="h-48 mb-4 rounded-lg" />
                      <Skeleton className="h-6 mb-3" />
                      <Skeleton className="h-4 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))
                : data.data.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      showPrice={true}
                      minPrice={3500} // Você pode obter isso da API
                      isFavorite={favorites.has(hotel.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-dark mb-2">Nenhum hotel encontrado</h3>
            <p className="text-muted-foreground">
              {searchParams
                ? 'Tente ajustar seus critérios de busca'
                : 'Comece uma busca para ver resultados'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsSearchPage;
