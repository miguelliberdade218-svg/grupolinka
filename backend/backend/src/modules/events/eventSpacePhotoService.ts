/**
 * src/modules/events/eventSpacePhotoService.ts
 * Service para fotos de event spaces
 * ✅ CORRIGIDO: Usando snake_case nos campos
 * ✅ CORRIGIDO: URLs resolvidas com baseURL (consistente com hotel service)
 */

import { db } from '../../../db';
import { eventSpacePhotos } from '../../../shared/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

// ✅ Helper: prefixa URLs relativas com a base da API para o frontend
//    obter sempre URLs absolutas, igual ao que o hotel photo service faz.
//    Em dev, define API_BASE_URL=http://localhost:8000 no .env do backend.
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.BACKEND_URL ||
  '';

const resolvePhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url; // já absoluta
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;                 // relativa
  return `${API_BASE_URL}/${url}`;                                          // sem slash
};

// ✅ Aplica resolvePhotoUrl a todas as linhas de photo devolvidas
const withResolvedUrls = <T extends { url: string | null }>(rows: T[]): T[] =>
  rows.map((r) => ({ ...r, url: resolvePhotoUrl(r.url) }));

export const eventSpacePhotoService = {
  /**
   * Buscar todas as fotos de um event space
   */
  async getPhotos(eventSpaceId: string) {
    const rows = await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.event_space_id, eventSpaceId),
          isNull(eventSpacePhotos.deleted_at)
        )
      )
      .orderBy(desc(eventSpacePhotos.is_primary), eventSpacePhotos.order);

    // ✅ Devolve URLs absolutas para o frontend
    return withResolvedUrls(rows);
  },

  /**
   * Buscar fotos destacadas
   */
  async getFeaturedPhotos(eventSpaceId: string) {
    const rows = await db
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

    // ✅ Devolve URLs absolutas para o frontend
    return withResolvedUrls(rows);
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

    if (!photo) return null;

    // ✅ Herda a mesma resolução de URL
    return { ...photo, url: resolvePhotoUrl(photo.url) };
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
    
    const rows = await db
      .select()
      .from(eventSpacePhotos)
      .where(
        and(
          eq(eventSpacePhotos.is_primary, true),
          isNull(eventSpacePhotos.deleted_at)
        )
      );

    // ✅ Devolve URLs absolutas para o frontend
    return withResolvedUrls(rows);
  }
};