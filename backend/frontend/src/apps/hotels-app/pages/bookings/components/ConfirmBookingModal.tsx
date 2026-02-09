// src/apps/hotels-app/pages/bookings/components/ConfirmBookingModal.tsx
import React, { useState } from 'react';
import { HotelBooking } from '@/shared/types/bookings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  CheckCircle,
  Info,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  Bed,
  Clock,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import { Separator } from '@/shared/components/ui/separator';

interface ConfirmBookingModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (booking: HotelBooking) => void;
}

export const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({
  booking,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return '0,00 MZN';
      return num.toLocaleString('pt-MZ', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) + ' MZN';
    } catch {
      return '0,00 MZN';
    }
  };

  const calculateNights = () => {
    try {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    } catch {
      return booking.nights || 1;
    }
  };

  const nights = calculateNights();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(booking);
      // Reset form on success
      setNotes('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao confirmar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNotes('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            Confirmar Reserva
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes e confirme esta reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Banner de confirmação */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-emerald-900">
                  Confirmar Reserva #{booking.id.slice(0, 8)}
                </p>
                <p className="text-sm text-emerald-800">
                  Ao confirmar, a reserva será ativada e o hóspede será notificado.
                  Certifique-se de que todos os detalhes estão corretos.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da reserva */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-lg">Resumo da Reserva</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Informações do Hóspede */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Hóspede:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{booking.guest_name}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium">Email:</span>
                  </div>
                  <p className="text-gray-900 break-all">{booking.guest_email}</p>
                </div>
                
                {booking.guest_phone && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium">Telefone:</span>
                    </div>
                    <p className="text-gray-900">{booking.guest_phone}</p>
                  </div>
                )}
              </div>

              {/* Informações da Estadia */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Check-in:</span>
                  </div>
                  <p className="text-gray-900">{formatDate(booking.check_in)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Check-out:</span>
                  </div>
                  <p className="text-gray-900">{formatDate(booking.check_out)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Bed className="w-4 h-4" />
                    <span className="font-medium">Noites:</span>
                  </div>
                  <p className="text-gray-900">
                    {nights} {nights === 1 ? 'noite' : 'noites'}
                  </p>
                </div>
              </div>
            </div>

            {/* Badges de status */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                ID: {booking.id.slice(0, 8)}...
              </Badge>
              <Badge variant="outline" className="text-sm">
                {booking.units || 1} quarto{booking.units !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
              </Badge>
              {booking.children > 0 && (
                <Badge variant="outline" className="text-sm">
                  {booking.children} criança{booking.children !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Informações financeiras */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Informações Financeiras</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Preço base ({nights} noites):</span>
                <span className="font-medium">{formatCurrency(booking.base_price)}</span>
              </div>
              
              {booking.taxes && parseFloat(booking.taxes) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxas:</span>
                  <span className="font-medium">{formatCurrency(booking.taxes)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-semibold">Valor Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(booking.total_price)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Status do pagamento: <span className="font-medium capitalize">{booking.payment_status}</span>
              </span>
            </div>
          </div>

          {/* Notas adicionais */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-gray-900">
              Notas Adicionais (Opcional)
            </Label>
            
            <Textarea
              id="notes"
              placeholder="Adicione alguma observação sobre a confirmação. Ex: 'Confirmado por telefone', 'Hóspede solicitou cama extra', etc."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError(null);
              }}
              className="min-h-[80px] resize-y"
            />
            
            {booking.special_requests && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-1">Pedidos Especiais:</p>
                <p className="text-sm text-gray-700">{booking.special_requests}</p>
              </div>
            )}

            {booking.promo_code && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Código promocional: {booking.promo_code}
                </Badge>
              </div>
            )}
          </div>

          {/* Informações técnicas */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Informações Técnicas:</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Criada em: {formatDateTime(booking.created_at)}</p>
                  <p>ID do Hotel: {booking.hotel_id}</p>
                  <p>ID do Tipo de Quarto: {booking.room_type_id}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="sm:w-1/2"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="sm:w-1/2 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Reserva
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};