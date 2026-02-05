// src/AppRouter.tsx - VERSÃO CORRIGIDA E SIMPLIFICADA
import { Route, Switch } from 'wouter';
import SearchRides from './apps/main-app/pages/Rides/search';
import MainApp from './apps/main-app/App';
import DriversApp from './apps/drivers-app/App';
import HotelsApp from './apps/hotels-app/App';
import AdminApp from './apps/admin-app/App';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import NotFoundPage from './pages/not-found';

function AppRouter() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      
      {/* Rota de busca de viagens */}
      <Route path="/rides/search" component={SearchRides} />
      
      {/* 🏨 BUSCA PÚBLICA DE HOTÉIS - PARA CLIENTES */}
      <Route path="/hotels/search">
        {(params) => <MainApp />}
      </Route>
      
      {/* 🎪 BUSCA PÚBLICA DE ESPAÇOS DE EVENTOS - PARA CLIENTES */}
      <Route path="/event-spaces/search">
        {(params) => <MainApp />}
      </Route>
      
      {/* Apps - IMPORTANTE: Ordem importa! Mais específicas primeiro */}
      
      {/* 🏨 HOTELS APP - Para gerentes de hotéis gerenciar suas propriedades */}
      <Route path="/hotels/*" component={HotelsApp} />
      <Route path="/hotels" component={HotelsApp} />
      
      {/* 👨‍💼 DRIVERS APP - Para motoristas gerenciar viagens */}
      <Route path="/drivers/*" component={DriversApp} />
      <Route path="/drivers" component={DriversApp} />
      
      {/* 🔐 ADMIN APP - APENAS para admins da plataforma (NÃO hotéis!) */}
      <Route path="/admin/*" component={AdminApp} />
      <Route path="/admin" component={AdminApp} />
      
      {/* Rota principal - captura tudo o resto */}
      <Route path="/:rest*" component={MainApp} />
      <Route path="/" component={MainApp} />
      
      {/* 404 */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default AppRouter;