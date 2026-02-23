import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/shared/components/ui/toaster';
import AppRouter from './AppRouter';

// Criar query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      {/* ❌ REMOVIDO: Toaster está sendo renderizado nos apps específicos */}
    </QueryClientProvider>
  );
}

export default App;