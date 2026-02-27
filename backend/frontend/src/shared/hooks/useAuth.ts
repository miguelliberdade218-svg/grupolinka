import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { 
  onAuthStateChange, 
  signInWithGoogle, 
  signInWithEmail,
  signUpWithEmail,
  signOutUser, 
  resetPassword,
  handleRedirectResult,
  isFirebaseConfigured 
} from '../lib/firebaseConfig';
import { sharedAuthApi } from '../../api/shared/auth';

// ✅ ATUALIZADO: AppUser com capacidades do novo sistema
export interface AppUser {
  id: string;
  name?: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  accountType?: 'individual' | 'company';
  companyName?: string | null;

  // Sistema de capacidades
  canBookServices?: boolean;
  canDrive?: boolean;
  canManageHotels?: boolean;
  isAdmin?: boolean;

  // Status de verificação
  driverVerificationStatus?: string | null;
  hotelManagerVerificationStatus?: string | null;

  // Campos legados para compatibilidade
  getIdToken?: () => Promise<string>;
}

interface AuthState {
  firebaseUser: User | null; // 🔹 original do Firebase
  appUser: AppUser | null;   // 🔹 seu tipo customizado
  loading: boolean;
  error: string | null;
  token: string | null; // ⭐⭐ TOKEN NO AUTHSTATE, NÃO NO APPUSER
}

interface UseAuthReturn extends AuthState {
  user: AppUser | null; // 🔹 compatível com código existente
  signIn: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  activateCapacity: (capacity: 'drive' | 'hotel_manager', documents?: any[], notes?: string) => Promise<any>;
  getCapabilities: () => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    firebaseUser: null,
    appUser: null,
    loading: true,
    error: null,
    token: null, // ⭐⭐ INICIALIZADO COMO NULL NO AUTHSTATE
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthState({
        firebaseUser: null,
        appUser: null,
        loading: false,
        error: 'Firebase not configured',
        token: null,
      });
      return;
    }

    let mounted = true;

    // Handle redirect result on component mount
    const handleInitialRedirect = async () => {
      try {
        await handleRedirectResult();
      } catch (error) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Redirect handling failed',
          }));
        }
      }
    };

    handleInitialRedirect();

    // ✅ CORREÇÃO: Listen to auth state changes com token no AuthState
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (mounted) {
        try {
          if (firebaseUser) {
            // 🔥 OBTER TOKEN DO FIREBASE
            const token = await firebaseUser.getIdToken();
            
            // 🔥 SALVAR NO LOCALSTORAGE PARA PERSISTÊNCIA
            localStorage.setItem('firebaseToken', token);
            localStorage.setItem('user', JSON.stringify({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName
            }));
            
            console.log('✅ Token salvo no localStorage:', token.substring(0, 20) + '...');
            
            // ✅ CORREÇÃO: Criar AppUser SEM token, apenas com método para obter token
            const appUser: AppUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || undefined,
              email: firebaseUser.email,
              // ✅ ADICIONADO: Método getIdToken que delega para o firebaseUser
              getIdToken: () => firebaseUser.getIdToken(),
              // ✅ NOVO: Capacidades padrão
              canBookServices: true,
              canDrive: false,
              canManageHotels: false,
              isAdmin: false
            };

            // ✅ NOVO: Carregar capacidades do localStorage
            const savedCapabilities = localStorage.getItem('userCapabilities');
            if (savedCapabilities) {
              try {
                const capabilities = JSON.parse(savedCapabilities);
                appUser.canBookServices = capabilities.canBookServices ?? true;
                appUser.canDrive = capabilities.canDrive ?? false;
                appUser.canManageHotels = capabilities.canManageHotels ?? false;
                appUser.isAdmin = capabilities.isAdmin ?? false;
                console.log('🎯 Capacidades carregadas do localStorage:', capabilities);
              } catch (error) {
                console.warn('⚠️ Erro ao carregar capacidades do localStorage:', error);
              }
            }
            
            // ⭐⭐ ATUALIZAR STATE COM TOKEN NO AUTHSTATE, NÃO NO APPUSER
            setAuthState({
              firebaseUser,
              appUser: appUser,
              loading: false,
              error: null,
              token: token, // ⭐⭐ TOKEN NO AUTHSTATE
            });
          } else {
            // 🔥 LIMPAR DADOS AO FAZER LOGOUT
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('✅ Dados de autenticação removidos do localStorage');
            
            // ⭐⭐ ATUALIZAR STATE SEM TOKEN
            setAuthState({
              firebaseUser: null,
              appUser: null,
              loading: false,
              error: null,
              token: null, // ⭐⭐ TOKEN DEFINIDO COMO NULL
            });
          }
        } catch (error) {
          console.error('Erro ao processar mudança de autenticação:', error);
          if (mounted) {
            setAuthState({
              firebaseUser: null,
              appUser: null,
              loading: false,
              error: 'Erro ao processar autenticação',
              token: null,
            });
          }
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signInEmail = async (email: string, password: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email sign in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const signUpEmail = async (email: string, password: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await signUpWithEmail(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email sign up failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const resetPasswordEmail = async (email: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await resetPassword(email);
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // ✅ NOVO: Ativar capacidade adicional
  const activateCapacity = async (capacity: 'drive' | 'hotel_manager', documents?: any[], notes?: string) => {
    if (!authState.appUser) throw new Error('Usuário não autenticado');

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await sharedAuthApi.activateCapacity({
        capacity,
        documents,
        notes
      });

      if (response.success) {
        // Atualizar appUser com novas capacidades
        setAuthState(prev => ({
          ...prev,
          appUser: {
            ...prev.appUser!,
            ...response.user
          },
          loading: false
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha ao ativar capacidade';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // ✅ NOVO: Obter capacidades do usuário
  const getCapabilities = async () => {
    if (!authState.appUser) throw new Error('Usuário não autenticado');

    try {
      const response = await sharedAuthApi.getCapabilities();
      return response;
    } catch (error) {
      console.error('Erro ao obter capacidades:', error);
      throw error;
    }
  };

  // ✅ NOVO: Esqueci minha senha (usando novo endpoint)
  const forgotPassword = async (email: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await sharedAuthApi.forgotPassword({ email });
      setAuthState(prev => ({ ...prev, loading: false }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha ao enviar email de recuperação';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // ✅ CORREÇÃO: Função signOut que estava faltando
  const signOut = async (): Promise<void> => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await signOutUser();
      setAuthState({
        firebaseUser: null,
        appUser: null,
        loading: false,
        error: null,
        token: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  return {
    ...authState,
    user: authState.appUser, // mantém compatibilidade
    signIn,
    signInEmail,
    signUpEmail,
    resetPassword: resetPasswordEmail,
    forgotPassword, // ✅ NOVO
    activateCapacity, // ✅ NOVO
    getCapabilities, // ✅ NOVO
    signOut, // ✅ AGORA DEFINIDA
    isAuthenticated: !!authState.appUser,
  };
};

// ✅ FUNÇÃO AUXILIAR: Para usar em fetch requests
export const getAuthToken = (): string | null => {
  // Tenta pegar do localStorage primeiro (para componentes não-hook)
  return localStorage.getItem('firebaseToken');
};

// ✅ FUNÇÃO AUXILIAR: Para usar com useAuth hook
export const useAuthToken = (): string | null => {
  const { token } = useAuth();
  return token;
};

export default useAuth;