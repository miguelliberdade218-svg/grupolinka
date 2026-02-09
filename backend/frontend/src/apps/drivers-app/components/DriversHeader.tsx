import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/shared/components/ui/dropdown-menu";
import { 
  Menu, 
  UserCircle, 
  LogOut, 
  Settings, 
  Car, 
  Plus, 
  MessageCircle, 
  TrendingUp, 
  Wrench, 
  ChevronDown, 
  Bell, 
  Search, 
  X, 
  Home, 
  DollarSign, 
  Shield, 
  HelpCircle,
  MapPin,
  Calendar,
  Users as UsersIcon,
  FileText,
  Star
} from "lucide-react";
import { LogoCompact } from "@/shared/components/Logo";
import { cn } from "@/shared/lib/utils";

export default function DriversHeader() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

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
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    return (user as any).displayName || 
           (user as any).name || 
           user.email?.split('@')[0] || 
           user.email || 
           'Motorista';
  };

  const navItems = [
    { href: "/drivers", label: "Dashboard", icon: <TrendingUp className="h-4 w-4" />, active: location === "/drivers" },
    { href: "/drivers/publish", label: "Publicar Rota", icon: <Plus className="h-4 w-4" />, active: location.startsWith("/drivers/publish") },
    { href: "/drivers/offers", label: "Minhas Ofertas", icon: <Car className="h-4 w-4" />, active: location.startsWith("/drivers/offers") },
    { href: "/drivers/vehicles", label: "Meus Veículos", icon: <Wrench className="h-4 w-4" />, active: location.startsWith("/drivers/vehicles") },
    { href: "/drivers/earnings", label: "Ganhos", icon: <DollarSign className="h-4 w-4" />, active: location.startsWith("/drivers/earnings") },
    { href: "/drivers/partnerships", label: "Parcerias", icon: <UsersIcon className="h-4 w-4" />, active: location.startsWith("/drivers/partnerships") },
    { href: "/drivers/chat", label: "Mensagens", icon: <MessageCircle className="h-4 w-4" />, active: location.startsWith("/drivers/chat") },
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
            <Link href="/drivers" className="flex items-center space-x-2 group">
              {/* ✅ CORREÇÃO APLICADA: Substituído pelo LogoCompact */}
              <LogoCompact size="md" className="group-hover:scale-105 transition-transform duration-300" />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900">Link-A</h1>
                <p className="text-xs text-gray-500 -mt-1">Área do Motorista</p>
              </div>
            </Link>
          </div>

          {/* Barra de Busca Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar rotas, passageiros, locais..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 text-sm transition-all"
              />
            </div>
          </div>

          {/* Lado Direito - Ações */}
          <div className="flex items-center space-x-3">
            {/* Notificações */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* Botão Voltar ao Site */}
            <Link href="/">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden md:inline-flex h-9 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Site Principal
              </Button>
            </Link>

            {/* Menu do Motorista */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
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
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500">Motorista Verificado</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-2xl border border-gray-200/80">
                  {/* Header do Menu */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-blue-100">
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
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email || "Conta de Motorista"}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">4.8 • 152 viagens</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Menu */}
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Configurações</div>
                      <div className="text-xs text-gray-500">Preferências e conta</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <Shield className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Verificação</div>
                      <div className="text-xs text-gray-500">Status: Verificado ✓</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <DollarSign className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Ganhos</div>
                      <div className="text-xs text-gray-500">R$ 2,450.80 este mês</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">Ajuda & Suporte</div>
                      <div className="text-xs text-gray-500">Central do motorista</div>
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
                      <div className="text-xs text-red-500">Encerrar sessão</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  Entrar
                </Button>
              </Link>
            )}

            {/* Botão Publicar Rota (destaque) */}
            <Link href="/drivers/publish">
              <Button 
                size="sm"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-shadow"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Publicar Rota</span>
              </Button>
            </Link>

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
                  <p className="text-xs text-gray-500 -mt-1">Área do Motorista</p>
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
                  placeholder="Pesquisar rotas, passageiros..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50"
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
                          ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500" 
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.active 
                          ? "bg-blue-100" 
                          : "bg-gray-100"
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </Link>
                ))}
              </nav>

              {/* Botões de Ação Mobile */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link href="/drivers/publish">
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Plus className="h-4 w-4" />
                    Nova Rota
                  </button>
                </Link>
                <Link href="/">
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all border border-gray-300"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Home className="h-4 w-4" />
                    Site Principal
                  </button>
                </Link>
              </div>

              {/* Seção do Motorista Mobile */}
              {user && (
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-blue-100">
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
                        {getDisplayName()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email || "Conta de Motorista"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">4.8 rating</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-700">152</div>
                      <div className="text-xs text-blue-600">Viagens</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-700">R$ 2,450</div>
                      <div className="text-xs text-green-600">Este mês</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <Settings className="h-4 w-4 text-gray-500" />
                      Configurações
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      Meus Ganhos
                    </button>
                    <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                      Ajuda & Suporte
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 mt-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da Conta
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Rápidas */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Viagens Hoje</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mensagens</span>
                    <span className="font-semibold">5 novas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avaliações</span>
                    <span className="font-semibold">4.8 ★</span>
                  </div>
                </div>
              </div>

              {/* Links Úteis */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Links Úteis</h4>
                <div className="grid grid-cols-2 gap-2">
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded text-center">
                    Termos
                  </a>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded text-center">
                    Suporte
                  </a>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded text-center">
                    FAQ Motoristas
                  </a>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded text-center">
                    Segurança
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de navegação secundária para desktop */}
      <div className="hidden md:block bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
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
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                      : "text-gray-700 hover:text-blue-600 hover:bg-white/80"
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
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Online • 3 viagens hoje
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                <Calendar className="h-3 w-3" />
                2 reservas pendentes
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}