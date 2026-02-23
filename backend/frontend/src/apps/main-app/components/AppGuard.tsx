import { ReactNode } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { AuthRedirect } from '@/shared/components/AuthRedirect';

interface AppGuardProps {
  children: ReactNode;
}

export function MainAppGuard({ children }: AppGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ✅ CORREÇÃO: Main-app é acessível a TODOS
  // - Visitantes não logados: podem ver conteúdo público
  // - Usuários logados: todos podem usar funcionalidades de cliente
  // Motoristas e gestores também podem reservar como clientes!
  
  // Apenas redirecionar se o usuário estiver logado e tentar acessar
  // áreas protegidas que requerem login
  return (
    <AuthRedirect requiredCapacity="canBookServices">
      {children}
    </AuthRedirect>
  );
}

export default MainAppGuard;