import React, { useState } from 'react';
import { useAuth } from '@/contexts/authContext';
import { useLocation } from 'wouter';
import {
  BarChart3,
  Users,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  FileText,
  Lock,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Usuários',
      path: '/admin/users',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'Disputas',
      path: '/admin/disputes',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
            label: 'Pagamentos',
      path: '/admin/payments',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: 'Comissões',
      path: '/admin/commissions',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: 'Suporte',
      path: '/admin/support',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      label: 'Documentos',
      path: '/admin/documents',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      label: 'Permissões',
      path: '/admin/permissions',
      icon: <Lock className="w-5 h-5" />,
    },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-0 left-0 z-50 md:hidden p-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-red-900 text-white hover:bg-red-800"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 h-screen bg-gradient-to-b from-red-900 to-red-950 text-white flex flex-col transition-all duration-300 z-40 md:z-0 ${
          mobileOpen ? 'left-0' : '-left-64 md:left-0'
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-red-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🔐 Admin
          </h1>
          <p className="text-xs text-red-200 mt-1">Painel de Controle</p>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-b border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">
                {user.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-red-200 truncate">Administrador</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setLocation(item.path);
                setMobileOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                isActive(item.path)
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'text-red-100 hover:bg-red-800 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-yellow-500 text-red-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-red-800 space-y-2">
          <button className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-red-100 hover:bg-red-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Configurações</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 rounded-lg flex items-center gap-3 text-yellow-300 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
