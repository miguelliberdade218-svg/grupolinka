// src/apps/hotels-app/pages/bookings/components/CancelBookingModal.tsx
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
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

interface CancelBookingModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (booking: HotelBooking, reason: string) => Promise<void>;
}

const predefinedReasons = [
  'Hóspede solicitou cancelamento',
  'Hotel sobrelotado',
  'Problemas técnicos',
  'Dados inválidos fornecidos',
  'Falta de pagamento',
  'Outro motivo',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Por favor, selecione ou especifique um motivo');
      return;
    }

    const finalReason = reason === 'Outro motivo' ? customReason : reason;
    
    if (!finalReason.trim()) {
      setError('Por favor, especifique o motivo do cancelamento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(booking, finalReason);
      // Reset form on success
      setReason('');
      setCustomReason('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao cancelar reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleReasonSelect = (selectedReason: string) => {
    setReason(selectedReason);
    setError('');
    
    if (selectedReason !== 'Outro motivo') {
      setCustomReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Cancelar Reserva
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A reserva será cancelada e as unidades serão liberadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerta de confirmação */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Atenção!</h4>
                <p className="text-sm text-red-700 mt-1">
                  Você está prestes a cancelar a reserva de <strong>{booking.guest_name}</strong>.
                  Esta ação irá:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Mudar o status para "cancelada"</li>
                  <li>Liberar as unidades reservadas</li>
                  <li>Notificar o hóspede por email</li>
                  <li>Registrar o motivo do cancelamento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Informações da reserva */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Hóspede</p>
                <p className="font-medium">{booking.guest_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-in</p>
                <p className="font-medium">{booking.check_in}</p>
              </div>
              <div>
                <p className="text-gray-500">Quarto</p>
                <p className="font-medium">{booking.room_type_name || 'Não especificado'}</p>
              </div>
              <div>
                <p className="text-gray-500">Valor</p>
                <p className="font-medium">
                  {parseFloat(booking.total_price || '0').toLocaleString('pt-MZ', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} MZN
                </p>
              </div>
            </div>
          </div>

          {/* Motivo do cancelamento */}
          <div className="space-y-3">
            <Label htmlFor="reason">
              Motivo do Cancelamento
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            <div className="grid grid-cols-2 gap-2">
              {predefinedReasons.map((predefinedReason) => (
                <Button
                  key={predefinedReason}
                  type="button"
                  variant={reason === predefinedReason ? "default" : "outline"}
                  onClick={() => handleReasonSelect(predefinedReason)}
                  className={`justify-start h-auto py-2 px-3 text-left ${
                    reason === predefinedReason 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'hover:bg-gray-50'
                  }`}
                  disabled={loading}
                >
                  {predefinedReason}
                </Button>
              ))}
            </div>
            
            {reason === 'Outro motivo' && (
              <div className="mt-3">
                <Textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    setError('');
                  }}
                  placeholder="Especifique o motivo do cancelamento..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            )}
            
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="sm:order-1"
          >
            Manter Reserva
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 sm:order-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Confirmar Cancelamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};