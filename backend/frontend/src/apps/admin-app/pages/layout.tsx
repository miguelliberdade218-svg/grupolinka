import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';
import './AdminLayout.css';

const menuItems = [
  { path: '/admin', label: '📊 Dashboard', exact: true },
  { path: '/admin/users', label: '👥 Usuários' },
  { path: '/admin/capabilities', label: '✅ Verificações' },
  { path: '/admin/hotels', label: '🏨 Hotéis' },
  { path: '/admin/complaints', label: '⚠️ Reclamações' },
  { path: '/admin/payments', label: '💳 Pagamentos' },
  { path: '/admin/fees', label: '💰 Taxas' },
  { path: '/admin/audit', label: '📋 Auditoria' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location === path;
    return location.startsWith(path);
  };

    const handleLogout = () => {
    console.log('🚪 [AdminLayout] Executando logout...');
    // ✅ CORREÇÃO: Remover todos os itens de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userCapabilities');
    // Limpar também itens legados para compatibilidade
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('isAdmin');
    console.log('✅ [AdminLayout] Dados removidos, redirecionando para login');
    window.location.href = '/login';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🔐 Admin</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="toggle-btn md:hidden"
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`nav-item ${
                isActive(item.path, item.exact) ? 'active' : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.label.split(' ')[0]}</span>
              <span className="nav-label">{item.label.split(' ').slice(1).join(' ')}</span>
              {isActive(item.path, item.exact) && (
                <ChevronRight size={16} className="nav-indicator" />
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span className="nav-label">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1>LinkA Admin Panel</h1>
            <p>Controle e regulação da plataforma</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-btn md:hidden"
            title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
