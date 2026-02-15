// src/modules/hotels/roomTypePhotoService.ts
import { db } from '../../../db';
import { roomTypePhotos, roomTypes } from '../../../shared/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export const roomTypePhotoService = {
  // ==================== CRUD BÁSICO ====================

  /**
   * Criar uma nova foto
   */
  async create(data: any) {
    const [photo] = await db.insert(roomTypePhotos).values(data).returning();
    return photo;
  },

  /**
   * Buscar foto por ID
   */
  async getById(id: string) {
    const [photo] = await db
      .select()
      .from(roomTypePhotos)
      .where(
        and(
          eq(roomTypePhotos.id, id),
          isNull(roomTypePhotos.deleted_at)
        )
      );
    return photo || null;
  },

  /**
   * Listar todas as fotos de um room type (não deletadas)
   */
  async getByRoomType(roomTypeId: string) {
    return await db
      .select()
      .from(roomTypePhotos)
      .where(
        and(
          eq(roomTypePhotos.room_type_id, roomTypeId),
          isNull(roomTypePhotos.deleted_at)
        )
      )
      .orderBy(desc(roomTypePhotos.is_primary), roomTypePhotos.order);
  },

  /**
   * Atualizar uma foto
   */
  async update(id: string, data: any) {
    const [photo] = await db
      .update(roomTypePhotos)
      .set({ ...data, updated_at: new Date() })
      .where(eq(roomTypePhotos.id, id))
      .returning();
    return photo;
  },

  /**
   * Soft delete - marcar como deletada
   */
  async softDelete(id: string) {
    const [photo] = await db
      .update(roomTypePhotos)
      .set({ deleted_at: new Date() })
      .where(eq(roomTypePhotos.id, id))
      .returning();
    return photo;
  },

  /**
   * Hard delete - remover permanentemente
   */
  async hardDelete(id: string) {
    const [photo] = await db
      .delete(roomTypePhotos)
      .where(eq(roomTypePhotos.id, id))
      .returning();
    return photo;
  },

  /**
   * Restaurar foto deletada
   */
  async restore(id: string) {
    const [photo] = await db
      .update(roomTypePhotos)
      .set({ deleted_at: null, updated_at: new Date() })
      .where(eq(roomTypePhotos.id, id))
      .returning();
    return photo;
  },

  // ==================== FUNÇÕES ESPECÍFICAS ====================

  /**
   * Definir uma foto como principal (remove primary das outras)
   * @param roomTypeId ID do room type
   * @param photoId ID da foto a ser definida como principal (ou null para apenas remover primary de todas)
   */
  async setPrimary(roomTypeId: string, photoId: string | null) {
    // Remove primary de todas as outras fotos do mesmo room type
    await db
      .update(roomTypePhotos)
      .set({ is_primary: false })
      .where(
        and(
          eq(roomTypePhotos.room_type_id, roomTypeId),
          isNull(roomTypePhotos.deleted_at)
        )
      );

    // Se tiver um photoId válido, define a nova como primary
    if (photoId) {
      const [photo] = await db
        .update(roomTypePhotos)
        .set({ is_primary: true, updated_at: new Date() })
        .where(
          and(
            eq(roomTypePhotos.id, photoId),
            isNull(roomTypePhotos.deleted_at)
          )
        )
        .returning();
      return photo;
    }
    
    return null;
  },

  /**
   * Alternar status featured de uma foto
   */
  async toggleFeatured(id: string) {
    const photo = await this.getById(id);
    if (!photo) return null;

    const [updated] = await db
      .update(roomTypePhotos)
      .set({ 
        is_featured: !photo.is_featured, 
        updated_at: new Date() 
      })
      .where(eq(roomTypePhotos.id, id))
      .returning();
    return updated;
  },

  /**
   * Reordenar fotos de um room type
   */
  async reorder(roomTypeId: string, photoIds: string[]) {
    for (let i = 0; i < photoIds.length; i++) {
      await db
        .update(roomTypePhotos)
        .set({ order: i })
        .where(
          and(
            eq(roomTypePhotos.id, photoIds[i]),
            eq(roomTypePhotos.room_type_id, roomTypeId),
            isNull(roomTypePhotos.deleted_at)
          )
        );
    }
    return this.getByRoomType(roomTypeId);
  },

  // ==================== BUSCAS POR HOTEL ====================

  /**
   * Buscar todas as fotos de um hotel (todos os room types)
   */
  async getByHotel(hotelId: string) {
    return await db
      .select({
        id: roomTypePhotos.id,
        room_type_id: roomTypePhotos.room_type_id,
        url: roomTypePhotos.url,
        alt_text: roomTypePhotos.alt_text,
        is_featured: roomTypePhotos.is_featured,
        is_primary: roomTypePhotos.is_primary,
        order: roomTypePhotos.order,
        room_type_name: roomTypes.name,
        room_type_hotel_id: roomTypes.hotel_id,
      })
      .from(roomTypePhotos)
      .innerJoin(roomTypes, eq(roomTypes.id, roomTypePhotos.room_type_id))
      .where(
        and(
          eq(roomTypes.hotel_id, hotelId),
          isNull(roomTypePhotos.deleted_at)
        )
      )
      .orderBy(desc(roomTypePhotos.is_primary), roomTypePhotos.order);
  },

  /**
   * Buscar apenas fotos destacadas de um hotel
   */
  async getFeaturedByHotel(hotelId: string) {
    return await db
      .select({
        id: roomTypePhotos.id,
        room_type_id: roomTypePhotos.room_type_id,
        url: roomTypePhotos.url,
        alt_text: roomTypePhotos.alt_text,
        is_featured: roomTypePhotos.is_featured,
        is_primary: roomTypePhotos.is_primary,
        order: roomTypePhotos.order,
        room_type_name: roomTypes.name,
      })
      .from(roomTypePhotos)
      .innerJoin(roomTypes, eq(roomTypes.id, roomTypePhotos.room_type_id))
      .where(
        and(
          eq(roomTypes.hotel_id, hotelId),
          eq(roomTypePhotos.is_featured, true),
          isNull(roomTypePhotos.deleted_at)
        )
      )
      .orderBy(desc(roomTypePhotos.is_primary), roomTypePhotos.order);
  },

  /**
   * Buscar foto principal de um hotel (primeira primary encontrada)
   */
  async getPrimaryByHotel(hotelId: string) {
    const [photo] = await db
      .select({
        id: roomTypePhotos.id,
        room_type_id: roomTypePhotos.room_type_id,
        url: roomTypePhotos.url,
        alt_text: roomTypePhotos.alt_text,
        is_featured: roomTypePhotos.is_featured,
        is_primary: roomTypePhotos.is_primary,
        order: roomTypePhotos.order,
        room_type_name: roomTypes.name,
      })
      .from(roomTypePhotos)
      .innerJoin(roomTypes, eq(roomTypes.id, roomTypePhotos.room_type_id))
      .where(
        and(
          eq(roomTypes.hotel_id, hotelId),
          eq(roomTypePhotos.is_primary, true),
          isNull(roomTypePhotos.deleted_at)
        )
      )
      .limit(1);
    return photo || null;
  },

  // ==================== FOTO PRINCIPAL ====================

  /**
   * Buscar foto principal de um room type
   */
  async getPrimaryByRoomType(roomTypeId: string) {
    const [photo] = await db
      .select()
      .from(roomTypePhotos)
      .where(
        and(
          eq(roomTypePhotos.room_type_id, roomTypeId),
          eq(roomTypePhotos.is_primary, true),
          isNull(roomTypePhotos.deleted_at)
        )
      )
      .limit(1);
    return photo || null;
  },

  // ==================== CONTAGENS ====================

  /**
   * Contar fotos de um room type
   */
  async countByRoomType(roomTypeId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomTypePhotos)
      .where(
        and(
          eq(roomTypePhotos.room_type_id, roomTypeId),
          isNull(roomTypePhotos.deleted_at)
        )
      );
    return Number(result?.count || 0);
  },

  /**
   * Contar fotos destacadas de um room type
   */
  async countFeaturedByRoomType(roomTypeId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomTypePhotos)
      .where(
        and(
          eq(roomTypePhotos.room_type_id, roomTypeId),
          eq(roomTypePhotos.is_featured, true),
          isNull(roomTypePhotos.deleted_at)
        )
      );
    return Number(result?.count || 0);
  },

  // ==================== DELETADAS ====================

  /**
   * Buscar fotos deletadas (soft delete)
   */
  async getDeleted(roomTypeId?: string) {
    const conditions = [sql`${roomTypePhotos.deleted_at} IS NOT NULL`];
    
    if (roomTypeId) {
      conditions.push(eq(roomTypePhotos.room_type_id, roomTypeId));
    }
    
    return await db
      .select()
      .from(roomTypePhotos)
      .where(and(...conditions))
      .orderBy(desc(roomTypePhotos.deleted_at));
  },

  // ==================== UTILITÁRIOS ====================

  /**
   * Duplicar fotos de um room type para outro
   * Útil para criar room types similares
   */
  async duplicateForRoomType(sourceRoomTypeId: string, targetRoomTypeId: string) {
    const photos = await this.getByRoomType(sourceRoomTypeId);
    
    const newPhotos = await Promise.all(
      photos.map(async (photo, index) => {
        return this.create({
          room_type_id: targetRoomTypeId,
          url: photo.url,
          alt_text: photo.alt_text,
          order: index,
          is_featured: photo.is_featured,
          is_primary: index === 0 ? photo.is_primary : false, // Apenas a primeira mantém primary se era primary
        });
      })
    );
    
    return newPhotos;
  },

  /**
   * Verificar se um room type atingiu o limite máximo de fotos
   */
  async hasReachedLimit(roomTypeId: string, limit: number = 20) {
    const count = await this.countByRoomType(roomTypeId);
    return count >= limit;
  },

  /**
   * Validar se pode adicionar mais fotos
   */
  async canAddMore(roomTypeId: string, limit: number = 20) {
    const count = await this.countByRoomType(roomTypeId);
    return {
      canAdd: count < limit,
      currentCount: count,
      remaining: Math.max(0, limit - count),
      limit
    };
  }
};

export default roomTypePhotoService;