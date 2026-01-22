import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Heart } from 'lucide-react';
import type { Hotel } from '@/shared/types/hotels';

interface HotelCardProps {
  hotel: Hotel;
  showPrice?: boolean;
  minPrice?: number;
  onViewDetails?: (hotelId: string) => void;
  onBook?: (hotelId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (hotelId: string) => void;
}

/**
 * Card moderno de hotel para listagem em busca
 * Inspirado em Booking.com e Airbnb
 * Mostra: imagem, nome, localização, avaliação, preço
 */
export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  showPrice = true,
  minPrice,
  onViewDetails,
  onBook,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem Hero com Gradient Overlay */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={hotel.images?.[0] || 'https://via.placeholder.com/400x300'}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Rating Badge */}
        {hotel.rating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg shadow-sm">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-dark">{hotel.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite?.(hotel.id)}
          className="absolute top-3 right-3 p-2 bg-white/95 rounded-full hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-alert text-alert' : 'text-gray-400'}`}
          />
        </button>

        {/* Badges adicionais */}
        {hotel.isFeatured && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-alert text-white">Mais reservado</Badge>
          </div>
        )}
      </div>

      {/* Informações do Hotel */}
      <div className="p-4">
        {/* Nome e localização */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-dark line-clamp-2 mb-1">{hotel.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{hotel.locality}</span>
          </div>
        </div>

                {/* Reviews count */}
        {hotel.totalReviews && hotel.totalReviews > 0 && (
          <p className="text-xs text-muted-foreground mb-3">{hotel.totalReviews} avaliações</p>
        )}

        {/* Descrição curta */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{hotel.description}</p>

        {/* Preço */}
        {showPrice && minPrice && (
          <div className="mb-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-muted-foreground">A partir de</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">{minPrice.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">MZN/noite</span>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(hotel.id)}
            asChild
          >
            <Link href={`/hotels/${hotel.id}`}>Ver detalhes</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-dark"
            onClick={() => onBook?.(hotel.id)}
          >
            Reservar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
