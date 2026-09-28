import { useAuth } from '../../../contexts/authContext';
import { useApiClient } from '../../../hooks/useApiClient';
import { useEffect, useState } from 'react';
import { useNotification } from '../../../hooks/useNotification';

export interface DriverData {
  id: string;
  name: string;
  email: string;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  activeRoutes: number;
  verified: boolean;
  avatar?: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  requests: number;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface DriverEarnings {
  totalMonth: number;
  totalYear: number;
  averagePerRide: number;
  ridesToday: number;
  earningsThisMonth: number;
  earningsLastMonth: number;
  pending: number;
}

export interface DriverReview {
  id: string;
  from: string;
  rating: number;
  comment: string;
  date: string;
  rideType: 'shared' | 'private';
  response?: string;
}

export const useDriverData = () => {
  const { user, token } = useAuth();
  const api = useApiClient();
  const { error: errorNotification } = useNotification();

  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [reviews, setReviews] = useState<DriverReview[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados do motorista
  const fetchDriverData = async () => {
    if (!user || user.userType !== 'driver') return;

    setLoading(true);
    try {
      const data = await api.get<DriverData>(`/api/drivers/${user.id}`);
      setDriverData(data);
    } catch (error) {
      errorNotification(`Erro ao carregar dados: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Carregar rotas do motorista
  const fetchRoutes = async () => {
    if (!user) return;

    try {
      const data = await api.get<Route[]>(`/api/drivers/${user.id}/routes`);
      setRoutes(data);
    } catch (error) {
      errorNotification(`Erro ao carregar rotas: ${error}`);
    }
  };

  // Carregar ganhos
  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const data = await api.get<DriverEarnings>(`/api/drivers/${user.id}/earnings`);
      setEarnings(data);
    } catch (error) {
      errorNotification(`Erro ao carregar ganhos: ${error}`);
    }
  };

  // Carregar avaliações
  const fetchReviews = async () => {
    if (!user) return;

    try {
      const data = await api.get<DriverReview[]>(`/api/drivers/${user.id}/reviews`);
      setReviews(data);
    } catch (error) {
      errorNotification(`Erro ao carregar avaliações: ${error}`);
    }
  };

  // Criar nova rota
  const createRoute = async (routeData: Omit<Route, 'id' | 'createdAt' | 'status'>) => {
    if (!user) return;

    try {
      const data = await api.post<Route>(`/api/drivers/${user.id}/routes`, routeData);
      setRoutes([...routes, data]);
      return data;
    } catch (error) {
      errorNotification(`Erro ao criar rota: ${error}`);
      throw error;
    }
  };

  // Responder para avaliação
  const respondToReview = async (reviewId: string, response: string) => {
    if (!user) return;

    try {
      const updated = await api.patch<DriverReview>(
        `/api/drivers/${user.id}/reviews/${reviewId}`,
        { response }
      );
      
      setReviews(reviews.map((r) => (r.id === reviewId ? updated : r)));
      return updated;
    } catch (error) {
      errorNotification(`Erro ao responder avaliação: ${error}`);
      throw error;
    }
  };

  // Carregar todos os dados ao montar
  useEffect(() => {
    if (user && user.userType === 'driver') {
      fetchDriverData();
      fetchRoutes();
      fetchEarnings();
      fetchReviews();
    }
  }, [user]);

  return {
    driverData,
    routes,
    earnings,
    reviews,
    loading,
    fetchDriverData,
    fetchRoutes,
    fetchEarnings,
    fetchReviews,
    createRoute,
    respondToReview,
  };
};
