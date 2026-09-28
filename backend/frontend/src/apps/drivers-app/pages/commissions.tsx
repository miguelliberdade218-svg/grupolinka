import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/authContext';
import { rideCommissionService, RideCommission } from '@/services/rideCommissionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { toast } from 'sonner';
import {
  DollarSign,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Image,
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
    });
  } catch {
    return dateString;
  }
};

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
    'proof_uploaded': { label: 'Comprovativo Enviado', class: 'bg-blue-100 text-blue-800' },
    'paid': { label: 'Paga', class: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rejeitada', class: 'bg-red-100 text-red-800' },
  };
  return map[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
};

export default function DriverCommissions() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<RideCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const driverId = user?.id || '';

  const loadCommissions = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const result = await rideCommissionService.getDriverCommissions(driverId);
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
  }, [driverId]);

  // Filtrar comissões
  const filteredCommissions = commissions.filter(c => {
    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'proof_uploaded') return c.status === 'proof_uploaded';
    if (activeTab === 'paid') return c.status === 'paid';
    if (activeTab === 'rejected') return c.status === 'rejected';
    return true;
  });

  // Contagens
  const pendingCount = commissions.filter(c => c.status === 'pending').length;
  const proofUploadedCount = commissions.filter(c => c.status === 'proof_uploaded').length;
  const paidCount = commissions.filter(c => c.status === 'paid').length;
  const rejectedCount = commissions.filter(c => c.status === 'rejected').length;

  // Abrir modal de upload
  const handleOpenUpload = (commissionId: string) => {
    setSelectedCommissionId(commissionId);
    setSelectedFile(null);
    setUploadNotes('');
    setShowUploadModal(true);
  };

  // Selecionar ficheiro
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo (imagem ou PDF)
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Apenas ficheiros JPG, PNG ou PDF');
        return;
      }
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ficheiro muito grande (máx 5MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Enviar comprovativo
  const handleSubmitPayment = async () => {
    if (!selectedCommissionId) return;
    if (!selectedFile) {
      toast.error('Selecione um ficheiro comprovativo');
      return;
    }

    setActionLoading(selectedCommissionId);
    try {
      const result = await rideCommissionService.markAsPaid(
        selectedCommissionId,
        selectedFile,
        uploadNotes || undefined
      );
      if (result.success) {
        toast.success('✅ Comprovativo enviado! Aguardando confirmação do admin.');
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadNotes('');
        loadCommissions();
      } else {
        toast.error(result.message || 'Erro ao enviar comprovativo');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar comprovativo');
    } finally {
      setActionLoading(null);
    }
  };

  // Ver comprovativo
  const handleViewProof = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Faça login para ver suas comissões</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Minhas Comissões</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe e pague as comissões das suas corridas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCommissions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-blue-900">Como funcionam as comissões?</p>
              <p className="text-sm text-blue-800 mt-1">
                Ao completar uma corrida, uma comissão é gerada automaticamente. 
                Para pagar, anexe um comprovativo (foto do depósito ou transferência) 
                e o admin confirmará o pagamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-700">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Pagas/Confirmadas</p>
                <p className="text-2xl font-bold text-green-900">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-700">Rejeitadas</p>
                <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="proof_uploaded">Enviadas ({proofUploadedCount})</TabsTrigger>
          <TabsTrigger value="paid">Pagas ({paidCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitadas ({rejectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando comissões...</p>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'pending' 
                    ? 'Nenhuma comissão pendente'
                    : activeTab === 'paid'
                    ? 'Nenhuma comissão paga'
                    : 'Nenhuma comissão rejeitada'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'pending'
                    ? 'Complete corridas para gerar comissões.'
                    : 'Nenhuma comissão encontrada neste estado.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCommissions.map((commission) => {
                const statusInfo = getStatusBadge(commission.status);
                const isExpanded = expandedId === commission.id;

                return (
                  <Card key={commission.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Info row */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {commission.referenceNumber || `Comissão #${commission.id.slice(0, 8)}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {commission.type === 'ride' ? '🚗 Corrida' : commission.type === 'hotel' ? '🏨 Hotel' : commission.type === 'event' ? '🎪 Evento' : ''}
                                {commission.dueDate ? ` • Vence ${formatDate(commission.dueDate)}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Values */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                            <div>
                              <span className="text-gray-500">Valor da Transação:</span>
                              <p className="font-semibold text-gray-900">{formatPrice(commission.grossAmount)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Comissão ({commission.feePercentage}%):</span>
                              <p className="font-semibold text-orange-600">{formatPrice(commission.feeAmount)}</p>
                            </div>
                            <div>
                              <Badge className={statusInfo.class}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 space-y-2 min-w-[140px]">
                          {/* Botão Pagar (só para pendentes) */}
                          {(commission.status === 'pending' || commission.status === 'rejected') && (
                            <Button
                              size="sm"
                              className="w-full bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleOpenUpload(commission.id)}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              {commission.status === 'rejected' ? 'Reenviar' : 'Pagar Comissão'}
                            </Button>
                          )}

                          {/* Botão Ver Comprovativo */}
                          {commission.proofImageUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleViewProof(commission.proofImageUrl)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Comprovativo
                            </Button>
                          )}

                          {/* Expandir detalhes */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full"
                            onClick={() => setExpandedId(isExpanded ? null : commission.id)}
                          >
                            {isExpanded ? (
                              <><ChevronUp className="w-4 h-4 mr-1" /> Ocultar</>
                            ) : (
                              <><ChevronDown className="w-4 h-4 mr-1" /> Detalhes</>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">ID da Comissão:</span>
                              <p className="font-mono text-xs text-gray-700">{commission.id}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Referência:</span>
                              <p className="font-mono text-xs text-gray-700">{commission.referenceNumber}</p>
                            </div>
                            {commission.notes && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Suas Notas:</span>
                                <p className="text-gray-700 mt-1">{commission.notes}</p>
                              </div>
                            )}
                            {commission.status === 'rejected' && commission.notes && (
                              <div className="col-span-2 bg-red-50 p-3 rounded-lg">
                                <span className="text-red-700 font-semibold">Motivo da Rejeição:</span>
                                <p className="text-red-600 mt-1">{commission.notes}</p>
                              </div>
                            )}
                            {commission.paidAt && (
                              <div>
                                <span className="text-gray-500">Paga em:</span>
                                <p className="text-gray-700">{formatDate(commission.paidAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-600" />
                Pagar Comissão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Instruções:</strong> Faça o pagamento da comissão e anexe o 
                  comprovativo (foto do depósito, screenshot da transferência, ou PDF).
                </p>
              </div>

              {/* Upload */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-10 h-10 mx-auto text-green-600" />
                    <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="font-semibold text-gray-600">
                      Clique para selecionar o comprovativo
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG, PNG ou PDF (máx 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                  placeholder="Ex: Pagamento via M-Pesa, referência 12345..."
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={handleSubmitPayment}
                  disabled={!selectedFile || actionLoading === selectedCommissionId}
                >
                  {actionLoading === selectedCommissionId ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Enviar Comprovativo</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
