// src/modules/reviews/reviewService.ts
// Lógica de negócio para Reviews de Hotéis

import { db } from "../../../db";
import {
  hotelReviews,
  hotelBookings,
  hotels,
} from "../../../shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { createReviewSchema } from "./types";

// ==================== CRIAR REVIEW ====================

export const createHotelReview = async (data: z.infer<typeof createReviewSchema>, userEmail?: string) => {
  const validated = createReviewSchema.parse(data);

  // 1. Verifica se a reserva existe e está checked_out
  const [booking] = await db
    .select()
    .from(hotelBookings)
    .where(
      and(
        eq(hotelBookings.id, validated.booking_id),
        eq(hotelBookings.hotel_id, validated.hotel_id),
        eq(hotelBookings.status, "checked_out"),
        eq(hotelBookings.guest_email, validated.guest_email || userEmail || "")
      )
    );

  if (!booking) {
    throw new Error("Só pode avaliar uma reserva finalizada (checked-out) e deve ser o hóspede");
  }

  // 2. Verifica se já avaliou
  const existing = await db
    .select()
    .from(hotelReviews)
    .where(eq(hotelReviews.booking_id, validated.booking_id));

  if (existing.length > 0) {
    throw new Error("Já submeteu uma avaliação para esta reserva");
  }

  // 3. Cria review
  const [review] = await db
    .insert(hotelReviews)
    .values({
      hotel_id: validated.hotel_id,
      booking_id: validated.booking_id,
      guest_name: validated.guest_name || booking.guest_name,
      guest_email: validated.guest_email || booking.guest_email,
      cleanliness_rating: validated.cleanliness_rating,
      comfort_rating: validated.comfort_rating,
      location_rating: validated.location_rating,
      facilities_rating: validated.facilities_rating,
      staff_rating: validated.staff_rating,
      value_rating: validated.value_rating,
      overall_rating: validated.overall_rating,
      title: validated.title,
      comment: validated.comment,
      pros: validated.pros || null,
      cons: validated.cons || null,
      is_verified: false,
      is_published: true,
      helpful_votes: 0,
    })
    .returning();

  // 4. Atualiza rating médio do hotel
  await db.execute(sql`
    UPDATE hotels
    SET 
      rating = (
        SELECT COALESCE(AVG(overall_rating), 0)::decimal(3,2)
        FROM hotel_reviews
        WHERE hotel_id = ${validated.hotel_id} AND is_published = true
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM hotel_reviews
        WHERE hotel_id = ${validated.hotel_id} AND is_published = true
      )
    WHERE id = ${validated.hotel_id}
  `);

  return review;
};

// ==================== VOTAR "ÚTIL" ====================

export const voteReviewHelpful = async (reviewId: string): Promise<number> => {
  const [updated] = await db
    .update(hotelReviews)
    .set({
      helpful_votes: sql`${hotelReviews.helpful_votes} + 1`,
    })
    .where(eq(hotelReviews.id, reviewId))
    .returning({ helpful_votes: hotelReviews.helpful_votes });

  return updated?.helpful_votes || 0;
};

// ==================== LISTAR REVIEWS ====================

export const getReviewsByHotel = async (
  hotelId: string,
  page: number = 1,
  limit: number = 20,
  sort: "recent" | "helpful" | "highest" | "lowest" = "recent"
) => {
  const offset = (page - 1) * limit;

  let orderByClause;
  switch (sort) {
    case "helpful":
      orderByClause = desc(hotelReviews.helpful_votes);
      break;
    case "highest":
      orderByClause = desc(hotelReviews.overall_rating);
      break;
    case "lowest":
      orderByClause = desc(sql`- ${hotelReviews.overall_rating}`);
      break;
    default:
      orderByClause = desc(hotelReviews.created_at);
  }

  const reviews = await db
    .select()
    .from(hotelReviews)
    .where(
      and(
        eq(hotelReviews.hotel_id, hotelId),
        eq(hotelReviews.is_published, true)
      )
    )
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(hotelReviews)
    .where(
      and(
        eq(hotelReviews.hotel_id, hotelId),
        eq(hotelReviews.is_published, true)
      )
    );

  return {
    reviews,
    pagination: {
      page,
      limit,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / limit),
    },
  };
};

// ==================== ADMIN: VERIFICAR REVIEW ====================

export const verifyReview = async (reviewId: string, verified: boolean = true) => {
  const [updated] = await db
    .update(hotelReviews)
    .set({ is_verified: verified })
    .where(eq(hotelReviews.id, reviewId))
    .returning();

  return updated;
};

// ==================== ESTATÍSTICAS DE REVIEWS ====================

export const getReviewStats = async (hotelId: string) => {
  const stats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      average: sql<number>`COALESCE(AVG(overall_rating), 0)::decimal(3,2)`,
      rating5: sql<number>`COUNT(*) FILTER (WHERE overall_rating >= 4.5)`,
      rating4: sql<number>`COUNT(*) FILTER (WHERE overall_rating >= 3.5 AND overall_rating < 4.5)`,
      rating3: sql<number>`COUNT(*) FILTER (WHERE overall_rating >= 2.5 AND overall_rating < 3.5)`,
      rating2: sql<number>`COUNT(*) FILTER (WHERE overall_rating >= 1.5 AND overall_rating < 2.5)`,
      rating1: sql<number>`COUNT(*) FILTER (WHERE overall_rating < 1.5)`,
    })
    .from(hotelReviews)
    .where(
      and(
        eq(hotelReviews.hotel_id, hotelId),
        eq(hotelReviews.is_published, true)
      )
    );

  return stats[0] || {
    total: 0,
    average: 0,
    rating5: 0,
    rating4: 0,
    rating3: 0,
    rating2: 0,
    rating1: 0,
  };
};