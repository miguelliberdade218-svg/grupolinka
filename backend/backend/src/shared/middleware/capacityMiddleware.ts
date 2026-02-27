// src/shared/middleware/capacityMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, UserCapabilities } from '../types.js';
import { authStorage } from '../authStorage';

/**
 * Middleware para verificar se usuário tem uma capacidade específica
 * @param capacity Capacidade requerida: 'book', 'drive', 'manage_hotels', 'admin'
 * @param requireVerified Se true, exige que a capacidade esteja verificada
 */
export const requireCapacity = (capacity: string, requireVerified: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Não autenticado' 
      });
    }
    
    try {
      const userId = authReq.user.uid;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'Usuário não encontrado' 
        });
      }
      
      // ✅ Converter null para false
      const canBookServices = user.canBookServices ?? false;
      const canDrive = user.canDrive ?? false;
      const canManageHotels = user.canManageHotels ?? false;
      const isAdmin = user.isAdmin ?? false;
      
      let hasCapacity = false;
      let isVerified = false;
      let status = null;
      
      switch(capacity) {
        case 'book':
          hasCapacity = canBookServices;
          isVerified = true; // Cliente não precisa verificação
          break;
          
        case 'drive':
          hasCapacity = canDrive;
          status = user.driverVerificationStatus;
          isVerified = status === 'verified';
          break;
          
        case 'manage_hotels':
          hasCapacity = canManageHotels;
          status = user.hotelManagerVerificationStatus;
          isVerified = status === 'verified';
          break;
          
        case 'admin':
          hasCapacity = isAdmin;
          isVerified = true; // Admin é sempre verificado
          break;
          
        default:
          return res.status(400).json({ 
            success: false,
            message: 'Capacidade inválida' 
          });
      }
      
      // Verificar se tem a capacidade
      if (!hasCapacity) {
        return res.status(403).json({
          success: false,
          message: `Usuário não possui capacidade de ${getCapacityName(capacity)}`,
          requiredCapacity: capacity,
          userCapabilities: {
            canBookServices,
            canDrive,
            canManageHotels,
            isAdmin
          }
        });
      }
      
      // Verificar se precisa estar verificado
      if (requireVerified && !isVerified) {
        return res.status(403).json({
          success: false,
          message: `Capacidade de ${getCapacityName(capacity)} não está verificada`,
          requiredCapacity: capacity,
          verificationStatus: status,
          requiresVerification: true
        });
      }
      
      // ✅ Usar valores convertidos
      authReq.userCapabilities = {
        canBookServices,
        canDrive,
        canManageHotels,
        isAdmin,
        driverVerificationStatus: user.driverVerificationStatus,
        hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
      };
      
      next();
    } catch (error) {
      console.error('Erro ao verificar capacidade:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  };
};

/**
 * Middleware para verificar múltiplas capacidades (OR lógico)
 * @param capacities Array de capacidades, usuário precisa ter pelo menos uma
 */
export const requireAnyCapacity = (capacities: string[], requireVerified: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    try {
      const userId = authReq.user.uid;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // ✅ Converter null para false
      const canBookServices = user.canBookServices ?? false;
      const canDrive = user.canDrive ?? false;
      const canManageHotels = user.canManageHotels ?? false;
      const isAdmin = user.isAdmin ?? false;
      
      // Verificar cada capacidade
      for (const capacity of capacities) {
        let hasCapacity = false;
        let isVerified = false;
        
        switch(capacity) {
          case 'book':
            hasCapacity = canBookServices;
            isVerified = true;
            break;
          case 'drive':
            hasCapacity = canDrive;
            isVerified = user.driverVerificationStatus === 'verified';
            break;
          case 'manage_hotels':
            hasCapacity = canManageHotels;
            isVerified = user.hotelManagerVerificationStatus === 'verified';
            break;
          case 'admin':
            hasCapacity = isAdmin;
            isVerified = true;
            break;
        }
        
        // Se tem a capacidade e (se necessário) está verificado
        if (hasCapacity && (!requireVerified || isVerified)) {
          // ✅ Usar valores convertidos
          authReq.userCapabilities = {
            canBookServices,
            canDrive,
            canManageHotels,
            isAdmin,
            driverVerificationStatus: user.driverVerificationStatus,
            hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
          };
          return next();
        }
      }
      
      // Se chegou aqui, não tem nenhuma das capacidades
      return res.status(403).json({
        success: false,
        message: `Usuário não possui nenhuma das capacidades requeridas: ${capacities.join(', ')}`,
        requiredCapacities: capacities,
        userCapabilities: {
          canBookServices,
          canDrive,
          canManageHotels,
          isAdmin
        }
      });
    } catch (error) {
      console.error('Erro ao verificar capacidades:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
};

/**
 * Middleware para verificar todas as capacidades (AND lógico)
 */
export const requireAllCapacities = (capacities: string[], requireVerified: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    try {
      const userId = authReq.user.uid;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // ✅ Converter null para false
      const canBookServices = user.canBookServices ?? false;
      const canDrive = user.canDrive ?? false;
      const canManageHotels = user.canManageHotels ?? false;
      const isAdmin = user.isAdmin ?? false;
      
      const missingCapacities: string[] = [];
      const unverifiedCapacities: string[] = [];
      
      // Verificar cada capacidade
      for (const capacity of capacities) {
        let hasCapacity = false;
        let isVerified = false;
        
        switch(capacity) {
          case 'book':
            hasCapacity = canBookServices;
            isVerified = true;
            break;
          case 'drive':
            hasCapacity = canDrive;
            isVerified = user.driverVerificationStatus === 'verified';
            break;
          case 'manage_hotels':
            hasCapacity = canManageHotels;
            isVerified = user.hotelManagerVerificationStatus === 'verified';
            break;
          case 'admin':
            hasCapacity = isAdmin;
            isVerified = true;
            break;
        }
        
        if (!hasCapacity) {
          missingCapacities.push(capacity);
        } else if (requireVerified && !isVerified) {
          unverifiedCapacities.push(capacity);
        }
      }
      
      // Verificar se faltam capacidades
      if (missingCapacities.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Usuário não possui as seguintes capacidades: ${missingCapacities.join(', ')}`,
          missingCapacities,
          userCapabilities: {
            canBookServices,
            canDrive,
            canManageHotels,
            isAdmin
          }
        });
      }
      
      // Verificar se capacidades não estão verificadas
      if (unverifiedCapacities.length > 0) {
        return res.status(403).json({
          success: false,
          message: `As seguintes capacidades não estão verificadas: ${unverifiedCapacities.join(', ')}`,
          unverifiedCapacities,
          requiresVerification: true
        });
      }
      
      // ✅ Usar valores convertidos
      authReq.userCapabilities = {
        canBookServices,
        canDrive,
        canManageHotels,
        isAdmin,
        driverVerificationStatus: user.driverVerificationStatus,
        hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
      };
      
      next();
    } catch (error) {
      console.error('Erro ao verificar capacidades:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
};

// Middlewares específicos pré-configurados
export const requireClient = requireCapacity('book', false);
export const requireDriver = requireCapacity('drive', true);
export const requireHotelManager = requireCapacity('manage_hotels', true);
export const requireAdmin = requireCapacity('admin', true);

// Middleware para usuário que pode ser cliente OU motorista OU gestor
export const requireServiceProvider = requireAnyCapacity(['drive', 'manage_hotels'], true);

// Middleware para usuário que é tanto motorista quanto gestor (raro, mas possível)
export const requireDriverAndHotelManager = requireAllCapacities(['drive', 'manage_hotels'], true);

// Helper function para nomes amigáveis
function getCapacityName(capacity: string): string {
  const names: Record<string, string> = {
    'book': 'cliente',
    'drive': 'motorista',
    'manage_hotels': 'gestor de alojamento',
    'admin': 'administrador'
  };
  return names[capacity] || capacity;
}

// ✅ ATUALIZADO: Usar a interface importada do firebaseAuth
declare global {
  namespace Express {
    interface Request {
      userCapabilities?: UserCapabilities;
    }
  }
}

// ✅ EXPORTAR O TIPO PARA USO EM OUTROS ARQUIVOS
export type { UserCapabilities };