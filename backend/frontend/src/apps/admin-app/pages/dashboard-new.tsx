import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { 
  Users, Car, Hotel, Calendar, DollarSign, AlertTriangle, 
  TrendingUp, RotateCw, Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export default function AdminDashboard() {
  const { stats, loading, fetchDashboardStats, error, success, clearError, clearSuccess } = useAdminStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      clearSuccess();
    }
  }, [success, clearSuccess]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardStats();
      toast.success('Dashboard atualizado ✅');
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color,
    warning,
  }: {
    icon: any;
    label: string;
    value: number | string;
    subtext?: string;
    color?: string;
    warning?: boolean;
  }) => (
    <Card className={`${warning ? 'border-orange-200 bg-orange-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color || 'bg-blue-100'}`}>
            <Icon className="w-6 h-6" color={warning ? '#f97316' : '#3b82f6'} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h2>
          <p className="text-gray-600 mt-2">Visão geral e controle da plataforma LinkA</p>
        </div>
        <Button
          onClick={loadData}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RotateCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total de Usuários"
          value={stats?.total_users || 0}
          subtext="Registados no sistema"
          color="bg-blue-100"
        />
        <StatCard
          icon={Car}
          label="Motoristas"
          value={stats?.total_drivers || 0}
          subtext="Verificados e ativos"
          color="bg-green-100"
        />
        <StatCard
          icon={Hotel}
          label="Hotéis Parceiros"
          value={stats?.total_hotel_managers || 0}
          subtext="Ativos na plataforma"
          color="bg-purple-100"
        />
        <StatCard
          icon={Calendar}
          label="Espaços para Eventos"
          value={stats?.total_event_bookings || 0}
          subtext="Registados"
          color="bg-yellow-100"
        />

        <StatCard
          icon={DollarSign}
          label="Pagamentos Pendentes"
          value={stats?.pending_payments || 0}
          subtext={`Total: R$ ${(stats?.pending_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
          color="bg-blue-100"
        />
        <StatCard
          icon={TrendingUp}
          label="Total de Corridas"
          value={stats?.total_rides || 0}
          subtext="Todas as épocas"
          color="bg-indigo-100"
        />
        <StatCard
          icon={AlertTriangle}
          label="Reclamações Novas"
          value={stats?.new_complaints || 0}
          subtext="Requerem atenção"
          warning={true}
        />
        <StatCard
          icon={Users}
          label="Verificações Pendentes"
          value={stats?.pending_verifications || 0}
          subtext="Em fila de aprovação"
          color="bg-orange-100"
        />
      </div>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Admins do Sistema</p>
              <p className="text-2xl font-bold">{stats?.total_admins || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Clientes Ativos</p>
              <p className="text-2xl font-bold">{stats?.total_clients || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Reservas de Hotéis</p>
              <p className="text-2xl font-bold">{stats?.total_hotel_bookings || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/admin/capabilities"
              className="flex items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <span>✅</span>
              <span className="text-sm font-medium">Verificações</span>
            </a>
            <a
              href="/admin/complaints"
              className="flex items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
            >
              <span>⚠️</span>
              <span className="text-sm font-medium">Reclamações</span>
            </a>
            <a
              href="/admin/payments"
              className="flex items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <span>💳</span>
              <span className="text-sm font-medium">Pagamentos</span>
            </a>
            <a
              href="/admin/users"
              className="flex items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
            >
              <span>👥</span>
              <span className="text-sm font-medium">Usuários</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
