import { apiRequest } from '../../shared/lib/queryClient';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  roles: string[];
  isVerified: boolean;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchParams {
  search?: string;
  role?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
}

export interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  clientUsers: number;
  driverUsers: number;
  hotelUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

// API Client para administradores gerirem usuários
export const adminUsersApi = {
  // Listar todos os usuários
  getAll: async (params: UserSearchParams = {}): Promise<{ 
    success: boolean; 
    users: User[]; 
    pagination: { page: number; limit: number; total: number; hasMore: boolean } 
  }> => {
    console.log('👥 [ADMIN API] Buscando usuários:', params);
    
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.verified !== undefined) queryParams.append('verified', params.verified.toString());
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiRequest('GET', `/api/admin/users/all?${queryParams}`);
    return response.json();
  },

  // Obter usuário por ID
  getById: async (userId: string): Promise<{ success: boolean; user: User }> => {
    console.log('🔍 [ADMIN API] Buscando usuário:', userId);
    
    const response = await apiRequest('GET', `/api/admin/users/${userId}`);
    return response.json();
  },

  // Verificar usuário
  verify: async (userId: string): Promise<{ success: boolean; message: string; user: User }> => {
    console.log('✅ [ADMIN API] Verificando usuário:', userId);
    
    const response = await apiRequest('PATCH', `/api/admin/users/${userId}/verify`);
    return response.json();
  },

  // Suspender usuário
  suspend: async (userId: string, reason?: string): Promise<{ success: boolean; message: string; user: User }> => {
    console.log('🚫 [ADMIN API] Suspendendo usuário:', userId, reason);
    
    const response = await apiRequest('PATCH', `/api/admin/users/${userId}/suspend`, { reason });
    return response.json();
  },

  // Atualizar roles do usuário
  updateRoles: async (userId: string, roles: string[]): Promise<{ success: boolean; message: string; user: User }> => {
    console.log('🔐 [ADMIN API] Atualizando roles:', userId, roles);
    
    const response = await apiRequest('PATCH', `/api/admin/users/${userId}/roles`, { roles });
    return response.json();
  },

  // Obter estatísticas de usuários
  getStats: async (): Promise<{ success: boolean; stats: UserStats }> => {
    console.log('📊 [ADMIN API] Buscando estatísticas de usuários');
    
    const response = await apiRequest('GET', '/api/admin/users/stats');
    return response.json();
  },

  // Excluir usuário
  delete: async (userId: string): Promise<{ success: boolean; message: string }> => {
    console.log('🗑️ [ADMIN API] Excluindo usuário:', userId);
    
    const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
    return response.json();
  }
};

export default adminUsersApi;