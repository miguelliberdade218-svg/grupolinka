// src/apps/hotels-app/pages/bookings/components/RejectBookingModal.tsx
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
  AlertTriangle,
  XCircle,
  Info,
  Calendar,
  User,
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

interface RejectBookingModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (booking: HotelBooking, reason: string) => void;
}

export const RejectBookingModal: React.FC<RejectBookingModalProps> = ({
  booking,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
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

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Por favor, informe o motivo da rejeição');
      return;
    }

    if (reason.trim().length < 10) {
      setError('O motivo deve ter pelo menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(booking, reason.trim());
      // Reset form on success
      setReason('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao rejeitar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <XCircle className="w-5 h-5" />
            Rejeitar Reserva
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes e informe o motivo para rejeitar esta reserva
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da reserva */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  Você está prestes a rejeitar uma reserva
                </p>
                <p className="text-sm text-amber-800">
                  Esta ação marcará a reserva como cancelada e notificará o hóspede.
                  Certifique-se de que esta é a ação correta.
                </p>
              </div>
            </div>
          </div>

          {/* Detalhes da reserva */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Detalhes da Reserva</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Hóspede:</span>
                </div>
                <p className="text-gray-900 font-medium">{booking.guest_name}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Período:</span>
                </div>
                <p className="text-gray-900">
                  {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {booking.nights || 1} {booking.nights === 1 ? 'noite' : 'noites'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          {/* Motivo da rejeição */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="reason" className="text-gray-900">
                Motivo da Rejeição *
              </Label>
              <span className={cn(
                "text-xs",
                reason.length >= 10 ? "text-green-600" : "text-gray-500"
              )}>
                {reason.length}/10 caracteres mínimos
              </span>
            </div>
            
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da rejeição da reserva. Esta informação será registrada e poderá ser visualizada posteriormente."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              className={cn(
                "min-h-[120px] resize-y",
                error && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Info className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
            
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">Sugestões de motivos:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Disponibilidade indisponível para o período solicitado</li>
                <li>Hóspede não atende aos requisitos do hotel</li>
                <li>Problemas com informações de pagamento</li>
                <li>Requisitos especiais não podem ser atendidos</li>
              </ul>
            </div>
          </div>

          {/* Consequências */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Consequências desta ação:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• A reserva será marcada como "Cancelada"</li>
                  <li>• O hóspede receberá uma notificação por email</li>
                  <li>• O quarto ficará disponível para outras reservas</li>
                  <li>• O motivo será registrado para referência futura</li>
                </ul>
              </div>
            </div>
          </div>
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
            className="sm:w-1/2 bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Rejeitando...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Confirmar Rejeição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};