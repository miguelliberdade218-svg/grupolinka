import React from 'react';
import { useDriverData } from '../hooks/useDriverData';
import { useAuth } from '../../../contexts/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import {
  MapPin,
  Plus,
  Star,
  DollarSign,
  TrendingUp,
  Users,
  Navigation,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function DriversDashboard() {
  const { user } = useAuth();
  const { driverData, routes, earnings, loading } = useDriverData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {driverData?.verified ? '✅ Verificado' : '⏳ Verificação Pendente'}
        </p>
      </div>

      {/* KPI Cards */}
      {driverData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {driverData.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de {driverData.totalRides} viagens</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Rotas Ativas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {driverData.activeRoutes}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">publicadas</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ganhos Mês</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {earnings?.earningsThisMonth.toLocaleString('pt-MZ', {
                      style: 'currency',
                      currency: 'MZN',
                    })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Viagens</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {driverData.totalRides}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {earnings?.ridesToday} hoje
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {!driverData?.verified && (
        <Card className="bg-yellow-50 border-yellow-200 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">Verificação Pendente</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Finalize a verificação para começar a aceitar passageiros.
                </p>
                <Button className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                  Completar Verificação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700 h-12 text-base">
          <Plus className="w-5 h-5 mr-2" />
          Publicar Nova Rota
        </Button>
        <Button variant="outline" className="h-12 text-base">
          <Navigation className="w-5 h-5 mr-2" />
          Ver Oportunidades
        </Button>
      </div>

      {/* Active Routes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Minhas Rotas Ativas</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Nova Rota
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes && routes.length > 0 ? (
            <div className="space-y-3">
              {routes
                .filter((r) => r.status === 'active')
                .slice(0, 5)
                .map((route) => (
                  <div
                    key={route.id}
                    className="p-4 border rounded-lg hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {route.from} → {route.to}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {route.pricePerSeat.toLocaleString('pt-MZ', {
                          style: 'currency',
                          currency: 'MZN',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(route.departureTime).toLocaleString('pt-MZ')}
                      </span>
                      <span>
                        {route.availableSeats} de {route.totalSeats} lugares
                      </span>
                      <span className="text-blue-600 font-semibold">
                        {route.requests} solicitações
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Gerenciar
                      </Button>
                      <Button size="sm" variant="outline">
                        💬 Chat ({route.requests})
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>Nenhuma rota ativa no momento</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Primeira Rota
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      {earnings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumo de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Este Mês</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {earnings.earningsThisMonth.toLocaleString('pt-MZ', {
                    style: 'currency',
                    currency: 'MZN',
                  })}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Mês Passado</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {earnings.earningsLastMonth.toLocaleString('pt-MZ', {
                    style: 'currency',
                    currency: 'MZN',
                  })}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Média/Rota</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {earnings.averagePerRide.toLocaleString('pt-MZ', {
                    style: 'currency',
                    currency: 'MZN',
                  })}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-900">Pendente Saque</p>
                <p className="text-lg font-bold text-yellow-900 mt-1">
                  {earnings.pending.toLocaleString('pt-MZ', {
                    style: 'currency',
                    currency: 'MZN',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
