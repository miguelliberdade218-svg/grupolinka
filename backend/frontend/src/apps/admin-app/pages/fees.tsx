import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

export default function AdminFees() {
  const { fees, loading, fetchFees, updateFee, error, success, clearError, clearSuccess } = useAdminStore();

  const [editingFee, setEditingFee] = useState<any>(null);
  const [newPercentage, setNewPercentage] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFees();
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
      setEditingFee(null);
      setNewPercentage('');
      setReason('');
      loadFees();
    }
  }, [success, clearSuccess]);

  const loadFees = async () => {
    try {
      await fetchFees();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar taxas');
    }
  };

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingFee || !newPercentage) {
      toast.error('Selecione uma taxa e insira um novo valor');
      return;
    }

    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Percentagem deve estar entre 0 e 100');
      return;
    }

    setSubmitting(true);
    try {
      await updateFee(editingFee.service_type, percentage, reason);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && fees.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando taxas...</p>
        </div>
      </div>
    );
  }

  const getFeeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'ride':
        return '🚗 Corridas';
      case 'hotel':
        return '🏨 Hotéis';
      case 'event_space':
        return '🎪 Espaços para Eventos';
      default:
        return serviceType;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Taxas/Comissões</h2>
        <p className="text-gray-600 mt-2">Configure as taxas de comissão da plataforma por serviço</p>
      </div>

      {/* Grid de Taxas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fees.map((fee: any) => (
          <Card key={fee.service_type} className="hover:shadow-lg transition">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">{getFeeLabel(fee.service_type)}</h3>

                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Taxa Atual</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {parseFloat(fee.fee_percentage).toFixed(2)}%
                  </p>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Ativa desde:{' '}
                    {new Date(fee.effective_from).toLocaleDateString('pt-PT')}
                  </p>
                  {fee.is_active && (
                    <Badge className="bg-green-100 text-green-800 inline-block">
                      ✅ Ativa
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setEditingFee(fee);
                    setNewPercentage(fee.fee_percentage);
                  }}
                  className="w-full"
                >
                  Editar Taxa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhuma taxa configurada</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      {editingFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Taxa - {getFeeLabel(editingFee.service_type)}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateFee} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Taxa Atual</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(editingFee.fee_percentage).toFixed(2)}%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Taxa (%) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={newPercentage}
                    onChange={(e) => setNewPercentage(e.target.value)}
                    placeholder="15.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Alteração (opcional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explicar por que está alterando a taxa..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <p className="text-xs text-orange-800">
                    ⚠️ <strong>Atenção:</strong> Esta alteração afetará todos os novos serviços
                    a partir de agora.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingFee(null);
                      setNewPercentage('');
                      setReason('');
                    }}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? 'Atualizando...' : 'Atualizar Taxa'}
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
