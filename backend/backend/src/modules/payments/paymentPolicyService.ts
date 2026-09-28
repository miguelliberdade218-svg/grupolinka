// src/modules/payments/paymentPolicyService.ts - Serviço para Políticas de Pagamento
import { db } from "../../../db";
import {
  hotel_payment_policies,
  driver_payment_policies,
  eventspace_payment_policies,
  hotel_booking_payment_history,
  ride_payment_history
} from "../../../shared/schema";
import { eq } from "drizzle-orm";

export const paymentPolicyService = {
  
  // ==================== HOTEL PAYMENT POLICIES ====================
  
  async getHotelPaymentPolicy(hotelId: string) {
    try {
      const policy = await db.select()
        .from(hotel_payment_policies)
        .where(eq(hotel_payment_policies.hotel_id, hotelId))
        .limit(1);
      
      return policy[0] || this.getDefaultHotelPolicy();
    } catch (error: any) {
      console.error('Erro em getHotelPaymentPolicy:', error);
      return this.getDefaultHotelPolicy();
    }
  },

  async updateHotelPaymentPolicy(hotelId: string, data: any) {
    try {
      // Validate percentages
      if (data.advance_payment_percentage && data.advance_payment_percentage > 100) {
        throw new Error('Advance payment percentage cannot exceed 100%');
      }
      if (data.deposit_percentage && data.deposit_percentage > 100) {
        throw new Error('Deposit percentage cannot exceed 100%');
      }

      const existing = await db.select()
        .from(hotel_payment_policies)
        .where(eq(hotel_payment_policies.hotel_id, hotelId))
        .limit(1);

      if (existing.length > 0) {
        return await db.update(hotel_payment_policies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(hotel_payment_policies.hotel_id, hotelId));
      } else {
        return await db.insert(hotel_payment_policies)
          .values({
            hotel_id: hotelId,
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          } as any);
      }
    } catch (error: any) {
      console.error('Erro em updateHotelPaymentPolicy:', error);
      throw error;
    }
  },

  getDefaultHotelPolicy() {
    return {
      advance_payment_enabled: false,
      advance_payment_percentage: 0.00,
      advance_payment_required: false,
      deposit_enabled: true,
      deposit_percentage: 30.00,
      deposit_required: true,
      final_payment_due_days: 7,
      pay_at_location_enabled: false,
      default_payment_option: 'advance_deposit'
    };
  },

  // ==================== DRIVER PAYMENT POLICIES ====================

  async getDriverPaymentPolicy(driverId: string) {
    try {
      const policy = await db.select()
        .from(driver_payment_policies)
        .where(eq(driver_payment_policies.driver_id, driverId))
        .limit(1);
      
      return policy[0] || this.getDefaultDriverPolicy();
    } catch (error: any) {
      console.error('Erro em getDriverPaymentPolicy:', error);
      return this.getDefaultDriverPolicy();
    }
  },

  async updateDriverPaymentPolicy(driverId: string, data: any) {
    try {
      // Validate percentages
      if (data.advance_payment_percentage && data.advance_payment_percentage > 100) {
        throw new Error('Advance payment percentage cannot exceed 100%');
      }

      const existing = await db.select()
        .from(driver_payment_policies)
        .where(eq(driver_payment_policies.driver_id, driverId))
        .limit(1);

      if (existing.length > 0) {
        return await db.update(driver_payment_policies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(driver_payment_policies.driver_id, driverId));
      } else {
        return await db.insert(driver_payment_policies)
          .values({
            driver_id: driverId,
            entity_code: `DRIVER_${driverId.substring(0, 8).toUpperCase()}`,
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          } as any);
      }
    } catch (error: any) {
      console.error('Erro em updateDriverPaymentPolicy:', error);
      throw error;
    }
  },

  getDefaultDriverPolicy() {
    return {
      advance_payment_enabled: false,
      advance_payment_percentage: 0,
      advance_payment_required: false,
      pay_at_location_enabled: true,
      advance_payment_discount_percentage: 0
    };
  },

  // ==================== EVENT SPACE PAYMENT POLICIES ====================

  async getEventSpacePaymentPolicy(eventSpaceId: string) {
    try {
      const policy = await db.select()
        .from(eventspace_payment_policies)
        .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId))
        .limit(1);
      
      return policy[0] || this.getDefaultEventSpacePolicy();
    } catch (error: any) {
      console.error('Erro em getEventSpacePaymentPolicy:', error);
      return this.getDefaultEventSpacePolicy();
    }
  },

  async updateEventSpacePaymentPolicy(eventSpaceId: string, data: any) {
    try {
      // Validate percentages
      if (data.advance_payment_percentage && data.advance_payment_percentage > 100) {
        throw new Error('Advance payment percentage cannot exceed 100%');
      }

      const existing = await db.select()
        .from(eventspace_payment_policies)
        .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId))
        .limit(1);

      if (existing.length > 0) {
        return await db.update(eventspace_payment_policies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId));
      } else {
        return await db.insert(eventspace_payment_policies)
          .values({
            event_space_id: eventSpaceId,
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          } as any);
      }
    } catch (error: any) {
      console.error('Erro em updateEventSpacePaymentPolicy:', error);
      throw error;
    }
  },

  getDefaultEventSpacePolicy() {
    return {
      advance_payment_enabled: true,
      advance_payment_percentage: 50.00,
      advance_payment_required: true,
      non_refundable_deposit_percentage: 0,
      final_payment_due_days: 14,
      installment_enabled: false,
      cancellation_refund_policy: 'tiered'
    };
  },

  // ==================== PAYMENT HISTORY ====================

  async recordHotelPayment(bookingId: string, hotelId: string, paymentData: any) {
    try {
      return await db.insert(hotel_booking_payment_history)
        .values({
          booking_id: bookingId,
          hotel_id: hotelId,
          ...paymentData,
          created_at: new Date(),
          updated_at: new Date()
        } as any);
    } catch (error: any) {
      console.error('Erro em recordHotelPayment:', error);
      throw error;
    }
  },

  async recordRidePayment(rideId: string, driverId: string, paymentData: any) {
    try {
      return await db.insert(ride_payment_history)
        .values({
          ride_id: rideId,
          driver_id: driverId,
          ...paymentData,
          created_at: new Date(),
          updated_at: new Date()
        } as any);
    } catch (error: any) {
      console.error('Erro em recordRidePayment:', error);
      throw error;
    }
  },

  async getPaymentHistory(bookingId: string, type: 'hotel' | 'event' | 'ride') {
    try {
      if (type === 'hotel') {
        return await db.select()
          .from(hotel_booking_payment_history)
          .where(eq(hotel_booking_payment_history.booking_id, bookingId));
      } else if (type === 'ride') {
        return await db.select()
          .from(ride_payment_history)
          .where(eq(ride_payment_history.ride_id, bookingId));
      }
      return [];
    } catch (error: any) {
      console.error('Erro em getPaymentHistory:', error);
      return [];
    }
  }
};
