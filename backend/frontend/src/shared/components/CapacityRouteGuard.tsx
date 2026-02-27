import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Shield, User, FileCheck, Car, Building } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getStoredCapabilities } from '../lib/firebaseConfig';

interface CapacityRouteGuardProps {
  children: React.ReactNode;
  requiredCapacity: 'driver' | 'hotel_manager' | 'admin';
}

export function CapacityRouteGuard({ children, requiredCapacity }: CapacityRouteGuardProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [hasCapacity, setHasCapacity] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkCapacityAccess = async () => {
      try {
        // Verificar autenticação
        if (!isAuthenticated) {
          console.warn(`⚠️ Usuário não autenticado - redirecionando para login`);
          setTimeout(() => navigate('/login'), 100);
          return;
        }

        // Obter capacidades do localStorage
        const capabilities = getStoredCapabilities();
        
        let hasRequiredCapacity = false;
        let capacityName = '';
        
        switch (requiredCapacity) {
          case 'driver':
            hasRequiredCapacity = capabilities?.canDrive === true;
            capacityName = 'Motorista';
            break;
          case 'hotel_manager':
            hasRequiredCapacity = capabilities?.canManageHotels === true;
            capacityName = 'Gerente de Hotel';
            break;
          case 'admin':
            hasRequiredCapacity = capabilities?.isAdmin === true;
            capacityName = 'Administrador';
            break;
        }

        console.log(`🔐 ${capacityName} Access Check:`, {
          isAuthenticated,
          hasCapabilities: !!capabilities,
          hasRequiredCapacity,
          capabilities,
        });

        // Verificar se tem a capacidade necessária
        if (!hasRequiredCapacity) {
          console.warn(`⚠️ Usuário não tem permissões de ${capacityName.toLowerCase()} - redirecionando`);
          
          // Redirecionar para página de verificação apropriada
          if (requiredCapacity === 'driver') {
            setTimeout(() => navigate('/profile/verification?type=driver'), 100);
          } else if (requiredCapacity === 'hotel_manager') {
            setTimeout(() => navigate('/profile/verification?type=hotel_manager'), 100);
          } else {
            setTimeout(() => navigate('/'), 100);
          }
          return;
        }

        setHasCapacity(true);
      } catch (error) {
        console.error(`❌ Erro ao verificar acesso de ${requiredCapacity}:`, error);
        setTimeout(() => navigate('/login'), 100);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!loading) {
      checkCapacityAccess();
    }
  }, [isAuthenticated, loading, navigate, requiredCapacity]);

  // Mostrar loading enquanto verifica
  if (loading || checkingAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não tem a capacidade, mostrar mensagem apropriada
  if (!hasCapacity) {
    const getCapacityInfo = () => {
      switch (requiredCapacity) {
        case 'driver':
          return {
            icon: Car,
            title: 'Acesso Restrito a Motoristas',
            description: 'Esta área é restrita a motoristas verificados.',
            actionText: 'Verificar como Motorista',
            actionUrl: '/profile/verification?type=driver',
            color: 'blue',
          };
        case 'hotel_manager':
          return {
            icon: Building,
            title: 'Acesso Restrito a Gerentes de Hotel',
            description: 'Esta área é restrita a gerentes de hotel verificados.',
            actionText: 'Verificar como Gerente de Hotel',
            actionUrl: '/profile/verification?type=hotel_manager',
            color: 'purple',
          };
        case 'admin':
          return {
            icon: Shield,
            title: 'Acesso Restrito a Administradores',
            description: 'Esta área é restrita a administradores da plataforma.',
            actionText: 'Voltar à Página Inicial',
            actionUrl: '/',
            color: 'red',
          };
      }
    };

    const capacityInfo = getCapacityInfo();
    const Icon = capacityInfo.icon;
    const colorClass = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
    }[capacityInfo.color];

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {capacityInfo.title}
              </h2>
              <p className="text-gray-600 mb-6">
                {capacityInfo.description}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate(capacityInfo.actionUrl)}
                  className={`w-full bg-${capacityInfo.color}-600 hover:bg-${capacityInfo.color}-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{capacityInfo.actionText}</span>
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg"
                >
                  Voltar à Página Inicial
                </button>
              </div>
              
              <div className={`mt-6 p-4 bg-${capacityInfo.color}-50 rounded-lg`}>
                <div className={`flex items-center space-x-2 text-${capacityInfo.color}-800`}>
                  <Shield className="w-4 h-4" />
                  <p className="text-sm font-medium">Verificação Necessária</p>
                </div>
                <p className={`text-xs text-${capacityInfo.color}-700 mt-1`}>
                  Para acessar esta área, você precisa completar o processo de verificação correspondente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se tem a capacidade, renderizar conteúdo
  return <>{children}</>;
}

export default CapacityRouteGuard;