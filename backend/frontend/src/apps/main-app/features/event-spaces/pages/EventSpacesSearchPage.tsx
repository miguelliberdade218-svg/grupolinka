import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { EventSpaceCard } from '@/shared/components/event-spaces/EventSpaceCard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { SearchIcon, FilterIcon, MapPin } from 'lucide-react';
import { useEventSpaces } from '../hooks/useEventSpacesComplete';
import { useToast } from '@/shared/hooks/use-toast';
import type { EventSpaceSearchParams } from '@/shared/types/event-spaces';

/**
 * Página de busca e listagem de espaços de eventos
 * Mostra espaços disponíveis com filtros
 * ✅ CORREÇÃO: Adicionados filtros de localização (localidade e província)
 * ✅ CORREÇÃO: Corrigido erro de propriedade 'capacityMin' e 'total'
 */
export const EventSpacesSearchPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const [searchParams, setSearchParams] = useState<EventSpaceSearchParams | undefined>();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // ✅ CORREÇÃO: Estados para filtros
  const [eventType, setEventType] = useState('');
  const [capacity, setCapacity] = useState(''); // ✅ capacityMin -> capacity
  const [locality, setLocality] = useState('');
  const [province, setProvince] = useState('');

  // ✅ CORREÇÃO: Obter parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    
    const localityParam = params.get('locality') || '';
    const provinceParam = params.get('province') || '';
    const eventTypeParam = params.get('eventType') || '';
    const capacityParam = params.get('capacity') || '';
    
    setLocality(localityParam);
    setProvince(provinceParam);
    setEventType(eventTypeParam);
    setCapacity(capacityParam);
    
    // Se houver parâmetros na URL, atualizar searchParams
    if (localityParam || provinceParam || eventTypeParam || capacityParam) {
      setSearchParams({
        locality: localityParam || undefined,
        province: provinceParam || undefined,
        eventType: eventTypeParam || undefined,
        capacity: capacityParam ? parseInt(capacityParam) : undefined, // ✅ capacityMin -> capacity
      });
    }
  }, [search]);

  const { data, isLoading, error, refetch } = useEventSpaces(searchParams);

  // ✅ CORREÇÃO: Handle search com locality e province
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Buscando espaços com:', {
      locality,
      province,
      eventType,
      capacity
    });
    
    const params: EventSpaceSearchParams = {
      locality: locality || undefined,
      province: province || undefined,
      eventType: eventType || undefined,
      capacity: capacity ? parseInt(capacity) : undefined, // ✅ capacityMin -> capacity
    };
    
    setSearchParams(params);
    
    // Atualizar URL com os parâmetros de busca
    const queryParams = new URLSearchParams();
    if (locality) queryParams.set('locality', locality);
    if (province) queryParams.set('province', province);
    if (eventType) queryParams.set('eventType', eventType);
    if (capacity) queryParams.set('capacity', capacity);
    
    setLocation(`/event-spaces/search?${queryParams.toString()}`);
  };

  // ✅ CORREÇÃO: Limpar todos os filtros
  const handleClearFilters = () => {
    setLocality('');
    setProvince('');
    setEventType('');
    setCapacity('');
    setSearchParams(undefined);
    setLocation('/event-spaces/search');
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos",
    });
  };

  const toggleFavorite = (spaceId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(spaceId)) {
      newFavorites.delete(spaceId);
      toast({
        title: "Removido dos favoritos",
        description: "Espaço removido da sua lista",
      });
    } else {
      newFavorites.add(spaceId);
      toast({
        title: "Adicionado aos favoritos",
        description: "Espaço salvo na sua lista",
      });
    }
    setFavorites(newFavorites);
  };

  // ✅ CORREÇÃO: Verificar filtros ativos
  const hasActiveFilters = locality || province || eventType || capacity;

  // ✅ CORREÇÃO: Obter total de resultados
  const totalResults = data?.data?.length || 0;

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

      {/* ✅ CORREÇÃO: Filtros aprimorados com localização */}
      <div className="bg-white border-b border-gray-200 py-6 sticky top-16 z-30">
        <div className="container mx-auto px-4 max-w-7xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ✅ CORREÇÃO: Campo de Localidade */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Localidade (ex: Costa do Sol)"
                  className="pl-10"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                />
              </div>

              {/* ✅ CORREÇÃO: Campo de Província */}
              <div>
                <Input
                  type="text"
                  placeholder="Província (ex: Cidade de Maputo)"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>

              {/* Tipo de evento */}
              <div>
                <Input
                  type="text"
                  placeholder="Tipo de evento"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                />
              </div>

              {/* Capacidade mínima */}
              <div>
                <Input
                  type="number"
                  placeholder="Capacidade mínima"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {/* ✅ CORREÇÃO: Botões de ação e filtros ativos */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FilterIcon className="w-4 h-4" />
                <span>Filtros ativos: </span>
                {hasActiveFilters ? (
                  <div className="flex flex-wrap gap-2">
                    {locality && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                        Localidade: {locality}
                      </span>
                    )}
                    {province && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                        Província: {province}
                      </span>
                    )}
                    {eventType && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                        Tipo: {eventType}
                      </span>
                    )}
                    {capacity && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                        Capacidade: {capacity}+
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">nenhum</span>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {hasActiveFilters && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="flex-1 sm:flex-none"
                  >
                    Limpar filtros
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="bg-secondary hover:bg-secondary/90 text-white flex-1 sm:flex-none"
                  disabled={isLoading}
                >
                  <SearchIcon className="w-5 h-5 mr-2" />
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Resultados */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {error ? (
          <Card className="p-6 text-center bg-red-50 border-red-200">
            <p className="text-red-800 font-semibold">Erro ao buscar espaços</p>
            <p className="text-red-600 text-sm mt-2">Por favor, tente novamente</p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => refetch()}
            >
              Tentar novamente
            </Button>
          </Card>
        ) : isLoading ? (
          <div>
            <div className="mb-6">
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                  <Skeleton className="h-48 mb-4 rounded-lg" />
                  <Skeleton className="h-6 mb-3" />
                  <Skeleton className="h-4 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : data && data.data.length > 0 ? (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h2 className="text-2xl font-bold text-dark">
                {totalResults} {totalResults === 1 ? 'espaço encontrado' : 'espaços encontrados'}
              </h2>
              
              {/* ✅ CORREÇÃO: Mostrar resumo da localização buscada */}
              {(locality || province) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span>
                    {locality}
                    {locality && province && ', '}
                    {province}
                  </span>
                </div>
              )}
            </div>

            {/* Grid de Espaços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((space) => (
                <EventSpaceCard
                  key={space.id}
                  space={space}
                  showPrice={true}
                  isFavorite={favorites.has(space.id)}
                  onToggleFavorite={toggleFavorite}
                  showHotelInfo={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-dark mb-2">
              Nenhum espaço encontrado
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchParams 
                ? `Não encontramos espaços${
                    locality ? ` em "${locality}"` : ''
                  }${province ? `${locality ? ',' : ' em'} "${province}"` : ''}. 
                   Tente ajustar seus filtros ou buscar em outra localização.`
                : 'Comece sua busca preenchendo os filtros acima.'
              }
            </p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="border-secondary text-secondary hover:bg-secondary/5"
              >
                Limpar todos os filtros
              </Button>
            )}
          </div>
        )}
        
        {/* ✅ CORREÇÃO: Dicas de busca */}
        {!isLoading && !error && data?.data.length === 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card className="p-4 bg-gray-50">
              <p className="font-semibold text-dark mb-1">🔍 Seja específico</p>
              <p className="text-sm text-gray-600">
                Quanto mais detalhes, melhores os resultados
              </p>
            </Card>
            <Card className="p-4 bg-gray-50">
              <p className="font-semibold text-dark mb-1">📍 Tente outras localizações</p>
              <p className="text-sm text-gray-600">
                Busque por províncias ou bairros próximos
              </p>
            </Card>
            <Card className="p-4 bg-gray-50">
              <p className="font-semibold text-dark mb-1">🎯 Ajuste os filtros</p>
              <p className="text-sm text-gray-600">
                Remova alguns filtros para mais resultados
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSpacesSearchPage;