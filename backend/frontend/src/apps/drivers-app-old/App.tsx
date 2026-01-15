import { Switch, Route } from 'wouter';
import { queryClient } from '@/shared/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/shared/components/ui/toaster';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import Header from '@/shared/components/Header';
import Dashboard from './pages/dashboard';
import Partnerships from './pages/partnerships';
import HostPartnerships from './pages/host-partnerships';
import CreateEvent from './pages/create-event';
import RoleProtectedRoute from '@/shared/components/RoleProtectedRoute';
import NotFound from '@/pages/not-found';

function ProviderApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Switch>
              <Route path="/provider">
                <RoleProtectedRoute requiredRoles={['driver', 'hotel_manager', 'admin']}>
                  <Dashboard />
                </RoleProtectedRoute>
              </Route>
              <Route path="/provider/parcerias">
                <RoleProtectedRoute requiredRoles={['driver', 'admin']}>
                  <Partnerships />
                </RoleProtectedRoute>
              </Route>
              <Route path="/provider/hospedagem">
                <RoleProtectedRoute requiredRoles={['hotel_manager', 'admin']}>
                  <HostPartnerships />
                </RoleProtectedRoute>
              </Route>
              <Route path="/provider/criar-evento">
                <RoleProtectedRoute requiredRoles={['admin']}>
                  <CreateEvent />
                </RoleProtectedRoute>
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default ProviderApp;