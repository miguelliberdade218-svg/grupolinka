// Authentication middleware
import { Request, Response, NextFunction } from 'express';
import { getAuthenticatedUser, AuthenticatedUser } from '../types';
import { authStorage } from '../authStorage';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware para requerer autenticação
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }
    
    req.user = user;
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    return res.status(401).json({ 
      error: 'Falha na autenticação',
      message: (error as Error).message
    });
  }
};

/**
 * Middleware para requerer permissão de administrador (versão auth)
 */
export const requireAdminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Primeiro verificar autenticação
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para acessar este recurso'
      });
    }
    
    // Buscar usuário no banco para verificar se é admin
    const dbUser = await authStorage.getUser(user.id);
    if (!dbUser) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        message: 'Usuário não encontrado no sistema'
      });
    }
    
    // Verificar se é admin
    const isAdmin = dbUser.isAdmin === true;
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'É necessário ser administrador para acessar este recurso',
        userRoles: dbUser.roles,
        isAdmin: dbUser.isAdmin
      });
    }
    
    req.user = user;
    
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de admin:', error);
    return res.status(500).json({ 
      error: 'Erro interno',
      message: (error as Error).message
    });
  }
};