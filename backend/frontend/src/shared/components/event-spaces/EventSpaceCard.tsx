import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Users, Heart } from 'lucide-react';
import type { EventSpace } from '@/shared/types/event-spaces';

interface EventSpaceCardProps {
  space: EventSpace;
  showPrice?: boolean;
  onViewDetails?: (spaceId: string) => void;
  onBook?: (spaceId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spaceId: string) => void;
}

/**
 * Card moderno de espaço de evento
 * Inspirado em Airbnb e Booking.com
 */
export const EventSpaceCard: React.FC<EventSpaceCardProps> = ({
  space,
  showPrice = true,
  onViewDetails,
  onBook,
  isFavorite = false,
  onToggleFavorite,
}) => {
      const startingPrice = Math.min(
    parseFloat(space.pricePerHour || '0'),
    parseFloat(space.basePriceHalfDay || '0'),
    parseFloat(space.basePriceFullDay || '0')
  );

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem Hero */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={space.images?.[0] || 'https://via.placeholder.com/400x300'}
          alt={space.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Rating Badge */}
        {space.rating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg shadow-sm">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-dark">{space.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite?.(space.id)}
          className="absolute top-3 right-3 p-2 bg-white/95 rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-alert text-alert' : 'text-gray-400'}`}
          />
        </button>

        {/* Type Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-secondary text-dark capitalize">{space.spaceType}</Badge>
        </div>
      </div>

      {/* Informações */}
      <div className="p-4">
        {/* Nome e tipo */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-dark line-clamp-2 mb-1">{space.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Até {space.capacityMax} pessoas</span>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{space.description}</p>

        {/* Amenities */}
        {space.amenities && space.amenities.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {space.amenities.slice(0, 2).map((amenity: string) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {space.amenities.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{space.amenities.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Preço */}
        {showPrice && (
          <div className="mb-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-muted-foreground">A partir de</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {Math.round(startingPrice).toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">MZN/hora</span>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(space.id)}
            asChild
          >
            <Link href={`/event-spaces/${space.id}`}>Ver detalhes</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-dark"
            onClick={() => onBook?.(space.id)}
          >
            Reservar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceCard;
