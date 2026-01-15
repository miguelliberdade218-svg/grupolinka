import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface UserSetupState {
  needsRoleSetup: boolean;
  loading: boolean;
  error: string | null;
}

export const useUserSetup = () => {
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const [setupState, setSetupState] = useState<UserSetupState>({
    needsRoleSetup: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!isAuthenticated || !firebaseUser) {
      setSetupState({
        needsRoleSetup: false,
        loading: false,
        error: null
      });
      return;
    }

    const checkUserSetup = async () => {
      try {
        // ✅ CORREÇÃO: Usar firebaseUser para getIdToken() em vez de user (AppUser)
        const token = firebaseUser ? await firebaseUser.getIdToken() : localStorage.getItem('token');
        const uid = firebaseUser?.uid;
        const displayName = firebaseUser?.displayName;
        const photoURL = firebaseUser?.photoURL;
        
        console.log("🔍 Verificando perfil do usuário...");
        let response;
        
        // ✅ AUTH: Usar Railway (agora tem auth completa)
        console.log("🔐 Usando Railway para autenticação...");
        const RAILWAY_URL = 'https://link-a-backend-production.up.railway.app';
        response = await fetch(`${RAILWAY_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          // Se usuário não tem roles ou só tem um array vazio, precisa configurar
          const needsSetup = !userData.roles || userData.roles.length === 0;
          
          setSetupState({
            needsRoleSetup: needsSetup,
            loading: false,
            error: null
          });
        } else {
          // Se usuário não existe no backend, precisa configurar
          setSetupState({
            needsRoleSetup: true,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error checking user setup:', error);
        setSetupState({
          needsRoleSetup: false,
          loading: false,
          error: 'Failed to check user setup'
        });
      }
    };

    checkUserSetup();
  }, [firebaseUser, isAuthenticated]); // ✅ Mudar dependência para firebaseUser

  const setupUserRoles = async (roles: string[]) => {
    if (!firebaseUser) throw new Error('User not authenticated');
    
    try {
      // ✅ CORREÇÃO: Usar firebaseUser para getIdToken() e propriedades Firebase
      const token = firebaseUser ? await firebaseUser.getIdToken() : localStorage.getItem('token');
      const uid = firebaseUser?.uid;
      const email = firebaseUser?.email;
      const displayName = firebaseUser?.displayName;
      const photoURL = firebaseUser?.photoURL;
      
      console.log("🚀 Configurando roles do usuário...", roles);
      let registerResponse, response;
      
      // ✅ AUTH SETUP: Usar Railway (agora tem auth completa)
      console.log("🔐 Registrando usuário no Railway...");
      const RAILWAY_URL = 'https://link-a-backend-production.up.railway.app';
      
      registerResponse = await fetch(`${RAILWAY_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: uid, // ✅ Usar uid do firebaseUser
          email: email, // ✅ Usar email do firebaseUser
          displayName: displayName, // ✅ Usar displayName do firebaseUser
          photoURL: photoURL // ✅ Usar photoURL do firebaseUser
        })
      });

      if (!registerResponse.ok) {
        throw new Error('Failed to register user in Railway');
      }

      response = await fetch(`${RAILWAY_URL}/api/auth/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roles })
      });

      if (response.ok) {
        setSetupState(prev => ({
          ...prev,
          needsRoleSetup: false
        }));
        
        // Refresh the page to update the entire app state
        window.location.reload();
      } else {
        throw new Error('Failed to setup roles');
      }
    } catch (error) {
      console.error('Error setting up roles:', error);
      throw error;
    }
  };

  return {
    ...setupState,
    setupUserRoles,
    userEmail: firebaseUser?.email || user?.email || '' // ✅ Fallback para user.email se necessário
  };
};