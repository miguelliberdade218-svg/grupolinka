// src/apps/hotels-app/pages/bookings/components/BookingStats.tsx
import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { HotelBooking } from '@/shared/types/bookings';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BookingStatsProps {
  bookings: HotelBooking[];
  loading?: boolean;
}

export const BookingStats: React.FC<BookingStatsProps> = ({ bookings, loading = false }) => {
  const stats = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return bookings.reduce((acc, booking) => {
      // Total de reservas
      acc.totalBookings++;
      
      // Por status
      if (booking.status === 'confirmed') acc.confirmed++;
      if (booking.status === 'pending') acc.pending++;
      if (booking.status === 'checked_in') acc.checkedIn++;
      if (booking.status === 'checked_out') acc.checkedOut++;
      if (booking.status === 'cancelled' || booking.status === 'rejected') acc.cancelled++;
      
      // Por status de pagamento
      if (booking.payment_status === 'paid') acc.paid++;
      if (booking.payment_status === 'partial') acc.partial++;
      if (booking.payment_status === 'pending') acc.pendingPayment++;
      
      // Receita
      const price = parseFloat(booking.total_price) || 0;
      acc.totalRevenue += price;
      
      if (booking.payment_status === 'paid') {
        acc.paidRevenue += price;
      }
      
      // Check-ins hoje
      const checkInDate = new Date(booking.check_in);
      if (
        checkInDate.getFullYear() === today.getFullYear() &&
        checkInDate.getMonth() === today.getMonth() &&
        checkInDate.getDate() === today.getDate() &&
        booking.status === 'confirmed'
      ) {
        acc.checkInsToday++;
      }
      
      // Check-outs hoje
      const checkOutDate = new Date(booking.check_out);
      if (
        checkOutDate.getFullYear() === today.getFullYear() &&
        checkOutDate.getMonth() === today.getMonth() &&
        checkOutDate.getDate() === today.getDate() &&
        booking.status === 'checked_in'
      ) {
        acc.checkOutsToday++;
      }
      
      return acc;
    }, {
      totalBookings: 0,
      confirmed: 0,
      pending: 0,
      checkedIn: 0,
      checkedOut: 0,
      cancelled: 0,
      paid: 0,
      partial: 0,
      pendingPayment: 0,
      totalRevenue: 0,
      paidRevenue: 0,
      checkInsToday: 0,
      checkOutsToday: 0,
    });
  }, [bookings]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Reservas',
      value: stats.totalBookings,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats.confirmed} confirmadas`,
    },
    {
      title: 'Receita Total',
      value: `MZN ${stats.totalRevenue.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `${stats.paidRevenue.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recebidos`,
    },
    {
      title: 'Pagamentos',
      value: `${stats.paid} pagos`,
      icon: CreditCard,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `${stats.pendingPayment} pendentes`,
    },
    {
      title: 'Hoje',
      value: `${stats.checkInsToday} check-ins`,
      icon: CalendarCheck,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: `${stats.checkOutsToday} check-outs`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className={`p-4 md:p-6 ${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-all`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className={`text-2xl md:text-3xl font-bold ${stat.textColor} mb-2`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
          </div>
          
          {/* Barra de progresso para alguns stats */}
          {index === 0 && stats.totalBookings > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Taxa de ocupação</span>
                <span>{Math.round((stats.checkedIn / stats.totalBookings) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(stats.checkedIn / stats.totalBookings) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {index === 2 && stats.totalBookings > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Taxa de pagamento</span>
                <span>{Math.round((stats.paid / stats.totalBookings) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(stats.paid / stats.totalBookings) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};