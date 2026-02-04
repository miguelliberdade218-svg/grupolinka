// src/apps/hotels-app/pages/hotel-management/HotelManagerDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
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
  FileText,
  RefreshCw,
} from 'lucide-react';
import { hotelService, HotelDashboard } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';
import RoomTypesManagement from '../../components/room-types/RoomTypesManagement';
import EventSpacesManagementModern from '../../components/event-spaces/EventSpacesManagementModern';
import CreateHotelForm from '../../components/CreateHotelForm';
import EditHotelForm from '../../components/EditHotelForm';
import { useActiveHotel } from '@/contexts/ActiveHotelContext';
import { Hotel as SharedHotel } from '@/shared/types/hotels';
import { auth } from '@/shared/lib/firebaseConfig';

/**
 * Dashboard principal do gerenciador de hotéis
 * Mostra estatísticas e permite gerenciar quartos, eventos, reservas e promoções
 */
const HotelManagerDashboard: React.FC = () => {
  const [location, navigate] = useLocation();
  const { activeHotel, isLoading: contextLoading, refreshActiveHotel } = useActiveHotel();

  const [dashboard, setDashboard] = useState<HotelDashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(false);
  const [myHotelsCount, setMyHotelsCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // 🔧 REFS PARA CONTROLE DE LOOP E DEBOUNCE
  const hasLoadedDashboardRef = useRef(false);
  const previousHotelIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const loadDashboardCallCountRef = useRef(0); // Para debug/controle
  const MAX_RETRIES = 3;

  // 🔧 CORREÇÃO: Debounce para evitar múltiplos carregamentos
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const dashboardLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 🔧 NOVO: Timeout de segurança

  // Carrega número de hotéis do usuário
  const loadMyHotelsCount = useCallback(async () => {
    try {
      const response = await hotelService.getMyHotels();
      if (response.success) {
        setMyHotelsCount(response.count || response.data.length);
      }
    } catch (err) {
      console.error('Erro ao carregar hotéis:', err);
    }
  }, []);

  // Carrega/re-carrega dashboard quando o hotel ativo mudar
  const loadDashboardData = useCallback(async () => {
    // 🔧 CORREÇÃO: Resetamos as flags de loading aqui para permitir nova chamada
    if (!activeHotel?.id) {
      console.log('❌ [Dashboard] Nenhum hotel selecionado → limpando dashboard');
      setDashboard(null);
      setLoadingDashboard(false);
      hasLoadedDashboardRef.current = false;
      return;
    }

    // 🔧 CORREÇÃO CRÍTICA: Se já carregamos este hotel específico, não recarrega
    if (activeHotel.id === previousHotelIdRef.current && hasLoadedDashboardRef.current) {
      console.log('⏭️ [Dashboard] Mesmo hotel já carregado, ignorando...');
      return;
    }

    // 🔧 CORREÇÃO: Se estamos no meio de um refresh, permite continuar
    if (loadingDashboard && !refreshing) {
      console.log('🔄 [Dashboard] Já está carregando, mas permitindo recarga...');
      // Continuamos mesmo assim, pois pode ser um refresh necessário
    }

    const callId = ++loadDashboardCallCountRef.current;
    console.log(`📡 [Dashboard] Carregando dashboard (call #${callId}) para hotel:`, {
      id: activeHotel.id,
      name: activeHotel.name,
      previousHotelId: previousHotelIdRef.current,
      hasLoaded: hasLoadedDashboardRef.current
    });

    // 🔧 CORREÇÃO: Marca que está carregando para evitar múltiplas chamadas
    hasLoadedDashboardRef.current = true;
    setLoadingDashboard(true);
    setError(null);

    try {
      const response = await hotelService.getHotelDashboard(activeHotel.id);

      if (response.success && response.data) {
        setDashboard(response.data);
        retryCountRef.current = 0; // Reset retries on success
        previousHotelIdRef.current = activeHotel.id; // 🔧 CORREÇÃO: Guarda o ID do hotel carregado
        console.log(`✅ [Dashboard] Carregado com sucesso (call #${callId}) para hotel: ${activeHotel.name}`);
      } else {
        // ✅ TRATAMENTO ESPECÍFICO PARA 403
        if (response.error?.includes('403') || response.error?.includes('Forbidden')) {
          const errorMsg = 'Você não tem permissão para acessar este hotel. Este hotel não pertence à sua conta.';
          setError(errorMsg);
          
          toast({
            title: 'Acesso negado',
            description: 'Este hotel não está associado à sua conta.',
            variant: 'destructive',
          });
          
          // 🔧 CORREÇÃO CRÍTICA: Limpa o hotel inválido
          localStorage.removeItem('activeHotelId');
          setDashboard(null);
          
          // Força recarga do hotel ativo após delay
          setTimeout(() => {
            refreshActiveHotel();
            loadMyHotelsCount();
          }, 1000);
          
        } else if (response.error?.includes('401') || response.error?.includes('Unauthorized')) {
          setError('Sessão expirada. Faça login novamente.');
          toast({
            title: 'Sessão expirada',
            description: 'Faça login novamente para continuar.',
            variant: 'destructive',
          });
        } else {
          // Tentar novamente se for erro temporário
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            console.log(`🔄 [Dashboard] Tentativa ${retryCountRef.current}/${MAX_RETRIES} (call #${callId})`);
            
            setTimeout(() => {
              loadDashboardData();
            }, 1000 * retryCountRef.current); // Backoff exponencial
          } else {
            setError(response.error || 'Erro ao carregar dados do dashboard');
            setDashboard(null);
          }
        }
      }
    } catch (err: any) {
      // ✅ CAPTURAR ERRO 403 ESPECIFICAMENTE
      if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        const errorMsg = 'Sem permissão para acessar este hotel';
        setError(errorMsg);
        toast({
          title: 'Permissão negada',
          description: 'Você não tem acesso a este hotel. Selecione um hotel da sua conta.',
          variant: 'destructive',
        });
        
        // 🔧 CORREÇÃO CRÍTICA: Limpa o hotel inválido
        localStorage.removeItem('activeHotelId');
        setDashboard(null);
        setTimeout(() => refreshActiveHotel(), 500);
        
      } else if (err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        setError('Erro de conexão. Verifique sua internet.');
      } else {
        setError('Erro ao carregar dashboard');
      }
      
      console.error(`❌ [Dashboard] Erro no loadDashboard (call #${callId}):`, {
        message: err.message,
        hotelId: activeHotel.id,
        hotelName: activeHotel.name
      });
      
      setDashboard(null);
    } finally {
      setLoadingDashboard(false);
      setRefreshing(false);
      
      // 🔧 CORREÇÃO: Timeout de segurança - se ainda estiver "carregando" após 10 segundos, força reset
      if (dashboardLoadTimeoutRef.current) {
        clearTimeout(dashboardLoadTimeoutRef.current);
      }
      
      dashboardLoadTimeoutRef.current = setTimeout(() => {
        if (loadingDashboard) {
          console.warn('⚠️ [Dashboard] Timeout de segurança - resetando estado de loading');
          setLoadingDashboard(false);
          hasLoadedDashboardRef.current = false;
        }
      }, 10000); // 10 segundos
    }
  }, [activeHotel, toast, refreshActiveHotel, loadMyHotelsCount, loadingDashboard, refreshing]);

  // 🔧 CORREÇÃO: Efeito principal para carregar dashboard com debounce
  useEffect(() => {
    // Limpa timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // 🔧 CORREÇÃO: Verifica se o hotel REALMENTE mudou (comparando IDs)
    const currentHotelId = activeHotel?.id || null;
    
    // 🔧 CORREÇÃO CRÍTICA: Reset das flags quando hotel muda
    if (currentHotelId !== previousHotelIdRef.current) {
      console.log('🔄 [Dashboard] Hotel mudou, resetando flags...');
      hasLoadedDashboardRef.current = false;
      retryCountRef.current = 0;
    }

    console.log('🔄 [Dashboard] Hotel mudou para:', activeHotel?.name || 'nenhum');
    
    // Atualiza referência do hotel anterior
    previousHotelIdRef.current = currentHotelId;

    // 🔧 CORREÇÃO: Debounce para evitar múltiplos carregamentos rápidos
    debounceTimeoutRef.current = setTimeout(() => {
      loadDashboardData();
    }, 300); // 300ms debounce

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeHotel?.id, loadDashboardData]);

  // Carrega contagem de hotéis no início
  useEffect(() => {
    loadMyHotelsCount();
  }, [loadMyHotelsCount]);

  // 🔧 CORREÇÃO: Listener para mudanças no localStorage (com controle de origem)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeHotelId') {
        // 🔧 CORREÇÃO CRÍTICA: Ignora eventos da mesma origem/aba
        const isSameOrigin = e.url === window.location.href;
        if (isSameOrigin) {
          console.log('🔄 [Dashboard] Storage mudado por esta aba, ignorando...');
          return;
        }
        
        console.log('📱 [Dashboard] Storage mudou (outra aba), aguardando debounce...');
        
        // Limpa timeout anterior
        if (storageDebounceRef.current) {
          clearTimeout(storageDebounceRef.current);
        }
        
        // Debounce para evitar múltiplas chamadas
        storageDebounceRef.current = setTimeout(() => {
          console.log('🔄 [Dashboard] Recarregando após mudança no storage...');
          refreshActiveHotel();
          loadMyHotelsCount();
        }, 500);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (storageDebounceRef.current) {
        clearTimeout(storageDebounceRef.current);
      }
      if (dashboardLoadTimeoutRef.current) {
        clearTimeout(dashboardLoadTimeoutRef.current);
      }
    };
  }, [refreshActiveHotel, loadMyHotelsCount]);

  const handleCreateHotel = () => {
    console.log('🟢 [Dashboard] Botão "Criar Meu Primeiro Hotel" clicado!');
    setShowCreateForm(true);
  };

  const handleCreateHotelSuccess = (newHotelId: string) => {
    setShowCreateForm(false);
    toast({
      title: 'Hotel criado com sucesso!',
      description: 'Redirecionando para o dashboard...',
    });
    
    console.log('✅ [Dashboard] Novo hotel criado:', newHotelId);
    
    // 🔧 CORREÇÃO: Navegação mais simples para evitar loops
    setTimeout(() => {
      // 1. Define o hotel no localStorage
      localStorage.setItem('activeHotelId', newHotelId);
      
      // 2. Recarrega a página para forçar contexto atualizar
      window.location.reload();
    }, 1500);
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
    
    // 🔧 CORREÇÃO: Reseta as flags de carregamento para permitir recarga
    hasLoadedDashboardRef.current = false;
    previousHotelIdRef.current = null;
    retryCountRef.current = 0;
    
    // Atualiza o hotel no contexto após delay
    setTimeout(() => {
      refreshActiveHotel();
      loadMyHotelsCount();
      loadDashboardData();
    }, 800);
  };

  // ✅ NOVAS FUNÇÕES DE NAVEGAÇÃO
  const handleNavigateToBookings = () => {
    navigate('/hotels/events/bookings');
  };

  const handleNavigateToEventsDashboard = () => {
    navigate('/hotels/events/dashboard');
  };

  // ✅ FUNÇÃO PARA RECARREGAR DASHBOARD MANUALMENTE
  const handleRefreshDashboard = () => {
    if (refreshing) return;
    
    setRefreshing(true);
    hasLoadedDashboardRef.current = false;
    retryCountRef.current = 0;
    
    console.log('🔄 [Dashboard] Recarregando manualmente...');
    loadDashboardData();
  };

  // 🔧 CORREÇÃO: Formulário de criação de hotel DEVE vir primeiro
  if (showCreateForm) {
    console.log('📝 [Dashboard] Renderizando CreateHotelForm');
    return (
      <CreateHotelForm
        onSuccess={handleCreateHotelSuccess}
        onCancel={() => {
          console.log('❌ [Dashboard] Criação cancelada');
          setShowCreateForm(false);
        }}
      />
    );
  }

  // Formulário de edição
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Carregando hotel ativo...</p>
          <p className="text-sm text-gray-500">Buscando suas informações</p>
        </div>
      </div>
    );
  }

  // Loading do dashboard - COM BOTÃO DE FORÇAR RECARGA
  if (loadingDashboard && activeHotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">Carregando dashboard...</p>
          <p className="text-sm text-gray-500 mb-4">
            {refreshing ? 'Atualizando dados...' : `Preparando dados de ${activeHotel.name}`}
          </p>
          <Button
            onClick={() => {
              console.log('🔄 [Dashboard] Forçando recarga manual...');
              hasLoadedDashboardRef.current = false;
              previousHotelIdRef.current = null;
              retryCountRef.current = 0;
              hotelService.clearAllHotelCaches();
              loadDashboardData();
            }}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Forçar Recarga
          </Button>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo à Gestão de Hotéis</h2>
              <p className="text-gray-600">
                Selecione um hotel existente no menu superior ou crie um novo para começar.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-700">{error}</p>
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
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full h-11"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar Página
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-4">
                📚 Dicas rápidas:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Use o selector no topo para trocar de hotel</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Crie quartos e espaços para começar a receber reservas</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Configurações de hotel estão disponíveis após selecionar um hotel</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Dashboard completo com hotel selecionado
  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header com nome do hotel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                  {activeHotel.name}
                </h1>
                <Button
                  onClick={handleRefreshDashboard}
                  variant="ghost"
                  size="sm"
                  disabled={refreshing}
                  className="ml-2 flex-shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              <p className="text-gray-600 mb-2 flex items-center gap-2 flex-wrap">
                <span className="truncate">
                  {activeHotel.address || activeHotel.locality || 'Sem endereço cadastrado'}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {activeHotel.locality}, {activeHotel.province}
                </span>
              </p>
              
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="text-green-600 font-medium">
                  {myHotelsCount} {myHotelsCount === 1 ? 'hotel disponível' : 'hotéis disponíveis'}
                </span>
                {dashboard?.hotel?.is_active === false && (
                  <span className="text-amber-600 font-medium">• Hotel inativo</span>
                )}
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEditHotel}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 whitespace-nowrap"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Hotel
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Erro no dashboard</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              onClick={handleRefreshDashboard}
              variant="outline" 
              size="sm"
              className="h-8"
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-gray-600 mb-1">Total Reservas</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-700">{dashboard?.total_bookings || 0}</p>
          <p className="text-xs text-gray-500 mt-2">até agora</p>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-gray-600 mb-1">Próximas Reservas</p>
          <p className="text-2xl md:text-3xl font-bold text-green-700">{dashboard?.upcoming_bookings || 0}</p>
          <p className="text-xs text-gray-500 mt-2">próximos 30 dias</p>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-gray-600 mb-1">Receita Total</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-700">
            {dashboard?.total_revenue 
              ? `${parseFloat(dashboard.total_revenue).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN`
              : '0 MZN'
            }
          </p>
          <p className="text-xs text-gray-500 mt-2">acumulado</p>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm hover:shadow-md transition-all">
          <p className="text-sm text-gray-600 mb-1">Taxa Ocupação</p>
          <p className="text-2xl md:text-3xl font-bold text-orange-700">
            {dashboard?.occupancy_rate ? `${Math.round(dashboard.occupancy_rate)}%` : '0%'}
          </p>
          <p className="text-xs text-gray-500 mt-2">média geral</p>
        </Card>
      </div>

      {/* ✅ Ações rápidas */}
      <Card className="p-4 md:p-6 bg-white border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-gray-900">Ações Rápidas</h3>
          <Button
            onClick={handleRefreshDashboard}
            variant="ghost"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
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
          
          <Button
            onClick={handleNavigateToBookings}
            variant="outline"
            className="border-gray-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver Reservas
          </Button>
        </div>
      </Card>

      {/* Tabs principais */}
      <Card className="p-4 md:p-6 bg-white border-0 shadow-sm">
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
            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Bem-vindo ao {activeHotel.name}
              </h3>
              <p className="text-gray-600 mb-4">
                Aqui você gerencia quartos, espaços de eventos, reservas, promoções e avaliações.
                {dashboard?.hotel?.description && (
                  <>
                    <br />
                    <span className="text-sm mt-2 block">{dashboard.hotel.description}</span>
                  </>
                )}
              </p>
              
              {/* ✅ Cards de navegação rápida no overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Card 
                  className="p-4 border border-green-200 hover:border-green-400 hover:shadow-sm transition-all cursor-pointer" 
                  onClick={handleNavigateToEventsDashboard}
                >
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
                
                <Card 
                  className="p-4 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer" 
                  onClick={handleNavigateToBookings}
                >
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
            {/* ✅ CORREÇÃO APLICADA: Passando apenas propriedades de localização */}
            <EventSpacesManagementModern 
              hotelId={activeHotel.id} 
              hotel={{
                // 🔧 Apenas propriedades de localização (como definido na interface)
                locality: activeHotel.locality || '',
                province: activeHotel.province || '',
                lat: activeHotel.lat || null,
                lng: activeHotel.lng || null,
                location_id: activeHotel.location_id || null,
              }}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="text-center py-8 md:py-12">
              <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-2">Gestão de Reviews</h3>
              <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => toast({
                  title: 'Em breve',
                  description: 'Esta funcionalidade estará disponível em breve.',
                })}
              >
                Notificar-me quando disponível
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default HotelManagerDashboard;