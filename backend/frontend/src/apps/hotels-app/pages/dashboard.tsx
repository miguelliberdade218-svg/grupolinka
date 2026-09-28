import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';

interface HotelDashboardPageProps {
  hotelId?: string;
  hotelName?: string;
}

export default function HotelDashboardPage({
  hotelId = 'hotel-123',
  hotelName = 'Hotel Paulista Luxo',
}: HotelDashboardPageProps) {
  const [dateRange, setDateRange] = useState('month');

  // Mock data for charts
  const bookingData = [
    { month: 'Jan', reservas: 45, canceladas: 5, confirmadas: 40 },
    { month: 'Fev', reservas: 52, canceladas: 6, confirmadas: 46 },
    { month: 'Mar', reservas: 48, canceladas: 4, confirmadas: 44 },
    { month: 'Abr', reservas: 61, canceladas: 7, confirmadas: 54 },
    { month: 'Mai', reservas: 55, canceladas: 5, confirmadas: 50 },
    { month: 'Jun', reservas: 67, canceladas: 6, confirmadas: 61 },
  ];

  const revenueData = [
    { mes: 'Jan', receita: 45000, despesas: 15000, lucro: 30000 },
    { mes: 'Fev', receita: 52000, despesas: 16000, lucro: 36000 },
    { mes: 'Mar', receita: 48000, despesas: 14500, lucro: 33500 },
    { mes: 'Abr', receita: 61000, despesas: 18000, lucro: 43000 },
    { mes: 'Mai', receita: 55000, despesas: 16500, lucro: 38500 },
    { mes: 'Jun', receita: 67000, despesas: 19000, lucro: 48000 },
  ];

  const roomTypeData = [
    { name: 'Standard', value: 35, fill: '#3b82f6' },
    { name: 'Deluxe', value: 28, fill: '#1f2937' },
    { name: 'Suite', value: 22, fill: '#9333ea' },
    { name: 'Premium', value: 15, fill: '#f59e0b' },
  ];

  const occupancyData = [
    { dia: 'Seg', ocupacao: 78 },
    { dia: 'Ter', ocupacao: 82 },
    { dia: 'Qua', ocupacao: 75 },
    { dia: 'Qui', ocupacao: 88 },
    { dia: 'Sex', ocupacao: 92 },
    { dia: 'Sab', ocupacao: 96 },
    { dia: 'Dom', ocupacao: 85 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">{hotelName}</h2>
        <p className="text-gray-600 mt-1">Dashboard de Gestão de Reservas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Reservas Este Mês</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">67</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% vs mês anterior</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Receita Este Mês</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">R$ 67k</p>
                <p className="text-sm text-green-600 mt-1">↑ 9% vs mês anterior</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">87%</p>
                <p className="text-sm text-green-600 mt-1">↑ 5% vs última semana</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avaliação Média</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">4.6</p>
                <p className="text-sm text-yellow-600 mt-1">Em 89 avaliações</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="confirmadas" stackId="a" fill="#3b82f6" />
                <Bar dataKey="canceladas" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Quarto</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-sm">
              {roomTypeData.map((item) => (
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

        {/* Occupancy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ocupação da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="ocupacao" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">📋 Gerenciamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
              📅 Ver Reservas
            </Button>
            <Button variant="outline" className="w-full justify-start">
              👥 Gerenciar Hóspedes
            </Button>
            <Button variant="outline" className="w-full justify-start">
              💰 Configurar Preços
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">📊 Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório (PDF)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              📈 Análise Detalhada
            </Button>
            <Button variant="outline" className="w-full justify-start">
              🎯 Metas e Performance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { time: 'Há 2 horas', event: 'Nova reserva: João Silva (Quarto 401)', icon: '✅' },
              { time: 'Há 4 horas', event: 'Cancelamento: Maria Santos (Quarto 205)', icon: '❌' },
              { time: 'Há 6 horas', event: 'Check-in: Carlos Pereira (Suite 501)', icon: '👤' },
              { time: 'Há 8 horas', event: 'Check-out: Ana Costa (Quarto 302)', icon: '🚪' },
            ].map((item, index) => (
              <div key={index} className="flex gap-3 pb-3 border-b last:border-b-0">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-gray-900 font-medium">{item.event}</p>
                  <p className="text-sm text-gray-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-amber-900 text-sm">
          <p>⚠️ Taxa de ocupação baixa no fim de semana (65%)</p>
          <p>💬 5 avaliações pendentes de resposta</p>
          <p>📅 Manutenção agendada para próxima semana</p>
        </CardContent>
      </Card>
    </div>
  );
}
