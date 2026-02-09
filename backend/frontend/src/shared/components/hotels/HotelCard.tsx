// src/shared/components/HotelCard.tsx
// Card moderno de hotel para listagem em busca
// ✅ CORRIGIDO: Problema de imagens 404 resolvido com fallback
// ✅ CORREÇÃO: Melhor tratamento de erros e dados seguros

import React from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Heart } from 'lucide-react';
import type { Hotel as ServiceHotel } from '@/services/hotelService';

interface HotelCardProps {
  hotel: ServiceHotel & { base_price?: string };
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
  // ✅ CORREÇÃO: Funções auxiliares para dados seguros
  const getSafeRating = (): number => {
    if (typeof hotel.rating === 'number') return hotel.rating;
    if (typeof hotel.rating === 'string') return parseFloat(hotel.rating) || 0;
    return 0;
  };

  const getSafeTotalReviews = (): number => {
    if (typeof hotel.total_reviews === 'number') return hotel.total_reviews;
    if (typeof hotel.total_reviews === 'string') return parseInt(hotel.total_reviews) || 0;
    return 0;
  };

  const getSafeImages = (): string[] => {
    if (!hotel.images) return [];
    if (Array.isArray(hotel.images)) return hotel.images;
    return [];
  };

  const getSafeDescription = (): string => {
    return hotel.description || 'Descrição não disponível';
  };

  const getSafeLocality = (): string => {
    return hotel.locality || hotel.province || 'Localização não disponível';
  };

  // ✅ CORREÇÃO: Dados seguros
  const safeRating = getSafeRating();
  const safeTotalReviews = getSafeTotalReviews();
  const safeImages = getSafeImages();
  const safeDescription = getSafeDescription();
  const safeLocality = getSafeLocality();
  
  // ✅ CORREÇÃO APLICADA: Imagem com fallback e tratamento de erro
  const imageUrl = safeImages[0] || `https://via.placeholder.com/400x300?text=${encodeURIComponent(hotel.name || 'Hotel')}`;
  
  // ✅ CORREÇÃO: MinPrice seguro
  const safeMinPrice = minPrice || parseInt(hotel.base_price || '0') || 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem Hero com Gradient Overlay */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {/* ✅ CORREÇÃO APLICADA: Imagem com fallback e tratamento de erro */}
        <img
          src={imageUrl}
          alt={hotel.name || 'Hotel'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // ✅ CORREÇÃO: Fallback para imagem placeholder com nome do hotel
            (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(hotel.name || 'Hotel')}`;
            e.currentTarget.className = 'w-full h-full object-cover bg-gray-200';
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Rating Badge - ✅ CORREÇÃO: Só mostrar se rating > 0 */}
        {safeRating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg shadow-sm">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-dark">
              {/* ✅ CORREÇÃO CRÍTICA: Usar toFixed apenas em número */}
              {safeRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(hotel.id)}
            className="absolute top-3 right-3 p-2 bg-white/95 rounded-full hover:bg-white transition-colors"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-alert text-alert' : 'text-gray-400'}`}
            />
          </button>
        )}

        {/* Badges adicionais */}
        {(hotel as any).is_featured && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-alert text-white">Mais reservado</Badge>
          </div>
        )}
      </div>

      {/* Informações do Hotel */}
      <div className="p-4">
        {/* Nome e localização */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-dark line-clamp-2 mb-1">
            {hotel.name || 'Hotel sem nome'}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{safeLocality}</span>
          </div>
        </div>

        {/* Reviews count - ✅ CORREÇÃO: Só mostrar se > 0 */}
        {safeTotalReviews > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {safeTotalReviews.toLocaleString()} {safeTotalReviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        )}

        {/* Descrição curta */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {safeDescription}
        </p>

        {/* Preço - ✅ CORREÇÃO: Mostrar apenas se showPrice for true */}
        {showPrice && safeMinPrice > 0 && (
          <div className="mb-4 pb-4 border-t border-gray-100">
            <p className="text-xs text-muted-foreground">A partir de</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {safeMinPrice.toLocaleString('pt-MZ')}
              </span>
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