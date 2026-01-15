import { useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCurrentDomains } from '../utils/constants';
import AccountTypeSelector from './AccountTypeSelector';

interface AuthRedirectProps {
  children: ReactNode;
  requiredRole?: 'client' | 'driver' | 'hotel' | 'event' | 'admin';
}

export function AuthRedirect({ children, requiredRole }: AuthRedirectProps) {
  const { user, loading, needsRoleSetup, setupUserRoles } = useAuth();

  useEffect(() => {
    const domains = getCurrentDomains();
    
    if (!loading && user && requiredRole) {
      // Se o usuário está logado mas não tem o papel necessário
      if (!user.roles?.includes(requiredRole)) {
        // Redireciona para a app principal do usuário
        const primaryRole = user.roles?.[0] || 'client';
        const domainMap = {
          client: domains.client,
          driver: domains.driver,
          hotel: domains.hotel,
          event: domains.event,
          admin: domains.admin
        };
        
        const targetDomain = domainMap[primaryRole as keyof typeof domainMap];
        
        if (targetDomain && window.location.origin !== targetDomain) {
          window.location.href = targetDomain;
          return;
        }
      }
    }

    // Se não está logado e não está na app principal
    if (!loading && !user && window.location.origin !== domains.client) {
      window.location.href = domains.client;
    }
  }, [user, loading, requiredRole]);

  // Se usuário precisa configurar roles (apenas para novos usuários sem roles)
  if (user && needsRoleSetup) {
    return (
      <AccountTypeSelector
        userEmail={user.email}
        onComplete={setupUserRoles}
      />
    );
  }

  // Se usuário com roles de negócio não está verificado, redirecionar para verificação
  if (user && user.roles?.some(role => ['driver', 'hotel', 'event'].includes(role)) && !user.isVerified) {
    const domains = getCurrentDomains();
    if (window.location.pathname !== '/verification') {
      window.location.href = `${domains.client}/verification`;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Se requer papel específico e usuário não tem
  if (requiredRole && (!user?.roles?.includes(requiredRole))) {
    const domains = getCurrentDomains();
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Acesso Negado</h2>
          <p className="mb-4">Você não tem permissão para acessar esta área.</p>
          <button 
            onClick={() => window.location.href = domains.client}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}