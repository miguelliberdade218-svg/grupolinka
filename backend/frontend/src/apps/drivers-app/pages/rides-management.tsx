import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authContext';
// Import removido - agora usa rideCommissionService em vez de driverRidesApi
import { rideCommissionService } from '@/services/rideCommissionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { toast } from 'sonner';
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DriverRide } from '@/api/driver/rides';
import { formatDateOrFallback, formatTimeOnly } from '@/utils/dateFormatter';

// Formatar preço
const formatPrice = (price: number): string => {
  return `${price.toLocaleString('pt-MZ', { minimumFractionDigits: 0 })} MT`;
};

// ✅ Formatar data com fallback (nunca 1970)
const formatRideDate = (ride: any): string => {
  return formatDateOrFallback(
    ride?.departureDate ?? ride?.departuredate,
    ride?.createdAt ?? ride?.createdat
  );
};

// ✅ Veículo: matrícula + marca/modelo
const formatRideVehicle = (ride: any): { plate: string; model: string } => {
  const info = ride?.vehicleInfo || {};
  const plate = ride?.vehiclePlate || ride?.vehicle_plate || info.plateNumber || '';
  const make = ride?.vehicleMake || ride?.vehicle_make || info.make || '';
  const model = ride?.vehicleModel || ride?.vehicle_model || info.model || '';
  return {
    plate: plate || '—',
    model: [make, model].filter(Boolean).join(' ') || (ride?.vehicleType || 'Veículo'),
  };
};

// Obter badge de status
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; class: string }> = {
    'available': { label: 'Disponível', class: 'bg-green-100 text-green-800 border-green-300' },
    'active': { label: 'Ativa', class: 'bg-green-100 text-green-800 border-green-300' },
    'in_progress': { label: 'Em Curso', class: 'bg-blue-100 text-blue-800 border-blue-300' },
    'completed': { label: 'Completa', class: 'bg-gray-100 text-gray-800 border-gray-300' },
    'cancelled': { label: 'Cancelada', class: 'bg-red-100 text-red-800 border-red-300' },
    'pending': { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'confirmed': { label: 'Confirmada', class: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  };
  return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
};

// Status para exibição
const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    'active': 'Disponível para reservas',
    'in_progress': 'Corrida em andamento',
    'completed': 'Finalizada',
    'cancelled': 'Cancelada pelo motorista',
    'pending': 'Aguardando confirmação',
    'confirmed': 'Reservada por passageiros',
  };
  return map[status] || status;
};

