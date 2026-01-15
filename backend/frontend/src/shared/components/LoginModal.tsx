import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Shield, Mail, Lock, Chrome, AlertCircle, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import EnhancedSignupModal from "./EnhancedSignupModal";

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
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setFormError(null);
    try {
      await signIn();
      toast({
        title: "Login Google Realizado",
        description: "Bem-vindo ao Link-A!"
      });
      onOpenChange(false);
      if (redirectTo) {
        window.location.href = redirectTo;
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
          title: "Conta Criada",
          description: "Conta criada com sucesso!"
        });
      } else {
        await signInEmail(email, password);
        toast({
          title: "Login Realizado",
          description: "Bem-vindo de volta ao Link-A!"
        });
      }
      onOpenChange(false);
      if (redirectTo) {
        window.location.href = redirectTo;
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
        title: "Email Enviado",
        description: "Verifique sua caixa de entrada para instruções de recuperação de senha."
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
    onOpenChange(false);
  };

  const displayError = formError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="login-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
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
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            data-testid="button-modal-login-google"
          >
            <Chrome className="w-5 h-5" />
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          {/* Email/Password Sign In */}
          <Tabs value={isSignUp ? 'signup' : 'signin'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="signin" 
                onClick={() => setIsSignUp(false)}
                data-testid="tab-modal-signin"
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
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="modal-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-modal-email"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="modal-password"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-modal-password"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  data-testid="button-modal-signin-email"
                >
                  {loading ? 'Entrando...' : 'Entrar com Email'}
                </Button>
                
                <div className="text-center">
                  <Button 
                    type="button"
                    variant="link"
                    className="text-sm text-primary hover:text-primary-dark"
                    onClick={() => setShowPasswordReset(true)}
                    data-testid="button-forgot-password"
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="modal-signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-modal-signup-email"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="modal-signup-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-modal-signup-password"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-confirm-password">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="modal-confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-modal-confirm-password"
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  data-testid="button-modal-signup-email"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {displayError && (
            <Alert variant="destructive" data-testid="alert-modal-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="sm:max-w-md" data-testid="password-reset-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email para receber instruções de recuperação
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-reset-email"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordReset(false)}
                className="flex-1"
                data-testid="button-cancel-reset"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
                data-testid="button-send-reset"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
            
            {formError && (
              <Alert variant="destructive" data-testid="alert-reset-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </form>
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