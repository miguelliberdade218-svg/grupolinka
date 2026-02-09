import { Link, useLocation } from "wouter";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/shared/components/ui/dropdown-menu";
import { UserCircle, LogOut, Settings, Shield, Users, TrendingUp, Home, Database, ChevronDown, Bell, Search, Menu, X, BarChart3, CreditCard, Building, Car, AlertTriangle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { LogoCompact } from "@/shared/components/Logo";
import { cn } from "@/shared/lib/utils";

export default function AdminHeader() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efeito de scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <TrendingUp className="h-4 w-4" />, active: location === "/admin" },
    { href: "/admin/users", label: "Utilizadores", icon: <Users className="h-4 w-4" />, active: location.startsWith("/admin/users") },
    { href: "/admin/rides", label: "Viagens", icon: <Car className="h-4 w-4" />, active: location.startsWith("/admin/rides") },
    { href: "/admin/hotels", label: "Hotéis", icon: <Building className="h-4 w-4" />, active: location.startsWith("/admin/hotels") },
    { href: "/admin/finance", label: "Finanças", icon: <CreditCard className="h-4 w-4" />, active: location.startsWith("/admin/finance") },
    { href: "/admin/reports", label: "Relatórios", icon: <BarChart3 className="h-4 w-4" />, active: location.startsWith("/admin/reports") },
  ];

  return (
    <>
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled 
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg" 
          : "bg-white border-b border-gray-100"
      )}>
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo e Nome - ATUALIZADO com LogoCompact */}
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2 group">
              {/* ✅ CORREÇÃO APLICADA: Substituído pelo LogoCompact */}
              <LogoCompact size="md" className="group-hover:scale-105 transition-transform duration-300" />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900">Link-A</h1>
                <p className="text-xs text-gray-500 -mt-1">Administração</p>
              </div>
            </Link>
          </div>

          {/* Barra de Busca Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar utilizadores, viagens, hotéis..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-gray-50/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Lado Direito - Ações */}
          <div className="flex items-center space-x-3">
            {/* Notificações */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </Button>

            {/* Botão Voltar ao Site */}
            <Link href="/">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:inline-flex h-9 border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Site
              </Button>
            </Link>

            {/* Menu do Utilizador */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500">Administrador</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-2xl border border-gray-200/80">
                  {/* Header do Menu */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-red-100">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="Perfil" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {user.displayName || user.email || "Administrador"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email || "Conta de Administração"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Menu */}
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Configurações</div>
                      <div className="text-xs text-gray-500">Preferências da conta</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <Shield className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Segurança</div>
                      <div className="text-xs text-gray-500">Gerir permissões</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Ajuda & Suporte</div>
                      <div className="text-xs text-gray-500">Documentação e FAQ</div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="px-4 py-3 hover:bg-red-50 cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <div>
                      <div className="font-medium">Sair da Conta</div>
                      <div className="text-xs text-red-500">Encerrar sessão administrativa</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                  Entrar
                </Button>
              </Link>
            )}

            {/* Menu Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-700"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl animate-in slide-in-from-right">
            {/* Header do Menu Mobile */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <LogoCompact size="md" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Link-A</h1>
                  <p className="text-xs text-gray-500 -mt-1">Administração</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Conteúdo do Menu Mobile */}
            <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
              {/* Barra de Busca Mobile */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-gray-50"
                />
              </div>

              {/* Navegação Mobile */}
              <nav className="space-y-1 mb-6">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                        item.active 
                          ? "bg-red-50 text-red-700 font-semibold border-l-4 border-red-500" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.active 
                          ? "bg-red-100" 
                          : "bg-gray-100"
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </Link>
                ))}
              </nav>

              {/* Botão Voltar ao Site Mobile */}
              <div className="mb-6">
                <Link href="/">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-50 border border-gray-200"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Home className="h-5 w-5" />
                    Voltar ao Site Principal
                  </button>
                </Link>
              </div>

              {/* Seção do Usuário Mobile */}
              {user && (
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-red-100">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Perfil" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {user.displayName || user.email || "Administrador"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email || "Conta de Administração"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <Settings className="h-4 w-4 text-gray-500" />
                      Configurações
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <Shield className="h-4 w-4 text-gray-500" />
                      Segurança
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                      Ajuda & Suporte
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 mt-4"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da Conta
                    </button>
                  </div>
                </div>
              )}

              {/* Alertas do Sistema */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">Alertas do Sistema</span>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">⚠️ 3 Pendências</p>
                    <p className="text-xs text-yellow-700">Verificações de utilizadores</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">🚨 1 Crítico</p>
                    <p className="text-xs text-red-700">Problema de pagamento</p>
                  </div>
                </div>
              </div>

              {/* Info do Sistema */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Versão:</strong> 2.4.1 • <strong>Último acesso:</strong> Hoje, 09:42
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NOVO: Barra de navegação secundária para desktop */}
      <div className="hidden md:block bg-gray-50 border-b border-gray-200">
        <div className="container px-4">
          <nav className="flex items-center space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 rounded-md text-sm font-medium transition-colors",
                    item.active 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                  {item.active && (
                    <span className="ml-2 w-2 h-2 bg-white rounded-full"></span>
                  )}
                </Button>
              </Link>
            ))}
            
            {/* Indicador de Status */}
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Sistema Online
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-gray-600 hover:text-red-600"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Alertas
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}