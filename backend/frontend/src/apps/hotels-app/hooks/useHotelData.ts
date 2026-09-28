import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authContext';
import { useApiClient } from '@/hooks/useApiClient';
import { useNotification } from '@/hooks/useNotification';

// Interfaces
export interface HotelData {
  id: string;
  name: string;
  email: string;
  city: string;
  verified: boolean;
  rating: number;
  totalReviews: number;
  totalReservations: number;
  occupancyRate: number;
  avatar?: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface Room {
  id: string;
  number: string;
  type: 'single' | 'double' | 'suite' | 'presidential';
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  images: string[];
  available: boolean;
  bookings: number;
}

export interface HotelReservation {
  id: string;
  guestName: string;
  guestEmail: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
  createdAt: string;
  specialRequests?: string;
}

export interface HotelReview {
  id: string;
  from: string;
  rating: number;
  comment: string;
  date: string;
  roomType: string;
  response?: string;
}

export interface HotelEarnings {
  totalMonth: number;
  totalYear: number;
  reservationsThisMonth: number;
  averagePerReservation: number;
  earningsThisMonth: number;
  earningsLastMonth: number;
  pending: number;
  paymentSchedule: string;
}

// Custom Hook
export function useHotelData() {
  const { user } = useAuth();
  const apiClient = useApiClient();
  const { notify } = useNotification();

  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [reviews, setReviews] = useState<HotelReview[]>([]);
  const [earnings, setEarnings] = useState<HotelEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch hotel data
  const fetchHotelData = async () => {
    try {
      if (!user?.id) return;
      const data = await apiClient.get<HotelData>(`/api/hotels/${user.id}`);
      setHotelData(data);
    } catch (error) {
      notify(`Erro ao carregar dados do hotel`, 'error');
      console.error('Error fetching hotel data:', error);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      if (!user?.id) return;
      const data = await apiClient.get<Room[]>(`/api/hotels/${user.id}/rooms`);
      setRooms(data);
    } catch (error) {
      notify(`Erro ao carregar quartos`, 'error');
      console.error('Error fetching rooms:', error);
    }
  };

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      if (!user?.id) return;
      const data = await apiClient.get<HotelReservation[]>(
        `/api/hotels/${user.id}/reservations`
      );
      setReservations(data);
    } catch (error) {
      notify(`Erro ao carregar reservas`, 'error');
      console.error('Error fetching reservations:', error);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      if (!user?.id) return;
      const data = await apiClient.get<HotelReview[]>(
        `/api/hotels/${user.id}/reviews`
      );
      setReviews(data);
    } catch (error) {
      notify(`Erro ao carregar avaliações`, 'error');
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetch earnings
  const fetchEarnings = async () => {
    try {
      if (!user?.id) return;
      const data = await apiClient.get<HotelEarnings>(
        `/api/hotels/${user.id}/earnings`
      );
      setEarnings(data);
    } catch (error) {
      notify(`Erro ao carregar ganhos`, 'error');
      console.error('Error fetching earnings:', error);
    }
  };

  // Create/Update room
  const createRoom = async (roomData: Partial<Room>) => {
    try {
      if (!user?.id) return;
      const data = await apiClient.post<Room>(
        `/api/hotels/${user.id}/rooms`,
        roomData
      );
      setRooms([...rooms, data]);
      notify('Quarto criado com sucesso!', 'success');
      return data;
    } catch (error) {
      notify(`Erro ao criar quarto`, 'error');
      console.error('Error creating room:', error);
    }
  };

  // Update reservation status
  const updateReservationStatus = async (
    reservationId: string,
    status: HotelReservation['status']
  ) => {
    try {
      if (!user?.id) return;
      const data = await apiClient.patch<HotelReservation>(
        `/api/hotels/${user.id}/reservations/${reservationId}`,
        { status }
      );
      setReservations(
        reservations.map((r) => (r.id === reservationId ? data : r))
      );
      notify('Status da reserva atualizado!', 'success');
      return data;
    } catch (error) {
      notify(`Erro ao atualizar status da reserva`, 'error');
      console.error('Error updating reservation:', error);
    }
  };

  // Respond to review
  const respondToReview = async (reviewId: string, response: string) => {
    try {
      if (!user?.id) return;
      const data = await apiClient.patch<HotelReview>(
        `/api/hotels/${user.id}/reviews/${reviewId}`,
        { response }
      );
      setReviews(reviews.map((r) => (r.id === reviewId ? data : r)));
      notify('Resposta adicionada com sucesso!', 'success');
      return data;
    } catch (error) {
      notify(`Erro ao responder avaliação`, 'error');
      console.error('Error responding to review:', error);
    }
  };

  // Auto-fetch on user change
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        fetchHotelData(),
        fetchRooms(),
        fetchReservations(),
        fetchReviews(),
        fetchEarnings(),
      ]).then(() => setLoading(false));
    }
  }, [user?.id]);

  return {
    hotelData,
    rooms,
    reservations,
    reviews,
    earnings,
    loading,
    // Methods
    fetchHotelData,
    fetchRooms,
    fetchReservations,
    fetchReviews,
    fetchEarnings,
    createRoom,
    updateReservationStatus,
    respondToReview,
  };
}
