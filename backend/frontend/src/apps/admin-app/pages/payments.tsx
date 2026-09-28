import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, DollarSign, Check, ChevronDown, ChevronUp, Copy, Download, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

interface BookingReference {
  id: string;
  type: 'ride' | 'hotel' | 'event_space';
  reference: string;
  amount: number;
  userId?: string;
  userName?: string;
  date: string;
  description?: string;
}

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
  const [userFilter, setUserFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState('');

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
      setEditMode(false);
      loadPayments();
    }
  }, [success, clearSuccess]);

  const loadPayments = async () => {
    try {
      console.log('[Payments] Loading with filters:', { statusFilter, bookingTypeFilter, userFilter, dateFromFilter });
      await fetchPaymentReferences(page, 20, {
        status: statusFilter,
        booking_type: bookingTypeFilter,
        user: userFilter,
        date_from: dateFromFilter,
      });
    } catch (error: any) {
      console.error('[Payments] Error:', error);
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

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success('Referência copiada! ✅');
  };

    const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pendente</Badge>;
      case 'proof_uploaded':
        return <Badge className="bg-blue-100 text-blue-800">🧾 Comprovativo Enviado</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">✅ Pago</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejeitado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">❌ Falhou</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">⏸️ Cancelado</Badge>;
      case 'refunded':
        return <Badge className="bg-blue-100 text-blue-800">↩️ Reembolsado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return '🚗';
      case 'hotel':
        return '🏨';
      case 'event_space':
        return '🎪';
      default:
        return '📦';
    }
  };

  // Mock function - em produção virá da API
  const getBookingReferences = (paymentId: string): BookingReference[] => {
    return [
      {
        id: 'ref-1',
        type: 'ride',
        reference: `RIDE-${paymentId.substring(0, 8)}`,
        amount: selectedPayment?.gross_amount * 0.6 || 0,
        userName: selectedPayment?.user_name,
        date: selectedPayment?.created_at,
        description: 'Corrida entre Maputo e Gaza',
      },
      {
        id: 'ref-2',
        type: 'hotel',
        reference: `HOTEL-${paymentId.substring(0, 8)}`,
        amount: selectedPayment?.gross_amount * 0.4 || 0,
        userName: selectedPayment?.user_name,
        date: selectedPayment?.created_at,
        description: 'Hotel Polana - 2 noites',
      },
    ];
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
        <h2 className="text-3xl font-bold text-gray-900">💰 Gestão de Pagamentos</h2>
        <p className="text-gray-600 mt-2">Confirme, controle e gerencie os pagamentos da plataforma</p>
      </div>

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Filtros Avançados</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                >
                                    <option value="">Todos</option>
                  <option value="pending">⏳ Pendente</option>
                  <option value="proof_uploaded">🧾 Comprovativo Enviado</option>
                  <option value="paid">✅ Pago</option>
                  <option value="rejected">❌ Rejeitado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={bookingTypeFilter}
                  onChange={(e) => {
                    setBookingTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="ride">🚗 Corrida</option>
                  <option value="hotel">🏨 Hotel</option>
                  <option value="event_space">🎪 Evento</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                <Input
                  type="text"
                  placeholder="Nome ou ID..."
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                <Input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => {
                    setDateFromFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => { setPage(1); loadPayments(); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Zap size={14} className="mr-1" />
                  Filtrar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela de Pagamentos */}
      {payments.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Referência</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Tipo</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Usuário</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Montante</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Taxa</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Data</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600 uppercase text-xs">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment: any) => (
                  <tbody key={payment.id}>
                    <tr className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.reference_number?.substring(0, 12)}
                          </code>
                          <button
                            onClick={() => handleCopyReference(payment.reference_number)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Copiar referência"
                          >
                            <Copy size={14} className="text-gray-600" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {getBookingTypeIcon(payment.booking_type)} {payment.booking_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {payment.user_name || payment.userId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        MZN {parseFloat(payment.gross_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600">
                        MZN {parseFloat(payment.fee_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedPaymentId(expandedPaymentId === payment.id ? null : payment.id)}
                          className="w-10 p-0"
                          title={expandedPaymentId === payment.id ? "Ocultar" : "Expandir"}
                        >
                          {expandedPaymentId === payment.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                                                {(payment.status === 'proof_uploaded' || payment.status === 'pending') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setNotes('');
                              setEditMode(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={14} />
                            Confirmar
                          </Button>
                        )}
                        {payment.payment_proof_url && (
                          <a
                            href={payment.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 text-xs border rounded hover:bg-gray-50"
                            title="Ver comprovativo"
                          >
                            🧾 Comprovativo
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedPayment(payment)}
                          title="Ver detalhes completos"
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                    {/* Linha Expandida com Bookings */}
                    {expandedPaymentId === payment.id && (
                      <tr className="bg-blue-50 border-b">
                        <td colSpan={8} className="px-6 py-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">📋 Referências de Reservas Associadas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getBookingReferences(payment.id).map((ref) => (
                                <Card key={ref.id} className="border-l-4 border-l-blue-500">
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-mono text-sm font-semibold text-gray-900">{ref.reference}</p>
                                        <p className="text-xs text-gray-500 mt-1">{ref.description}</p>
                                      </div>
                                      <Badge className="bg-blue-100 text-blue-800">MZN {ref.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</Badge>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      📅 {new Date(ref.date).toLocaleDateString('pt-PT')}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
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
            <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros</p>
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
            ← Anterior
          </Button>
          <span className="text-gray-600 text-sm flex items-center px-4 py-2 border rounded-lg">
            Página <span className="font-bold mx-1">{page}</span> de <span className="font-bold mx-1">{paymentsPagination.totalPages}</span>
          </span>
          <Button
            onClick={() => {
              setPage(Math.min(paymentsPagination.totalPages, page + 1));
              loadPayments();
            }}
            disabled={page === paymentsPagination.totalPages}
            variant="outline"
          >
            Próximo →
          </Button>
        </div>
      )}

      {/* Modal de Confirmação/Detalhes */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-white border-b">
              <CardTitle className="flex items-center justify-between">
                <span>{(selectedPayment.status === 'pending' || selectedPayment.status === 'proof_uploaded') ? '✅ Confirmar Pagamento' : '📋 Detalhes do Pagamento'}</span>
                <Badge>{selectedPayment.booking_type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Referência</p>
                  <p className="font-mono text-sm font-bold text-gray-900 mt-1">{selectedPayment.reference_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Usuário</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedPayment.user_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Data</p>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedPayment.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>

              {/* Valores */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montante Bruto:</span>
                  <span className="font-bold text-lg text-gray-900">
                    MZN {parseFloat(selectedPayment.gross_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t py-3 flex justify-between items-center">
                  <span className="text-gray-600">Taxa Plataforma ({(parseFloat(selectedPayment.fee_amount || 0) / parseFloat(selectedPayment.gross_amount || 1) * 100).toFixed(1)}%):</span>
                  <span className="font-semibold text-red-600">
                    -MZN {parseFloat(selectedPayment.fee_amount || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t py-3 flex justify-between items-center bg-white -mx-4 px-4">
                  <span className="font-bold text-gray-900">Valor Líquido:</span>
                  <span className="font-bold text-lg text-green-600">
                    MZN {(parseFloat(selectedPayment.gross_amount || 0) - parseFloat(selectedPayment.fee_amount || 0)).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notas para Confirmação */}
              {(selectedPayment.status === 'pending' || selectedPayment.status === 'proof_uploaded') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Notas (opcional)
                  </label>
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione uma nota sobre esta confirmação..."
                    className="text-sm"
                  />
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    setSelectedPayment(null);
                    setNotes('');
                    setEditMode(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {(selectedPayment.status === 'pending' || selectedPayment.status === 'proof_uploaded') ? 'Cancelar' : 'Fechar'}
                </Button>
                {(selectedPayment.status === 'pending' || selectedPayment.status === 'proof_uploaded') && (
                  <Button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <Check size={16} className="mr-2" />
                    Confirmar Pagamento
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleCopyReference(selectedPayment.reference_number);
                  }}
                >
                  <Copy size={16} className="mr-2" />
                  Copiar Referência
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
