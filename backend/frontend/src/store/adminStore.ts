import { create } from 'zustand';
import adminService from '@/services/adminService';

export interface AdminStats {
  total_users?: number;
  total_admins?: number;
  total_drivers?: number;
  total_hotel_managers?: number;
  total_clients?: number;
  pending_verifications?: number;
  new_complaints?: number;
  pending_payments?: number;
  pending_amount?: number;
  total_rides?: number;
  total_hotel_bookings?: number;
  total_event_bookings?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  canDrive?: boolean;
  canManageHotels?: boolean;
  canBookServices?: boolean;
  isAdmin?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  driverVerificationStatus?: string;
  hotelManagerVerificationStatus?: string;
  clientVerificationStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminStore {
  // Estado
  stats: AdminStats | null;
  users: AdminUser[];
  verificationQueue: any[];
  hotels: any[];
  complaints: any[];
  payments: any[];
  fees: any[];
  logs: any[];
  
  // Paginação
  usersPagination: PaginationInfo | null;
  hotelsPagination: PaginationInfo | null;
  complaintsPagination: PaginationInfo | null;
  paymentsPagination: PaginationInfo | null;
  logsPagination: PaginationInfo | null;
  
  // Estado de UI
  loading: boolean;
  error: string | null;
  success: string | null;

  // Ações de fetch
  fetchDashboardStats: () => Promise<void>;
  fetchUsers: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchVerificationQueue: () => Promise<void>;
  fetchHotels: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchComplaints: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchPaymentStats: () => Promise<void>;
  fetchPaymentReferences: (page?: number, limit?: number, filters?: any) => Promise<void>;
  fetchFees: () => Promise<void>;
  fetchAdminLogs: (page?: number, limit?: number, filters?: any) => Promise<void>;

  // Ações de modificação
  approveDriver: (userId: string, reason?: string) => Promise<void>;
  rejectDriver: (userId: string, reason: string) => Promise<void>;
  suspendDriver: (userId: string, reason: string, end_date?: string) => Promise<void>;
  approveHotelManager: (userId: string, reason?: string) => Promise<void>;
  rejectHotelManager: (userId: string, reason: string) => Promise<void>;
  suspendClient: (userId: string, reason: string, end_date?: string) => Promise<void>;
  reactivateClient: (userId: string, reason?: string) => Promise<void>;
  suspendHotel: (hotelId: string, reason: string) => Promise<void>;
  activateHotel: (hotelId: string, reason?: string) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: string, resolution?: string) => Promise<void>;
  confirmPayment: (paymentId: string, notes?: string) => Promise<void>;
  updateFee: (service_type: string, fee_percentage: number, reason?: string) => Promise<void>;
  
  // Utilitários
  clearError: () => void;
  clearSuccess: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  // Estado inicial
  stats: null,
  users: [],
  verificationQueue: [],
  hotels: [],
  complaints: [],
  payments: [],
  fees: [],
  logs: [],
  
  usersPagination: null,
  hotelsPagination: null,
  complaintsPagination: null,
  paymentsPagination: null,
  logsPagination: null,
  
  loading: false,
  error: null,
  success: null,

  // Ações de fetch
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getDashboardStats();
      set({ stats: response.data.data, loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao carregar dashboard';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchUsers: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.listUsers(page, limit, filters);
      set({
        users: response.data.data || [],
        usersPagination: response.data.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao listar usuários';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchVerificationQueue: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getVerificationQueue();
      set({ verificationQueue: response.data.data || [], loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao buscar fila de verificação';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchHotels: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.listHotels(page, limit, filters);
      set({
        hotels: response.data.data || [],
        hotelsPagination: response.data.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao listar hotéis';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchComplaints: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.listComplaints(page, limit, filters);
      set({
        complaints: response.data.data || [],
        complaintsPagination: response.data.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao listar reclamações';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchPaymentStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getPaymentStats();
      set({ payments: [response.data.data], loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao buscar estatísticas de pagamentos';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchPaymentReferences: async (page = 1, limit = 20, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.listPaymentReferences(page, limit, filters);
      set({
        payments: response.data.data || [],
        paymentsPagination: response.data.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao listar pagamentos';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchFees: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getCurrentFees();
      set({ fees: response.data.data || [], loading: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao buscar taxas';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  fetchAdminLogs: async (page = 1, limit = 50, filters = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await adminService.getAdminLogs(page, limit, filters);
      set({
        logs: response.data.data || [],
        logsPagination: response.data.pagination,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao buscar logs';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  // Ações de modificação
  approveDriver: async (userId: string, reason?: string) => {
    try {
      await adminService.approveDriver(userId, reason);
      set({ success: '✅ Motorista aprovado com sucesso' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao aprovar motorista');
    }
  },

  rejectDriver: async (userId: string, reason: string) => {
    try {
      await adminService.rejectDriver(userId, reason);
      set({ success: '❌ Motorista rejeitado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao rejeitar motorista');
    }
  },

  suspendDriver: async (userId: string, reason: string, end_date?: string) => {
    try {
      await adminService.suspendDriver(userId, reason, end_date);
      set({ success: '⏸️ Motorista suspenso' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao suspender motorista');
    }
  },

  approveHotelManager: async (userId: string, reason?: string) => {
    try {
      await adminService.approveHotelManager(userId, reason);
      set({ success: '✅ Gestor de hotel aprovado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao aprovar gestor de hotel');
    }
  },

  rejectHotelManager: async (userId: string, reason: string) => {
    try {
      await adminService.rejectHotelManager(userId, reason);
      set({ success: '❌ Gestor de hotel rejeitado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao rejeitar gestor de hotel');
    }
  },

  suspendClient: async (userId: string, reason: string, end_date?: string) => {
    try {
      await adminService.suspendClient(userId, reason, end_date);
      set({ success: '⏸️ Cliente suspenso' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao suspender cliente');
    }
  },

  reactivateClient: async (userId: string, reason?: string) => {
    try {
      await adminService.reactivateClient(userId, reason);
      set({ success: '✅ Cliente reativado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao reativar cliente');
    }
  },

  suspendHotel: async (hotelId: string, reason: string) => {
    try {
      await adminService.suspendHotel(hotelId, reason);
      set({ success: '⏸️ Hotel suspenso' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao suspender hotel');
    }
  },

  activateHotel: async (hotelId: string, reason?: string) => {
    try {
      await adminService.activateHotel(hotelId, reason);
      set({ success: '✅ Hotel ativado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao ativar hotel');
    }
  },

  updateComplaintStatus: async (complaintId: string, status: string, resolution?: string) => {
    try {
      await adminService.updateComplaintStatus(complaintId, status, resolution);
      set({ success: '✅ Reclamação atualizada' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar reclamação');
    }
  },

  confirmPayment: async (paymentId: string, notes?: string) => {
    try {
      await adminService.confirmPayment(paymentId, notes);
      set({ success: '✅ Pagamento confirmado' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao confirmar pagamento');
    }
  },

  updateFee: async (service_type: string, fee_percentage: number, reason?: string) => {
    try {
      await adminService.updateFee(service_type, fee_percentage, reason);
      set({ success: '✅ Taxa atualizada com sucesso' });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar taxa');
    }
  },

  // Utilitários
  clearError: () => set({ error: null }),
  clearSuccess: () => set({ success: null }),
}));
