import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
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
  Building,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Navigation,
  Mic,
  Music,
  PartyPopper,
  Briefcase,
  Heart
} from 'lucide-react';
import { eventSpaceService } from '@/services/eventSpaceService';
import { locationsService } from '@/services/locationsService';
import EventSpaceCard from '@/shared/components/event-spaces/EventSpaceCard';
import EventSpaceDetailModal from '@/shared/components/EventSpaceDetailModal';
import { useToast } from '@/shared/hooks/use-toast';
import { debounce } from 'lodash';
import { EventSpace, EventSpaceSearchParams as SearchParamsType } from '@/shared/types/event-spaces';

interface LocationSuggestion {
  id: string;
  name: string;
  province?: string;
  district?: string;
  lat?: number;
  lng?: number;
  type?: string;
}

// Extender o tipo para incluir campos necessários para o frontend
interface ExtendedSearchParams extends SearchParamsType {
  sortBy?: string;
  page?: number;
  radius?: number; // Para compatibilidade
}

// Função para converter dados da API para o tipo EventSpace
function convertToEventSpace(data: any): EventSpace {
  return {
    id: data.id || '',
    hotelId: data.hotelId || data.hotel_id || data.hotel?.id || '',
    hotel_id: data.hotelId || data.hotel_id || data.hotel?.id || '',
    name: data.name || 'Espaço sem nome',
    description: data.description || null,
    capacityMin: data.capacityMin || data.capacity_min || 0,
    capacityMax: data.capacityMax || data.capacity_max || 0,
    areaSqm: data.areaSqm || data.area_sqm || null,
    basePricePerDay: data.basePricePerDay || data.base_price_per_day || '0',
    weekendSurchargePercent: data.weekendSurchargePercent || data.weekend_surcharge_percent || 0,
    offersCatering: data.offersCatering || data.offers_catering || false,
    cateringDiscountPercent: data.cateringDiscountPercent || data.catering_discount_percent || 0,
    cateringMenuUrls: data.cateringMenuUrls || data.catering_menu_urls || [],
    spaceType: data.spaceType || data.space_type || null,
    naturalLight: data.naturalLight || data.natural_light || false,
    hasStage: data.hasStage || data.has_stage || false,
    loadingAccess: data.loadingAccess || data.loading_access || false,
    dressingRooms: data.dressingRooms || data.dressing_rooms || null,
    insuranceRequired: data.insuranceRequired || data.insurance_required || false,
    alcoholAllowed: data.alcoholAllowed || data.alcohol_allowed || false,
    approvalRequired: data.approvalRequired || data.approval_required || false,
    noiseRestriction: data.noiseRestriction || data.noise_restriction || null,
    securityDeposit: data.securityDeposit || data.security_deposit || null,
    allowedEventTypes: data.allowedEventTypes || data.allowed_event_types || [],
    prohibitedEventTypes: data.prohibitedEventTypes || data.prohibited_event_types || [],
    equipment: data.equipment || {},
    setupOptions: data.setupOptions || data.setup_options || [],
    images: data.images || [],
    floorPlanImage: data.floorPlanImage || data.floor_plan_image || null,
    virtualTourUrl: data.virtualTourUrl || data.virtual_tour_url || null,
    isActive: data.isActive !== false,
    isFeatured: data.isFeatured || false,
    slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
    rating: data.rating || undefined,
    totalReviews: data.totalReviews || data.total_reviews || undefined,
    locality: data.locality || null,
    province: data.province || null,
    lat: data.lat || null,
    lng: data.lng || null,
    location_id: data.location_id || null,
    inherits_hotel_location: data.inherits_hotel_location || false,
    createdAt: data.createdAt || data.created_at || new Date().toISOString(),
    updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
    // Campos extras úteis no frontend
    thumbnail: data.images?.[0] || '',
    location: data.hotel?.locality 
      ? `${data.hotel.locality}, ${data.hotel.province}`
      : undefined,
    hotel: data.hotel || null,
    // Capacidades por setup
    capacityTheater: data.capacityTheater || data.capacity_theater || null,
    capacityClassroom: data.capacityClassroom || data.capacity_classroom || null,
    capacityBanquet: data.capacityBanquet || data.capacity_banquet || null,
    capacityStanding: data.capacityStanding || data.capacity_standing || null,
    capacityCocktail: data.capacityCocktail || data.capacity_cocktail || null,
  };
}

