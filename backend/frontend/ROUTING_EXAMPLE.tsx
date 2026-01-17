/**
 * EXEMPLO DE INTEGRAÇÃO COM ROUTING
 * Adicionar ao seu AppRouter.tsx ou arquivo de rotas principal
 * 
 * Estetá é um exemplo - ajustar conforme sua estrutura atual
 */

import { HotelsSearchPage } from '@/apps/main-app/features/hotels/pages/HotelsSearchPage';
import { HotelDetailPage } from '@/apps/main-app/features/hotels/pages/HotelDetailPage';
import { EventSpacesSearchPage } from '@/apps/main-app/features/event-spaces/pages/EventSpacesSearchPage';
import { EventSpaceDetailPage } from '@/apps/main-app/features/event-spaces/pages/EventSpaceDetailPage';
import { HotelManagerDashboard } from '@/apps/admin-app/pages/hotel-management/HotelManagerDashboard';

// ==========================================
// ROTAS PARA MAIN APP (Clientes)
// ==========================================

export const mainAppRoutes = [
  // ===== HOTÉIS =====
  {
    path: '/hotels',
    component: HotelsSearchPage,
    name: 'Hotels Search',
  },
  {
    path: '/hotels/:id',
    component: HotelDetailPage,
    name: 'Hotel Detail',
  },

  // ===== EVENT SPACES =====
  {
    path: '/event-spaces',
    component: EventSpacesSearchPage,
    name: 'Event Spaces Search',
  },
  {
    path: '/event-spaces/:id',
    component: EventSpaceDetailPage,
    name: 'Event Space Detail',
  },

  // Próximas páginas a implementar:
  // {
  //   path: '/hotels/:id/booking',
  //   component: HotelBookingPage,
  //   name: 'Hotel Booking',
  // },
  // {
  //   path: '/event-spaces/:id/booking',
  //   component: EventSpaceBookingPage,
  //   name: 'Event Space Booking',
  // },
  // {
  //   path: '/my-bookings',
  //   component: MyBookingsPage,
  //   name: 'My Bookings',
  // },
];

// ==========================================
// ROTAS PARA ADMIN APP (Hotel Managers)
// ==========================================

export const adminAppRoutes = [
  // ===== HOTEL MANAGEMENT =====
  {
    path: '/manager/hotels/:hotelId/dashboard',
    component: HotelManagerDashboard,
    name: 'Hotel Manager Dashboard',
    requiresAuth: true,
    requiresHotelOwner: true,
  },

  // Próximas páginas a implementar (como rotas separadas ou via tabs):
  // {
  //   path: '/manager/hotels/:hotelId/rooms',
  //   component: RoomTypesPage,
  //   name: 'Room Types Management',
  // },
  // {
  //   path: '/manager/hotels/:hotelId/spaces',
  //   component: EventSpacesPage,
  //   name: 'Event Spaces Management',
  // },
  // ... etc
];

// ==========================================
// EXEMPLO: Como usar no seu AppRouter.tsx
// ==========================================

/*
import { Router, Route } from 'wouter';

function AppRouter() {
  return (
    <Router>
      {/* Main App Routes */}
      {mainAppRoutes.map(route => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}

      {/* Admin App Routes */}
      {adminAppRoutes.map(route => (
        <Route key={route.path} path={route.path} component={route.component} />
      ))}

      {/* Fallback */}
      <Route path="*">
        <NotFoundPage />
      </Route>
    </Router>
  );
}

export default AppRouter;
*/

// ==========================================
// EXEMPLO: Como usar em Links/Navigation
// ==========================================

/*
import { Link } from 'wouter';

// Ir para busca de hotéis
<Link href="/hotels">Ver Hotéis</Link>

// Ir para detalhes de um hotel
<Link href={`/hotels/${hotelId}`}>Ver Hotel</Link>

// Ir para busca de event spaces
<Link href="/event-spaces">Ver Espaços de Eventos</Link>

// Ir para dashboard do manager
<Link href={`/manager/hotels/${hotelId}/dashboard`}>Dashboard</Link>
*/

// ==========================================
// EXEMPLO: Como adicionar link no Header/Menu
// ==========================================

/*
import { Link } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { HomeIcon, CalendarIcon } from 'lucide-react';

function MainNavigation() {
  return (
    <nav className="flex gap-4">
      <Link href="/hotels">
        <Button variant="ghost">
          <HomeIcon className="w-4 h-4 mr-2" />
          Hotéis
        </Button>
      </Link>

      <Link href="/event-spaces">
        <Button variant="ghost">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Espaços de Eventos
        </Button>
      </Link>
    </nav>
  );
}

export default MainNavigation;
*/

// ==========================================
// EXPORT: Rotas para usar em outro arquivo
// ==========================================

export { mainAppRoutes, adminAppRoutes };
