// ADMIN ROUTE GUARD DE EMERGÊNCIA
// Não depende do Firebase Auth - usa apenas localStorage
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Shield, User, AlertTriangle, Loader2 } from 'lucide-react';

interface AdminRouteGuardEmergencyProps {
  children: React.ReactNode;
}

export function AdminRouteGuardEmergency({ children }: AdminRouteGuardEmergencyProps) {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'not_authenticated' | 'not_admin'>('checking');
  const [capabilities, setCapabilities] = useState<any>(null);

  useEffect(() => {
    const checkAccess = async () => {
      console.log('🚨 [AdminRouteGuardEmergency] Verificando acesso...');
      
      // ✅ CORREÇÃO RÁPIDA: Verificar primeiro se é o admin específico conhecido
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('👤 Usuário atual:', user.email);
          
          // Se for o admin conhecido, permitir acesso imediatamente
          if (user.email === 'edsondaniel8@gmail.com') {
            console.log('✅ ADMIN ESPECÍFICO DETECTADO! Permitindo acesso imediato.');
            
            // Garantir que as capacidades estão salvas
            const defaultCapabilities = {
              canBookServices: true,
              canDrive: false,
              canManageHotels: false,
              isAdmin: true
            };
            localStorage.setItem('userCapabilities', JSON.stringify(defaultCapabilities));
            setCapabilities(defaultCapabilities);
            
            setStatus('authenticated');
            return;
          }
        } catch (error) {
          console.error('❌ Erro ao parsear usuário:', error);
        }
      }
      
      // 1. Verificar token no localStorage
      const token = localStorage.getItem('firebaseToken');
      console.log('🔑 Token no localStorage:', !!token);
      
      if (!token) {
        console.warn('⚠️ Nenhum token encontrado');
        setStatus('not_authenticated');
        setTimeout(() => navigate('/login'), 100);
        return;
      }
      
      // 2. Verificar capacidades
      const capsStr = localStorage.getItem('userCapabilities');
      let caps = null;
      
      if (capsStr) {
        try {
          caps = JSON.parse(capsStr);
          setCapabilities(caps);
          console.log('🎯 Capacidades encontradas:', caps);
          
          if (caps.isAdmin === true) {
            console.log('✅ Usuário é admin!');
            setStatus('authenticated');
            return;
          } else {
            console.warn('⚠️ Usuário NÃO é admin');
            setStatus('not_admin');
            return;
          }
        } catch (error) {
          console.error('❌ Erro ao parsear capacidades:', error);
        }
      }
      
      // 3. Se não tem capacidades, tentar buscar do backend
      console.log('🔄 Buscando capacidades do backend...');
      try {
        const response = await fetch('/api/auth/capabilities', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            localStorage.setItem('userCapabilities', JSON.stringify(data.data));
            setCapabilities(data.data);
            console.log('✅ Capacidades carregadas:', data.data);
            
            if (data.data.isAdmin === true) {
              console.log('✅ Usuário é admin!');
              setStatus('authenticated');
              return;
            } else {
              console.warn('⚠️ Usuário NÃO é admin');
              setStatus('not_admin');
              return;
            }
          }
        } else {
          console.warn('⚠️ Erro ao buscar capacidades:', response.status, response.statusText);
          // Se o endpoint retornar erro, tentar verificar com base no email
          if (userStr) {
            const user = JSON.parse(userStr);
            // Se for admin conhecido, permitir acesso mesmo com erro no endpoint
            if (user.email === 'edsondaniel8@gmail.com') {
              console.log('✅ ADMIN ESPECÍFICO - Permitindo acesso apesar de erro no endpoint');
              
              // Garantir capacidades
              const defaultCapabilities = {
                canBookServices: true,
                canDrive: false,
                canManageHotels: false,
                isAdmin: true
              };
              localStorage.setItem('userCapabilities', JSON.stringify(defaultCapabilities));
              setCapabilities(defaultCapabilities);
              
              setStatus('authenticated');
              return;
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar capacidades:', error);
        // Em caso de erro de rede, verificar se é admin conhecido
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.email === 'edsondaniel8@gmail.com') {
              console.log('✅ ADMIN ESPECÍFICO - Permitindo acesso apesar de erro de rede');
              
              // Garantir capacidades
              const defaultCapabilities = {
                canBookServices: true,
                canDrive: false,
                canManageHotels: false,
                isAdmin: true
              };
              localStorage.setItem('userCapabilities', JSON.stringify(defaultCapabilities));
              setCapabilities(defaultCapabilities);
              
              setStatus('authenticated');
              return;
            }
          } catch (parseError) {
            console.error('❌ Erro ao parsear usuário:', parseError);
          }
        }
      }
      
      // 4. Se chegou aqui, não conseguiu verificar
      console.warn('⚠️ Não foi possível verificar acesso admin');
      setStatus('not_admin');
    };
    
    // Dar um pequeno delay para garantir que o login foi processado
    setTimeout(checkAccess, 500);
  }, [navigate]);

  // Mostrar loading
  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando acesso administrativo...</p>
          <p className="text-sm text-gray-500 mt-2">Usando verificação de emergência</p>
        </div>
      </div>
    );
  }

  // Não autenticado
  if (status === 'not_authenticated') {
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

  // Não é admin
  if (status === 'not_admin') {
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

  // Autenticado e é admin
  console.log('✅ [AdminRouteGuardEmergency] Acesso permitido!');
  return <>{children}</>;
}

export default AdminRouteGuardEmergency;