export default function RidesManagement() {
  const { user } = useAuth();
  const [rides, setRides] = useState<DriverRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOther, setCancelOther] = useState('');

  const driverId = user?.id || '';

  // Carregar viagens
  const loadRides = async () => {
    if (!driverId) return;
    setLoading(true);
    try {
      const result = await rideCommissionService.getDriverRides(driverId);
      if (result.success) {
        setRides(result.rides || []);
      } else {
        toast.error('Erro ao carregar viagens');
      }
    } catch (error: any) {
      console.error('Erro ao carregar viagens:', error);
      toast.error('Não foi possível carregar suas viagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [driverId]);

  // Iniciar corrida
  const handleStartRide = async (rideId: string) => {
    setActionLoading(rideId);
    try {
      const result = await rideCommissionService.startRide(rideId);
      if (result.success) {
        toast.success('✅ Corrida iniciada com sucesso!');
        loadRides();
      } else {
        toast.error(result.message || 'Erro ao iniciar corrida');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao iniciar corrida');
    } finally {
      setActionLoading(null);
    }
  };

  // Completar corrida (já gera comissão)
  const handleCompleteRide = async (rideId: string) => {
    setActionLoading(rideId);
    try {
      const result = await rideCommissionService.completeRide(rideId);
      if (result.success) {
        const commissionValue = result.commission?.commissionAmount 
          ? ` (comissão de ${formatPrice(result.commission.commissionAmount)})`
          : '';
        toast.success(`✅ Corrida completa!${commissionValue}`);
        loadRides();
      } else {
        toast.error(result.message || 'Erro ao completar corrida');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao completar corrida');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancelar viagem
  const handleCancelRide = (rideId: string) => {
    setCancelRideId(rideId);
    setCancelReason('');
    setCancelOther('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelRideId) return;
    const reason = cancelReason === 'Outro' ? cancelOther.trim() : cancelReason;
    if (!reason) {
      toast.error('Selecione ou escreva um motivo');
      return;
    }
    setActionLoading(cancelRideId);
    try {
      const result = await rideCommissionService.cancelRide(cancelRideId, reason);
      if (result.success) {
        toast.success('Viagem cancelada');
        setCancelRideId(null);
        loadRides();
      } else {
        toast.error(result.message || 'Erro ao cancelar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar viagem');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrar por status
  const filteredRides = rides.filter((ride) => {
    if (activeTab === 'active') return ['available', 'active', 'confirmed', 'in_progress'].includes(ride.status);
    if (activeTab === 'completed') return ride.status === 'completed';
    if (activeTab === 'cancelled') return ride.status === 'cancelled';
    return true;
  });

  // Contagens
  const activeCount = rides.filter(r => ['available', 'active', 'confirmed', 'in_progress'].includes(r.status)).length;
  const completedCount = rides.filter(r => r.status === 'completed').length;
  const cancelledCount = rides.filter(r => r.status === 'cancelled').length;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Faça login para ver suas viagens</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🚗 Gestão de Viagens</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas corridas, inicie e complete viagens
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadRides}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Car className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Total</p>
                <p className="text-2xl font-bold text-blue-900">{rides.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Ativas</p>
                <p className="text-2xl font-bold text-green-900">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle2 className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm text-gray-700">Completas</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-red-700">Canceladas</p>
                <p className="text-2xl font-bold text-red-900">{cancelledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Ativas ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completas ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Canceladas ({cancelledCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando viagens...</p>
            </div>
          ) : filteredRides.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'active' ? 'Nenhuma viagem ativa' :
                   activeTab === 'completed' ? 'Nenhuma viagem completa' :
                   'Nenhuma viagem cancelada'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'active' 
                    ? 'Publique uma nova viagem para começar a receber passageiros.'
                    : 'Nenhuma viagem encontrada neste estado.'}
                </p>
                {activeTab === 'active' && (
                  <Button onClick={() => window.location.href = '/drivers/publish'}>
                    Publicar Nova Viagem
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRides.map((ride) => {
                const statusInfo = getStatusBadge(ride.status);
                return (
                  <Card key={ride.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Rota */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Car className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">
                                  {ride.fromCity || ride.fromAddress}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="font-semibold text-gray-900">
                                  {ride.toCity || ride.toAddress}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Info Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatRideDate(ride)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{ride.departureTime ? formatTimeOnly(`2000-01-01T${ride.departureTime}`) : '—'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>
                                {ride.availableSeats}/{ride.maxPassengers} lugares
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-green-600">
                                {formatPrice(ride.pricePerSeat)}/pessoa
                              </span>
                            </div>
                          </div>

                          {/* Veículo: Matrícula em destaque + Modelo/Marca */}
                          <div className="flex items-center gap-2 mb-4">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="inline-flex items-center rounded border border-gray-400 bg-gray-100 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-gray-800">
                              {formatRideVehicle(ride).plate}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatRideVehicle(ride).model}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-3">
                            <Badge className={statusInfo.class}>
                              {statusInfo.label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getStatusText(ride.status)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 space-y-2 min-w-[140px]">
                          {/* Botão Iniciar Corrida */}
                          {(ride.status === 'available' || ride.status === 'active' || ride.status === 'confirmed') && (
                            <Button
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStartRide(ride.id)}
                              disabled={actionLoading === ride.id}
                            >
                              {actionLoading === ride.id ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4 mr-1" />
                              )}
                              Iniciar Corrida
                            </Button>
                          )}

                          {/* Botão Completar Corrida */}
                          {ride.status === 'in_progress' && (
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompleteRide(ride.id)}
                              disabled={actionLoading === ride.id}
                            >
                              {actionLoading === ride.id ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                              )}
                              Completar Corrida
                            </Button>
                          )}

                          {/* Botão Cancelar */}
                          {(ride.status === 'available' || ride.status === 'active' || ride.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleCancelRide(ride.id)}
                              disabled={actionLoading === ride.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Cancelamento com Motivo */}
      {cancelRideId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cancelar Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Selecione o motivo do cancelamento:</p>
              <div className="space-y-2">
                {['Passageiro não apareceu', 'Problema no veículo', 'Emergência pessoal', 'Condições climáticas', 'Outro'].map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="cancelReason"
                      value={r}
                      checked={cancelReason === r}
                      onChange={() => setCancelReason(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
              {cancelReason === 'Outro' && (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                  placeholder="Descreva o motivo..."
                  value={cancelOther}
                  onChange={(e) => setCancelOther(e.target.value)}
                />
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCancelRideId(null)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleConfirmCancel}
                  disabled={actionLoading === cancelRideId}
                >
                  {actionLoading === cancelRideId ? 'Cancelando...' : 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
