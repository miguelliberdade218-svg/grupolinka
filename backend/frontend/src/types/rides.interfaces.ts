export interface Ride {
  ride_id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;

  departure: string;
  destination: string;

  departure_lat: number;
  departure_lng: number;
  destination_lat: number;
  destination_lng: number;

  departure_date: string;
  departure_time: string;

  seats_total: number;
  seats_available: number;

  price_per_seat: number;
  currency: string;

  car_model?: string;
  car_color?: string;
  car_plate?: string;

  match_score?: number;
  distance_km?: number;
  estimated_duration?: number;

  created_at: string;
}

export interface RideSearchParams {
  from: string;
  to: string;
  date?: string;
  passengers?: number;
}

export interface RideSearchResponse {
  success: boolean;
  rides: Ride[];
}

export interface RideBookingRequest {
  rideId: string;
  userId: string;
  seats: number;
}

export interface RideBookingResponse {
  success: boolean;
  bookingId?: string;
  error?: string;
}
