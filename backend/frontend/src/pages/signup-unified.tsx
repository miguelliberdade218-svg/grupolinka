import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/hooks/use-toast';
import { Home, ArrowLeft, User, Car, Building, Shield, Check } from 'lucide-react';
import { SignupWizardComplete } from '@/shared/components/SignupWizardComplete';

import { Link } from 'wouter';

export default function SignupUnifiedPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'email' | 'google' | null>(null);

  const handleGoogleSignup = async () => {
    try {
      const { signInWithGoogle, isFirebaseConfigured } = await import('@/shared/lib/firebaseConfig');
      
      if (!isFirebaseConfigured) {
        toast({
          title: 'Firebase Não Configurado',
          description: 'Configure as chaves do Firebase para usar autenticação Google',
          variant: 'destructive',
        });
        return;
      }

      await signInWithGoogle();
      setSignupMethod('google');
      setShowWizard(true);
    } catch (error) {
      toast({
        title: 'Erro no Registro',
        description: 'Erro ao inicializar registro com Google',
        variant: 'destructive',
      });
    }
  };

  const handleEmailSignup = () => {
    setSignupMethod('email');
    setShowWizard(true);
  };

  const handleWizardComplete = () => {
    toast({
      title: 'Conta criada com sucesso!',
      description: 'Bem-vindo ao Link-A! Redirecionando...',
    });
    
    // Redirecionar baseado nas capacidades escolhidas
    setTimeout(() => {
      setLocation('/');
    }, 2000);
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
    setSignupMethod(null);
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SignupWizardComplete 
          onComplete={handleWizardComplete}
          onCancel={handleWizardCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Botão Homepage */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ir para Homepage
          </Button>
        </Link>
      </div>

      {/* Botão Login */}
      <div className="absolute top-4 right-4">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Fazer Login
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Junte-se ao Link-A
          </CardTitle>
          <p className="text-gray-600 mt-2">
            A plataforma completa para viagens, alojamentos e eventos em Moçambique
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Viagens Seguras</h3>
              <p className="text-sm text-gray-600">Motoristas verificados e avaliações reais</p>
            </div>
            
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-4">
                <Building className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Alojamentos de Qualidade</h3>
              <p className="text-sm text-gray-600">Hotéis e acomodações verificadas</p>
            </div>
            
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Segurança Garantida</h3>
              <p className="text-sm text-gray-600">Pagamentos seguros e suporte 24/7</p>
            </div>
          </div>

          {/* Métodos de Registro */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignup}
              className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-gray-50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ou
                </span>
              </div>
            </div>

            <button
              onClick={handleEmailSignup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <User className="h-5 w-5" />
              Criar conta com Email
            </button>
          </div>

          {/* Informações sobre capacidades */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Sistema Flexível de Capacidades
            </h3>
            <p className="text-sm text-blue-800">
              No Link-A, você pode ser cliente, motorista, gestor de hotel, ou todos ao mesmo tempo! 
              Escolha suas capacidades durante o cadastro e ative novas depois.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-1">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-900">Cliente</span>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-1">
                  <Car className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-900">Motorista</span>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full mb-1">
                  <Building className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-amber-900">Gestor</span>
              </div>
            </div>
          </div>

          {/* Links para páginas antigas (temporário) */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="mb-2">Prefere o cadastro tradicional?</p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup" className="text-blue-600 hover:underline">
                Apenas Cliente
              </Link>
              <Link href="/drivers-signup" className="text-green-600 hover:underline">
                Apenas Motorista
              </Link>
              <Link href="/hotels-signup" className="text-amber-600 hover:underline">
                Apenas Gestor
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}