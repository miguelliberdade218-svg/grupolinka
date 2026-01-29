// src/apps/hotels-app/pages/hotel-management/HotelManagerDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter'; // ✅ ADICIONADO: Para navegação
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Loader2,
  AlertCircle,
  Building2,
  Plus,
  ChevronRight,
  DoorOpen,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  FileText, // ✅ ADICIONADO: Para ícone de reservas
} from 'lucide-react';
import { hotelService, HotelDashboard } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';
import RoomTypesManagement from '../../components/room-types/RoomTypesManagement';
import EventSpacesManagementModern from '../../components/event-spaces/EventSpacesManagementModern';
import CreateHotelForm from '../../components/CreateHotelForm';
import EditHotelForm from '../../components/EditHotelForm';
import { useActiveHotel } from '@/contexts/ActiveHotelContext';
import { Hotel as SharedHotel } from '@/shared/types/hotels';

/**
 * Dashboard principal do gerenciador de hotéis
 * Mostra estatísticas e permite gerenciar quartos, eventos, reservas e promoções
 */
const HotelManagerDashboard: React.FC = () => {
  const [location, navigate] = useLocation(); // ✅ ADICIONADO: Para navegação
  const { activeHotel, isLoading: contextLoading, refreshActiveHotel } = useActiveHotel();

  const [dashboard, setDashboard] = useState<HotelDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(false);
  const [myHotelsCount, setMyHotelsCount] = useState<number>(0);
  const { toast } = useToast();

  // 🔧 REFS PARA CONTROLE DE LOOP
  const hasLoadedDashboardRef = useRef(false);
  const previousHotelIdRef = useRef<string | null>(null);

  // Carrega número de hotéis do usuário (executa apenas uma vez)
  useEffect(() => {
    const loadMyHotelsCount = async () => {
      try {
        const response = await hotelService.getMyHotels();
        if (response.success) {
          setMyHotelsCount(response.count || response.data.length);
        }
      } catch (err) {
        console.error('Erro ao carregar hotéis:', err);
      }
    };

    loadMyHotelsCount();
  }, []);

  // Carrega/re-carrega dashboard quando o hotel ativo mudar
  useEffect(() => {
    // 🔧 CORREÇÃO: Verifica se o hotel REALMENTE mudou (comparando IDs)
    const currentHotelId = activeHotel?.id || null;
    
    // Se é o mesmo hotel (mesmo ID) e já carregamos, não recarrega
    if (currentHotelId === previousHotelIdRef.current && hasLoadedDashboardRef.current) {
      return;
    }

    console.log('🔄 Dashboard: Hotel REAL mudou para:', activeHotel?.name || 'nenhum');
    
    // Atualiza referências
    previousHotelIdRef.current = currentHotelId;
    hasLoadedDashboardRef.current = false;

    const loadDashboardData = async () => {
      if (!activeHotel?.id) {
        console.log('Nenhum hotel selecionado → limpando dashboard');
        setDashboard(null);
        setLoadingDashboard(false);
        return;
      }

      // 🔧 CORREÇÃO: Marca que está carregando para evitar múltiplas chamadas
      hasLoadedDashboardRef.current = true;
      setLoadingDashboard(true);
      setError(null);

      try {
        console.log('📡 Carregando dashboard para hotel ID:', activeHotel.id);
        const response = await hotelService.getHotelDashboard(activeHotel.id);

        if (response.success && response.data) {
          setDashboard(response.data);
          console.log('✅ Dashboard carregado com sucesso');
        } else {
          setError(response.error || 'Erro ao carregar dados do dashboard');
          setDashboard(null);
        }
      } catch (err) {
        setError('Erro ao carregar dashboard');
        console.error('Erro no loadDashboard:', err);
      } finally {
        setLoadingDashboard(false);
      }
    };

    loadDashboardData();
  }, [activeHotel?.id]);

  // Listener para mudanças no localStorage (caso mude em outra aba)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeHotelId') {
        console.log('LocalStorage mudou → recarregando hotel ativo');
        refreshActiveHotel();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshActiveHotel]);

  const handleCreateHotel = () => {
    setShowCreateForm(true);
  };

  const handleCreateHotelSuccess = (newHotelId: string) => {
    setShowCreateForm(false);
    toast({
      title: 'Hotel criado com sucesso!',
      description: 'Agora você pode selecioná-lo manualmente no selector acima.',
    });
    console.log('✅ Novo hotel criado (seleção manual):', newHotelId);
  };

  // Função para editar hotel
  const handleEditHotel = () => {
    if (!activeHotel) {
      toast({
        title: 'Nenhum hotel selecionado',
        description: 'Selecione um hotel antes de editar.',
        variant: 'destructive',
      });
      return;
    }
    setEditingHotel(true);
  };

  // Função chamada quando a edição é bem-sucedida
  const handleEditSuccess = (updatedHotel: SharedHotel) => {
    setEditingHotel(false);
    
    toast({
      title: 'Hotel atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
    
    // 🔧 CORREÇÃO: Reseta as flags de carregamento para permitir recarga se necessário
    hasLoadedDashboardRef.current = false;
    previousHotelIdRef.current = null;
    
    // Atualiza o hotel no contexto após um pequeno delay
    setTimeout(() => {
      refreshActiveHotel();
    }, 500);
  };

  // ✅ NOVAS FUNÇÕES DE NAVEGAÇÃO
  const handleNavigateToBookings = () => {
    navigate('/hotels/events/bookings');
  };

  const handleNavigateToEventsDashboard = () => {
    navigate('/hotels/events/dashboard');
  };

  // Formulário de edição - deve vir ANTES dos outros returns
  if (editingHotel && activeHotel) {
    return (
      <EditHotelForm
        hotel={activeHotel}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingHotel(false)}
      />
    );
  }

  // Loading do contexto (hotel ativo carregando)
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando hotel ativo...</p>
        </div>
      </div>
    );
  }

  // Loading do dashboard
  if (loadingDashboard && activeHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard de {activeHotel.name}...</p>
        </div>
      </div>
    );
  }

  // Sem hotel selecionado
  if (!activeHotel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 shadow-lg border-0">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark mb-2">Bem-vindo à Gestão de Hotéis</h2>
              <p className="text-muted-foreground">
                Selecione um hotel existente no menu superior ou crie um novo para começar.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleCreateHotel}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Meu Primeiro Hotel
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-muted-foreground text-center mb-4">
                📚 Dicas rápidas:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Use o selector no topo para trocar de hotel</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Crie quartos e espaços para começar a receber reservas</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Formulário de criação de hotel
  if (showCreateForm) {
    return (
      <CreateHotelForm
        onSuccess={handleCreateHotelSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  // Dashboard completo com hotel selecionado
  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header com nome do hotel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {activeHotel.name}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                {activeHotel.address || activeHotel.locality || 'Sem endereço cadastrado'}
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                  {activeHotel.locality}, {activeHotel.province}
                </span>
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {myHotelsCount} {myHotelsCount === 1 ? 'hotel disponível' : 'hotéis disponíveis'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de editar hotel */}
          <Button
            onClick={handleEditHotel}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Editar Hotel
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-muted-foreground mb-1">Total Reservas</p>
          <p className="text-3xl font-bold text-blue-700">{dashboard?.total_bookings || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">até agora</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-muted-foreground mb-1">Próximas Reservas</p>
          <p className="text-3xl font-bold text-green-700">{dashboard?.upcoming_bookings || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">próximos 30 dias</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
          <p className="text-3xl font-bold text-purple-700">
            {dashboard?.total_revenue 
              ? `${parseFloat(dashboard.total_revenue).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`
              : '0 MZN'
            }
          </p>
          <p className="text-xs text-muted-foreground mt-2">acumulado</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-muted-foreground mb-1">Taxa Ocupação</p>
          <p className="text-3xl font-bold text-orange-700">
            {dashboard?.occupancy_rate ? `${Math.round(dashboard.occupancy_rate)}%` : '0%'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">média geral</p>
        </Card>
      </div>

      {/* ✅ Ações rápidas MODIFICADAS - Adicionado botões de navegação */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setActiveTab('rooms')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Quarto
          </Button>

          <Button
            onClick={() => setActiveTab('spaces')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Espaço
          </Button>

          {/* ✅ NOVO: Botão para Dashboard de Eventos */}
          <Button
            onClick={handleNavigateToEventsDashboard}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Dashboard Eventos
          </Button>

          {/* ✅ NOVO: Botão para Gestão de Reservas */}
          <Button
            onClick={handleNavigateToBookings}
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver Reservas
          </Button>

          {/* Botão original de disponibilidade mantido */}
          <Button
            onClick={() => toast({ 
              title: 'Disponibilidade', 
              description: 'Use o gerenciador de quartos por enquanto.', 
              variant: 'default' 
            })}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Gerenciar Disponibilidade
          </Button>
        </div>
      </Card>

      {/* Tabs principais */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <DoorOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Quartos</span>
            </TabsTrigger>
            <TabsTrigger value="spaces" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6">
              <h3 className="font-semibold text-dark mb-3">
                Bem-vindo ao {activeHotel.name}
              </h3>
              <p className="text-muted-foreground mb-4">
                Aqui você gerencia quartos, espaços de eventos, reservas, promoções e avaliações.
              </p>
              
              {/* ✅ NOVO: Cards de navegação rápida no overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card className="p-4 border border-green-200 hover:border-green-400 transition-colors cursor-pointer" 
                      onClick={handleNavigateToEventsDashboard}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Dashboard de Eventos</h4>
                      <p className="text-sm text-gray-600">Veja estatísticas e reservas de eventos</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer" 
                      onClick={handleNavigateToBookings}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Gestão de Reservas</h4>
                      <p className="text-sm text-gray-600">Gerencie todas as reservas e pagamentos</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rooms">
            <RoomTypesManagement hotelId={activeHotel.id} />
          </TabsContent>

          <TabsContent value="spaces">
            <EventSpacesManagementModern hotelId={activeHotel.id} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Gestão de Reviews</h3>
              <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default HotelManagerDashboard;