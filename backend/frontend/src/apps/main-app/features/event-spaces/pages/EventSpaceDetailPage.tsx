import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPin, CheckCircle2, Star, Users, Ruler, Calendar, DollarSign } from 'lucide-react';
import { useEventSpaceDetail, useEventSpaceData, useEventSpaceReviews } from '../hooks/useEventSpacesComplete';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatPrice } from '@/shared/utils/formatters';

// Defina tipos locais para as propriedades que espera
interface EventSpaceImages {
  id: string;
  url: string;
  isPrimary: boolean;
  description?: string;
}

interface EventSpaceAmenity {
  id: string;
  name: string;
  description?: string;
}

interface EventSpaceDetails {
  id: string;
  name: string;
  description?: string;
  basePricePerDay: string;
  weekendSurchargePercent: number;
  securityDeposit: string;
  capacityMin: number;
  capacityMax: number;
  areaSqm?: number;
  spaceType: string;
  location?: string;
  locality?: string;
  province?: string;
  rating?: number;
  alcoholAllowed: boolean;
  insuranceRequired: boolean;
  approvalRequired: boolean;
  noiseRestriction?: string;
  allowedEventTypes?: string[];
  naturalLight: boolean;
  hasStage: boolean;
  loadingAccess: boolean;
  isActive: boolean;
  offersCatering: boolean;
  cateringDiscountPercent: number;
  availableForImmediateBooking?: boolean;
  
  // Propriedades que podem vir como arrays ou objetos
  images?: EventSpaceImages[] | string[];
  amenities?: EventSpaceAmenity[] | string[];
  equipment?: any; // Pode ser array, objeto ou string
}

