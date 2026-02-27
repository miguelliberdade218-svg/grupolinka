import { useState, useEffect } from 'react';
import { getStoredCapabilities, refreshUserCapabilities } from '../lib/firebaseConfig';

export interface UserCapabilities {
  canBookServices: boolean;
  canDrive: boolean;
  canManageHotels: boolean;
  isAdmin: boolean;
}

export const useCapabilities = () => {
  const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCapabilities = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let caps = getStoredCapabilities();
      
      // Se não tem capacidades ou força refresh, buscar do backend
      if (!caps || forceRefresh) {
        console.log('🔄 [useCapabilities] Buscando capacidades do backend...');
        const refreshed = await refreshUserCapabilities();
        if (refreshed) {
          caps = getStoredCapabilities();
        }
      }
      
      if (caps) {
        console.log('✅ [useCapabilities] Capacidades carregadas:', caps);
        setCapabilities(caps);
      } else {
        console.warn('⚠️ [useCapabilities] Nenhuma capacidade encontrada');
        setCapabilities({
          canBookServices: false,
          canDrive: false,
          canManageHotels: false,
          isAdmin: false
        });
      }
    } catch (err) {
      console.error('❌ [useCapabilities] Erro ao carregar capacidades:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCapabilities();
    
    // Ouvir por mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userCapabilities') {
        console.log('📦 [useCapabilities] userCapabilities atualizado no localStorage');
        loadCapabilities();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const hasCapability = (capability: keyof UserCapabilities): boolean => {
    return capabilities?.[capability] === true;
  };

  const isAdmin = (): boolean => {
    return hasCapability('isAdmin');
  };

  const canDrive = (): boolean => {
    return hasCapability('canDrive');
  };

  const canManageHotels = (): boolean => {
    return hasCapability('canManageHotels');
  };

  const canBookServices = (): boolean => {
    return hasCapability('canBookServices');
  };

  return {
    capabilities,
    loading,
    error,
    hasCapability,
    isAdmin,
    canDrive,
    canManageHotels,
    canBookServices,
    refresh: () => loadCapabilities(true),
  };
};

export default useCapabilities;