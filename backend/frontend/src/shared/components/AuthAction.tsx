import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Lock, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

interface AuthActionProps {
  children: React.ReactNode;
  action: () => void;
  title?: string;
  description?: string;
  requireAuth?: boolean;
  requireVerification?: boolean;
  className?: string;
}

export function AuthAction({ 
  children, 
  action, 
  title = "Login Necessário",
  description = "Faça login para continuar com esta ação.",
  requireAuth = true,
  requireVerification = false,
  className = ""
}: AuthActionProps) {
  const { isAuthenticated, user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleClick = () => {
    if (requireAuth && !isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    
    if (requireVerification && user && !user.emailVerified) {
      // Redirect to verification page
      window.location.href = "/profile/verification";
      return;
    }
    
    // All checks passed, execute the action
    action();
  };

  const handleLogin = () => {
    setShowAuthPrompt(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <div onClick={handleClick} className={className}>
        {children}
      </div>
      
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  {description}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-primary hover:bg-primary-dark"
                    data-testid="button-auth-action-login"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                  
                  <Button
                    onClick={() => setShowAuthPrompt(false)}
                    variant="outline"
                    className="w-full"
                    data-testid="button-auth-action-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-800 text-xs">
                    <Shield className="w-3 h-3" />
                    <span>Conexão segura Link-A</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </>
  );
}

export default AuthAction;