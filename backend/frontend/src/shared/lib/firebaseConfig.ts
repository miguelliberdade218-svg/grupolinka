import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Enhanced debugging for production
console.log('🔥 Firebase Configuration Debug:', {
  // Environment check
  environment: import.meta.env.MODE || 'unknown',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  
  // Variable existence check
  variables: {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing', 
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'
  },
  
  // Final config status
  configured: isFirebaseConfigured,
  projectId: firebaseConfig.projectId || 'UNDEFINED',
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  authDomain: firebaseConfig.authDomain || 'UNDEFINED',
  
  // Raw values (only first 10 chars for security)
  rawValues: {
    apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'UNDEFINED',
    projectId: firebaseConfig.projectId || 'UNDEFINED',
    appId: firebaseConfig.appId ? firebaseConfig.appId.substring(0, 15) + '...' : 'UNDEFINED'
  }
});

if (!isFirebaseConfigured) {
  console.warn('⚠️ Firebase configuration is incomplete. Please check your environment variables.');
  console.error('❌ FIREBASE SETUP REQUIRED:', {
    message: 'Add these environment variables to your Railway deployment:',
    required: [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID', 
      'VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID'
    ],
    note: 'Add these variables in Vercel deployment settings, then redeploy'
  });
}

// Initialize Firebase (ensure single instance)
let app: any = null;
let auth: any = null;
let db: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    // Check if Firebase app already exists
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    
    // Configure Google provider with Web Client ID
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId) {
      googleProvider.setCustomParameters({
        'client_id': googleClientId,
        'prompt': 'select_account'
      });
    }
    
    // Force popup mode to avoid multiple windows
    googleProvider.setCustomParameters({ 
      'login_hint': '',
      'access_type': 'online'
    });
    
    // Configure scopes
    googleProvider.addScope('email');
    googleProvider.addScope('profile');
    googleProvider.addScope('openid');
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

// Export Firebase instances
export { app, auth, db, googleProvider };

// Authentication functions
export const signInWithGoogle = async (): Promise<void> => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase não configurado. Verifique as variáveis de ambiente.');
  }
  
  try {
    console.log('🔄 Iniciando login com Google...');
    console.log('🌐 Domain:', window.location.hostname);
    console.log('🔧 Provider configurado:', googleProvider);
    
    // Use popup sempre para melhor UX
    const result = await signInWithPopup(auth, googleProvider);
    
    if (result.user) {
      console.log('✅ Login com Google bem-sucedido:', result.user.email);
      
      // ✅ CORREÇÃO: Salvar token imediatamente após login bem-sucedido
      const token = await result.user.getIdToken(true);
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }));
      console.log('✅ Token salvo após login com Google');
    }
    
  } catch (error: any) {
    console.error('❌ Erro no login com Google:', error);
    console.error('Código do erro:', error?.code);
    console.error('Mensagem:', error?.message);
    
    // Tratar erros específicos do Google OAuth
    switch (error?.code) {
      case 'auth/unauthorized-domain':
        throw new Error('Domínio não autorizado. Verifique as configurações do Firebase Console.');
      case 'auth/operation-not-allowed':
        throw new Error('Login com Google não está habilitado no projeto Firebase.');
      case 'auth/popup-blocked':
        throw new Error('Pop-up foi bloqueado pelo navegador. Permita pop-ups para este site.');
      case 'auth/popup-closed-by-user':
        throw new Error('Login cancelado pelo usuário.');
      case 'auth/cancelled-popup-request':
        throw new Error('Tentativa de login anterior cancelada.');
      case 'auth/network-request-failed':
        throw new Error('Erro de rede. Verifique sua conexão com a internet.');
      case 'auth/too-many-requests':
        throw new Error('Muitas tentativas de login. Tente novamente em alguns minutos.');
      case 'auth/invalid-api-key':
        throw new Error('Chave de API inválida. Verifique a configuração do Firebase.');
      case 'auth/app-not-authorized':
        throw new Error('Aplicação não autorizada. Verifique o Web Client ID.');
      default:
        // Se for um erro não específico, mostrar mensagem mais amigável
        if (error?.message?.includes('client_id')) {
          throw new Error('Erro de configuração do Google OAuth. Verifique o Web Client ID.');
        }
        throw new Error(`Erro no login: ${error?.message || 'Erro desconhecido'}`);
    }
  }
};

