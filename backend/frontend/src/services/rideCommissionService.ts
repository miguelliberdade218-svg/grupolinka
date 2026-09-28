// src/services/rideCommissionService.ts
// Serviço dedicado para gestão de viagens (start/complete) e comissões

import { auth } from '@/shared/lib/firebaseConfig';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ====================== HELPERS ======================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    let token: string | null = null;

    const firebaseToken = localStorage.getItem('firebaseToken');
    const storedToken = localStorage.getItem('token');

    const possibleTokens = [firebaseToken, storedToken];

    for (const possibleToken of possibleTokens) {
      if (possibleToken && typeof possibleToken === 'string' && possibleToken.trim().length > 0) {
        token = possibleToken;
        break;
      }
    }

    if (!token && auth.currentUser) {
      try {
        const freshToken = await auth.currentUser.getIdToken();
        if (freshToken && typeof freshToken === 'string' && freshToken.trim().length > 0) {
          token = freshToken;
          localStorage.setItem('firebaseToken', token);
        }
      } catch (firebaseError) {
        console.warn('⚠️ Erro ao obter token:', (firebaseError as Error).message);
      }
    }

    if (token && typeof token === 'string' && token.trim().length > 0) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('❌ Erro ao construir headers:', error);
  }

  return headers;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown
): Promise<T> {
  const baseHeaders = await getAuthHeaders();
  const url = `${BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: baseHeaders,
    mode: 'cors',
    credentials: 'include',
  };

  // Se for FormData, não fazer stringify
  if (data instanceof FormData) {
    const headers = { ...baseHeaders };
    delete headers['Content-Type'];
    config.headers = headers;
    config.body = data;
  } else if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorText = 'Erro desconhecido';
    try {
      errorText = await response.text();
    } catch (e) {}
    throw new Error(`${response.status}: ${errorText}`);
  }

  const responseText = await response.text();
  try {
    return JSON.parse(responseText) as T;
  } catch {
    return { success: true, data: responseText } as T;
  }
}

// ====================== TYPES ======================

export interface RideCommission {
  id: string;
  referenceNumber: string;
  type: 'ride' | 'hotel' | 'event';
  grossAmount: number;
  feeAmount: number;
  feePercentage?: number;
  netAmount?: number;
  status: 'pending' | 'proof_uploaded' | 'paid' | 'rejected';
  dueDate?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
  hasProof?: boolean;
  proofImageUrl?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

export interface DriverRideSimple {
  id: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  maxPassengers: number;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  totalBookings?: number;
}

// ====================== API METHODS ======================

export const rideCommissionService = {
  // ====================== 🚗 RIDE MANAGEMENT ======================

  /**
   * Iniciar uma corrida (muda status para in_progress)
   */
  async startRide(rideId: string): Promise<{ success: boolean; message: string; ride: any }> {
    return request('PATCH', `/api/driver/rides/${rideId}/start`);
  },

  /**
   * Completar uma corrida E gerar comissão automaticamente
   * Único botão: "Completar Corrida" já gera a comissão
   */
  async completeRide(rideId: string): Promise<{ success: boolean; message: string; ride: any; commission?: RideCommission }> {
    return request('POST', `/api/driver/rides/${rideId}/complete`);
  },

  /**
   * Buscar viagens do motorista pelo ID
   */
  async getDriverRides(driverId: string): Promise<{ success: boolean; rides: any[] }> {
    return request('GET', `/api/driver/rides/my-rides/${driverId}`);
  },

  /**
   * Cancelar uma corrida
   */
  async cancelRide(rideId: string, reason?: string): Promise<{ success: boolean; message: string; ride: any }> {
    return request('PATCH', `/api/driver/rides/${rideId}/cancel`, { reason });
  },

  // ====================== 💰 COMMISSIONS ======================

  /**
   * Obter comissões do motorista
   */
  async getDriverCommissions(driverId: string): Promise<{ success: boolean; data: RideCommission[] }> {
    return request('GET', `/api/provider/payments?limit=100`);
  },

  /**
   * Obter todas as comissões (admin)
   */
  async getAllCommissions(params?: {
    status?: string;
    driverId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: RideCommission[]; total?: number }> {
    let url = '/api/provider/payments/all';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.driverId) queryParams.append('driverId', params.driverId);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      const qs = queryParams.toString();
      if (qs) url += `?${qs}`;
    }
    return request('GET', url);
  },

  /**
   * Motorista marca comissão como paga (com upload de comprovativo)
   */
  async markAsPaid(
    commissionId: string,
    proofFile?: File,
    notes?: string
  ): Promise<{ success: boolean; message: string; data: RideCommission }> {
    if (proofFile) {
      const formData = new FormData();
      formData.append('proofFile', proofFile);
      if (notes) formData.append('notes', notes);
      return request('POST', `/api/provider/payments/${commissionId}/mark-paid`, formData);
    }
    return request('POST', `/api/provider/payments/${commissionId}/mark-paid`, { notes });
  },

  /**
   * Admin confirma pagamento da comissão
   */
  async confirmPayment(commissionId: string, notes?: string): Promise<{ success: boolean; message: string }> {
    return request('PATCH', `/api/provider/payments/${commissionId}/confirm`, { notes });
  },

  /**
   * Admin rejeita pagamento da comissão
   */
  async rejectPayment(commissionId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return request('PATCH', `/api/provider/payments/${commissionId}/reject`, { reason });
  },

  /**
   * Upload de comprovativo de pagamento (para motorista)
   */
  async uploadProof(commissionId: string, file: File): Promise<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('proofFile', file);
    return request('POST', `/api/provider/payments/${commissionId}/upload-proof`, formData);
  },

  /**
   * Obter detalhes de uma comissão
   */
  async getCommissionDetails(commissionId: string): Promise<{ success: boolean; data: RideCommission }> {
    return request('GET', `/api/provider/payments/${commissionId}`);
  },
};

export default rideCommissionService;
