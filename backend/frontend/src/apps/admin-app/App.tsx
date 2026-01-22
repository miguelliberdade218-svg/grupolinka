import { Route, Switch } from "wouter";
import { Toaster } from "@/shared/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminHeader from "@/shared/admin/components/AdminHeader";
import AdminMobileNav from "@/shared/admin/components/AdminMobileNav";
import Dashboard from "@/shared/admin/pages/dashboard";
import Users from "@/shared/admin/pages/users";
import BillingManagement from "./pages/billing-management";

const queryClient = new QueryClient();

/**
 * ⚠️ ADMIN APP - APENAS para administradores da plataforma
 * 
 * IMPORTANTE: Este app é EXCLUSIVO para gerenciamento de:
 * - Utilizadores da plataforma
 * - Dashboard de admin
 * - Gestão de faturação
 * 
 * ❌ NÃO DEVE ter gerenciamento de hotéis aqui!
 * ✅ Gerenciamento de hotéis está em: /hotels/* (hotels-app)
 */
export default function AdminApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <main className="pb-20 md:pb-4">
          <Switch>
            {/* Dashboard principal de admin */}
            <Route path="/admin" component={Dashboard} />
            
            {/* Gestão de utilizadores da plataforma */}
            <Route path="/admin/users" component={Users} />
            
            {/* Gestão de faturação */}
            <Route path="/admin/billing" component={BillingManagement} />
            
            {/* Rota padrão */}
            <Route component={Dashboard} />
          </Switch>
        </main>
        
        <AdminMobileNav />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}