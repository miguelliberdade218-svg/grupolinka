import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { sharedAuthApi } from '@/api/shared/auth';

interface UserSetupState {
  needsCapacitySetup: boolean;
  loading: boolean;
  error: string | null;
}

export const useUserSetup = () => {
  const { user, firebaseUser, isAuthenticated } = useAuth();
  const [setupState, setSetupState] = useState<UserSetupState>({
    needsCapacitySetup: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!isAuthenticated || !firebaseUser) {
      setSetupState({
        needsCapacitySetup: false,
        loading: false,
        error: null
      });
      return;
    }

    const checkUserSetup = async () => {
      try {
        console.log("🔍 Verificando configuração do usuário...");
        
        // Primeiro, tentar obter as capacidades do usuário
        const capabilitiesResponse = await sharedAuthApi.getCapabilities();
        
        if (capabilitiesResponse.success && capabilitiesResponse.data) {
          // ✅ CORREÇÃO: Usar as capacidades retornadas
          const hasBasicCapacities = capabilitiesResponse.data.canBookServices === true;
          const needsSetup = !hasBasicCapacities;
          
          console.log("📊 Capacidades do usuário:", capabilitiesResponse.data);
          console.log("🔧 Precisa de setup?", needsSetup);
          
          setSetupState({
            needsCapacitySetup: needsSetup,
            loading: false,
            error: null
          });
        } else {
          // Se não conseguir obter capacidades, verificar se o usuário existe no backend
          try {
            const profileResponse = await sharedAuthApi.getProfile();
            
            if (profileResponse.success && profileResponse.user) {
              // Usuário existe, mas não tem capacidades configuradas
              setSetupState({
                needsCapacitySetup: true,
                loading: false,
                error: null
              });
            } else {
              // Usuário não existe no backend, precisa configurar
              setSetupState({
                needsCapacitySetup: true,
                loading: false,
                error: null
              });
            }
          } catch (profileError) {
            // Erro ao obter perfil, assumir que precisa de setup
            console.log("ℹ️ Não foi possível obter perfil, assumindo que precisa de setup");
            setSetupState({
              needsCapacitySetup: true,
              loading: false,
              error: null
            });
          }
        }
      } catch (error) {
        console.error('Error checking user setup:', error);
        setSetupState({
          needsCapacitySetup: false,
          loading: false,
          error: 'Failed to check user setup'
        });
      }
    };

    checkUserSetup();
  }, [firebaseUser, isAuthenticated]);

  const setupUserCapacities = async (capacities: string[]) => {
    if (!firebaseUser) throw new Error('User not authenticated');
    
    try {
      console.log("🚀 Configurando capacidades do usuário...", capacities);
      
      // Registrar cliente no backend usando novo sistema
      const response = await sharedAuthApi.registerClient({
        email: firebaseUser.email || '',
        firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        accountType: 'individual'
      });

      // Type assertion para garantir compatibilidade
      const registerResponse = response as { success: boolean; error?: string; message?: string; user?: any };

      if (!registerResponse.success) {
        throw new Error(registerResponse.error || registerResponse.message || 'Failed to register user');
      }

      // Ativar capacidades adicionais
      for (const capacity of capacities) {
        if (capacity === 'canDrive') {
          await sharedAuthApi.activateCapacity({
            capacity: 'drive',
            notes: 'Ativado via setup de capacidades'
          });
        } else if (capacity === 'canManageHotels') {
          await sharedAuthApi.activateCapacity({
            capacity: 'hotel_manager',
            notes: 'Ativado via setup de capacidades'
          });
        }
        // Adicionar outras capacidades conforme necessário
      }
      
      setSetupState(prev => ({
        ...prev,
        needsCapacitySetup: false
      }));
      
      // Refresh the page to update the entire app state
      window.location.reload();
    } catch (error) {
      console.error('Error setting up capacities:', error);
      throw error;
    }
  };

  return {
    ...setupState,
    setupUserCapacities,
    userEmail: firebaseUser?.email || user?.email || ''
  };
};