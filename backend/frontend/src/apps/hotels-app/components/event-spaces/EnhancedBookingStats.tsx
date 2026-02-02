// src/apps/hotels-app/components/event-spaces/EnhancedBookingStats.tsx
import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Users,
  Calendar,
  Wallet,
  BarChart,
  AlertCircle
} from 'lucide-react';

interface BookingStatsData {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  pendingRevenue: number;
  averageBookingValue: number;
}

interface EnhancedBookingStatsProps {
  stats: BookingStatsData;
  period: string;
  isLoading?: boolean;
}

export const EnhancedBookingStats: React.FC<EnhancedBookingStatsProps> = ({
  stats,
  period,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      'all': 'Todo o período',
      'year': 'Este ano',
      'month': 'Este mês',
      'week': 'Esta semana',
      'today': 'Hoje',
      'custom': 'Período personalizado'
    };
    return labels[period] || period;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Reservas Ativas',
      value: stats.total,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: `Total de reservas (exclui canceladas)`,
      trend: null,
    },
    {
      title: 'Receita Confirmada',
      value: formatCurrency(stats.revenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Valor já pago/confirmado',
      trend: stats.averageBookingValue > 0 ? `Média: ${formatCurrency(stats.averageBookingValue)}/reserva` : null,
    },
    {
      title: 'Receita Pendente',
      value: formatCurrency(stats.pendingRevenue),
      icon: <Wallet className="h-5 w-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      description: 'A receber de reservas ativas',
      trend: stats.revenue > 0 
        ? `${((stats.pendingRevenue / (stats.revenue + stats.pendingRevenue)) * 100).toFixed(1)}% da receita total`
        : null,
    },
    {
      title: 'Status das Reservas',
      value: `${stats.confirmed + stats.completed}/${stats.total}`,
      icon: <BarChart className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: 'Confirmadas/Concluídas',
      trend: stats.total > 0 
        ? `${(((stats.confirmed + stats.completed) / stats.total) * 100).toFixed(0)}% confirmadas`
        : null,
    },
  ];

  const statusCards = [
    {
      title: 'Aguardando Aprovação',
      value: stats.pending,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-blue-600',
      variant: 'outline' as const,
    },
    {
      title: 'Confirmadas',
      value: stats.confirmed,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      variant: 'outline' as const,
    },
    {
      title: 'Concluídas',
      value: stats.completed,
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-purple-600',
      variant: 'outline' as const,
    },
    {
      title: 'Canceladas/Rejeitadas',
      value: stats.cancelled,
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Período */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Estatísticas: <span className="text-blue-600">{getPeriodLabel()}</span>
          </span>
        </div>
        {stats.pendingRevenue > 0 && (
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            {formatCurrency(stats.pendingRevenue)} pendentes
          </Badge>
        )}
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <Card 
            key={index} 
            className={`p-5 border ${card.borderColor} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {card.title.includes('Receita') ? 'Financeiro' : 'Reservas'}
              </Badge>
            </div>
            
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-600 mt-1">{card.description}</div>
            </div>
            
            {card.trend && (
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {card.trend}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Status das Reservas */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Distribuição por Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statusCards.map((status, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={status.color}>{status.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{status.title}</span>
                </div>
                <Badge variant={status.variant} className={status.color}>
                  {status.value}
                </Badge>
              </div>
              {stats.total > 0 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status.color.replace('text-', 'bg-')}`}
                      style={{ width: `${(status.value / stats.total) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {((status.value / stats.total) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Resumo Financeiro */}
      <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(stats.revenue)}</div>
            <div className="text-sm text-gray-600">Receita Realizada</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600">{formatCurrency(stats.pendingRevenue)}</div>
            <div className="text-sm text-gray-600">Receita Pendente</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.revenue + stats.pendingRevenue)}
            </div>
            <div className="text-sm text-gray-600">Receita Total (Ativa)</div>
          </div>
        </div>
        {stats.revenue + stats.pendingRevenue > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Realizada: {formatCurrency(stats.revenue)}</span>
              <span>Pendente: {formatCurrency(stats.pendingRevenue)}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ 
                  width: `${(stats.revenue / (stats.revenue + stats.pendingRevenue)) * 100}%` 
                }}
              />
              <div 
                className="h-full bg-amber-500 -mt-3"
                style={{ 
                  width: `${(stats.pendingRevenue / (stats.revenue + stats.pendingRevenue)) * 100}%`,
                  marginLeft: `${(stats.revenue / (stats.revenue + stats.pendingRevenue)) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EnhancedBookingStats;