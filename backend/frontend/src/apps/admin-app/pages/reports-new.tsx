// src/apps/admin-app/pages/reports-new.tsx - Relatórios e Estatísticas Administrativas
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Users, Home, FileText } from 'lucide-react';

export default function AdminReports() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const [bookingStats, setBookingStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Estatísticas gerais por período
      const statsRes = await fetch(
        `/api/admin/dashboard/stats-period?startDate=${startDate}&endDate=${endDate}&period=${period}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      // Estatísticas de pagamentos
      const payRes = await fetch(
        `/api/admin/payments/stats-period?startDate=${startDate}&endDate=${endDate}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (payRes.ok) {
        const data = await payRes.json();
        setPaymentStats(data.data);
      }

      // Estatísticas de estadias
      const bookRes = await fetch(
        `/api/admin/bookings/stats?startDate=${startDate}&endDate=${endDate}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (bookRes.ok) {
        const data = await bookRes.json();
        setBookingStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📊 Relatórios e Estatísticas</h1>

        {/* Período Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corridas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newRides || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estadias (Hotéis)</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats?.periodBookings || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MZN {parseFloat(stats?.revenue || '0').toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pagamentos Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><span className="text-gray-600">Total:</span> <span className="font-bold">MZN {parseFloat(paymentStats?.confirmed?.total || '0').toFixed(2)}</span></div>
              <div><span className="text-gray-600">Quantidade:</span> <span className="font-bold">{paymentStats?.confirmed?.count || 0}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pagamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><span className="text-gray-600">Total:</span> <span className="font-bold text-orange-600">MZN {parseFloat(paymentStats?.pending?.total || '0').toFixed(2)}</span></div>
              <div><span className="text-gray-600">Quantidade:</span> <span className="font-bold">{paymentStats?.pending?.count || 0}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total de Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><span className="text-gray-600">Valor:</span> <span className="font-bold text-green-600">MZN {(parseFloat(paymentStats?.confirmed?.total || '0') + parseFloat(paymentStats?.pending?.total || '0')).toFixed(2)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="Receita (MZN)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings & Rides */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade (Corridas vs Estadias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newRides" fill="#3b82f6" name="Corridas" />
                <Bar dataKey="hotelBookings" fill="#10b981" name="Estadias" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p><span className="font-semibold">Período:</span> {startDate} até {endDate}</p>
              <p><span className="font-semibold">Novos Usuários:</span> {stats?.totalUsers || 0}</p>
              <p><span className="font-semibold">Corridas Registadas:</span> {stats?.newRides || 0}</p>
            </div>
            <div className="space-y-3">
              <p><span className="font-semibold">Estadias Registadas:</span> {bookingStats?.periodBookings || 0}</p>
              <p><span className="font-semibold">Receita Total:</span> MZN {(parseFloat(stats?.revenue || '0')).toFixed(2)}</p>
              <p><span className="font-semibold">Pagamentos Processados:</span> {(paymentStats?.confirmed?.count || 0) + (paymentStats?.pending?.count || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
