// src/apps/hotels-app/components/event-spaces/CancelConfirmationModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle: string;
  depositPaid: number;
  onConfirm: (reason: string) => Promise<void>;
}

export const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  open,
  onClose,
  bookingId,
  bookingTitle,
  depositPaid,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo do cancelamento',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
      setReason('');
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Confirmar Cancelamento
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O sistema processará automaticamente qualquer reembolso necessário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da reserva */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-medium">{bookingTitle}</div>
            <div className="text-xs text-gray-600">ID: {bookingId.slice(0, 8)}...</div>
          </div>

          {/* Aviso sobre reembolso */}
          {depositPaid > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span className="text-sm text-amber-800">
                  Esta reserva tem um depósito de {depositPaid.toLocaleString('pt-MZ', {
                    style: 'currency',
                    currency: 'MZN',
                    minimumFractionDigits: 2,
                  })}. O sistema criará automaticamente um registro de reembolso.
                </span>
              </div>
            </div>
          )}

          {/* Motivo do cancelamento */}
          <div>
            <Label htmlFor="reason">Motivo do cancelamento *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Cliente desistiu, problemas no espaço, etc."
              rows={3}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este motivo será registrado no histórico da reserva.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="sm:flex-1"
          >
            Cancelar ação
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="sm:flex-1 bg-amber-600 hover:bg-amber-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 mr-2" />
            )}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};