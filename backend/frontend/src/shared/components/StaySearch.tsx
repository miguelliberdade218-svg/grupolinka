import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Star, Search, Home, Hotel, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiService from '@/services/api';
import { Hotel as HotelType } from '@/types/index';

const staySearchSchema = z.object({
  location: z.string().min(1, "Local é obrigatório"),
  checkIn: z.string().min(1, "Data de entrada é obrigatória"),
  checkOut: z.string().min(1, "Data de saída é obrigatória"),
  guests: z.number().min(1, "Número de hóspedes é obrigatório").max(16, "Máximo 16 hóspedes"),
}).refine((data) => {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  return checkOut > checkIn;
}, {
  message: "Data de saída deve ser posterior à data de entrada",
  path: ["checkOut"],
});

type StaySearchForm = z.infer<typeof staySearchSchema>;

export default function StaySearch() {
  const navigate = useNavigate();
  const [selectedAccommodationType, setSelectedAccommodationType] = useState("todos");
  const [searchResults, setSearchResults] = useState<HotelType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const form = useForm<StaySearchForm>({
    resolver: zodResolver(staySearchSchema),
    defaultValues: {
      location: "",
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      guests: 2,
    },
  });

  // ✅ FUNÇÃO DE BUSCA CORRIGIDA - busca real na API
  const handleSubmit = async (data: StaySearchForm) => {
    console.log('🎯 [HOMEPAGE] Iniciando busca por:', data.location);
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setHasSearched(true);

    try {
      console.log('📡 [HOMEPAGE] Chamando apiService.searchHotels...');
      
      const result = await apiService.searchHotels({
        location: data.location,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
      });

      console.log('✅ [HOMEPAGE] Resposta COMPLETA:', result);

      // ✅ CORREÇÃO 1: Extração correta dos dados (result.data já é Hotel[])
      const hotels: HotelType[] = Array.isArray(result.data) 
        ? result.data 
        : []; // Se não for array, retorna vazio

      console.log(`🏨 [RESULTADO] ${hotels.length} hotéis extraídos`);

      // ✅ DEBUG: Mostrar cada hotel no console
      hotels.forEach((hotel: HotelType, index: number) => {
        console.log(`🏨 ${index + 1}. ${hotel.hotel_name} | ${hotel.hotel_id}`);
      });

      setSearchResults(hotels);

    } catch (err) {
      console.error('❌ [HOMEPAGE] Erro:', err);
      
      // ✅ CORREÇÃO 6: Mensagens de erro mais amigáveis
      if (err instanceof Error) {
        if (err.message.includes('404') || err.message.includes('fetch')) {
          setSearchError('Nenhum hotel encontrado para esta localização. Tente buscar por Maputo, Tofo ou Costa do Sol.');
        } else {
          setSearchError('Falha ao buscar hotéis. Verifique sua conexão e tente novamente.');
        }
      } else {
        setSearchError('Erro desconhecido. Tente novamente.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // ✅ FUNÇÃO PARA VER DETALHES DO HOTEL
  const handleSelectHotel = (hotel: HotelType) => {
    console.log('🔍 Selecionando hotel:', hotel.hotel_name);
    // Redirecionar para página de detalhes do hotel
    navigate(`/hotels/${hotel.hotel_id}`, {
      state: {
        hotel,
        searchParams: form.getValues()
      }
    });
  };

  // ✅ CORREÇÃO 2: Filtro por tipo de hospedagem (usando propriedades disponíveis)
  const filteredResults = searchResults.filter((hotel: HotelType) => {
    if (selectedAccommodationType === 'todos') return true;
    
    // Determinar tipo baseado no nome do quarto ou nome do hotel
    const roomType = hotel.available_room_types?.[0]?.room_type_name?.toLowerCase() || '';
    const hotelName = hotel.hotel_name?.toLowerCase() || '';
    
    if (selectedAccommodationType === 'hoteis') {
      return roomType.includes('hotel') || 
             hotelName.includes('hotel') || 
             hotelName.includes('resort') ||
             hotelName.includes('suite') ||
             hotelName.includes('pousada') ||
             roomType.includes('suite') ||
             roomType.includes('resort');
    }
    
    if (selectedAccommodationType === 'particulares') {
      return roomType.includes('casa') || 
             roomType.includes('apartamento') ||
             roomType.includes('apartment') ||
             roomType.includes('house') ||
             hotelName.includes('casa') ||
             hotelName.includes('apartamento') ||
             hotelName.includes('apartment') ||
             hotelName.includes('house');
    }
    
    return true;
  });

  const formatPrice = (price?: number) => {
    if (!price) return 'Sob consulta';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(price);
  };

  // ✅ CORREÇÃO: Função de rating que usa match_score como fallback
  const calculateRating = (hotel: HotelType): number => {
    // Se houver match_score, converter para rating 1-5
    if (hotel.match_score !== undefined) {
      return 3 + (hotel.match_score * 2); // Converter 0-10 para 3-5
    }
    
    // Fallback baseado no preço
    const price = hotel.min_price_per_night || 0;
    if (price >= 5000) return 4.5;
    if (price >= 2000) return 4.0;
    if (price >= 1000) return 3.5;
    return 3.0;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  // ✅ Resetar busca se usuário limpar localização
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("location", value);
    
    // ✅ CORREÇÃO 6: Resetar busca se localização for limpa
    if (!value.trim() && hasSearched) {
      setHasSearched(false);
      setSearchResults([]);
      setSearchError(null);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Encontre sua próxima hospedagem</h2>
      
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* ✅ CORREÇÃO 3: Formulário simplificado com register */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-2">
              Onde
            </Label>
            <Input
              id="location"
              placeholder="Digite Tofo, Maputo, Costa do Sol..."
              {...form.register("location")}
              onChange={handleLocationChange}
              className="w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="input-search-location"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>
          
          <div className="md:col-span-1">
            <Label htmlFor="checkIn" className="block text-sm font-medium text-gray-600 mb-2">
              Entrada
            </Label>
            <Input
              id="checkIn"
              type="date"
              data-testid="input-checkin-date"
              {...form.register("checkIn")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.checkIn && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.checkIn.message}</p>
            )}
          </div>
          
          <div className="md:col-span-1">
            <Label htmlFor="checkOut" className="block text-sm font-medium text-gray-600 mb-2">
              Saída
            </Label>
            <Input
              id="checkOut"
              type="date"
              data-testid="input-checkout-date"
              {...form.register("checkOut")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {form.formState.errors.checkOut && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.checkOut.message}</p>
            )}
          </div>
          
          <div className="md:col-span-1">
            <Label htmlFor="guests" className="block text-sm font-medium text-gray-600 mb-2">
              Hóspedes
            </Label>
            <Select
              value={String(form.watch("guests"))}
              onValueChange={(value) => form.setValue("guests", parseInt(value))}
            >
              <SelectTrigger data-testid="select-guests">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num} {num === 1 ? 'hóspede' : 'hóspedes'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.guests && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.guests.message}</p>
            )}
          </div>
          
          <div className="md:col-span-1 flex items-end">
            <Button
              type="submit"
              data-testid="button-search-stays"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              disabled={isSearching}
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Buscando...' : 'Pesquisar'}
            </Button>
          </div>
        </form>

        {/* ✅ FEEDBACK VISUAL DA BUSCA */}
        {isSearching && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-blue-700 font-medium">
                Buscando acomodações para "{form.watch("location")}"...
              </p>
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 font-medium">
              ❌ {searchError}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Dica: Tente buscar por "Maputo", "Tofo" ou "Costa do Sol"
            </p>
          </div>
        )}

        {/* ✅ RESULTADOS DA BUSCA */}
        {hasSearched && !isSearching && (
          <div className="mt-8">
            {filteredResults.length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {filteredResults.length} Acomodações Encontradas
                  </h3>
                  <Badge variant="secondary" className="text-green-700 bg-green-100 text-lg py-2 px-4">
                    {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-6">
                  {filteredResults.map((hotel: HotelType) => {
                    const rating = calculateRating(hotel);
                    return (
                      <Card key={hotel.hotel_id} className="p-6 hover:shadow-lg transition-shadow border-2 border-green-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="text-xl font-semibold text-green-700 mb-2">
                              {hotel.hotel_name}
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                              {/* ✅ CORREÇÃO 7: Badge padronizado */}
                              <Badge variant="outline" className="py-1 px-3">
                                {hotel.available_room_types?.[0]?.room_type_name || 'Hotel'}
                              </Badge>
                              <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">
                                  {hotel.address}
                                  {hotel.locality && `, ${hotel.locality}`}
                                  {hotel.province && `, ${hotel.province}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mb-3">
                              {renderStars(rating)}
                              {/* ✅ CORREÇÃO 5: Rating calculado, não da propriedade */}
                              <span className="text-sm text-gray-600 ml-1">
                                ({rating.toFixed(1)})
                              </span>
                            </div>
                            {hotel.description && (
                              <p className="text-gray-600 text-sm">
                                {hotel.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-center space-y-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">Disponibilidade</div>
                              {/* ✅ CORREÇÃO: Usar total_available_rooms */}
                              {(hotel.total_available_rooms ?? 0) > 0 ? (
                                <Badge className="bg-green-100 text-green-700 text-base py-2 px-4">
                                  Disponível ({hotel.total_available_rooms} quartos)
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 text-base py-2 px-4">
                                  Indisponível
                                </Badge>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {formatPrice(hotel.min_price_per_night)}
                            </div>
                            <div className="text-sm text-gray-500">por noite</div>
                            {/* ✅ CORREÇÃO 4: Botão "Ver Detalhes" funcional */}
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleSelectHotel(hotel)}
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              !searchError && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏨</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhuma acomodação encontrada
                  </h3>
                  <p className="text-gray-500">
                    Tente buscar por: <strong>Tofo</strong>, <strong>Maputo</strong>, <strong>Costa do Sol</strong>
                  </p>
                  {searchResults.length > 0 && filteredResults.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">
                      (Filtro ativo: {selectedAccommodationType === 'hoteis' ? 'Hotéis' : 'Particulares'})
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* ✅ Accommodation Categories */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Tipo de Hospedagem</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setSelectedAccommodationType("todos")}
              className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                selectedAccommodationType === "todos" 
                  ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500/30"
              }`}
              data-testid="accommodation-todos"
            >
              <div className="text-center">
                <div className={`text-3xl mb-3 ${
                  selectedAccommodationType === "todos" ? "text-white" : "text-blue-600"
                }`}>
                  <Building className="w-8 h-8 mx-auto" />
                </div>
                <h4 className={`font-semibold text-lg ${
                  selectedAccommodationType === "todos" ? "text-white" : "text-gray-900"
                }`}>Todos</h4>
                <p className={`text-sm mt-2 ${
                  selectedAccommodationType === "todos" ? "text-white/80" : "text-gray-600"
                }`}>Todas as opções</p>
              </div>
            </div>

            <div 
              onClick={() => setSelectedAccommodationType("hoteis")}
              className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                selectedAccommodationType === "hoteis" 
                  ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500/30"
              }`}
              data-testid="accommodation-hoteis"
            >
              <div className="text-center">
                <div className={`text-3xl mb-3 ${
                  selectedAccommodationType === "hoteis" ? "text-white" : "text-blue-600"
                }`}>
                  <Hotel className="w-8 h-8 mx-auto" />
                </div>
                <h4 className={`font-semibold text-lg ${
                  selectedAccommodationType === "hoteis" ? "text-white" : "text-gray-900"
                }`}>Hotéis</h4>
                <p className={`text-sm mt-2 ${
                  selectedAccommodationType === "hoteis" ? "text-white/80" : "text-gray-600"
                }`}>Hotéis e resorts</p>
              </div>
            </div>

            <div 
              onClick={() => setSelectedAccommodationType("particulares")}
              className={`cursor-pointer rounded-xl p-6 transition-all duration-200 ${
                selectedAccommodationType === "particulares" 
                  ? "bg-blue-600 text-white shadow-lg transform scale-105" 
                  : "bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-500/30"
              }`}
              data-testid="accommodation-particulares"
            >
              <div className="text-center">
                <div className={`text-3xl mb-3 ${
                  selectedAccommodationType === "particulares" ? "text-white" : "text-blue-600"
                }`}>
                  <Home className="w-8 h-8 mx-auto" />
                </div>
                <h4 className={`font-semibold text-lg ${
                  selectedAccommodationType === "particulares" ? "text-white" : "text-gray-900"
                }`}>Particulares</h4>
                <p className={`text-sm mt-2 ${
                  selectedAccommodationType === "particulares" ? "text-white/80" : "text-gray-600"
                }`}>Casas e apartamentos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}