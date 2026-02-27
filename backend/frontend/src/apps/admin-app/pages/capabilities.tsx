import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface User {
  id: string;
  fullName: string;
  email: string;
  type: 'driver' | 'hotel_manager';
  status: string;
  createdAt: string;
  documents: boolean;
}

interface FormData {
  userId: string;
  reason: string;
  action: 'approve' | 'reject';
}

export default function AdminCapabilities() {
  const {
    verificationQueue,
    loading,
    fetchVerificationQueue,
    approveDriver,
    rejectDriver,
    approveHotelManager,
    rejectHotelManager,
    error,
    success,
    clearError,
    clearSuccess,
  } = useAdminStore();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ userId: '', reason: '', action: 'approve' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'driver' | 'hotel_manager'>('all');

  useEffect(() => {
    loadQueue();
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
      setSelectedUser(null);
      setFormData({ userId: '', reason: '', action: 'approve' });
      loadQueue();
    }
  }, [success, clearSuccess]);

  const loadQueue = async () => {
    try {
      await fetchVerificationQueue();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao buscar fila');
    }
  };

  const filteredQueue = verificationQueue.filter((user) =>
    filter === 'all' ? true : user.type === filter
  );

  const handleApprove = async (userId: string) => {
    setSelectedUser(verificationQueue.find((u) => u.id === userId) || null);
    setFormData({ userId, action: 'approve', reason: '' });
  };

  const handleReject = async (userId: string) => {
    setSelectedUser(verificationQueue.find((u) => u.id === userId) || null);
    setFormData({ userId, action: 'reject', reason: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.action === 'reject' && !formData.reason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    setSubmitting(true);
    try {
      if (!selectedUser) return;

      if (selectedUser.type === 'driver') {
        if (formData.action === 'approve') {
          await approveDriver(formData.userId, formData.reason || undefined);
        } else {
          await rejectDriver(formData.userId, formData.reason);
        }
      } else if (selectedUser.type === 'hotel_manager') {
        if (formData.action === 'approve') {
          await approveHotelManager(formData.userId, formData.reason || undefined);
        } else {
          await rejectHotelManager(formData.userId, formData.reason);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && verificationQueue.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando fila de verificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Fila de Verificações</h2>
        <p className="text-gray-600 mt-2">Aprove ou rejeite solicitações de motoristas e gestores de hotéis</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'driver', 'hotel_manager'] as const).map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
          >
            {f === 'all' && '👁️ Todos'}
            {f === 'driver' && '🚗 Motoristas'}
            {f === 'hotel_manager' && '🏨 Gestores de Hotel'}
          </Button>
        ))}
      </div>

      {/* Tabela */}
      {filteredQueue.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Documentos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.fullName}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {user.type === 'driver' ? '🚗 Motorista' : '🏨 Gerente Hotel'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.documents ? (
                        <Badge className="bg-green-100 text-green-800">✅ Sim</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">⚠️ Não</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleApprove(user.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                        >
                          <Check size={16} />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleReject(user.id)}
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <X size={16} />
                          Rejeitar
                        </Button>
                      </div>
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
            <div className="text-5xl mb-4">✅</div>
            <p className="text-gray-600 text-lg">Nenhuma verificação pendente!</p>
            <p className="text-gray-400 text-sm mt-2">Todas as solicitações foram processadas</p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {formData.action === 'approve' ? '✅ Aprovar' : '❌ Rejeitar'}{' '}
                {selectedUser.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formData.action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo da rejeição *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Explicar por que está rejeitando..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      required
                    />
                  </div>
                )}

                {formData.action === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Adicionar notas sobre a aprovação..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setFormData({ userId: '', reason: '', action: 'approve' });
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className={`flex-1 ${
                      formData.action === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : formData.action === 'approve' ? (
                      'Confirmar Aprovação'
                    ) : (
                      'Confirmar Rejeição'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
