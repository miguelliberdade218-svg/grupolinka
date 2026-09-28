// src/jobs/autoConfirmBookingsJob.ts - Job para Auto-Confirmação de Reservas
import { db } from "../../db";
import { hotelBookings, rides, eventBookings } from "../../shared/schema";
import { eq, lt, and, lte } from "drizzle-orm";

export const autoConfirmBookingsJob = {
  
  async executeAutoConfirmations() {
    try {
      console.log('[AUTO-CONFIRM] Iniciando job de auto-confirmação...');
      const startTime = Date.now();

      await autoConfirmBookingsJob.autoConfirmRides();
      await autoConfirmBookingsJob.autoCheckInHotels();
      await autoConfirmBookingsJob.autoCheckOutHotels();
      await autoConfirmBookingsJob.autoCompleteEvents();

      const duration = Date.now() - startTime;
      console.log(`[AUTO-CONFIRM] Job completado em ${duration}ms`);
    } catch (error) {
      console.error('[AUTO-CONFIRM] Erro:', error);
    }
  },

  async autoConfirmRides() {
    try {
      const now = new Date();
      
      const ridesToConfirm = await db.select()
        .from(rides)
        .where(
          and(
            lt(rides.departureDate, now),
            eq(rides.status, 'available')
          )
        );

      if (ridesToConfirm.length === 0) return;

      console.log(`[AUTO-CONFIRM] Encontrados ${ridesToConfirm.length} rides para confirmar`);

      for (const ride of ridesToConfirm) {
        await db.update(rides)
          .set({ 
            status: 'completed', 
            updatedAt: now 
          })
          .where(eq(rides.id, ride.id));

        console.log(`[AUTO-CONFIRM] Ride ${ride.id.substring(0, 8)} confirmada`);
      }
    } catch (error) {
      console.error('[AUTO-CONFIRM] Erro em autoConfirmRides:', error);
    }
  },

  async autoCheckInHotels() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const bookingsToCheckIn = await db.select()
        .from(hotelBookings)
        .where(
          and(
            eq(hotelBookings.status, 'confirmed'),
            lte(hotelBookings.checkIn, todayStr as any)
          )
        );

      if (bookingsToCheckIn.length === 0) return;

      console.log(`[AUTO-CONFIRM] Encontradas ${bookingsToCheckIn.length} reservas para check-in`);

      const now = new Date();
      for (const booking of bookingsToCheckIn) {
        await db.update(hotelBookings)
          .set({ 
            status: 'checked_in',
            checkedInAt: now,
            updatedAt: now 
          })
          .where(eq(hotelBookings.id, booking.id));

        console.log(`[AUTO-CONFIRM] Hotel booking ${booking.id.substring(0, 8)} checked-in`);
      }
    } catch (error) {
      console.error('[AUTO-CONFIRM] Erro em autoCheckInHotels:', error);
    }
  },

  async autoCheckOutHotels() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const bookingsToCheckOut = await db.select()
        .from(hotelBookings)
        .where(
          and(
            eq(hotelBookings.status, 'checked_in'),
            lte(hotelBookings.checkOut, todayStr as any)
          )
        );

      if (bookingsToCheckOut.length === 0) return;

      console.log(`[AUTO-CONFIRM] Encontradas ${bookingsToCheckOut.length} reservas para check-out`);

      const now = new Date();
      for (const booking of bookingsToCheckOut) {
        await db.update(hotelBookings)
          .set({ 
            status: 'checked_out',
            paymentStatus: 'complete',
            checkedOutAt: now,
            updatedAt: now
          })
          .where(eq(hotelBookings.id, booking.id));

        console.log(`[AUTO-CONFIRM] Hotel booking ${booking.id.substring(0, 8)} checked-out`);
      }
    } catch (error) {
      console.error('[AUTO-CONFIRM] Erro em autoCheckOutHotels:', error);
    }
  },

  async autoCompleteEvents() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      const eventsToComplete = await db.select()
        .from(eventBookings)
        .where(
          and(
            eq(eventBookings.status, 'confirmed'),
            lte(eventBookings.endDate, todayStr as any)
          )
        );

      if (eventsToComplete.length === 0) return;

      console.log(`[AUTO-CONFIRM] Encontrados ${eventsToComplete.length} eventos para completar`);

      const now = new Date();
      for (const event of eventsToComplete) {
        await db.update(eventBookings)
          .set({ 
            status: 'completed',
            updatedAt: now
          })
          .where(eq(eventBookings.id, event.id));

        console.log(`[AUTO-CONFIRM] Event booking ${event.id.substring(0, 8)} completado`);
      }
    } catch (error) {
      console.error('[AUTO-CONFIRM] Erro em autoCompleteEvents:', error);
    }
  }
};
