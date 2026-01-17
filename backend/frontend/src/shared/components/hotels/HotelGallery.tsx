import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ChevronLeftIcon, ChevronRightIcon, X } from 'lucide-react';
import type { RoomType } from '@/shared/types/hotels';

interface HotelGalleryProps {
  images: string[];
  roomTypes?: RoomType[];
  hotelName: string;
  onClose?: () => void;
}

/**
 * Galeria de imagens do hotel com suporte a fotos de quartos
 * Mostra fotos grandes + miniaturas (como Booking.com)
 */
export const HotelGallery: React.FC<HotelGalleryProps> = ({
  images,
  roomTypes = [],
  hotelName,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('hotel');

  const currentImages = activeTab === 'hotel' ? images : roomTypes[0]?.images || [];
  const currentImage = currentImages[currentImageIndex] || images[0];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? currentImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      prev === currentImages.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <Card className="w-full overflow-hidden">
      {/* Imagem Principal com Controles */}
      <div className="relative bg-black min-h-96 lg:min-h-[600px] flex items-center justify-center group">
        <img
          src={currentImage || 'https://via.placeholder.com/800x600'}
          alt={`${hotelName} - Foto ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Botão Fechar */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
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
          </Tabs>
        )}

        {/* Miniaturas */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image || 'https://via.placeholder.com/80x80'}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Botão Ver todas as fotos */}
        <Button
          variant="outline"
          className="w-full mt-4 border-primary text-primary hover:bg-primary/5"
        >
          Ver todas as {currentImages.length} fotos
        </Button>
      </div>
    </Card>
  );
};

export default HotelGallery;
