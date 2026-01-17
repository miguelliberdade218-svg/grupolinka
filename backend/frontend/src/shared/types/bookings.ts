/**
 * src/shared/types/bookings.ts
 * Tipos para gestão de bookings de hotéis e event spaces
 * Alinhado com hotelController.ts e eventController.ts (13/01/2026)
 */

// ==================== HOTEL BOOKINGS ====================
export interface HotelBooking {
  id: string;
  hotelId: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  units: number;
  nights?: number;
  basePrice: string; // Decimal como string
  discountAmount?: string | null;
  totalPrice: string;
  specialRequests?: string | null;
  promoCode?: string | null;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'partial' | 'paid';
  userId?: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
}

export interface CreateHotelBookingRequest {
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  units?: number;
  specialRequests?: string | null;
  promoCode?: string | null;
  status?: string;
  paymentStatus?: string;
  userId?: string | null;
}

export interface UpdateHotelBookingRequest {
  guestName?: string;
  guestPhone?: string | null;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  units?: number;
  specialRequests?: string | null;
  promoCode?: string | null;
  status?: string;
  paymentStatus?: string;
}

export interface HotelBookingDetails {
  booking: HotelBooking;
  roomType: {
    id: string;
    name: string;
    capacity: number;
    basePrice: string;
  };
  hotel: {
    id: string;
    name: string;
    locality: string;
    province: string;
    contactEmail: string;
  };
  pricing: {
    basePrice: string;
    discount: string;
    totalPrice: string;
    nights: number;
    pricePerNight: string;
  };
}

// ==================== EVENT SPACE BOOKINGS ====================
export interface EventSpaceBooking {
  id: string;
  eventSpaceId: string;
  hotelId: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string | null;
  eventTitle: string;
  eventDescription?: string | null;
  eventType: string;
  startDatetime: string; // ISO datetime
  endDatetime: string; // ISO datetime
  expectedAttendees: number;
  basePrice: string; // Decimal como string
  equipmentFees?: string | null;
  serviceFees?: string | null;
  weekendSurcharge?: string | null;
  securityDeposit?: string | null;
  depositPaid?: string | null;
  totalPrice: string;
  durationHours?: string | null;
  specialRequests?: string | null;
  additionalServices?: Record<string, any>;
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentReference?: string | null;
  invoiceNumber?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface CreateEventSpaceBookingRequest {
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string;
  event_title: string;
  event_description?: string;
  event_type: string;
  start_datetime: string; // ISO datetime
  end_datetime: string; // ISO datetime
  expected_attendees: number;
  special_requests?: string;
  additional_services?: Record<string, any>;
  user_id?: string;
}

export interface UpdateEventSpaceBookingRequest {
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string | null;
  event_title?: string;
  event_description?: string | null;
  event_type?: string;
  start_datetime?: string;
  end_datetime?: string;
  expected_attendees?: number;
  special_requests?: string | null;
  status?: string;
  payment_status?: string;
}

export interface EventSpaceBookingDetails {
  booking: EventSpaceBooking;
  space: {
    id: string;
    name: string;
    spaceType: string;
    capacityMin: number;
    capacityMax: number;
  };
  hotel: {
    id: string;
    name: string;
    locality: string;
  };
  pricing: {
    basePrice: string;
    totalPrice: string;
    durationHours: number;
  };
}

// ==================== BOOKINGS RESPONSE ====================
export interface BookingResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface BookingsListResponse {
  success: boolean;
  data: Array<HotelBooking | EventSpaceBooking>;
  count: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ==================== FILTROS DE BUSCA ====================
export interface HotelBookingFilters {
  status?: string | string[];
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestEmail?: string;
  limit?: number;
  offset?: number;
}

export interface EventSpaceBookingFilters {
  status?: string | string[];
  startDate?: string;
  endDate?: string;
  organizerName?: string;
  organizerEmail?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}

// ==================== CHECK-IN / CHECK-OUT ====================
export interface CheckInRequest {
  notes?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data: HotelBooking;
  error?: string;
}

export interface CheckOutRequest {
  notes?: string;
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  data: HotelBooking;
  error?: string;
}

// ==================== CANCELAMENTO ====================
export interface CancelBookingRequest {
  reason: string;
}

export interface RejectBookingRequest {
  reason: string;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  data: HotelBooking | EventSpaceBooking;
  error?: string;
}

// ==================== RESUMO ESTATÍSTICO ====================
export interface BookingsSummary {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  paidBookings: number;
  pendingPaymentBookings: number;
}

export interface UpcomingCheckIns {
  booking: HotelBooking;
  roomType: {
    name: string;
  };
}
