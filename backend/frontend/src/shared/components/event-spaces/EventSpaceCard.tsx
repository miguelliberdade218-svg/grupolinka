/**
 * src/apps/hotels-app/components/event-spaces/EventSpaceCard.tsx
 * Card moderno de espaço de evento - VERSÃO FINAL 16/02/2026
 * ✅ CORRIGIDO: Prioridade para photos carregadas do serviço
 * ✅ CORRIGIDO: Fallback local de imagem (data URL)
 * ✅ CORRIGIDO: Interface completa com todos os campos necessários
 */

import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Users, Heart, Building } from 'lucide-react';
import type { EventSpace } from '@/shared/types/event-spaces';
import type { EventSpacePhoto } from '@/services/eventSpacePhotoService';

// ============================================
// ✅ INTERFACE COMPLETA - TODOS OS CAMPOS POSSÍVEIS
// ============================================
interface CardSpace {
  // Campos obrigatórios do EventSpace
  id: string;
  name: string;
  description: string | null;
  capacityMin: number;
  capacityMax: number;
  areaSqm: number | null;
  basePricePerDay: string;
  weekendSurchargePercent: number;
  offersCatering: boolean;
  spaceType: string | null;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  locality: string | null;
  province: string | null;
  location: string | null;
  images: string[];
  hotel?: {
    id?: string;
    name: string;
    locality: string;
    province: string;
  } | null;

  // ✅ CAMPOS ADICIONAIS (rating)
  average_rating?: number;
  avgRating?: number;
  
  // ✅ CAMPOS ADICIONAIS (reviews)
  review_count?: number;
  reviewCount?: number;
  
  // ✅ OUTROS CAMPOS ADICIONAIS
  distance?: number | null;
  thumbnail?: string;
  photos?: EventSpacePhoto[];
  price_per_day?: string;
  pricePerDay?: string;
  base_price_per_day?: string;
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
}

interface EventSpaceCardProps {
  space: CardSpace;
  showPrice?: boolean;
  onBook?: (spaceId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spaceId: string) => void;
  className?: string;
  showHotelInfo?: boolean;
}

