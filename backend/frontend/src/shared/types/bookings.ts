/**
 * src/shared/types/bookings.ts
 * Tipos para gestão de bookings de hotéis e event spaces - CORRIGIDO
 * Alinhado com hotelController.ts (18/01/2026) e eventController.ts (13/01/2026)
 */

// ==================== HOTEL BOOKINGS ====================
export interface HotelBooking {
  id: string;
  hotel_id: string; // ✅ CORRIGIDO: snake_case
  room_type_id: string; // ✅ CORRIGIDO: snake_case
  guest_name: string; // ✅ CORRIGIDO: snake_case
  guest_email: string; // ✅ CORRIGIDO: snake_case
  guest_phone?: string | null; // ✅ CORRIGIDO: snake_case
  check_in: string; // ✅ CORRIGIDO: snake_case - YYYY-MM-DD
  check_out: string; // ✅ CORRIGIDO: snake_case - YYYY-MM-DD
  adults: number;
  children: number;
  units: number;
  nights?: number;
  base_price: string; // ✅ CORRIGIDO: snake_case - Decimal como string
  discount_amount?: string | null; // ✅ CORRIGIDO: snake_case
  total_price: string; // ✅ CORRIGIDO: snake_case
  special_requests?: string | null; // ✅ CORRIGIDO: snake_case
  promo_code?: string | null; // ✅ CORRIGIDO: snake_case
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'rejected';
  payment_status: 'pending' | 'partial' | 'paid'; // ✅ CORRIGIDO: snake_case
  user_id?: string | null; // ✅ CORRIGIDO: snake_case
  created_at: string; // ✅ CORRIGIDO: snake_case - ISO datetime
  updated_at: string; // ✅ CORRIGIDO: snake_case - ISO datetime
  cancelled_at?: string | null; // ✅ CORRIGIDO: snake_case
  cancelled_by?: string | null; // ✅ CORRIGIDO: snake_case
  cancellation_reason?: string | null; // ✅ CORRIGIDO: snake_case
  
  // Campos adicionais que podem vir do backend (JOINs)
  hotel_name?: string;
  room_type_name?: string;
  room_type_capacity?: number;
  hotel_locality?: string;
  hotel_province?: string;
}

export interface CreateHotelBookingRequest {
  roomTypeId: string; // ✅ O backend aceita ambos os formatos nas rotas POST
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
  guest_name?: string;
  guest_phone?: string | null;
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
  units?: number;
  special_requests?: string | null;
  promo_code?: string | null;
  status?: string;
  payment_status?: string;
}

export interface HotelBookingDetails {
  booking: HotelBooking;
  room_type: {
    id: string;
    name: string;
    capacity: number;
    base_price: string;
  };
  hotel: {
    id: string;
    name: string;
    locality: string;
    province: string;
    contact_email: string;
  };
  pricing: {
    base_price: string;
    discount: string;
    total_price: string;
    nights: number;
    price_per_night: string;
  };
}

// ==================== EVENT SPACE BOOKINGS ====================
export interface EventSpaceBooking {
  id: string;
  event_space_id: string; // ✅ CORRIGIDO: snake_case
  hotel_id: string; // ✅ CORRIGIDO: snake_case
  organizer_name: string; // ✅ CORRIGIDO: snake_case
  organizer_email: string; // ✅ CORRIGIDO: snake_case
  organizer_phone?: string | null; // ✅ CORRIGIDO: snake_case
  event_title: string; // ✅ CORRIGIDO: snake_case
  event_description?: string | null; // ✅ CORRIGIDO: snake_case
  event_type: string; // ✅ CORRIGIDO: snake_case
  start_datetime: string; // ✅ CORRIGIDO: snake_case - ISO datetime
  end_datetime: string; // ✅ CORRIGIDO: snake_case - ISO datetime
  expected_attendees: number; // ✅ CORRIGIDO: snake_case
  base_price: string; // ✅ CORRIGIDO: snake_case
  equipment_fees?: string | null; // ✅ CORRIGIDO: snake_case
  service_fees?: string | null; // ✅ CORRIGIDO: snake_case
  weekend_surcharge?: string | null; // ✅ CORRIGIDO: snake_case
  security_deposit?: string | null; // ✅ CORRIGIDO: snake_case
  deposit_paid?: string | null; // ✅ CORRIGIDO: snake_case
  total_price: string; // ✅ CORRIGIDO: snake_case
  duration_hours?: string | null; // ✅ CORRIGIDO: snake_case
  special_requests?: string | null; // ✅ CORRIGIDO: snake_case
  additional_services?: Record<string, any>;
  status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  payment_status: 'pending' | 'partial' | 'paid'; // ✅ CORRIGIDO: snake_case
  payment_reference?: string | null; // ✅ CORRIGIDO: snake_case
  invoice_number?: string | null; // ✅ CORRIGIDO: snake_case
  user_id?: string | null; // ✅ CORRIGIDO: snake_case
  created_at: string;
  updated_at: string;
  cancelled_at?: string | null; // ✅ CORRIGIDO: snake_case
  cancellation_reason?: string | null; // ✅ CORRIGIDO: snake_case
  
