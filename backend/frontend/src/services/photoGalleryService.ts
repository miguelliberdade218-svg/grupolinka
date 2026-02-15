/**
 * src/services/photoGalleryService.ts
 * Serviço para gerenciamento de galerias de fotos de hotéis
 * Versão: 14/02/2026 - CORRIGIDO COM TIPAGEM CORRETA
 * 
 * Responsabilidades:
 * - Upload de múltiplas fotos
 * - Reordenação de fotos
 * - Atualização de meta-dados (featured, primary, alt_text)
 * - Deleção de fotos
 * - Busca de fotos por room type ou hotel
 */

import { apiService } from './api';
import type {
  RoomTypePhoto,
  RoomTypePhotoUploadRequest,
  RoomTypePhotoUpdateRequest,
  HotelWithPhotos,
  RoomTypeWithPhotos,
} from '@/shared/types/hotel-photos';

// Tipos de resposta da API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const photoGalleryService = {
  // ==================== UPLOAD ====================

  /**
   * Upload de uma foto para um room type
   */
  async uploadRoomTypePhoto(request: RoomTypePhotoUploadRequest): Promise<RoomTypePhoto> {
    try {
      console.log('📸 [DEBUG] ===== INÍCIO UPLOAD =====');
      console.log('📸 [DEBUG] roomTypeId:', request.room_type_id);
      console.log('📸 [DEBUG] Arquivo:', {
        name: request.file.name,
        type: request.file.type,
        size: request.file.size,
        lastModified: new Date(request.file.lastModified).toISOString()
      });

      // Criar FormData
      const formData = new FormData();
      
      // ✅ CORREÇÃO: Usar 'photo' em vez de 'file' para corresponder ao backend
      formData.append('photo', request.file);
      console.log('📸 [DEBUG] Campo "photo" adicionado ao FormData');
      
      if (request.alt_text) {
        formData.append('alt_text', request.alt_text);
        console.log('📸 [DEBUG] alt_text adicionado:', request.alt_text);
      }
      
      if (request.is_featured !== undefined) {
        formData.append('is_featured', String(request.is_featured));
        console.log('📸 [DEBUG] is_featured adicionado:', request.is_featured);
      }
      
      if (request.is_primary !== undefined) {
        formData.append('is_primary', String(request.is_primary));
        console.log('📸 [DEBUG] is_primary adicionado:', request.is_primary);
      }

      // Log do conteúdo do FormData
      console.log('📸 [DEBUG] Conteúdo do FormData:');
      for (let pair of (formData as any).entries()) {
        if (pair[0] === 'photo') {
          console.log(`  - ${pair[0]}: [Arquivo: ${pair[1].name}, tipo: ${pair[1].type}, tamanho: ${pair[1].size} bytes]`);
        } else {
          console.log(`  - ${pair[0]}: ${pair[1]}`);
        }
      }

      const token = localStorage.getItem('token');
      console.log('📸 [DEBUG] Token presente:', !!token);
      if (token) {
        console.log('📸 [DEBUG] Token (primeiros 20 chars):', token.substring(0, 20) + '...');
      }

      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const url = `${baseURL}/api/hotels/room-types/${request.room_type_id}/photos`;
      console.log('📸 [DEBUG] URL:', url);

      // Usar fetch diretamente com mais headers
      console.log('📸 [DEBUG] Enviando requisição...');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NÃO incluir Content-Type! O navegador vai definir automaticamente com o boundary correto
        },
        body: formData,
      });

      console.log('📸 [DEBUG] Status da resposta:', response.status);
      console.log('📸 [DEBUG] Status text:', response.statusText);
      console.log('📸 [DEBUG] Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📸 [DEBUG] Erro do servidor:', errorText);
        console.error('📸 [DEBUG] Status code:', response.status);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as ApiResponse<RoomTypePhoto>;
      console.log('📸 [DEBUG] Resposta do servidor (sucesso):', result);
      console.log('📸 [DEBUG] ===== FIM UPLOAD (SUCESSO) =====\n');
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Falha ao fazer upload da foto');
      }

      // ✅ CORREÇÃO: Adicionar baseURL à URL da foto retornada
      const photo = result.data;
      return {
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      };
    } catch (error) {
      console.error('📸 [DEBUG] ===== FIM UPLOAD (ERRO) =====');
      console.error('[uploadRoomTypePhoto] Erro detalhado:', error);
      if (error instanceof Error) {
        console.error('📸 [DEBUG] Mensagem:', error.message);
        console.error('📸 [DEBUG] Stack:', error.stack);
      }
      throw error;
    }
  },

  /**
   * Upload de múltiplas fotos em paralelo
   */
  async uploadMultiplePhotos(
    roomTypeId: string,
    files: File[],
    options?: { is_featured?: boolean; is_primary?: boolean }
  ): Promise<RoomTypePhoto[]> {
    try {
      console.log('📸 [DEBUG] Upload múltiplo iniciado:', {
        roomTypeId,
        totalFiles: files.length,
        options
      });

      const uploadPromises = files.map(async (file, index) => {
        console.log(`📸 [DEBUG] Preparando upload do arquivo ${index + 1}/${files.length}:`, file.name);
        return this.uploadRoomTypePhoto({
          room_type_id: roomTypeId,
          file,
          is_featured: options?.is_featured || index === 0,
          is_primary: options?.is_primary || index === 0,
        });
      });

      const results = await Promise.all(uploadPromises);
      console.log('📸 [DEBUG] Upload múltiplo concluído:', results.length, 'arquivos enviados');
      return results;
    } catch (error) {
      console.error('[uploadMultiplePhotos]', error);
      throw error;
    }
  },

  // ==================== LEITURA ====================

  /**
   * Obter todas as fotos de um room type
   */
  async getRoomTypePhotos(roomTypeId: string): Promise<RoomTypePhoto[]> {
    try {
      console.log('📸 [DEBUG] Buscando fotos do room type:', roomTypeId);
      const response = await apiService.get<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/room-types/${roomTypeId}/photos`
      );

      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar fotos');
      }

      console.log('📸 [DEBUG] Fotos encontradas (cruas):', response.data?.length || 0);
      
      // ✅ CORREÇÃO: Adicionar baseURL às URLs das fotos
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photos = (response.data || []).map(photo => {
        // Se a URL já for completa (http://...), mantém, senão adiciona o baseURL
        const fullUrl = photo.url.startsWith('http') 
          ? photo.url 
          : `${baseURL}${photo.url.startsWith('/') ? photo.url : '/' + photo.url}`;
        
        console.log('📸 [DEBUG] URL original:', photo.url);
        console.log('📸 [DEBUG] URL completa:', fullUrl);
        
        return {
          ...photo,
          url: fullUrl
        };
      });
      
      console.log('📸 [DEBUG] Fotos processadas:', photos.length);
      return photos;
    } catch (error) {
      console.error('[getRoomTypePhotos]', error);
      throw error;
    }
  },

  /**
   * Obter apenas fotos destacadas (featured) de um room type
   */
  async getFeaturedPhotos(roomTypeId: string): Promise<RoomTypePhoto[]> {
    const all = await this.getRoomTypePhotos(roomTypeId);
    return all.filter(p => p.is_featured);
  },

  /**
   * Obter foto principal (primary) de um room type
   */
  async getPrimaryPhoto(roomTypeId: string): Promise<RoomTypePhoto | null> {
    const all = await this.getRoomTypePhotos(roomTypeId);
    return all.find(p => p.is_primary) || all[0] || null;
  },

  /**
   * Obter fotos de um hotel (agregando de todos os room types)
   */
  async getHotelPhotos(hotelId: string): Promise<RoomTypePhoto[]> {
    try {
      console.log('📸 [DEBUG] Buscando fotos do hotel:', hotelId);
      const response = await apiService.get<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/${hotelId}/photos`
      );

      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar fotos do hotel');
      }

      console.log('📸 [DEBUG] Fotos do hotel encontradas (cruas):', response.data?.length || 0);
      
      // ✅ CORREÇÃO: Adicionar baseURL às URLs das fotos
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photos = (response.data || []).map(photo => ({
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      }));
      
      console.log('📸 [DEBUG] Fotos do hotel processadas:', photos.length);
      return photos;
    } catch (error) {
      console.error('[getHotelPhotos]', error);
      throw error;
    }
  },

  /**
   * Obter apenas fotos destacadas de um hotel
   */
  async getHotelFeaturedPhotos(hotelId: string): Promise<RoomTypePhoto[]> {
    try {
      const response = await apiService.get<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/${hotelId}/photos/featured`
      );

      if (!response.success) {
        throw new Error(response.error || 'Falha ao carregar fotos destacadas');
      }

      // ✅ CORREÇÃO: Adicionar baseURL às URLs das fotos
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photos = (response.data || []).map(photo => ({
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      }));

      return photos;
    } catch (error) {
      console.error('[getHotelFeaturedPhotos]', error);
      throw error;
    }
  },

  /**
   * Obter hotel com todas as suas fotos organizadas
   * ✅ CORREÇÃO: Não tenta modificar o tipo HotelWithPhotos, apenas retorna os dados
   */
  async getHotelWithPhotos(hotelId: string): Promise<HotelWithPhotos> {
    try {
      const response = await apiService.get<ApiResponse<HotelWithPhotos>>(
        `/api/hotels/${hotelId}/with-photos`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao carregar hotel com fotos');
      }

      // ✅ CORREÇÃO: Retorna os dados exatamente como vêm do backend
      // O backend já deve retornar as URLs completas
      return response.data;
    } catch (error) {
      console.error('[getHotelWithPhotos]', error);
      throw error;
    }
  },

  /**
   * Obter room type com todas as suas fotos organizadas
   */
  async getRoomTypeWithPhotos(roomTypeId: string): Promise<RoomTypeWithPhotos> {
    try {
      const response = await apiService.get<ApiResponse<RoomTypeWithPhotos>>(
        `/api/hotels/room-types/${roomTypeId}/with-photos`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao carregar room type com fotos');
      }

      // ✅ CORREÇÃO: Adicionar baseURL às URLs das fotos
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const data = response.data;
      
      // Verificar se data existe e tem a propriedade photos
      if (data && 'photos' in data && Array.isArray(data.photos)) {
        data.photos = data.photos.map(photo => ({
          ...photo,
          url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
        }));
      }

      return data;
    } catch (error) {
      console.error('[getRoomTypeWithPhotos]', error);
      throw error;
    }
  },

  // ==================== ATUALIZAÇÃO ====================

  /**
   * Atualizar meta-dados de uma foto
   */
  async updatePhoto(
    roomTypeId: string,
    photoId: string,
    updates: RoomTypePhotoUpdateRequest
  ): Promise<RoomTypePhoto> {
    try {
      console.log('📸 [DEBUG] Atualizando foto:', { roomTypeId, photoId, updates });
      const response = await apiService.put<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`,
        updates
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao atualizar foto');
      }

      // ✅ CORREÇÃO: Adicionar baseURL à URL da foto retornada
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photo = response.data;
      
      return {
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      };
    } catch (error) {
      console.error('[updatePhoto]', error);
      throw error;
    }
  },

  /**
   * Definir foto como principal
   */
  async setPrimaryPhoto(roomTypeId: string, photoId: string): Promise<RoomTypePhoto> {
    return this.updatePhoto(roomTypeId, photoId, { is_primary: true });
  },

  /**
   * Alternar foto como destacada
   */
  async toggleFeaturedPhoto(roomTypeId: string, photoId: string): Promise<RoomTypePhoto> {
    try {
      const response = await apiService.patch<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}/toggle-featured`,
        {}
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao alternar destaque');
      }

      // ✅ CORREÇÃO: Adicionar baseURL à URL da foto retornada
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photo = response.data;
      
      return {
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      };
    } catch (error) {
      console.error('[toggleFeaturedPhoto]', error);
      throw error;
    }
  },

  /**
   * Reordenar fotos de um room type
   */
  async reorderPhotos(roomTypeId: string, photoIds: string[]): Promise<RoomTypePhoto[]> {
    try {
      console.log('📸 [DEBUG] Reordenando fotos:', { roomTypeId, photoIds });
      const response = await apiService.put<ApiResponse<RoomTypePhoto[]>>(
        `/api/hotels/room-types/${roomTypeId}/photos/reorder`,
        { photoIds }
      );

      if (!response.success) {
        throw new Error(response.error || 'Falha ao reordenar fotos');
      }

      // ✅ CORREÇÃO: Adicionar baseURL às URLs das fotos
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photos = (response.data || []).map(photo => ({
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      }));

      return photos;
    } catch (error) {
      console.error('[reorderPhotos]', error);
      throw error;
    }
  },

  // ==================== DELEÇÃO ====================

  /**
   * Deletar uma foto
   */
  async deletePhoto(roomTypeId: string, photoId: string): Promise<void> {
    try {
      console.log('📸 [DEBUG] Deletando foto:', { roomTypeId, photoId });
      const response = await apiService.delete<ApiResponse<null>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`
      );

      if (!response.success) {
        throw new Error(response.error || 'Falha ao deletar foto');
      }
    } catch (error) {
      console.error('[deletePhoto]', error);
      throw error;
    }
  },

  /**
   * Deletar todas as fotos de um room type
   */
  async deleteAllPhotos(roomTypeId: string): Promise<void> {
    const photos = await this.getRoomTypePhotos(roomTypeId);
    await Promise.all(photos.map(p => this.deletePhoto(roomTypeId, p.id)));
  },

  // ==================== HELPERS ====================

  /**
   * Obter uma foto específica
   */
  async getPhoto(roomTypeId: string, photoId: string): Promise<RoomTypePhoto> {
    try {
      const response = await apiService.get<ApiResponse<RoomTypePhoto>>(
        `/api/hotels/room-types/${roomTypeId}/photos/${photoId}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Foto não encontrada');
      }

      // ✅ CORREÇÃO: Adicionar baseURL à URL da foto
      const baseURL = (apiService as any).baseURL || 'http://localhost:8000';
      const photo = response.data;
      
      return {
        ...photo,
        url: photo.url.startsWith('http') ? photo.url : `${baseURL}${photo.url}`
      };
    } catch (error) {
      console.error('[getPhoto]', error);
      throw error;
    }
  },

  /**
   * Validar foto antes de upload
   */
  validatePhotoFile(file: File): { isValid: boolean; error?: string } {
    const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: `Formato não permitido. Formatos aceitos: ${ALLOWED_FORMATS.join(', ')}`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
      };
    }

    return { isValid: true };
  },

  /**
   * Contar fotos de um hotel
   */
  async countHotelPhotos(hotelId: string): Promise<{ total: number; featured: number; withPrimary: boolean }> {
    try {
      const response = await apiService.get<ApiResponse<{ total: number; featured: number; withPrimary: boolean }>>(
        `/api/hotels/${hotelId}/photos/count`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao contar fotos');
      }

      return response.data;
    } catch (error) {
      console.error('[countHotelPhotos]', error);
      return { total: 0, featured: 0, withPrimary: false };
    }
  },
};

// ✅ Exportar as funções individualmente para compatibilidade
export const getRoomTypePhotos = photoGalleryService.getRoomTypePhotos.bind(photoGalleryService);
export const uploadRoomTypePhoto = photoGalleryService.uploadRoomTypePhoto.bind(photoGalleryService);
export const uploadMultiplePhotos = photoGalleryService.uploadMultiplePhotos.bind(photoGalleryService);
export const getFeaturedPhotos = photoGalleryService.getFeaturedPhotos.bind(photoGalleryService);
export const getPrimaryPhoto = photoGalleryService.getPrimaryPhoto.bind(photoGalleryService);
export const getHotelPhotos = photoGalleryService.getHotelPhotos.bind(photoGalleryService);
export const getHotelFeaturedPhotos = photoGalleryService.getHotelFeaturedPhotos.bind(photoGalleryService);
export const getHotelWithPhotos = photoGalleryService.getHotelWithPhotos.bind(photoGalleryService);
export const getRoomTypeWithPhotos = photoGalleryService.getRoomTypeWithPhotos.bind(photoGalleryService);
export const updatePhoto = photoGalleryService.updatePhoto.bind(photoGalleryService);
export const setPrimaryPhoto = photoGalleryService.setPrimaryPhoto.bind(photoGalleryService);
export const toggleFeaturedPhoto = photoGalleryService.toggleFeaturedPhoto.bind(photoGalleryService);
export const reorderPhotos = photoGalleryService.reorderPhotos.bind(photoGalleryService);
export const deletePhoto = photoGalleryService.deletePhoto.bind(photoGalleryService);
export const deleteAllPhotos = photoGalleryService.deleteAllPhotos.bind(photoGalleryService);
export const getPhoto = photoGalleryService.getPhoto.bind(photoGalleryService);
export const validatePhotoFile = photoGalleryService.validatePhotoFile.bind(photoGalleryService);
export const countHotelPhotos = photoGalleryService.countHotelPhotos.bind(photoGalleryService);

export default photoGalleryService;