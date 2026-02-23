import { apiRequest } from '../../shared/lib/queryClient';
import type {
  UserProfile,
  RegisterRequest,
  ActivateCapacityRequest,
  ActivateCapacityResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse
} from '../../types/auth.interfaces';

export interface AuthUser extends UserProfile {
  firebaseUid?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

// API Client para autenticação compartilhada
export const sharedAuthApi = {
  // Obter perfil do usuário atual
  getProfile: async (): Promise<{ success: boolean; user: AuthUser }> => {
    console.log('👤 [AUTH API] Buscando perfil do usuário');

    const response = await apiRequest<{ success: boolean; user: AuthUser }>('GET', '/api/auth/user');
    return response;
  },

  // Atualizar perfil
  updateProfile: async (profileData: Partial<UserProfile>): Promise<{ success: boolean; message: string; user: AuthUser }> => {
    console.log('✏️ [AUTH API] Atualizando perfil:', profileData);

    const response = await apiRequest<{ success: boolean; message: string; user: AuthUser }>('PUT', '/api/auth/profile', profileData);
    return response;
  },

  // Registrar cliente (novo sistema)
  registerClient: async (userData: RegisterRequest): Promise<{ success: boolean; message: string; user: AuthUser }> => {
    console.log('📝 [AUTH API] Registrando cliente:', userData);

    const response = await apiRequest<{ success: boolean; message: string; user: AuthUser }>('POST', '/api/auth/signup-client', userData);
    return response;
  },

  // Ativar capacidade adicional
  activateCapacity: async (data: ActivateCapacityRequest): Promise<ActivateCapacityResponse> => {
    console.log('⚡ [AUTH API] Ativando capacidade:', data.capacity);

    const response = await apiRequest<ActivateCapacityResponse>('POST', '/api/auth/activate-capacity', data);
    return response;
  },

  // Obter capacidades do usuário
  getCapabilities: async (): Promise<{ success: boolean; data: any }> => {
    console.log('🔍 [AUTH API] Obtendo capacidades');

    try {
      const response = await apiRequest<{ success: boolean; data: any }>('GET', '/api/auth/capabilities');
      return response;
    } catch (error: any) {
      // ✅ CORREÇÃO: Tratar 404 como sucesso com capacidades padrão
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('ℹ️ Endpoint de capacidades não encontrado, usando capacidades padrão');
        return {
          success: true,
          data: {
            canBookServices: true,
            canDrive: false,
            canManageHotels: false,
            isAdmin: false
          }
        };
      }
      
      console.error('❌ Erro ao obter capacidades:', error);
      return {
        success: false,
        data: null
      };
    }
  },

  // Esqueci minha senha
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    console.log('🔑 [AUTH API] Solicitando reset de senha:', data.email);

    const response = await apiRequest<ForgotPasswordResponse>('POST', '/api/auth/forgot-password', data);
    return response;
  },

  // Upload de documento para capacidade
  uploadCapacityDocument: async (data: {
    capacity: string;
    documentType: string;
    documentUrl: string;
    documentNumber?: string;
    expiryDate?: string;
  }): Promise<{ success: boolean; message: string; document: any }> => {
    console.log('📄 [AUTH API] Enviando documento:', data.documentType);

    const response = await apiRequest<{ success: boolean; message: string; document: any }>('POST', '/api/auth/upload-capacity-document', data);
    return response;
  },

  // Configurar capacidades do usuário (usado após Firebase auth)
  setupUserRoles: async (data: any): Promise<{ success: boolean; user: AuthUser }> => {
    console.log('🔧 [AUTH API] Configurando capacidades:', data);

    const response = await apiRequest<{ success: boolean; user: AuthUser }>('POST', '/api/auth/setup-user-roles', data);
    return response;
  },

  // Verificar se usuário existe (compatibilidade)
  checkUser: async (firebaseUid: string): Promise<{ success: boolean; exists: boolean; user?: AuthUser }> => {
    console.log('🔍 [AUTH API] Verificando usuário:', firebaseUid);

    const response = await apiRequest<{ success: boolean; exists: boolean; user?: AuthUser }>('GET', `/api/auth/check-user/${firebaseUid}`);
    return response;
  },

  // Refresh do usuário (compatibilidade)
  refresh: async (): Promise<{ success: boolean; user: AuthUser }> => {
    console.log('🔄 [AUTH API] Refresh do usuário');

    const response = await apiRequest<{ success: boolean; user: AuthUser }>('POST', '/api/auth/refresh');
    return response;
  }
};

export default sharedAuthApi;