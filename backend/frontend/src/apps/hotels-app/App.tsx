/**
 * src/apps/hotels-app/App.tsx
 * Entry point principal da app Hotels - VERSÃO ATUALIZADA COM GESTÃO DE RESERVAS
 * ✅ ADICIONADO: Página de gestão de reservas de hotéis
 */

import React from 'react';
// ✅ ADICIONADO: AppGuard para verificar capacidades
import { HotelsAppGuard } from './components/AppGuard';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { Toaster as SonnerToaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveHotelProvider, useActiveHotel } from '@/contexts/ActiveHotelContext';
import { ActiveEventSpaceProvider } from '@/contexts/ActiveEventSpaceContext';
import { Button } from '@/shared/components/ui/button';
import HotelsHeader from './components/HotelsHeader';
import HotelManagerDashboard from './pages/hotel-management/HotelManagerDashboard';
import CreateHotelForm from './components/CreateHotelForm';
import EventSpacesManagementModern from './components/event-spaces/EventSpacesManagementModern';
import EventBookingsPage from './pages/EventBookingsPage';
import EventDashboardPage from './pages/events/EventDashboardPage';
import EventSpaceBookingsList from './components/event-spaces/EventSpaceBookingsList';
import EventSpaceCreatePage from './pages/events/EventSpaceCreatePage';
import EventSpaceEditPage from './pages/events/EventSpaceEditPage';
import EventDashboardWithSpace from './components/event-spaces/EventDashboardWithSpace';

// ✅ ADICIONADO: Import da página de gestão de reservas
import HotelBookingsPage from './pages/bookings/HotelBookingsPage';

// ✅ ADICIONADO: Import da página de pagamentos/comissões
import ProviderPaymentsDashboard from '../provider-app/pages/payments';

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HotelsHeader />
      <main className="flex-1 pb-20 md:pb-4">
        <Switch>
          {/* Gestão de hotéis */}
          <Route path="/hotels-app/manage" component={HotelManagerDashboard} />
          
          {/* ✅ ADICIONADO: Gestão de reservas de hotéis */}
          <Route path="/hotels-app/bookings" component={HotelBookingsPage} />
          
          {/* ✅ ADICIONADO: Pagamentos e Comissões */}
          <Route path="/hotels-app/payments" component={ProviderPaymentsDashboard} />
          
          {/* Detalhes de reserva específica */}
          <Route path="/hotels-app/bookings/:bookingId">
            {(params) => (
              <div className="container mx-auto p-6">
                <div className="text-center p-10 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">Detalhes da Reserva</h2>
                  <p className="text-gray-600 mb-4">ID: {params.bookingId}</p>
                  <p className="text-gray-600 mb-6">
                    Para ver detalhes completos, use a página de gestão de reservas.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setLocation('/hotels-app/bookings')}>
                      Voltar para Gestão de Reservas
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Route>

          {/* Criação de hotel */}
          <Route path="/hotels-app/create">
            {() => (
              <CreateHotelForm 
                onSuccess={(hotelId) => {
                  console.log('✅ Hotel criado com sucesso, redirecionando...');
                  setTimeout(() => {
                    setLocation('/hotels-app/manage');
                  }, 1500);
                }}
                onCancel={() => {
                  console.log('❌ Criação cancelada, voltando ao dashboard...');
                  setLocation('/hotels-app/manage');
                }}
              />
            )}
          </Route>

          {/* Dashboard de Eventos */}
          <Route path="/hotels-app/events/dashboard">
            <EventDashboardPage hotelId={activeHotelId} />
          </Route>

          {/* Dashboard específico do espaço de eventos */}
          <Route path="/hotels-app/events/spaces/:spaceId/dashboard">
            {(params) => {
              const spaceId = params.spaceId || '';
              return <EventDashboardWithSpace hotelId={activeHotelId} spaceId={spaceId} />;
            }}
          </Route>

          {/* Lista geral de reservas (por hotel) */}
          <Route path="/hotels-app/events/bookings">
            <EventBookingsPage hotelId={activeHotelId} />
          </Route>

          {/* Reservas de um espaço específico */}
          <Route path="/hotels-app/events/spaces/:spaceId/bookings">
            {(params) => (
              <EventSpaceBookingsList
                spaceId={params.spaceId || ''}
                spaceName="Espaço de Eventos"
                onClose={() => setLocation('/hotels-app/events/bookings')}
              />
            )}
          </Route>

          {/* Criação de espaço de eventos */}
          <Route path="/hotels-app/events/spaces/create">
            {(params) => {
              const urlParams = new URLSearchParams(window.location.search);
              const hotelIdParam = urlParams.get('hotelId') || activeHotelId;
              return <EventSpaceCreatePage hotelId={hotelIdParam} />;
            }}
          </Route>

          {/* Edição de espaço de eventos */}
          <Route path="/hotels-app/events/spaces/:spaceId/edit">
            {(params) => (
              <EventSpaceEditPage spaceId={params.spaceId || ''} />
            )}
          </Route>

          {/* Calendário do espaço de eventos */}
          <Route path="/hotels-app/events/spaces/:spaceId/calendar">
            {(params) => (
              <div className="container mx-auto p-6">
                <div className="text-center p-10 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">Calendário do Espaço</h2>
                  <p className="text-gray-600 mb-4">ID: {params.spaceId}</p>
                  <p className="text-gray-600 mb-6">Página em desenvolvimento...</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setLocation('/hotels-app/events/spaces')}>
                      Voltar para Gestão de Espaços
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Route>

          {/* Detalhes do espaço de eventos */}
          <Route path="/hotels-app/events/spaces/:spaceId">
            {(params) => (
              <div className="container mx-auto p-6">
                <div className="text-center p-10 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-bold mb-4">Detalhes do Espaço</h2>
                  <p className="text-gray-600 mb-4">ID: {params.spaceId}</p>
                  <p className="text-gray-600 mb-6">Página em desenvolvimento...</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setLocation(`/hotels-app/events/spaces/${params.spaceId}/edit`)}>
                      Editar Espaço
                    </Button>
                    <Button onClick={() => setLocation('/hotels-app/events/spaces')} variant="outline">
                      Voltar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Route>

          {/* Gestão de espaços de eventos */}
          <Route path="/hotels-app/events/spaces">
            <EventSpacesManagementModern hotelId={activeHotelId} />
          </Route>

          {/* Redirecionamentos DENTRO do hotels-app */}
          <Route path="/hotels-app">
            <Redirect to="/hotels-app/manage" />
          </Route>
          <Route path="/hotels-app/events">
            <Redirect to="/hotels-app/events/dashboard" />
          </Route>

          {/* Default - fallback */}
          <Route component={HotelManagerDashboard} />
        </Switch>
      </main>
      <SonnerToaster 
        richColors 
        position="top-center"
        duration={10000}
        expand={true}
        visibleToasts={3}
        closeButton
        toastOptions={{
          className: 'text-lg',
          descriptionClassName: 'text-base',
        }}
      />
    </div>
  );
}

export default function HotelsApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <HotelsAppGuard>
        <ActiveHotelProvider>
          <ActiveEventSpaceProvider>
            <AppContent />
          </ActiveEventSpaceProvider>
        </ActiveHotelProvider>
      </HotelsAppGuard>
    </QueryClientProvider>
  );
}