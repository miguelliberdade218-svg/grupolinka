import { apiRequest } from '../../shared/lib/queryClient';

export interface AuthUser {
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

export interface UserProfile {
  displayName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  roles: string[];
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

// API Client para autenticação compartilhada
export const sharedAuthApi = {
  // Obter perfil do usuário atual
  getProfile: async (): Promise<{ success: boolean; user: AuthUser }> => {
    console.log('👤 [AUTH API] Buscando perfil do usuário');
    
    const response = await apiRequest('GET', '/api/auth/profile');
    return response.json();
  },

  // Atualizar perfil
  updateProfile: async (profileData: UserProfile): Promise<{ success: boolean; message: string; user: AuthUser }> => {
    console.log('✏️ [AUTH API] Atualizando perfil:', profileData);
    
    const response = await apiRequest('PUT', '/api/auth/profile', profileData);
    return response.json();
  },

  // Registrar novo usuário
  register: async (userData: RegisterData): Promise<{ success: boolean; message: string; user: AuthUser }> => {
    console.log('📝 [AUTH API] Registrando usuário:', userData);
    
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return response.json();
  },

  // Verificar se usuário existe
  checkUser: async (firebaseUid: string): Promise<{ success: boolean; exists: boolean; user?: AuthUser }> => {
    console.log('🔍 [AUTH API] Verificando usuário:', firebaseUid);
    
    const response = await apiRequest('GET', `/api/auth/check-user/${firebaseUid}`);
    return response.json();
  },

  // Refresh do usuário
  refresh: async (): Promise<{ success: boolean; user: AuthUser }> => {
    console.log('🔄 [AUTH API] Refresh do usuário');
    
    const response = await apiRequest('POST', '/api/auth/refresh');
    return response.json();
  }
};

export default sharedAuthApi;