// ============================================
// ✅ FUNÇÃO AUXILIAR: Gerar fallback de imagem local
// ============================================
const generateFallbackImage = (text: string): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' font-family='system-ui, sans-serif' font-size='16' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

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
  // ✅ Extração de preço
  // ============================================
  const getBasePrice = (): number => {
    if (space.price_per_day) {
      const price = parseFloat(String(space.price_per_day));
      if (!isNaN(price) && price > 0) return price;
    }
    
    if (space.pricePerDay) {
      const price = parseFloat(String(space.pricePerDay));
      if (!isNaN(price) && price > 0) return price;
    }
    
    if (space.basePricePerDay) {
      const price = parseFloat(String(space.basePricePerDay));
      if (!isNaN(price) && price > 0) return price;
    }
    
    if (space.base_price_per_day) {
      const price = parseFloat(String(space.base_price_per_day));
      if (!isNaN(price) && price > 0) return price;
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
  // ✅ Extração de localização
  // ============================================
  const getLocation = (): string => {
    if (space.location) return space.location;
    
    if (space.locality && space.province) {
      return `${space.locality}, ${space.province}`;
    }
    
    if (space.hotel?.locality && space.hotel?.province) {
      return `${space.hotel.locality}, ${space.hotel.province}`;
    }
    
    if (space.hotel?.name && space.hotel?.locality) {
      return `${space.hotel.name}, ${space.hotel.locality}`;
    }
    
    if (space.hotel?.locality) return space.hotel.locality;
    
    if (space.locality) return space.locality;
    
    if (space.address) return space.address;
    
    return 'Localização não informada';
  };

  const location = getLocation();

  // ============================================
  // ✅ Extração de rating - CORRIGIDO
  // ============================================
  const getRating = (): number => {
    // Prioridade: rating (original) > average_rating > avgRating
    if (space.rating) return space.rating;
    if (space.average_rating) return space.average_rating;
    if (space.avgRating) return space.avgRating;
    return 0;
  };

  const getTotalReviews = (): number => {
    // Prioridade: totalReviews (original) > review_count > reviewCount
    if (space.totalReviews) return space.totalReviews;
    if (space.review_count) return space.review_count;
    if (space.reviewCount) return space.reviewCount;
    return 0;
  };

  const rating = getRating();
  const totalReviews = getTotalReviews();

  // ============================================
  // ✅ EXTRAÇÃO DE IMAGEM COM PRIORIDADE PARA PHOTOS
  // ============================================
  const getImageUrl = (): string => {
    // ✅ PRIORIDADE 1: Fotos carregadas pelo serviço
    if (space.photos && Array.isArray(space.photos) && space.photos.length > 0) {
      const photo = space.photos[0];
      if (photo.url.startsWith('/')) {
        return `http://localhost:8000${photo.url}`;
      }
      return photo.url;
    }
    
    // PRIORIDADE 2: images array
    if (space.images && Array.isArray(space.images) && space.images.length > 0) {
      if (typeof space.images[0] === 'string') {
        return space.images[0];
      }
    }
    
    // PRIORIDADE 3: imageUrl direto
    if (space.imageUrl) {
      return space.imageUrl;
    }
    
    // PRIORIDADE 4: primary_image
    if (space.primary_image) {
      return space.primary_image;
    }
    
    // PRIORIDADE 5: thumbnail
    if (space.thumbnail) {
      return space.thumbnail;
    }
    
    // FALLBACK LOCAL
    return generateFallbackImage(space.name);
  };

  const imageUrl = getImageUrl();

  // ============================================
  // ✅ Extração do nome do hotel
  // ============================================
  const getHotelName = (): string => {
    return space.hotel?.name || space.hotel_name || space.hotelName || 'Hotel não especificado';
  };

  const hotelName = getHotelName();

  // ============================================
  // ✅ Extração do weekend surcharge
  // ============================================
  const getWeekendSurcharge = (): number => {
    return space.weekendSurchargePercent || 
           space.weekend_surcharge_percent || 
           space.weekendSurcharge || 
           0;
  };

  const weekendSurcharge = getWeekendSurcharge();

  // ============================================
  // ✅ Extração da capacidade
  // ============================================
  const getCapacityMin = (): number => {
    return Number(space.capacityMin || space.capacity_min || 0);
  };

  const getCapacityMax = (): number => {
    return Number(space.capacityMax || space.capacity_max || getCapacityMin());
  };

  const capacityMin = getCapacityMin();
  const capacityMax = getCapacityMax();

  // ============================================
  // ✅ Verificar se oferece catering
  // ============================================
  const getOffersCatering = (): boolean => {
    return space.offersCatering || 
           space.offers_catering || 
           space.cateringAvailable || 
           false;
  };

  const offersCatering = getOffersCatering();

  // ============================================
  // ✅ Verificar se é destaque
  // ============================================
  const getIsFeatured = (): boolean => {
    return space.isFeatured || 
           space.is_featured || 
           space.featured || 
           false;
  };

  const isFeatured = getIsFeatured();

  // ============================================
  // ✅ Verificar se está ativo
  // ============================================
  const getIsActive = (): boolean => {
    return space.isActive !== false && space.active !== false;
  };

  const isActive = getIsActive();

  // ============================================
  // ✅ Extração da área
  // ============================================
  const getArea = (): number | null => {
    return space.areaSqm || space.area_sqm || space.area || null;
  };

  const area = getArea();

  // ============================================
  // ✅ Extração do depósito de segurança
  // ============================================
  const getSecurityDeposit = (): number => {
    const deposit = space.security_deposit || space.deposit;
    if (deposit === null || deposit === undefined) return 0;
    
    const num = typeof deposit === 'string' ? parseFloat(deposit) : deposit;
    return !isNaN(num) && num > 0 ? num : 0;
  };

  const securityDeposit = getSecurityDeposit();

  // ============================================
  // ✅ DEBUG
  // ============================================
  console.log('🔍 EventSpaceCard:', {
    id: space.id,
    name: space.name,
    hasPhotos: space.photos?.length || 0,
    imageUrl: imageUrl.substring(0, 50) + '...',
    rating,
    totalReviews
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
            (e.target as HTMLImageElement).src = generateFallbackImage(space.name);
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

        {/* Rating */}
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

        {/* Localização */}
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

        {/* Info do hotel */}
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