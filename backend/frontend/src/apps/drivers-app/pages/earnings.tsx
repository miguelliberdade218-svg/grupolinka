import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';

interface DriverEarningsPageProps {
  driverId?: string;
  driverName?: string;
}

export default function DriverEarningsPage({
  driverId: _driverId = 'driver-123',
  driverName: _driverName = 'João Silva',
}: DriverEarningsPageProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Mock data
  const dailyEarnings = [
    { dia: 'Seg', ganhos: 250, corridas: 8, tempo: '6h30m' },
    { dia: 'Ter', ganhos: 280, corridas: 9, tempo: '7h' },
    { dia: 'Qua', ganhos: 220, corridas: 7, tempo: '6h' },
    { dia: 'Qui', ganhos: 310, corridas: 10, tempo: '8h' },
    { dia: 'Sex', ganhos: 420, corridas: 13, tempo: '9h30m' },
    { dia: 'Sab', ganhos: 480, corridas: 15, tempo: '10h' },
    { dia: 'Dom', ganhos: 350, corridas: 11, tempo: '8h30m' },
  ];

  const monthlyEarnings = [
    { mes: 'Jan', ganhos: 5200, corridas: 165, média: 31.5 },
    { mes: 'Fev', ganhos: 5800, corridas: 182, média: 31.8 },
    { mes: 'Mar', ganhos: 6100, corridas: 195, média: 31.3 },
    { mes: 'Abr', ganhos: 7200, corridas: 225, média: 32 },
    { mes: 'Mai', ganhos: 6800, corridas: 210, média: 32.4 },
    { mes: 'Jun', ganhos: 8100, corridas: 245, média: 33 },
  ];

  const earningsBreakdown = [
    { categoria: 'Corridas Normais', valor: 4500, percentage: 75 },
    { categoria: 'Surge Pricing', valor: 1200, percentage: 20 },
    { categoria: 'Bônus/Promoções', valor: 300, percentage: 5 },
  ];

  const recentRides = [
    {
      id: 1,
      from: 'Av. Paulista',
      to: 'Estação Luz',
      time: '14:30',
      passengers: 2,
      earnings: 45.50,
      rating: 5,
    },
    {
      id: 2,
      from: 'Estação Luz',
      to: 'Aeroporto',
      time: '15:45',
      passengers: 1,
      earnings: 78.90,
      rating: 4,
    },
    {
      id: 3,
      from: 'Shopping Pinheiros',
      to: 'Av. Brasil',
      time: '16:30',
      passengers: 3,
      earnings: 62.30,
      rating: 5,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Meus Ganhos</h2>
        <p className="text-gray-600 mt-2">Acompanhe seus rendimentos e performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ganhos Este Mês</p>
                <p className="text-3xl font-bold text-green-600 mt-1">R$ 8.100</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% vs mês anterior</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Corridas Este Mês</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">245</p>
                <p className="text-sm text-blue-600 mt-1">↑ 8% vs mês anterior</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ganho Médio/Corrida</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">R$ 33</p>
                <p className="text-sm text-purple-600 mt-1">Baseado nos ganhos</p>
              </div>
              <div className="w-8 h-8 text-purple-600 font-bold">✓</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avaliação (7d)</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">4.8</p>
                <p className="text-sm text-yellow-600 mt-1">Com 45 avaliações</p>
              </div>
              <div className="text-2xl">⭐</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === p
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' ? 'Hoje' : p === 'week' ? 'Esta Semana' : p === 'month' ? 'Este Mês' : 'Este Ano'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>Ganhos Diários (Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="ganhos" fill="#10b981" stroke="#059669" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>Ganhos Mensais (6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ganhos" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Composição dos Ganhos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {earningsBreakdown.map((item) => (
              <div key={item.categoria}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">{item.categoria}</span>
                  <span className="text-green-600 font-bold">R$ {item.valor.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">{item.percentage}% do total</p>
              </div>
            ))}
            <div className="pt-4 border-t font-bold text-lg">
              Total: R$ {earningsBreakdown.reduce((sum, item) => sum + item.valor, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Tempo Online</span>
              <span className="font-bold">49h 30m</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Taxa de Aceitação</span>
              <span className="font-bold">94%</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Cancelamentos</span>
              <span className="font-bold">2 (0.8%)</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Reclamações</span>
              <span className="font-bold">0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Corridas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <div
                key={ride.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {ride.from} → {ride.to}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ride.time} • {ride.passengers} passageiro{ride.passengers > 1 ? 's' : ''} •
                    {' '}
                    {'⭐'.repeat(ride.rating)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-green-600">R$ {ride.earnings.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💰 Informações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-white rounded">
            <span>Saldo Disponível</span>
            <span className="font-bold text-lg">R$ 2.150,00</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded">
            <span>Próximo Pagamento</span>
            <span className="font-bold">31/01/2025</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded">
            <span>Método</span>
            <span className="font-bold">Transferência Bancária</span>
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
            Sacar Agora
          </Button>
        </CardContent>
      </Card>

      {/* Tips and Alerts */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Dicas para Aumentar seus Ganhos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-900 space-y-2 text-sm">
          <p>💡 Você ganhou R$ 500 a mais do que a média esta semana!</p>
          <p>💡 Aceite corridas em horários de pico (18h-22h) para surge pricing</p>
          <p>💡 Manutenha sua avaliação acima de 4.5 para desbloqueios premium</p>
          <p>💡 Complete 250 corridas para atingir o status Gold</p>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <Button className="w-full bg-gray-700 hover:bg-gray-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório de Ganhos (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
