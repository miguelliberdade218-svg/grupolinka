// src/apps/hotels-app/components/event-spaces/PaymentRegisterModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, CreditCard, DollarSign, Info } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  // ✅ CORREÇÃO: Carregar usuário do localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("Usuário encontrado:", user.uid || user.id);
        setCurrentUser(user);
      } catch (e) {
        console.error("Erro ao parsear usuário do localStorage", e);
      }
    } else {
      console.log("Nenhum usuário no localStorage");
    }
  }, []);

  // ✅ CORREÇÃO: Função para gerar referência cash
  const generateCashReference = useCallback(() => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substr(2, 6).toUpperCase();
    setReference(`CASH-${dateStr}-${randomStr}`);
  }, []);

  // ✅ CORREÇÃO 1: Atualizar amount quando balanceDue mudar
  useEffect(() => {
    if (open) {
      console.log('🎯 Modal aberto, resetando valores', { bookingId, balanceDue });
      
      setAmount(balanceDue);
      setPaymentMethod('mpesa');
      setReference('');
      setNotes('');
      setLoading(false);
      
      // ✅ CORREÇÃO: Gerar referência automática para cash imediatamente
      if (paymentMethod === 'cash') {
        generateCashReference();
      }
    }
  }, [open, balanceDue, bookingId, paymentMethod, generateCashReference]);

  // ✅ CORREÇÃO 2: Função para atualizar amount quando balanceDue mudar
  useEffect(() => {
    if (open && amount > balanceDue) {
      setAmount(balanceDue);
    }
  }, [balanceDue, open, amount]);

  // ✅ CORREÇÃO: Atualizar referência quando mudar para cash
  useEffect(() => {
    if (paymentMethod === 'cash' && !reference.trim() && open) {
      generateCashReference();
    }
  }, [paymentMethod, open, reference, generateCashReference]);

  // ✅ CORREÇÃO 3: Validação melhorada
  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validação do amount
    if (amount <= 0 || amount > balanceDue || isNaN(amount)) {
      errors.push(`O valor deve estar entre 0.01 e ${balanceDue.toLocaleString('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2,
      })}`);
    }

    // Validação da referência
    if (paymentMethod !== 'cash') {
      if (!reference.trim()) {
        errors.push(`Para pagamento via ${paymentMethod}, informe o número de referência da transação`);
      } else if (reference.trim().length < 3) {
        errors.push('A referência deve ter pelo menos 3 caracteres');
      } else if (paymentMethod === 'mpesa' && !/^[A-Z0-9]{8,12}$/i.test(reference.trim())) {
        errors.push('Referência M-Pesa deve ter 8-12 caracteres alfanuméricos');
      } else if (paymentMethod === 'bank_transfer' && reference.trim().length < 6) {
        errors.push('Referência de transferência deve ter pelo menos 6 caracteres');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // ✅ CORREÇÃO PRINCIPAL: Função handleRegister com ID do usuário
  const handleRegister = async () => {
    // Verificar se o usuário está logado
    if (!currentUser) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para registrar pagamento',
        variant: 'destructive',
      });
      return;
    }

    const userId = currentUser.uid || currentUser.id; // ajuste conforme sua estrutura
    console.log("Enviando registeredBy:", userId);

    const validation = validateForm();
    if (!validation.valid) {
      toast({
        title: 'Validação falhou',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    let finalReference = reference.trim();
    
    // ✅ CORREÇÃO: Garantir referência para cash
    if (paymentMethod === 'cash' && !finalReference) {
      generateCashReference();
      finalReference = reference;
    }

    setLoading(true);
    try {
      const payload = {
        amount,
        paymentMethod,
        reference: finalReference,
        notes: notes.trim() || undefined,
        paymentType: 'manual_event_payment',
        registeredBy: userId,   // ← AQUI ESTÁ O PROBLEMA PRINCIPAL CORRIGIDO
      };
      
      // ✅ ADICIONADO: Log detalhado antes do envio
      console.log('📤 Enviando payload para eventSpaceService:', payload);
      console.log('👤 ID do usuário registrante:', userId);
      
      const res = await eventSpaceService.registerManualPayment(bookingId, payload);
      
      if (res.success) {
        toast({
          title: '✅ Pagamento registrado',
          description: `Valor de ${amount.toLocaleString('pt-MZ', {
            style: 'currency',
            currency: 'MZN',
            minimumFractionDigits: 2,
          })} registrado com sucesso`,
          variant: 'success',
          duration: 3000,
        });
        
        // ✅ CORREÇÃO CRÍTICA: Fechar modal PRIMEIRO
        onClose();
        
        // ✅ CORREÇÃO: Chamar onSuccess DEPOIS com pequeno delay
        if (onSuccess) {
          console.log('📞 Chamando onSuccess callback após fechar modal');
          setTimeout(() => {
            onSuccess();
          }, 100);
        }
        
      } else {
        throw new Error(res.error || 'Falha ao registrar pagamento');
      }
    } catch (err: any) {
      console.error('❌ Erro ao registrar pagamento:', err);
      
      // ✅ ADICIONADO: Log detalhado do erro
      if (err.message?.includes('invalid input syntax for type uuid')) {
        console.error('⚠️ ERRO DE UUID DETECTADO!');
        console.error('📋 Detalhes do erro:', {
          errorMessage: err.message,
          timestamp: new Date().toISOString()
        });
      }
      
      toast({
        title: '❌ Erro ao registrar pagamento',
        description: err.message || 'Tente novamente',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getReferencePlaceholder = () => {
    switch (paymentMethod) {
      case 'mpesa':
        return 'Ex: MP12345678 (8-12 caracteres)';
      case 'bank_transfer':
        return 'Ex: TRF-2025-001234';
      case 'card':
        return 'Ex: TXN-987654321';
      case 'cash':
        return 'Referência automática para pagamento em dinheiro';
      case 'mobile_money':
        return 'Ex: MM789012345';
      default:
        return 'Número da transação / comprovativo';
    }
  };

  const isReferenceDisabled = loading || paymentMethod === 'cash';

  // ✅ CORREÇÃO 4: Desabilitar botão com validação completa
  const isSubmitDisabled = 
    loading ||
    !currentUser || // ✅ ADICIONADO: Não permitir enviar se não há usuário
    amount <= 0 ||
    amount > balanceDue ||
    isNaN(amount) ||
    (!reference.trim() && paymentMethod !== 'cash') ||
    (paymentMethod !== 'cash' && reference.trim().length < 3);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pagamento Manual
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <div>{bookingTitle ? `Reserva: ${bookingTitle}` : `Reserva #${bookingId.slice(0, 8)}`}</div>
            <div className="text-xs text-muted-foreground">
              ID: {bookingId}
            </div>
            {!currentUser && (
              <div className="text-red-500 text-xs mt-1">
                ⚠️ Você precisa estar logado para registrar pagamentos
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Saldo Pendente */}
          <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Label className="text-sm font-medium text-amber-800">Saldo Pendente</Label>
            <div className="text-2xl font-bold text-amber-700">
              {balanceDue.toLocaleString('pt-MZ', {
                style: 'currency',
                currency: 'MZN',
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-amber-600">
              Registre um pagamento parcial ou completo
            </p>
          </div>

          {/* Informação do usuário logado */}
          {currentUser && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">
                Registrando como: <strong>{currentUser.email || currentUser.displayName || 'Usuário'}</strong>
              </span>
            </div>
          )}

          {/* Formulário */}
          <div className="grid gap-4">
            {/* Valor */}
            <div>
              <Label htmlFor="amount" className="flex items-center gap-1">
                Valor a Pagar <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  MZN
                </span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= balanceDue) {
                      setAmount(value);
                    }
                  }}
                  min="0.01"
                  max={balanceDue}
                  step="0.01"
                  disabled={loading}
                  className="pl-12"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(balanceDue)}
                  disabled={loading || balanceDue <= 0}
                >
                  Total
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.max(0.01, Math.floor(balanceDue / 2 * 100) / 100))}
                  disabled={loading || balanceDue <= 0}
                >
                  Metade
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.max(0.01, Math.floor(balanceDue / 4 * 100) / 100))}
                  disabled={loading || balanceDue <= 0}
                >
                  25%
                </Button>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div>
              <Label className="flex items-center gap-1">
                Método de Pagamento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(v: any) => {
                  setPaymentMethod(v);
                  if (v !== 'cash') {
                    setReference('');
                  } else {
                    generateCashReference();
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="card">Cartão de Crédito/Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro (Presencial)</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Referência */}
            <div>
              <Label htmlFor="reference" className="flex items-center gap-1">
                Número de Referência
                {paymentMethod !== 'cash' && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => {
                  // ✅ CORREÇÃO 5: Permitir edição controlada para cash
                  if (paymentMethod === 'cash') {
                    const newRef = e.target.value;
                    if (newRef.startsWith('CASH-') || newRef === '') {
                      setReference(newRef);
                    }
                  } else {
                    setReference(e.target.value);
                  }
                }}
                placeholder={getReferencePlaceholder()}
                disabled={isReferenceDisabled}
                className={paymentMethod === 'cash' ? 'bg-gray-50 border-amber-200' : ''}
              />
              {paymentMethod === 'cash' && (
                <div className="flex items-start gap-1 mt-1">
                  <Info className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-600">
                      Referência gerada automaticamente para controle interno
                    </p>
                    {!reference.startsWith('CASH-') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 text-xs mt-1 px-2"
                        onClick={generateCashReference}
                      >
                        Gerar referência CASH
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Pagamento efetuado pelo organizador, depósito bancário, etc."
                rows={3}
                disabled={loading}
                className="resize-none"
              />
            </div>
          </div>

          {/* Resumo do Pagamento */}
          {amount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
              <h4 className="font-medium text-sm">Resumo do Pagamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">
                    {amount.toLocaleString('pt-MZ', {
                      style: 'currency',
                      currency: 'MZN',
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método:</span>
                  <span className="font-medium capitalize">
                    {paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referência:</span>
                  <span className="font-medium truncate max-w-[150px]" title={reference}>
                    {reference || '(a gerar)'}
                  </span>
                </div>
                {amount < balanceDue && (
                  <div className="flex justify-between text-amber-600 pt-1 border-t">
                    <span>Saldo após pagamento:</span>
                    <span className="font-medium">
                      {(balanceDue - amount).toLocaleString('pt-MZ', {
                        style: 'currency',
                        currency: 'MZN',
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="sm:flex-1 order-2 sm:order-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleRegister}
            disabled={isSubmitDisabled}
            className="bg-green-600 hover:bg-green-700 sm:flex-1 order-1 sm:order-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {amount === balanceDue ? 'Pagar Total' : 'Registrar Pagamento'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRegisterModal;