/**
 * src/apps/hotels-app/App.tsx
 * Entry point principal da app Hotels - VERSÃO FINAL 26/01/2026
 * Inclui rotas para gestão de hotéis E espaços de eventos
 */

import React from 'react';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { Toaster } from '@/shared/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveHotelProvider } from '@/contexts/ActiveHotelContext';
import HotelsHeader from './components/HotelsHeader';
import HotelManagerDashboard from './pages/hotel-management/HotelManagerDashboard';
import HotelCreationPage from './pages/HotelCreationPage';
import EventSpacesManagementModern from './components/event-spaces/EventSpacesManagementModern';
// Futuro: importar página de detalhes de espaço
// import EventSpaceDetailPage from './pages/event-spaces/EventSpaceDetailPage';

const queryClient = new QueryClient();

export default function HotelsApp() {
  const [, setLocation] = useLocation();
  const location = useLocation()[0];

  // Redirecionamentos automáticos úteis
  if (location === '/hotels' || location === '/hotels/') {
    setLocation('/hotels/manage');
  }

  return (
    <ActiveHotelProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <HotelsHeader />

          <main className="flex-1 pb-20 md:pb-4">
            <Switch>
              {/* Gestão de hotéis */}
              <Route path="/hotels/manage" component={HotelManagerDashboard} />
              <Route path="/hotels/create" component={HotelCreationPage} />

              {/* Espaços de eventos - usando hotelId do contexto */}
              <Route path="/hotels/events">
                <EventSpacesManagementModern hotelId="" /> {/* hotelId vem do contexto */}
              </Route>

              {/* Futuro: detalhes de espaço específico */}
              {/* <Route path="/hotels/events/:spaceId" component={EventSpaceDetailPage} /> */}

              {/* Redirecionamentos */}
              <Route path="/hotels">
                <Redirect to="/hotels/manage" />
              </Route>

              {/* Default: dashboard */}
              <Route component={HotelManagerDashboard} />
            </Switch>
          </main>

          <Toaster />
        </div>
      </QueryClientProvider>
    </ActiveHotelProvider>
  );
}