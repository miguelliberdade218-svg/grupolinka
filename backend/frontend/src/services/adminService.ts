import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const adminAPI = axios.create({
  baseURL: `${API_BASE}/api/admin`,
  timeout: 10000,
});

// Interceptor para adicionar token
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('firebaseToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
adminAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('❌ [AdminAPI] Acesso negado:', error.response?.status === 401 ? 'Token inválido' : 'Não é administrador');
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('userCapabilities');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // ===== DASHBOARD =====
  getDashboardStats: () => adminAPI.get('/dashboard/stats'),

  // ===== USUÁRIOS =====
  listUsers: (page = 1, limit = 20, filters: any = {}) =>
    adminAPI.get('/users', { params: { page, limit, ...filters } }),

  getUserDetails: (userId: string) => adminAPI.get(`/users/${userId}`),

  // ===== CAPACIDADES =====
  getVerificationQueue: () => adminAPI.get('/capabilities/queue'),

  approveDriver: (userId: string, reason?: string) =>
    adminAPI.post(`/capabilities/${userId}/approve-driver`, { reason }),

  rejectDriver: (userId: string, reason: string) =>
    adminAPI.post(`/capabilities/${userId}/reject-driver`, { reason }),

  suspendDriver: (userId: string, reason: string, end_date?: string) =>
    adminAPI.post(`/capabilities/${userId}/suspend-driver`, { reason, end_date }),

  approveHotelManager: (userId: string, reason?: string) =>
    adminAPI.post(`/capabilities/${userId}/approve-hotel-manager`, { reason }),

  rejectHotelManager: (userId: string, reason: string) =>
    adminAPI.post(`/capabilities/${userId}/reject-hotel-manager`, { reason }),

  // ===== CLIENTES =====
  suspendClient: (userId: string, reason: string, end_date?: string) =>
    adminAPI.post(`/clients/${userId}/suspend`, { reason, end_date }),

  reactivateClient: (userId: string, reason?: string) =>
    adminAPI.post(`/clients/${userId}/reactivate`, { reason }),

  // ===== HOTÉIS =====
  listHotels: (page = 1, limit = 20, filters: any = {}) =>
    adminAPI.get('/hotels', { params: { page, limit, ...filters } }),

  getHotelDetails: (hotelId: string) => adminAPI.get(`/hotels/${hotelId}`),

  suspendHotel: (hotelId: string, reason: string) =>
    adminAPI.post(`/hotels/${hotelId}/suspend`, { reason }),

  activateHotel: (hotelId: string, reason?: string) =>
    adminAPI.post(`/hotels/${hotelId}/activate`, { reason }),

  // ===== TAXAS =====
  getCurrentFees: () => adminAPI.get('/fees/current'),

  updateFee: (service_type: string, fee_percentage: number, reason?: string) =>
    adminAPI.post('/fees/update', { service_type, fee_percentage, reason }),

  // ===== RECLAMAÇÕES =====
  listComplaints: (page = 1, limit = 20, filters: any = {}) =>
    adminAPI.get('/complaints', { params: { page, limit, ...filters } }),

  getComplaintDetails: (complaintId: string) => adminAPI.get(`/complaints/${complaintId}`),

  updateComplaintStatus: (complaintId: string, status: string, resolution?: string) =>
    adminAPI.put(`/complaints/${complaintId}/status`, { status, resolution }),

  // ===== PAGAMENTOS =====
  getPaymentStats: () => adminAPI.get('/payments/stats'),

  listPaymentReferences: (page = 1, limit = 20, filters: any = {}) =>
    adminAPI.get('/payments/references', { params: { page, limit, ...filters } }),

  confirmPayment: (paymentId: string, notes?: string) =>
    adminAPI.post(`/payments/${paymentId}/confirm`, { notes }),

  // ===== AUDITORIA =====
  getAdminLogs: (page = 1, limit = 50, filters: any = {}) =>
    adminAPI.get('/audit/logs', { params: { page, limit, ...filters } }),
};

export default adminService;
