// src/modules/reviews/rideReviewService.ts - Serviço para Reviews de Rides
import { db } from "../../../db";
import { 
  ride_reviews, 
  ride_passenger_reviews,
  rides,
  users 
} from "../../../shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export const rideReviewService = {
  
  // CRIAR: Review do passageiro para motorista
  async createPassengerReview(data: {
    ride_id: string;
    booking_id?: string;
    from_user_id: string;
    to_user_id: string;
    driver_rating: number;
    cleanliness_rating?: number;
    communication_rating?: number;
    vehicle_condition_rating?: number;
    route_quality_rating?: number;
    safety_rating?: number;
    title: string;
    comment: string;
    pros?: string;
    cons?: string;
  }) {
    try {
      // Calcular overall_rating (média das dimensões)
      const ratings = [
        data.driver_rating,
        data.cleanliness_rating || 5,
        data.communication_rating || 5,
        data.vehicle_condition_rating || 5,
        data.route_quality_rating || 5,
        data.safety_rating || 5
      ];
      const overall = ratings.reduce((a, b) => a + b) / ratings.length;

      const review = await db.insert(ride_reviews)
        .values({
          ride_id: data.ride_id,
          booking_id: data.booking_id,
          from_user_id: data.from_user_id,
          to_user_id: data.to_user_id,
          driver_rating: data.driver_rating,
          cleanliness_rating: data.cleanliness_rating,
          communication_rating: data.communication_rating,
          vehicle_condition_rating: data.vehicle_condition_rating,
          route_quality_rating: data.route_quality_rating,
          safety_rating: data.safety_rating,
          title: data.title,
          comment: data.comment,
          pros: data.pros,
          cons: data.cons,
          overall_rating: Number(overall.toFixed(2)),
          is_verified: true,
          is_published: true,
          created_at: new Date(),
        } as any);

      // Auto-check driver reputation
      await rideReviewService.checkDriverReputation(data.to_user_id);

      return { success: true, review };
    } catch (error: any) {
      console.error('Erro em createPassengerReview:', error);
      throw error;
    }
  },

  // CRIAR: Review do motorista para passageiro
  async createDriverReview(data: {
    ride_id: string;
    from_driver_id: string;
    to_passenger_id: string;
    passenger_behavior_rating: number;
    cleanliness_rating?: number;
    communication_rating?: number;
    payment_behavior_rating?: number;
    punctuality_rating?: number;
    title: string;
    comment: string;
  }) {
    try {
      const ratings = [
        data.passenger_behavior_rating,
        data.cleanliness_rating || 5,
        data.communication_rating || 5,
        data.payment_behavior_rating || 5,
        data.punctuality_rating || 5
      ];
      const overall = ratings.reduce((a, b) => a + b) / ratings.length;

      return await db.insert(ride_passenger_reviews)
        .values({
          ride_id: data.ride_id,
          from_driver_id: data.from_driver_id,
          to_passenger_id: data.to_passenger_id,
          passenger_behavior_rating: data.passenger_behavior_rating,
          cleanliness_rating: data.cleanliness_rating,
          communication_rating: data.communication_rating,
          payment_behavior_rating: data.payment_behavior_rating,
          punctuality_rating: data.punctuality_rating,
          title: data.title,
          comment: data.comment,
          overall_rating: Number(overall.toFixed(2)),
          is_published: true,
          created_at: new Date(),
        } as any);
    } catch (error: any) {
      console.error('Erro em createDriverReview:', error);
      throw error;
    }
  },

  // OBTER: Reviews de um motorista
  async getDriverReviews(driverId: string) {
    try {
      return await db.select()
        .from(ride_reviews)
        .where(eq(ride_reviews.to_user_id, driverId))
        .orderBy(desc(ride_reviews.created_at));
    } catch (error: any) {
      console.error('Erro em getDriverReviews:', error);
      return [];
    }
  },

  // OBTER: Reviews de uma viagem específica
  async getRideReviews(rideId: string) {
    try {
      return await db.select()
        .from(ride_reviews)
        .where(eq(ride_reviews.ride_id, rideId));
    } catch (error: any) {
      console.error('Erro em getRideReviews:', error);
      return [];
    }
  },

  // OBTER: Reviews de um passageiro (recebidas de motoristas)
  async getPassengerReviews(passengerId: string) {
    try {
      return await db.select()
        .from(ride_passenger_reviews)
        .where(eq(ride_passenger_reviews.to_passenger_id, passengerId))
        .orderBy(desc(ride_passenger_reviews.created_at));
    } catch (error: any) {
      console.error('Erro em getPassengerReviews:', error);
      return [];
    }
  },

  // UPDATE: Resposta do motorista a um review - REMOVIDO (campos não existem em schema)

    // CHECK: Rating média do motorista (auto-suspender se < 3.5 em 10+ reviews)
  async checkDriverReputation(driverId: string) {
    try {
      const reviews = await db.select()
        .from(ride_reviews)
        .where(eq(ride_reviews.to_user_id, driverId));

      if (reviews.length >= 10) {
        const avgRating = reviews
          .filter((r: any) => r.overall_rating)
          .reduce((sum: number, r: any) => sum + Number(r.overall_rating), 0) / reviews.length;

        if (avgRating < 3.5) {
          // Auto-suspend driver por 30 dias
          const suspensionEndDate = new Date();
          suspensionEndDate.setDate(suspensionEndDate.getDate() + 30);
          
          // Converter Date para string no formato YYYY-MM-DD para campo date do Drizzle
          const suspensionEndDateStr = suspensionEndDate.toISOString().split('T')[0];

          await db.update(users)
            .set({
              driverSuspendedAt: new Date(),
              driverSuspensionReason: `Low rating (${avgRating.toFixed(2)}) from ${reviews.length} reviews`,
              driverSuspensionEndDate: suspensionEndDateStr as any,
            })
            .where(eq(users.id, driverId));

          console.log(`[AUTO-SUSPEND] Driver ${driverId} suspended due to low rating (${avgRating.toFixed(2)})`);
        }
      }
    } catch (error: any) {
      console.error('Erro em checkDriverReputation:', error);
    }
  },

  // OBTER: Estatísticas de um motorista
  async getDriverStats(driverId: string) {
    try {
      const reviews = await db.select()
        .from(ride_reviews)
        .where(eq(ride_reviews.to_user_id, driverId));

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      }

      const validReviews = reviews.filter((r: any) => r.overall_rating);
      const avgRating = validReviews.length > 0
        ? validReviews.reduce((sum: number, r: any) => sum + Number(r.overall_rating), 0) / validReviews.length
        : 0;

      const byRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      validReviews.forEach((r: any) => {
        const rating = Math.round(Number(r.overall_rating));
        if (rating >= 1 && rating <= 5) {
          byRating[rating as keyof typeof byRating]++;
        }
      });

      return {
        totalReviews: reviews.length,
        averageRating: Number(avgRating.toFixed(2)),
        byRating
      };
    } catch (error: any) {
      console.error('Erro em getDriverStats:', error);
      return { totalReviews: 0, averageRating: 0, byRating: {} };
    }
  }
};
