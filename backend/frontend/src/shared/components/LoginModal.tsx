import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Shield, Mail, Lock, Chrome, AlertCircle, X, Eye, EyeOff, Key, Smartphone, User, Globe } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import EnhancedSignupModal from "./EnhancedSignupModal";
import Logo from "./Logo";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function LoginModal({ open, onOpenChange, redirectTo }: LoginModalProps) {
  const { signIn, signInEmail, signUpEmail, resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showEnhancedSignup, setShowEnhancedSignup] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setFormError(null);
    try {
      await signIn();
      toast({
        title: "🎉 Login Realizado!",
        description: "Bem-vindo ao Link-A! Redirecionando...",
        variant: "default",
      });
      onOpenChange(false);
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setFormError('Erro ao fazer login com Google. Tente novamente.');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Por favor, preencha todos os campos.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setFormError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      if (isSignUp) {
        await signUpEmail(email, password);
        toast({
          title: "🎉 Conta Criada!",
          description: "Sua conta foi criada com sucesso! Bem-vindo ao Link-A!",
          variant: "default",
        });
      } else {
        await signInEmail(email, password);
        toast({
          title: "👋 Bem-vindo de volta!",
          description: "Login realizado com sucesso. Redirecionando...",
          variant: "default",
        });
      }
      onOpenChange(false);
      if (redirectTo) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login/registro.';
      
      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Usuário não encontrado. Verifique o email ou crie uma conta.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Senha incorreta. Tente novamente.';
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'Este email já está em uso. Tente fazer login.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido. Verifique o formato.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Credenciais inválidas. Verifique email e senha.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setFormError(errorMessage);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!resetEmail) {
      setFormError('Por favor, digite um email válido.');
      return;
    }

    try {
      await resetPassword(resetEmail);
      toast({
        title: "📧 Email Enviado!",
        description: "Verifique sua caixa de entrada para instruções de recuperação de senha.",
        variant: "default",
      });
      setShowPasswordReset(false);
      setResetEmail('');
    } catch (error: any) {
      let errorMessage = 'Erro ao enviar email de recuperação.';
      
      if (error?.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Não encontramos uma conta com este email.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Email inválido. Verifique o formato.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      
      setFormError(errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setResetEmail('');
    setFormError(null);
    setIsSignUp(false);
    setShowPasswordReset(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    onOpenChange(false);
  };

  const displayError = formError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl" data-testid="login-modal">
        {/* ✅ CORREÇÃO APLICADA: Logo adicionado no topo do modal */}
        <div className="flex flex-col items-center bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-white">
          <Logo size="lg" showText={true} className="mb-4 drop-shadow-lg" />
          <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
          <p className="text-white/90 mt-2 text-center">
            Entre na sua conta para continuar
          </p>
        </div>
        
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="hidden">
              <DialogTitle className="text-xl font-bold text-primary">
                Entrar no Link-A
              </DialogTitle>
              <DialogDescription>
                Acesse sua conta para continuar
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              data-testid="button-close-modal"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6 pt-4 space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md flex items-center justify-center gap-3 group"
            data-testid="button-modal-login-google"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-red-600 rounded flex items-center justify-center">
              <Chrome className="w-4 h-4 text-white" />
            </div>
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-500 font-medium">
                ou entre com email
              </span>
            </div>
          </div>

          {/* Email/Password Sign In */}
          <Tabs value={isSignUp ? 'signup' : 'signin'} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="signin" 
                onClick={() => setIsSignUp(false)}
                data-testid="tab-modal-signin"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-medium transition-all duration-300"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                onClick={() => {
                  setIsSignUp(true);
                  setShowEnhancedSignup(true);
                  onOpenChange(false);
                }}
                data-testid="tab-modal-signup"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md font-medium transition-all duration-300"
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-5 mt-6">
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="modal-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="modal-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      data-testid="input-modal-email"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="modal-password" className="text-sm font-medium text-gray-700">
                      Senha
                    </Label>
                    <Button 
                      type="button"
                      variant="link"
                      className="text-xs text-primary hover:text-primary-dark p-0 h-auto"
                      onClick={() => setShowPasswordReset(true)}
                      data-testid="button-forgot-password"
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="modal-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      data-testid="input-modal-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  data-testid="button-modal-signin-email"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Entrando...
                    </span>
                  ) : 'Entrar na Conta'}
                </Button>
              </form>
              
              {/* Benefits for login */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-800">Benefícios ao Entrar:</h4>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">✓ Reservar viagens e hotéis</li>
                  <li className="flex items-center gap-2">✓ Acompanhar suas reservas</li>
                  <li className="flex items-center gap-2">✓ Receber ofertas exclusivas</li>
                  <li className="flex items-center gap-2">✓ Salvar preferências de viagem</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-5 mt-6">
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="modal-signup-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="modal-signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      data-testid="input-modal-signup-email"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="modal-signup-password" className="text-sm font-medium text-gray-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="modal-signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      data-testid="input-modal-signup-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use letras, números e símbolos para maior segurança
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="modal-confirm-password" className="text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="modal-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      data-testid="input-modal-confirm-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  data-testid="button-modal-signup-email"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Criando conta...
                    </span>
                  ) : 'Criar Minha Conta'}
                </Button>
              </form>
              
              {/* Benefits for signup */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h4 className="text-sm font-medium text-green-800">Vantagens ao se Registrar:</h4>
                </div>
                <ul className="text-xs text-green-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Conta 100% gratuita para sempre</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Descontos exclusivos em viagens</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Programa de fidelidade com recompensas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Suporte prioritário 24/7</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button 
                  type="button"
                  variant="link"
                  className="text-sm text-primary hover:text-primary-dark"
                  onClick={() => {
                    setIsSignUp(false);
                    setShowPasswordReset(true);
                  }}
                  data-testid="button-already-have-account"
                >
                  Já tem uma conta? Entrar
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {displayError && (
            <Alert variant="destructive" className="animate-in slide-in-from-top duration-300 border-red-200 bg-red-50" data-testid="alert-modal-error">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <AlertDescription className="text-red-700">{displayError}</AlertDescription>
              </div>
            </Alert>
          )}
          
          {/* Security Badge */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Dados protegidos com criptografia SSL de 256 bits</span>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl" data-testid="password-reset-modal">
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Recuperar Senha</h2>
            <p className="text-white/90 mt-2 text-center">
              Digite seu email para receber instruções
            </p>
          </div>
          
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="sr-only">
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="sr-only">
              Digite seu email para receber instruções de recuperação
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6">
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                  Email Cadastrado
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 py-3 rounded-lg border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    data-testid="input-reset-email"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enviaremos um link para redefinir sua senha
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  data-testid="button-cancel-reset"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  data-testid="button-send-reset"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enviando...
                    </span>
                  ) : 'Enviar Link'}
                </Button>
              </div>
              
              {formError && (
                <Alert variant="destructive" className="animate-in slide-in-from-top duration-300 border-red-200 bg-red-50" data-testid="alert-reset-error">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <AlertDescription className="text-red-700">{formError}</AlertDescription>
                  </div>
                </Alert>
              )}
            </form>
            
            {/* Reset Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Como funciona?</h4>
              <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                <li>Insira seu email cadastrado</li>
                <li>Receba um link de recuperação no seu email</li>
                <li>Clique no link e crie uma nova senha</li>
                <li>Faça login com suas novas credenciais</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Signup Modal */}
      <EnhancedSignupModal
        open={showEnhancedSignup}
        onOpenChange={setShowEnhancedSignup}
      />
    </Dialog>
  );
}

export default LoginModal;