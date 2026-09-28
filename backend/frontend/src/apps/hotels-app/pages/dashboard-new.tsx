import React from 'react';
import { useHotelData } from '../hooks/useHotelData';
import { useAuth } from '@/contexts/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Calendar,
  DoorOpen,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  AlertCircle,
  Plus,
  Clock,
} from 'lucide-react';

export default function HotelsDashboard() {
  const { user } = useAuth();
  const {
    hotelData,
    rooms,
    reservations,
    earnings,
    loading,
  } = useHotelData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get upcoming reservations
  const upcomingReservations = reservations
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .slice(0, 5);

  // Get rooms availability
  const availableRooms = rooms.filter((r) => r.available).length;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo a {hotelData?.name}! 🏨
        </h1>
        <p className="text-gray-600 mt-2">
          {hotelData?.verified ? '✅ Verificado' : '⏳ Verificação Pendente'}
        </p>
      </div>

      {/* KPI Cards */}
      {hotelData && earnings && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ocupação</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {(hotelData.occupancyRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de capacidade</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Quartos Livres</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {availableRooms}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de {rooms.length}</p>
                </div>
                <DoorOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Ganhos Mês</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {earnings.earningsThisMonth.toLocaleString('pt-MZ', {
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
                  <p className="text-gray-600 text-sm">Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {hotelData.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {hotelData.totalReviews} avaliações
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {!hotelData?.verified && (
        <Card className="bg-yellow-50 border-yellow-200 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">Verificação Pendente</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Finalize a verificação para aceitar reservas de clientes.
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
          Adicionar Novo Quarto
        </Button>
        <Button variant="outline" className="h-12 text-base">
          <TrendingUp className="w-5 h-5 mr-2" />
          Ver Análise de Vendas
        </Button>
      </div>

      {/* Upcoming Reservations */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Próximas Reservas</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Ver Todas
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingReservations && upcomingReservations.length > 0 ? (
            <div className="space-y-3">
              {upcomingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="p-4 border rounded-lg hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {reservation.guestName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quarto {reservation.roomNumber} ({reservation.roomType})
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reservation.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : reservation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {reservation.status === 'pending'
                        ? 'Pendente'
                        : reservation.status === 'confirmed'
                        ? 'Confirmada'
                        : 'Check-in'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(reservation.checkIn).toLocaleDateString('pt-MZ')}
                      {' → '}
                      {new Date(reservation.checkOut).toLocaleDateString('pt-MZ')}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {reservation.totalNights} noite(s)
                    </span>
                    <span className="text-green-600 font-bold">
                      {reservation.totalPrice.toLocaleString('pt-MZ', {
                        style: 'currency',
                        currency: 'MZN',
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Gerenciar
                    </Button>
                    <Button size="sm" variant="outline">
                      💬 Mensagem
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>Nenhuma reserva nos próximos dias</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Gerenciar Tarifas
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
                <p className="text-xs text-gray-600">Média/Reserva</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {earnings.averagePerReservation.toLocaleString('pt-MZ', {
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

      {/* Rooms Overview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quartos ({rooms.length})</span>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Quarto
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rooms && rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rooms.slice(0, 6).map((room) => (
                <div key={room.id} className="p-4 border rounded-lg hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Quarto {room.number}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">{room.type}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        room.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {room.available ? 'Livre' : 'Ocupado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>💰 {room.pricePerNight.toLocaleString('pt-MZ', {
                      style: 'currency',
                      currency: 'MZN',
                    })}/noite</p>
                    <p>👥 Capacidade: {room.capacity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>Nenhum quarto cadastrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
