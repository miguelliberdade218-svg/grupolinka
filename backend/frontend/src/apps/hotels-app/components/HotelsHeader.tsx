// src/apps/hotels-app/components/HotelsHeader.tsx
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/shared/hooks/useAuth';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  UserCircle,
  LogOut,
  Settings,
  Home,
  BarChart3,
  DoorOpen,
  Calendar,
  MessageSquare,
  CreditCard,
  Building2,
  Plus,
  // Renomeado o ícone Hotel para evitar conflito
  HotelIcon,
} from 'lucide-react';
import { HotelSelector } from '@/apps/hotels-app/components/HotelSelector';
import type { Hotel } from '@/shared/types/hotels';  // ← 'type' para import de tipo apenas

export default function HotelsHeader() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleHotelChange = (hotel: Hotel | null) => {
    // Aqui você pode adicionar lógica adicional se quiser (ex: recarregar dados)
    console.log('Hotel selecionado no header:', hotel?.name);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo e Nome */}
        <Link href="/hotels/manage" className="flex items-center space-x-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md group-hover:shadow-lg transition-all">
            <HotelIcon className="h-5 w-5" />  {/* ← Usando HotelIcon em vez de Hotel */}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gestão de Hotéis</h1>
            <p className="text-xs text-gray-500 -mt-1">Link-A Hotels</p>
          </div>
        </Link>

        {/* Navegação Desktop */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/hotels/manage">
              <Button
                variant={location === '/hotels/manage' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 px-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/hotels/create">
              <Button
                variant={location === '/hotels/create' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Hotel
              </Button>
            </Link>

            <Link href="/">
              <Button variant="outline" size="sm" className="h-9 px-4">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Site
              </Button>
            </Link>
          </nav>
        )}

        {/* Área direita: Selector + User Menu */}
        <div className="flex items-center space-x-4">
          {/* Selector de Hotéis - só aparece se logado */}
          {user && (
            <div className="hidden md:block">
              <HotelSelector onChange={handleHotelChange} showCreateButton={false} />
            </div>
          )}

          {/* Menu do Usuário */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-2 py-1"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-700 font-medium">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuItem asChild>
                  <Link href="/hotels/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}