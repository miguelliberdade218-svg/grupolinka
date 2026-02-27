import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, DollarSign, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

export default function AdminPayments() {
  const {
    payments,
    paymentsPagination,
    loading,
    fetchPaymentReferences,
    confirmPayment,
    error,
    success,
    clearError,
    clearSuccess,
  } = useAdminStore();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      clearSuccess();
      setSelectedPayment(null);
      setNotes('');
      loadPayments();
    }
  }, [success, clearSuccess]);

  const loadPayments = async () => {
    try {
      await fetchPaymentReferences(page, 20, {
        status: statusFilter,
        booking_type: bookingTypeFilter,
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar pagamentos');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;

    try {
      await confirmPayment(selectedPayment.id, notes);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">✅ Pago</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Falhou</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">⏸️ Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pagamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Pagamentos</h2>
        <p className="text-gray-600 mt-2">Confirme e monitore os pagamentos da plataforma</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={bookingTypeFilter}
              onChange={(e) => {
                setBookingTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="">Todos os Tipos</option>
              <option value="ride">Corrida</option>
              <option value="hotel">Hotel</option>
              <option value="event_space">Espaço para Eventos</option>
            </select>

            <Button onClick={() => { setPage(1); loadPayments(); }}>Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      {payments.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Ref. Pagamento
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Montante
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600 uppercase text-xs">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900">
                      {payment.reference_number}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {payment.booking_type === 'ride' && '🚗'}
                      {payment.booking_type === 'hotel' && '🏨'}
                      {payment.booking_type === 'event_space' && '🎪'}
                      {` ${payment.booking_type}`}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      R$ {parseFloat(payment.gross_amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(payment.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 ml-auto"
                        >
                          <Check size={14} />
                          Confirmar
                        </Button>
                      )}
                      {payment.status !== 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          Visualizar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum pagamento encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {paymentsPagination && paymentsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => {
              setPage(Math.max(1, page - 1));
              loadPayments();
            }}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="text-gray-600 text-sm flex items-center">
            Página {page} de {paymentsPagination.totalPages}
          </span>
          <Button
            onClick={() => {
              setPage(Math.min(paymentsPagination.totalPages, page + 1));
              loadPayments();
            }}
            disabled={page === paymentsPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Modal de Confirmação */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedPayment.status === 'pending' ? 'Confirmar Pagamento' : 'Detalhes do Pagamento'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Referência</p>
                  <p className="font-mono text-sm">{selectedPayment.reference_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montante</p>
                  <p className="text-xl font-bold">
                    R$ {parseFloat(selectedPayment.gross_amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taxa Plataforma</p>
                  <p className="text-sm">
                    R$ {parseFloat(selectedPayment.fee_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione uma nota"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setSelectedPayment(null);
                    setNotes('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {selectedPayment.status === 'pending' ? 'Cancelar' : 'Fechar'}
                </Button>
                {selectedPayment.status === 'pending' && (
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Confirmar Pagamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
