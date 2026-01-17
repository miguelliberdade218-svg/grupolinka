import React, { useState } from 'react';
import { EventSpaceCard } from '@/shared/components/event-spaces/EventSpaceCard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { SearchIcon, FilterIcon } from 'lucide-react';
import { useEventSpaces } from '../hooks/useEventSpacesComplete';
import type { EventSpaceSearchParams } from '@/shared/types/event-spaces';

/**
 * Página de busca e listagem de espaços de eventos
 * Mostra espaços disponíveis com filtros
 */
export const EventSpacesSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<EventSpaceSearchParams | undefined>();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [eventType, setEventType] = useState('');
  const [capacityMin, setCapacityMin] = useState('');

  const { data, isLoading, error } = useEventSpaces(searchParams);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({
      eventType: eventType || undefined,
      capacityMin: capacityMin ? parseInt(capacityMin) : undefined,
    });
  };

  const toggleFavorite = (spaceId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(spaceId)) {
      newFavorites.delete(spaceId);
    } else {
      newFavorites.add(spaceId);
    }
    setFavorites(newFavorites);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Banner */}
      <div className="bg-gradient-to-r from-secondary via-secondary/90 to-secondary/80 text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl font-bold mb-2">Espaços para eventos</h1>
          <p className="text-lg opacity-90">
            Encontre o local perfeito para seu evento
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-gray-200 py-6 sticky top-16 z-30">
        <div className="container mx-auto px-4 max-w-7xl">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Tipo de evento (casamento, conferência, etc)"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="number"
                placeholder="Capacidade mínima"
                value={capacityMin}
                onChange={(e) => setCapacityMin(e.target.value)}
                min="1"
              />
            </div>

            <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-white">
              <SearchIcon className="w-5 h-5 mr-2" />
              Buscar
            </Button>
          </form>
        </div>
      </div>

      {/* Resultados */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {error ? (
          <Card className="p-6 text-center bg-red-50 border-red-200">
            <p className="text-red-800 font-semibold">Erro ao buscar espaços</p>
            <p className="text-red-600 text-sm mt-2">Por favor, tente novamente</p>
          </Card>
        ) : data && data.data.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark">
                {data.total} espaços encontrados
              </h2>
            </div>

            {/* Grid de Espaços */}
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
                : data.data.map((space) => (
                    <EventSpaceCard
                      key={space.id}
                      space={space}
                      showPrice={true}
                      isFavorite={favorites.has(space.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-dark mb-2">Nenhum espaço encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar seus critérios de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSpacesSearchPage;
