import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface Commission {
  id: number;
  referenceNumber: string;
  type: 'ride' | 'hotel';
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'rejected';
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  createdAt: string;
  paidAt?: string;
}

interface CommissionResponse {
  success: boolean;
  data: Commission[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { pendingAmount: number; overdueCount: number; overdueAmount: number };
}

interface FilterState {
  all: boolean;
  pending: boolean;
  overdue: boolean;
  paid: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
  }).format(value);
};

const getStatusColor = (
  status: string,
  isOverdue: boolean
): string => {
  if (isOverdue && status === 'pending') return 'bg-red-100 text-red-800 border-red-300';
  if (status === 'pending') return 'bg-blue-100 text-blue-800 border-blue-300';
  if (status === 'pending_confirmation') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  if (status === 'confirmed') return 'bg-green-100 text-green-800 border-green-300';
  if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'pending_confirmation':
      return 'Aguardando Confirmação';
    case 'confirmed':
      return 'Confirmado';
    case 'rejected':
      return 'Rejeitado';
    default:
      return status;
  }
};

export default function ProviderPaymentsDashboard() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState({
    pendingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [filters, setFilters] = useState<FilterState>({
    all: true,
    pending: false,
    overdue: false,
    paid: false,
  });

  const fetchCommissions = async (pageNum: number, statusFilter?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('firebaseToken');

      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `/api/provider/payments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: CommissionResponse = await response.json();

      if (data.success) {
        setCommissions(data.data);
        setSummary(data.summary);
        setPagination(data.pagination);
        setPage(pageNum);
      } else {
        setError('Erro ao carregar comissões');
      }
    } catch (err) {
      console.error('Erro ao buscar comissões:', err);
      setError('Erro ao buscar comissões: ' + (err instanceof Error ? err.message : 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions(1);
  }, []);

  const handleFilterChange = (filterKey: keyof FilterState) => {
    const newFilters = {
      all: false,
      pending: false,
      overdue: false,
      paid: false,
    };

    if (filterKey === 'all') {
      newFilters.all = true;
    } else {
      newFilters[filterKey] = true;
    }

    setFilters(newFilters);

    let statusFilter = undefined;
    if (filterKey === 'pending') statusFilter = 'pending';
    if (filterKey === 'overdue') statusFilter = 'pending'; // Será filtrado no front por isOverdue
    if (filterKey === 'paid') statusFilter = 'confirmed';

    fetchCommissions(1, statusFilter);
  };

  const handleMarkAsPaid = async (commissionId: number) => {
    try {
      const token = localStorage.getItem('firebaseToken');
      
      const response = await fetch(
        `/api/provider/payments/${commissionId}/mark-paid`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: 'Pagamento realizado pelo provider',
          }),
        }
      );

      if (response.ok) {
        alert('✅ Pagamento marcado como pago. Aguardando confirmação do admin.');
        fetchCommissions(page);
      } else {
        alert('❌ Erro ao marcar como pago');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao processar: ' + (err instanceof Error ? err.message : 'desconhecido'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💳 Minhas Comissões</h1>
          <p className="text-gray-600">
            Acompanhe todas as suas comissões de rides e reservas de hotéis
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Pendente */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Pendente</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {formatCurrency(summary.pendingAmount)}
                </p>
              </div>
              <Clock className="w-12 h-12 text-blue-300" />
            </div>
          </div>

          {/* Vencidos */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Vencidos</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {summary.overdueCount} itens
                </p>
                <p className="text-sm text-red-500 mt-1">
                  {formatCurrency(summary.overdueAmount)}
                </p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-300" />
            </div>
          </div>

          {/* Total Confirmado */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Confirmado</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {pagination.total} transações
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-300" />
            </div>
          </div>
        </div>

        {/* Alert if there are overdue items */}
        {summary.overdueCount > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Atenção: Você tem {summary.overdueCount} comissão(ões) vencida(s)!</p>
              <p className="text-red-600 text-sm mt-1">
                Total de {formatCurrency(summary.overdueAmount)} aguardando pagamento
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.all
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.pending
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => handleFilterChange('overdue')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.overdue
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Vencidos
          </button>
          <button
            onClick={() => handleFilterChange('paid')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filters.paid
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Confirmados
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando comissões...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && commissions.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhuma comissão encontrada</p>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && commissions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Referência</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Valor Transação</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Comissão (12%)</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Vencimento</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission, index) => (
                    <tr key={commission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Type Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          commission.type === 'ride'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {commission.type === 'ride' ? '🚗 Ride' : '🏨 Hotel'}
                        </span>
                      </td>

                      {/* Reference Number */}
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-700">
                          {commission.referenceNumber}
                        </code>
                      </td>

                      {/* Gross Amount */}
                      <td className="px-6 py-4 text-right">
                        <p className="font-medium text-gray-800">
                          {formatCurrency(commission.grossAmount)}
                        </p>
                      </td>

                      {/* Fee Amount (Commission) */}
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-orange-600">
                          {formatCurrency(commission.feeAmount)}
                        </p>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <p className="text-sm text-gray-700">{commission.dueDate}</p>
                          <p className={`text-xs font-semibold ${
                            commission.isOverdue ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {commission.isOverdue 
                              ? `⚠️ ${Math.abs(commission.daysUntilDue)} dias vencido`
                              : `${commission.daysUntilDue} dias restantes`
                            }
                          </p>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(commission.status, commission.isOverdue)}`}>
                          {getStatusLabel(commission.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsPaid(commission.id)}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition"
                          >
                            Marcar como Pago
                          </button>
                        )}
                        {commission.status === 'pending_confirmation' && (
                          <span className="text-xs text-yellow-600 font-semibold">Aguardando...</span>
                        )}
                        {commission.status === 'confirmed' && (
                          <span className="text-xs text-green-600 font-semibold">✅ Confirmado</span>
                        )}
                        {commission.status === 'rejected' && (
                          <span className="text-xs text-red-600 font-semibold">❌ Rejeitado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && commissions.length > 0 && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-lg">
            <button
              onClick={() => fetchCommissions(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-400 transition"
            >
              ← Anterior
            </button>

            <span className="text-gray-600">
              Página {pagination.page} de {pagination.pages}
            </span>

            <button
              onClick={() => fetchCommissions(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
