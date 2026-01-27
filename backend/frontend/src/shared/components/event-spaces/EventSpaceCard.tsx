/**
 * src/apps/hotels-app/components/event-spaces/EventSpaceCard.tsx
 * Card moderno de espaço de evento - VERSÃO FINAL 27/01/2026
 * ✅ CORRIGIDO: Campo location corrigido, adicionado suporte para info do hotel
 * Alinhado com shared/types/event-spaces.ts
 * Design inspirado em Booking.com / Airbnb
 */

import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Users, Heart, DollarSign, Building } from 'lucide-react';
import type { EventSpace } from '@/shared/types/event-spaces';

interface EventSpaceCardProps {
  space: EventSpace;
  showPrice?: boolean;
  onBook?: (spaceId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spaceId: string) => void;
  className?: string;
  showHotelInfo?: boolean; // ✅ NOVO: Para mostrar info do hotel
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
  // Preço base (diário) - schema real
  const basePrice = space.basePricePerDay
    ? parseFloat(space.basePricePerDay)
    : 0;

  const displayPrice = basePrice > 0
    ? basePrice.toLocaleString('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 0,
      })
    : 'Sob consulta';

  // Amenities reais (vem de equipment.amenities)
  const amenities = space.equipment?.amenities || [];

  // ✅ CORREÇÃO: Obter localização do hotel ou usar fallback
  const location = space.hotel?.locality 
    ? `${space.hotel.locality}, ${space.hotel.province}`
    : 'Localização não informada';

  // ✅ CORREÇÃO: Rating com fallback
  const rating = space.rating || 0;
  const totalReviews = space.totalReviews || 0;

  return (
    <div
      className={`group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 ${className}`}
    >
      {/* Imagem principal + overlay */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={space.images?.[0] || 'https://via.placeholder.com/400x300/eee/999?text=Sem+Foto'}
          alt={space.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/400x300/eee/999?text=Sem+Foto';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        {/* Badges de status */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {space.isFeatured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium shadow-sm">
              Destaque
            </Badge>
          )}
          {!space.isActive && (
            <Badge className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium shadow-sm">
              Inativo
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

        {/* ✅ CORREÇÃO: Rating (se disponível) */}
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

        {/* ✅ CORREÇÃO: Localização corrigida */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Capacidade */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="h-4 w-4 text-violet-600" />
          <span>
            {space.capacityMin}–{space.capacityMax} pessoas
          </span>
        </div>

        {/* ✅ NOVO: Info do hotel (opcional) */}
        {showHotelInfo && space.hotel && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Building className="h-4 w-4 text-violet-600" />
            <span className="line-clamp-1">{space.hotel.name}</span>
          </div>
        )}

        {/* Descrição curta */}
        {space.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {space.description}
          </p>
        )}

        {/* Amenidades (máx 3 + +N) */}
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
              {space.weekendSurchargePercent > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  +{space.weekendSurchargePercent}% fim de semana
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
              {/* ✅ CORREÇÃO: Link correto para detalhes */}
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