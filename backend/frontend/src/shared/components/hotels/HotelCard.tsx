/**
 * src/shared/components/hotels/HotelCard.tsx
 * Card moderno de hotel para listagem em busca
 * ✅ CORRIGIDO: Navegação por setas funcionando
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Heart, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Carregar fotos do hotel
  useEffect(() => {
    const loadHotelPhotos = async () => {
      try {
        setLoadingPhotos(true);
        console.log(`📸 Carregando fotos para hotel ${hotel.id} - ${hotel.name}`);
        
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

  // Resetar índice quando as fotos mudam
  useEffect(() => {
    setCurrentPhotoIndex(0);
    setImgError(false);
  }, [photos]);

  // ✅ CORREÇÃO: Handlers de navegação simplificados
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👈 Clicou na seta esquerda, índice atual:', currentPhotoIndex);
    
    if (photos.length > 0) {
      const newIndex = currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1;
      console.log('👉 Novo índice:', newIndex);
      setCurrentPhotoIndex(newIndex);
      setImgError(false); // Resetar erro ao mudar de foto
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👉 Clicou na seta direita, índice atual:', currentPhotoIndex);
    
    if (photos.length > 0) {
      const newIndex = currentPhotoIndex === photos.length - 1 ? 0 : currentPhotoIndex + 1;
      console.log('👈 Novo índice:', newIndex);
      setCurrentPhotoIndex(newIndex);
      setImgError(false); // Resetar erro ao mudar de foto
    }
  };

  // Funções auxiliares
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

  const safeRating = getSafeRating();
  const safeTotalReviews = getSafeTotalReviews();
  const safeDescription = getSafeDescription();
  const safeLocality = getSafeLocality();
  
  // Determinar URL da imagem atual
  const getCurrentImageUrl = () => {
    if (loadingPhotos) {
      return null;
    }
    
    if (photos.length > 0) {
      return photos[currentPhotoIndex].url;
    }
    
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0];
    }
    
    return null;
  };

  const currentImageUrl = getCurrentImageUrl();
  const hasImage = currentImageUrl && !imgError;

  const handleImageError = () => {
    if (!imgError) {
      console.log(`❌ Erro ao carregar imagem ${currentPhotoIndex + 1} do hotel ${hotel.name}`);
      setImgError(true);
    }
  };

  const safeMinPrice = minPrice || parseInt(hotel.base_price || '0') || 0;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 hotel-card">
      {/* Imagem Hero com navegação */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {loadingPhotos ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          </div>
        ) : hasImage ? (
          <>
            <img
              src={currentImageUrl}
              alt={`${hotel.name || 'Hotel'} - foto ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
              key={currentPhotoIndex} // Forçar recarga ao mudar índice
            />
            
            {/* ✅ CORREÇÃO: Setas com z-index alto e handlers diretos */}
            {photos.length > 1 && (
              <>
                {/* Seta esquerda */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-start pl-2 cursor-pointer z-20"
                  onClick={handlePrevPhoto}
                >
                  <div className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                </div>
                
                {/* Seta direita */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-end pr-2 cursor-pointer z-20"
                  onClick={handleNextPhoto}
                >
                  <div className="bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Indicador de posição */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-20">
                  {currentPhotoIndex + 1}/{photos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Sem imagem</span>
          </div>
        )}

        {/* Gradient Overlay */}
        {hasImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
        )}

        {/* Rating Badge */}
        {safeRating > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg shadow-sm z-10">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-dark">
              {safeRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(hotel.id);
            }}
            className="absolute top-3 right-3 p-2 bg-white/95 rounded-full hover:bg-white transition-colors z-10"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-alert text-alert' : 'text-gray-400'}`}
            />
          </button>
        )}

        {/* Badges adicionais */}
        {(hotel as any).is_featured && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge className="bg-alert text-white">Mais reservado</Badge>
          </div>
        )}
      </div>

      {/* Informações do Hotel (restante permanece igual) */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-dark line-clamp-2 mb-1">
            {hotel.name || 'Hotel sem nome'}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{safeLocality}</span>
          </div>
        </div>

        {safeTotalReviews > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            {safeTotalReviews.toLocaleString()} {safeTotalReviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {safeDescription}
        </p>

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

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onViewDetails?.(hotel.id);
            }}
            asChild
          >
            <Link href={`/hotels/${hotel.id}`}>Ver detalhes</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-dark"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBook?.(hotel.id);
            }}
          >
            Reservar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;