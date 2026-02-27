import { Route, Switch } from "wouter";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout
import AdminLayout from "./pages/layout";

// Pages - Dashboard e Gestão Base
import AdminDashboard from "./pages/dashboard-new";
import AdminUsers from "./pages/users-new";
import AdminCapabilities from "./pages/capabilities";
import AdminHotels from "./pages/hotels";
import AdminComplaints from "./pages/complaints";
import AdminPayments from "./pages/payments";
import AdminFees from "./pages/fees";
import AdminAudit from "./pages/audit";
import AdminReports from "./pages/reports-new";
import UserDocuments from "./pages/user-documents";

// Legacy Pages (mantidos para compatibilidade)
import BillingManagement from "./pages/billing-management";

// ✅ EMERGÊNCIA: Usar guard de emergência
import AdminRouteGuardEmergency from "@/shared/components/AdminRouteGuardEmergency";

const queryClient = new QueryClient();

export default function AdminApp() {
  return (
    <AdminRouteGuardEmergency>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <AdminLayout>
            <Switch>
              {/* Dashboard principal de admin */}
              <Route path="/admin" component={AdminDashboard} />

              {/* Gestão de utilizadores da plataforma */}
              <Route path="/admin/users" component={AdminUsers} />

              {/* Documentos de Usuários */}
              <Route path="/admin/documents" component={UserDocuments} />

              {/* Fila de verificações */}
              <Route path="/admin/capabilities" component={AdminCapabilities} />

              {/* Gestão de hotéis (admin) */}
              <Route path="/admin/hotels" component={AdminHotels} />

              {/* Gestão de reclamações */}
              <Route path="/admin/complaints" component={AdminComplaints} />

              {/* Relatórios e Estatísticas */}
              <Route path="/admin/reports" component={AdminReports} />

              {/* Gestão de pagamentos */}
              <Route path="/admin/payments" component={AdminPayments} />

              {/* Gestão de taxas */}
              <Route path="/admin/fees" component={AdminFees} />

              {/* Log de auditoria */}
              <Route path="/admin/audit" component={AdminAudit} />

              {/* Gestão de faturação (legacy) */}
              <Route path="/admin/billing" component={BillingManagement} />

              {/* Rota padrão */}
              <Route component={AdminDashboard} />
            </Switch>
          </AdminLayout>
        </div>

        <SonnerToaster
          richColors
          position="top-center"
          duration={10000}
          expand={true}
          visibleToasts={3}
          closeButton
          toastOptions={{
            className: "text-lg",
            descriptionClassName: "text-base",
          }}
        />

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </QueryClientProvider>
    </AdminRouteGuardEmergency>
  );
}