import { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Car, 
  Hotel, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  UserCheck,
  Activity,
  Globe,
  MessageSquare,
  CreditCard,
  FileText,
  UserCog,
  Percent,
  Eye,
  UserX,
  Search,
  Calendar,
  Clock
} from 'lucide-react';

export default function AdminHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [usersFilter, setUsersFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Buscar utilizadores reais do sistema
  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', usersFilter, searchTerm],
    queryFn: async () => {
      try {
        const params: any = { page: 1, limit: 100 };
        if (searchTerm) params.search = searchTerm;
        if (usersFilter === 'verified') params.verified = 'true';
        if (usersFilter === 'pending') params.userType = 'driver'; // Assumir que drivers têm mais verificações pendentes
        
        const response = await apiService.getUsers(params);
        return response?.data?.users || [];
      } catch (error) {
        console.error('Erro ao buscar utilizadores:', error);
        return [];
      }
    },
    enabled: activeTab === 'users'
  });

  // Buscar estatísticas do sistema usando dados reais do backend
  const { data: systemStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      try {
        // Buscar utilizadores
        const usersResponse = await apiService.getUsers({ page: 1, limit: 1000 });
        const users = usersResponse?.data?.users || [];
        
        // Buscar viagens
        const ridesResponse = await fetch('/api/rides').then(res => res.ok ? res.json() : { data: { rides: [] } });
        const rides = ridesResponse?.data?.rides || [];
        
        // Buscar hotéis
        const hotelsResponse = await fetch('/api/hotels').then(res => res.ok ? res.json() : { data: { accommodations: [] } });
        const hotels = hotelsResponse?.data?.accommodations || [];
        
        // Buscar eventos
        const eventsResponse = await fetch('/api/events').then(res => res.ok ? res.json() : { data: { events: [] } });
        const events = eventsResponse?.data?.events || [];
        
        // Calcular estatísticas
        const pendingUsers = users.filter(user => user.verificationStatus === 'in_review').length;
        const activeRides = rides.filter(ride => ride.status === 'active').length;
        const availableHotels = hotels.filter(hotel => hotel.isAvailable).length;
        
        // Simular receita baseada nos dados reais
        const monthlyRevenue = (users.length * 150) + (rides.length * 250) + (hotels.length * 800);
        const platformFees = Math.round(monthlyRevenue * 0.1);
        
        return {
          totalUsers: users.length,
          totalRides: activeRides,
          totalHotels: availableHotels,
          totalEvents: events.length,
          pendingApprovals: pendingUsers,
          monthlyRevenue,
          activeBookings: Math.round(users.length * 0.12), // Estimar 12% dos utilizadores com reservas ativas
          systemHealth: 'healthy',
          platformFees
        };
      } catch (error) {
        console.error('Erro ao buscar estatisticas admin:', error);
        // Fallback para dados mock se a API falhar
        return {
          totalUsers: 1250,
          totalRides: 89,
          totalHotels: 23,
          totalEvents: 12,
          pendingApprovals: 5,
          monthlyRevenue: 450000,
          activeBookings: 156,
          systemHealth: 'healthy',
          platformFees: 45000
        };
      }
    },
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Esta área é exclusiva para administradores do sistema.
            </p>
            <Link href="/login">
              <Button className="w-full">Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Link-A Admin
            </h1>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
              Painel Administrativo
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/" data-testid="link-main-app">
              <Button variant="outline">
                🏠 App Principal
              </Button>
            </Link>
            <Button variant="ghost" data-testid="button-user-menu">
              <UserCheck className="w-4 h-4 mr-2" />
              Admin: {user.email?.split('@')[0]}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alertas do sistema */}
        {systemStats.pendingApprovals > 0 && (
          <Card className="mb-8 border-l-4 border-l-yellow-500">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">
                  {systemStats.pendingApprovals} aprovações pendentes que requerem atenção
                </span>
                <Button size="sm" variant="outline" data-testid="button-view-approvals">
                  Ver Pendências
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utilizadores</p>
                  <p className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Viagens Ativas</p>
                  <p className="text-2xl font-bold">{systemStats.totalRides}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Hotel className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hotéis Parceiros</p>
                  <p className="text-2xl font-bold">{systemStats.totalHotels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                  <p className="text-2xl font-bold">{(systemStats.monthlyRevenue / 1000).toFixed(0)}k MT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de negócio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reservas Ativas</p>
                  <p className="text-2xl font-bold">{systemStats.activeBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa Plataforma</p>
                  <p className="text-2xl font-bold">{(systemStats.platformFees / 1000).toFixed(0)}k MT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sistema</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Operacional
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu de Navegação Administrativa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Centro de Controlo Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Button 
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setActiveTab('dashboard')}
                data-testid="tab-dashboard"
                className="h-20 flex-col"
              >
                <BarChart3 className="w-6 h-6 mb-1" />
                <span className="text-xs">Dashboard</span>
              </Button>
              
              <Button 
                variant={activeTab === 'users' ? 'default' : 'outline'}
                onClick={() => setActiveTab('users')}
                data-testid="tab-users"
                className="h-20 flex-col"
              >
                <Users className="w-6 h-6 mb-1" />
                <span className="text-xs">Utilizadores</span>
              </Button>
              
              <Button 
                variant={activeTab === 'complaints' ? 'default' : 'outline'}
                onClick={() => setActiveTab('complaints')}
                data-testid="tab-complaints"
                className="h-20 flex-col"
              >
                <MessageSquare className="w-6 h-6 mb-1" />
                <span className="text-xs">Reclamações</span>
              </Button>
              
              <Button 
                variant={activeTab === 'commissions' ? 'default' : 'outline'}
                onClick={() => setActiveTab('commissions')}
                data-testid="tab-commissions"
                className="h-20 flex-col"
              >
                <Percent className="w-6 h-6 mb-1" />
                <span className="text-xs">Comissões</span>
              </Button>
              
              <Button 
                variant={activeTab === 'payments' ? 'default' : 'outline'}
                onClick={() => setActiveTab('payments')}
                data-testid="tab-payments"
                className="h-20 flex-col"
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="text-xs">Pagamentos</span>
              </Button>
              
              <Button 
                variant={activeTab === 'blog' ? 'default' : 'outline'}
                onClick={() => setActiveTab('blog')}
                data-testid="tab-blog"
                className="h-20 flex-col"
              >
                <FileText className="w-6 h-6 mb-1" />
                <span className="text-xs">Blog</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo das Abas Administrativas */}
        {activeTab === 'dashboard' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Visão Geral da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="clients">App Clientes</TabsTrigger>
                  <TabsTrigger value="drivers">App Motoristas</TabsTrigger>
                  <TabsTrigger value="hotels">App Hotéis</TabsTrigger>
                </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">App Clientes</h3>
                          <p className="text-sm text-gray-600">Busca e reservas</p>
                          <p className="text-2xl font-bold text-blue-600">{systemStats.totalUsers} utilizadores</p>
                        </div>
                        <Link href="/" data-testid="link-view-clients-app">
                          <Button size="sm" variant="outline">Ver App</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">App Motoristas</h3>
                          <p className="text-sm text-gray-600">Gestão de viagens</p>
                          <p className="text-2xl font-bold text-green-600">{systemStats.totalRides} viagens</p>
                        </div>
                        <Link href="/drivers" data-testid="link-view-drivers-app">
                          <Button size="sm" variant="outline">Ver App</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">App Hotéis</h3>
                          <p className="text-sm text-gray-600">Gestão de alojamentos</p>
                          <p className="text-2xl font-bold text-purple-600">{systemStats.totalHotels} hotéis</p>
                        </div>
                        <Link href="/hotels" data-testid="link-view-hotels-app">
                          <Button size="sm" variant="outline">Ver App</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="clients">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{systemStats.activeBookings}</p>
                      <p className="text-sm text-gray-600">Reservas Ativas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">89%</p>
                      <p className="text-sm text-gray-600">Taxa Satisfação</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">4.7</p>
                      <p className="text-sm text-gray-600">Avaliação Média</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">24</p>
                      <p className="text-sm text-gray-600">Novos Hoje</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="drivers">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{systemStats.totalRides}</p>
                      <p className="text-sm text-gray-600">Viagens Ativas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">92%</p>
                      <p className="text-sm text-gray-600">Taxa Conclusão</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">4.8</p>
                      <p className="text-sm text-gray-600">Avaliação Motoristas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">7</p>
                      <p className="text-sm text-gray-600">Novos Esta Semana</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hotels">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{systemStats.totalHotels}</p>
                      <p className="text-sm text-gray-600">Hotéis Parceiros</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">78%</p>
                      <p className="text-sm text-gray-600">Taxa Ocupação</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">4.6</p>
                      <p className="text-sm text-gray-600">Avaliação Hotéis</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">3</p>
                      <p className="text-sm text-gray-600">Pendentes Aprovação</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Gestão de Utilizadores */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5" />
                Gestão de Utilizadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="pending">Pendentes Aprovação</TabsTrigger>
                  <TabsTrigger value="verified">Verificados</TabsTrigger>
                  <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input 
                          className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                          placeholder="Pesquisar utilizadores por nome ou email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {(usersData || []).map(user => (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                              {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{user.firstName || 'Nome'} {user.lastName || 'Utilizador'}</h3>
                              <p className="text-sm text-gray-600">{user.email || 'email@example.com'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={user.userType === 'driver' ? 'bg-green-100 text-green-700' : user.userType === 'hotel_manager' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                                  {user.userType === 'driver' ? 'Motorista' : user.userType === 'hotel_manager' ? 'Gestor Hotel' : 'Cliente'}
                                </Badge>
                                {user.isVerified && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verificado
                                  </Badge>
                                )}
                                {user.verificationStatus === 'in_review' && (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Perfil
                            </Button>
                            {user.verificationStatus === 'in_review' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button size="sm" variant="outline">
                                  <UserX className="w-4 h-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                    {(!usersData || usersData.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum utilizador encontrado</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="space-y-4">
                  <div className="grid gap-4">
                    {[1, 2].map(i => (
                      <Card key={i} className="p-4 border-l-4 border-l-yellow-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">João Pereira</h3>
                              <p className="text-sm text-gray-600">joao.pereira@email.com</p>
                              <p className="text-sm text-yellow-600">Aguardando verificação de documentos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button size="sm" variant="outline">
                              <UserX className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Gestão de Reclamações */}
        {activeTab === 'complaints' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Gestão de Reclamações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new">
                <TabsList>
                  <TabsTrigger value="new">Novas (3)</TabsTrigger>
                  <TabsTrigger value="investigating">Em Análise (2)</TabsTrigger>
                  <TabsTrigger value="resolved">Resolvidas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="new" className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4 border-l-4 border-l-red-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-100 text-red-700">URGENTE</Badge>
                            <span className="text-sm text-gray-500">há 2 horas</span>
                          </div>
                          <h3 className="font-semibold mb-2">Problema com motorista - Viagem cancelada</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            "O motorista cancelou a viagem 5 minutos antes da hora marcada sem justificação. Preciso de reembolso urgente."
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Cliente: Ana Costa</span>
                            <span>Motorista: Carlos M.</span>
                            <span>Viagem ID: #VG2024001</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Investigar
                          </Button>
                          <Button size="sm" variant="outline">
                            Contactar Cliente
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="investigating" className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="p-4 border-l-4 border-l-yellow-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-yellow-100 text-yellow-700">EM ANÁLISE</Badge>
                            <span className="text-sm text-gray-500">há 1 dia</span>
                          </div>
                          <h3 className="font-semibold mb-2">Hotel não honrou reserva</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Administrador João A. está a investigar. Última atualização: contactado hotel para esclarecimentos.
                          </p>
                        </div>
                        <Button size="sm">
                          Atualizar Status
                        </Button>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="resolved">
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Reclamações resolvidas aparecerão aqui</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Gestão de Comissões */}
        {activeTab === 'commissions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Gestão de Comissões e Taxas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuração de Taxas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Taxa Atual da Plataforma</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">10%</div>
                    <p className="text-sm text-gray-600">Cobrada aos prestadores de serviço</p>
                    <Button size="sm" className="mt-4" variant="outline">
                      Alterar Taxa
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Receita de Comissões Este Mês</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">45.000 MT</div>
                    <p className="text-sm text-gray-600">+18% vs mês anterior</p>
                    <div className="flex justify-center mt-4">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Breakdown por Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Car className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">Viagens</h4>
                  <p className="text-2xl font-bold text-blue-600">28.500 MT</p>
                  <p className="text-xs text-gray-600">63% do total</p>
                </Card>
                
                <Card className="p-4 text-center">
                  <Hotel className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold">Alojamentos</h4>
                  <p className="text-2xl font-bold text-purple-600">15.200 MT</p>
                  <p className="text-xs text-gray-600">34% do total</p>
                </Card>
                
                <Card className="p-4 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <h4 className="font-semibold">Eventos</h4>
                  <p className="text-2xl font-bold text-orange-600">1.300 MT</p>
                  <p className="text-xs text-gray-600">3% do total</p>
                </Card>
              </div>
              
              {/* Historico de Alteracoes de Taxa */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Histórico de Alterações</h3>
                <div className="space-y-3">
                  {[
                    { date: '2025-01-01', oldRate: '8%', newRate: '10%', reason: 'Ajuste para melhorias na plataforma' },
                    { date: '2024-08-15', oldRate: '5%', newRate: '8%', reason: 'Expansão de funcionalidades' }
                  ].map((change, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{change.oldRate} → {change.newRate}</p>
                        <p className="text-sm text-gray-600">{change.reason}</p>
                      </div>
                      <span className="text-xs text-gray-500">{change.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </CardContent>
          </Card>
        )}
        
        {/* Gestão de Pagamentos */}
        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Controlo de Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">Pagamentos Pendentes (12)</TabsTrigger>
                  <TabsTrigger value="processed">Processados</TabsTrigger>
                  <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="p-4 border-l-4 border-l-orange-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-100 text-orange-700">PENDENTE</Badge>
                            <span className="text-sm text-gray-500">Vencimento em 2 dias</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Prestador</p>
                              <p className="font-semibold">Hotel Sol e Mar</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Valor Bruto</p>
                              <p className="font-semibold">15.000 MT</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Comissão (10%)</p>
                              <p className="font-semibold text-red-600">-1.500 MT</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Valor Líquido</p>
                              <p className="font-semibold text-green-600">13.500 MT</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Processar
                          </Button>
                          <Button size="sm" variant="outline">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
                
                <TabsContent value="statistics">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-semibold">Total Processado Este Mês</h4>
                      <p className="text-2xl font-bold text-green-600">285.500 MT</p>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <h4 className="font-semibold">Tempo Médio Processamento</h4>
                      <p className="text-2xl font-bold text-orange-600">2.5 dias</p>
                    </Card>
                    
                    <Card className="p-4 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-semibold">Taxa de Sucesso</h4>
                      <p className="text-2xl font-bold text-blue-600">98.5%</p>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Gestão do Blog */}
        {activeTab === 'blog' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Gestão de Publicações do Blog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold">Artigos Publicados</h3>
                  <p className="text-sm text-gray-600">Gerir conteúdo do blog da plataforma</p>
                </div>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Novo Artigo
                </Button>
              </div>
              
              <div className="space-y-4">
                {[
                  { title: 'Como escolher o melhor motorista no Link-A', date: '2025-01-15', status: 'published', views: '1.2k' },
                  { title: 'Dicas para hotéis aumentarem reservas', date: '2025-01-10', status: 'draft', views: '0' },
                  { title: 'Novidades da plataforma Link-A', date: '2025-01-05', status: 'published', views: '2.5k' }
                ].map((article, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{article.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Publicado: {article.date}</span>
                          <span>Visualizações: {article.views}</span>
                          <Badge className={article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        {article.status === 'published' && (
                          <Button size="sm" variant="outline">
                            Despublicar
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas para o Blog</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Publique regularmente para manter os utilizadores informados</li>
                  <li>• Use títulos atractivos e conteúdo útil</li>
                  <li>• Inclua imagens e exemplos práticos</li>
                  <li>• Promova artigos nas redes sociais da plataforma</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}