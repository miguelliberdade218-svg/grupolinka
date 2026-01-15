import { Link, useLocation } from "wouter";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { UserCircle, LogOut, Settings, Shield, Users, TrendingUp, Home, Database } from "lucide-react";

export default function AdminHeader() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo e Nome */}
        <div className="flex items-center space-x-3">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Link-A</h1>
              <p className="text-xs text-gray-500 -mt-1">Administração</p>
            </div>
          </Link>
        </div>

        {/* Navegação Desktop */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link href="/admin">
            <Button 
              variant={location === "/admin" ? "default" : "ghost"} 
              size="sm"
              className="h-9"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button 
              variant={location.startsWith("/admin/users") ? "default" : "ghost"} 
              size="sm"
              className="h-9"
            >
              <Users className="h-4 w-4 mr-2" />
              Utilizadores
            </Button>
          </Link>
          <Link href="/">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Site
            </Button>
          </Link>
        </nav>

        {/* Menu do Utilizador */}
        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <UserCircle className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">{user.displayName || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}