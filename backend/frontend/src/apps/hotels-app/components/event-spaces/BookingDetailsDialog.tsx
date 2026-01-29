// src/apps/hotels-app/components/event-spaces/BookingDetailsDialog.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  Loader2,
  Calendar,
  Users,
  DollarSign,
  FileText,
  CreditCard,
  User,
  Mail,
  Phone,
  Building,
  MessageSquare,
  Receipt,
  Download,
  ShieldCheck,
  Info,
  Package,
  Coffee,
  Home,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api'; // ✅ CORRIGIDO: import correto
import { eventSpaceService } from '@/services/eventSpaceService';
import { format, parseISO, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import BookingActions from './BookingActions';
import PaymentManagement from './PaymentManagement';
import type { EventBooking, EventSpace, FullBookingDetails } from '@/shared/types/event-spaces';

interface BookingDetailsDialogProps {
  bookingId: string;
  open: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
}

interface HotelInfo {
  id: string;
  name: string;
  address?: string;
  locality?: string;
  province?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export const BookingDetailsDialog: React.FC<BookingDetailsDialogProps> = ({
  bookingId,
  open,
  onClose,
  onBookingUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [spaceInfo, setSpaceInfo] = useState<EventSpace | null>(null);
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<FullBookingDetails | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const { toast } = useToast();

  useEffect(() => {
    if (open && bookingId) {
      loadBookingDetails();
    }
  }, [open, bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Usar eventSpaceService para obter detalhes completos
      const res = await eventSpaceService.getFullBookingDetails(bookingId);
      
      if (res.success && res.data) {
        const bookingData = res.data.booking;
        setBooking(bookingData);
        setPaymentDetails(res.data);

        // ✅ CORREÇÃO: Usar eventSpaceService.getEventSpaceById (método existente)
        if (bookingData.eventSpaceId) {
          try {
            const spaceRes = await eventSpaceService.getEventSpaceById(bookingData.eventSpaceId);
            if (spaceRes.success && spaceRes.data) {
              setSpaceInfo(spaceRes.data);
            }
          } catch (spaceErr) {
            console.error('Erro ao carregar espaço:', spaceErr);
          }
        }
        
        // ✅ CORREÇÃO: Usar apiService.getHotelById (método existente no apiService.ts)
        if (bookingData.hotelId) {
          try {
            const hotelRes = await apiService.getHotelById(bookingData.hotelId);
            if (hotelRes.success && hotelRes.data) {
              const hotelData = hotelRes.data;
              setHotelInfo({
                id: hotelData.id || hotelData.hotel_id || '',
                name: hotelData.name || '',
                address: hotelData.address,
                locality: hotelData.locality,
                province: hotelData.province,
                contactPhone: hotelData.contact_phone,
                contactEmail: hotelData.contact_email,
              });
            }
          } catch (hotelErr) {
            console.error('Erro ao carregar hotel:', hotelErr);
            // Fallback: mostrar informações básicas da reserva mesmo sem hotel
            toast({
              title: '⚠️ Informação parcial',
              description: 'Detalhes do hotel não disponíveis',
              variant: 'default',
            });
          }
        }
      } else {
        throw new Error(res.error || 'Falha ao carregar reserva');
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao carregar detalhes',
        description: err.message || 'Falha ao carregar informações da reserva',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (action: string, data?: any) => {
    try {
      let res;
      switch (action) {
        case 'confirm':
          res = await eventSpaceService.confirmBooking(bookingId);
          break;
        case 'reject':
          res = await eventSpaceService.rejectBooking(bookingId, data?.reason);
          break;
        case 'cancel':
          res = await eventSpaceService.cancelBooking(bookingId, data?.reason);
          break;
        case 'start':
          // Implementar lógica para iniciar evento
          toast({
            title: '⚠️ Em desenvolvimento',
            description: 'Funcionalidade de iniciar evento em breve',
          });
          return;
        case 'complete':
          // Implementar lógica para completar evento
          toast({
            title: '⚠️ Em desenvolvimento',
            description: 'Funcionalidade de completar evento em breve',
          });
          return;
        default:
          return;
      }
      
      if (res.success) {
        toast({
          title: '✅ Ação realizada',
          description: `Ação ${action} realizada com sucesso`,
          variant: 'success',
        });
        await loadBookingDetails();
        if (onBookingUpdated) onBookingUpdated();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro na ação',
        description: err.message || 'Falha ao realizar ação',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount == null) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt });
    } catch {
      return dateString;
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      return differenceInDays(end, start) + 1;
    } catch {
      return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string; icon: React.ReactNode }> = {
      'pending_approval': {
        variant: 'default',
        label: 'Aguardando aprovação',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      'confirmed': {
        variant: 'default',
        label: 'Confirmado',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'cancelled': {
        variant: 'destructive',
        label: 'Cancelado',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'rejected': {
        variant: 'destructive',
        label: 'Rejeitado',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'completed': {
        variant: 'default',
        label: 'Concluído',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'in_progress': {
        variant: 'secondary',
        label: 'Em andamento',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
    };
    
    const statusInfo = statusMap[status] || { variant: 'default', label: status, icon: null };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
      'paid': { variant: 'default', label: 'Pago' },
      'pending': { variant: 'default', label: 'Pendente' },
      'partial': { variant: 'secondary', label: 'Parcial' },
      'overdue': { variant: 'destructive', label: 'Atrasado' },
      'refunded': { variant: 'outline', label: 'Reembolsado' },
      'failed': { variant: 'destructive', label: 'Falhou' },
      'cancelled': { variant: 'destructive', label: 'Cancelado' },
    };
    
    const statusInfo = statusMap[status] || { variant: 'default', label: status };
    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Carregando detalhes...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserva não encontrada</DialogTitle>
            <DialogDescription>
              A reserva solicitada não foi encontrada ou foi removida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Calcular valores financeiros a partir dos pagamentos
  const totalAmount = parseFloat(booking.totalPrice) || 0;
  const paidAmount = paymentDetails 
    ? paymentDetails.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
    : 0;
  const balanceDue = totalAmount - paidAmount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Reserva
              </DialogTitle>
              <DialogDescription>
                Código: {booking.id.slice(0, 8).toUpperCase()} • Criada em: {formatDate(booking.createdAt)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">
              <Info className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="services">
              <Package className="h-4 w-4 mr-2" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="space">
              <Building className="h-4 w-4 mr-2" />
              Espaço
            </TabsTrigger>
            <TabsTrigger value="logs">
              <MessageSquare className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do Evento */}
              <Card className="p-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Evento
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-600">Título do Evento</Label>
                    <p className="font-medium">{booking.eventTitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Tipo de Evento</Label>
                      <p className="font-medium">{booking.eventType}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Participantes</Label>
                      <p className="font-medium">{booking.expectedAttendees}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Data de Início</Label>
                      <p className="font-medium">{formatDate(booking.startDate)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Data de Término</Label>
                      <p className="font-medium">{formatDate(booking.endDate)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Duração</Label>
                    <p className="font-medium">{calculateDuration(booking.startDate, booking.endDate)} dia(s)</p>
                  </div>
                  {booking.specialRequests && (
                    <div>
                      <Label className="text-gray-600">Pedidos Especiais</Label>
                      <p className="text-gray-700">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Informações do Organizador */}
              <Card className="p-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Organizador
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-600">Nome</Label>
                    <p className="font-medium">{booking.organizerName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {booking.organizerEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Telefone</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {booking.organizerPhone || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Informações Financeiras */}
              <Card className="p-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Informações Financeiras
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Valor Total</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Valor Pago</Label>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(paidAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Saldo Pendente</Label>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(balanceDue)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Depósito de Segurança</Label>
                      <p className="font-medium">
                        {formatCurrency(booking.securityDeposit)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status do Pagamento</Label>
                    <div className="mt-1">{getPaymentStatusBadge(booking.paymentStatus)}</div>
                  </div>
                </div>
              </Card>

              {/* Status e Metadados */}
              <Card className="p-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Status e Metadados
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-600">Status da Reserva</Label>
                    <div className="mt-1">{getStatusBadge(booking.status)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Criada em</Label>
                      <p className="font-medium">{formatDate(booking.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Atualizada em</Label>
                      <p className="font-medium">{formatDate(booking.updatedAt)}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Catering</Label>
                    <p className="font-medium">
                      {booking.cateringRequired ? '✅ Requerido' : '❌ Não requerido'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">ID da Reserva</Label>
                    <p className="font-medium text-sm">{booking.id}</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Pagamentos */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentManagement
              bookingId={bookingId}
              bookingTitle={booking.eventTitle}
              totalAmount={totalAmount}
              paidAmount={paidAmount}
              balanceDue={balanceDue}
              onPaymentRegistered={() => {
                loadBookingDetails();
                if (onBookingUpdated) onBookingUpdated();
              }}
            />
          </TabsContent>

          {/* Tab: Serviços */}
          <TabsContent value="services" className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold text-lg mb-4">Serviços Adicionais</h4>
              
              {/* Catering */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="h-5 w-5" />
                  <h5 className="font-medium">Catering</h5>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className={booking.cateringRequired ? 'text-green-600' : 'text-gray-600'}>
                    {booking.cateringRequired 
                      ? '✅ Catering solicitado para este evento'
                      : '❌ Catering não solicitado'}
                  </p>
                </div>
              </div>

              {/* Serviços Adicionais */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5" />
                  <h5 className="font-medium">Serviços Adicionais</h5>
                </div>
                
                {booking.additionalServices && Object.keys(booking.additionalServices).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(booking.additionalServices).map(([key, value]) => (
                      <Card key={key} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-gray-600">
                              {typeof value === 'boolean' 
                                ? (value ? '✅ Incluído' : '❌ Não incluído')
                                : String(value)}
                            </p>
                          </div>
                          {typeof value === 'number' && value > 0 && (
                            <Badge variant="outline">
                              {formatCurrency(value)}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 text-center rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum serviço adicional solicitado</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Tab: Espaço */}
          <TabsContent value="space" className="space-y-6">
            {spaceInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações do Espaço */}
                <Card className="p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informações do Espaço
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-600">Nome do Espaço</Label>
                      <p className="font-medium">{spaceInfo.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Capacidade Mínima</Label>
                        <p className="font-medium">{spaceInfo.capacityMin} pessoas</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Capacidade Máxima</Label>
                        <p className="font-medium">{spaceInfo.capacityMax} pessoas</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Preço Base/Dia</Label>
                        <p className="font-medium">{formatCurrency(spaceInfo.basePricePerDay)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Área</Label>
                        <p className="font-medium">{spaceInfo.areaSqm || '—'} m²</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Tipo de Espaço</Label>
                      <p className="font-medium">{spaceInfo.spaceType || 'Não especificado'}</p>
                    </div>
                  </div>
                </Card>

                {/* Amenidades */}
                <Card className="p-6">
                  <h4 className="font-semibold text-lg mb-4">Amenidades</h4>
                  {spaceInfo.equipment && Object.keys(spaceInfo.equipment).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(spaceInfo.equipment).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{key.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">Nenhuma amenidade listada</p>
                  )}
                </Card>

                {/* Informações do Hotel */}
                {hotelInfo && (
                  <Card className="p-6 md:col-span-2">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Informações do Hotel
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-gray-600">Nome do Hotel</Label>
                        <p className="font-medium">{hotelInfo.name}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Localização</Label>
                        <p className="font-medium">
                          {hotelInfo.locality && hotelInfo.province 
                            ? `${hotelInfo.locality}, ${hotelInfo.province}`
                            : 'Localização não disponível'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Contato</Label>
                        <div className="space-y-1">
                          {hotelInfo.contactPhone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {hotelInfo.contactPhone}
                            </p>
                          )}
                          {hotelInfo.contactEmail && (
                            <p className="text-sm flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {hotelInfo.contactEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Informações do espaço não disponíveis</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="p-6">
              <h4 className="font-semibold text-lg mb-4">Histórico de Alterações</h4>
              {paymentDetails?.logs && paymentDetails.logs.length > 0 ? (
                <div className="space-y-4">
                  {paymentDetails.logs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          {log.performedBy && (
                            <p className="text-sm text-gray-600">Por: {log.performedBy}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{formatDate(log.createdAt)}</p>
                        </div>
                        {log.details && (
                          <div className="text-sm text-gray-600 max-w-md">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum histórico disponível</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {booking && (
              <BookingActions
                booking={{
                  id: booking.id,
                  status: booking.status,
                  payment_status: booking.paymentStatus,
                  balance_due: balanceDue.toString(),
                  event_title: booking.eventTitle,
                }}
                onAction={handleBookingAction}
                showDetails={false}
                showPayments={false}
                showEdit={true}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={loadBookingDetails}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsDialog;