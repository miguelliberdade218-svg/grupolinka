/**
 * src/shared/types/hotel-photos.ts
 * Sistema profissional de galeria de fotos para hotéis
 * Versão: 13/02/2026
 * 
 * Gerencia:
 * - Upload de múltiplas fotos por room type
 * - Seleção de fotos destacadas para preview
 * - Ordenação de fotos
 * - Visualização em galeria com navegação
 */

// ==================== PHOTO TYPES ====================

/**
 * Interface para uma foto individual
 */
export interface RoomTypePhoto {
  id: string;
  room_type_id: string;
  url: string;
  alt_text?: string;
  order?: number;
  is_featured?: boolean; // Se deve aparecer no preview principal
  is_primary?: boolean;  // Foto principal (capa)
  created_at: string;
  updated_at: string;
}

/**
 * Interface para requisição de upload de foto
 */
export interface RoomTypePhotoUploadRequest {
  room_type_id: string;
  file: File;
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
}

/**
 * Interface para requisição de reordenação de fotos
 */
export interface RoomTypePhotoReorderRequest {
  room_type_id: string;
  photos: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * Interface para atualizar meta-dados de foto
 */
export interface RoomTypePhotoUpdateRequest {
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
  order?: number;
}

// ==================== GALLERY STATES ====================

/**
 * Estado de uma galeria de fotos
 */
export interface PhotoGalleryState {
  photos: RoomTypePhoto[];
  loading: boolean;
  error?: string | null;
  currentPhotoIndex?: number;
}

/**
 * Resposta de upload de foto
 */
export interface PhotoUploadResponse {
  success: boolean;
  data?: RoomTypePhoto;
  error?: string;
}

/**
 * Resposta listando fotos
 */
export interface PhotoListResponse {
  success: boolean;
  data: RoomTypePhoto[];
  error?: string;
}

// ==================== DISPLAY TYPES ====================

/**
 * Informações simplificadas de fotos para display em preview
 */
export interface PhotoPreviewInfo {
  id: string;
  url: string;
  alt_text?: string;
  is_featured: boolean;
  is_primary: boolean;
}

/**
 * Dados de hotel com fotos para exibição em resultados
 */
export interface HotelWithPhotos {
  id: string;
  name: string;
  address: string;
  locality: string;
  rating: number;
  total_reviews: number;
  mainPhoto?: string; // Foto principal do hotel
  featuredPhotos?: PhotoPreviewInfo[]; // Fotos destacadas dos room types
  allPhotos?: RoomTypePhoto[]; // Todas as fotos (para detail view)
}

/**
 * Dados de room type com fotos para exibição
 */
export interface RoomTypeWithPhotos {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  base_price: string;
  amenities?: string[];
  photos: RoomTypePhoto[];
  primaryPhoto?: RoomTypePhoto; // Foto principal
  featuredPhotos: RoomTypePhoto[]; // Fotos para preview
}

// ==================== VALIDATION ====================

/**
 * Validação de foto
 */
export interface PhotoValidation {
  isValid: boolean;
  errors: string[];
}

export const PHOTO_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PHOTOS_PER_ROOM_TYPE: 20,
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MIN_DIMENSION: 800,
  RECOMMENDED_DIMENSION: 1200,
  ASPECT_RATIO_MIN: 0.7,  // Mínimo 0.7 (mais alto que largo)
  ASPECT_RATIO_MAX: 1.4,  // Máximo 1.4 (mais largo que alto)
} as const;
