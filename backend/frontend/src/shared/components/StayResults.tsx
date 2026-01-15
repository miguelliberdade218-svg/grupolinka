import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Hotel as HotelType } from '@/types/index';
import { HotelCard } from '@/components/HotelCard';
import Map from "./Map";
import BookingModal from "./BookingModal";
import PreBookingChat from "./PreBookingChat";
import UserRatings from "./UserRatings";
import { Slider } from "@/shared/components/ui/slider";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { formatPriceStringAsMzn } from "@/shared/lib/currency";
import apiService from '@/services/api';

interface StayResultsProps {
  searchParams: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
}

// ✅ Interface para a resposta da API - usando tipos corretos
interface ApiResponse {
  success: boolean;
  data: HotelType[];
  count: number;
}

export default function StayResults({ searchParams }: StayResultsProps) {
  const [selectedAccommodation, setSelectedAccommodation] = useState<HotelType | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [priceRange, setPriceRange] = useState([50, 500]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

  // ✅ BUSCA ATUALIZADA: usando apiService e tipos corretos
  const { data: accommodationsResponse, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["/api/hotels", searchParams.location, searchParams.checkIn, searchParams.checkOut, searchParams.guests],
    queryFn: async () => {
      if (!searchParams.location) {
        return { success: false, data: [], count: 0 };
      }

      // ✅ Usar apiService em vez de fetch manual
      return apiService.searchHotels({
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
      });
    },
    enabled: !!searchParams.location?.trim(),
    retry: 1,
  });

  // ✅ EXTRAIR ACOMODAÇÕES DA RESPOSTA CORRETA
  const accommodations = accommodationsResponse?.data || [];

  const filteredAccommodations = accommodations.filter((hotel: HotelType) => {
    const price = hotel.min_price_per_night || 0;
    const matchesMinPrice = price >= priceRange[0];
    const matchesMaxPrice = price <= priceRange[1];
    
    // Verificar tipo de propriedade (usando tipo do primeiro quarto ou hotel_type)
    const propertyType = hotel.available_room_types?.[0]?.room_type_name || 'Hotel';
    const matchesType = propertyTypes.length === 0 || propertyTypes.includes(propertyType);
    
    return matchesMinPrice && matchesMaxPrice && matchesType;
  });

  const handleBookStay = (hotel: HotelType) => {
    setSelectedAccommodation(hotel);
    setShowBookingModal(true);
  };

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    setPropertyTypes(prev => 
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  };

  // ✅ CORREÇÃO: Função auxiliar para formatar números como string para formatPriceStringAsMzn
  const formatPrice = (price?: number): string => {
    if (!price) return '0';
    return price.toString();
  };

  // ✅ Calcular estatísticas para debug
  const calculateStats = () => {
    const prices = accommodations.map(h => h.min_price_per_night || 0);
    const avgPrice = prices.length > 0 
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices.filter(p => p > 0)) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return { avgPrice, minPrice, maxPrice };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-dark mb-2">Erro ao carregar acomodações</h3>
        <p className="text-gray-medium">Tente novamente em alguns instantes</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Recarregar
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* ✅ DEBUG INFO ATUALIZADA */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div><strong>🔍 Localização:</strong> {searchParams.location}</div>
          <div><strong>🏨 Encontrados:</strong> {accommodations.length} hotéis</div>
          <div><strong>📊 Filtrados:</strong> {filteredAccommodations.length} resultados</div>
          <div><strong>💰 Preço médio:</strong> {formatPriceStringAsMzn(formatPrice(stats.avgPrice))}</div>
        </div>
        {accommodations.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            <strong>🎯 Status:</strong> {isLoading ? '🔄 Carregando...' : '✅ Pronto'} | 
            <strong> Filtro preço:</strong> {formatPriceStringAsMzn(formatPrice(priceRange[0]))} - {formatPriceStringAsMzn(formatPrice(priceRange[1]))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ✅ ATUALIZADO: Usando HotelCard em vez de card manual */}
        <div className="lg:col-span-2">
          {filteredAccommodations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-dark mb-2">
                {accommodations.length === 0 ? 'Nenhuma acomodação encontrada' : 'Nenhum resultado para os filtros'}
              </h3>
              <p className="text-gray-medium">
                {accommodations.length === 0 
                  ? 'Tente buscar por uma localização diferente' 
                  : 'Tente ajustar seus filtros'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAccommodations.map((hotel: HotelType) => (
                <div key={hotel.hotel_id} data-testid={`accommodation-card-${hotel.hotel_id}`}>
                  <HotelCard 
                    hotel={hotel}
                    onSelect={handleBookStay}
                  />
                  
                  {/* ✅ AÇÕES ADICIONAIS ABAIXO DO CARD */}
                  <div className="flex gap-2 mt-4 bg-white p-3 rounded-lg border border-gray-100">
                    <PreBookingChat
                      recipientId={hotel.hotel_id}
                      recipientName="Anfitrião"
                      recipientType="host"
                      recipientAvatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
                      recipientRating={4.5}
                      isOnline={true}
                      responseTime="~30 min"
                      serviceDetails={{
                        type: 'stay',
                        location: hotel.address,
                        date: searchParams.checkIn,
                        price: formatPriceStringAsMzn(formatPrice(hotel.min_price_per_night))
                      }}
                    />
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Avaliações
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Avaliações do Anfitrião</DialogTitle>
                        </DialogHeader>
                        <UserRatings 
                          userId={hotel.hotel_id}
                          userType="host"
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleBookStay(hotel); 
                      }}
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid={`book-stay-${hotel.hotel_id}`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Reservar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ ATUALIZADO: Map Sidebar com dados corretos */}
        <div className="space-y-6">
          <Map
            type="accommodation"
            location={searchParams.location}
            markers={filteredAccommodations.map((hotel: HotelType) => ({
              lat: typeof hotel.lat === 'string' ? parseFloat(hotel.lat) : (hotel.lat || -25.9692),
              lng: typeof hotel.lng === 'string' ? parseFloat(hotel.lng) : (hotel.lng || 32.5732),
              popup: `${hotel.hotel_name} - ${formatPriceStringAsMzn(formatPrice(hotel.min_price_per_night))}/noite`,
              hotelId: hotel.hotel_id,
            }))}
          />

          {/* ✅ ATUALIZADO: Filtros com propriedades corretas */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-dark mb-3">Filtros</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-medium mb-2">
                  Faixa de preço ({formatPriceStringAsMzn(formatPrice(priceRange[0]))} - {formatPriceStringAsMzn(formatPrice(priceRange[1]))})
                </label>
                <Slider
                  data-testid="price-range-slider"
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={stats.maxPrice || 500}
                  min={stats.minPrice || 50}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-medium mt-1">
                  <span>{formatPriceStringAsMzn(formatPrice(stats.minPrice || 50))}</span>
                  <span>{formatPriceStringAsMzn(formatPrice(stats.maxPrice || 500))}+</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-medium mb-2">Tipo de propriedade</label>
                <div className="space-y-2">
                  {["Hotel", "Apartment", "House"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        data-testid={`filter-${type.toLowerCase()}`}
                        id={type}
                        checked={propertyTypes.includes(type)}
                        onCheckedChange={(checked) => 
                          handlePropertyTypeChange(type, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={type}
                        className="text-sm cursor-pointer"
                      >
                        {type === "Hotel" ? "Hotéis" : type === "Apartment" ? "Apartamentos" : "Casas"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* ✅ NOVO: Filtro por disponibilidade */}
              <div>
                <label className="block text-sm text-gray-medium mb-2">Disponibilidade</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      data-testid="filter-available"
                      id="available"
                      checked={true}
                      disabled
                    />
                    <label
                      htmlFor="available"
                      className="text-sm cursor-pointer"
                    >
                      Mostrar apenas disponíveis
                    </label>
                  </div>
                </div>
              </div>
              
              {/* ✅ NOVO: Estatísticas rápidas */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Estatísticas</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Mais barato</div>
                    <div>{formatPriceStringAsMzn(formatPrice(stats.minPrice))}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">Mais caro</div>
                    <div>{formatPriceStringAsMzn(formatPrice(stats.maxPrice))}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedAccommodation && (
        <BookingModal
          type="stay"
          item={selectedAccommodation}
          searchParams={searchParams}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedAccommodation(null);
          }}
        />
      )}
    </>
  );
}