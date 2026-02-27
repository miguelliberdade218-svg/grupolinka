import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Search, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

export default function AdminComplaints() {
  const {
    complaints,
    complaintsPagination,
    loading,
    fetchComplaints,
    updateComplaintStatus,
    error,
    success,
    clearError,
    clearSuccess,
  } = useAdminStore();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadComplaints();
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
      setSelectedComplaint(null);
      setResolution('');
      loadComplaints();
    }
  }, [success, clearSuccess]);

  const loadComplaints = async () => {
    try {
      await fetchComplaints(page, 20, { status: statusFilter, priority: priorityFilter });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar reclamações');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedComplaint) return;

    try {
      await updateComplaintStatus(selectedComplaint.id, status, status === 'resolved' ? resolution : undefined);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">Novo</Badge>;
      case 'investigating':
        return <Badge className="bg-orange-100 text-orange-800">Investigando</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800">Descartado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando reclamações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Reclamações</h2>
        <p className="text-gray-600 mt-2">Monitore e resolva reclamações dos usuários</p>
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
              <option value="new">Novo</option>
              <option value="investigating">Investigando</option>
              <option value="resolved">Resolvido</option>
              <option value="dismissed">Descartado</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            >
              <option value="">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>

            <Button onClick={() => { setPage(1); loadComplaints(); }}>Filtrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      {complaints.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Criado
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600 uppercase text-xs">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint: any) => (
                  <tr key={complaint.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{complaint.id.substring(0, 8)}</td>
                    <td className="px-6 py-4">
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(complaint.status)}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(complaint.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        Visualizar
                      </Button>
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
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhuma reclamação encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {complaintsPagination && complaintsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => {
              setPage(Math.max(1, page - 1));
              loadComplaints();
            }}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="text-gray-600 text-sm flex items-center">
            Página {page} de {complaintsPagination.totalPages}
          </span>
          <Button
            onClick={() => {
              setPage(Math.min(complaintsPagination.totalPages, page + 1));
              loadComplaints();
            }}
            disabled={page === complaintsPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Detalhes da Reclamação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ID</p>
                  <p className="font-mono text-sm">{selectedComplaint.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p>{getStatusBadge(selectedComplaint.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prioridade</p>
                  <p>
                    <Badge className={getPriorityColor(selectedComplaint.priority)}>
                      {selectedComplaint.priority?.toUpperCase()}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Criado</p>
                  <p>{new Date(selectedComplaint.created_at).toLocaleString('pt-PT')}</p>
                </div>
              </div>

              {selectedComplaint.selectedComplaint === 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolução
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Descreva como foi resolvido..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleStatusChange('investigating')}
                  variant="outline"
                  className="flex-1"
                >
                  Investigando
                </Button>
                <Button
                  onClick={() => handleStatusChange('resolved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Resolvido
                </Button>
                <Button
                  onClick={() => handleStatusChange('dismissed')}
                  variant="destructive"
                  className="flex-1"
                >
                  Descartar
                </Button>
              </div>

              <Button
                onClick={() => setSelectedComplaint(null)}
                variant="outline"
                className="w-full"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
