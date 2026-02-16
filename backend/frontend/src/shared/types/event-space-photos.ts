// Copie do hotel-photos.ts e renomeie RoomType → EventSpace
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

export interface EventSpacePhotoUpdateRequest {
  is_featured?: boolean;
  is_primary?: boolean;
  alt_text?: string;
}

export interface EventSpacePhotoReorderRequest {
  photoIds: string[];
}