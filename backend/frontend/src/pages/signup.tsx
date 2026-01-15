import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import AccountTypeSelector from "@/shared/components/AccountTypeSelector";
import { setupAuthListener, checkRedirectResult } from "@/shared/lib/firebaseConfig";
import type { User } from "firebase/auth";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    // Verificar se o utilizador foi redirecionado do Google
    const checkRedirect = async () => {
      try {
        const user = await checkRedirectResult();
        if (user) {
          setCurrentUser(user);
          setShowRoleSelection(true);
        }
      } catch (error) {
        console.error('Erro ao processar redirect:', error);
        toast({
          title: "Erro no Login",
          description: "Erro ao processar autenticação com Google",
          variant: "destructive",
        });
      }
    };

    checkRedirect();

    // Escutar mudanças no estado de autenticação
    const unsubscribe = setupAuthListener((user) => {
      if (user && !showRoleSelection) {
        setCurrentUser(user);
        setShowRoleSelection(true);
      }
    });

    return unsubscribe;
  }, [showRoleSelection, toast]);

  const onSubmit = async (data: SignupData) => {
    setIsLoading(true);
    try {
      const { signUpWithEmail, isFirebaseConfigured } = await import('../shared/lib/firebaseConfig');
      
      if (!isFirebaseConfigured) {
        toast({
          title: "Firebase Não Configurado",
          description: "Configure as chaves do Firebase para usar autenticação",
          variant: "destructive",
        });
        return;
      }

      // Implementar registro com email/senha
      await signUpWithEmail(data.email, data.password);
      
      toast({
        title: "Conta Criada!",
        description: "Sua conta foi criada com sucesso. Faça login para continuar.",
        variant: "default",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro no Registro",
        description: error.message || "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const { signInWithGoogle, isFirebaseConfigured } = await import('../shared/lib/firebaseConfig');
      
      if (!isFirebaseConfigured) {
        toast({
          title: "Firebase Não Configurado",
          description: "Configure as chaves do Firebase para usar autenticação Google",
          variant: "destructive",
        });
        return;
      }

      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Erro no Registro",
        description: "Erro ao inicializar registro com Google",
        variant: "destructive",
      });
    }
  };

  const handleRoleSelectionComplete = async (selectedRoles: string[]) => {
    if (!currentUser) return;

    try {
      // Enviar roles para o backend
      const response = await fetch('http://localhost:8000/api/auth/setup-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          roles: selectedRoles
        })
      });

      if (response.ok) {
        
        toast({
          title: "Conta Criada!",
          description: `Bem-vindo ao Link-A! Sua conta foi configurada como ${selectedRoles.join(', ')}.`,
        });

        // Sempre redirecionar para a homepage (página dos clientes)
        setLocation('/');
      } else {
        throw new Error('Falha ao configurar conta');
      }
    } catch (error) {
      console.error('Erro ao configurar roles:', error);
      toast({
        title: "Erro na Configuração",
        description: "Erro ao configurar sua conta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Se o utilizador foi autenticado, mostrar seleção de roles
  if (showRoleSelection && currentUser) {
    return (
      <AccountTypeSelector
        userEmail={currentUser.email || ''}
        onComplete={handleRoleSelectionComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Botão Homepage no topo */}
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-home">
            <Home className="h-4 w-4" />
            Ir para Homepage
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Registar no Link-A
          </CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Crie sua conta e comece sua jornada
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
            data-testid="button-google-signup"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Registar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                ou
              </span>
            </div>
          </div>

          {/* Manual Signup Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                {...form.register("fullName")}
                data-testid="input-fullname-signup"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                {...form.register("email")}
                data-testid="input-email-signup"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...form.register("password")}
                data-testid="input-password-signup"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                {...form.register("confirmPassword")}
                data-testid="input-confirm-password-signup"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
              data-testid="button-manual-signup"
            >
              {isLoading ? "Criando Conta..." : "Criar Conta"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}