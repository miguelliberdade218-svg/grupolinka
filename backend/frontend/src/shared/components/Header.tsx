import { useState } from "react";
import { Link } from "wouter";
import NotificationCenter from "./NotificationCenter";
import LoginModal from "./LoginModal";
import RoleSwitcher from "./RoleSwitcher";
import { Button } from "@/shared/components/ui/button";
import { User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useUserRoles } from "../hooks/useUserRoles";
// Logo is now served from public directory


export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const { canAccessFeature } = useUserRoles();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/link-a-logo.png" 
                  alt="Link-A" 
                  className="h-12 w-12 mr-3"
                />
                <h1 className="text-2xl font-bold text-primary">Link-A</h1>
              </div>
            </Link>
          </div>
          

          <div className="flex items-center space-x-4">
            
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    data-testid="user-menu-button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-medium hover:text-dark transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                      {user?.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="hidden md:inline font-medium">{user?.displayName || user?.email || "Utilizador"}</span>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </button>
                
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <Link href="/dashboard">
                    <button
                      data-testid="nav-dashboard"
                      className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-calendar-alt mr-2"></i>Minhas Reservas
                    </button>
                  </Link>
                  <Link href="/partnerships">
                    <button
                      data-testid="nav-partnerships"
                      className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-handshake mr-2"></i>Parcerias
                    </button>
                  </Link>

                  <Link href="/loyalty">
                    <button
                      data-testid="nav-loyalty"
                      className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-crown mr-2"></i>Programa Fidelidade
                    </button>
                  </Link>
                  <hr className="my-2" />
                  
                  {/* Role Switcher Integration */}
                  <div className="px-4 py-2">
                    <RoleSwitcher variant="compact" showBadge={true} />
                  </div>
                  
                  <hr className="my-2" />
                  
                  <Link href="/profile/verification">
                    <button
                      data-testid="nav-verification"
                      className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50 flex items-center"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <i className="fas fa-shield-alt mr-2 text-blue-600"></i>
                      <div>
                        <div className="font-medium">Verificar Perfil</div>
                        <div className="text-xs text-gray-500">Obrigatório para oferecer serviços</div>
                      </div>
                    </button>
                  </Link>
                  
                  {canAccessFeature('admin-panel') && (
                    <Link href="/admin">
                      <button
                        data-testid="nav-admin"
                        className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <i className="fas fa-shield-alt mr-2"></i>Painel Admin
                      </button>
                    </Link>
                  )}
                  <button
                    data-testid="nav-profile"
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <i className="fas fa-user mr-2"></i>Perfil
                  </button>
                  <button
                    data-testid="nav-help"
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <i className="fas fa-question-circle mr-2"></i>Ajuda
                  </button>
                  <hr className="my-2" />
                  <button
                    data-testid="nav-logout"
                    className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-gray-50"
                    onClick={async () => {
                      await signOut();
                      setShowUserMenu(false);
                    }}
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>Sair
                  </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button
                onClick={() => setShowLoginModal(true)}
                className="bg-primary hover:bg-primary-dark"
                data-testid="button-login"
              >
                <User className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
      

      
      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
    </header>
  );
}