import { useState, useEffect } from "react";
import { Booking, RideBookingRequest, HotelBookingRequest } from "../types/booking";
import { apiService } from "@/services/api";
import { useAuth } from "./useAuth";

type BookingResponse = {
  success: boolean;
  booking: Booking;
};

export const useBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== Create new booking =====
  const createBooking = async (
    type: "ride" | "hotel" | "event",
    details: any
  ): Promise<{ success: boolean; booking?: Booking; error?: any }> => {
    if (!user) {
      return { success: false, error: new Error("User not authenticated") };
    }

    try {
      let bookingData: RideBookingRequest | HotelBookingRequest | any;

      // fallback seguro para guest info
      const safeGuestInfo = {
        name: user.displayName || "Guest",
        email: user.email || "sem-email@exemplo.com",
        phone: user.phoneNumber || "000000000",
      };

      if (type === "ride") {
        // 🔄 Corrigido para alinhar com o backend (/book rides)
        bookingData = {
          rideId: details.id,
          passengerId: user.uid,
          seatsBooked: details.passengers,
          totalPrice: details.totalAmount || 0,
          guestName: safeGuestInfo.name,
          guestEmail: safeGuestInfo.email,
          guestPhone: safeGuestInfo.phone,
        } as RideBookingRequest;
      } else if (type === "hotel") {
        // 🏨 Novo formato alinhado ao backend (/book hotels)
        bookingData = {
          accommodationId: details.id,
          passengerId: user.uid,
          totalPrice: details.totalPrice || 0,
          guestName: safeGuestInfo.name,
          guestEmail: safeGuestInfo.email,
          guestPhone: safeGuestInfo.phone,
          checkInDate: details.checkIn,
          checkOutDate: details.checkOut,
        } as HotelBookingRequest;
      } else {
        // 🎫 Eventos ou outros
        bookingData = {
          ...details,
          passengerId: user.uid,
          guestName: safeGuestInfo.name,
          guestEmail: safeGuestInfo.email,
          guestPhone: safeGuestInfo.phone,
        };
      }

      const response: BookingResponse = await apiService.createBooking(bookingData);

      return { success: true, booking: response.booking };
    } catch (error) {
      console.error("Booking error:", error);
      return { success: false, error };
    }
  };

  // ===== Fetch user's bookings =====
  useEffect(() => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchBookings = async () => {
      try {
        const response = await apiService.getUserBookings();
        setBookings((response as Booking[]) || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  return { bookings, loading, createBooking };
};