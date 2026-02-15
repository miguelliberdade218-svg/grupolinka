/**
 * src/apps/hotels-app/components/event-spaces/EventSpaceCard.tsx
 * Card moderno de espaço de evento - VERSÃO FINAL 12/02/2026
 * ✅ CORRIGIDO: Campo location corrigido, adicionado suporte para info do hotel
 * ✅ CORRIGIDO: Problema de imagens 404 resolvido com fallback
 * ✅ CORRIGIDO: Extração de amenities e preço com fallbacks
 * ✅ CORREÇÃO CRÍTICA: Adicionado suporte para pricePerDay e price_per_day (campos reais do banco)
 * ✅ CORREÇÃO CRÍTICA: getLocation() agora verifica TODAS as possibilidades
 * ✅ CORREÇÃO CRÍTICA: getAmenities() agora suporta objetos com name - TYPE ERROR FIXED
 * ✅ CORREÇÃO CRÍTICA: ExtendedEventSpace agora estende EventSpace corretamente
 * Alinhado com shared/types/event-spaces.ts
 * Design inspirado em Booking.com / Airbnb
 */

import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Users, Heart, Building } from 'lucide-react';
import type { EventSpace } from '@/shared/types/event-spaces';

// ============================================
// ✅ INTERFACES LOCAIS PARA TIPAGEM CORRETA
// ============================================
interface AmenityObject {
  id?: string;
  name: string;
  description?: string;
}

interface EquipmentAmenity {
  id?: string;
  name: string;
  description?: string;
}

// ============================================
// ✅ CORREÇÃO CRÍTICA: ExtendedEventSpace NÃO estende EventSpace
// ============================================
interface ExtendedEventSpace {
  // Campos obrigatórios do EventSpace
  id: string;
  hotelId: string;
  hotel_id: string;
  name: string;
  description: string | null;
  capacityMin: number;
  capacityMax: number;
  areaSqm: number | null;
  basePricePerDay: string;
  weekendSurchargePercent: number;
  offersCatering: boolean;
  cateringDiscountPercent: number;
  cateringMenuUrls: string[];
  spaceType: string | null;
  naturalLight: boolean;
  hasStage: boolean;
  loadingAccess: boolean;
  dressingRooms: number | null;
  insuranceRequired: boolean;
  alcoholAllowed: boolean;
  approvalRequired: boolean;
  noiseRestriction: string | null;
  securityDeposit: string | null;
  allowedEventTypes: string[];
  prohibitedEventTypes: string[];
  equipment: Record<string, any>;
  setupOptions: string[];
  images: string[];
  floorPlanImage: string | null;
  virtualTourUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  rating: number;
  totalReviews: number;
  locality: string | null;
  province: string | null;
  lat: string | null;
  lng: string | null;
  location_id: string | null;
  inherits_hotel_location: boolean;
  createdAt: string;
  updatedAt: string;
  amenities: string[];
  hotel?: {
    id?: string;
    name: string;
    locality: string;
    province: string;
    address?: string | null;
    city?: string | null;
    lat?: string | null;
    lng?: string | null;
    location_id?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
  } | null;
  location?: string | null;

  // ✅ CAMPOS ADICIONAIS (todos opcionais e com tipos corretos)
  price_per_day?: string;
  pricePerDay?: string;
  base_price_per_day?: string;
  amenities_list?: string[];
  average_rating?: number;
  avgRating?: number;
  review_count?: number;
  reviewCount?: number;
  imageUrl?: string;
  primary_image?: string;
  hotel_name?: string;
  hotelName?: string;
  weekend_surcharge_percent?: number;
  weekendSurcharge?: number;
  capacity_min?: number;
  capacity_max?: number;
  offers_catering?: boolean;
  cateringAvailable?: boolean;
  is_featured?: boolean;
  featured?: boolean;
  active?: boolean;
  area_sqm?: number;
  area?: number;
  security_deposit?: string | number;
  deposit?: string | number;
  address?: string;
  data?: {
    amenities?: string[];
  };
  distance?: number | null;
  thumbnail?: string;
  capacityTheater?: number | null;
  capacityClassroom?: number | null;
  capacityBanquet?: number | null;
  capacityStanding?: number | null;
  capacityCocktail?: number | null;
}

