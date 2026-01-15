import { useEffect } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { FaGoogle } from "react-icons/fa";
import { useToast } from "@/shared/hooks/use-toast";

export default function GoogleAuthCallback() {
  const { toast } = useToast();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Parse URL parameters for Google OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (code && state) {
          // TODO: Endpoint /api/auth/google/callback não implementado ainda
          // Simulando sucesso por enquanto
          console.log('Google callback received:', { code, state });
          
          const user = { firstName: 'Usuario', id: 'temp-user' };
          
          // Temporary simulation
          localStorage.setItem('user_data', JSON.stringify(user));
          
          toast({
            title: "Login Google Concluído",
            description: `Bem-vindo, ${user.firstName}!`
          });

          // Redirect to dashboard or intended page
          const returnTo = localStorage.getItem('auth_return_to') || '/dashboard';
          localStorage.removeItem('auth_return_to');
          window.location.href = returnTo;
        }
      } catch (error) {
        console.error('Google auth callback error:', error);
        
        toast({
          title: "Erro na Autenticação",
          description: "Não foi possível completar o login com Google. Tente novamente.",
          variant: "destructive"
        });

        // Redirect back to login
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleGoogleCallback();
  }, [toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGoogle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              A processar autenticação Google
            </h2>
            <p className="text-gray-600 mb-6">
              Por favor aguarde enquanto confirmamos a sua identidade...
            </p>
            
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                Se o processo demorar muito tempo, recarregue a página ou tente fazer login novamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}