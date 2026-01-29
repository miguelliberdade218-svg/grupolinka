/**
 * src/apps/hotels-app/App.tsx
 * Entry point principal da app Hotels - VERSÃO FINAL INTEGRADA E CORRIGIDA 28/01/2026
 */

import React from 'react';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { Toaster } from '@/shared/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveHotelProvider, useActiveHotel } from '@/contexts/ActiveHotelContext';
import HotelsHeader from './components/HotelsHeader';
import HotelManagerDashboard from './pages/hotel-management/HotelManagerDashboard';
import HotelCreationPage from './pages/HotelCreationPage';
import EventSpacesManagementModern from './components/event-spaces/EventSpacesManagementModern';
import EventBookingsPage from './pages/EventBookingsPage';
import EventDashboardPage from './pages/events/EventDashboardPage';
import EventSpaceBookingsList from './components/event-spaces/EventSpaceBookingsList';

const queryClient = new QueryClient();

function AppContent() {
  const { activeHotel } = useActiveHotel(); // ← usa o que realmente existe
  const activeHotelId = activeHotel?.id || ''; // extrai o id com segurança

  const [, setLocation] = useLocation();
  const location = useLocation()[0];

  // Redirecionamentos automáticos
  if (location === '/hotels' || location === '/hotels/') {
    setLocation('/hotels/manage');
  }
  if (location === '/hotels/events' || location === '/hotels/events/') {
    setLocation('/hotels/events/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HotelsHeader />

      <main className="flex-1 pb-20 md:pb-4">
        <Switch>
          {/* Gestão de hotéis */}
          <Route path="/hotels/manage" component={HotelManagerDashboard} />
          <Route path="/hotels/create" component={HotelCreationPage} />

          {/* Dashboard de Eventos */}
          <Route path="/hotels/events/dashboard">
            <EventDashboardPage hotelId={activeHotelId} />
          </Route>

          {/* Lista geral de reservas (por hotel) */}
          <Route path="/hotels/events/bookings">
            <EventBookingsPage hotelId={activeHotelId} />
          </Route>

          {/* Reservas de um espaço específico */}
          <Route path="/hotels/events/spaces/:spaceId/bookings">
            {(params) => (
              <EventSpaceBookingsList
                spaceId={params.spaceId || ''}
                spaceName="Espaço de Eventos"
                onClose={() => setLocation('/hotels/events/bookings')}
              />
            )}
          </Route>

          {/* Gestão de espaços de eventos */}
          <Route path="/hotels/events">
            <EventSpacesManagementModern hotelId={activeHotelId} />
          </Route>

          {/* Redirecionamentos */}
          <Route path="/hotels">
            <Redirect to="/hotels/manage" />
          </Route>
          <Route path="/hotels/events">
            <Redirect to="/hotels/events/dashboard" />
          </Route>

          {/* Default */}
          <Route component={HotelManagerDashboard} />
        </Switch>
      </main>

      <Toaster />
    </div>
  );
}

export default function HotelsApp() {
  return (
    <ActiveHotelProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ActiveHotelProvider>
  );
}