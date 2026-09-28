import React, { useState } from 'react';
import { useAuth } from '../../../contexts/authContext';
import { useLocation } from 'wouter';
import {
  Menu,
  X,
  LogOut,
  User,
  Settings,
  BarChart3,
  MapPin,
  FileText,
  MessageSquare,
  Star,
  DollarSign,
  PlayCircle,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const DriversSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    { label: 'Dashboard', path: '/drivers', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Gerir Viagens', path: '/drivers/rides', icon: <PlayCircle className="w-5 h-5" /> },
    
    { label: 'Meus Veículos', path: '/drivers/vehicles', icon: <FileText className="w-5 h-5" /> },
    { label: 'Avaliações', path: '/drivers/reviews', icon: <Star className="w-5 h-5" /> },
    { label: 'Ganhos', path: '/drivers/earnings', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Comissões', path: '/drivers/commissions', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Mensagens', path: '/drivers/chat', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-blue-600 text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">🚗 LinkA</h1>
          <p className="text-sm text-gray-400 mt-1">Motoristas</p>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                setLocation(item.path);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-xs text-white px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition">
            <User className="w-5 h-5" />
            <span>Meu Perfil</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition">
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900 hover:bg-opacity-20 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className="hidden md:block w-64" />
    </>
  );
};
