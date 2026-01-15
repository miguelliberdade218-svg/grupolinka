import { useState } from "react";
import LoginModal from "./LoginModal";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Shield, User, FileCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireVerification = false,
  redirectTo = "/"
}: ProtectedRouteProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, loading, user } = useAuth();
  const [location] = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    );
  }

  // Authentication required but user not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Autenticação Necessária
                </h2>
                <p className="text-gray-600 mb-6">
                  Precisa de iniciar sessão para aceder a esta funcionalidade por questões de segurança.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                    data-testid="button-auth-required-login"
                  >
                    <User className="w-4 h-4" />
                    <span>Iniciar Sessão</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = redirectTo}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg"
                    data-testid="button-auth-required-back"
                  >
                    Voltar à Página Inicial
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Shield className="w-4 h-4" />
                    <p className="text-sm font-medium">Segurança Link-A</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Todos os utilizadores devem estar autenticados e verificados para garantir a segurança da plataforma.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <LoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
          redirectTo={location}
        />
      </>
    );
  }

  // Verification required but user not verified
  if (requireVerification && user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verificação Necessária
              </h2>
              <p className="text-gray-600 mb-6">
                Precisa de verificar a sua identidade e documentos para usar esta funcionalidade.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = "/profile/verification"}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                  data-testid="button-verification-required-verify"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Verificar Perfil</span>
                </button>
                
                <button
                  onClick={() => window.location.href = redirectTo}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg"
                  data-testid="button-verification-required-back"
                >
                  Voltar à Página Inicial
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <FileCheck className="w-4 h-4" />
                  <p className="text-sm font-medium">Status: Verificação pendente</p>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  A verificação garante a segurança de todos os utilizadores da plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}