export const EventSpaceDetailPage: React.FC = () => {
  const { id: spaceId } = useParams<{ id: string }>();
  
  const { 
    data: spaceDetailsResponse, 
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useEventSpaceDetail(spaceId);
  
  const { 
    data: spaceData, 
    isLoading: isLoadingData 
  } = useEventSpaceData(spaceId);
  
  const { 
    data: reviewsResponse,
    isLoading: isLoadingReviews
  } = useEventSpaceReviews(spaceId, 10, 0, 0, 'recent');

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Extrair dados
  const spaceDetails = spaceDetailsResponse;
  const space = spaceData || spaceDetailsResponse?.space;
  const hotel = spaceDetailsResponse?.hotel;
  const reviews = reviewsResponse?.data || [];

  const isLoading = isLoadingDetails || isLoadingData;
  const error = detailsError;

  // ============================================
  // ✅ CORREÇÃO 1: Type Guards
  // ============================================
  
  const isEventSpaceData = (obj: any): obj is any => {
    return obj && Array.isArray(obj.amenities);
  };

  const hasEquipmentAmenities = (obj: any): boolean => {
    return obj?.equipment && Array.isArray(obj.equipment.amenities);
  };

  // ============================================
  // ✅ CORREÇÃO 2: getBasePrice() - COMPLETA
  // ============================================
  const getBasePrice = (): number => {
    // 0. PRIORIDADE MÁXIMA: price_per_day (campo REAL do backend)
    if ((spaceDetails as any)?.price_per_day) {
      const price = parseFloat((spaceDetails as any).price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 0b. Tentar space.price_per_day
    if ((space as any)?.price_per_day) {
      const price = parseFloat((space as any).price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 1. Tentar spaceDetails.base_price_per_day
    if ((spaceDetails as any)?.base_price_per_day) {
      const price = parseFloat((spaceDetails as any).base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 2. Tentar space.basePricePerDay
    if ((space as any)?.basePricePerDay) {
      const price = parseFloat((space as any).basePricePerDay);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 3. Tentar space.base_price_per_day
    if ((space as any)?.base_price_per_day) {
      const price = parseFloat((space as any).base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    // 4. Tentar spaceDetailsResponse?.data?.base_price_per_day
    if ((spaceDetailsResponse as any)?.data?.base_price_per_day) {
      const price = parseFloat((spaceDetailsResponse as any).data.base_price_per_day);
      if (!isNaN(price) && price > 0) return price;
    }
    
    return 0;
  };

  // ============================================
  // ✅ CORREÇÃO 3: getWeekendSurcharge()
  // ============================================
  const getWeekendSurcharge = (): number => {
    // 1. Tentar spaceDetails.weekend_surcharge_percent
    if ((spaceDetails as any)?.weekend_surcharge_percent !== undefined) {
      return Number((spaceDetails as any).weekend_surcharge_percent);
    }
    
    // 2. Tentar space.weekendSurchargePercent
    if ((space as any)?.weekendSurchargePercent !== undefined) {
      return Number((space as any).weekendSurchargePercent);
    }
    
    // 3. Tentar space.weekend_surcharge_percent
    if ((space as any)?.weekend_surcharge_percent !== undefined) {
      return Number((space as any).weekend_surcharge_percent);
    }
    
    return 0;
  };

  // ============================================
  // ✅ CORREÇÃO 4: getSecurityDeposit()
  // ============================================
  const getSecurityDeposit = (): number => {
    // 1. Tentar spaceDetails.security_deposit
    if ((spaceDetails as any)?.security_deposit) {
      const deposit = parseFloat((spaceDetails as any).security_deposit);
      if (!isNaN(deposit) && deposit > 0) return deposit;
    }
    
    // 2. Tentar space.securityDeposit
    if ((space as any)?.securityDeposit) {
      const deposit = parseFloat((space as any).securityDeposit);
      if (!isNaN(deposit) && deposit > 0) return deposit;
    }
    
    // 3. Tentar space.security_deposit
    if ((space as any)?.security_deposit) {
      const deposit = parseFloat((space as any).security_deposit);
      if (!isNaN(deposit) && deposit > 0) return deposit;
    }
    
    return 0;
  };

  // ============================================
  // ✅ CORREÇÃO 5: getLocation() - COMPLETA
  // ============================================
  const getLocation = (): string => {
    // 1. Tentar localização direta do espaço (prioridade máxima)
    if ((space as any)?.location) {
      return (space as any).location;
    }
    
    // 2. Tentar localidade + província do espaço
    if ((space as any)?.locality && (space as any)?.province) {
      return `${(space as any).locality}, ${(space as any).province}`;
    }
    
    // 3. Tentar localização do hotel
    if (hotel?.locality && hotel?.province) {
      return `${hotel.locality}, ${hotel.province}`;
    }
    
    // 4. Tentar nome do hotel + cidade
    if (hotel?.name && hotel?.locality) {
      return `${hotel.name}, ${hotel.locality}`;
    }
    
    // 5. Tentar apenas localidade do hotel
    if (hotel?.locality) {
      return hotel.locality;
    }
    
    // 6. Tentar apenas localidade do espaço
    if ((space as any)?.locality) {
      return (space as any).locality;
    }
    
    return 'Localização não disponível';
  };

  // ============================================
  // ✅ CORREÇÃO 6: getCapacity()
  // ============================================
  const getCapacity = (): { min: number; max: number } => {
    // Tentar extrair valores válidos
    const min = Number((space as any)?.capacityMin || (space as any)?.capacity_min || 0);
    const max = Number((space as any)?.capacityMax || (space as any)?.capacity_max || 0);
    
    // Se max for menor que min, usar max como padrão
    return { 
      min: min > 0 ? min : 0, 
      max: max > 0 ? max : min 
    };
  };

  // ============================================
  // ✅ CORREÇÃO 7: getImages() - MELHORADA
  // ============================================
  const getImages = (): string[] => {
    // 1. Tentar space.images
    if ((space as any)?.images) {
      if (Array.isArray((space as any).images)) {
        if (typeof (space as any).images[0] === 'string') {
          return (space as any).images as string[];
        }
        if ((space as any).images[0]?.url) {
          return (space as any).images.map((img: any) => img.url);
        }
      }
    }
    
    // 2. Tentar spaceDetails.images
    if ((spaceDetails as any)?.images) {
      if (Array.isArray((spaceDetails as any).images)) {
        if (typeof (spaceDetails as any).images[0] === 'string') {
          return (spaceDetails as any).images as string[];
        }
        if ((spaceDetails as any).images[0]?.url) {
          return (spaceDetails as any).images.map((img: any) => img.url);
        }
      }
    }
    
    // 3. Tentar spaceDetailsResponse?.data?.images
    if ((spaceDetailsResponse as any)?.data?.images) {
      if (Array.isArray((spaceDetailsResponse as any).data.images)) {
        if (typeof (spaceDetailsResponse as any).data.images[0] === 'string') {
          return (spaceDetailsResponse as any).data.images as string[];
        }
      }
    }
    
    // Fallback
    return ['https://via.placeholder.com/1200x400?text=Espaço+para+Eventos'];
  };

  // ============================================
  // ✅ CORREÇÃO 8: getAmenities() - COMPLETA (5 PRIORIDADES)
  // ============================================
  const getAmenities = (): string[] => {
    // 1. PRIMEIRA PRIORIDADE: spaceDetails.amenities
    if ((spaceDetails as any)?.amenities && Array.isArray((spaceDetails as any).amenities) && (spaceDetails as any).amenities.length > 0) {
      const amenities = (spaceDetails as any).amenities;
      if (typeof amenities[0] === 'string') {
        return amenities as string[];
      }
      if (amenities[0]?.name) {
        return amenities.map((a: any) => a.name);
      }
    }
    
    // 2. SEGUNDA PRIORIDADE: space.amenities
    if ((space as any)?.amenities && Array.isArray((space as any).amenities) && (space as any).amenities.length > 0) {
      const amenities = (space as any).amenities;
      if (typeof amenities[0] === 'string') {
        return amenities as string[];
      }
      if (amenities[0]?.name) {
        return amenities.map((a: any) => a.name);
      }
    }
    
    // 3. TERCEIRA PRIORIDADE: equipment.amenities
    if ((space as any)?.equipment?.amenities && Array.isArray((space as any).equipment.amenities) && (space as any).equipment.amenities.length > 0) {
      const equipmentAmenities = (space as any).equipment.amenities;
      if (typeof equipmentAmenities[0] === 'string') {
        return equipmentAmenities as string[];
      }
      if (equipmentAmenities[0]?.name) {
        return equipmentAmenities.map((a: any) => a.name);
      }
    }
    
    // 4. QUARTA PRIORIDADE: spaceDetailsResponse?.data?.amenities
    if ((spaceDetailsResponse as any)?.data?.amenities && Array.isArray((spaceDetailsResponse as any).data.amenities) && (spaceDetailsResponse as any).data.amenities.length > 0) {
      const amenities = (spaceDetailsResponse as any).data.amenities;
      if (typeof amenities[0] === 'string') {
        return amenities as string[];
      }
    }
    
    // 5. QUINTA PRIORIDADE: amenities_list
    if ((space as any)?.amenities_list && Array.isArray((space as any).amenities_list) && (space as any).amenities_list.length > 0) {
      return (space as any).amenities_list as string[];
    }
    
    return [];
  };

  // ============================================
  // ✅ CORREÇÃO 9: getEquipmentItems() - MELHORADA
  // ============================================
  const getEquipmentItems = (): string[] => {
    const equipment = (space as any)?.equipment || (spaceDetails as any)?.equipment;
    
    if (!equipment) return [];
    
    // Caso 1: Array de strings
    if (Array.isArray(equipment) && typeof equipment[0] === 'string') {
      return equipment as string[];
    }
    
    // Caso 2: Array de objetos com name
    if (Array.isArray(equipment) && equipment[0]?.name) {
      return equipment.map((item: any) => item.name);
    }
    
    // Caso 3: Objeto com propriedade items
    if (typeof equipment === 'object' && equipment.items && Array.isArray(equipment.items)) {
      return equipment.items.map((item: any) => 
        typeof item === 'string' ? item : item.name || JSON.stringify(item)
      );
    }
    
    // Caso 4: Objeto chave-valor
    if (typeof equipment === 'object' && !Array.isArray(equipment)) {
      return Object.entries(equipment)
        .filter(([_, value]) => Boolean(value))
        .map(([key, value]) => {
          if (typeof value === 'boolean') return key;
          if (typeof value === 'string') return `${key}: ${value}`;
          return `${key}: ${JSON.stringify(value)}`;
        });
    }
    
    return [];
  };

  // ============================================
  // ✅ CORREÇÃO 10: getRating()
  // ============================================
  const getRating = (): number => {
    // 1. Tentar rating no espaço
    if ((space as any)?.rating) return Number((space as any).rating);
    if ((space as any)?.average_rating) return Number((space as any).average_rating);
    
    // 2. Tentar rating no spaceDetails
    if ((spaceDetails as any)?.space?.rating) return Number((spaceDetails as any).space.rating);
    
    // 3. Calcular a partir das reviews
    if (reviews.length > 0) {
      const total = reviews.reduce((acc: number, review: any) => {
        const rating = review.overallRating || review.rating || 0;
        return acc + Number(rating);
      }, 0);
      return total / reviews.length;
    }
    
    return 0;
  };

  // ============================================
  // ✅ CORREÇÃO 11: getOffersCatering()
  // ============================================
  const getOffersCatering = (): boolean => {
    return Boolean(
      (space as any)?.offersCatering || 
      (space as any)?.offers_catering || 
      (spaceDetails as any)?.offers_catering ||
      (spaceDetailsResponse as any)?.data?.offers_catering ||
      false
    );
  };

  // ============================================
  // ✅ CORREÇÃO 12: getCateringDiscount()
  // ============================================
  const getCateringDiscount = (): number => {
    return Number(
      (space as any)?.cateringDiscountPercent || 
      (space as any)?.catering_discount_percent || 
      (spaceDetails as any)?.catering_discount_percent ||
      (spaceDetailsResponse as any)?.data?.catering_discount_percent ||
      0
    );
  };

  // ============================================
  // ✅ CORREÇÃO 13: getAvailableForImmediateBooking()
  // ============================================
  const getAvailableForImmediateBooking = (): boolean => {
    return Boolean(
      (space as any)?.available_for_immediate_booking || 
      (spaceDetails as any)?.available_for_immediate_booking ||
      (spaceDetailsResponse as any)?.data?.available_for_immediate_booking ||
      false
    );
  };

  // ============================================
  // ✅ CORREÇÃO 14: getHotelName()
  // ============================================
  const getHotelName = (): string => {
    return hotel?.name || (space as any)?.hotelName || 'Hotel não especificado';
  };

  // ============================================
  // ✅ APLICAR TODAS AS CORREÇÕES
  // ============================================
  const basePrice = getBasePrice();
  const formattedBasePrice = formatPrice(basePrice);
  
  const weekendSurchargePercent = getWeekendSurcharge();
  const weekendPrice = basePrice * (1 + weekendSurchargePercent / 100);
  const formattedWeekendPrice = formatPrice(weekendPrice);
  
  const securityDeposit = getSecurityDeposit();
  const formattedSecurityDeposit = formatPrice(securityDeposit);
  
  const location = getLocation();
  const images = getImages();
  const amenities = getAmenities();
  const equipmentItems = getEquipmentItems();
  const rating = getRating();
  const offersCatering = getOffersCatering();
  const cateringDiscountPercent = getCateringDiscount();
  const availableForImmediateBooking = getAvailableForImmediateBooking();
  const hotelName = getHotelName();
  const { min: capacityMin, max: capacityMax } = getCapacity();

  // ✅ DEBUG: Verificar dados
  console.log('🔍 DEBUG - EventSpaceDetailPage:', {
    spaceId,
    spaceDetails,
    space,
    hotel,
    basePrice,
    location,
    amenitiesCount: amenities.length,
    equipmentCount: equipmentItems.length,
    rating,
    offersCatering,
    cateringDiscountPercent,
    // Campos adicionais para debug
    price_per_day_space: (space as any)?.price_per_day,
    price_per_day_details: (spaceDetails as any)?.price_per_day,
    amenities_source: {
      from_details: (spaceDetails as any)?.amenities?.length,
      from_space: (space as any)?.amenities?.length,
      from_equipment: (space as any)?.equipment?.amenities?.length,
      from_list: (space as any)?.amenities_list?.length
    }
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark mb-2">Erro ao carregar espaço</h1>
          <p className="text-muted-foreground">Ocorreu um erro ao carregar os detalhes do espaço</p>
        </div>
      </div>
    );
  }

  if (isLoading || !space) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-96 mb-8 rounded-lg" />
          <Skeleton className="h-12 mb-4 w-1/3" />
          <Skeleton className="h-6 mb-8 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 bg-gray-200 overflow-hidden">
        <img
          src={images[0]}
          alt={(space as any).name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=Espaço+para+Eventos';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute top-6 right-6 bg-white/95 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Star className="w-5 h-5 fill-primary text-primary" />
            <span className="font-bold text-dark">{rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'})
            </span>
          </div>
        )}
      </div>

      {/* Informações Principais */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            {/* Título */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold text-dark mb-2">{(space as any).name}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-secondary text-dark capitalize">
                      {(space as any).spaceType || 'Espaço para Eventos'}
                    </Badge>
                    {hotelName && (
                      <Badge variant="outline" className="border-secondary text-secondary">
                        {hotelName}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <MapPin className="w-5 h-5" />
                <span>{location}</span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground mb-4 py-4 border-y border-gray-200">
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>Capacidade: {capacityMin}-{capacityMax} pessoas</span>
                </div>
                {(space as any).areaSqm && (
                  <div className="flex items-center gap-1">
                    <Ruler className="w-5 h-5" />
                    <span>{(space as any).areaSqm}m²</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>Verificado pelo Link-A</span>
                </div>
                {(space as any).isActive && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Disponível para reserva</span>
                  </div>
                )}
                {offersCatering && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Catering disponível</span>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-dark mb-3">Sobre o espaço</h2>
              <p className="text-muted-foreground leading-relaxed">
                {(space as any).description || 'Este espaço não possui descrição detalhada.'}
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="features" className="mb-8">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="features">Características</TabsTrigger>
                <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>

              {/* Características */}
              <TabsContent value="features" className="mt-4">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Características</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {amenities.length > 0 ? (
                      amenities.map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-center py-4">
                          Nenhuma característica listada
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Equipamentos */}
              <TabsContent value="equipment" className="mt-4">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Equipamentos Disponíveis</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {equipmentItems.length > 0 ? (
                      equipmentItems.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum equipamento listado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews" className="mt-4">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Avaliações de Clientes</h3>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review: any) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-dark">{review.userName || 'Anônimo'}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: Math.round(review.overallRating || review.rating || 0) }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-primary text-primary"
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('pt-PT') : 'Data não disponível'}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{review.comment || 'Sem comentário'}</p>
                          {review.organizerResponse && (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-secondary">
                              <p className="font-semibold text-dark mb-1">Resposta do gerenciador</p>
                              <p className="text-muted-foreground">{review.organizerResponse}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
                      <p className="text-sm text-gray-500 mt-1">Seja o primeiro a avaliar este espaço!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Informações */}
              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold text-dark mb-3">Restrições e Políticas</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-dark">Álcool permitido:</strong>{' '}
                        {(space as any).alcoholAllowed ? '✅ Sim' : '❌ Não'}
                      </p>
                      <p>
                        <strong className="text-dark">Seguro obrigatório:</strong>{' '}
                        {(space as any).insuranceRequired ? '✅ Sim' : '❌ Não'}
                      </p>
                      <p>
                        <strong className="text-dark">Aprovação necessária:</strong>{' '}
                        {(space as any).approvalRequired ? '✅ Sim' : '❌ Não'}
                      </p>
                      {(space as any).noiseRestriction && (
                        <p>
                          <strong className="text-dark">Restrição de ruído:</strong> {(space as any).noiseRestriction}
                        </p>
                      )}
                      {(space as any).allowedEventTypes?.length > 0 && (
                        <p>
                          <strong className="text-dark">Tipos de evento permitidos:</strong>{' '}
                          {(space as any).allowedEventTypes.join(', ')}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold text-dark mb-3">Serviços</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span>Catering: {offersCatering ? '✅ Disponível' : '❌ Não disponível'}</span>
                      </div>
                      {cateringDiscountPercent > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span>Desconto catering: {cateringDiscountPercent}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${(space as any).naturalLight ? 'text-secondary' : 'text-gray-400'}`} />
                        <span>Luz natural: {(space as any).naturalLight ? '✅ Sim' : '❌ Não'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${(space as any).hasStage ? 'text-secondary' : 'text-gray-400'}`} />
                        <span>Palco: {(space as any).hasStage ? '✅ Sim' : '❌ Não'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${(space as any).loadingAccess ? 'text-secondary' : 'text-gray-400'}`} />
                        <span>Acesso carga/descarga: {(space as any).loadingAccess ? '✅ Sim' : '❌ Não'}</span>
                      </div>
                    </div>
                  </Card>

                  {hotel && (
                    <Card className="p-4">
                      <h4 className="font-semibold text-dark mb-3">Hotel Associado</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nome:</strong> {hotel.name}</p>
                        <p><strong>Localização:</strong> {hotel.locality}, {hotel.province}</p>
                        {hotel.contactEmail && (
                          <p><strong>Email:</strong> {hotel.contactEmail}</p>
                        )}
                        {hotel.contactPhone && (
                          <p><strong>Telefone:</strong> {hotel.contactPhone}</p>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Widget */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Preço por dia</span>
                </p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-secondary">{formattedBasePrice}</span>
                  <span className="text-muted-foreground">MZN/dia</span>
                </div>

                {/* Preços detalhados */}
                <div className="space-y-2 text-sm text-muted-foreground mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Dia de semana:</span>
                    <span className="font-medium">{formattedBasePrice}</span>
                  </div>
                  {weekendSurchargePercent > 0 && (
                    <div className="flex justify-between">
                      <span>Fim de semana:</span>
                      <span className="font-medium">
                        {formattedWeekendPrice} <span className="text-alert text-xs">(+{weekendSurchargePercent}%)</span>
                      </span>
                    </div>
                  )}
                  
                  {offersCatering && cateringDiscountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto catering:</span>
                      <span className="font-medium">{cateringDiscountPercent}%</span>
                    </div>
                  )}
                </div>

                {/* Informações de preço */}
                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <p>• Preço base por dia de uso</p>
                  <p>• Taxas adicionais podem aplicar-se</p>
                  <p>• Contacte para orçamento personalizado</p>
                </div>
              </div>

              <Button className="w-full bg-secondary hover:bg-secondary/90 text-dark mb-3 h-12 text-lg font-semibold">
                Reservar Agora
              </Button>

              <Button variant="outline" className="w-full h-10 mb-4">
                <DollarSign className="w-4 h-4 mr-2" />
                Solicitar Orçamento
              </Button>

              {/* Informações importantes */}
              <div className="space-y-4">
                {/* Depósito de Segurança */}
                {securityDeposit > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-blue-900">Depósito de Segurança</span>
                      <span className="font-bold text-blue-900">{formattedSecurityDeposit}</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Reembolsável após o evento se não houver danos
                    </p>
                  </div>
                )}

                {/* Disponibilidade imediata */}
                {availableForImmediateBooking && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Disponível para reserva imediata</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Reserve agora e receba confirmação em minutos
                    </p>
                  </div>
                )}

                {/* Info de contato */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-900 font-medium mb-2">
                    Contacto após reserva confirmada
                  </p>
                  <p className="text-xs text-orange-700">
                    Após confirmação da reserva, você receberá os contactos diretos do gerenciador
                  </p>
                </div>

                {/* Capacidade */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Capacidade máxima</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span className="font-bold">{capacityMax} pessoas</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceDetailPage;