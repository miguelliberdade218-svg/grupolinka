/**
 * src/apps/main-app/components/EventSpacePhotoGallery.tsx
 * Galeria de fotos profissional para espaços de eventos
 * Versão: 16/02/2026
 * 
 * Modo "preview": Mostra apenas fotos destacadas (para resultados)
 * Modo "full": Mostra todas as fotos com navegação completa (para detalhes)
 * Modo "grid": Mostra todas as fotos em grade
 * 
 * ✅ CORREÇÃO: Adicionado fallback de imagem local (data URL)
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Star } from 'lucide-react';
import type { EventSpacePhoto } from '@/services/eventSpacePhotoService';

interface EventSpacePhotoGalleryProps {
  photos: EventSpacePhoto[];
  title?: string;
  mode?: 'preview' | 'full' | 'grid';
  onPhotoSelect?: (photo: EventSpacePhoto) => void;
  className?: string;
}

// ============================================
// ✅ FUNÇÃO AUXILIAR: Gerar fallback de imagem local
// ============================================
const generateFallbackImage = (text: string): string => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='400' y='300' font-family='system-ui, sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};

/**
 * Galeria em modo grid (múltiplas fotos)
 */
const GridMode: React.FC<EventSpacePhotoGalleryProps> = ({
  photos,
  onPhotoSelect,
  className,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos.length) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Sem fotos disponíveis</p>
      </div>
    );
  }

  const selected = selectedIndex !== null ? photos[selectedIndex] : null;

  return (
    <>
      {/* Grid de Fotos */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => {
              setSelectedIndex(index);
              onPhotoSelect?.(photo);
            }}
            className="relative group overflow-hidden rounded-lg aspect-video bg-gray-100"
          >
            <img
              src={photo.url}
              alt={photo.alt_text || ''}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // ✅ Fallback LOCAL em caso de erro
                (e.target as HTMLImageElement).src = generateFallbackImage('Imagem não disponível');
              }}
            />
            
            {/* Overlay ao hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="text-white" size={32} />
            </div>

            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                Principal
              </div>
            )}
            
            {photo.is_featured && !photo.is_primary && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Destaque
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Modal Lightbox */}
      {selected && selectedIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={(index) => setSelectedIndex(index)}
        />
      )}
    </>
  );
};

/**
 * Galeria em modo preview (uma foto)
 */
const PreviewMode: React.FC<EventSpacePhotoGalleryProps> = ({
  photos,
  title,
  onPhotoSelect,
  className,
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const mainPhoto = photos[0];

  if (!mainPhoto) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">Sem fotos disponíveis</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowGallery(true)}
        className={`relative group w-full overflow-hidden rounded-lg aspect-video bg-gray-100 ${className}`}
      >
        <img
          src={mainPhoto.url}
          alt={mainPhoto.alt_text || ''}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // ✅ Fallback LOCAL em caso de erro
            (e.target as HTMLImageElement).src = generateFallbackImage(title || 'Imagem');
          }}
        />

        {/* Overlay com chamada para ação */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
            <Maximize2 size={20} />
            Ver galeria
          </div>
        </div>

        {/* Badge de quantidade de fotos */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium">
            +{photos.length - 1} fotos
          </div>
        )}

        {/* Badge de destaque */}
        {mainPhoto.is_featured && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Destaque
          </div>
        )}
        
        {/* Badge de principal */}
        {mainPhoto.is_primary && (
          <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Principal
          </div>
        )}
      </button>

      {/* Modal Galeria */}
      {showGallery && (
        <PhotoLightbox
          photos={photos}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
          title={title}
        />
      )}
    </>
  );
};

/**
 * Modo full - para visualização em página de detalhes
 */
const FullMode: React.FC<EventSpacePhotoGalleryProps> = ({
  photos,
  title,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-500">Sem fotos disponíveis</p>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className={className}>
      {/* Viewer Principal */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video mb-4 flex items-center justify-center group">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.alt_text || ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            // ✅ Fallback LOCAL em caso de erro
            (e.target as HTMLImageElement).src = generateFallbackImage(title || 'Imagem');
          }}
        />

        {/* Navegação */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
              aria-label="Próxima foto"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        {/* Contador */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Badge de principal */}
        {currentPhoto.is_primary && (
          <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Principal
          </div>
        )}
      </div>

      {/* Títulos e Info */}
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      )}
      
      {currentPhoto.alt_text && (
        <p className="text-gray-600 text-sm mb-4">{currentPhoto.alt_text}</p>
      )}

      {/* Thumbnails (Strip inferior) */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 relative w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex
                  ? 'border-orange-600 scale-105'
                  : 'border-gray-300 hover:border-orange-400'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt_text || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // ✅ Fallback LOCAL em caso de erro
                  (e.target as HTMLImageElement).src = generateFallbackImage('Erro');
                }}
              />
              {photo.is_primary && (
                <div className="absolute top-1 right-1 bg-orange-600 text-white rounded-full p-0.5">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Lightbox para visualização em tela cheia
 */
interface PhotoLightboxProps {
  photos: EventSpacePhoto[];
  initialIndex: number;
  onClose: () => void;
  onNavigate?: (index: number) => void;
  title?: string;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  initialIndex,
  onClose,
  onNavigate,
  title,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onNavigate?.(newIndex);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      {/* Botão Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition"
        aria-label="Fechar galeria"
      >
        <X size={32} />
      </button>

      {/* Título */}
      {title && (
        <div className="absolute top-4 left-4 text-white">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      )}

      {/* Imagem Principal */}
      <div className="relative w-full max-w-4xl h-[70vh] mb-4 flex items-center justify-center">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.alt_text || ''}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            // ✅ Fallback LOCAL em caso de erro
            (e.target as HTMLImageElement).src = generateFallbackImage(title || 'Imagem');
          }}
        />

        {/* Navegação */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-orange-400 transition"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={48} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-white hover:text-orange-400 transition"
              aria-label="Próxima foto"
            >
              <ChevronRight size={48} />
            </button>
          </>
        )}

        {/* Contador */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Badge de principal */}
        {currentPhoto.is_primary && (
          <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            Principal
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto max-w-4xl">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => {
                setCurrentIndex(index);
                onNavigate?.(index);
              }}
              className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex ? 'border-orange-500' : 'border-gray-600'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt_text || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // ✅ Fallback LOCAL em caso de erro
                  (e.target as HTMLImageElement).src = generateFallbackImage('Erro');
                }}
              />
              {photo.is_primary && (
                <div className="absolute top-1 right-1 bg-orange-600 text-white rounded-full p-0.5">
                  <Star size={8} fill="currentColor" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Componente principal com seleção automática de modo
 */
export const EventSpacePhotoGallery: React.FC<EventSpacePhotoGalleryProps> = ({
  photos,
  mode = 'preview',
  ...props
}) => {
  switch (mode) {
    case 'grid':
      return <GridMode photos={photos} {...props} />;
    case 'full':
      return <FullMode photos={photos} {...props} />;
    case 'preview':
    default:
      return <PreviewMode photos={photos} {...props} />;
  }
};

export default EventSpacePhotoGallery;