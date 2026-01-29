// src/apps/hotels-app/components/event-spaces/BookingStats.tsx	
import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface BookingStatsProps {
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
    pendingRevenue: number;
    averageBookingValue: number;
    occupancyRate?: number;
    upcomingEvents?: number;
  };
}

export const BookingStats: React.FC<BookingStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const getTrendIcon = (value: number, comparisonValue?: number) => {
    if (!comparisonValue) return null;
    if (value > comparisonValue) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (value < comparisonValue) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {/* Total de Reservas */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-sm text-gray-600">Total Reservas</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.upcomingEvents ? `${stats.upcomingEvents} próximas` : 'Sem dados comparativos'}
        </div>
      </Card>

      {/* Pendentes */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
        <div className="text-sm text-gray-600">Pendentes</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.pending > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}% do total` : 'Sem pendentes'}
        </div>
      </Card>

      {/* Confirmadas */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
        <div className="text-sm text-gray-600">Confirmadas</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.confirmed > 0 ? `${((stats.confirmed / stats.total) * 100).toFixed(1)}% do total` : 'Sem confirmadas'}
        </div>
      </Card>

      {/* Canceladas */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
        <div className="text-sm text-gray-600">Canceladas</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.cancelled > 0 ? `${((stats.cancelled / stats.total) * 100).toFixed(1)}% do total` : 'Sem canceladas'}
        </div>
      </Card>

      {/* Receita Total */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-600">
          {formatCurrency(stats.revenue)}
        </div>
        <div className="text-sm text-gray-600">Receita Total</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.averageBookingValue > 0 ? `Média: ${formatCurrency(stats.averageBookingValue)}` : 'Sem média'}
        </div>
      </Card>

      {/* Receita Pendente */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Clock className="h-6 w-6 text-orange-600" />
        </div>
        <div className="text-2xl font-bold text-orange-600">
          {formatCurrency(stats.pendingRevenue)}
        </div>
        <div className="text-sm text-gray-600">Receita Pendente</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.revenue > 0 ? `${((stats.pendingRevenue / stats.revenue) * 100).toFixed(1)}% da receita` : 'Sem receita'}
        </div>
      </Card>

      {/* Taxa de Ocupação */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="h-6 w-6 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-600">
          {stats.occupancyRate ? `${stats.occupancyRate}%` : 'N/A'}
        </div>
        <div className="text-sm text-gray-600">Taxa de Ocupação</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.occupancyRate ? 'Baseada em disponibilidade' : 'Dados insuficientes'}
        </div>
      </Card>

      {/* Valor Médio */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="h-6 w-6 text-cyan-600" />
        </div>
        <div className="text-2xl font-bold text-cyan-600">
          {formatCurrency(stats.averageBookingValue)}
        </div>
        <div className="text-sm text-gray-600">Valor Médio</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.total > 0 ? `Baseado em ${stats.total} reservas` : 'Sem dados'}
        </div>
      </Card>
    </div>
  );
};

export default BookingStats;
