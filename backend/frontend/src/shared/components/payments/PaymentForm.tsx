/**
 * src/shared/components/payments/PaymentForm.tsx
 * Formulário de pagamento para hotéis e event spaces
 * Suporta múltiplos métodos: M-Pesa, Transferência Bancária, Cartão, Dinheiro
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Lock, CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';
import type { PaymentMethod, PaymentType } from '@/shared/types/payments';

interface PaymentFormProps {
  bookingId: string;
  totalAmount: number;
  depositRequired?: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
  isLoading?: boolean;
}

export function PaymentForm({
  bookingId,
  totalAmount,
  depositRequired,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [amount, setAmount] = useState<number>(depositRequired || totalAmount);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reference.trim()) {
      setError('Referência de pagamento é obrigatória');
      return;
    }

    if (amount <= 0 || amount > totalAmount) {
      setError('Valor deve ser maior que 0 e não pode exceder o total');
      return;
    }

    try {
      // Implementar chamada à API aqui
      setSuccess(true);
      setTimeout(() => onPaymentSuccess?.(), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMsg);
      onPaymentError?.(errorMsg);
    }
  };

  const paymentMethods = [
    {
      id: 'mpesa' as PaymentMethod,
      label: 'M-Pesa',
      icon: Smartphone,
      desc: 'Direto do seu telemóvel',
      color: 'bg-green-100 border-green-300',
    },
    {
      id: 'bank_transfer' as PaymentMethod,
      label: 'Transferência Bancária',
      icon: Building2,
      desc: 'Via conta bancária',
      color: 'bg-blue-100 border-blue-300',
    },
    {
      id: 'card' as PaymentMethod,
      label: 'Cartão de Crédito',
      icon: CreditCard,
      desc: 'Visa, Mastercard',
      color: 'bg-purple-100 border-purple-300',
    },
    {
      id: 'cash' as PaymentMethod,
      label: 'Dinheiro',
      icon: Banknote,
      desc: 'No local',
      color: 'bg-yellow-100 border-yellow-300',
    },
  ];

  const selectedMethodInfo = paymentMethods.find((m) => m.id === paymentMethod);
  const Icon = selectedMethodInfo?.icon || Lock;

  return (
    <div className="w-full max-w-md mx-auto">
      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Pagamento Registrado!</h3>
          <p className="text-green-700 mb-4">Seu pagamento foi registrado com sucesso.</p>
          <p className="text-sm text-green-600">
            Referência: <span className="font-mono font-semibold">{reference}</span>
          </p>
        </div>
      ) : (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-2">Efectue o Pagamento</h2>
          <p className="text-gray-600 mb-6">Booking #{bookingId.slice(-8)}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resumo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a pagar:</span>
                  <span className="font-semibold">{totalAmount.toFixed(2)} MZN</span>
                </div>
                {depositRequired && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Depósito obrigatório:</span>
                    <span className="font-semibold text-primary-600">{depositRequired.toFixed(2)} MZN</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-700 font-medium">Você vai pagar:</span>
                  <span className="font-bold text-lg">{(depositRequired || totalAmount).toFixed(2)} MZN</span>
                </div>
              </div>
            </div>

            {/* Tipo de Pagamento */}
            {depositRequired && totalAmount > depositRequired && (
              <div>
                <label className="block font-medium mb-3">Tipo de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  {['deposit', 'full'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setPaymentType(type as PaymentType);
                        if (type === 'deposit') setAmount(depositRequired);
                        else setAmount(totalAmount);
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentType === type
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        {type === 'deposit' ? 'Depósito' : 'Pagamento Total'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {type === 'deposit' ? depositRequired : totalAmount} MZN
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Método de Pagamento */}
            <div>
              <label className="block font-medium mb-3">Método de Pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <method.icon className="w-6 h-6 mb-2 mx-auto" />
                    <p className="font-medium text-xs">{method.label}</p>
                    <p className="text-xs text-gray-600">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Detalhes do Método Selecionado */}
            {paymentMethod === 'mpesa' && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Instruções M-Pesa:</p>
                <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                  <li>Abra a aplicação M-Pesa no seu telemóvel</li>
                  <li>Selecione "Enviar Dinheiro"</li>
                  <li>Número: [Hotel Phone]</li>
                  <li>Valor: {amount.toFixed(2)} MZN</li>
                  <li>Copie a referência e cole no formulário abaixo</li>
                </ol>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Dados Bancários:</p>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><strong>Banco:</strong> BCI</p>
                  <p><strong>Conta:</strong> 1234567890</p>
                  <p><strong>NIB:</strong> 0015000123456789</p>
                  <p><strong>Titular:</strong> LinkA Tourism</p>
                  <p className="mt-2 font-medium">Valor: {amount.toFixed(2)} MZN</p>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-800">
                  Você será redirecionado para pagar com segurança através da plataforma de pagamento.
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900 mb-2">Pagamento em Dinheiro</p>
                <p className="text-xs text-yellow-800">
                  Complete a reserva agora e efectue o pagamento na recepção do hotel.
                </p>
              </div>
            )}

            {/* Referência de Pagamento */}
            <div>
              <Input
                label="Referência de Pagamento *"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Número de transação M-Pesa, compr. bancário, etc."
                required
              />
            </div>

            {/* Valor */}
            <div>
              <Input
                label="Valor (MZN)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                disabled
                className="opacity-75"
              />
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-2">
                Notas Adicionais
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o pagamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            {/* Segurança */}
            <div className="flex items-center gap-2 text-xs text-gray-600 p-3 bg-gray-50 rounded">
              <Lock className="w-4 h-4" />
              <span>Seu pagamento é encriptado e seguro</span>
            </div>

            {/* Ações */}
            <Button
              type="submit"
              disabled={isLoading || !reference.trim()}
              loading={isLoading}
              className="w-full"
            >
              Confirmar Pagamento
            </Button>

            <p className="text-xs text-center text-gray-600">
              Ao clicar em "Confirmar Pagamento", você concorda com nossos{' '}
              <a href="#" className="text-primary-600 hover:underline">
                termos de pagamento
              </a>
            </p>
          </form>
        </Card>
      )}
    </div>
  );
}
