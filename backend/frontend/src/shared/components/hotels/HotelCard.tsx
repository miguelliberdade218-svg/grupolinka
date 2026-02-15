/**
 * src/shared/components/HotelCard.tsx
 * Card moderno de hotel para listagem em busca
 * ✅ CORRIGIDO: Usa fotos reais da tabela room_type_photos
 * ✅ CORREÇÃO: Remove dependência de placeholder problemático
 * ✅ CORREÇÃO: Adiciona loading state e tratamento de erros
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Heart, Image as ImageIcon } from 'lucide-react';
import { photoGalleryService } from '@/services/photoGalleryService';
import type { Hotel as ServiceHotel } from '@/services/hotelService';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

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
  const [photos, setPhotos] = useState<RoomTypePhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ✅ CORREÇÃO: Carregar fotos do hotel quando o componente montar
  useEffect(() => {
    const loadHotelPhotos = async () => {
      try {
        setLoadingPhotos(true);
        console.log(`📸 Carregando fotos para hotel ${hotel.id} - ${hotel.name}`);
        
        // Buscar fotos destacadas do hotel
        const hotelPhotos = await photoGalleryService.getHotelFeaturedPhotos(hotel.id);
        
        if (hotelPhotos && hotelPhotos.length > 0) {
          console.log(`✅ ${hotelPhotos.length} fotos carregadas para ${hotel.name}`);
          setPhotos(hotelPhotos);
        } else {
          console.log(`ℹ️ Nenhuma foto encontrada para ${hotel.name}`);
          setPhotos([]);
        }
      } catch (error) {
        console.error(`❌ Erro ao carregar fotos do hotel ${hotel.id}:`, error);
        setPhotos([]);
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadHotelPhotos();
  }, [hotel.id, hotel.name]);

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

  const getSafeDescription = (): string => {
    return hotel.description || 'Descrição não disponível';
  };

  const getSafeLocality = (): string => {
    return hotel.locality || hotel.province || 'Localização não disponível';
  };

  // ✅ CORREÇÃO: Dados seguros
  const safeRating = getSafeRating();
  const safeTotalReviews = getSafeTotalReviews();
  const safeDescription = getSafeDescription();
  const safeLocality = getSafeLocality();
  
  // ✅ CORREÇÃO: Determinar URL da imagem
  const getImageUrl = () => {
    if (loadingPhotos) {
      return null; // Vai mostrar loading
    }
    
    if (photos.length > 0) {
      return photos[0].url;
    }
    
    // Fallback para images antigas (caso existam)
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0];
    }
    
    return null; // Sem imagem
  };

  const imageUrl = getImageUrl();
  const hasImage = imageUrl && !imgError;

  // ✅ CORREÇÃO: Tratar erro de imagem sem loop infinito
  const handleImageError = () => {
    if (!imgError) {
      console.log(`❌ Erro ao carregar imagem do hotel ${hotel.name}`);
      setImgError(true);
    }
  };

  // ✅ CORREÇÃO: MinPrice seguro
  const safeMinPrice = minPrice || parseInt(hotel.base_price || '0') || 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagem Hero */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {loadingPhotos ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          </div>
        ) : hasImage ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Hotel'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Sem imagem</span>
          </div>
        )}

        {/* Gradient Overlay - só se tiver imagem */}
        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        )}

        {/* Rating Badge */}
        {safeRating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg shadow-sm">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-dark">
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

        {/* ✅ Contador de fotos */}
        {photos.length > 1 && hasImage && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
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

        {/* Reviews count */}
        {safeTotalReviews > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {safeTotalReviews.toLocaleString()} {safeTotalReviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        )}

        {/* Descrição curta */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {safeDescription}
        </p>

        {/* Preço */}
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