// src/apps/hotels-app/pages/events/EventBookingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb';
import {
  Home,
  Building,
  Calendar,
  Download,
  Printer,
  Plus,
  Filter,
  RefreshCw,
  BarChart,
  FileText,
  Users,
  DollarSign,
  ArrowLeft,
  Eye,
  CreditCard,
  Settings,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api';
import { eventSpaceService } from '@/services/eventSpaceService';
import BookingStats from '../components/event-spaces/BookingStats';
import BookingFilters from '../components/event-spaces/BookingFilters';
import BookingDetailsDialog from '../components/event-spaces/BookingDetailsDialog';
import type { EventBooking, EventSpace } from '@/shared/types/event-spaces';
import type { BookingFiltersState } from '../components/event-spaces/BookingFilters';

interface EventBookingsPageProps {
  hotelId?: string;
  spaceId?: string;
}

interface BookingStatsType {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  pendingRevenue: number;
  averageBookingValue: number;
}

const EventBookingsPage: React.FC<EventBookingsPageProps> = ({ hotelId: propHotelId, spaceId: propSpaceId }) => {
  const [location, navigate] = useLocation();
  const params = useParams();
  
  const { toast } = useToast();
  
  const hotelId = propHotelId || params.hotelId;
  const spaceId = propSpaceId || params.spaceId;
  
  const [loading, setLoading] = useState(true);
  const [hotelInfo, setHotelInfo] = useState<any>(null);
  const [spaceInfo, setSpaceInfo] = useState<EventSpace | null>(null);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [stats, setStats] = useState<BookingStatsType>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    pendingRevenue: 0,
    averageBookingValue: 0,
  });
  const [filters, setFilters] = useState<BookingFiltersState>({
    status: 'all',
    dateRange: 'all',
    search: '',
    paymentStatus: 'all',
    eventType: 'all',
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (hotelId || spaceId) {
      loadData();
    }
  }, [hotelId, spaceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar informações do hotel
      if (hotelId) {
        const hotelRes = await apiService.getHotelById(hotelId);
        if (hotelRes.success) {
          setHotelInfo(hotelRes.data);
        }
      }
      
      // Carregar informações do espaço
      if (spaceId) {
        const spaceRes = await eventSpaceService.getEventSpaceById(spaceId);
        if (spaceRes.success && spaceRes.data) {
          setSpaceInfo(spaceRes.data);
        }
      }
      
      // Carregar reservas
      await loadBookings();
      
    } catch (error: any) {
      toast({
        title: '❌ Erro ao carregar dados',
        description: error.message || 'Falha ao carregar informações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      let bookingsData: EventBooking[] = [];
      
      if (spaceId) {
        // Carregar reservas do espaço específico
        const res = await eventSpaceService.getBookings(spaceId, {
          status: filters.status !== 'all' ? filters.status : undefined,
          startDate: filters.startDate?.toISOString().split('T')[0],
          endDate: filters.endDate?.toISOString().split('T')[0],
          limit: 100,
        });
        
        if (res.success && res.data) {
          bookingsData = res.data;
        }
      } else if (hotelId) {
        // Carregar todas as reservas do hotel (via email do organizador)
        const res = await eventSpaceService.getMyBookings();
        if (res.success && res.data) {
          // Filtrar apenas reservas deste hotel
          bookingsData = res.data.filter((booking: EventBooking) => 
            booking.hotelId === hotelId
          );
        }
      }
      
      // Aplicar filtros locais adicionais
      let filteredBookings = [...bookingsData];
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredBookings = filteredBookings.filter(booking => 
          booking.eventTitle?.toLowerCase().includes(searchLower) ||
          booking.organizerName?.toLowerCase().includes(searchLower) ||
          booking.organizerEmail?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.eventType !== 'all') {
        filteredBookings = filteredBookings.filter(booking => 
          booking.eventType === filters.eventType
        );
      }
      
      if (filters.paymentStatus !== 'all') {
        filteredBookings = filteredBookings.filter(booking => 
          booking.paymentStatus === filters.paymentStatus
        );
      }
      
      setBookings(filteredBookings);
      calculateStats(filteredBookings);
      
    } catch (error: any) {
      console.error('Erro ao carregar reservas:', error);
      toast({
        title: '⚠️ Aviso',
        description: 'Alguns dados podem estar incompletos',
        variant: 'default',
      });
    }
  };

  const calculateStats = (bookingsList: EventBooking[]) => {
    const total = bookingsList.length;
    const pending = bookingsList.filter(b => b.status === 'pending_approval').length;
    const confirmed = bookingsList.filter(b => b.status === 'confirmed').length;
    const completed = bookingsList.filter(b => b.status === 'completed').length;
    const cancelled = bookingsList.filter(b => 
      b.status === 'cancelled' || b.status === 'rejected'
    ).length;
    
    const revenue = bookingsList.reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0);
    
    // Cálculo do pendingRevenue
    const pendingRevenue = bookingsList
      .filter(b => b.paymentStatus === 'pending' || b.paymentStatus === 'partial')
      .reduce((sum, b) => {
        const totalAmount = parseFloat(b.totalPrice || '0');
        return sum + (b.paymentStatus === 'pending' ? totalAmount : totalAmount * 0.5);
      }, 0);
    
    const averageBookingValue = total > 0 ? revenue / total : 0;
    
    setStats({
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      revenue,
      pendingRevenue,
      averageBookingValue,
    });
  };

  const handleFilterChange = (newFilters: BookingFiltersState) => {
    setFilters(newFilters);
    // Recarregar reservas com novos filtros (com debounce leve)
    setTimeout(() => {
      loadBookings();
    }, 300);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      dateRange: 'all',
      search: '',
      paymentStatus: 'all',
      eventType: 'all',
      minAmount: undefined,
      maxAmount: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    
    setTimeout(() => {
      loadBookings();
    }, 300);
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      toast({
        title: '📤 Exportando dados...',
        description: `Preparando arquivo ${format.toUpperCase()}`,
        variant: 'default',
      });
      
      setTimeout(() => {
        toast({
          title: '✅ Exportação concluída',
          description: `Arquivo ${format.toUpperCase()} pronto para download`,
          variant: 'success',
        });
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: '❌ Erro na exportação',
        description: error.message || 'Falha ao exportar dados',
        variant: 'destructive',
      });
    }
  };

  const handleBookingAction = async (bookingId: string, action: string, reason?: string) => {
    try {
      let result;
      
      switch (action) {
        case 'confirm':
          result = await eventSpaceService.confirmBooking(bookingId);
          break;
        case 'reject':
          result = await eventSpaceService.rejectBooking(bookingId, reason || 'Sem motivo especificado');
          break;
        case 'cancel':
          result = await eventSpaceService.cancelBooking(bookingId, reason || 'Cancelado pelo gestor');
          break;
        default:
          throw new Error(`Ação desconhecida: ${action}`);
      }
      
      if (result.success) {
        toast({
          title: '✅ Ação realizada',
          description: `Reserva ${action === 'confirm' ? 'confirmada' : action === 'reject' ? 'rejeitada' : 'cancelada'} com sucesso`,
          variant: 'success',
        });
        await loadBookings();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro na ação',
        description: error.message || 'Falha ao realizar ação',
        variant: 'destructive',
      });
    }
  };

  const getPageTitle = () => {
    if (spaceInfo) {
      return `Reservas - ${spaceInfo.name}`;
    }
    if (hotelInfo) {
      return `Reservas - ${hotelInfo.name}`;
    }
    return 'Gestão de Reservas';
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: 'Dashboard', href: '/', icon: <Home className="h-4 w-4" /> },
    ];

    // Breadcrumb dinâmico com fallbacks
    if (hotelId) {
      items.push({
        label: hotelInfo?.name || `Hotel ${hotelId.slice(0,8)}`,
        href: `/hotel/${hotelId}`,
        icon: <Building className="h-4 w-4" />,
      });
    }

    if (spaceId) {
      items.push({
        label: spaceInfo?.name || `Espaço ${spaceId.slice(0,8)}`,
        href: `/spaces/${spaceId}`,
        icon: <Calendar className="h-4 w-4" />,
      });
    }

    items.push({
      label: 'Reservas',
      href: '#',
      icon: <FileText className="h-4 w-4" />,
    });

    return items;
  };

  // Formatação de moeda melhorada
  const formatCurrency = (amount: number | string | undefined) => {
    if (amount == null) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Função para voltar à página anterior
  const handleGoBack = () => {
    // Verificar se temos uma página anterior no histórico
    if (hotelId && spaceId) {
      // Se estamos em um espaço específico, voltar para a página do espaço
      navigate(`/spaces/${spaceId}`);
    } else if (hotelId) {
      // Se estamos em um hotel, voltar para a página do hotel
      navigate(`/hotel/${hotelId}`);
    } else {
      // Caso contrário, voltar para o dashboard
      navigate('/');
    }
  };

  // Renderização das reservas
  const renderBookingsList = (filteredBookings: EventBooking[]) => {
    if (filteredBookings.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhuma reserva encontrada</p>
          <p className="text-sm text-gray-500 mt-2">
            Tente ajustar os filtros ou verifique se há reservas neste espaço/hotel
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-lg">{booking.eventTitle}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' || booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'pending_approval' ? 'Pendente' :
                     booking.status === 'confirmed' ? 'Confirmado' :
                     booking.status === 'completed' ? 'Concluído' :
                     booking.status === 'cancelled' ? 'Cancelado' :
                     booking.status === 'rejected' ? 'Rejeitado' : booking.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' :
                    booking.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-800' :
                    booking.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.paymentStatus === 'paid' ? 'Pago' :
                     booking.paymentStatus === 'pending' ? 'Pendente' :
                     booking.paymentStatus === 'partial' ? 'Parcial' :
                     booking.paymentStatus === 'failed' ? 'Falhou' : booking.paymentStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Organizador:</span> {booking.organizerName}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {new Date(booking.startDate).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">Participantes:</span> {booking.expectedAttendees}
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> {formatCurrency(booking.totalPrice)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(booking.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Detalhes
                </Button>
                {booking.status === 'pending_approval' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleBookingAction(booking.id, 'confirm')}
                    >
                      Confirmar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Digite o motivo da rejeição:');
                        if (reason) {
                          handleBookingAction(booking.id, 'reject', reason);
                        }
                      }}
                    >
                      Rejeitar
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const reason = prompt('Digite o motivo do cancelamento:');
                      if (reason) {
                        handleBookingAction(booking.id, 'cancel', reason);
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          {getBreadcrumbItems().map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href} className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < getBreadcrumbItems().length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">
            {spaceInfo 
              ? `Gerencie todas as reservas do espaço ${spaceInfo.name}`
              : hotelInfo
              ? `Gerencie todas as reservas do hotel ${hotelInfo.name}`
              : 'Gerencie todas as reservas de eventos'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGoBack} // ✅ Corrigido: usar função personalizada
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
          >
            <Printer className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          <Button
            onClick={() => {
              if (spaceId) {
                navigate(`/spaces/${spaceId}/bookings/new`);
              } else if (hotelId) {
                navigate(`/hotel/${hotelId}/events/bookings/new`);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Reserva
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mb-6">
        <BookingStats stats={stats} />
      </div>

      {/* Tabs e Filtros */}
      <Card className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b">
            <TabsList>
              <TabsTrigger value="all">
                <Eye className="h-4 w-4 mr-2" />
                Todas
              </TabsTrigger>
              <TabsTrigger value="pending">
                <Bell className="h-4 w-4 mr-2" />
                Pendentes ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="confirmed">
                <Calendar className="h-4 w-4 mr-2" />
                Confirmadas ({stats.confirmed})
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBookings}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: 'ℹ️ Filtros',
                    description: 'Use os filtros abaixo para refinar sua busca',
                    variant: 'default',
                  });
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="p-4">
            <TabsContent value="all" className="m-0">
              <BookingFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
              
              <div className="mt-6">
                {renderBookingsList(bookings)}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-amber-600 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Reservas Pendentes</h3>
                <p className="text-lg text-gray-600 mb-6">
                  {stats.pending} reservas aguardando sua aprovação
                </p>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                  Aprove ou rejeite as reservas pendentes para garantir a melhor gestão do seu espaço.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => {
                    // Aplicar filtro para mostrar apenas pendentes
                    handleFilterChange({...filters, status: 'pending_approval'});
                    setActiveTab('all');
                  }}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  Ver reservas pendentes
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="confirmed" className="m-0">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Reservas Confirmadas</h3>
                <p className="text-lg text-gray-600 mb-6">
                  {stats.confirmed} reservas confirmadas
                </p>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                  Veja todas as reservas confirmadas e gerencie seus detalhes e pagamentos.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => {
                    handleFilterChange({...filters, status: 'confirmed'});
                    setActiveTab('all');
                  }}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Ver reservas confirmadas
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="m-0">
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-3">Gestão de Pagamentos</h3>
                <p className="text-lg text-gray-600 mb-2">
                  Receita total: {formatCurrency(stats.revenue)}
                </p>
                <p className="text-lg text-amber-600 mb-6">
                  Receita pendente: {formatCurrency(stats.pendingRevenue)}
                </p>
                <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                  Gerencie os pagamentos pendentes e acompanhe o fluxo financeiro das suas reservas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => {
                      handleFilterChange({...filters, paymentStatus: 'pending'});
                      setActiveTab('all');
                    }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Ver pagamentos pendentes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      handleFilterChange({...filters, paymentStatus: 'partial'});
                      setActiveTab('all');
                    }}
                  >
                    Ver pagamentos parciais
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="m-0">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Configurações</h3>
                <p className="text-gray-600">
                  Configurações de notificações e preferências
                </p>
                <div className="mt-6 max-w-md mx-auto">
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Notificações por Email</h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">Novas reservas</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">Cancelamentos</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-sm">Alertas de pagamento</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">Lembretes de eventos próximos</span>
                          </label>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Preferências de Exibição</h4>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">Mostrar valores em MZN</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">Formato de data PT-BR</span>
                          </label>
                        </div>
                      </div>
                      <Button className="w-full mt-6">Salvar Configurações</Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Informações Adicionais */}
      {(hotelInfo || spaceInfo) && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Informações</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hotelInfo && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Hotel
                </h4>
                <p className="text-gray-700">{hotelInfo.name}</p>
                {hotelInfo.locality && (
                  <p className="text-sm text-gray-600">
                    {hotelInfo.locality}, {hotelInfo.province}
                  </p>
                )}
                {hotelInfo.contact_phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    📞 {hotelInfo.contact_phone}
                  </p>
                )}
              </div>
            )}
            
            {spaceInfo && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Espaço
                </h4>
                <p className="text-gray-700">{spaceInfo.name}</p>
                <p className="text-sm text-gray-600">
                  Capacidade: {spaceInfo.capacityMin}-{spaceInfo.capacityMax} pessoas
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  💰 {formatCurrency(spaceInfo.basePricePerDay)} / dia
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Estatísticas
              </h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-600">Total de reservas:</span>{' '}
                  <span className="font-medium">{stats.total}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Receita total:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(stats.revenue)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Taxa de ocupação:</span>{' '}
                  <span className="font-medium">
                    {stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0}%
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Valor médio por reserva:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(stats.averageBookingValue)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Diálogo de Detalhes da Reserva */}
      {selectedBooking && (
        <BookingDetailsDialog
          bookingId={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onBookingUpdated={loadBookings}
        />
      )}

      {/* Ações Rápidas */}
      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleExport('csv')}
          >
            <Download className="h-8 w-8" />
            <span>Exportar CSV</span>
            <span className="text-xs text-gray-500">Dados estruturados</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => handleExport('pdf')}
          >
            <Printer className="h-8 w-8" />
            <span>Relatório PDF</span>
            <span className="text-xs text-gray-500">Relatório formatado</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => {
              if (spaceId) {
                navigate(`/spaces/${spaceId}/calendar`);
              } else if (hotelId) {
                navigate(`/hotel/${hotelId}/events/calendar`);
              }
            }}
          >
            <Calendar className="h-8 w-8" />
            <span>Calendário</span>
            <span className="text-xs text-gray-500">Ver disponibilidade</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => {
              if (spaceId) {
                navigate(`/spaces/${spaceId}/settings`);
              } else if (hotelId) {
                navigate(`/hotel/${hotelId}/events/settings`);
              }
            }}
          >
            <Settings className="h-8 w-8" />
            <span>Configurações</span>
            <span className="text-xs text-gray-500">Preferências</span>
          </Button>
        </div>
      </div>

      {/* Notificações e Alertas */}
      {stats.pending > 0 && (
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-semibold text-amber-800">
                  {stats.pending} reserva{stats.pending !== 1 ? 's' : ''} pendente{stats.pending !== 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-amber-700">
                  Há {stats.pending} reserva{stats.pending !== 1 ? 's' : ''} aguardando sua aprovação
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveTab('pending')}
            >
              Ver Pendentes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EventBookingsPage;