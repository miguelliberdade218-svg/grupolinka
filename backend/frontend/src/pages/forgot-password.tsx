import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { emailService } from "@/shared/services/emailService";
import { sharedAuthApi } from "@/api/shared/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    try {
      // Usar nosso sistema de email personalizado
      // Primeiro, solicitar token de reset via API
      const response = await sharedAuthApi.forgotPassword({
        email: data.email
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Erro ao solicitar reset de senha');
      }
      
      // O backend deve gerar um token e nos retornar
      // Por enquanto, vamos simular um token
      const resetToken = 'temp-token-' + Date.now();
      
      // Enviar email usando nosso serviço
      const emailSent = await emailService.sendPasswordResetEmail(
        data.email,
        'Usuário', // Nome seria obtido do backend
        resetToken
      );
      
      if (!emailSent) {
        throw new Error('Falha ao enviar email de recuperação');
      }
      
      setEmailSent(true);
      
      toast({
        title: "Email Enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
        variant: "default",
      });
      
    } catch (error: any) {
      console.error('Erro no reset de senha:', error);
      
      // Fallback: tentar usar Firebase diretamente se nosso sistema falhar
      try {
        const { resetPassword, isFirebaseConfigured } = await import('../shared/lib/firebaseConfig');
        
        if (isFirebaseConfigured) {
          await resetPassword(data.email);
          setEmailSent(true);
          
          toast({
            title: "Email Enviado (Fallback)!",
            description: "Usamos o sistema do Firebase para enviar o email de recuperação.",
            variant: "default",
          });
          return;
        }
      } catch (firebaseError) {
        console.error('Fallback também falhou:', firebaseError);
      }
      
      toast({
        title: "Erro ao Enviar Email",
        description: error.message || "Erro ao enviar email de recuperação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-center">
            {emailSent 
              ? "Verifique seu email para redefinir sua senha"
              : "Digite seu email para receber um link de recuperação"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Enviado!</h3>
                <p className="text-gray-600 mt-2">
                  Enviamos um link de recuperação para <span className="font-medium">{form.getValues("email")}</span>.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  O link expira em 1 hora.
                </p>
              </div>
              
              <div className="space-y-3 pt-4">
                <div className="text-sm text-gray-500">
                  <p className="font-medium">Não recebeu o email?</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Verifique sua pasta de spam/lixo eletrônico</li>
                    <li>Certifique-se de que digitou o email corretamente</li>
                    <li>Espere alguns minutos e tente novamente</li>
                  </ul>
                </div>
                
                <div className="flex gap-2 justify-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setEmailSent(false)}
                  >
                    Enviar novamente
                  </Button>
                  <Link href="/login">
                    <Button>
                      Voltar para Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Enviaremos um link para redefinir sua senha. Clique no link no email 
                  para criar uma nova senha.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Cadastrado</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-600">
                <p>
                  Lembrou sua senha?{" "}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Fazer login
                  </Link>
                </p>
                <p className="mt-2">
                  Não tem conta?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Criar conta
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}