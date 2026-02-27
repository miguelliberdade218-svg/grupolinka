import { useAuth } from './useAuth';
import { getStoredCapabilities } from '../lib/firebaseConfig';

export type VerificationType = 'email' | 'identity' | 'driver' | 'hotel_manager' | 'client';

export interface VerificationStatus {
  type: VerificationType;
  isVerified: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'in_review' | 'not_required';
  lastChecked?: string;
  notes?: string;
}

export interface UserVerification {
  email: VerificationStatus;
  identity: VerificationStatus;
  driver: VerificationStatus;
  hotel_manager: VerificationStatus;
  client: VerificationStatus;
  overallStatus: 'verified' | 'partial' | 'pending' | 'rejected';
}

export const useVerification = () => {
  const { user } = useAuth();
  
  const getVerificationStatus = (): UserVerification => {
    // Obter capacidades do localStorage
    const capabilities = getStoredCapabilities();
    
    // Status padrão
    const defaultStatus: UserVerification = {
      email: {
        type: 'email',
        isVerified: true, // ✅ CORREÇÃO: Assumir email verificado se usuário está logado
        status: 'verified',
      },
      identity: {
        type: 'identity',
        isVerified: false,
        status: 'pending',
      },
      driver: {
        type: 'driver',
        isVerified: capabilities?.canDrive || false,
        status: capabilities?.canDrive ? 'verified' : 'pending',
      },
      hotel_manager: {
        type: 'hotel_manager',
        isVerified: capabilities?.canManageHotels || false,
        status: capabilities?.canManageHotels ? 'verified' : 'pending',
      },
      client: {
        type: 'client',
        isVerified: capabilities?.canBookServices !== false, // Clientes podem reservar por padrão
        status: 'verified',
      },
      overallStatus: 'pending',
    };
    
    // Calcular status geral
    const verifiedCount = [
      defaultStatus.email.isVerified,
      defaultStatus.identity.isVerified,
      defaultStatus.driver.isVerified,
      defaultStatus.hotel_manager.isVerified,
      defaultStatus.client.isVerified,
    ].filter(Boolean).length;
    
    if (verifiedCount === 5) {
      defaultStatus.overallStatus = 'verified';
    } else if (verifiedCount > 0) {
      defaultStatus.overallStatus = 'partial';
    } else if (defaultStatus.email.status === 'rejected' || 
               defaultStatus.identity.status === 'rejected' ||
               defaultStatus.driver.status === 'rejected' ||
               defaultStatus.hotel_manager.status === 'rejected') {
      defaultStatus.overallStatus = 'rejected';
    } else {
      defaultStatus.overallStatus = 'pending';
    }
    
    return defaultStatus;
  };
  
  const requiresVerification = (type: VerificationType | VerificationType[]): boolean => {
    const status = getVerificationStatus();
    const types = Array.isArray(type) ? type : [type];
    
    return types.some(t => {
      switch (t) {
        case 'email':
          return !status.email.isVerified;
        case 'identity':
          return !status.identity.isVerified;
        case 'driver':
          return !status.driver.isVerified;
        case 'hotel_manager':
          return !status.hotel_manager.isVerified;
        case 'client':
          return !status.client.isVerified;
        default:
          return false;
      }
    });
  };
  
  const isFullyVerified = (): boolean => {
    const status = getVerificationStatus();
    return status.overallStatus === 'verified';
  };
  
  const getRequiredVerificationForRoute = (route: string): VerificationType[] => {
    // Mapeamento de rotas para tipos de verificação necessários
    const routeVerificationMap: Record<string, VerificationType[]> = {
      // Admin routes - apenas precisa ser admin
      '/admin': [],
      '/admin/*': [],
      
      // Driver routes - precisa de capacidade de motorista
      '/drivers': ['driver'],
      '/drivers/*': ['driver'],
      
      // Hotel manager routes - precisa de capacidade de gerente de hotel
      '/hotels-app': ['hotel_manager'],
      '/hotels-app/*': ['hotel_manager'],
      
      // Booking routes (client) - precisa poder reservar
      '/bookings': ['client'],
      '/bookings/*': ['client'],
      
      // Profile verification
      '/profile/verification': [],
      
      // Default - nenhuma verificação específica necessária
      '*': [],
    };
    
    // Encontrar o padrão mais específico
    const matchingRoute = Object.keys(routeVerificationMap)
      .filter(pattern => {
        if (pattern === '*') return true;
        if (pattern.endsWith('/*')) {
          const base = pattern.slice(0, -2);
          return route.startsWith(base);
        }
        return route === pattern;
      })
      .sort((a, b) => {
        // Ordenar por especificidade (mais específico primeiro)
        if (a === '*') return 1;
        if (b === '*') return -1;
        if (a.endsWith('/*') && !b.endsWith('/*')) return 1;
        if (!a.endsWith('/*') && b.endsWith('/*')) return -1;
        return b.length - a.length;
      })[0];
    
    return routeVerificationMap[matchingRoute] || [];
  };
  
  const shouldRedirectToVerification = (route: string): boolean => {
    const requiredTypes = getRequiredVerificationForRoute(route);
    return requiresVerification(requiredTypes);
  };
  
  const getVerificationRedirectUrl = (route: string): string => {
    const requiredTypes = getRequiredVerificationForRoute(route);
    const status = getVerificationStatus();
    
    // Determinar qual página de verificação redirecionar
    if (requiredTypes.includes('driver') && !status.driver.isVerified) {
      return '/profile/verification?type=driver';
    }
    
    if (requiredTypes.includes('hotel_manager') && !status.hotel_manager.isVerified) {
      return '/profile/verification?type=hotel_manager';
    }
    
    if (requiredTypes.includes('identity') && !status.identity.isVerified) {
      return '/profile/verification?type=identity';
    }
    
    if (requiredTypes.includes('client') && !status.client.isVerified) {
      return '/profile/verification?type=client';
    }
    
    return '/profile/verification';
  };
  
  return {
    getVerificationStatus,
    requiresVerification,
    isFullyVerified,
    getRequiredVerificationForRoute,
    shouldRedirectToVerification,
    getVerificationRedirectUrl,
  };
};

export default useVerification;