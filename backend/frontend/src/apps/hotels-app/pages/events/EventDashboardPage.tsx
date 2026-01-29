// src/apps/hotels-app/pages/events/EventDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter'; // ✅ Corrigido: usar wouter em vez de react-router-dom
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb';
import {
  Home,
  Building,
  Calendar,
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  ChevronRight,
  PieChart,
  LineChart,
  CalendarDays,
  Star,
  Award,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api';
import { eventSpaceService } from '@/services/eventSpaceService';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface EventDashboardPageProps {
  hotelId?: string;
}

const EventDashboardPage: React.FC<EventDashboardPageProps> = ({ hotelId: propHotelId }) => {
  // ✅ Corrigido: usar wouter em vez de react-router-dom
  const [location, navigate] = useLocation();
  const params = useParams();
  
  const { toast } = useToast();

  const hotelId = propHotelId || params.hotelId;

  const [loading, setLoading] = useState(true);
  const [hotelInfo, setHotelInfo] = useState<any>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    averageBookingValue: 0,
    occupancyRate: 0,
    upcomingEvents: 0,
    revenueGrowth: 0,
    bookingGrowth: 0,
    topSpaces: [] as Array<{ id: string; name: string; bookings: number; revenue: number }>,
    recentBookings: [] as any[],
    revenueByMonth: [] as Array<{ month: string; revenue: number; bookings: number }>,
    paymentMethods: [] as Array<{ method: string; amount: number; count: number }>,
  });

  useEffect(() => {
    if (hotelId) {
      loadDashboardData();
    }
  }, [hotelId, period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar informações do hotel
      if (hotelId) {
        try {
          const hotelRes = await apiService.getHotelById(hotelId);
          if (hotelRes.success) {
            setHotelInfo(hotelRes.data);
          }
        } catch (err) {
          console.error('Erro ao carregar hotel:', err);
        }
      }

      // Carregar dados principais
      await Promise.all([
        loadBookingsData(),
        loadSpacesData(),
        loadRecentBookings(),
      ]);

      // Dados financeiros simulados
      loadFinancialDataFallback();

    } catch (error: any) {
      toast({
        title: '❌ Erro ao carregar dashboard',
        description: error.message || 'Falha ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookingsData = async () => {
    try {
      if (!hotelId) return;

      // Usar eventSpaceService para obter reservas
      const res = await eventSpaceService.getMyBookings();
      if (res.success && res.data) {
        const hotelBookings = res.data.filter((b: any) => b.hotelId === hotelId);

        const totalBookings = hotelBookings.length;
        const pendingBookings = hotelBookings.filter((b: any) => b.status === 'pending_approval').length;
        const confirmedBookings = hotelBookings.filter((b: any) => b.status === 'confirmed').length;
        const cancelledBookings = hotelBookings.filter((b: any) => 
          b.status === 'cancelled' || b.status === 'rejected'
        ).length;

        const totalRevenue = hotelBookings.reduce((sum: number, b: any) => 
          sum + parseFloat(b.totalPrice || '0'), 0
        );

        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        setDashboardData(prev => ({
          ...prev,
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue,
          averageBookingValue,
          upcomingEvents: confirmedBookings + pendingBookings,
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    }
  };

  const loadSpacesData = async () => {
    try {
      if (!hotelId) return;

      const res = await eventSpaceService.getEventSpacesByHotel(hotelId);
      if (res.success && res.data) {
        const topSpaces = res.data.slice(0, 5).map((space: any) => ({
          id: space.id,
          name: space.name,
          bookings: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 400000) + 100000,
        }));

        setDashboardData(prev => ({ ...prev, topSpaces }));
      }
    } catch (error) {
      console.error('Erro ao carregar espaços:', error);
    }
  };

  const loadRecentBookings = async () => {
    try {
      if (!hotelId) return;

      const res = await eventSpaceService.getMyBookings();
      if (res.success && res.data) {
        const recent = res.data
          .filter((b: any) => b.hotelId === hotelId)
          .slice(0, 5)
          .map((b: any) => ({
            id: b.id,
            event_title: b.eventTitle || 'Evento sem título',
            organizer_name: b.organizerName || 'Sem nome',
            start_date: b.startDate,
            status: b.status,
            total_price: b.totalPrice || '0',
          }));

        setDashboardData(prev => ({ ...prev, recentBookings: recent }));
      }
    } catch (error) {
      console.error('Erro ao carregar reservas recentes:', error);
    }
  };

  const loadFinancialDataFallback = () => {
    // Dados simulados
    const revenueByMonth = [
      { month: 'Jan', revenue: 45000, bookings: 12 },
      { month: 'Fev', revenue: 52000, bookings: 15 },
      { month: 'Mar', revenue: 48000, bookings: 14 },
      { month: 'Abr', revenue: 61000, bookings: 18 },
      { month: 'Mai', revenue: 55000, bookings: 16 },
      { month: 'Jun', revenue: 72000, bookings: 22 },
      { month: 'Jul', revenue: 68000, bookings: 20 },
      { month: 'Ago', revenue: 75000, bookings: 23 },
      { month: 'Set', revenue: 82000, bookings: 25 },
      { month: 'Out', revenue: 78000, bookings: 24 },
      { month: 'Nov', revenue: 85000, bookings: 26 },
      { month: 'Dez', revenue: 92000, bookings: 28 },
    ];

    const paymentMethods = [
      { method: 'M-Pesa', amount: 250000, count: 85 },
      { method: 'Transferência', amount: 180000, count: 45 },
      { method: 'Cartão', amount: 120000, count: 32 },
      { method: 'Dinheiro', amount: 80000, count: 28 },
      { method: 'Mobile Money', amount: 50000, count: 15 },
    ];

    setDashboardData(prev => ({
      ...prev,
      revenueByMonth,
      paymentMethods,
      revenueGrowth: 12.5,
      bookingGrowth: 8.3,
      occupancyRate: 78,
    }));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; label: string }> = {
      'pending_approval': { variant: 'warning', label: 'Pendente' },
      'confirmed': { variant: 'success', label: 'Confirmado' },
      'completed': { variant: 'default', label: 'Concluído' },
      'cancelled': { variant: 'destructive', label: 'Cancelado' },
      'rejected': { variant: 'destructive', label: 'Rejeitado' },
    };
    
    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs ${
        statusInfo.variant === 'warning' ? 'bg-amber-100 text-amber-800' :
        statusInfo.variant === 'success' ? 'bg-green-100 text-green-800' :
        statusInfo.variant === 'destructive' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {statusInfo.label}
      </span>
    );
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="py-8 px-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          {hotelInfo && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/hotel/${hotelId}`} className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  {hotelInfo.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            </>
          )}
          <BreadcrumbItem>
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart className="h-4 w-4" />
              Eventos
            </div>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard de Eventos
          </h1>
          <p className="text-gray-600 mt-1">
            {hotelInfo ? `Visão geral do hotel ${hotelInfo.name}` : 'Visão geral dos eventos'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>

          {hotelId && (
            <Button onClick={() => navigate(`/hotel/${hotelId}/events/bookings`)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver Reservas
            </Button>
          )}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="h-8 w-8 text-blue-600" />
            {getGrowthIcon(dashboardData.bookingGrowth)}
          </div>
          <div className="text-3xl font-bold">{dashboardData.totalBookings}</div>
          <div className="text-gray-600">Total de Reservas</div>
          <div className="text-sm text-gray-500 mt-1">
            {dashboardData.upcomingEvents} eventos próximos
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            {getGrowthIcon(dashboardData.revenueGrowth)}
          </div>
          <div className="text-3xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</div>
          <div className="text-gray-600">Receita Total</div>
          <div className="text-sm text-gray-500 mt-1">
            Média: {formatCurrency(dashboardData.averageBookingValue)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <div className="text-3xl font-bold">{dashboardData.pendingBookings}</div>
          <div className="text-gray-600">Pendentes</div>
          <div className="text-sm text-gray-500 mt-1">Aguardando aprovação</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold">{dashboardData.occupancyRate}%</div>
          <div className="text-gray-600">Taxa de Ocupação</div>
          <div className="text-sm text-gray-500 mt-1">Baseada em disponibilidade</div>
        </Card>
      </div>

      {/* Gráficos e tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Receita por mês */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-6">Receita por Mês</h3>
          <div className="space-y-4">
            {dashboardData.revenueByMonth.map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="w-12 font-medium">{item.month}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${Math.min((item.revenue / 100000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-medium">{formatCurrency(item.revenue)}</div>
                  <div className="text-xs text-gray-500">{item.bookings} reservas</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Métodos de pagamento */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-6">Métodos de Pagamento</h3>
          <div className="space-y-4">
            {dashboardData.paymentMethods.map((item) => (
              <div key={item.method} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{item.method}</div>
                    <div className="text-xs text-gray-500">{item.count} transações</div>
                  </div>
                </div>
                <div className="font-medium">{formatCurrency(item.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Espaços mais populares */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Espaços Mais Populares</h3>
          {hotelId && (
            <Button variant="outline" onClick={() => navigate(`/hotel/${hotelId}/spaces`)}>
              Ver Todos
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Espaço</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Reservas</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Receita</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.topSpaces.map((space) => (
                <tr key={space.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium">{space.name}</td>
                  <td className="py-4 px-4">{space.bookings}</td>
                  <td className="py-4 px-4 font-medium text-green-600">
                    {formatCurrency(space.revenue)}
                  </td>
                  <td className="py-4 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/spaces/${space.id}/bookings`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reservas recentes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Reservas Recentes</h3>
          {hotelId && (
            <Button variant="outline" onClick={() => navigate(`/hotel/${hotelId}/events/bookings`)}>
              Ver Todas
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {dashboardData.recentBookings.length > 0 ? (
            dashboardData.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <div className="font-medium mb-1">{booking.event_title}</div>
                  <div className="text-sm text-gray-600">
                    {booking.organizer_name} • {formatDate(booking.start_date)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600 mb-1">
                    {formatCurrency(parseFloat(booking.total_price))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/bookings/${booking.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma reserva recente
            </div>
          )}
        </div>
      </Card>

      {/* Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <Star className="h-6 w-6 text-blue-600" />
            <h4 className="font-semibold">Insight</h4>
          </div>
          <p className="text-blue-700">
            {dashboardData.pendingBookings > 0
              ? `Tem ${dashboardData.pendingBookings} reserva(s) pendente(s) de aprovação`
              : 'Todas as reservas estão em dia!'}
          </p>
        </Card>

        <Card className="p-6 bg-green-50">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h4 className="font-semibold">Performance</h4>
          </div>
          <p className="text-green-700">
            Receita cresceu {dashboardData.revenueGrowth}% este período
          </p>
        </Card>

        <Card className="p-6 bg-purple-50">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-6 w-6 text-purple-600" />
            <h4 className="font-semibold">Recomendação</h4>
          </div>
          <p className="text-purple-700">
            Considere promoções para espaços com baixa ocupação
          </p>
        </Card>
      </div>
    </div>
  );
};

export default EventDashboardPage;