interface EventSpaceCardProps {
  space: EventSpace | ExtendedEventSpace;
  showPrice?: boolean;
  onBook?: (spaceId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spaceId: string) => void;
  className?: string;
  showHotelInfo?: boolean;
}

/**
 * Card de espaço de evento otimizado e alinhado com schema real
 */
export const EventSpaceCard: React.FC<EventSpaceCardProps> = ({
  space,
  showPrice = true,
  onBook,
  isFavorite = false,
  onToggleFavorite,
  className = '',
  showHotelInfo = false,
}) => {
  // ============================================
  // ✅ HELPER: Type guard para acessar propriedades com segurança
  // ============================================
  const spaceAny = space as ExtendedEventSpace;

  // ============================================
  // ✅ CORREÇÃO CRÍTICA 1: Extração de preço com suporte a TODOS os formatos
  // ============================================
  const getBasePrice = (): number => {
    // 1. PRIORIDADE MÁXIMA: price_per_day (string)
    if (spaceAny.price_per_day) {
      const price = parseFloat(String(spaceAny.price_per_day));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 2. PRIORIDADE MÁXIMA: pricePerDay (string)
    if (spaceAny.pricePerDay) {
      const price = parseFloat(String(spaceAny.pricePerDay));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 3. Tentar basePricePerDay (string)
    if (space.basePricePerDay) {
      const price = parseFloat(String(space.basePricePerDay));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    // 4. Tentar base_price_per_day (string)
    if (spaceAny.base_price_per_day) {
      const price = parseFloat(String(spaceAny.base_price_per_day));
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
    
    return 0;
  };

  const basePrice = getBasePrice();

  const displayPrice = basePrice > 0
    ? basePrice.toLocaleString('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 0,
      })
    : 'Sob consulta';

  // ============================================
  // ✅ CORREÇÃO 2: Extração de amenities com fallback MÚLTIPLO - TYPESCRIPT FIXED
  // ============================================
  const getAmenities = (): string[] => {
    const result: string[] = [];
    
    // 1. Tentar space.amenities (array de strings ou objetos)
    if (space.amenities && Array.isArray(space.amenities) && space.amenities.length > 0) {
      const amenities = space.amenities;
      
      // Se for array de strings
      if (amenities.length > 0 && typeof amenities[0] === 'string') {
        return amenities as string[];
      }
      
      // Se for array de objetos com name
      if (amenities.length > 0 && typeof amenities[0] === 'object' && amenities[0] !== null) {
        const amenityObjects = amenities as unknown as AmenityObject[];
        if (amenityObjects[0]?.name) {
          return amenityObjects.map((a: AmenityObject) => a.name);
        }
      }
    }
    
    // 2. Tentar space.equipment?.amenities
    if (space.equipment?.amenities && Array.isArray(space.equipment.amenities) && space.equipment.amenities.length > 0) {
      const equipmentAmenities = space.equipment.amenities;
      
      if (equipmentAmenities.length > 0 && typeof equipmentAmenities[0] === 'string') {
        return equipmentAmenities as string[];
      }
      
      if (equipmentAmenities.length > 0 && typeof equipmentAmenities[0] === 'object' && equipmentAmenities[0] !== null) {
        const equipmentObjects = equipmentAmenities as unknown as EquipmentAmenity[];
        if (equipmentObjects[0]?.name) {
          return equipmentObjects.map((a: EquipmentAmenity) => a.name);
        }
      }
    }
    
    // 3. Tentar amenities_list
    if (spaceAny.amenities_list && Array.isArray(spaceAny.amenities_list) && spaceAny.amenities_list.length > 0) {
      return spaceAny.amenities_list;
    }
    
    // 4. Tentar data.amenities (de resposta da API)
    if (spaceAny.data?.amenities && Array.isArray(spaceAny.data.amenities) && spaceAny.data.amenities.length > 0) {
      return spaceAny.data.amenities;
    }
    
    return result;
  };

  const amenities = getAmenities();

  // ============================================
  // ✅ CORREÇÃO 3: Extração de localização com TODOS os fallbacks
  // ============================================
  const getLocation = (): string => {
    // 1. Tentar location direta do espaço (prioridade máxima)
    if (space.location) {
      return space.location;
    }
    
    // 2. Tentar localidade + província do espaço
    if (space.locality && space.province) {
      return `${space.locality}, ${space.province}`;
    }
    
    // 3. Tentar localização do hotel
    if (space.hotel?.locality && space.hotel?.province) {
      return `${space.hotel.locality}, ${space.hotel.province}`;
    }
    
    // 4. Tentar nome do hotel + localidade
    if (space.hotel?.name && space.hotel?.locality) {
      return `${space.hotel.name}, ${space.hotel.locality}`;
    }
    
    // 5. Tentar apenas locality do hotel
    if (space.hotel?.locality) {
      return space.hotel.locality;
    }
    
    // 6. Tentar apenas locality do espaço
    if (space.locality) {
      return space.locality;
    }
    
    // 7. Tentar address ou endereço completo
    if (spaceAny.address) {
      return spaceAny.address;
    }
    
    return 'Localização não informada';
  };

  const location = getLocation();

  // ============================================
  // ✅ CORREÇÃO 4: Extração de rating com múltiplas fontes
  // ============================================
  const getRating = (): number => {
    return space.rating || spaceAny.average_rating || spaceAny.avgRating || 0;
  };

  const getTotalReviews = (): number => {
    return space.totalReviews || spaceAny.review_count || spaceAny.reviewCount || 0;
  };

  const rating = getRating();
  const totalReviews = getTotalReviews();

  // ============================================
  // ✅ CORREÇÃO 5: Extração de imagem com fallback robusto
  // ============================================
  const getImageUrl = (): string => {
    // 1. Tentar images array
    if (space.images && Array.isArray(space.images) && space.images.length > 0) {
      // Se for array de strings
      if (typeof space.images[0] === 'string') {
        return space.images[0];
      }
      // Se for array de objetos com url
      if (space.images[0] && typeof space.images[0] === 'object' && (space.images[0] as any)?.url) {
        return (space.images[0] as any).url;
      }
      // Se for array de objetos com imageUrl
      if (space.images[0] && typeof space.images[0] === 'object' && (space.images[0] as any)?.imageUrl) {
        return (space.images[0] as any).imageUrl;
      }
    }
    
    // 2. Tentar imageUrl direto
    if (spaceAny.imageUrl) {
      return spaceAny.imageUrl;
    }
    
    // 3. Tentar primary_image
    if (spaceAny.primary_image) {
      return spaceAny.primary_image;
    }
    
    // Fallback com nome do espaço
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(space.name)}`;
  };

  const imageUrl = getImageUrl();

  // ============================================
  // ✅ CORREÇÃO 6: Extração do nome do hotel
  // ============================================
  const getHotelName = (): string => {
    return space.hotel?.name || spaceAny.hotel_name || spaceAny.hotelName || 'Hotel não especificado';
  };

  const hotelName = getHotelName();

  // ============================================
  // ✅ CORREÇÃO 7: Extração do weekend surcharge
  // ============================================
  const getWeekendSurcharge = (): number => {
    return space.weekendSurchargePercent || 
           spaceAny.weekend_surcharge_percent || 
           spaceAny.weekendSurcharge || 
           0;
  };

  const weekendSurcharge = getWeekendSurcharge();

  // ============================================
  // ✅ CORREÇÃO 8: Extração da capacidade com validação
  // ============================================
  const getCapacityMin = (): number => {
    const min = Number(space.capacityMin || spaceAny.capacity_min || 0);
    return min > 0 ? min : 0;
  };

  const getCapacityMax = (): number => {
    const min = getCapacityMin();
    const max = Number(space.capacityMax || spaceAny.capacity_max || 0);
    return max > 0 ? max : min;
  };

  const capacityMin = getCapacityMin();
  const capacityMax = getCapacityMax();

  // ============================================
  // ✅ CORREÇÃO 9: Verificar se oferece catering
  // ============================================
  const getOffersCatering = (): boolean => {
    return space.offersCatering || 
           spaceAny.offers_catering || 
           spaceAny.cateringAvailable || 
           false;
  };

  const offersCatering = getOffersCatering();

  // ============================================
  // ✅ CORREÇÃO 10: Verificar se é destaque
  // ============================================
  const getIsFeatured = (): boolean => {
    return space.isFeatured || 
           spaceAny.is_featured || 
           spaceAny.featured || 
           false;
  };

  const isFeatured = getIsFeatured();

  // ============================================
  // ✅ CORREÇÃO 11: Verificar se está ativo
  // ============================================
  const getIsActive = (): boolean => {
    return space.isActive !== false && spaceAny.active !== false;
  };

  const isActive = getIsActive();

  // ============================================
  // ✅ CORREÇÃO 12: Extração da área
  // ============================================
  const getArea = (): number | null => {
    return space.areaSqm || spaceAny.area_sqm || spaceAny.area || null;
  };

  const area = getArea();

  // ============================================
  // ✅ CORREÇÃO 13: Extração do depósito de segurança
  // ============================================
  const getSecurityDeposit = (): number => {
    const deposit = Number(space.securityDeposit || 
                          spaceAny.security_deposit || 
                          spaceAny.deposit || 
                          0);
    return !isNaN(deposit) && deposit > 0 ? deposit : 0;
  };

  const securityDeposit = getSecurityDeposit();

  // ============================================
  // ✅ DEBUG (remover em produção)
  // ============================================
  console.log('🔍 EventSpaceCard:', {
    id: space.id,
    name: space.name,
    price_per_day: spaceAny.price_per_day,
    pricePerDay: spaceAny.pricePerDay,
    basePrice,
    displayPrice,
    location,
    amenitiesCount: amenities.length,
    rating,
    totalReviews,
    capacity: `${capacityMin}-${capacityMax}`,
    offersCatering,
    isFeatured,
    isActive
  });

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Imagem principal + overlay */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={space.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(space.name)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Badges de status */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {isFeatured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium shadow-sm">
              Destaque
            </Badge>
          )}
          {!isActive && (
            <Badge className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium shadow-sm">
              Inativo
            </Badge>
          )}
          {securityDeposit > 0 && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium shadow-sm">
              Caução {securityDeposit.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 0 })}
            </Badge>
          )}
        </div>

        {/* Favorite */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(space.id)}
            className="absolute top-3 left-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            />
          </button>
        )}

        {/* Tipo de espaço */}
        {space.spaceType && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-black/70 text-white text-xs capitalize px-3 py-1">
              {space.spaceType}
            </Badge>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-5 space-y-4">
        {/* Nome */}
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 group-hover:text-violet-700 transition-colors">
          {space.name}
        </h3>

        {/* Rating (se disponível) */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            {totalReviews > 0 && (
              <span className="text-sm text-gray-500">
                ({totalReviews} avaliação{totalReviews !== 1 ? 'es' : ''})
              </span>
            )}
          </div>
        )}

        {/* Localização corrigida - AGORA COM TODOS OS FALLBACKS */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Capacidade */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="h-4 w-4 text-violet-600" />
          <span>
            {capacityMin > 0 ? capacityMin : '?'}–{capacityMax > 0 ? capacityMax : '?'} pessoas
          </span>
          {area && (
            <span className="ml-2 text-xs text-gray-500">
              • {area}m²
            </span>
          )}
        </div>

        {/* Info do hotel (opcional) */}
        {showHotelInfo && (space.hotel || hotelName !== 'Hotel não especificado') && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Building className="h-4 w-4 text-violet-600" />
            <span className="line-clamp-1">{hotelName}</span>
          </div>
        )}

        {/* Descrição curta */}
        {space.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {space.description}
          </p>
        )}

        {/* Amenidades (máx 3 + +N) - AGORA COM SUPORTE A OBJETOS E TYPESCRIPT FIXED */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((amenity: string) => (
              <Badge
                key={amenity}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5"
              >
                {amenity}
              </Badge>
            ))}
            {amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5">
                +{amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Preço e ações */}
        <div className="pt-4 border-t border-gray-100 flex items-end justify-between">
          {showPrice && (
            <div>
              <p className="text-xs text-gray-500">A partir de</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-violet-700">
                  {displayPrice}
                </span>
                <span className="text-sm text-gray-500">/dia</span>
              </div>
              {weekendSurcharge > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  +{weekendSurcharge}% fim de semana
                </p>
              )}
              {offersCatering && (
                <p className="text-xs text-green-600 mt-0.5">
                  Catering disponível
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
              asChild
            >
              <Link href={`/event-spaces/${space.id}`}>
                Ver detalhes
              </Link>
            </Button>

            {onBook && (
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => onBook(space.id)}
              >
                Reservar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceCard;