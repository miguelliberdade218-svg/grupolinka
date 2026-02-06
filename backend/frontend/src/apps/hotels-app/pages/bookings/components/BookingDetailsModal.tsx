// src/apps/hotels-app/pages/bookings/components/BookingDetailsModal.tsx
import React from 'react';
import { HotelBooking } from '@/shared/types/bookings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Users as UsersIcon,
  CreditCard,
  Home,
  MapPin,
  FileText,
  Copy,
  Printer,
  Download,
  X,
  Hotel as HotelIcon,
  Building,
  Key,
  Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

interface BookingDetailsModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn?: (booking: HotelBooking) => void;
  onCheckOut?: (booking: HotelBooking) => void;
  onCancel?: (booking: HotelBooking) => void;
  onRegisterPayment?: (booking: HotelBooking) => void;
}

const getStatusConfig = (status: HotelBooking['status']) => {
  const configs = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
    checked_in: { label: 'Check-in', color: 'bg-blue-100 text-blue-800' },
    checked_out: { label: 'Check-out', color: 'bg-purple-100 text-purple-800' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    rejected: { label: 'Rejeitada', color: 'bg-gray-100 text-gray-800' },
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

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  open,
  onOpenChange,
  onCheckIn,
  onCheckOut,
  onCancel,
  onRegisterPayment,
}) => {
  if (!booking) return null;

  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentStatusConfig(booking.payment_status);
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt });
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
  
  const calculateNights = () => {
    try {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return booking.nights || 1;
    }
  };
  
  const nights = calculateNights();
  
  const canCheckIn = booking.status === 'confirmed';
  const canCheckOut = booking.status === 'checked_in';
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const canRegisterPayment = booking.payment_status === 'pending' || booking.payment_status === 'partial';
  
  const handlePrint = () => {
    const printContent = document.getElementById('booking-details-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Detalhes da Reserva - ${booking.guest_name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .section-title { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
                .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };
  
  const handleCopyDetails = async () => {
    const details = `
Reserva: ${booking.id}
Hóspede: ${booking.guest_name}
Email: ${booking.guest_email}
Telefone: ${booking.guest_phone || 'Não informado'}
Check-in: ${formatDate(booking.check_in)}
Check-out: ${formatDate(booking.check_out)}
Noites: ${nights}
Quarto: ${booking.room_type_name || 'Não especificado'}
Status: ${statusConfig.label}
Pagamento: ${paymentConfig.label}
Valor: ${formatCurrency(booking.total_price)}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(details);
      alert('Detalhes copiados para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Detalhes da Reserva</DialogTitle>
              <DialogDescription>
                ID: {booking.id}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyDetails}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="booking-details-content" className="space-y-6">
          {/* Cabeçalho com status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{booking.guest_name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn("text-sm", statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge className={cn("text-sm", paymentConfig.color)}>
                    {paymentConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {nights} {nights === 1 ? 'noite' : 'noites'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(booking.total_price)}
                </p>
                <p className="text-sm text-gray-500">Valor total</p>
              </div>
            </div>
          </div>

          {/* Grid de informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Hóspede */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informações do Hóspede
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{booking.guest_email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">{booking.guest_phone || 'Não informado'}</p>
                  </div>
                </div>
                
                {booking.user_id && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">ID do Usuário</p>
                      <p className="font-medium text-sm font-mono">{booking.user_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Datas e Estadia */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Datas da Estadia
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{formatDate(booking.check_in)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{formatDate(booking.check_out)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Duração</p>
                    <p className="font-medium">
                      {nights} {nights === 1 ? 'noite' : 'noites'}
                      {booking.nights && booking.nights !== nights && (
                        <span className="text-sm text-gray-500 ml-2">
                          (calculado: {booking.nights})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes do Quarto */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-purple-600" />
                Detalhes do Quarto
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Quarto</p>
                    <p className="font-medium">{booking.room_type_name || 'Não especificado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hóspedes</p>
                    <p className="font-medium">
                      {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                      {booking.children > 0 && `, ${booking.children} criança${booking.children !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Unidades</p>
                    <p className="font-medium">{booking.units || 1} quarto{booking.units !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                {booking.room_type_capacity && (
                  <div className="flex items-start gap-3">
                    <UsersIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Capacidade do Quarto</p>
                      <p className="font-medium">
                        {booking.room_type_capacity} pessoa{booking.room_type_capacity !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do Hotel */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-red-600" />
                Informações do Hotel
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <HotelIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">ID do Hotel</p>
                    <p className="font-medium text-sm font-mono">{booking.hotel_id}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">ID do Tipo de Quarto</p>
                    <p className="font-medium text-sm font-mono">{booking.room_type_id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <Separator />
            
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Informações Adicionais
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pedidos Especiais</p>
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[60px]">
                    <p className="text-gray-900">
                      {booking.special_requests || 'Nenhum pedido especial registrado.'}
                    </p>
                  </div>
                </div>
                
                {booking.promo_code && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Código Promocional</p>
                    <Badge variant="outline" className="text-base py-1 px-3 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {booking.promo_code}
                    </Badge>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500 mb-1">Preços</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço base:</span>
                      <span className="font-medium">{formatCurrency(booking.base_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço total:</span>
                      <span className="font-bold">{formatCurrency(booking.total_price)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Timestamps</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-700">
                      <span className="font-medium">Criada em:</span>{' '}
                      {formatDateTime(booking.created_at)}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Atualizada em:</span>{' '}
                      {formatDateTime(booking.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Informações de Pagamento */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status de Pagamento</p>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(paymentConfig.color)}>
                      {paymentConfig.label}
                    </Badge>
                    <span className="text-gray-700">
                      {formatCurrency(booking.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {canCheckIn && onCheckIn && (
                <Button
                  onClick={() => {
                    onCheckIn(booking);
                    onOpenChange(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Realizar Check-in
                </Button>
              )}
              
              {canCheckOut && onCheckOut && (
                <Button
                  onClick={() => {
                    onCheckOut(booking);
                    onOpenChange(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Realizar Check-out
                </Button>
              )}
              
              {canRegisterPayment && onRegisterPayment && (
                <Button
                  onClick={() => {
                    onRegisterPayment(booking);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Registrar Pagamento
                </Button>
              )}
              
              {canCancel && onCancel && (
                <Button
                  onClick={() => {
                    onCancel(booking);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar Reserva
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="ml-auto"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};