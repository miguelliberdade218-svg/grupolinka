import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Shield, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import useCapabilities from '../hooks/useCapabilities';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { capabilities, loading: capabilitiesLoading, isAdmin, refresh } = useCapabilities();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔐 [AdminRouteGuard] Verificando acesso admin...');
      
      // Se ainda está carregando auth, aguardar
      if (authLoading) {
        console.log('⏳ [AdminRouteGuard] Auth ainda carregando...');
        return;
      }

      // Se não está autenticado e já tentamos redirecionar, não tentar novamente
      if (!isAuthenticated && redirectAttempted) {
        console.log('⏳ [AdminRouteGuard] Já tentou redirecionar, aguardando...');
        return;
      }

      // Se não está autenticado, redirecionar para login
      if (!isAuthenticated) {
        console.warn('⚠️ [AdminRouteGuard] Usuário não autenticado - redirecionando para login');
        setRedirectAttempted(true);
        setTimeout(() => navigate('/login'), 100);
        return;
      }

      // Se chegou aqui, usuário está autenticado
      console.log('✅ [AdminRouteGuard] Usuário autenticado:', isAuthenticated);
      
      // Se ainda está carregando capacidades, aguardar
      if (capabilitiesLoading) {
        console.log('⏳ [AdminRouteGuard] Capacidades ainda carregando...');
        return;
      }

      console.log('🔐 [AdminRouteGuard] Status completo:', {
        isAuthenticated,
        capabilities,
        isAdmin: isAdmin(),
        authLoading,
        capabilitiesLoading,
      });

      // Se chegou aqui, a verificação inicial foi concluída
      setInitialCheckDone(true);
      
      // Se não tem capacidades ainda, tentar forçar refresh
      if (!capabilities) {
        console.log('🔄 [AdminRouteGuard] Nenhuma capacidade encontrada, tentando refresh...');
        await refresh();
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, authLoading, capabilities, capabilitiesLoading, navigate, refresh, redirectAttempted]);

  // Mostrar loading enquanto verifica
  if (authLoading || capabilitiesLoading || !initialCheckDone) {
    console.log('⏳ [AdminRouteGuard] Mostrando loading...', { 
      authLoading, 
      capabilitiesLoading, 
      initialCheckDone,
      hasCapabilities: !!capabilities,
      isAuthenticated,
      redirectAttempted
    });
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
          {isAuthenticated && !capabilities && (
            <p className="text-sm text-gray-500 mt-2">Carregando capacidades do usuário...</p>
          )}
        </div>
      </div>
    );
  }

  // Se não está autenticado (já deveria ter redirecionado)
  if (!isAuthenticated) {
    console.log('🚫 [AdminRouteGuard] Usuário não autenticado após verificação');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Autenticação Necessária
              </h2>
              <p className="text-gray-600 mb-6">
                Você precisa estar autenticado para acessar esta área.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Fazer Login</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não é admin, mostrar mensagem de acesso negado
  if (!isAdmin()) {
    console.log('🚫 [AdminRouteGuard] Usuário não é admin:', { capabilities, isAdmin: isAdmin() });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Acesso Restrito
              </h2>
              <p className="text-gray-600 mb-6">
                Esta área é restrita a administradores da plataforma.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Voltar à Página Inicial</span>
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <Shield className="w-4 h-4" />
                  <p className="text-sm font-medium">Acesso Administrativo</p>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Apenas utilizadores com permissões de administrador podem aceder a esta área.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é admin, renderizar conteúdo
  console.log('✅ [AdminRouteGuard] Usuário é admin! Renderizando conteúdo:', { capabilities });
  return <>{children}</>;
}

export default AdminRouteGuard;