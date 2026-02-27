import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { hasCapability } from '../lib/firebaseConfig';

interface AuthRedirectProps {
  children: ReactNode;
  requiredCapacity?: 'canBookServices' | 'canDrive' | 'canManageHotels' | 'isAdmin';
}

export function AuthRedirect({ children, requiredCapacity }: AuthRedirectProps) {
  const { user, loading } = useAuth();

  // Mostrar loading enquanto verifica
  if (loading) {
    console.log('⏳ [AuthRedirect] Mostrando loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Se usuário precisa configurar capacidades (apenas para novos usuários)
  if (user && !hasCapability('canBookServices') && !hasCapability('canDrive') && 
      !hasCapability('canManageHotels') && !hasCapability('isAdmin')) {
    console.log('⚠️ [AuthRedirect] Usuário precisa configurar capacidades');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Configuração Necessária</h2>
          <p className="mb-4">Sua conta precisa ser configurada. Entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  // Se requer capacidade específica e usuário não tem
  if (requiredCapacity && user && !hasCapability(requiredCapacity)) {
    console.log('🚫 [AuthRedirect] Usuário não tem capacidade necessária:', requiredCapacity);
    
    // Verificar qual tipo de verificação é necessária
    let verificationUrl = '/profile/verification';
    if (requiredCapacity === 'canDrive') {
      verificationUrl = '/profile/verification?type=driver';
    } else if (requiredCapacity === 'canManageHotels') {
      verificationUrl = '/profile/verification?type=hotel_manager';
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Esta área requer verificação. Complete o processo de verificação para acessar.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = verificationUrl}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔐 Ir para Verificação
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              🏠 Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ [AuthRedirect] Acesso permitido, renderizando children');
  return <>{children}</>;
}