export default function EventSpacesSearchPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<ExtendedSearchParams>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Obter parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(search);
    
    const paramsObj: ExtendedSearchParams = {
      query: params.get('query') || undefined,
      locality: params.get('locality') || '',
      province: params.get('province') || '',
      startDate: params.get('startDate') || new Date().toISOString().split('T')[0],
      endDate: params.get('endDate') || undefined,
      capacity: parseInt(params.get('capacity') || '50'),
      eventType: params.get('eventType') || '',
      maxPricePerDay: parseInt(params.get('maxPricePerDay') || '50000'),
      hotelId: params.get('hotelId') || undefined,
      sortBy: params.get('sortBy') || 'distance',
      page: parseInt(params.get('page') || '1'),
      radius: parseInt(params.get('radius') || '50'),
    };
    
    const amenitiesParam = params.get('amenities');
    if (amenitiesParam) {
      paramsObj.amenities = amenitiesParam.split(',');
    }
    
    setSearchParams(paramsObj);
    setCurrentPage(paramsObj.page || 1);
    
    if (paramsObj.locality) {
      setLocationQuery(paramsObj.locality);
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

  // Buscar espaços para eventos
  const { data: spacesResponse, isLoading, refetch, error } = useQuery({
    queryKey: ['eventSpacesSearch', searchParams],
    queryFn: async () => {
      try {
        // Criar filtros para a API (sem os campos frontend-only)
        const filters: SearchParamsType = {
          locality: searchParams.locality,
          province: searchParams.province,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
          capacity: searchParams.capacity,
          eventType: searchParams.eventType,
          maxPricePerDay: searchParams.maxPricePerDay,
          amenities: searchParams.amenities,
          hotelId: searchParams.hotelId,
        };
        
        const response = await eventSpaceService.searchEventSpaces(filters);
        
        if (response.success && response.data) {
          const spacesData = Array.isArray(response.data) ? response.data : [];
          const perPage = 9;
          setTotalPages(Math.ceil(spacesData.length / perPage));
        }
        return response;
      } catch (error) {
        console.error('Erro na busca de espaços:', error);
        toast({
          title: "Erro na busca",
          description: "Não foi possível carregar os espaços. Tente novamente.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!searchParams.locality,
    retry: 2,
  });

  // Converter dados da API para o tipo EventSpace
  const spaces: EventSpace[] = React.useMemo(() => {
    if (!spacesResponse?.data) return [];
    
    const spacesData = Array.isArray(spacesResponse.data) ? spacesResponse.data : [];
    return spacesData.map(convertToEventSpace);
  }, [spacesResponse]);

  const totalResults = spaces.length || 0;

  // Calcular distância (mock)
  const calculateDistance = useCallback((spaceLat: string | null | undefined, spaceLng: string | null | undefined): number => {
    if (!spaceLat || !spaceLng) return 0;
    
    // Mock: retorna distância aleatória entre 0.5 e 30 km
    return Math.random() * 30 + 0.5;
  }, []);

  // Ordenar espaços
  const sortedSpaces = useCallback(() => {
    const spacesCopy = [...spaces];
    
    const sortBy = searchParams.sortBy || 'distance';
    switch (sortBy) {
      case 'price':
        return spacesCopy.sort((a, b) => 
          (parseInt(a.basePricePerDay || '0') - parseInt(b.basePricePerDay || '0'))
        );
      case 'capacity':
        return spacesCopy.sort((a, b) => 
          (b.capacityMax || 0) - (a.capacityMax || 0)
        );
      case 'rating':
        return spacesCopy.sort((a, b) => 
          (b.rating || 0) - (a.rating || 0)
        );
      case 'distance':
      default:
        return spacesCopy.sort((a, b) => {
          const distA = calculateDistance(a.lat || null, a.lng || null);
          const distB = calculateDistance(b.lat || null, b.lng || null);
          return distA - distB;
        });
    }
  }, [spaces, searchParams.sortBy, calculateDistance]);

  // Manipuladores
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const locationName = suggestion.district || suggestion.name;
    setLocationQuery(locationName);
    setSearchParams(prev => ({
      ...prev,
      locality: locationName,
      province: suggestion.province
    }));
    setLocationSuggestions([]);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchParams.locality) params.set('locality', searchParams.locality);
    if (searchParams.province) params.set('province', searchParams.province || '');
    if (searchParams.startDate) params.set('startDate', searchParams.startDate);
    if (searchParams.endDate) params.set('endDate', searchParams.endDate || '');
    if (searchParams.capacity) params.set('capacity', searchParams.capacity.toString());
    if (searchParams.eventType) params.set('eventType', searchParams.eventType || '');
    if (searchParams.maxPricePerDay) params.set('maxPricePerDay', searchParams.maxPricePerDay.toString());
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
    if (searchParams.page) params.set('page', searchParams.page.toString());
    if (searchParams.radius) params.set('radius', searchParams.radius.toString());
    if (searchParams.amenities?.length) {
      params.set('amenities', searchParams.amenities.join(','));
    }
    
    setLocation(`/event-spaces/search?${params.toString()}`);
    refetch();
  };

  const handleResetFilters = () => {
    setSearchParams({
      locality: searchParams.locality,
      province: searchParams.province,
      startDate: new Date().toISOString().split('T')[0],
      capacity: 50,
      eventType: '',
      maxPricePerDay: 50000,
      sortBy: 'distance',
      page: 1,
      radius: 50,
      amenities: [],
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eventTypeOptions = [
    { id: 'conference', label: 'Conferência', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'wedding', label: 'Casamento', icon: <Heart className="w-4 h-4" /> },
    { id: 'party', label: 'Festa', icon: <PartyPopper className="w-4 h-4" /> },
    { id: 'concert', label: 'Concerto', icon: <Music className="w-4 h-4" /> },
    { id: 'seminar', label: 'Seminário', icon: <Mic className="w-4 h-4" /> },
    { id: 'exhibition', label: 'Exposição', icon: '🎨' },
    { id: 'corporate', label: 'Corporativo', icon: '🏢' },
    { id: 'social', label: 'Social', icon: '🎉' },
  ];

  const amenitiesOptions = [
    { id: 'catering', label: 'Catering', icon: '🍽️' },
    { id: 'audio', label: 'Sistema de áudio', icon: '🔊' },
    { id: 'projector', label: 'Projetor', icon: '📽️' },
    { id: 'stage', label: 'Palco', icon: '🎭' },
    { id: 'parking', label: 'Estacionamento', icon: '🅿️' },
    { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
    { id: 'ac', label: 'Ar condicionado', icon: '❄️' },
    { id: 'security', label: 'Segurança', icon: '👮' },
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
          className={currentPage === i ? "bg-purple-600 hover:bg-purple-700" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    return pages;
  };

  // Paginar espaços
  const paginatedSpaces = React.useMemo(() => {
    const startIndex = (currentPage - 1) * 9;
    return sortedSpaces().slice(startIndex, startIndex + 9);
  }, [sortedSpaces, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header com busca */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Encontre Espaços para Eventos</h1>
              <p className="text-purple-100 mt-2">
                {totalResults > 0 
                  ? `${totalResults} espaços encontrados` 
                  : 'Busque espaços perfeitos para seu evento'}
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
                      placeholder="Onde será o evento?"
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
                            <div className="font-medium text-gray-900">
                              {suggestion.district || suggestion.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {suggestion.province || 'Moçambique'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Data */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Data do evento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                      type="date"
                      className="pl-10 bg-white/20 border-white/30 text-white"
                      value={searchParams.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Capacidade */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Capacidade</Label>
                  <Select
                    value={searchParams.capacity?.toString() || "50"}
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, capacity: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-white/20 border-white/30 text-white">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Número de pessoas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Até 10 pessoas</SelectItem>
                      <SelectItem value="50">Até 50 pessoas</SelectItem>
                      <SelectItem value="100">Até 100 pessoas</SelectItem>
                      <SelectItem value="200">Até 200 pessoas</SelectItem>
                      <SelectItem value="500">Até 500 pessoas</SelectItem>
                      <SelectItem value="1000">Mais de 500 pessoas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão de busca */}
                <div className="flex items-end">
                  <Button 
                    className="w-full bg-white text-purple-600 hover:bg-gray-100 h-10 font-medium"
                    onClick={handleSearch}
                    disabled={isLoading || !locationQuery}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading ? 'Buscando...' : 'Buscar Espaços'}
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

                  {/* Tipo de evento */}
                  <div>
                    <Label className="mb-4 block">Tipo de evento</Label>
                    <div className="space-y-3">
                      {eventTypeOptions.map((type) => (
                        <div key={type.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`type-${type.id}`}
                            checked={searchParams.eventType === type.id}
                            onCheckedChange={(checked) => {
                              setSearchParams(prev => ({ 
                                ...prev, 
                                eventType: checked ? type.id : '' 
                              }));
                            }}
                          />
                          <Label htmlFor={`type-${type.id}`} className="flex items-center gap-2 cursor-pointer">
                            {type.icon}
                            <span>{type.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Preço máximo por dia */}
                  <div>
                    <Label className="mb-4 block">Preço máximo por dia (MZN)</Label>
                    <div className="mb-4">
                      <Input
                        type="number"
                        min="0"
                        max="200000"
                        value={searchParams.maxPricePerDay}
                        onChange={(e) => setSearchParams(prev => ({ 
                          ...prev, 
                          maxPricePerDay: parseInt(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <Slider
                      value={[searchParams.maxPricePerDay || 50000]}
                      min={1000}
                      max={200000}
                      step={5000}
                      onValueChange={([value]) => setSearchParams(prev => ({ 
                        ...prev, 
                        maxPricePerDay: value 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1.000</span>
                      <span>200.000</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Amenidades */}
                  <div>
                    <Label className="mb-4 block">Amenidades</Label>
                    <div className="space-y-3">
                      {amenitiesOptions.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-3">
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
                          <Label htmlFor={`amenity-${amenity.id}`} className="flex items-center gap-2 cursor-pointer">
                            <span className="text-lg">{amenity.icon}</span>
                            <span>{amenity.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
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
                    {isLoading ? 'Buscando espaços...' : `Espaços encontrados (${totalResults})`}
                  </h2>
                  {searchParams.locality && (
                    <p className="text-gray-600 mt-1">
                      em {searchParams.locality}
                      {searchParams.province && `, ${searchParams.province}`}
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
                      <SelectItem value="capacity">Maior capacidade</SelectItem>
                      <SelectItem value="rating">Melhor classificação</SelectItem>
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
                        <h3 className="font-semibold text-red-800">Erro ao carregar espaços</h3>
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
              ) : spaces.length === 0 && !error ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">🎪</div>
                    <h3 className="text-xl font-semibold mb-2">Nenhum espaço encontrado</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      {searchParams.locality 
                        ? `Não encontramos espaços em "${searchParams.locality}". Tente buscar em outra localização ou ajustar seus filtros.`
                        : 'Digite uma localização para buscar espaços disponíveis.'
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
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <div>
                          <span className="font-medium text-purple-800">
                            Buscando em: {searchParams.locality || 'Moçambique'}
                            {searchParams.province && `, ${searchParams.province}`}
                          </span>
                          {searchParams.startDate && (
                            <div className="text-sm text-purple-700 mt-1">
                              Data: {searchParams.startDate}
                              {searchParams.capacity && ` • Capacidade: até ${searchParams.capacity} pessoas`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {searchParams.radius && (
                          <Badge variant="outline" className="border-purple-300 text-purple-700">
                            Raio: {searchParams.radius}km
                          </Badge>
                        )}
                        {searchParams.eventType && (
                          <Badge variant="outline" className="border-pink-300 text-pink-700">
                            {
                              eventTypeOptions.find(t => t.id === searchParams.eventType)?.label || 
                              searchParams.eventType
                            }
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-purple-700 mt-3">
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

                  {/* Lista de espaços */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedSpaces.map((space) => {
                      const distance = calculateDistance(space.lat || null, space.lng || null);
                      const distanceColor = distance <= 10 ? 'bg-green-100 text-green-800 border-green-300' : 
                                          distance <= 30 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                          'bg-red-100 text-red-800 border-red-300';
                      
                      return (
                        <div key={space.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
                          {/* Badge de distância */}
                          <div className="absolute top-3 right-3 z-10">
                            <Badge className={`${distanceColor}`}>
                              {distance.toFixed(1)} km
                            </Badge>
                          </div>

                          <EventSpaceCard
                            space={space}
                            showPrice={true}
                            onBook={() => {
                              toast({
                                title: "Reserva iniciada",
                                description: "Redirecionando para página de reserva...",
                              });
                              setLocation(`/event-spaces/${space.id}/book?date=${searchParams.startDate}&capacity=${searchParams.capacity}`);
                            }}
                            showHotelInfo={true}
                            className="hover:shadow-xl transition-all duration-300"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Paginação */}
                  {totalResults > 9 && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {Math.min(9, paginatedSpaces.length)} de {totalResults} espaços
                        {currentPage > 1 && ` (Página ${currentPage} de ${totalPages})`}
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
            <Card className="mt-8 bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Building className="w-5 h-5" />
                  Por que reservar conosco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">🏆</div>
                    <h4 className="font-semibold text-purple-800 mb-2">Espaços verificados</h4>
                    <p className="text-sm text-purple-700">
                      Todos os espaços são inspecionados e aprovados por nossa equipe para garantir qualidade.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">💬</div>
                    <h4 className="font-semibold text-purple-800 mb-2">Suporte dedicado</h4>
                    <p className="text-sm text-purple-700">
                      Nossa equipe está disponível para ajudar em todo o processo de reserva e planejamento.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">🛡️</div>
                    <h4 className="font-semibold text-purple-800 mb-2">Proteção total</h4>
                    <p className="text-sm text-purple-700">
                      Sua reserva está protegida com nosso sistema de garantia e políticas transparentes.
                    </p>
                  </div>
                </div>
                
                {/* Informações extras */}
                <div className="mt-6 pt-6 border-t border-purple-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-700">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>Preços transparentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Disponibilidade em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Pagamento seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>Avaliações verificadas</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do espaço */}
      {selectedSpaceId && (
        <EventSpaceDetailModal
          spaceId={selectedSpaceId}
          isOpen={!!selectedSpaceId}
          onClose={() => setSelectedSpaceId(null)}
          date={searchParams.startDate}
          capacity={searchParams.capacity}
        />
      )}
    </div>
  );
}