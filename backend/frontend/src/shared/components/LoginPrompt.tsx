import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Lock, Shield, Star, Users } from 'lucide-react';
import LoginModal from './LoginModal';

interface LoginPromptProps {
  title?: string;
  description?: string;
  action?: string;
}

export function LoginPrompt({ 
  title = "Login Necessário", 
  description = "Para acessar esta área, você precisa fazer login em sua conta Link-A.",
  action = "Entrar"
}: LoginPromptProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold text-primary">{title}</CardTitle>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Conta segura e verificada</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Star className="w-4 h-4 text-yellow-600" />
              <span>Avaliações e histórico de viagens</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Acesso a parcerias exclusivas</span>
            </div>
          </div>
          
          <Button
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-primary hover:bg-primary-dark"
            data-testid="button-login-prompt"
          >
            <Lock className="w-4 h-4 mr-2" />
            {action}
          </Button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Não tem uma conta? Crie gratuitamente ao fazer login
            </p>
          </div>
        </CardContent>
      </Card>
      
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        redirectTo={location}
      />
    </div>
  );
}

export default LoginPrompt;