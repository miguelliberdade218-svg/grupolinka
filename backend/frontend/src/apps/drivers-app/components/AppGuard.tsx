import { ReactNode } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { hasCapability } from '@/shared/lib/firebaseConfig';
import { AuthRedirect } from '@/shared/components/AuthRedirect';

interface AppGuardProps {
  children: ReactNode;
}

export function DriversAppGuard({ children }: AppGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Verificar se usuário tem capacidade para usar a drivers-app
  const canAccess = hasCapability('canDrive');
  
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">
            Esta área é apenas para motoristas verificados. 
            Se você ainda não ativou sua capacidade de motorista, 
            acesse a página de motorista para configurar.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/drivers-signup'}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              🚗 Criar Conta de Motorista
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🧳 Ir para App de Clientes
            </button>
            <button 
              onClick={() => window.location.href = '/hotels-app'}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              🏨 Ir para App de Gestores
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthRedirect requiredCapacity="canDrive">
      {children}
    </AuthRedirect>
  );
}

export default DriversAppGuard;