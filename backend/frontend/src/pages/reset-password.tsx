import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Extrair token da URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      setToken(urlToken);
      // TODO: Validar token com backend
      // Por enquanto, assumimos que é válido
      setTokenValid(true);
    } else {
      setTokenValid(false);
      toast({
        title: "Token Inválido",
        description: "O link de recuperação está incompleto ou expirou.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token || !tokenValid) {
      toast({
        title: "Token Inválido",
        description: "O link de recuperação expirou ou é inválido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar chamada ao backend para resetar senha
      // const response = await sharedAuthApi.resetPassword({
      //   token,
      //   newPassword: data.password
      // });
      
      // Simular sucesso por enquanto
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswordReset(true);
      
      toast({
        title: "Senha Redefinida!",
        description: "Sua senha foi alterada com sucesso.",
        variant: "default",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao Redefinir Senha",
        description: error.message || "Erro ao redefinir senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Link Inválido
            </CardTitle>
            <CardDescription className="text-center">
              Este link de recuperação está incompleto ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Solicite um novo link de recuperação de senha.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Solicitar Novo Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Voltar para Login
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Senha Redefinida!
            </CardTitle>
            <CardDescription className="text-center">
              Sua senha foi alterada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Agora você pode fazer login com sua nova senha.
              </p>
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full">
                    Fazer Login
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Ir para Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Botão Voltar */}
      <div className="absolute top-4 left-4">
        <Link href="/login">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Login
          </Button>
        </Link>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            Nova Senha
          </CardTitle>
          <CardDescription className="text-center">
            Digite sua nova senha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              Crie uma nova senha forte. Use pelo menos 6 caracteres.
            </p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...form.register("password")}
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
                placeholder="Digite novamente"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !tokenValid}
            >
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              Lembrou sua senha antiga?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}