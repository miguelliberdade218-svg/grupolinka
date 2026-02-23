import { useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCurrentDomains } from '../utils/constants';
import AccountTypeSelector from './AccountTypeSelector';

interface AuthRedirectProps {
  children: ReactNode;
  requiredCapacity?: 'canBookServices' | 'canDrive' | 'canManageHotels' | 'isAdmin';
}

export function AuthRedirect({ children, requiredCapacity }: AuthRedirectProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    const domains = getCurrentDomains();
    
    if (!loading && user && requiredCapacity) {
      // Verificar se o usuário tem a capacidade necessária
      const hasCapacity = user[requiredCapacity as keyof typeof user] === true;
      
      if (!hasCapacity) {
        // Redireciona para a app principal do usuário
        let primaryDomain = domains.client;
        
        if (user.canDrive) {
          primaryDomain = domains.driver;
        } else if (user.canManageHotels) {
          primaryDomain = domains.hotel;
        } else if (user.isAdmin) {
          primaryDomain = domains.admin;
        }
        
        if (primaryDomain && window.location.origin !== primaryDomain) {
          window.location.href = primaryDomain;
          return;
        }
      }
    }

    // ✅ CORREÇÃO: NÃO redirecionar visitantes não logados
    // Visitantes podem acessar conteúdo público
    // if (!loading && !user && window.location.origin !== domains.client) {
    //   window.location.href = domains.client;
    // }
  }, [user, loading, requiredCapacity]);

  // Se usuário precisa configurar capacidades (apenas para novos usuários)
  if (user && !user.canBookServices && !user.canDrive && !user.canManageHotels && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Configuração Necessária</h2>
          <p className="mb-4">Sua conta precisa ser configurada. Entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  // Se usuário com capacidades de negócio não está verificado
  if (user && (user.canDrive || user.canManageHotels) && 
      (!user.driverVerificationStatus || user.driverVerificationStatus === 'pending' || 
       !user.hotelManagerVerificationStatus || user.hotelManagerVerificationStatus === 'pending')) {
    const domains = getCurrentDomains();
    // ✅ CORREÇÃO: Não redirecionar se já estiver na app específica (drivers ou hotels-app)
    if (window.location.pathname !== '/verification' && 
        !window.location.pathname.startsWith('/drivers') && 
        !window.location.pathname.startsWith('/hotels-app')) {
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

  // Se requer capacidade específica e usuário não tem
  if (requiredCapacity && user && !user[requiredCapacity as keyof typeof user]) {
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