import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, Users, Ruler, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RoomType } from '@/shared/types/hotels';
import { getRoomTypePhotos } from '@/services/photoGalleryService';

interface RoomTypeCardProps {
  room: RoomType;
  pricePerNight?: number;
  available?: boolean;
  onSelect?: (roomId: string) => void;
  isSelected?: boolean;
}

/**
 * Card de tipo de quarto para página de detalhes do hotel
 */
export const RoomTypeCard: React.FC<RoomTypeCardProps> = ({
  room,
  pricePerNight,
  available = true,
  onSelect,
  isSelected = false,
}) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Carregar fotos do quarto
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true);
        console.log(`🖼️ Carregando fotos para quarto ${room.id} - ${room.name}`);
        
        // Tentar carregar do serviço de fotos
        const roomPhotos = await getRoomTypePhotos(room.id);
        
        if (roomPhotos && roomPhotos.length > 0) {
          // Extrair URLs das fotos
          const photoUrls = roomPhotos.map(photo => photo.url);
          setPhotos(photoUrls);
          console.log(`✅ ${photoUrls.length} fotos carregadas para ${room.name}`);
        } else if (room.images && room.images.length > 0) {
          // Fallback para images do room type
          console.log(`📸 Usando images do room type: ${room.images.length} fotos`);
          setPhotos(room.images);
        } else {
          console.log(`ℹ️ Nenhuma foto encontrada para ${room.name}`);
          setPhotos([]);
        }
      } catch (error) {
        console.error(`❌ Erro ao carregar fotos para ${room.name}:`, error);
        
        // Fallback para images do room type
        if (room.images && room.images.length > 0) {
          setPhotos(room.images);
        } else {
          setPhotos([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [room.id, room.name, room.images]);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const currentPhoto = photos.length > 0 
    ? photos[currentPhotoIndex] 
    : 'https://via.placeholder.com/300x200?text=Sem+Imagem';

  return (
    <Card
      className={`overflow-hidden transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      } ${!available ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={() => onSelect?.(room.id)}
    >
      <div className="md:flex">
        {/* Imagem com navegação */}
        <div className="md:w-48 flex-shrink-0 relative group">
          {loading ? (
            <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <>
              <img
                src={currentPhoto}
                alt={`${room.name} - foto ${currentPhotoIndex + 1}`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  console.log(`❌ Erro ao carregar imagem: ${currentPhoto}`);
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Erro+ao+carregar';
                }}
              />
              
              {/* Indicador de múltiplas fotos */}
              {photos.length > 1 && (
                <>
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
                      onClick={handlePrevPhoto}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mr-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
                      onClick={handleNextPhoto}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Contador de fotos */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {currentPhotoIndex + 1}/{photos.length}
                  </div>
                </>
              )}
              
              {/* Badge de destaque para foto principal */}
              {photos.length > 0 && currentPhotoIndex === 0 && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary text-white text-xs">Principal</Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* Informações */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark">{room.name}</h3>
              {!available && <Badge className="bg-red-500 text-white">Indisponível</Badge>}
              {photos.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{room.description}</p>

            {/* Características */}
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Até {room.capacity} hóspedes</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <span>Ocupação base: {room.base_occupancy}</span>
              </div>
            </div>

            {/* Comodidades */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, 3).map((amenity: string) => (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Preço e Botão */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div>
              {pricePerNight ? (
                <>
                  <p className="text-xs text-muted-foreground">Por noite</p>
                  <p className="text-2xl font-bold text-primary">
                    {pricePerNight.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground"> MZN</span>
                  </p>
                </>
              ) : room.base_price && (
                <>
                  <p className="text-xs text-muted-foreground">A partir de</p>
                  <p className="text-2xl font-bold text-primary">
                    {Number(room.base_price).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground"> MZN</span>
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(room.id);
              }}
              disabled={!available}
              className={`${
                isSelected
                  ? 'bg-secondary hover:bg-secondary/90'
                  : 'bg-primary hover:bg-primary/90'
              } text-dark`}
            >
              {isSelected ? 'Selecionado' : 'Selecionar'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RoomTypeCard;