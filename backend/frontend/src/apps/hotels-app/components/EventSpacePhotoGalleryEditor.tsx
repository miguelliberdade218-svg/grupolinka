/**
 * src/apps/hotels-app/components/EventSpacePhotoGalleryEditor.tsx
 * Editor de fotos para Event Spaces - VERSÃO CORRIGIDA
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Star, Eye, Upload, Loader2 } from 'lucide-react';
import { eventSpacePhotoService } from '@/services/eventSpacePhotoService';
import type { EventSpacePhoto } from '@/services/eventSpacePhotoService';

interface EventSpacePhotoGalleryEditorProps {
  eventSpaceId: string;
  onPhotosUpdated?: (photos: EventSpacePhoto[]) => void;
}

export const EventSpacePhotoGalleryEditor: React.FC<EventSpacePhotoGalleryEditorProps> = ({
  eventSpaceId,
  onPhotosUpdated,
}) => {
  const [photos, setPhotos] = useState<EventSpacePhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPhotos();
  }, [eventSpaceId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      setImageErrors({});
      console.log('📸 [Editor] Carregando fotos para espaço:', eventSpaceId);
      
      // ✅ CORREÇÃO: Agora a resposta tem success e data
      const response = await eventSpacePhotoService.getEventSpacePhotos(eventSpaceId);
      
      if (response.success && response.data) {
        console.log('📸 [Editor] Fotos carregadas:', response.data.length);
        setPhotos(response.data);
        
        if (currentIndex >= response.data.length) {
          setCurrentIndex(Math.max(0, response.data.length - 1));
        }
        
        onPhotosUpdated?.(response.data);
      } else {
        throw new Error(response.error || 'Falha ao carregar fotos');
      }
    } catch (err) {
      console.error('📸 [Editor] Erro ao carregar fotos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    try {
      setUploading(true);
      setError(null);

      console.log('📸 [Editor] Iniciando upload de', files.length, 'fotos');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📸 [Editor] Enviando arquivo ${i + 1}/${files.length}:`, file.name);
        
        await eventSpacePhotoService.uploadEventSpacePhoto({
          event_space_id: eventSpaceId,
          file,
          is_featured: photos.length === 0 && i === 0,
          is_primary: photos.length === 0 && i === 0,
        });
      }

      console.log('📸 [Editor] Upload concluído, recarregando lista...');
      await loadPhotos();
      
    } catch (err) {
      console.error('📸 [Editor] Erro no upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar esta foto?')) return;

    try {
      setUploading(true);
      const response = await eventSpacePhotoService.deletePhoto(eventSpaceId, photoId);
      
      if (response.success) {
        await loadPhotos();
      } else {
        throw new Error(response.error || 'Falha ao deletar foto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      setUploading(true);
      const response = await eventSpacePhotoService.setPrimaryPhoto(eventSpaceId, photoId);
      
      if (response.success) {
        await loadPhotos();
      } else {
        throw new Error(response.error || 'Falha ao definir foto como principal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleFeatured = async (photoId: string) => {
    try {
      setUploading(true);
      const response = await eventSpacePhotoService.toggleFeaturedPhoto(eventSpaceId, photoId);
      
      if (response.success) {
        await loadPhotos();
      } else {
        throw new Error(response.error || 'Falha ao alternar destaque');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAltText = async (photoId: string, altText: string) => {
    try {
      const response = await eventSpacePhotoService.updatePhoto(eventSpaceId, photoId, {
        alt_text: altText
      });
      
      if (response.success) {
        await loadPhotos();
      } else {
        throw new Error(response.error || 'Falha ao atualizar descrição');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar descrição');
    }
  };

  const handleImageError = (photoId: string, url: string) => {
    console.error('❌ [Editor] Erro ao carregar imagem:', { photoId, url });
    setImageErrors(prev => ({ ...prev, [photoId]: true }));
  };

  const getImageUrl = (photo: EventSpacePhoto): string => {
    if (imageErrors[photo.id]) {
      return 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'800\' height=\'600\' viewBox=\'0 0 800 600\'%3E%3Crect width=\'800\' height=\'600\' fill=\'%23f3f4f6\'/%3E%3Ctext x=\'400\' y=\'300\' font-family=\'system-ui, sans-serif\' font-size=\'24\' fill=\'%236b7280\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3EImagem n%C3%A3o dispon%C3%ADvel%3C/text%3E%3C/svg%3E';
    }
    
    if (photo.url.startsWith('/')) {
      return `http://localhost:8000${photo.url}`;
    }
    
    return photo.url;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const currentPhoto = photos[currentIndex];

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Galeria de Fotos - Event Space</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Visualizador de Foto Atual */}
      {photos.length > 0 ? (
        <div className="mb-6">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video mb-4 flex items-center justify-center">
            <img
              key={currentPhoto?.id}
              src={getImageUrl(currentPhoto)}
              alt={currentPhoto?.alt_text || 'Foto do espaço'}
              className="w-full h-full object-cover"
              onError={() => handleImageError(currentPhoto.id, currentPhoto.url)}
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                  aria-label="Próxima foto"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>

          {/* Controles */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={currentPhoto?.alt_text || ''}
                onChange={(e) => handleUpdateAltText(currentPhoto.id, e.target.value)}
                placeholder="Descreva a foto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />

              <button
                onClick={() => handleSetPrimary(currentPhoto.id)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                  currentPhoto.is_primary
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star size={18} fill={currentPhoto.is_primary ? 'currentColor' : 'none'} />
                Principal
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFeatured(currentPhoto.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                    currentPhoto.is_featured
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye size={18} />
                  {currentPhoto.is_featured ? 'Destacada' : 'Destacar'}
                </button>

                <button
                  onClick={() => handleDeletePhoto(currentPhoto.id)}
                  className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition"
                  title="Deletar foto"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  index === currentIndex ? 'border-orange-600' : 'border-gray-300'
                }`}
              >
                <img
                  src={getImageUrl(photo)}
                  alt={photo.alt_text || ''}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(photo.id, photo.url)}
                />
                {photo.is_primary && (
                  <div className="absolute top-1 right-1 bg-orange-600 text-white rounded-full p-1">
                    <Star size={12} fill="currentColor" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Upload */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive
            ? 'border-orange-600 bg-orange-50'
            : 'border-gray-300 bg-gray-50 hover:border-orange-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          disabled={uploading}
          className="hidden"
          id="event-space-photo-input"
        />

        <label htmlFor="event-space-photo-input" className="cursor-pointer block">
          {uploading ? (
            <>
              <Loader2 className="mx-auto mb-2 text-orange-600 animate-spin" size={32} />
              <p className="text-gray-700">Enviando fotos...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="text-gray-700 font-medium">
                Clique ou arraste fotos aqui
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Máx. 5MB por foto • JPEG, PNG, WebP, GIF
              </p>
            </>
          )}
        </label>
      </div>

      {photos.length === 0 && !uploading && (
        <div className="text-center text-gray-500 py-8">
          <p>Nenhuma foto adicionada ainda</p>
        </div>
      )}

      {/* Estatísticas */}
      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{photos.length}</div>
            <div className="text-sm text-gray-600">Fotos</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">
              {photos.filter(p => p.is_featured).length}
            </div>
            <div className="text-sm text-gray-600">Destacadas</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">
              {photos.filter(p => p.is_primary).length}
            </div>
            <div className="text-sm text-gray-600">Principal</div>
          </div>
        </div>
      )}
    </div>
  );
};