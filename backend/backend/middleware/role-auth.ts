// middleware/role-auth.ts - VERSÃO CORRIGIDA
import { Request, Response, NextFunction } from 'express';
import { 
  AuthenticatedRequest, 
  verifyFirebaseToken as firebaseVerifyToken, // ✅ Importar do firebaseAuth
  UserCapabilities 
} from '../src/shared/firebaseAuth';
import { authStorage } from '../src/shared/authStorage';

// ✅ IMPORTAR APENAS OS MIDDLEWARES DE CAPACIDADES
import { 
  requireDriver as newRequireDriver,
  requireHotelManager as newRequireHotelManager,
  requireAdmin as newRequireAdmin,
  requireClient as newRequireClient,
  requireServiceProvider as newRequireServiceProvider
} from '../src/shared/middleware/capacityMiddleware';

// ✅ USAR O verifyFirebaseToken DO firebaseAuth (não do capacityMiddleware)
export const verifyFirebaseToken = firebaseVerifyToken;

// ✅ MIDDLEWARE ensureUserId - Garante que req.user está definido
// ✅ CORREÇÃO: Usar Request genérico e fazer type assertion para AuthenticatedRequest
export const ensureUserId = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🆔 [ENSURE-USER-ID] Verificando usuário...');
    
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      console.log('❌ [ENSURE-USER-ID] req.user não definido');
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }
    
    // Verificar se temos pelo menos um ID válido
    const user = authReq.user;
    const possibleIds = [
      user.id,
      (user as any).uid,
      (user as any).user_id
    ].filter(Boolean);
    
    if (possibleIds.length === 0) {
      console.log('❌ [ENSURE-USER-ID] Nenhum ID encontrado no usuário:', {
        userKeys: Object.keys(user),
        userEmail: user.email
      });
      return res.status(401).json({ 
        success: false, 
        error: 'ID do usuário não encontrado' 
      });
    }
    
    console.log('✅ [ENSURE-USER-ID] Usuário verificado:', {
      userId: possibleIds[0],
      email: user.email,
      allPossibleIds: possibleIds
    });
    
    next();
  } catch (error) {
    console.error('❌ [ENSURE-USER-ID] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao verificar usuário' 
    });
  }
};

// ✅ MANTER EXPORTS ANTIGOS PARA NÃO QUEBRAR CÓDIGO EXISTENTE
export const requireDriverRole = newRequireDriver;
export const requireHotelManagerRole = newRequireHotelManager;
export const requireAdminRole = newRequireAdmin;

// ✅ FUNÇÃO authenticate (mantida para compatibilidade)
export const authenticate = firebaseVerifyToken;

// ✅ FUNÇÃO requireRole (adaptada para usar capacidades)
export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Não autenticado' });
      }
      
      const userId = req.user.uid;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      }
      
      // ✅ CONVERTER ROLES ANTIGAS PARA CAPACIDADES
      let hasRequiredRole = false;
      
      for (const role of allowedRoles) {
        switch(role) {
          case 'client':
            if (user.canBookServices) hasRequiredRole = true;
            break;
          case 'driver':
            if (user.canDrive && user.driverVerificationStatus === 'verified') 
              hasRequiredRole = true;
            break;
          case 'hotel_manager':
            if (user.canManageHotels && user.hotelManagerVerificationStatus === 'verified')
              hasRequiredRole = true;
            break;
          case 'admin':
            if (user.isAdmin) hasRequiredRole = true;
            break;
        }
        
        if (hasRequiredRole) break;
      }
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          error: `Acesso negado. Requer uma das seguintes roles: ${allowedRoles.join(', ')}`,
          userCapabilities: {
            canBookServices: user.canBookServices,
            canDrive: user.canDrive,
            driverVerificationStatus: user.driverVerificationStatus,
            canManageHotels: user.canManageHotels,
            hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
            isAdmin: user.isAdmin
          }
        });
      }
      
      // ✅ ADICIONAR CAPACIDADES À REQUISIÇÃO
      req.userCapabilities = {
        canBookServices: user.canBookServices ?? false,
        canDrive: user.canDrive ?? false,
        canManageHotels: user.canManageHotels ?? false,
        isAdmin: user.isAdmin ?? false,
        driverVerificationStatus: user.driverVerificationStatus,
        hotelManagerVerificationStatus: user.hotelManagerVerificationStatus
      };
      
      next();
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  };
};

// ✅ MIDDLEWARES ESPECÍFICOS (compatibilidade)
export const requireClientRole = requireRole(['client']);

export const requireProviderRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Usar o novo middleware de service provider
  const middleware = newRequireServiceProvider;
  await middleware(req, res, next);
};

// ✅ FUNÇÃO PARA MÚLTIPLAS ROLES (compatibilidade)
export const requireAnyRole = requireRole;

// ✅ MIDDLEWARE DE DESENVOLVIMENTO (simplificado)
export const developmentAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [DEV-AUTH] Modo desenvolvimento - autenticação simplificada');
    
    // Para desenvolvimento, permitir sem token
    if (!req.headers.authorization) {
      console.log('🔧 [DEV-AUTH] Sem token - criando usuário de desenvolvimento');
      req.user = {
        id: 'dev-user-id',
        uid: 'dev-firebase-uid',
        email: 'dev@example.com',
        roles: ['client', 'driver', 'hotel_manager'],
        userType: 'driver'
      } as any;
      
      req.userCapabilities = {
        canBookServices: true,
        canDrive: true,
        canManageHotels: true,
        isAdmin: true,
        driverVerificationStatus: 'verified',
        hotelManagerVerificationStatus: 'verified'
      };
      
      return next();
    }
  }
  
  // Em produção ou com token, usar autenticação normal
  firebaseVerifyToken(req, res, next);
};

// ✅ MIDDLEWARE PARA CRIAÇÃO DE RIDES EM DESENVOLVIMENTO
export const devRideCreation = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚗 [DEV-RIDES] Modo desenvolvimento - permitindo criação de rides');
    return next();
  }
  
  // Em produção, verificar se é motorista
  newRequireDriver(req, res, next);
};

// ✅ EXPORTAR TUDO PARA COMPATIBILIDADE
export default {
  verifyFirebaseToken,
  requireDriverRole,
  requireHotelManagerRole,
  requireAdminRole,
  requireClientRole,
  requireProviderRole,
  requireRole,
  requireAnyRole,
  authenticate,
  developmentAuth,
  devRideCreation,
  ensureUserId // ✅ ADICIONADO
};
