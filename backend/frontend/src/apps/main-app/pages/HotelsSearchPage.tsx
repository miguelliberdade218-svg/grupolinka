import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Slider } from '@/shared/components/ui/slider';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Users, 
  Calendar, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Navigation,
  Hotel as HotelIcon,
  Shield
} from 'lucide-react';
import { hotelService, Hotel } from '@/services/hotelService';
import { locationsService } from '@/services/locationsService';
import HotelCard from '@/shared/components/hotels/HotelCard';
import HotelDetailModal from '@/shared/components/HotelDetailModal';
import { useToast } from '@/shared/hooks/use-toast';
import { debounce } from 'lodash';

interface HotelSearchParams {
  location?: string;
  locationId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  rating?: number;
  sortBy?: string;
  page?: number;
}

interface LocationSuggestion {
  id: string;
  name: string;
  province?: string;
  district?: string;
  lat?: number;
  lng?: number;
  type?: string;
}

interface HotelWithDetails extends Hotel {
  base_price?: string; // Para compatibilidade com HotelCard - marcado como opcional
  images: string[];
  amenities: string[];
}

export default function HotelsSearchPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<HotelSearchParams>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Obter parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const paramsObj: HotelSearchParams = {
      location: params.get('location') || '',
      locationId: params.get('locationId') || '',
      checkIn: params.get('checkIn') || formatDate(today),
      checkOut: params.get('checkOut') || formatDate(tomorrow),
      guests: parseInt(params.get('guests') || '2'),
      radius: parseInt(params.get('radius') || '50'),
      minPrice: parseInt(params.get('minPrice') || '0'),
      maxPrice: parseInt(params.get('maxPrice') || '10000'),
      rating: parseInt(params.get('rating') || '0'),
      sortBy: params.get('sortBy') || 'distance',
      page: parseInt(params.get('page') || '1'),
    };
    
    const amenitiesParam = params.get('amenities');
    if (amenitiesParam) {
      paramsObj.amenities = amenitiesParam.split(',');
    }
    
    setSearchParams(paramsObj);
    setCurrentPage(paramsObj.page || 1);
    
    if (paramsObj.location) {
      setLocationQuery(paramsObj.location);
    }
  }, [search]);

  // Buscar sugestões de localização com debounce
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setLocationSuggestions([]);
        return;
      }
      
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await locationsService.searchSuggestions(query, 5);
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar sugestões de localização",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSuggestions(locationQuery);
    
    return () => {
      fetchSuggestions.cancel();
    };
  }, [locationQuery, fetchSuggestions]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setLocationSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Buscar hotéis
  const { data: hotelsData, isLoading, refetch, error } = useQuery({
    queryKey: ['hotelsSearch', searchParams],
    queryFn: async () => {
      try {
        // Se temos locationId, buscar hotéis próximos por localização
        if (searchParams.locationId) {
          const location = await locationsService.getById(searchParams.locationId);
          if (location?.lat && location?.lng) {
            const response = await hotelService.getNearbyHotels(
              location.lat,
              location.lng,
              searchParams.radius || 50
            );
            
            if (response) {
              setTotalPages(Math.ceil((response.count || 0) / 9));
            }
            return response;
          }
        }
        
        // Busca tradicional por filtros - usando apenas parâmetros suportados
        const response = await hotelService.searchHotels({
          locality: searchParams.location,
          province: searchParams.location?.includes(',') 
            ? searchParams.location.split(',')[1]?.trim() 
            : undefined,
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          guests: searchParams.guests,
        });
        
        if (response) {
          setTotalPages(Math.ceil((response.count || 0) / 9));
        }
        return response;
      } catch (error) {
        console.error('Erro na busca de hotéis:', error);
        toast({
          title: "Erro na busca",
          description: "Não foi possível carregar os hotéis. Tente novamente.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!searchParams.location || !!searchParams.locationId,
    retry: 2,
  });

  const hotels: HotelWithDetails[] = hotelsData?.data?.map((hotel: Hotel) => ({
    ...hotel,
    base_price: '0', // Valor padrão para compatibilidade
    images: hotel.images || [],
    amenities: hotel.amenities || [],
  })) || [];
  
  const totalResults = hotelsData?.count || 0;

  // Calcular distância para cada hotel
  const calculateDistance = useCallback((hotelLat: string | null, hotelLng: string | null): number => {
    if (!hotelLat || !hotelLng || !searchParams.locationId) return 0;
    
    // Mock: retorna distância aleatória entre 0.5 e 30 km
    return Math.random() * 30 + 0.5;
  }, [searchParams.locationId]);

  // Ordenar hotéis
  const sortedHotels = useCallback(() => {
    const hotelsCopy = [...hotels];
    
    switch (searchParams.sortBy) {
      case 'price':
        return hotelsCopy.sort((a, b) => 
          (parseInt(a.base_price || '0') - parseInt(b.base_price || '0'))
        );
      case 'rating':
        return hotelsCopy.sort((a, b) => 
          (b.rating || 0) - (a.rating || 0)
        );
      case 'name':
        return hotelsCopy.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      case 'distance':
      default:
        return hotelsCopy.sort((a, b) => {
          const distA = calculateDistance(a.lat || null, a.lng || null);
          const distB = calculateDistance(b.lat || null, b.lng || null);
          return distA - distB;
        });
    }
  }, [hotels, searchParams.sortBy, calculateDistance]);

  // Manipuladores
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setLocationQuery(suggestion.name);
    setSearchParams(prev => ({
      ...prev,
      location: suggestion.name,
      locationId: suggestion.id
    }));
    setLocationSuggestions([]);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.location) params.set('location', searchParams.location);
    if (searchParams.locationId) params.set('locationId', searchParams.locationId);
    if (searchParams.checkIn) params.set('checkIn', searchParams.checkIn);
    if (searchParams.checkOut) params.set('checkOut', searchParams.checkOut);
    if (searchParams.guests) params.set('guests', searchParams.guests.toString());
    if (searchParams.radius) params.set('radius', searchParams.radius.toString());
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice.toString());
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice.toString());
    if (searchParams.rating) params.set('rating', searchParams.rating.toString());
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
    if (searchParams.page) params.set('page', searchParams.page.toString());
    if (searchParams.amenities?.length) {
      params.set('amenities', searchParams.amenities.join(','));
    }
    
    setLocation(`/hotels/search?${params.toString()}`);
    refetch();
  };

  const handleResetFilters = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    setSearchParams({
      location: searchParams.location,
      locationId: searchParams.locationId,
      checkIn: formatDate(today),
      checkOut: formatDate(tomorrow),
      guests: 2,
      radius: 50,
      minPrice: 0,
      maxPrice: 10000,
      rating: 0,
      sortBy: 'distance',
      page: 1,
      amenities: [],
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const amenitiesOptions = [
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-4 h-4" /> },
    { id: 'parking', label: 'Estacionamento', icon: <Car className="w-4 h-4" /> },
    { id: 'breakfast', label: 'Café da manhã', icon: <Coffee className="w-4 h-4" /> },
    { id: 'gym', label: 'Academia', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'pool', label: 'Piscina', icon: '🏊' },
    { id: 'spa', label: 'SPA', icon: '💆' },
    { id: 'restaurant', label: 'Restaurante', icon: '🍽️' },
    { id: 'bar', label: 'Bar', icon: '🍹' },
    { id: 'ac', label: 'Ar Condicionado', icon: '❄️' },
    { id: 'tv', label: 'TV a Cabo', icon: '📺' },
    { id: 'safe', label: 'Cofre', icon: '🔒' },
    { id: 'laundry', label: 'Lavanderia', icon: '👕' },
  ];

  // Renderizar paginação
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className={currentPage === i ? "bg-orange-600 hover:bg-orange-700" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header com busca */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Encontre o Hotel Perfeito</h1>
              <p className="text-orange-100 mt-2">
                {totalResults > 0 
                  ? `${totalResults} hotéis encontrados` 
                  : 'Busque hotéis em Moçambique'}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>

          {/* Barra de busca rápida */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Localização */}
                <div className="relative" ref={suggestionsRef}>
                  <Label className="text-white text-sm mb-2 block">Localização</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      type="text"
                      placeholder="Para onde vai?"
                      className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white/50"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      onFocus={() => {
                        if (locationQuery.length >= 2) {
                          fetchSuggestions(locationQuery);
                        }
                      }}
                    />
                    {isLoadingSuggestions && (
                      <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white animate-spin" />
                    )}
                  </div>
                  
                  {/* Sugestões */}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          onClick={() => handleLocationSelect(suggestion)}
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{suggestion.name}</div>
                            <div className="text-sm text-gray-500">
                              {suggestion.district || suggestion.province || 'Moçambique'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Datas */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Check-in / Check-out</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <Input
                        type="date"
                        className="pl-10 bg-white/20 border-white/30 text-white"
                        value={searchParams.checkIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, checkIn: e.target.value }))}
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <Input
                        type="date"
                        className="pl-10 bg-white/20 border-white/30 text-white"
                        value={searchParams.checkOut}
                        min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, checkOut: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Hóspedes */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Hóspedes</Label>
                  <Select
                    value={searchParams.guests?.toString() || "2"}
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, guests: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Hóspedes" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'hóspede' : 'hóspedes'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de busca */}
                <div className="flex items-end">
                  <Button 
                    className="w-full bg-white text-orange-600 hover:bg-gray-100 h-10 font-medium"
                    onClick={handleSearch}
                    disabled={isLoading || (!locationQuery && !searchParams.location)}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading ? 'Buscando...' : 'Buscar Hotéis'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros (sidebar) */}
          {showFilters && (
            <div className="lg:w-1/4">
              <Card className="sticky top-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Raio de busca */}
                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Navigation className="w-4 h-4" />
                      Raio de busca: {searchParams.radius} km
                    </Label>
                    <Slider
                      value={[searchParams.radius || 50]}
                      min={5}
                      max={200}
                      step={5}
                      onValueChange={([value]) => setSearchParams(prev => ({ ...prev, radius: value }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5 km</span>
                      <span>200 km</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Preço */}
                  <div>
                    <Label className="mb-4 block">Preço por noite (MZN)</Label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm text-gray-500">Mínimo</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20000"
                          value={searchParams.minPrice}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value <= (searchParams.maxPrice || 10000)) {
                              setSearchParams(prev => ({ ...prev, minPrice: value }));
                            }
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Máximo</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20000"
                          value={searchParams.maxPrice}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 10000;
                            if (value >= (searchParams.minPrice || 0)) {
                              setSearchParams(prev => ({ ...prev, maxPrice: value }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <Slider
                      value={[searchParams.minPrice || 0, searchParams.maxPrice || 10000]}
                      min={0}
                      max={20000}
                      step={500}
                      onValueChange={([min, max]) => setSearchParams(prev => ({ 
                        ...prev, 
                        minPrice: min, 
                        maxPrice: max 
                      }))}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  {/* Classificação */}
                  <div>
                    <Label className="mb-4 block">Classificação mínima</Label>
                    <div className="flex items-center gap-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <button
                          key={star}
                          className={`flex items-center gap-1 p-2 rounded-lg transition-all ${
                            searchParams.rating && star <= searchParams.rating 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          onClick={() => setSearchParams(prev => ({ 
                            ...prev, 
                            rating: prev.rating === star ? 0 : star 
                          }))}
                        >
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-sm font-medium">{star}+</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Amenidades */}
                  <div>
                    <Label className="mb-4 block">Amenidades</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {amenitiesOptions.slice(0, 8).map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`amenity-${amenity.id}`}
                            checked={searchParams.amenities?.includes(amenity.id) || false}
                            onCheckedChange={(checked) => {
                              const currentAmenities = searchParams.amenities || [];
                              const newAmenities = checked
                                ? [...currentAmenities, amenity.id]
                                : currentAmenities.filter(id => id !== amenity.id);
                              setSearchParams(prev => ({ ...prev, amenities: newAmenities }));
                            }}
                          />
                          <Label 
                            htmlFor={`amenity-${amenity.id}`} 
                            className="text-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            {typeof amenity.icon === 'string' ? (
                              <span className="text-base">{amenity.icon}</span>
                            ) : (
                              amenity.icon
                            )}
                            <span>{amenity.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Ver mais amenidades */}
                    {searchParams.amenities?.some(a => amenitiesOptions.slice(8).map(o => o.id).includes(a)) && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {amenitiesOptions.slice(8).map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`amenity-${amenity.id}`}
                              checked={searchParams.amenities?.includes(amenity.id) || false}
                              onCheckedChange={(checked) => {
                                const currentAmenities = searchParams.amenities || [];
                                const newAmenities = checked
                                  ? [...currentAmenities, amenity.id]
                                  : currentAmenities.filter(id => id !== amenity.id);
                                setSearchParams(prev => ({ ...prev, amenities: newAmenities }));
                              }}
                            />
                            <Label 
                              htmlFor={`amenity-${amenity.id}`} 
                              className="text-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              {typeof amenity.icon === 'string' ? (
                                <span className="text-base">{amenity.icon}</span>
                              ) : (
                                amenity.icon
                              )}
                              <span>{amenity.label}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conteúdo principal */}
          <div className={`${showFilters ? 'lg:w-3/4' : 'w-full'}`}>
            {/* Resultados */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLoading ? 'Buscando hotéis...' : `Hotéis encontrados (${totalResults})`}
                  </h2>
                  {searchParams.location && (
                    <p className="text-gray-600 mt-1">
                      em {searchParams.location}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={searchParams.sortBy || 'distance'}
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">Mais próximo</SelectItem>
                      <SelectItem value="price">Preço mais baixo</SelectItem>
                      <SelectItem value="rating">Melhor classificação</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-red-600">⚠️</div>
                      <div>
                        <h3 className="font-semibold text-red-800">Erro ao carregar hotéis</h3>
                        <p className="text-red-600 text-sm">
                          Tente novamente ou ajuste seus critérios de busca.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading state */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <Skeleton className="h-48 w-full rounded-t-lg" />
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : hotels.length === 0 && !error ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <HotelIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum hotel encontrado</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchParams.location 
                        ? `Não encontramos hotéis em "${searchParams.location}". Tente buscar em outra localização ou ajustar seus filtros.`
                        : 'Digite uma localização para buscar hotéis disponíveis.'
                      }
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={handleResetFilters}>Limpar filtros</Button>
                      <Button variant="outline" onClick={() => setLocationQuery('')}>
                        Buscar em outra localização
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Mapa de calor de localização */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <div>
                          <span className="font-medium text-orange-800">
                            Buscando em: {searchParams.location || 'Moçambique'}
                          </span>
                          {searchParams.checkIn && searchParams.checkOut && (
                            <div className="text-sm text-orange-700 mt-1">
                              {searchParams.checkIn} até {searchParams.checkOut}
                              {searchParams.guests && ` • ${searchParams.guests} hóspedes`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {searchParams.radius && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Raio: {searchParams.radius}km
                          </Badge>
                        )}
                        {searchParams.rating && searchParams.rating > 0 && (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            {searchParams.rating}+ estrelas
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-orange-700 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Distância:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Próximo (0-10km)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Moderado (10-30km)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Longe (30+ km)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de hotéis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedHotels().map((hotel) => {
                      const distance = calculateDistance(hotel.lat || null, hotel.lng || null);
                      const distanceColor = distance <= 10 ? 'bg-green-100 text-green-800 border-green-300' : 
                                          distance <= 30 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                          'bg-red-100 text-red-800 border-red-300';
                      
                      return (
                        <div key={hotel.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {/* Badge de distância */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className={`${distanceColor}`}>
                              {distance.toFixed(1)} km
                            </Badge>
                          </div>

                          <HotelCard
                            hotel={{
                              ...hotel,
                              id: hotel.id,
                              name: hotel.name || 'Hotel sem nome',
                              description: hotel.description || '',
                              address: hotel.address || '',
                              lat: hotel.lat || null,
                              lng: hotel.lng || null,
                              rating: hotel.rating || 0,
                              total_reviews: hotel.total_reviews || 0,
                              base_price: hotel.base_price || '0',
                              images: hotel.images || [],
                              amenities: hotel.amenities || [],
                              contact_phone: hotel.contact_phone || '',
                              contact_email: hotel.contact_email || '',
                              check_in_time: hotel.check_in_time || '14:00',
                              check_out_time: hotel.check_out_time || '12:00',
                            }}
                            showPrice={true}
                            minPrice={parseInt(hotel.base_price || '0')}
                            onViewDetails={() => setSelectedHotelId(hotel.id)}
                            onBook={() => {
                              toast({
                                title: "Reserva iniciada",
                                description: "Redirecionando para página de reserva...",
                              });
                              setLocation(`/hotels/${hotel.id}/book?checkIn=${searchParams.checkIn}&checkOut=${searchParams.checkOut}&guests=${searchParams.guests}`);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginação */}
                  {totalResults > 9 && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {Math.min(9, hotels.length)} de {totalResults} hotéis
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        
                        {renderPagination()}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Informações adicionais */}
            <Card className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Star className="w-5 h-5" />
                  Dicas para sua busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">📍</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Localização precisa</h4>
                    <p className="text-sm text-orange-700">
                      Selecione uma localização específica da lista para resultados mais precisos e veja a distância exata de cada hotel.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">💰</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Melhor preço garantido</h4>
                    <p className="text-sm text-orange-700">
                      Encontramos os melhores preços entre centenas de hotéis em Moçambique. Preços já incluem taxas e impostos.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">🛡️</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Reserva segura</h4>
                    <p className="text-sm text-orange-700">
                      Todas as reservas são 100% seguras com nosso sistema de pagamento protegido e suporte 24/7.
                    </p>
                  </div>
                </div>
                
                {/* Informações extras */}
                <div className="mt-6 pt-6 border-t border-orange-200">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <Shield className="w-4 h-4" />
                      <span>Cancelamento gratuito em muitos hotéis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <span>⭐</span>
                      <span>Avaliações verificadas por hóspedes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <span>📱</span>
                      <span>App disponível para iOS e Android</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do hotel */}
      {selectedHotelId && (
        <HotelDetailModal
          hotelId={selectedHotelId}
          isOpen={!!selectedHotelId}
          onClose={() => setSelectedHotelId(null)}
          checkIn={searchParams.checkIn}
          checkOut={searchParams.checkOut}
          guests={searchParams.guests}
        />
      )}
    </div>
  );
}