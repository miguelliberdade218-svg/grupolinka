/**
 * src/shared/components/hotels/HotelGallery.tsx
 * Galeria de imagens do hotel com suporte a fotos de quartos
 * ✅ CORRIGIDO: Agora usa photoGalleryService para carregar fotos reais
 * ✅ CORRIGIDO: Suporte a fotos de quartos por tipo
 * ✅ CORRIGIDO: Fallback de imagem local
 * ✅ ADICIONADO: Logs de debug
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ChevronLeftIcon, ChevronRightIcon, X, Loader2 } from 'lucide-react';
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { photoGalleryService } from '@/services/photoGalleryService';
import type { RoomType } from '@/shared/types/hotels';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

interface HotelGalleryProps {
  hotelId: string;
  images: string[];
  roomTypes?: RoomType[];
  hotelName: string;
  onClose?: () => void;
}

// Função auxiliar para fallback de imagem local
const generateFallbackImage = (text: string): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='400' y='300' font-family='system-ui, sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

export const HotelGallery: React.FC<HotelGalleryProps> = ({
  hotelId,
  images,
  roomTypes = [],
  hotelName,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('hotel');
  const [hotelPhotos, setHotelPhotos] = useState<RoomTypePhoto[]>([]);
  const [roomTypePhotos, setRoomTypePhotos] = useState<Record<string, RoomTypePhoto[]>>({});
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Log de montagem do componente
  console.log('🏨 [HotelGallery] Componente montado com props:', {
    hotelId,
    imagesCount: images?.length,
    roomTypesCount: roomTypes?.length,
    hotelName
  });

  // Carregar fotos do hotel
  useEffect(() => {
    console.log('🏨 [HotelGallery] useEffect executado com hotelId:', hotelId);
    
    const loadHotelPhotos = async () => {
      if (!hotelId) {
        console.log('❌ [HotelGallery] hotelId não fornecido');
        return;
      }
      
      setLoading(true);
      console.log('📸 [HotelGallery] Iniciando carregamento de fotos para hotel:', hotelId);
      
      try {
        const photos = await photoGalleryService.getHotelPhotos(hotelId);
        console.log(`📸 [HotelGallery] Resposta do serviço:`, photos);
        console.log(`📸 [HotelGallery] ${photos.length} fotos carregadas`);
        setHotelPhotos(photos);
      } catch (error) {
        console.error('❌ [HotelGallery] Erro ao carregar fotos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHotelPhotos();
  }, [hotelId]);

  // Carregar fotos dos room types
  useEffect(() => {
    const loadRoomTypePhotos = async () => {
      if (!roomTypes.length) {
        console.log('📸 [HotelGallery] Nenhum room type para carregar fotos');
        return;
      }

      console.log(`📸 [HotelGallery] Carregando fotos para ${roomTypes.length} room types`);
      const photosMap: Record<string, RoomTypePhoto[]> = {};
      
      for (const room of roomTypes) {
        try {
          console.log(`📸 [HotelGallery] Carregando fotos do room type ${room.id}:`, room.name);
          const photos = await photoGalleryService.getRoomTypePhotos(room.id);
          photosMap[room.id] = photos;
          console.log(`📸 [HotelGallery] ${photos.length} fotos carregadas para ${room.name}`);
        } catch (error) {
          console.error(`❌ [HotelGallery] Erro ao carregar fotos do room type ${room.id}:`, error);
          photosMap[room.id] = [];
        }
      }
      
      setRoomTypePhotos(photosMap);
    };

    loadRoomTypePhotos();
  }, [roomTypes]);

  // Determinar as imagens atuais baseado na tab ativa
  const getCurrentImages = (): string[] => {
    console.log('📸 [HotelGallery] getCurrentImages - activeTab:', activeTab);
    
    if (activeTab === 'hotel') {
      // Prioridade: fotos do serviço > images do hotel
      if (hotelPhotos.length > 0) {
        console.log(`📸 [HotelGallery] Usando ${hotelPhotos.length} fotos do serviço para o hotel`);
        return hotelPhotos.map(p => p.url.startsWith('/') ? `http://localhost:8000${p.url}` : p.url);
      }
      console.log(`📸 [HotelGallery] Usando ${images.length} imagens de fallback do hotel`);
      return images.map(img => img.startsWith('/') ? `http://localhost:8000${img}` : img);
    } else {
      // Tab de quartos - mostrar fotos do primeiro room type
      const firstRoom = roomTypes[0];
      if (firstRoom && roomTypePhotos[firstRoom.id]?.length > 0) {
        console.log(`📸 [HotelGallery] Usando ${roomTypePhotos[firstRoom.id].length} fotos do room type ${firstRoom.name}`);
        return roomTypePhotos[firstRoom.id].map(p => 
          p.url.startsWith('/') ? `http://localhost:8000${p.url}` : p.url
        );
      }
      if (firstRoom?.images?.length > 0) {
        console.log(`📸 [HotelGallery] Usando ${firstRoom.images.length} imagens de fallback do room type`);
        return firstRoom.images.map(img => img.startsWith('/') ? `http://localhost:8000${img}` : img);
      }
      console.log('📸 [HotelGallery] Nenhuma imagem encontrada para a tab de quartos');
      return [];
    }
  };

  const currentImages = getCurrentImages();
  const hasImages = currentImages.length > 0;

  console.log('🏨 [HotelGallery] Renderizando - loading:', loading, 'hasImages:', hasImages, 'currentImages:', currentImages.length);

  // Se não houver imagens, mostrar mensagem
  if (!hasImages && !loading) {
    return (
      <Card className="w-full overflow-hidden">
        <div className="bg-gray-100 min-h-96 lg:min-h-[600px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Nenhuma foto disponível</p>
          </div>
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full overflow-hidden">
        <div className="bg-gray-100 min-h-96 lg:min-h-[600px] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
      </Card>
    );
  }

  const currentImage = currentImages[currentImageIndex] || generateFallbackImage(hotelName);

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? currentImages.length - 1 : prev - 1
    );
    setImageErrors({}); // Reset errors ao mudar de imagem
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === currentImages.length - 1 ? 0 : prev + 1
    );
    setImageErrors({}); // Reset errors ao mudar de imagem
  };

  const handleImageError = (index: number) => {
    console.log(`❌ [HotelGallery] Erro ao carregar imagem ${index}:`, currentImages[index]);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Card className="w-full overflow-hidden">
      {/* Imagem Principal com Controles */}
      <div className="relative bg-black min-h-96 lg:min-h-[600px] flex items-center justify-center group">
        <img
          src={imageErrors[currentImageIndex] ? generateFallbackImage(hotelName) : currentImage}
          alt={`${hotelName} - Foto ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
          onError={() => handleImageError(currentImageIndex)}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Botão Fechar */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Controles de Navegação */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Contador de Fotos */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
          {currentImageIndex + 1} / {currentImages.length}
        </div>
      </div>

      {/* Miniaturas e Tabs */}
      <div className="bg-white p-4">
        {roomTypes.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hotel">Hotel</TabsTrigger>
              <TabsTrigger value="rooms">Quartos</TabsTrigger>
            </TabsList>

            {/* Seção de seleção de quarto (quando na tab rooms) */}
            {activeTab === 'rooms' && roomTypes.length > 1 && (
              <div className="mt-4 mb-2">
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  onChange={(e) => {
                    const roomId = e.target.value;
                    console.log('📸 [HotelGallery] Selecionado room type:', roomId);
                    const room = roomTypes.find(r => r.id === roomId);
                    if (room && roomTypePhotos[room.id]?.length > 0) {
                      console.log(`📸 [HotelGallery] Room type ${room.name} tem ${roomTypePhotos[room.id].length} fotos`);
                      setCurrentImageIndex(0);
                    }
                  }}
                >
                  {roomTypes.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({roomTypePhotos[room.id]?.length || 0} fotos)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Tabs>
        )}

        {/* Miniaturas */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImageIndex ? 'border-orange-600' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log(`❌ [HotelGallery] Erro na miniatura ${index}:`, image);
                  (e.target as HTMLImageElement).src = generateFallbackImage('Foto');
                }}
              />
            </button>
          ))}
        </div>

        {/* Botão Ver todas as fotos - abre lightbox */}
        <Button
          variant="outline"
          className="w-full mt-4 border-orange-600 text-orange-600 hover:bg-orange-50"
          onClick={() => {
            // Abrir lightbox com HotelPhotoGallery
            const galleryPhotos = currentImages.map((url, index) => ({
              id: `${activeTab}-${index}`,
              url,
              alt_text: `${hotelName} - Foto ${index + 1}`,
              is_primary: index === 0,
              is_featured: false,
              order: index,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            
            console.log('📸 [HotelGallery] Abrir galeria completa com', galleryPhotos.length, 'fotos');
            // Aqui você pode implementar um modal com HotelPhotoGallery
          }}
        >
          Ver todas as {currentImages.length} fotos
        </Button>
      </div>
    </Card>
  );
};

export default HotelGallery;