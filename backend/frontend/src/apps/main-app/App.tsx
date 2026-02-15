// src/apps/main-app/AppRouter.tsx - VERSÃO FINAL CORRIGIDA
// ✅ ADICIONADO: Rota de confirmação para eventos
// ✅ CORREÇÃO: Path exato que o frontend está a usar

import { Switch, Route } from 'wouter';
import { queryClient } from '@/shared/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/shared/components/ui/toaster';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import Header from '@/shared/components/Header';
import MobileNavigation from '@/shared/components/MobileNavigation';
import Home from './pages/home';
import Events from './pages/events';
import Bookings from './pages/bookings';
import Loyalty from './pages/loyalty';
import Chat from './pages/chat';
import Notifications from './pages/notifications';
import Profile from './pages/profile';
import RideSearchPage from './pages/Rides/search';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import NotFound from './pages/not-found';

// Import das páginas de hotéis
import HotelsSearchPage from './pages/HotelsSearchPage';
import HotelDetailsPage from './pages/HotelDetailsPage';
import HotelBookingPage from './pages/HotelBookingPage';

// Import das páginas de event spaces
import EventSpacesSearchPage from './pages/EventSpacesSearchPage';
import EventSpaceDetailsPage from './pages/EventSpaceDetailsPage';
import EventSpaceBookingPage from './pages/EventSpaceBookingPage';

// ✅ Import da página de confirmação de reserva
import BookingConfirmationPage from './pages/BookingConfirmationPage';

function MainApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
            <Switch>
              {/* Rota de Rides */}
              <Route path="/rides/search">
                <RideSearchPage />
              </Route>

              {/* ========== ROTAS DE HOTÉIS ========== */}
              <Route path="/hotels/search">
                <HotelsSearchPage />
              </Route>
              
              <Route path="/hotels/:id">
                {(params) => <HotelDetailsPage key={params.id} />}
              </Route>
              
              <Route path="/hotels/:id/book">
                {(params) => <HotelBookingPage key={params.id} />}
              </Route>

              {/* ========== ROTAS DE EVENT SPACES ========== */}
              <Route path="/event-spaces/search">
                <EventSpacesSearchPage />
              </Route>
              
              <Route path="/event-spaces/:id">
                {(params) => <EventSpaceDetailsPage key={params.id} />}
              </Route>
              
              <Route path="/event-spaces/:id/book">
                {(params) => <EventSpaceBookingPage key={params.id} />}
              </Route>

              {/* ========== ✅ ROTA DE CONFIRMAÇÃO DE EVENTOS ========== */}
              {/* ESTA É A ROTA QUE ESTAVA FALTANDO! */}
              <Route path="/event-spaces/:id/booking-confirmation">
                {(params) => <BookingConfirmationPage key={params.id} />}
              </Route>

              {/* ========== ROTA DE CONFIRMAÇÃO DE HOTÉIS ========== */}
              <Route path="/bookings/:type/:bookingId/confirmation">
                {(params) => <BookingConfirmationPage key={params.bookingId} />}
              </Route>

              {/* ========== ROTA GENÉRICA DE CONFIRMAÇÃO (FALLBACK) ========== */}
              <Route path="/booking-confirmation">
                <BookingConfirmationPage />
              </Route>

              {/* ========== ROTAS PRINCIPAIS DO APP ========== */}
              <Route path="/" component={Home} />
              <Route path="/eventos" component={Events} />
              
              <Route path="/reservas">
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              </Route>
              
              <Route path="/fidelidade">
                <ProtectedRoute>
                  <Loyalty />
                </ProtectedRoute>
              </Route>
              
              <Route path="/chat">
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              </Route>
              
              <Route path="/notificacoes">
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              </Route>
              
              <Route path="/perfil">
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Route>

              {/* Rota 404 - SEMPRE por último */}
              <Route component={NotFound} />
            </Switch>
          </main>
          <MobileNavigation />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default MainApp;