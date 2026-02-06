// src/apps/hotels-app/pages/bookings/components/BookingList.tsx
import React, { useState } from 'react';
import { HotelBooking } from '@/shared/types/bookings';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Users as UsersIcon,
  CreditCard,
  MoreVertical,
  Eye,
  CheckCircle,
  DoorOpen,
  LogOut,
  XCircle,
  FileText,
  RefreshCw,
  Hotel
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface BookingListProps {
  bookings: HotelBooking[];
  loading?: boolean;
  onViewDetails: (booking: HotelBooking) => void;
  onCheckIn: (booking: HotelBooking) => void;
  onCheckOut: (booking: HotelBooking) => void;
  onCancel: (booking: HotelBooking) => void;
  onRegisterPayment: (booking: HotelBooking) => void;
}

const getStatusConfig = (status: HotelBooking['status']) => {
  const configs = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-green-200' },
    checked_in: { label: 'Check-in', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    checked_out: { label: 'Check-out', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200' },
    rejected: { label: 'Rejeitada', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  return configs[status] || configs.pending;
};

const getPaymentStatusConfig = (status: HotelBooking['payment_status']) => {
  const configs = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  };
  return configs[status] || configs.pending;
};

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  loading = false,
  onViewDetails,
  onCheckIn,
  onCheckOut,
  onCancel,
  onRegisterPayment,
}) => {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) 
      ? '0,00 MZN' 
      : num.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MZN';
  };

  const canCheckIn = (booking: HotelBooking) => {
    return booking.status === 'confirmed';
  };

  const canCheckOut = (booking: HotelBooking) => {
    return booking.status === 'checked_in';
  };

  const canCancel = (booking: HotelBooking) => {
    return ['pending', 'confirmed'].includes(booking.status);
  };

  // ✅ CORREÇÃO: Verifica se pode mostrar botão de pagamento
  const canRegisterPayment = (booking: HotelBooking) => {
    // Mostra botão se o status de pagamento for 'pending' ou 'partial'
    return booking.payment_status === 'pending' || booking.payment_status === 'partial';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
        <p className="text-gray-600 mb-6">
          Não há reservas que correspondam aos seus filtros atuais.
        </p>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar página
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const statusConfig = getStatusConfig(booking.status);
        const paymentConfig = getPaymentStatusConfig(booking.payment_status);
        const isExpanded = expandedBookingId === booking.id;
        const today = new Date();
        const checkInDate = new Date(booking.check_in);
        const isUpcoming = checkInDate > today;
        const isToday = 
          checkInDate.getDate() === today.getDate() &&
          checkInDate.getMonth() === today.getMonth() &&
          checkInDate.getFullYear() === today.getFullYear();

        return (
          <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-all">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Informações principais */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {booking.guest_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("border", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                        <Badge className={cn("border", paymentConfig.color)}>
                          {paymentConfig.label}
                        </Badge>
                        {isToday && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Hoje
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Futura
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(booking.total_price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.nights || 1} {booking.nights === 1 ? 'noite' : 'noites'}
                      </p>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Check-in:</span>
                        <span className="text-gray-900">{formatDate(booking.check_in)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Check-out:</span>
                        <span className="text-gray-900">{formatDate(booking.check_out)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UsersIcon className="w-4 h-4" />
                        <span className="font-medium">Hóspedes:</span>
                        <span className="text-gray-900">
                          {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                          {booking.children > 0 && `, ${booking.children} criança${booking.children !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hotel className="w-4 h-4" />
                        <span className="font-medium">Quarto:</span>
                        <span className="text-gray-900">
                          {booking.room_type_name || 'Tipo de quarto'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">Email:</span>
                        <span className="text-gray-900 truncate">{booking.guest_email}</span>
                      </div>
                      {booking.guest_phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span className="font-medium">Telefone:</span>
                          <span className="text-gray-900">{booking.guest_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(booking)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </Button>
                    
                    {canCheckIn(booking) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onCheckIn(booking)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Check-in
                      </Button>
                    )}
                    
                    {canCheckOut(booking) && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onCheckOut(booking)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <DoorOpen className="w-4 h-4" />
                        Check-out
                      </Button>
                    )}
                    
                    {/* ✅ CORREÇÃO: Usa a função auxiliar que não verifica 'refunded' */}
                    {canRegisterPayment(booking) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRegisterPayment(booking)}
                        className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagamento
                      </Button>
                    )}
                    
                    {canCancel(booking) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel(booking)}
                        className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Menu dropdown para ações adicionais */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(booking)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes completos
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(booking.id);
                      // Opcional: Mostrar toast de confirmação
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      Copiar ID da reserva
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => toggleExpand(booking.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => window.open(`mailto:${booking.guest_email}`, '_blank')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar email
                    </DropdownMenuItem>
                    
                    {booking.guest_phone && (
                      <DropdownMenuItem 
                        onClick={() => window.open(`tel:${booking.guest_phone}`, '_blank')}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Ligar para hóspede
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Informações expandidas */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Informações Adicionais</h5>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">ID da Reserva:</span>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {booking.id}
                          </code>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Criada em:</span>{' '}
                          {formatDateTime(booking.created_at)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Atualizada em:</span>{' '}
                          {formatDateTime(booking.updated_at)}
                        </p>
                        {booking.special_requests && (
                          <p className="text-gray-600">
                            <span className="font-medium">Pedidos especiais:</span>{' '}
                            <span className="italic">{booking.special_requests}</span>
                          </p>
                        )}
                        {booking.promo_code && (
                          <p className="text-gray-600">
                            <span className="font-medium">Código promocional:</span>{' '}
                            <Badge variant="outline" className="ml-1">
                              {booking.promo_code}
                            </Badge>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Detalhes do Quarto</h5>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Unidades reservadas:</span> {booking.units || 1}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Preço base:</span>{' '}
                          {formatCurrency(booking.base_price)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Preço total:</span>{' '}
                          {formatCurrency(booking.total_price)}
                        </p>
                        {booking.room_type_capacity && (
                          <p className="text-gray-600">
                            <span className="font-medium">Capacidade do quarto:</span>{' '}
                            {booking.room_type_capacity} pessoa{booking.room_type_capacity !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};