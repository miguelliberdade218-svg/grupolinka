// src/modules/hotels/hotel-reviews.service.ts - VERSÃO CORRIGIDA

import { db } from "../../../db";
import { sql } from "drizzle-orm";

export interface HotelReview {
  review_id: string;
  guest_name: string;
  guest_email: string;
  booking_id: string;
  cleanliness_rating: number;
  comfort_rating: number;
  location_rating: number;
  facilities_rating: number;
  staff_rating: number;
  value_rating: number;
  overall_rating: number;
  title: string;
  comment: string;
  pros?: string | null;
  cons?: string | null;
  is_verified: boolean;
  created_at: Date;
  helpful_count: number;
  response_text?: string | null;
  response_date?: Date | null;
}

export class HotelReviewsService {
  async getReviews(
    hotelId: string,
    limit = 10,
    offset = 0,
    minRating = 0,
    sortBy: "recent" | "highest_rating" | "most_helpful" = "recent"
  ): Promise<HotelReview[]> {
    const result = await db.execute(sql`
      SELECT * FROM get_hotel_reviews(
        ${hotelId}::uuid,
        ${limit},
        ${offset},
        ${minRating},
        ${sortBy}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return rows as HotelReview[];
  }

  async submitReview(
    bookingId: string,
    ratings: {
      cleanliness: number;
      comfort: number;
      location: number;
      facilities: number;
      staff: number;
      value: number;
    },
    title: string,
    comment: string,
    pros?: string,
    cons?: string,
    userId?: string
  ): Promise<{
    id: string;
    overallRating: number;
    success: boolean;
    message: string;
  }> {
    // CORREÇÃO: A função retorna TABLE(success, message, review_id, overall_rating)
    // Precisamos usar SELECT * FROM para obter todas as colunas
    const result = await db.execute(sql`
      SELECT * FROM submit_hotel_review(
        ${bookingId}::uuid,
        ${ratings.cleanliness},
        ${ratings.comfort},
        ${ratings.location},
        ${ratings.facilities},
        ${ratings.staff},
        ${ratings.value},
        ${title},
        ${comment},
        ${pros || null},
        ${cons || null},
        ${userId || null}
      )
    `);

    // Extrair resultado - o Drizzle pode retornar de formas diferentes
    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    
    if (rows.length === 0) {
      throw new Error('Nenhum resultado retornado pela função submit_hotel_review');
    }

    // A função PostgreSQL retorna:
    // TABLE(success boolean, message text, review_id uuid, overall_rating numeric)
    // Então precisamos acessar as propriedades diretamente
    const row = rows[0];
    
    // Debug: mostrar o que foi retornado
    console.log('Resultado da função submit_hotel_review:', row);
    
    // Verificar se a função retornou sucesso
    // Note: as propriedades podem vir em camelCase ou snake_case dependendo do Drizzle
    const success = row.success !== undefined ? row.success : 
                   (row as any).Success !== undefined ? (row as any).Success : false;
    
    const message = row.message || (row as any).Message || 'Mensagem não disponível';
    const reviewId = row.review_id || (row as any).review_id || 
                    (row as any).ReviewId || (row as any).reviewId;
    const overallRating = row.overall_rating || (row as any).overall_rating || 
                         (row as any).OverallRating || (row as any).overallRating || 0;

    if (!success) {
      throw new Error(message || 'Erro ao submeter review');
    }

    if (!reviewId) {
      throw new Error('Review criado mas ID não retornado');
    }

    // Retornar no formato esperado pelo controller
    return {
      id: reviewId,
      overallRating: Number(overallRating),
      success: true,
      message: message
    };
  }

  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    const result = await db.execute(sql`
      SELECT vote_review_helpful(
        ${reviewId}::uuid,
        ${userId},
        ${isHelpful}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return (rows[0] as any)?.vote_review_helpful;
  }

  async respondToReview(reviewId: string, hotelId: string, responseText: string, userId: string) {
    const result = await db.execute(sql`
      SELECT respond_to_review(
        ${reviewId}::uuid,
        ${hotelId}::uuid,
        ${responseText},
        ${userId}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return (rows[0] as any)?.respond_to_review;
  }

  async getStats(hotelId: string): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT get_hotel_review_stats(${hotelId}::uuid) as stats
      `);

      const rows = Array.isArray(result) ? result : (result as any).rows || [];
      return (rows[0] as any)?.stats || null;
    } catch (error) {
      console.warn("Função get_hotel_review_stats não existe ou erro:", error);
      return null;
    }
  }
}