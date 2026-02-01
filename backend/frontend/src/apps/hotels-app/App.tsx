/**
 * src/apps/hotels-app/App.tsx
 * Entry point principal da app Hotels - VERSÃO FINAL INTEGRADA E CORRIGIDA 28/01/2026
 * ATUALIZADO: Inclui ActiveEventSpaceProvider e páginas de espaços de eventos
 * ✅ INCLUÍDO: Rota para dashboard específico do espaço COM WRAPPER
 */

import React from 'react';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { Toaster } from '@/shared/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveHotelProvider, useActiveHotel } from '@/contexts/ActiveHotelContext';
import { ActiveEventSpaceProvider } from '@/contexts/ActiveEventSpaceContext';
import { Button } from '@/shared/components/ui/button';
import HotelsHeader from './components/HotelsHeader';
import HotelManagerDashboard from './pages/hotel-management/HotelManagerDashboard';
import HotelCreationPage from './pages/HotelCreationPage';
import EventSpacesManagementModern from './components/event-spaces/EventSpacesManagementModern';
import EventBookingsPage from './pages/EventBookingsPage';
import EventDashboardPage from './pages/events/EventDashboardPage';
import EventSpaceBookingsList from './components/event-spaces/EventSpaceBookingsList';

// ✅ IMPORTAR AS PÁGINAS CRIADAS
import EventSpaceCreatePage from './pages/events/EventSpaceCreatePage';
import EventSpaceEditPage from './pages/events/EventSpaceEditPage';

// ✅ NOVO IMPORT: Wrapper para dashboard com espaço
import EventDashboardWithSpace from './components/event-spaces/EventDashboardWithSpace';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

function AppContent() {
  const { activeHotel } = useActiveHotel();
  const activeHotelId = activeHotel?.id || '';
  const [, setLocation] = useLocation();
  const location = useLocation()[0];

  // Redirecionamentos automáticos
  React.useEffect(() => {
    if (location === '/hotels' || location === '/hotels/') {
      setLocation('/hotels/manage');
    }
    if (location === '/hotels/events' || location === '/hotels/events/') {
      setLocation('/hotels/events/dashboard');
    }
  }, [location, setLocation]);

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

          {/* ✅ ATUALIZADO: Dashboard específico do espaço de eventos COM WRAPPER */}
          <Route path="/hotels/events/spaces/:spaceId/dashboard">
            {(params) => {
              const spaceId = params.spaceId || '';
              return <EventDashboardWithSpace hotelId={activeHotelId} spaceId={spaceId} />;
            }}
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

          {/* Criação de espaço de eventos */}
          <Route path="/hotels/events/spaces/create">
            {(params) => {
              const urlParams = new URLSearchParams(window.location.search);
              const hotelIdParam = urlParams.get('hotelId') || activeHotelId;
              return <EventSpaceCreatePage hotelId={hotelIdParam} />;
            }}
          </Route>

          {/* Edição de espaço de eventos */}
          <Route path="/hotels/events/spaces/:spaceId/edit">
            {(params) => (
              <EventSpaceEditPage spaceId={params.spaceId || ''} />
            )}
          </Route>

          {/* Calendário do espaço de eventos (opcional - manter fallback) */}
          <Route path="/hotels/events/spaces/:spaceId/calendar">
            {(params) => (
              <div className="container mx-auto p-6">
                <div className="text-center p-10 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">Calendário do Espaço</h2>
                  <p className="text-gray-600 mb-4">ID: {params.spaceId}</p>
                  <p className="text-gray-600 mb-6">Página em desenvolvimento...</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setLocation('/hotels/events/spaces')}>
                      Voltar para Gestão de Espaços
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Route>

          {/* Detalhes do espaço de eventos (opcional - manter fallback) */}
          <Route path="/hotels/events/spaces/:spaceId">
            {(params) => (
              <div className="container mx-auto p-6">
                <div className="text-center p-10 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">Detalhes do Espaço</h2>
                  <p className="text-gray-600 mb-4">ID: {params.spaceId}</p>
                  <p className="text-gray-600 mb-6">Página em desenvolvimento...</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setLocation(`/hotels/events/spaces/${params.spaceId}/edit`)}>
                      Editar Espaço
                    </Button>
                    <Button onClick={() => setLocation('/hotels/events/spaces')} variant="outline">
                      Voltar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Route>

          {/* Gestão de espaços de eventos (página principal) */}
          <Route path="/hotels/events/spaces">
            <EventSpacesManagementModern hotelId={activeHotelId} />
          </Route>

          {/* Redirecionamentos */}
          <Route path="/hotels">
            <Redirect to="/hotels/manage" />
          </Route>
          <Route path="/hotels/events">
            <Redirect to="/hotels/events/dashboard" />
          </Route>

          {/* Default - fallback */}
          <Route component={HotelManagerDashboard} />
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default function HotelsApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveHotelProvider>
        <ActiveEventSpaceProvider>
          <AppContent />
        </ActiveEventSpaceProvider>
      </ActiveHotelProvider>
    </QueryClientProvider>
  );
}