// src/apps/hotels-app/components/event-spaces/PaymentRegisterModal.tsx
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import { Loader2, CreditCard, DollarSign } from 'lucide-react';
import { eventSpaceService } from '@/services/eventSpaceService';

interface PaymentRegisterModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle?: string;
  balanceDue: number;
  onSuccess?: () => void;
}

export const PaymentRegisterModal: React.FC<PaymentRegisterModalProps> = ({
  open,
  onClose,
  bookingId,
  bookingTitle,
  balanceDue,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(balanceDue);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money'>('mpesa');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRegister = async () => {
    if (amount <= 0 || amount > balanceDue) {
      toast({
        title: 'Valor inválido',
        description: `O valor deve estar entre 1 e ${balanceDue} MZN`,
        variant: 'destructive',
      });
      return;
    }

    if (!reference.trim() && paymentMethod !== 'cash') {
      toast({
        title: 'Referência obrigatória',
        description: 'Informe o número de referência da transação',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount,
        paymentMethod,
        referenceNumber: reference.trim() || 'N/A',
        notes: notes.trim() || undefined,
      };

      const res = await eventSpaceService.registerManualPayment(bookingId, payload);

      if (res.success) {
        toast({
          title: 'Pagamento registrado',
          description: `Valor de ${amount} MZN registrado com sucesso`,
          variant: 'success',
        });
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(res.error || 'Falha ao registrar pagamento');
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            {bookingTitle ? `Reserva: ${bookingTitle}` : `Reserva #${bookingId.slice(0, 8)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-2">
            <Label>Saldo Pendente</Label>
            <div className="text-2xl font-bold text-amber-600">
              {balanceDue.toLocaleString('pt-MZ', {
                style: 'currency',
                currency: 'MZN',
                minimumFractionDigits: 0,
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="amount">Valor a Pagar</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                max={balanceDue}
                step="0.01"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Método de Pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v: any) => setPaymentMethod(v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reference">Número de Referência</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  paymentMethod === 'mpesa' ? 'Ex: MP123456789' :
                  paymentMethod === 'bank_transfer' ? 'Ex: TRF-2025-001' :
                  'Número da transação / comprovativo'
                }
                disabled={loading || paymentMethod === 'cash'}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionais (opcional)"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleRegister}
            disabled={loading || amount <= 0 || amount > balanceDue}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Pagamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};