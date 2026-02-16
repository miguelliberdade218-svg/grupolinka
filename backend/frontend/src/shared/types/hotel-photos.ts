/**
 * src/shared/types/hotel-photos.ts
 * Sistema profissional de galeria de fotos para hotéis
 * Versão: 16/02/2026
 * 
 * Gerencia:
 * - Upload de múltiplas fotos por room type
 * - Seleção de fotos destacadas para preview
 * - Ordenação de fotos
 * - Visualização em galeria com navegação
 * 
 * ✅ ADICIONADO: HotelPhoto para fotos de hotel (não de quartos)
 * ✅ ADICIONADO: AnyHotelPhoto como tipo união
 */

// ==================== PHOTO TYPES ====================

/**
 * Interface para uma foto individual de QUARTO (room type)
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
 * ✅ NOVO: Interface para foto de HOTEL (não de quarto)
 * Usada para fotos da galeria principal do hotel
 */
export interface HotelPhoto {
  id: string;
  hotel_id: string;      // ID do hotel ao qual a foto pertence
  url: string;
  alt_text?: string;
  order?: number;
  is_featured?: boolean; // Se deve aparecer no preview principal
  is_primary?: boolean;  // Foto principal (capa)
  created_at: string;
  updated_at: string;
}

/**
 * ✅ NOVO: Tipo união para qualquer tipo de foto (hotel ou quarto)
 * Útil para componentes de galeria que podem receber ambos os tipos
 */
export type AnyHotelPhoto = RoomTypePhoto | HotelPhoto;

/**
 * Interface para requisição de upload de foto de quarto
 */
export interface RoomTypePhotoUploadRequest {
  room_type_id: string;
  file: File;
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
}

/**
 * ✅ NOVO: Interface para requisição de upload de foto de hotel
 */
export interface HotelPhotoUploadRequest {
  hotel_id: string;
  file: File;
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
}

/**
 * Interface para requisição de reordenação de fotos de quarto
 */
export interface RoomTypePhotoReorderRequest {
  room_type_id: string;
  photos: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * ✅ NOVO: Interface para requisição de reordenação de fotos de hotel
 */
export interface HotelPhotoReorderRequest {
  hotel_id: string;
  photos: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * Interface para atualizar meta-dados de foto de quarto
 */
export interface RoomTypePhotoUpdateRequest {
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
  order?: number;
}

/**
 * ✅ NOVO: Interface para atualizar meta-dados de foto de hotel
 */
export interface HotelPhotoUpdateRequest {
  alt_text?: string;
  is_featured?: boolean;
  is_primary?: boolean;
  order?: number;
}

// ==================== GALLERY STATES ====================

/**
 * Estado de uma galeria de fotos de quarto
 */
export interface RoomTypePhotoGalleryState {
  photos: RoomTypePhoto[];
  loading: boolean;
  error?: string | null;
  currentPhotoIndex?: number;
}

/**
 * ✅ NOVO: Estado de uma galeria de fotos de hotel
 */
export interface HotelPhotoGalleryState {
  photos: HotelPhoto[];
  loading: boolean;
  error?: string | null;
  currentPhotoIndex?: number;
}

/**
 * ✅ NOVO: Estado genérico de galeria (aceita qualquer tipo)
 */
export interface PhotoGalleryState<T = AnyHotelPhoto> {
  photos: T[];
  loading: boolean;
  error?: string | null;
  currentPhotoIndex?: number;
}

/**
 * Resposta de upload de foto de quarto
 */
export interface RoomTypePhotoUploadResponse {
  success: boolean;
  data?: RoomTypePhoto;
  error?: string;
}

/**
 * ✅ NOVO: Resposta de upload de foto de hotel
 */
export interface HotelPhotoUploadResponse {
  success: boolean;
  data?: HotelPhoto;
  error?: string;
}

/**
 * Resposta listando fotos de quarto
 */
export interface RoomTypePhotoListResponse {
  success: boolean;
  data: RoomTypePhoto[];
  error?: string;
}

/**
 * ✅ NOVO: Resposta listando fotos de hotel
 */
export interface HotelPhotoListResponse {
  success: boolean;
  data: HotelPhoto[];
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
  type?: 'hotel' | 'room'; // ✅ ADICIONADO: para diferenciar origem da foto
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
  hotelPhotos?: HotelPhoto[]; // ✅ ADICIONADO: Fotos específicas do hotel
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
  MAX_PHOTOS_PER_HOTEL: 50, // ✅ ADICIONADO: limite para fotos de hotel
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MIN_DIMENSION: 800,
  RECOMMENDED_DIMENSION: 1200,
  ASPECT_RATIO_MIN: 0.7,  // Mínimo 0.7 (mais alto que largo)
  ASPECT_RATIO_MAX: 1.4,  // Máximo 1.4 (mais largo que alto)
} as const;