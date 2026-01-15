// src/modules/events/services/event-space-reviews.service.ts

import { db } from "../../../db";
import { sql } from "drizzle-orm";

export interface EventSpaceReview {
  review_id: string;
  guest_name: string;
  guest_email: string;
  booking_id: string;
  venue_rating: number;
  facilities_rating: number;
  location_rating: number;
  services_rating: number;
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

export interface EventSpaceReviewStats {
  total_reviews: number;
  average_rating: number;
  with_responses: number;
  category_averages: Record<string, number>;
  rating_distribution: Record<string, number>;
  total_helpful_votes: number;
}

export class EventSpaceReviewsService {
  async getReviews(
    eventSpaceId: string,
    limit = 10,
    offset = 0,
    minRating = 0,
    sortBy: "recent" | "highest_rating" | "most_helpful" = "recent"
  ): Promise<EventSpaceReview[]> {
    const result = await db.execute(sql`
      SELECT * FROM get_event_space_reviews(
        ${eventSpaceId}::uuid,
        ${limit},
        ${offset},
        ${minRating},
        ${sortBy}
      )
    `);

    // Compatibilidade total com Drizzle ORM (antigo e novo)
    const rows = Array.isArray(result) ? result : (result as any).rows || [];

    return rows as EventSpaceReview[];
  }

  async submitReview(
    bookingId: string,
    ratings: {
      venue: number;
      facilities: number;
      location: number;
      services: number;
      staff: number;
      value: number;
    },
    title: string,
    comment: string,
    pros?: string,
    cons?: string,
    userId?: string
  ) {
    const result = await db.execute(sql`
      SELECT submit_event_space_review(
        ${bookingId}::uuid,
        ${ratings.venue},
        ${ratings.facilities},
        ${ratings.location},
        ${ratings.services},
        ${ratings.staff},
        ${ratings.value},
        ${title},
        ${comment},
        ${pros || null},
        ${cons || null},
        ${userId || null}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return (rows[0] as any)?.submit_event_space_review;
  }

  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean) {
    const result = await db.execute(sql`
      SELECT vote_event_space_review_helpful(
        ${reviewId}::uuid,
        ${userId},
        ${isHelpful}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return (rows[0] as any)?.vote_event_space_review_helpful;
  }

  async respondToReview(
    reviewId: string,
    eventSpaceId: string,
    responseText: string,
    userId: string
  ) {
    const result = await db.execute(sql`
      SELECT respond_to_event_space_review(
        ${reviewId}::uuid,
        ${eventSpaceId}::uuid,
        ${responseText},
        ${userId}
      )
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    return (rows[0] as any)?.respond_to_event_space_review;
  }

  async getStats(eventSpaceId: string): Promise<EventSpaceReviewStats> {
    const result = await db.execute(sql`
      SELECT jsonb_pretty(get_event_space_review_stats(${eventSpaceId}::uuid)) as stats
    `);

    const rows = Array.isArray(result) ? result : (result as any).rows || [];
    const rawStats = (rows[0] as any)?.stats;

    if (typeof rawStats === 'string') {
      return JSON.parse(rawStats);
    }

    return rawStats || {
      total_reviews: 0,
      average_rating: 0,
      with_responses: 0,
      category_averages: {},
      rating_distribution: {},
      total_helpful_votes: 0,
    };
  }
}