  // Campos adicionais que podem vir do backend (JOINs)
  event_space_name?: string;
  hotel_name?: string;
  space_type?: string;
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
    space_type: string; // ✅ CORRIGIDO: snake_case
    capacity_min: number; // ✅ CORRIGIDO: snake_case
    capacity_max: number; // ✅ CORRIGIDO: snake_case
  };
  hotel: {
    id: string;
    name: string;
    locality: string;
  };
  pricing: {
    base_price: string;
    total_price: string;
    duration_hours: number;
  };
}

// ==================== HELPER TYPES ====================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ path: string; message: string }>;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  message?: string;
  error?: string;
}

// ==================== FILTROS DE BUSCA ====================
export interface HotelBookingFilters {
  status?: string | string[];
  payment_status?: string; // ✅ CORRIGIDO: snake_case
  startDate?: string;
  endDate?: string;
  guest_name?: string; // ✅ CORRIGIDO: snake_case
  guest_email?: string; // ✅ CORRIGIDO: snake_case
  limit?: number;
  offset?: number;
}

export interface EventSpaceBookingFilters {
  status?: string | string[];
  startDate?: string;
  endDate?: string;
  organizer_name?: string; // ✅ CORRIGIDO: snake_case
  organizer_email?: string; // ✅ CORRIGIDO: snake_case
  event_type?: string; // ✅ CORRIGIDO: snake_case
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
  total_bookings: number; // ✅ CORRIGIDO: snake_case
  confirmed_bookings: number; // ✅ CORRIGIDO: snake_case
  pending_bookings: number; // ✅ CORRIGIDO: snake_case
  cancelled_bookings: number; // ✅ CORRIGIDO: snake_case
  total_revenue: number; // ✅ CORRIGIDO: snake_case
  paid_bookings: number; // ✅ CORRIGIDO: snake_case
  pending_payment_bookings: number; // ✅ CORRIGIDO: snake_case
}

export interface UpcomingCheckIns {
  booking: HotelBooking;
  room_type: { // ✅ CORRIGIDO: snake_case
    name: string;
  };
}

// ==================== FUNÇÕES HELPER ====================
// Helper para converter entre camelCase e snake_case
export function toSnakeCase<T>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    if (/[A-Z]/.test(key)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = obj[key];
    } else {
      result[key] = obj[key];
    }
  });
  return result as T;
}

export function toCamelCase<T>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    if (key.includes('_')) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = obj[key];
    } else {
      result[key] = obj[key];
    }
  });
  return result as T;
}

// Helper para adaptar requisições de criação
export function adaptCreateHotelBookingRequest(req: CreateHotelBookingRequest): Record<string, any> {
  return toSnakeCase(req);
}

export function adaptUpdateHotelBookingRequest(req: UpdateHotelBookingRequest): Record<string, any> {
  return toSnakeCase(req);
}

export function adaptHotelBookingResponse(res: any): HotelBooking {
  return toCamelCase(res) as HotelBooking;
}

export function adaptEventSpaceBookingResponse(res: any): EventSpaceBooking {
  return toCamelCase(res) as EventSpaceBooking;
}