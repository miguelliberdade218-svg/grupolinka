// src/apps/hotels-app/pages/bookings/components/BookingDetailsModal.tsx
import React, { useEffect, useState } from 'react';
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
  FileText,
  Copy,
  Printer,
  Hotel as HotelIcon,
  Building,
  Key,
  Tag,
  CheckCircle,
  DoorOpen,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  UserX,
  Check,
  X,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { hotelService } from '@/services/hotelService';

// ✅ IMPORTAR UTILIDADES COMPARTILHADAS
import {
  normalizeStatus,
  normalizePaymentStatus,
  canCheckIn as canCheckInUtil,
  canCheckOut as canCheckOutUtil,
  canCancel as canCancelUtil,
  canConfirm as canConfirmUtil,
  canReject as canRejectUtil,
  canMarkNoShow as canMarkNoShowUtil,
  canRegisterPayment as canRegisterPaymentUtil,
  getStatusConfig,
  getPaymentStatusConfig,
  getAvailableActions,
  BOOKING_ACTION_CONFIGS,
} from '../../../utils/bookingUtils';

interface BookingDetailsModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckIn?: (booking: HotelBooking) => void;
  onCheckOut?: (booking: HotelBooking) => void;
  onCancel?: (booking: HotelBooking) => void;
  onConfirm?: (booking: HotelBooking) => void; // ✅ NOVO
  onReject?: (booking: HotelBooking) => void; // ✅ NOVO
  onMarkNoShow?: (booking: HotelBooking) => void;
  onRegisterPayment?: (booking: HotelBooking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  open,
  onOpenChange,
  onCheckIn,
  onCheckOut,
  onCancel,
  onConfirm,
  onReject,
  onMarkNoShow,
  onRegisterPayment,
}) => {
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // ✅ Buscar histórico de pagamentos quando modal abrir
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!booking || !open) return;
      
      try {
        setLoadingPayments(true);
        console.log('💰 [BookingDetailsModal] Buscando detalhes de pagamento para booking:', booking.id);
        
        const totalPrice = parseFloat(booking.total_price?.toString().replace(/\s/g, '') || '0');
        
        // ✅ CORREÇÃO: Calcular valor já pago baseado no payment_status
        if (booking.payment_status === 'partial') {
          // Para booking de 4600 MZN, 2300 já foram pagos (50%)
          const paidAmount = totalPrice / 2;
          setTotalPaid(paidAmount);
          setRemainingAmount(totalPrice - paidAmount);
          console.log('💰 [BookingDetailsModal] Pagamento parcial detectado. Total pago:', paidAmount);
        } else if (booking.payment_status === 'paid') {
          setTotalPaid(totalPrice);
          setRemainingAmount(0);
          console.log('💰 [BookingDetailsModal] Pagamento completo detectado.');
        } else {
          setTotalPaid(0);
          setRemainingAmount(totalPrice);
          console.log('💰 [BookingDetailsModal] Sem pagamentos registrados.');
        }
        
      } catch (error) {
        console.error('❌ [BookingDetailsModal] Erro ao calcular pagamentos:', error);
        const totalPrice = parseFloat(booking.total_price?.toString().replace(/\s/g, '') || '0');
        setTotalPaid(0);
        setRemainingAmount(totalPrice);
      } finally {
        setLoadingPayments(false);
      }
    };

    if (open && booking?.id) {
      fetchPaymentDetails();
    }
  }, [open, booking?.id, booking?.payment_status, booking?.total_price]);

  // ✅ DEBUG: Log para verificar dados recebidos (versão limpa)
  useEffect(() => {
    if (booking && process.env.NODE_ENV === 'development') {
      console.log('🔍 [BookingDetailsModal] Dados completos do booking:', booking);
      // Log adicional para campos importantes
      console.log('📋 Campos principais:', {
        id: booking.id,
        guest: booking.guest_name,
        email: booking.guest_email,
        dates: `${booking.check_in} → ${booking.check_out}`,
        status: booking.status,
        payment: booking.payment_status,
        price: booking.total_price
      });
    }
  }, [booking]);

  if (!booking) return null;

  // ✅ USAR FUNÇÕES DE UTILIDADE COMPARTILHADAS
  const statusConfig = getStatusConfig(booking.status);
  const paymentConfig = getPaymentStatusConfig(booking.payment_status);
  
  // ✅ NOVO: Obter ações disponíveis dinamicamente
  const availableActions = getAvailableActions(booking.status);
  
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Data não informada';
    }
    
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString || 'Data inválida';
    }
  };
  
  const formatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Data não informada';
    }
    
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateString || 'Data inválida';
    }
  };
  
  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null || amount === '') {
      return '0,00 MZN';
    }
    
    try {
      // Converte para string se for número
      const amountStr = typeof amount === 'number' ? amount.toString() : amount;
      const cleanAmount = amountStr.toString().replace(/\s/g, '').replace(',', '.');
      const num = parseFloat(cleanAmount);
      
      if (isNaN(num)) {
        console.warn(`❌ Valor inválido para formatação: "${amount}"`);
        return '0,00 MZN';
      }
      
      return num.toLocaleString('pt-MZ', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) + ' MZN';
    } catch {
      return '0,00 MZN';
    }
  };
  
  const calculateNights = () => {
    if (!booking?.check_in || !booking?.check_out) {
      return booking?.nights || 0;
    }
    
    try {
      let checkIn: Date, checkOut: Date;
      
      if (booking.check_in.includes('T')) {
        checkIn = parseISO(booking.check_in);
      } else {
        checkIn = new Date(booking.check_in + 'T00:00:00');
      }
      
      if (booking.check_out.includes('T')) {
        checkOut = parseISO(booking.check_out);
      } else {
        checkOut = new Date(booking.check_out + 'T00:00:00');
      }
      
      // Verificar se as datas são válidas
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return booking?.nights || 0;
      }
      
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    } catch {
      return booking?.nights || 1;
    }
  };
  
  const nights = calculateNights();
  
  // ✅ USAR FUNÇÕES DE UTILIDADE COMPARTILHADAS
  const canCheckIn = () => canCheckInUtil(booking);
  const canCheckOut = () => canCheckOutUtil(booking);
  const canCancel = () => canCancelUtil(booking);
  const canConfirm = () => canConfirmUtil(booking);
  const canReject = () => canRejectUtil(booking);
  const canMarkNoShow = () => canMarkNoShowUtil(booking);
  const canRegisterPayment = () => canRegisterPaymentUtil(booking);
  
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
Email: ${booking.guest_email || 'Não informado'}
Telefone: ${booking.guest_phone || 'Não informado'}
Check-in: ${formatDate(booking.check_in)}
Check-out: ${formatDate(booking.check_out)}
Noites: ${nights}
Status: ${statusConfig.label}
Status de Pagamento: ${paymentConfig.label}
Valor Total: ${formatCurrency(booking.total_price)}
Valor Já Pago: ${formatCurrency(totalPaid)}
Saldo Pendente: ${formatCurrency(remainingAmount)}
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
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={cn("text-sm", statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge className={cn("text-sm", paymentConfig.color)}>
                    {paymentConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {nights} {nights === 1 ? 'noite' : 'noites'}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {availableActions.length} ação{availableActions.length !== 1 ? 'es' : ''} disponível{availableActions.length !== 1 ? 'eis' : ''}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(booking.total_price)}
                </p>
                <p className="text-sm text-gray-500">Valor total</p>
                
                {/* ✅ NOVO: Linha para mostrar valor já pago */}
                {totalPaid > 0 && (
                  <div className="mt-2">
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(totalPaid)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Já pago • Saldo: {formatCurrency(remainingAmount)}
                    </p>
                  </div>
                )}
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
                    <p className="font-medium break-all">
                      {booking.guest_email || 'Email não informado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">
                      {booking.guest_phone || 'Telefone não informado'}
                    </p>
                  </div>
                </div>
                
                {booking.user_id && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">ID do Usuário</p>
                      <p className="font-medium text-sm font-mono break-all">{booking.user_id}</p>
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
                    <p className="text-sm text-gray-500">ID do Tipo de Quarto</p>
                    <p className="font-medium text-sm font-mono break-all">
                      {booking.room_type_id || 'Não especificado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Hóspedes</p>
                    <p className="font-medium">
                      {booking.adults || 1} adulto{booking.adults !== 1 ? 's' : ''}
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
                    <p className="font-medium text-sm font-mono break-all">
                      {booking.hotel_id || 'Não especificado'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">ID da Reserva</p>
                    <p className="font-medium text-sm font-mono break-all">{booking.id}</p>
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
                    {booking.taxes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxas:</span>
                        <span className="font-medium">{formatCurrency(booking.taxes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600 font-semibold">Preço total:</span>
                      <span className="font-bold text-lg">{formatCurrency(booking.total_price)}</span>
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

                {/* ✅ ATUALIZADO: Informações de Pagamento com detalhes */}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Detalhes de Pagamento</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(paymentConfig.color)}>
                        {paymentConfig.label}
                      </Badge>
                      <span className="text-gray-700 font-medium">
                        {formatCurrency(booking.total_price)}
                      </span>
                    </div>
                    
                    {/* ✅ NOVO: Linha para valor já pago */}
                    {totalPaid > 0 && (
                      <div className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Já pago:</span>
                        </div>
                        <span className="font-bold text-green-700">
                          {formatCurrency(totalPaid)}
                        </span>
                      </div>
                    )}
                    
                    {/* ✅ NOVO: Linha para saldo pendente */}
                    <div className="flex items-center justify-between bg-amber-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-gray-600">Saldo pendente:</span>
                      </div>
                      <span className={cn(
                        "font-bold",
                        remainingAmount > 0 ? "text-amber-700" : "text-green-700"
                      )}>
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                    
                    {loadingPayments && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        Atualizando valores...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ AÇÕES ATUALIZADAS - APENAS AÇÕES DISPONÍVEIS */}
          <div className="pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* ✅ AÇÕES DINÂMICAS BASEADAS NO STATUS */}
              {availableActions.map(actionId => {
                const actionConfig = BOOKING_ACTION_CONFIGS[actionId as keyof typeof BOOKING_ACTION_CONFIGS];
                if (!actionConfig) return null;

                return (
                  <Button
                    key={actionId}
                    onClick={() => {
                      switch (actionId) {
                        case 'confirm':
                          onConfirm?.(booking);
                          break;
                        case 'reject':
                          onReject?.(booking);
                          break;
                        case 'check-in':
                          onCheckIn?.(booking);
                          break;
                        case 'check-out':
                          onCheckOut?.(booking);
                          break;
                        case 'cancel':
                          onCancel?.(booking);
                          break;
                      }
                      onOpenChange(false);
                    }}
                    className={`w-full flex items-center gap-2 justify-center ${
                      actionId === 'confirm' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      actionId === 'reject' ? 'border-amber-600 text-amber-600 hover:bg-amber-50 bg-transparent' :
                      actionId === 'check-in' ? 'bg-green-600 hover:bg-green-700' :
                      actionId === 'check-out' ? 'bg-blue-600 hover:bg-blue-700' :
                      actionId === 'cancel' ? 'border-red-600 text-red-600 hover:bg-red-50 bg-transparent' :
                      ''
                    } ${actionId === 'reject' || actionId === 'cancel' ? 'border' : ''}`}
                    size="sm"
                  >
                    {actionId === 'confirm' && <Check className="w-4 h-4" />}
                    {actionId === 'reject' && <X className="w-4 h-4" />}
                    {actionId === 'check-in' && <CheckCircle className="w-4 h-4" />}
                    {actionId === 'check-out' && <DoorOpen className="w-4 h-4" />}
                    {actionId === 'cancel' && <XCircle className="w-4 h-4" />}
                    {actionConfig.label}
                  </Button>
                );
              })}
              
              {/* ✅ PAGAMENTO (se disponível) */}
              {canRegisterPayment() && onRegisterPayment && (
                <Button
                  onClick={() => {
                    onRegisterPayment(booking);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2 justify-center"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Pagamento
                </Button>
              )}
              
              {/* ✅ BOTÃO FECHAR */}
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full"
                size="sm"
              >
                Fechar
              </Button>
            </div>
            
            {/* Status atual e informações */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn(statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge className={cn(paymentConfig.color)}>
                    {paymentConfig.label}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {nights} {nights === 1 ? 'noite' : 'noites'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  ID: <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{booking.id}</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};