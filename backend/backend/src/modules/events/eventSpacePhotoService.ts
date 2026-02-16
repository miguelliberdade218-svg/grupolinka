/**
 * src/modules/events/eventSpacePhotoService.ts
 * Service para fotos de event spaces
 * ✅ CORRIGIDO: Usando snake_case nos campos
 */

import { db } from '../../../db';
import { eventSpacePhotos } from '../../../shared/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

export const eventSpacePhotoService = {
  /**
   * Buscar todas as fotos de um event space
   */
  async getPhotos(eventSpaceId: string) {
    return await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .orderBy(desc(eventSpacePhotos.is_primary), eventSpacePhotos.order);
  },

  /**
   * Buscar fotos destacadas
   */
  async getFeaturedPhotos(eventSpaceId: string) {
    return await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          eq(eventSpacePhotos.is_featured, true),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .orderBy(desc(eventSpacePhotos.is_primary), eventSpacePhotos.order);
  },

  /**
   * Buscar foto principal
   */
  async getPrimaryPhoto(eventSpaceId: string) {
    const [photo] = await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          eq(eventSpacePhotos.is_primary, true),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .limit(1);

    return photo || null;
  },

  /**
   * Contar fotos
   */
  async countPhotos(eventSpaceId: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          isNull(eventSpacePhotos.deleted_at)
        )
      );

    return result?.count || 0;
  },

  /**
   * Buscar fotos por IDs
   */
  async getPhotosByIds(photoIds: string[]) {
    if (photoIds.length === 0) return [];
    
    return await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.is_primary, true),
          isNull(eventSpacePhotos.deleted_at)
        )
      );
  }
};