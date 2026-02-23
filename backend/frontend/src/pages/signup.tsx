import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useToast } from "@/shared/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Home, Building, User } from "lucide-react";
import { setupAuthListener, checkRedirectResult, signInWithGoogle } from "@/shared/lib/firebaseConfig";
import { sharedAuthApi } from "@/api/shared/auth";
import { emailService } from "@/shared/services/emailService";
import type { User as FirebaseUser } from "firebase/auth";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  accountType: z.enum(["individual", "company"]),
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
}).refine((data) => {
  if (data.accountType === "company") {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: "Nome da empresa é obrigatório",
  path: ["companyName"],
}).refine((data) => {
  // Se password foi fornecido, confirmPassword deve ser igual
  if (data.password && data.password.trim() !== "") {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [, setLocation] = useLocation();

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      accountType: "individual"
    }
  });

  const watchAccountType = form.watch("accountType");

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

      // Usar senha fornecida ou gerar temporária
      const password = data.password && data.password.trim() !== "" 
        ? data.password 
        : 'temp-password-' + Math.random().toString(36).substring(2, 15);

      // Criar conta no Firebase
      const firebaseUser = await signUpWithEmail(data.email, password); // Senha opcional ou temporária

      // Registrar cliente no backend usando novo sistema
      const response = await sharedAuthApi.registerClient({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        accountType: data.accountType,
        companyName: data.companyName,
        companyVatNumber: data.companyVatNumber,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone,
      });

      // Type assertion para garantir compatibilidade
      const registerResponse = response as { success: boolean; error?: string; message?: string; user?: any };

      if (registerResponse.success) {
        // Enviar email de boas-vindas
        try {
          await emailService.sendWelcomeEmail(data.email, `${data.firstName} ${data.lastName}`);
        } catch (emailError) {
          console.warn('Erro ao enviar email de boas-vindas:', emailError);
          // Não falhar o registro por causa do email
        }

        toast({
          title: "Conta Criada!",
          description: data.password 
            ? `Bem-vindo ao Link-A! Sua conta de ${data.accountType === 'individual' ? 'cliente individual' : 'cliente empresarial'} foi criada.`
            : `Conta criada! Como não definiu senha, verifique seu email para instruções de configuração.`,
        });

        // Redirecionar para a homepage (main app)
        setLocation('/');
      } else {
        throw new Error(registerResponse.error || registerResponse.message || 'Falha ao criar conta');
      }

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
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Erro no Registro",
        description: "Erro ao inicializar registro com Google",
        variant: "destructive",
      });
    }
  };

  // Para Google signup, configurar automaticamente como cliente
  useEffect(() => {
    const handleGoogleUser = async (user: FirebaseUser) => {
      try {
        // Registrar cliente no backend usando novo sistema
        const response = await sharedAuthApi.registerClient({
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || 'User',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          accountType: 'individual'
        });

        if (response.success) {
          toast({
            title: "Conta Criada!",
            description: "Bem-vindo ao Link-A! Sua conta foi configurada como cliente.",
          });
          setLocation('/');
        }
      } catch (error) {
        console.error('Erro ao configurar conta Google:', error);
        toast({
          title: "Erro na Configuração",
          description: "Conta criada, mas erro na configuração. Entre em contato com suporte.",
          variant: "destructive",
        });
      }
    };

    // Verificar se o utilizador foi redirecionado do Google
    const checkRedirect = async () => {
      try {
        const user = await checkRedirectResult();
        if (user) {
          await handleGoogleUser(user);
        }
      } catch (error) {
        console.error('Erro ao processar redirect:', error);
      }
    };

    checkRedirect();

    // Escutar mudanças no estado de autenticação
    const unsubscribe = setupAuthListener(async (user) => {
      if (user && !currentUser) {
        setCurrentUser(user);
        await handleGoogleUser(user);
      }
    });

    return unsubscribe;
  }, [currentUser, toast, setLocation]);

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

      {/* Botões para outros tipos de conta */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link href="/drivers-signup">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            🚗 Motorista
          </Button>
        </Link>
        <Link href="/hotels-signup">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            🏨 Hotel
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Criar Conta de Cliente
          </CardTitle>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Para reservar viagens, hotéis e eventos
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Seu nome"
                  {...form.register("firstName")}
                  data-testid="input-firstname-signup"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Seu sobrenome"
                  {...form.register("lastName")}
                  data-testid="input-lastname-signup"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="password">Senha (opcional - ou use Google)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres (opcional)"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Se não definir senha, poderá usar apenas login com Google ou receber link por email.
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+258 84 123 4567"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>

            {/* Tipo de Conta */}
            <div className="space-y-3">
              <Label>Tipo de Conta *</Label>
              <RadioGroup 
                value={watchAccountType} 
                onValueChange={(value) => form.setValue("accountType", value as "individual" | "company")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Individual
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="flex items-center gap-2 cursor-pointer">
                    <Building className="h-4 w-4" />
                    Empresa
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Campos condicionais para empresa */}
            {watchAccountType === "company" && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-700">Informações da Empresa</h3>
                
                <div>
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    {...form.register("companyName")}
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyVatNumber">NIF/NUIT (opcional)</Label>
                  <Input
                    id="companyVatNumber"
                    type="text"
                    placeholder="Número de identificação fiscal"
                    {...form.register("companyVatNumber")}
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">Endereço da Empresa (opcional)</Label>
                  <Input
                    id="companyAddress"
                    type="text"
                    placeholder="Endereço completo"
                    {...form.register("companyAddress")}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="password">Senha *</Label>
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
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
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
              {isLoading ? "Criando Conta..." : "Criar Conta de Cliente"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Já tem conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
            <p className="mt-2">
              É motorista ou gestor de hotel?{" "}
              <div className="flex gap-2 justify-center mt-1">
                <Link href="/drivers-signup" className="text-blue-600 hover:underline text-sm">
                  🚗 Criar conta de motorista
                </Link>
                <span className="text-gray-400">|</span>
                <Link href="/hotels-signup" className="text-emerald-600 hover:underline text-sm">
                  🏨 Criar conta de gestor
                </Link>
              </div>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}