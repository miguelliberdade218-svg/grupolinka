import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  Calendar,
  Settings,
} from 'lucide-react';

interface AdminAnalyticsPageProps {
  adminId?: string;
}

export default function AdminAnalyticsPage({
  adminId = 'admin-123',
}: AdminAnalyticsPageProps) {
  const [dateRange, setDateRange] = useState('month');

  // Mock data
  const usersGrowth = [
    { mes: 'Jan', drivers: 120, passengers: 450 },
    { mes: 'Fev', drivers: 145, passengers: 520 },
    { mes: 'Mar', drivers: 168, passengers: 610 },
    { mes: 'Abr', drivers: 195, passengers: 750 },
    { mes: 'Mai', drivers: 220, passengers: 890 },
    { mes: 'Jun', drivers: 245, passengers: 1050 },
  ];

  const revenueData = [
    { mes: 'Jan', receita: 125000, custos: 45000 },
    { mes: 'Fev', receita: 145000, custos: 51000 },
    { mes: 'Mar', receita: 168000, custos: 58000 },
    { mes: 'Abr', receita: 195000, custos: 65000 },
    { mes: 'Mai', receita: 225000, custos: 72000 },
    { mes: 'Jun', receita: 265000, custos: 82000 },
  ];

  const platformDistribution = [
    { name: 'Caronas', value: 45, fill: '#3b82f6' },
    { name: 'Hotéis', value: 30, fill: '#8b5cf6' },
    { name: 'Eventos', value: 25, fill: '#f59e0b' },
  ];

  const dailyActivityData = [
    { dia: 'Seg', corridas: 245, reservas: 89, eventos: 12 },
    { dia: 'Ter', corridas: 267, reservas: 92, eventos: 15 },
    { dia: 'Qua', corridas: 234, reservas: 78, eventos: 10 },
    { dia: 'Qui', corridas: 312, reservas: 105, eventos: 18 },
    { dia: 'Sex', corridas: 389, reservas: 134, eventos: 22 },
    { dia: 'Sab', corridas: 456, reservas: 156, eventos: 28 },
    { dia: 'Dom', corridas: 378, reservas: 123, eventos: 19 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📊 Analytics</h2>
          <p className="text-gray-600 mt-1">Análise completa da plataforma</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === 'today'
                  ? 'Hoje'
                  : range === 'week'
                    ? 'Esta Semana'
                    : range === 'month'
                      ? 'Este Mês'
                      : 'Este Ano'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">R$ 265k</p>
                <p className="text-sm text-green-600 mt-1">↑ 18% vs mês</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Usuários Ativos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">1.295</p>
                <p className="text-sm text-blue-600 mt-1">↑ 12% vs mês</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">6.8%</p>
                <p className="text-sm text-purple-600 mt-1">↑ 0.5% vs mês</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Transações</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">2.847</p>
                <p className="text-sm text-orange-600 mt-1">↑ 22% vs mês</p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usersGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="drivers"
                  stroke="#3b82f6"
                  name="Motoristas"
                />
                <Line
                  type="monotone"
                  dataKey="passengers"
                  stroke="#10b981"
                  name="Passageiros"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Receita vs Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita" />
                <Bar dataKey="custos" fill="#ef4444" name="Custos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                >
                  {platformDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm">
              {platformDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                  </span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Diária (Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="corridas" fill="#3b82f6" name="Corridas" />
                <Bar dataKey="reservas" fill="#8b5cf6" name="Reservas" />
                <Bar dataKey="eventos" fill="#f59e0b" name="Eventos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Principais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Lucro Mensal', value: 'R$ 183k', trend: '+18%' },
              { label: 'Ticket Médio', value: 'R$ 93,20', trend: '+5%' },
              { label: 'Taxa Cancelamento', value: '3.2%', trend: '-0.5%' },
              { label: 'Satisfação Cliente', value: '4.6/5', trend: '+0.2' },
            ].map((metric, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                <p className="font-bold text-gray-900 text-lg">{metric.value}</p>
                <p className="text-xs text-green-600 mt-1">{metric.trend}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">⚠️ Alertas Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-900 space-y-2 text-sm">
          <p>• Taxa de cancelamento acima do esperado em hotéis (5.2%)</p>
          <p>• 3 motoristas com avaliação baixa (&lt; 3.5)</p>
          <p>• Pico de atividade às 18h-20h (considere mais suporte)</p>
          <p>• 2 pagamentos pendentes de validação</p>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Dados</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button className="bg-blue-600 hover:bg-blue-700">
            📊 Exportar PDF
          </Button>
          <Button variant="outline">
            📈 Exportar Excel
          </Button>
          <Button variant="outline">
            📋 Agendar Relatório
          </Button>
          <Button variant="outline">
            ⚙️ Configurar Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
