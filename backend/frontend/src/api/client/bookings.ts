import { apiRequest } from '../../shared/lib/queryClient';

export interface CreateBookingRequest {
  serviceType: 'ride' | 'accommodation';
  serviceId: string;
  clientId: string;
  contactPhone: string;
  contactEmail: string;
  // Para viagens
  seatsBooked?: number;
  // Para alojamentos
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  serviceType: 'ride' | 'accommodation';
  serviceId: string;
  serviceName: string;
  clientId: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  seatsBooked?: number;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  nights?: number;
  specialRequests?: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

// API Client para clientes gerirem reservas
export const clientBookingsApi = {
  // Criar nova reserva
  create: async (bookingData: CreateBookingRequest): Promise<{ success: boolean; message: string; booking: Booking }> => {
    console.log('📝 [CLIENT API] Criando reserva:', bookingData);
    
    const response = await apiRequest('POST', '/api/client/bookings/create', bookingData);
    return response.json();
  },

  // Listar minhas reservas
  getMyBookings: async (clientId: string): Promise<{ success: boolean; bookings: Booking[] }> => {
    console.log('🔍 [CLIENT API] Buscando minhas reservas:', clientId);
    
    const response = await apiRequest('GET', `/api/client/bookings/my-bookings/${clientId}`);
    return response.json();
  },

  // Cancelar reserva
  cancel: async (bookingId: string): Promise<{ success: boolean; message: string; booking: Booking }> => {
    console.log('🚫 [CLIENT API] Cancelando reserva:', bookingId);
    
    const response = await apiRequest('PATCH', `/api/client/bookings/${bookingId}/cancel`);
    return response.json();
  }
};

export default clientBookingsApi;