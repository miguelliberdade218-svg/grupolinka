import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

export default function AdminAudit() {
  const { logs, logsPagination, loading, fetchAdminLogs, error, clearError } = useAdminStore();

  const [page, setPage] = useState(1);
  const [adminId, setAdminId] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const loadLogs = async () => {
    try {
      await fetchAdminLogs(page, 50, { adminId });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar logs');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActionColor = (reason: string) => {
    if (reason.includes('approve'))
      return 'bg-green-100 text-green-800';
    if (reason.includes('reject'))
      return 'bg-red-100 text-red-800';
    if (reason.includes('suspend'))
      return 'bg-orange-100 text-orange-800';
    if (reason.includes('activate'))
      return 'bg-blue-100 text-blue-800';
    if (reason.includes('confirm'))
      return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionLabel = (reason: string) => {
    const labels: any = {
      approve_driver: '✅ Aprovar Motorista',
      reject_driver: '❌ Rejeitar Motorista',
      suspend_driver: '⏸️ Suspender Motorista',
      suspend_client: '⏸️ Suspender Cliente',
      reactivate_client: '✅ Reativar Cliente',
      approve_hotel_manager: '✅ Aprovar Gestor Hotel',
      reject_hotel_manager: '❌ Rejeitar Gestor Hotel',
      suspend_hotel: '⏸️ Suspender Hotel',
      activate_hotel: '✅ Ativar Hotel',
      update_complaint_status: '📝 Atualizar Reclamação',
      confirm_payment: '💳 Confirmar Pagamento',
      update_fee: '💰 Atualizar Taxa',
    };
    return labels[reason] || reason;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Log de Auditoria</h2>
        <p className="text-gray-600 mt-2">Acompanhe todas as ações administrativas da plataforma</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="text"
                placeholder="Filtrar por ID do admin..."
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
              />
              <div></div>
              <Button type="submit">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Timeline de Logs */}
      {logs.length > 0 ? (
        <div className="space-y-4">
          {logs.map((log: any, index: number) => (
            <Card key={log.id || index} className="hover:shadow-md transition">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Timeline Indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(log.reason)}`}>
                      {log.reason.includes('approve') && '✅'}
                      {log.reason.includes('reject') && '❌'}
                      {log.reason.includes('suspend') && '⏸️'}
                      {log.reason.includes('activate') && '✅'}
                      {log.reason.includes('confirm') && '💳'}
                      {log.reason.includes('update') && '📝'}
                      {!['approve', 'reject', 'suspend', 'activate', 'confirm', 'update'].some((text) =>
                        log.reason.includes(text)
                      ) && '📋'}
                    </div>
                    {index !== logs.length - 1 && (
                      <div className="w-1 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Log Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionColor(log.reason)}>
                        {getActionLabel(log.reason)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        por {log.changed_by?.substring(0, 8) || log.user_id?.substring(0, 8) || 'Sistema'}
                      </span>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs">
                        {log.metadata.reason && (
                          <p className="text-gray-700">
                            <strong>Motivo:</strong> {log.metadata.reason}
                          </p>
                        )}
                        {log.metadata.reference && (
                          <p className="text-gray-700">
                            <strong>Referência:</strong> {log.metadata.reference}
                          </p>
                        )}
                        {log.metadata.service_type && (
                          <p className="text-gray-700">
                            <strong>Serviço:</strong> {log.metadata.service_type}
                          </p>
                        )}
                        {log.metadata.fee_percentage && (
                          <p className="text-gray-700">
                            <strong>Nova Taxa:</strong> {log.metadata.fee_percentage}%
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum log encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {logsPagination && logsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => {
              setPage(Math.max(1, page - 1));
              loadLogs();
            }}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>

          <span className="text-gray-600 text-sm flex items-center">
            Página {page} de {logsPagination.totalPages}
          </span>

          <Button
            onClick={() => {
              setPage(Math.min(logsPagination.totalPages, page + 1));
              loadLogs();
            }}
            disabled={page === logsPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
