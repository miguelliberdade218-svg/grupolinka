// src/apps/hotels-app/components/event-spaces/PaymentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Progress } from '@/shared/components/ui/progress';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  Copy,
  Smartphone,
  Banknote,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { eventPaymentService } from '@/services/eventPaymentService';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { BookingPayment } from '@/shared/types/event-spaces';

interface PaymentManagementProps {
  bookingId: string;
  bookingTitle?: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  onPaymentRegistered?: () => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({
  bookingId,
  bookingTitle,
  totalAmount,
  paidAmount,
  balanceDue,
  onPaymentRegistered,
}) => {
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: balanceDue,
    payment_method: 'mpesa' as 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money',
    reference: '',
    notes: '',
  });
  const [validatingReference, setValidatingReference] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, [bookingId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await eventPaymentService.getPaymentDetails(bookingId);
      if (res.success && res.data) {
        // Convertendo dados do backend para o tipo BookingPayment
        const backendPayments = res.data.payments || [];
        const mappedPayments: BookingPayment[] = backendPayments.map((payment: any) => ({
          id: payment.id,
          bookingId: payment.bookingId || bookingId,
          amount: String(payment.amount || 0),
          paymentMethod: payment.payment_method || payment.paymentMethod || 'cash',
          referenceNumber: payment.reference_number || payment.referenceNumber || '',
          status: (payment.status as any) || 'pending',
          paidAt: payment.paid_at || payment.paidAt || null,
          confirmedAt: payment.confirmed_at || payment.confirmedAt || null,
          createdAt: payment.created_at || payment.createdAt || new Date().toISOString(),
          notes: payment.notes || '',
        }));
        setPayments(mappedPayments);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar histórico de pagamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateReference = async () => {
    if (!paymentData.reference.trim()) return;
    
    setValidatingReference(true);
    try {
      const res = await eventPaymentService.validatePaymentReference(
        paymentData.reference,
        bookingId
      );
      
      if (res.success && res.data?.valid) {
        toast({
          title: '✅ Referência válida',
          description: 'Esta referência pode ser utilizada',
          variant: 'success',
        });
      } else {
        toast({
          title: '⚠️ Referência inválida',
          description: res.data?.message || 'Esta referência já foi utilizada ou é inválida',
          variant: 'warning',
        });
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      toast({
        title: '❌ Erro na validação',
        description: 'Não foi possível validar a referência',
        variant: 'destructive',
      });
    } finally {
      setValidatingReference(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (paymentData.amount <= 0) {
      toast({
        title: '❌ Valor inválido',
        description: 'O valor do pagamento deve ser maior que zero',
        variant: 'destructive',
      });
      return;
    }

    if (paymentData.amount > balanceDue) {
      toast({
        title: '⚠️ Valor excedente',
        description: `O valor não pode exceder o saldo pendente de ${formatCurrency(balanceDue)}`,
        variant: 'warning',
      });
      return;
    }

    if (!paymentData.payment_method) {
      toast({
        title: '❌ Método obrigatório',
        description: 'Selecione um método de pagamento',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentData.reference.trim()) {
      toast({
        title: '❌ Referência obrigatória',
        description: 'Informe o número de referência do pagamento',
        variant: 'destructive',
      });
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await eventPaymentService.registerManualPayment(bookingId, {
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        payment_type: 'manual_event_payment',
      });

      if (res.success) {
        toast({
          title: '✅ Pagamento registrado',
          description: 'Pagamento registrado com sucesso',
          variant: 'success',
        });
        
        // Reset form
        setPaymentData({
          amount: balanceDue - paymentData.amount,
          payment_method: 'mpesa',
          reference: '',
          notes: '',
        });
        setShowPaymentForm(false);
        
        // Reload payments
        await loadPayments();
        
        // Notify parent
        if (onPaymentRegistered) {
          onPaymentRegistered();
        }
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro no pagamento',
        description: error.message || 'Falha ao registrar pagamento',
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      const res = await eventPaymentService.confirmPayment(bookingId, paymentId);
      if (res.success) {
        toast({
          title: '✅ Pagamento confirmado',
          description: 'Pagamento confirmado com sucesso',
          variant: 'success',
        });
        await loadPayments();
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro ao confirmar',
        description: error.message || 'Falha ao confirmar pagamento',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReceipt = async (paymentId: string) => {
    try {
      const res = await eventPaymentService.generateReceipt(bookingId);
      if (res.success && res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
        toast({
          title: '✅ Recibo gerado',
          description: 'Recibo disponível para download',
          variant: 'success',
        });
      } else {
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast({
        title: '❌ Erro ao gerar recibo',
        description: error.message || 'Falha ao gerar recibo',
        variant: 'destructive',
      });
    }
  };

  const handleCopyReference = (reference: string) => {
    navigator.clipboard.writeText(reference);
    toast({
      title: '✅ Copiado',
      description: 'Referência copiada para a área de transferência',
      variant: 'success',
    });
  };

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount == null) return '—';
    const num = typeof amount === 'string' ? Number(amount) : amount;
    if (isNaN(num)) return '—';
    return num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: pt });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      'mpesa': <Smartphone className="h-4 w-4" />,
      'bank_transfer': <Banknote className="h-4 w-4" />,
      'card': <CreditCard className="h-4 w-4" />,
      'cash': <DollarSign className="h-4 w-4" />,
      'mobile_money': <Smartphone className="h-4 w-4" />,
    };
    return icons[method] || <CreditCard className="h-4 w-4" />;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'mpesa': 'M-Pesa',
      'bank_transfer': 'Transferência Bancária',
      'card': 'Cartão',
      'cash': 'Dinheiro',
      'mobile_money': 'Mobile Money',
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; label: string; icon: React.ReactNode }> = {
      'paid': {
        variant: 'success',
        label: 'Pago',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'confirmed': {
        variant: 'success',
        label: 'Confirmado',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'pending': {
        variant: 'warning',
        label: 'Pendente',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      'partial': {
        variant: 'secondary',
        label: 'Parcial',
        icon: <Percent className="h-3 w-3 mr-1" />
      },
      'failed': {
        variant: 'destructive',
        label: 'Falhou',
        icon: <X className="h-3 w-3 mr-1" />
      },
      'refunded': {
        variant: 'default',
        label: 'Reembolsado',
        icon: <RefreshCw className="h-3 w-3 mr-1" />
      },
      'cancelled': {
        variant: 'destructive',
        label: 'Cancelado',
        icon: <X className="h-3 w-3 mr-1" />
      },
    };
    
    const statusInfo = statusMap[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={statusInfo.variant as any} className="text-xs">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const paymentProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
          <div className="flex gap-2">
            {bookingTitle ? (
              <p className="text-sm text-gray-600 mr-4">{bookingTitle}</p>
            ) : (
              <p className="text-sm text-gray-500">Reserva #{bookingId.slice(0, 8).toUpperCase()}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-gray-600">Valor Total</div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(paidAmount)}
            </div>
            <div className="text-sm text-gray-600">Valor Pago</div>
            <div className="text-xs text-gray-500 mt-1">
              {paymentProgress.toFixed(1)}% do total
            </div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(balanceDue)}
            </div>
            <div className="text-sm text-gray-600">Saldo Pendente</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalAmount > 0 ? `${((balanceDue / totalAmount) * 100).toFixed(1)}% do total` : '—'}
            </div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {payments.length}
            </div>
            <div className="text-sm text-gray-600">Pagamentos</div>
            <div className="text-xs text-gray-500 mt-1">
              {payments.filter(p => p.status === 'paid' || p.status === 'confirmed').length} confirmados
            </div>
          </Card>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Pagamento</span>
            <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Progresso
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${paymentProgress}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  paymentProgress >= 90 ? 'bg-green-600' :
                  paymentProgress >= 50 ? 'bg-amber-500' :
                  'bg-red-600'
                }`}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Pago: {formatCurrency(paidAmount)}</span>
            <span>Pendente: {formatCurrency(balanceDue)}</span>
          </div>
        </div>
      </Card>

      {/* Botão para Registrar Pagamento */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          className={showPaymentForm ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
        >
          {showPaymentForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancelar Registro
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </>
          )}
        </Button>
      </div>

      {/* Formulário de Pagamento */}
      {showPaymentForm && (
        <Card className="p-6">
          <h4 className="font-semibold text-lg mb-4">Registrar Pagamento Manual</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor do Pagamento *</Label>
              <Input
                id="amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  amount: parseFloat(e.target.value) || 0
                })}
                min="0"
                max={balanceDue}
                step="0.01"
                placeholder="Digite o valor"
              />
              <p className="text-xs text-gray-500 mt-1">
                Saldo disponível: {formatCurrency(balanceDue)}
              </p>
            </div>

            <div>
              <Label htmlFor="payment_method">Método de Pagamento *</Label>
              <Select
                value={paymentData.payment_method}
                onValueChange={(value: any) => setPaymentData({
                  ...paymentData,
                  payment_method: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
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

            <div className="md:col-span-2">
              <Label htmlFor="reference">Número de Referência *</Label>
              <div className="flex gap-2">
                <Input
                  id="reference"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    reference: e.target.value
                  })}
                  placeholder="Ex: MP123456, REF2024001, etc."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={validateReference}
                  disabled={validatingReference || !paymentData.reference.trim()}
                >
                  {validatingReference ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {paymentData.payment_method === 'mpesa' ? 'Número da transação M-Pesa' :
                 paymentData.payment_method === 'bank_transfer' ? 'Número da transferência bancária' :
                 paymentData.payment_method === 'card' ? 'Número da transação do cartão' :
                 paymentData.payment_method === 'cash' ? 'Número do comprovativo (opcional)' :
                 'Número da transação Mobile Money'}
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  notes: e.target.value
                })}
                placeholder="Notas sobre o pagamento, informações adicionais..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              disabled={processingPayment || paymentData.amount <= 0 || !paymentData.reference.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingPayment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Registrar Pagamento
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Histórico de Pagamentos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum pagamento registrado
            </h4>
            <p className="text-gray-600">
              Registre o primeiro pagamento usando o botão acima
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="font-medium">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </span>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Ref: {payment.referenceNumber}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 w-6 p-0"
                            onClick={() => handleCopyReference(payment.referenceNumber)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </p>
                        <p className="text-xs text-gray-500">
                          Registrado: {formatDate(payment.createdAt)}
                          {payment.confirmedAt && ` • Confirmado: ${formatDate(payment.confirmedAt)}`}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Nota:</span> {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateReceipt(payment.id)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Recibo
                    </Button>
                    
                    {(payment.status === 'pending' || payment.status === 'partial') && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmPayment(payment.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Resumo por Método de Pagamento */}
      {payments.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Resumo por Método de Pagamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(
              payments.reduce((acc, payment) => {
                const method = payment.paymentMethod;
                acc[method] = (acc[method] || 0) + Number(payment.amount || 0);
                return acc;
              }, {} as Record<string, number>)
            ).map(([method, amount]) => (
              <Card key={method} className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {getPaymentMethodIcon(method)}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(amount)}
                </div>
                <div className="text-sm text-gray-600">
                  {getPaymentMethodLabel(method)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {payments.filter(p => p.paymentMethod === method).length} pagamentos
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PaymentManagement;