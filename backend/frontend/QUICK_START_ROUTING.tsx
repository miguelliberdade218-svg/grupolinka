/**
 * QUICK START: Como integrar as rotas em 5 minutos
 * 
 * Edite seu arquivo AppRouter.tsx (ou similar) e adicione as linhas abaixo
 */

// ========================================
// PASSO 1: Imports
// ========================================

import { HotelsSearchPage } from '@/apps/main-app/features/hotels/pages/HotelsSearchPage';
import { HotelDetailPage } from '@/apps/main-app/features/hotels/pages/HotelDetailPage';
import { EventSpacesSearchPage } from '@/apps/main-app/features/event-spaces/pages/EventSpacesSearchPage';
import { EventSpaceDetailPage } from '@/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage';
import { HotelManagerDashboard } from '@/apps/admin-app/pages/hotel-management/HotelManagerDashboard';

// ========================================
// PASSO 2: Adicionar ao Router (exemplo usando wouter)
// ========================================

/*
function AppRouter() {
  return (
    <Router>
      {/* ROTAS EXISTENTES */}
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      {/* ... suas rotas atuais */}

      {/* ===== HOTÉIS (Main App) ===== */}
      <Route path="/hotels" component={HotelsSearchPage} />
      <Route path="/hotels/:id" component={HotelDetailPage} />

      {/* ===== EVENT SPACES (Main App) ===== */}
      <Route path="/event-spaces" component={EventSpacesSearchPage} />
      <Route path="/event-spaces/:id" component={EventSpaceDetailPage} />

      {/* ===== HOTEL MANAGEMENT (Admin App) ===== */}
      <Route path="/manager/hotels/:hotelId/dashboard" component={HotelManagerDashboard} />

      {/* Fallback */}
      <Route path="*">
        <NotFoundPage />
      </Route>
    </Router>
  );
}
*/

// ========================================
// PASSO 3: Adicionar links no Header/Navigation
// ========================================

/*
import { Link } from 'wouter';

function MainHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/logo.svg" alt="Link-A" className="h-8" />
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/hotels">
            <Button variant="ghost">Hotéis</Button>
          </Link>

          <Link href="/event-spaces">
            <Button variant="ghost">Espaços de Eventos</Button>
          </Link>

          {/* Se usuário é manager */}
          {isManager && (
            <Link href={`/manager/hotels/${managerHotelId}/dashboard`}>
              <Button variant="ghost">Dashboard</Button>
            </Link>
          )}

          {/* Outras opções */}
          <Link href="/profile">
            <Button variant="ghost">Perfil</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
*/

// ========================================
// PASSO 4: Proteger rota do Manager (opcional)
// ========================================

/*
// Se usar wouter, criar wrapper que verifica autenticação
function ProtectedRoute({ path, component: Component, requiredRole }) {
  const { user } = useAuth();
  const { hotelId } = useParams();

  // Verificar se usuário tem acesso ao hotel
  const hasAccess = user?.role === requiredRole && user?.hotelId === hotelId;

  return hasAccess ? <Component /> : <RedirectTo path="/login" />;
}

// Usar assim:
<ProtectedRoute 
  path="/manager/hotels/:hotelId/dashboard" 
  component={HotelManagerDashboard} 
  requiredRole="manager"
/>
*/

// ========================================
// PASSO 5: Testar Localmente
// ========================================

/*
1. Rodear npm run dev
2. Ir para http://localhost:5173/hotels
3. Deve aparecer a página de busca (com dados mockados)
4. Clicar em um hotel → ir para /hotels/:id
5. Clicar em "Espaços de Eventos" → ir para /event-spaces
6. Se tiver dados de manager, testar /manager/hotels/demo-hotel/dashboard

Esperado: Tudo deve funcionar sem erros!
*/

// ========================================
// ALTERNATIVA: Se usar React Router (em vez de wouter)
// ========================================

/*
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/hotels" element={<HotelsSearchPage />} />
        <Route path="/hotels/:id" element={<HotelDetailPage />} />
        <Route path="/event-spaces" element={<EventSpacesSearchPage />} />
        <Route path="/event-spaces/:id" element={<EventSpaceDetailPage />} />
        <Route path="/manager/hotels/:hotelId/dashboard" element={<HotelManagerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
*/

// ========================================
// DICAS IMPORTANTES
// ========================================

/*
1. Imports: Verificar caminhos (@/apps/... é alias, ajustar conforme necessário)

2. Dados Mockados: As páginas vêm com dados mockados (ver console.log)
   Para usar API real, editar hooks em:
   - src/apps/main-app/features/hotels/hooks/useHotels.ts
   - src/apps/main-app/features/event-spaces/hooks/useEventSpaces.ts

3. Estilo: Usa classes Tailwind já existentes (verde, amarelo, etc)
   Se cores estão diferentes, verificar tailwind.config.ts

4. Responsividade: Já é mobile-first
   Testar em device real com F12 → Toggle device toolbar

5. Dashboard Manager: Mostra dados mockados
   Para usar API real, editar componentes em:
   - src/apps/admin-app/components/hotel-management/

Qualquer dúvida → Consultar HOTELS_GUIDE.md
*/

export { HotelsSearchPage, HotelDetailPage, EventSpacesSearchPage, EventSpaceDetailPage, HotelManagerDashboard };
