// ===== Tipo principal de Booking ===== 
export interface Booking {  
  id?: string;
  passengerId: string; // alinhado com backend
  rideId?: string;
  accommodationId?: string;
  type: "ride" | "hotel";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalPrice: number;
  seatsBooked?: number;   // ride
  passengers?: number;    // ride
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate?: string;   // hotel
  checkOutDate?: string;  // hotel
  createdAt?: Date;
  updatedAt?: Date;
}

// ===== Tipos auxiliares para frontend =====
export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
}

// 🚖 RideBookingRequest (alinhado com backend)
export interface RideBookingRequest {
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
}

// 🏨 HotelBookingRequest (alinhado com backend)
export interface HotelBookingRequest {
  accommodationId: string;
  passengerId: string;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
}