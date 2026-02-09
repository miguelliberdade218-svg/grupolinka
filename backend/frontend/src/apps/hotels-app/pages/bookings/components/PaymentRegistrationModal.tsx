// src/apps/hotels-app/pages/bookings/components/PaymentRegistrationModal.tsx
import React, { useState, useEffect } from 'react';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Separator } from '@/shared/components/ui/separator';
import { CreditCard, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PaymentRegistrationModalProps {
  booking: HotelBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (paymentData: {
    amount: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
    reference: string;
    notes?: string;
    paymentType?: 'partial' | 'full';
  }) => Promise<{ success: boolean; error?: string }>;
}

const paymentMethods = [
  { value: 'mpesa', label: 'M-Pesa', icon: '💸', description: 'Pagamento via M-Pesa' },
  { value: 'bank_transfer', label: 'Transferência Bancária', icon: '🏦', description: 'Transferência para conta bancária' },
  { value: 'card', label: 'Cartão', icon: '💳', description: 'Cartão de crédito/débito' },
  { value: 'cash', label: 'Dinheiro', icon: '💵', description: 'Pagamento em dinheiro' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱', description: 'Outros serviços mobile money' },
];

// ✅ CORREÇÃO: Função formatCurrency local
const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return isNaN(num) 
    ? '0,00 MZN' 
    : num.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MZN';
};

// ✅ CORREÇÃO: Definir tipo para formData
type FormDataState = {
  amount: string;
  paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference: string;
  notes: string;
  paymentType: 'partial' | 'full';
};

export const PaymentRegistrationModal: React.FC<PaymentRegistrationModalProps> = ({
  booking,
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  
  // ✅ CORREÇÃO: Estado tipado corretamente
  const [formData, setFormData] = useState<FormDataState>({
    amount: '',
    paymentMethod: 'mpesa',
    reference: '',
    notes: '',
    paymentType: 'partial',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ CORREÇÃO: Efeito para calcular valores baseado no booking
  useEffect(() => {
    if (booking) {
      const totalPrice = parseFloat(booking.total_price?.toString().replace(/\s/g, '') || '0');
      
      // Calcular valor já pago baseado no payment_status
      if (booking.payment_status === 'partial') {
        // Para booking de 4600 MZN, 2300 já foram pagos (50%)
        const paidAmount = totalPrice / 2;
        setTotalPaid(paidAmount);
        setRemainingAmount(totalPrice - paidAmount);
      } else if (booking.payment_status === 'paid') {
        setTotalPaid(totalPrice);
        setRemainingAmount(0);
      } else {
        setTotalPaid(0);
        setRemainingAmount(totalPrice);
      }
      
      // Inicializar valor com 50% do saldo pendente
      if (remainingAmount > 0 && !formData.amount) {
        const initialAmount = (remainingAmount / 2).toFixed(2);
        setFormData(prev => ({ 
          ...prev, 
          amount: initialAmount,
          paymentType: 'partial'
        }));
      }
    }
  }, [booking, formData.amount, remainingAmount]);

  // ✅ CORREÇÃO: Resetar form quando modal abrir/fechar
  useEffect(() => {
    if (open && booking) {
      setFormData({
        amount: '',
        paymentMethod: 'mpesa',
        reference: '',
        notes: '',
        paymentType: 'partial',
      });
      setErrors({});
      
      // Definir valor inicial
      if (remainingAmount > 0) {
        const initialAmount = (remainingAmount * 0.5).toFixed(2);
        setFormData(prev => ({ ...prev, amount: initialAmount }));
      }
    }
  }, [open, booking, remainingAmount]);

  // ✅ CORREÇÃO: Se não há booking, não renderize nada
  if (!booking) {
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validação do valor
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = 'Valor é obrigatório';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que 0';
    } else if (amount > remainingAmount) {
      newErrors.amount = `Valor não pode exceder ${formatCurrency(remainingAmount.toString())}`;
    }

    // Validação do método de pagamento
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Método de pagamento é obrigatório';
    }

    // Validação da referência
    if (!formData.reference.trim()) {
      newErrors.reference = 'Referência/Número da transação é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        notes: formData.notes || undefined,
        paymentType: formData.paymentType,
      };

      const result = await onSubmit(paymentData);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          amount: '',
          paymentMethod: 'mpesa',
          reference: '',
          notes: '',
          paymentType: 'partial',
        });
        setErrors({});
        onOpenChange(false);
      } else {
        setErrors({ submit: result.error || 'Erro ao registrar pagamento' });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erro ao registrar pagamento' });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Remove qualquer caractere não numérico, exceto ponto decimal
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Garante que há apenas um ponto decimal
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limita a 2 casas decimais
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setFormData(prev => ({ ...prev, amount: numericValue }));
    
    // Auto-select payment type based on amount
    if (numericValue) {
      const amount = parseFloat(numericValue);
      if (!isNaN(amount)) {
        if (Math.abs(amount - remainingAmount) < 0.01) { // 99% para evitar problemas de arredondamento
          setFormData(prev => ({ ...prev, paymentType: 'full' }));
        } else {
          setFormData(prev => ({ ...prev, paymentType: 'partial' }));
        }
      }
    }
  };

  const handlePaymentMethodChange = (value: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money') => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
    
    // Auto-generate reference for certain payment methods
    if (!formData.reference) {
      const prefixes = {
        mpesa: 'MP',
        bank_transfer: 'TB',
        card: 'CC',
        cash: 'CSH',
        mobile_money: 'MM',
      };
      
      const prefix = prefixes[value] || 'REF';
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({ ...prev, reference: `${prefix}-${timestamp}` }));
    }
  };

  const handleFullPayment = () => {
    setFormData(prev => ({
      ...prev,
      amount: remainingAmount.toFixed(2),
      paymentType: 'full',
    }));
  };

  const handleHalfPayment = () => {
    setFormData(prev => ({
      ...prev,
      amount: (remainingAmount / 2).toFixed(2),
      paymentType: 'partial',
    }));
  };

  const handleQuarterPayment = () => {
    setFormData(prev => ({
      ...prev,
      amount: (remainingAmount / 4).toFixed(2),
      paymentType: 'partial',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Registrar Pagamento
          </DialogTitle>
          <DialogDescription>
            Registre um pagamento recebido para a reserva de {booking.guest_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da reserva */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Reserva:</span>
              <span className="font-medium">{booking.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Hóspede:</span>
              <span className="font-medium">{booking.guest_name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Valor total:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(booking.total_price)}
              </span>
            </div>
            
            {/* ✅ NOVO: Mostrar valor já pago */}
            {totalPaid > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Já pago:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Saldo pendente:</span>
              <span className={cn(
                "text-lg font-bold",
                remainingAmount > 0 ? "text-amber-600" : "text-green-600"
              )}>
                {formatCurrency(remainingAmount.toString())}
              </span>
            </div>
          </div>

          {/* Valor do pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Valor do Pagamento</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuarterPayment}
                  className="h-7 text-xs"
                  disabled={loading || remainingAmount <= 0}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleHalfPayment}
                  className="h-7 text-xs"
                  disabled={loading || remainingAmount <= 0}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFullPayment}
                  className="h-7 text-xs"
                  disabled={loading || remainingAmount <= 0}
                >
                  100%
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <Input
                id="amount"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
                className="pl-10 text-lg"
                disabled={loading || remainingAmount <= 0}
              />
            </div>
            
            {errors.amount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </p>
            )}
            
            {/* ✅ CORREÇÃO: Mostrar novo saldo após este pagamento */}
            {formData.amount && !errors.amount && (
              <div className="text-sm text-gray-600">
                Após este pagamento, saldo será:{' '}
                <span className={cn(
                  "font-medium",
                  (remainingAmount - parseFloat(formData.amount || '0')) > 0 
                    ? "text-amber-600" 
                    : "text-green-600"
                )}>
                  {formatCurrency(remainingAmount - parseFloat(formData.amount || '0'))}
                </span>
              </div>
            )}
          </div>

          {/* Método de pagamento */}
          <div className="space-y-3">
            <Label htmlFor="paymentMethod">Método de Pagamento</Label>
            
            <Select
              value={formData.paymentMethod}
              onValueChange={handlePaymentMethodChange}
              disabled={loading || remainingAmount <= 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{method.icon}</span>
                      <div>
                        <div className="font-medium">{method.label}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {errors.paymentMethod && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.paymentMethod}
              </p>
            )}
          </div>

          {/* Referência/Número da transação */}
          <div className="space-y-3">
            <Label htmlFor="reference">
              Referência/Número da Transação
              <span className="text-red-500 ml-1">*</span>
            </Label>
            
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Ex: MP123456789, TB2024001, etc."
              disabled={loading || remainingAmount <= 0}
            />
            
            {errors.reference && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.reference}
              </p>
            )}
            
            <div className="text-xs text-gray-500">
              Número da transação, código M-Pesa, número do comprovante, etc.
            </div>
          </div>

          {/* Tipo de pagamento */}
          <div className="space-y-3">
            <Label>Tipo de Pagamento</Label>
            
            <RadioGroup
              value={formData.paymentType}
              onValueChange={(value: 'partial' | 'full') => 
                setFormData(prev => ({ ...prev, paymentType: value }))
              }
              className="flex gap-4"
              disabled={loading || remainingAmount <= 0}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="cursor-pointer">
                  <div className="font-medium">Pagamento Parcial</div>
                  <div className="text-xs text-gray-500">Registra apenas parte do valor</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  <div className="font-medium">Pagamento Completo</div>
                  <div className="text-xs text-gray-500">Marca reserva como totalmente paga</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Observações */}
          <div className="space-y-3">
            <Label htmlFor="notes">Observações (opcional)</Label>
            
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações adicionais sobre o pagamento..."
              rows={3}
              disabled={loading || remainingAmount <= 0}
            />
            
            <div className="text-xs text-gray-500">
              Ex: "Pagamento recebido em dinheiro pelo recepcionista", "Comprovante anexado", etc.
            </div>
          </div>

          {/* Erro de submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.submit}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="sm:order-1"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading || remainingAmount <= 0}
            className="bg-green-600 hover:bg-green-700 sm:order-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {remainingAmount <= 0 ? 'Reserva Paga' : 'Registrar Pagamento'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};