export const checkRedirectResult = async (): Promise<User | null> => {
  if (!auth) return null;
  
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log('✅ Redirect result successful:', result.user.email);
      
      // ✅ CORREÇÃO: Salvar token após redirect bem-sucedido
      const token = await result.user.getIdToken(true);
      localStorage.setItem('firebaseToken', token);
      localStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }));
      console.log('✅ Token salvo após redirect');
      
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error('❌ Redirect result handling failed:', error);
    
    if (error?.code === 'auth/unauthorized-domain') {
      console.error('❌ Domain not authorized in Firebase Console');
    }
    
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  if (!auth) throw new Error('Firebase not configured');
  
  try {
    // ✅ CORREÇÃO: Limpar localStorage ANTES de fazer sign out
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🧹 Dados removidos do localStorage');
    
    await signOut(auth);
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.error('❌ Sign out failed:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase not configured');
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // ✅ CORREÇÃO: Salvar token após login com email bem-sucedido
    const token = await result.user.getIdToken(true);
    localStorage.setItem('firebaseToken', token);
    localStorage.setItem('user', JSON.stringify({
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    }));
    console.log('✅ Token salvo após login com email');
    
    return result.user;
  } catch (error: any) {
    switch (error?.code) {
      case 'auth/user-not-found':
        throw new Error('Utilizador não encontrado. Verifique o email.');
      case 'auth/wrong-password':
        throw new Error('Senha incorreta. Tente novamente.');
      case 'auth/invalid-email':
        throw new Error('Email inválido. Verifique o formato.');
      case 'auth/user-disabled':
        throw new Error('Esta conta foi desabilitada.');
      case 'auth/too-many-requests':
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      default:
        throw error;
    }
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  if (!auth) throw new Error('Firebase not configured');
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // ✅ CORREÇÃO: Salvar token após registo bem-sucedido
    const token = await result.user.getIdToken(true);
    localStorage.setItem('firebaseToken', token);
    localStorage.setItem('user', JSON.stringify({
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    }));
    console.log('✅ Token salvo após registo com email');
    
    return result.user;
  } catch (error: any) {
    switch (error?.code) {
      case 'auth/email-already-in-use':
        throw new Error('Este email já está em uso. Tente fazer login.');
      case 'auth/weak-password':
        throw new Error('Senha muito fraca. Use pelo menos 6 caracteres.');
      case 'auth/invalid-email':
        throw new Error('Email inválido. Verifique o formato.');
      case 'auth/operation-not-allowed':
        throw new Error('Registo com email não está habilitado.');
      default:
        throw error;
    }
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) throw new Error('Firebase not configured');
  
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    switch (error?.code) {
      case 'auth/user-not-found':
        throw new Error('Não encontramos uma conta com este email.');
      case 'auth/invalid-email':
        throw new Error('Email inválido. Verifique o formato.');
      case 'auth/too-many-requests':
        throw new Error('Muitas tentativas. Tente novamente mais tarde.');
      default:
        throw error;
    }
  }
};

export const setupAuthListener = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  
  return onAuthStateChanged(auth, async (user) => {
    console.log('👤 Auth state changed:', user ? `Signed in as ${user.email}` : 'Signed out');
    
    // ✅✅✅ CÓDIGO CORRIGIDO - SALVAR TOKEN NO LOCALSTORAGE
    if (user) {
      try {
        // Obter token fresco do Firebase
        const token = await user.getIdToken(/* forceRefresh */ true);
        
        // Salvar para uso nas requisições API
        localStorage.setItem('firebaseToken', token);
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
        
        console.log('✅ Token salvo/atualizado no localStorage');
        console.log('📱 Token disponível para APIs');
        console.log('🔐 Token length:', token.length);
        
        // ✅ NOVO: Tentar obter capacidades do usuário após login
        try {
          // Importar a API de forma dinâmica para evitar dependência circular
          const { sharedAuthApi } = await import('@/api/shared/auth');
          const capabilitiesResponse = await sharedAuthApi.getCapabilities();
          
          if (capabilitiesResponse.success && capabilitiesResponse.data) {
            localStorage.setItem('userCapabilities', JSON.stringify(capabilitiesResponse.data));
            console.log('🎯 Capacidades do usuário salvas:', capabilitiesResponse.data);
          }
        } catch (capError) {
          console.warn('⚠️ Não foi possível obter capacidades do usuário:', capError);
          // Não falhar o login por causa disso
        }
        
      } catch (error) {
        console.error('❌ Erro ao salvar token:', error);
      }
    } else {
      // ✅ CORREÇÃO: Limpar dados ao fazer logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userCapabilities'); // ✅ NOVO: Limpar capacidades
      console.log('🧹 Dados de autenticação removidos do localStorage');
    }
    // ✅ FIM DO CÓDIGO CORRIGIDO
    
    callback(user);
  });
};

// Função auxiliar para obter o token do localStorage
export const getStoredToken = (): string | null => {
  return localStorage.getItem('firebaseToken');
};

// Função auxiliar para obter dados do usuário do localStorage
export const getStoredUser = (): any => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// ✅ NOVO: Função auxiliar para obter capacidades do usuário
export const getStoredCapabilities = (): any => {
  const capabilitiesStr = localStorage.getItem('userCapabilities');
  return capabilitiesStr ? JSON.parse(capabilitiesStr) : null;
};

// ✅ NOVO: Função para verificar se usuário tem capacidade específica
export const hasCapability = (capability: string): boolean => {
  const capabilities = getStoredCapabilities();
  if (!capabilities) return false;
  
  // Verificar capacidades comuns
  switch (capability) {
    case 'canBookServices':
      return capabilities.canBookServices === true;
    case 'canDrive':
      return capabilities.canDrive === true;
    case 'canManageHotels':
      return capabilities.canManageHotels === true;
    case 'isAdmin':
      return capabilities.isAdmin === true;
    default:
      return capabilities[capability] === true;
  }
};

// ✅ NOVO: Função para atualizar capacidades do usuário
export const refreshUserCapabilities = async (): Promise<boolean> => {
  try {
    const { sharedAuthApi } = await import('@/api/shared/auth');
    const response = await sharedAuthApi.getCapabilities();
    
    if (response.success && response.data) {
      localStorage.setItem('userCapabilities', JSON.stringify(response.data));
      console.log('🔄 Capacidades do usuário atualizadas:', response.data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Erro ao atualizar capacidades:', error);
    return false;
  }
};

// Função auxiliar para verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

// Aliases para compatibilidade
export const handleRedirectResult = checkRedirectResult;
export const onAuthStateChange = setupAuthListener;

export default app;