// src/modules/reviews/types.ts
import { z } from "zod";

export const createReviewSchema = z.object({
  hotel_id: z.string().uuid(),
  booking_id: z.string().uuid(),
  cleanliness_rating: z.number().int().min(1).max(5),
  comfort_rating: z.number().int().min(1).max(5),
  location_rating: z.number().int().min(1).max(5),
  facilities_rating: z.number().int().min(1).max(5),
  staff_rating: z.number().int().min(1).max(5),
  value_rating: z.number().int().min(1).max(5),
  overall_rating: z.number().min(1).max(5).transform(val => Number(val.toFixed(2))),
  title: z.string().min(5).max(100),
  comment: z.string().min(20).max(2000),
  pros: z.string().max(500).optional(),
  cons: z.string().max(500).optional(),
});