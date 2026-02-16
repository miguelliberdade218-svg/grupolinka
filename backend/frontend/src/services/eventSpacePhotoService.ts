/**
 * src/services/eventSpacePhotoService.ts
 * Serviço de fotos para Event Spaces - VERSÃO CORRIGIDA
 */

import { apiService } from './api';

// ✅ CORREÇÃO: Interface EventSpacePhoto definida localmente (NÃO usar RoomTypePhoto)
export interface EventSpacePhoto {
  id: string;
  event_space_id: string;
  url: string;
  alt_text?: string;
  order?: number;
  is_featured?: boolean;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Interface para atualização de foto
export interface EventSpacePhotoUpdateRequest {
  is_featured?: boolean;
  is_primary?: boolean;
  alt_text?: string;
}

// Interface para reordenar fotos
export interface EventSpacePhotoReorderRequest {
  photoIds: string[];
}

// ✅ Interface ApiResponse definida localmente
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const eventSpacePhotoService = {
  // ==================== UPLOAD ====================

  /**
   * Upload de uma foto para um event space
   */
  async uploadEventSpacePhoto(request: {
    event_space_id: string;
    file: File;
    alt_text?: string;
    is_featured?: boolean;
    is_primary?: boolean;
  }): Promise<EventSpacePhoto> {
    console.log('📸 [uploadEventSpacePhoto] ===== INÍCIO DO UPLOAD =====');
    console.log('📸 [uploadEventSpacePhoto] Request:', {
      event_space_id: request.event_space_id,
      fileName: request.file.name,
      fileSize: request.file.size,
      fileType: request.file.type,
      fileLastModified: request.file.lastModified,
      alt_text: request.alt_text,
      is_featured: request.is_featured,
      is_primary: request.is_primary
    });

    const formData = new FormData();
    
    console.log('📸 [uploadEventSpacePhoto] Criando FormData...');
    
    formData.append('photo', request.file);
    console.log('📸 [uploadEventSpacePhoto] Append photo:', request.file.name);

    if (request.alt_text) {
      formData.append('alt_text', request.alt_text);
      console.log('📸 [uploadEventSpacePhoto] Append alt_text:', request.alt_text);
    }
    
    formData.append('is_featured', String(request.is_featured || false));
    console.log('📸 [uploadEventSpacePhoto] Append is_featured:', request.is_featured || false);
    
    formData.append('is_primary', String(request.is_primary || false));
    console.log('📸 [uploadEventSpacePhoto] Append is_primary:', request.is_primary || false);

    console.log('📸 [uploadEventSpacePhoto] FormData criado com campos:');
    // @ts-ignore - FormData não tem método entries tipado, mas existe no browser
    for (let pair of formData.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  - ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes, ${pair[1].type})`);
      } else {
        console.log(`  - ${pair[0]}: ${pair[1]}`);
      }
    }

    const headers: Record<string, string> = {};
    console.log('📸 [uploadEventSpacePhoto] Headers:', headers);
    console.log('📸 [uploadEventSpacePhoto] URL:', `/api/events/spaces/${request.event_space_id}/photos`);

    try {
      const response = await apiService.post<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${request.event_space_id}/photos`,
        formData,
        headers
      );

      console.log('📸 [uploadEventSpacePhoto] Resposta recebida:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        message: response.message
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Falha ao fazer upload da foto');
      }

      console.log('📸 [uploadEventSpacePhoto] ✅ Upload concluído com sucesso! ID:', response.data.id);
      console.log('📸 [uploadEventSpacePhoto] ===== FIM DO UPLOAD =====');
      
      return response.data;
    } catch (error) {
      console.error('📸 [uploadEventSpacePhoto] ❌ Erro no upload:', error);
      console.log('📸 [uploadEventSpacePhoto] ===== FIM DO UPLOAD (COM ERRO) =====');
      throw error;
    }
  },

  /**
   * Upload de múltiplas fotos em paralelo
   */
  async uploadMultiplePhotos(request: {
    event_space_id: string;
    files: File[];
    alt_text?: string;
  }): Promise<EventSpacePhoto[]> {
    console.log('📸 [uploadMultiplePhotos] ===== INÍCIO UPLOAD MÚLTIPLO =====');
    console.log('📸 [uploadMultiplePhotos] Enviando', request.files.length, 'fotos para espaço:', request.event_space_id);
    
    request.files.forEach((file, index) => {
      console.log(`📸 [uploadMultiplePhotos] Arquivo ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });

    const uploadPromises = request.files.map((file, index) => {
      console.log(`📸 [uploadMultiplePhotos] Criando promise para arquivo ${index + 1}:`, file.name);
      return this.uploadEventSpacePhoto({
        event_space_id: request.event_space_id,
        file,
        alt_text: request.alt_text,
        is_featured: index === 0,
        is_primary: index === 0,
      });
    });

    try {
      const results = await Promise.all(uploadPromises);
      console.log('📸 [uploadMultiplePhotos] ✅ Todos os uploads concluídos!', results.length, 'fotos');
      console.log('📸 [uploadMultiplePhotos] ===== FIM UPLOAD MÚLTIPLO =====');
      return results;
    } catch (error) {
      console.error('📸 [uploadMultiplePhotos] ❌ Erro em upload múltiplo:', error);
      console.log('📸 [uploadMultiplePhotos] ===== FIM UPLOAD MÚLTIPLO (COM ERRO) =====');
      throw error;
    }
  },

  // ==================== LEITURA ====================

  /**
   * Obter todas as fotos de um event space
   */
  async getEventSpacePhotos(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto[]>> {
    console.log('📸 [getEventSpacePhotos] Buscando fotos para espaço:', eventSpaceId);
    
    try {
      const response = await apiService.get<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos`
      );

      console.log('📸 [getEventSpacePhotos] Resposta:', {
        success: response.success,
        count: response.data?.length || 0,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('📸 [getEventSpacePhotos] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar fotos',
        data: []
      };
    }
  },

  /**
   * Obter apenas fotos destacadas
   */
  async getFeaturedPhotos(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto[]>> {
    console.log('📸 [getFeaturedPhotos] Buscando fotos destacadas para espaço:', eventSpaceId);
    
    try {
      const response = await apiService.get<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos/featured`
      );

      console.log('📸 [getFeaturedPhotos] Resposta:', {
        success: response.success,
        count: response.data?.length || 0,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('📸 [getFeaturedPhotos] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar fotos destacadas',
        data: []
      };
    }
  },

  /**
   * Obter foto principal
   */
  async getPrimaryPhoto(eventSpaceId: string): Promise<ApiResponse<EventSpacePhoto | null>> {
    console.log('📸 [getPrimaryPhoto] Buscando foto principal para espaço:', eventSpaceId);
    
    try {
      const response = await this.getEventSpacePhotos(eventSpaceId);
      
      if (response.success && response.data) {
        const primary = response.data.find(p => p.is_primary) || response.data[0] || null;
        
        console.log('📸 [getPrimaryPhoto] Foto principal:', primary ? {
          id: primary.id,
          url: primary.url,
          is_primary: primary.is_primary
        } : 'Nenhuma foto encontrada');
        
        return {
          success: true,
          data: primary
        };
      }
      
      return {
        success: false,
        data: null,
        error: response.error
      };
    } catch (error) {
      console.error('📸 [getPrimaryPhoto] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar foto principal',
        data: null
      };
    }
  },

  /**
   * Obter event space com todas as suas fotos
   */
  async getEventSpaceWithPhotos(eventSpaceId: string): Promise<ApiResponse<any>> {
    console.log('📸 [getEventSpaceWithPhotos] Buscando espaço com fotos:', eventSpaceId);
    
    try {
      const response = await apiService.get<ApiResponse<any>>(
        `/api/events/spaces/${eventSpaceId}/with-photos`
      );

      console.log('📸 [getEventSpaceWithPhotos] Resposta:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('📸 [getEventSpaceWithPhotos] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar espaço com fotos'
      };
    }
  },

  // ==================== ATUALIZAÇÃO ====================

  /**
   * Atualizar meta-dados de uma foto
   */
  async updatePhoto(
    eventSpaceId: string,
    photoId: string,
    updates: EventSpacePhotoUpdateRequest
  ): Promise<ApiResponse<EventSpacePhoto>> {
    console.log('📸 [updatePhoto] Atualizando foto:', { eventSpaceId, photoId, updates });
    
    try {
      const response = await apiService.put<ApiResponse<EventSpacePhoto>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}`,
        updates
      );

      console.log('📸 [updatePhoto] Resposta:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('📸 [updatePhoto] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar foto'
      };
    }
  },

  /**
   * Definir foto como principal
   */
  async setPrimaryPhoto(eventSpaceId: string, photoId: string): Promise<ApiResponse<EventSpacePhoto>> {
    console.log('📸 [setPrimaryPhoto] Definindo foto como principal:', { eventSpaceId, photoId });
    return this.updatePhoto(eventSpaceId, photoId, { is_primary: true });
  },

  /**
   * Alternar foto como destacada
   */
  async toggleFeaturedPhoto(eventSpaceId: string, photoId: string): Promise<ApiResponse<EventSpacePhoto>> {
    console.log('📸 [toggleFeaturedPhoto] Alternando destaque da foto:', { eventSpaceId, photoId });
    
    try {
      const photosResponse = await this.getEventSpacePhotos(eventSpaceId);
      
      if (!photosResponse.success || !photosResponse.data) {
        return {
          success: false,
          error: 'Não foi possível carregar as fotos'
        };
      }
      
      const photo = photosResponse.data.find(p => p.id === photoId);
      
      if (!photo) {
        return {
          success: false,
          error: 'Foto não encontrada'
        };
      }

      console.log('📸 [toggleFeaturedPhoto] Estado atual:', { is_featured: photo.is_featured });
      const result = await this.updatePhoto(eventSpaceId, photoId, { is_featured: !photo.is_featured });
      console.log('📸 [toggleFeaturedPhoto] ✅ Novo estado:', { is_featured: result.data?.is_featured });
      
      return result;
    } catch (error) {
      console.error('📸 [toggleFeaturedPhoto] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alternar destaque'
      };
    }
  },

  /**
   * Reordenar fotos
   */
  async reorderPhotos(
    eventSpaceId: string,
    photoIds: string[]
  ): Promise<ApiResponse<EventSpacePhoto[]>> {
    console.log('📸 [reorderPhotos] Reordenando fotos:', { eventSpaceId, photoIds });
    
    try {
      const response = await apiService.put<ApiResponse<EventSpacePhoto[]>>(
        `/api/events/spaces/${eventSpaceId}/photos/reorder`,
        { photoIds }
      );

      console.log('📸 [reorderPhotos] Resposta:', {
        success: response.success,
        count: response.data?.length || 0,
        error: response.error
      });

      return response;
    } catch (error) {
      console.error('📸 [reorderPhotos] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reordenar fotos',
        data: []
      };
    }
  },

  // ==================== DELEÇÃO ====================

  /**
   * Deletar uma foto (soft delete)
   */
  async deletePhoto(eventSpaceId: string, photoId: string): Promise<ApiResponse<null>> {
    console.log('📸 [deletePhoto] Deletando foto:', { eventSpaceId, photoId });
    
    try {
      const response = await apiService.delete<ApiResponse<null>>(
        `/api/events/spaces/${eventSpaceId}/photos/${photoId}`
      );

      console.log('📸 [deletePhoto] Resposta:', {
        success: response.success,
        error: response.error,
        message: response.message
      });

      return response;
    } catch (error) {
      console.error('📸 [deletePhoto] ❌ Erro:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar foto'
      };
    }
  },

  // ==================== HELPERS ====================

  /**
   * Validar foto antes de upload
   */
  validatePhotoFile(file: File): { isValid: boolean; error?: string } {
    console.log('📸 [validatePhotoFile] Validando arquivo:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

    if (!ALLOWED_FORMATS.includes(file.type)) {
      console.log('📸 [validatePhotoFile] ❌ Formato não permitido:', file.type);
      return {
        isValid: false,
        error: `Formato não permitido. Aceitos: ${ALLOWED_FORMATS.join(', ')}`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log('📸 [validatePhotoFile] ❌ Arquivo muito grande:', file.size, '>', MAX_FILE_SIZE);
      return {
        isValid: false,
        error: `Arquivo muito grande. Máximo: ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
      };
    }

    console.log('📸 [validatePhotoFile] ✅ Arquivo válido');
    return { isValid: true };
  },
};