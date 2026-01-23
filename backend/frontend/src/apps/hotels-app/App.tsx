// src/apps/hotels-app/App.tsx
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/shared/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveHotelProvider } from "@/contexts/ActiveHotelContext"; // ← Import adicionado
import HotelsHeader from "./components/HotelsHeader";
import HotelManagerDashboard from "./pages/hotel-management/HotelManagerDashboard";

const queryClient = new QueryClient();

export default function HotelsApp() {
  const [, setLocation] = useLocation();

  // Redirecionar /hotels para /hotels/manage
  if (window.location.pathname === "/hotels") {
    setLocation("/hotels/manage");
  }

  return (
    <ActiveHotelProvider>  {/* ← Envolve TODA a app */}
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <HotelsHeader />
          <main className="pb-20 md:pb-4">
            <Switch>
              <Route path="/hotels/manage" component={HotelManagerDashboard} />
              <Route component={HotelManagerDashboard} />
            </Switch>
          </main>
          <Toaster />
        </div>
      </QueryClientProvider>
    </ActiveHotelProvider>
  );
}