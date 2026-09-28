import { Route, Switch } from "wouter";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DriversHeader from "./components/DriversHeader";
import DriversMobileNav from "./components/DriversMobileNav";
import { DriversSidebar } from "./components/DriversSidebar";
import NotFound from "./pages/not-found";
import DriversHome from "./pages/home";
import RoutePublisher from "./pages/route-publisher";
import Partnerships from "./pages/partnerships";
import Chat from "./pages/chat";
// ✅ ADICIONAR IMPORT DA PÁGINA DE VEÍCULOS
import VehiclesPage from "./pages/vehicles";
// ✅ ADICIONAR IMPORT DA PÁGINA DE PAGAMENTOS/COMISSÕES
import ProviderPaymentsDashboard from "../provider-app/pages/payments";
// ✅ ADICIONADO: AppGuard para verificar capacidades
import { DriversAppGuard } from "./components/AppGuard";
import RidesManagement from "./pages/rides-management";
import DriverCommissions from "./pages/commissions";
import DriverEarnings from "./pages/earnings";
import DriverReviews from "./pages/reviews";

const queryClient = new QueryClient();

export default function DriversApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <DriversAppGuard>
        <div className="min-h-screen bg-gray-50 flex">
          {/* Sidebar - Desktop only, mobile via toggle */}
          <DriversSidebar />
          
          <div className="flex-1 flex flex-col">
            {/* Header - Hidden on Desktop when using Sidebar */}
            <div className="hidden md:block">
              <DriversHeader />
            </div>
            
            <main className="pb-20 md:pb-0 flex-1">
              <Switch>
                <Route path="/drivers" component={DriversHome} />
                <Route path="/drivers/publish" component={RoutePublisher} />
                <Route path="/drivers/partnerships" component={Partnerships} />
                <Route path="/drivers/chat" component={Chat} />
                {/* ✅ ADICIONAR ROTA DE VEÍCULOS */}
                <Route path="/drivers/vehicles" component={VehiclesPage} />
                {/* ✅ ADICIONAR ROTA DE PAGAMENTOS/COMISSÕES */}
                <Route path="/drivers/payments" component={ProviderPaymentsDashboard} />
                {/* ✅ ROTA DE GESTÃO DE VIAGENS */}
                <Route path="/drivers/rides" component={RidesManagement} />
                {/* ✅ ROTA DE COMISSÕES */}
                <Route path="/drivers/commissions" component={DriverCommissions} />
                <Route path="/drivers/earnings" component={DriverEarnings} />
                <Route path="/drivers/reviews" component={DriverReviews} />
                <Route component={NotFound} />
              </Switch>
            </main>
            
            {/* Mobile Navigation */}
            <DriversMobileNav />
          </div>
          
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
      </DriversAppGuard>
    </QueryClientProvider>
  );
}