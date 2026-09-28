import { useState, useEffect } from 'react';
import { rideCommissionService, RideCommission } from '@/services/rideCommissionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { toast } from 'sonner';
import {
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Filter,
  User,
} from 'lucide-react';

const formatPrice = (price: number): string => {
  return `${price.toLocaleString('pt-MZ', { minimumFractionDigits: 0 })} MT`;
};

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
    'paid': { label: 'Paga (Aguardando Confirmação)', class: 'bg-blue-100 text-blue-800' },
    'confirmed': { label: 'Confirmada', class: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rejeitada', class: 'bg-red-100 text-red-800' },
  };
  return map[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
};

export default function AdminCommissionManagement() {
  const [commissions, setCommissions] = useState<RideCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<RideCommission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const result = await rideCommissionService.getAllCommissions({
        status: statusFilter || undefined,
        driverId: driverFilter || undefined,
      });
      if (result.success) {
        setCommissions(result.data || []);
      } else {
        toast.error('Erro ao carregar comissões');
      }
    } catch (error: any) {
      console.error('Erro ao carregar comissões:', error);
      toast.error('Não foi possível carregar as comissões');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommissions();
  }, []);

  const handleOpenConfirm = (commission: RideCommission) => {
    setSelectedCommission(commission);
    setAdminNotes('');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedCommission) return;
    setActionLoading(selectedCommission.id);
    try {
      const result = await rideCommissionService.confirmPayment(
        selectedCommission.id,
        adminNotes || undefined
      );
      if (result.success) {
        toast.success('✅ Pagamento confirmado com sucesso!');
        setShowConfirmModal(false);
        setSelectedCommission(null);
        loadCommissions();
      } else {
        toast.error(result.message || 'Erro ao confirmar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao confirmar pagamento');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (commission: RideCommission) => {
    setSelectedCommission(commission);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedCommission) return;
    if (!rejectionReason.trim()) {
      toast.error('Indique o motivo da rejeição');
      return;
    }
    setActionLoading(selectedCommission.id);
    try {
      const result = await rideCommissionService.rejectPayment(
        selectedCommission.id,
        rejectionReason
      );
      if (result.success) {
        toast.success('Pagamento rejeitado');
        setShowRejectModal(false);
        setSelectedCommission(null);
        loadCommissions();
      } else {
        toast.error(result.message || 'Erro ao rejeitar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao rejeitar pagamento');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProof = (url?: string) => {
    if (url) window.open(url, '_blank');
  };

  const filteredCommissions = commissions.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (driverFilter && !c.driverName?.toLowerCase().includes(driverFilter.toLowerCase())) return false;
    return true;
  });

  const totalCommissionAmount = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commissionAmount, 0);
  const confirmedAmount = commissions.filter(c => c.status === 'confirmed').reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">💰 Gestão de Comissões</h2>
        <p className="text-gray-600 mt-1">Confirme, rejeite e controle os pagamentos de comissões dos motoristas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700">Pendente (A confirmar)</p>
            <p className="text-2xl font-bold text-yellow-900">{formatPrice(pendingAmount)}</p>
            <p className="text-xs text-yellow-600">{commissions.filter(c => c.status === 'pending').length} comissões</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <p className="text-sm text-green-700">Confirmadas</p>
            <p className="text-2xl font-bold text-green-900">{formatPrice(confirmedAmount)}</p>
            <p className="text-xs text-green-600">{commissions.filter(c => c.status === 'confirmed').length} comissões</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700">Total Geral</p>
            <p className="text-2xl font-bold text-blue-900">{formatPrice(totalCommissionAmount)}</p>
            <p className="text-xs text-blue-600">{commissions.length} comissões</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Paga (Aguardando)</option>
                <option value="confirmed">Confirmada</option>
                <option value="rejected">Rejeitada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
              <Input
                type="text"
                placeholder="Nome do motorista..."
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadCommissions}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading && commissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Carregando comissões...</p>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Motorista</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Corrida</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Comissão</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Comprovativo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{commission.driverName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {commission.rideDescription || 
                       (commission.fromLocation && commission.toLocation 
                        ? `${commission.fromLocation} → ${commission.toLocation}`
                        : commission.rideId?.slice(0, 8))}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatPrice(commission.ridePrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {formatPrice(commission.commissionAmount)}
                      <span className="text-xs text-gray-500 ml-1">({commission.commissionPercentage}%)</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusBadge(commission.status).class}>
                        {getStatusBadge(commission.status).label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {commission.proofImageUrl ? (
                        <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => handleViewProof(commission.proofImageUrl!)}>
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(commission.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {commission.status === 'paid' && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleOpenConfirm(commission)} disabled={actionLoading === commission.id}>
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => handleOpenReject(commission)} disabled={actionLoading === commission.id}>
                              <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {showConfirmModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" /> Confirmar Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Motorista:</strong> {selectedCommission.driverName || 'N/A'}</p>
                <p className="text-sm"><strong>Valor Comissão:</strong> {formatPrice(selectedCommission.commissionAmount)}</p>
                {selectedCommission.notes && (
                  <p className="text-sm"><strong>Notas do Motorista:</strong> {selectedCommission.notes}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                  placeholder="Adicione uma nota..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConfirm} disabled={actionLoading === selectedCommission.id}>
                  {actionLoading === selectedCommission.id ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Confirmando...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar Pagamento</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showRejectModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" /> Rejeitar Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Motorista:</strong> {selectedCommission.driverName || 'N/A'}</p>
                <p className="text-sm"><strong>Valor Comissão:</strong> {formatPrice(selectedCommission.commissionAmount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Rejeição *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Explique o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>Cancelar</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={actionLoading === selectedCommission.id || !rejectionReason.trim()}>
                  {actionLoading === selectedCommission.id ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Rejeitando...</> : <><XCircle className="w-4 h-4 mr-2" /> Rejeitar Pagamento</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}