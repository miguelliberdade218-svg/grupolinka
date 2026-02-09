// src/apps/hotels-app/pages/bookings/components/BookingList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HotelBooking } from '@/shared/types/bookings';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Users as UsersIcon,
  CreditCard,
  MoreVertical,
  Eye,
  CheckCircle,
  DoorOpen,
  LogOut,
  XCircle,
  FileText,
  RefreshCw,
  AlertCircle,
  Bed,
  Check,
  X,
  UserX,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useToast } from '@/shared/hooks/use-toast';

// ✅ IMPORTAR UTILIDADES COMPARTILHADAS
import {
  normalizeStatus,
  normalizePaymentStatus,
  canCheckIn as canCheckInUtil,
  canCheckOut as canCheckOutUtil,
  canCancel as canCancelUtil,
  canConfirm as canConfirmUtil,
  canReject as canRejectUtil,
  canMarkNoShow as canMarkNoShowUtil,
  canRegisterPayment as canRegisterPaymentUtil,
  getStatusConfig,
  getPaymentStatusConfig,
  getAvailableActions,
  BOOKING_ACTION_CONFIGS,
} from '../../../utils/bookingUtils';

// ✅ CORREÇÃO: Tipo extendido com informações do room type
interface HotelBookingWithRoomType extends HotelBooking {
  roomTypeName?: string;
  roomTypeCapacity?: number;
  roomTypeTotalUnits?: number;
  roomTypeBasePrice?: string;
}

interface BookingListProps {
  bookings: HotelBooking[];
  loading?: boolean;
  onViewDetails: (booking: HotelBooking) => void;
  onConfirm: (booking: HotelBooking) => void; // ✅ NOVO
  onReject: (booking: HotelBooking) => void; // ✅ NOVO
  onCheckIn: (booking: HotelBooking) => void;
  onCheckOut: (booking: HotelBooking) => void;
  onCancel: (booking: HotelBooking) => void;
  onRegisterPayment: (booking: HotelBooking) => void;
  // ✅ NOVO: Props para buscar detalhes dos room types
  onFetchRoomTypes?: (roomTypeIds: string[]) => Promise<Map<string, {
    name: string;
    capacity: number;
    total_units: number;
    base_price: string;
  }>>;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  loading = false,
  onViewDetails,
  onConfirm,
  onReject,
  onCheckIn,
  onCheckOut,
  onCancel,
  onRegisterPayment,
  onFetchRoomTypes,
}) => {
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [enrichedBookings, setEnrichedBookings] = useState<HotelBookingWithRoomType[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const { toast } = useToast();
  
  // ✅ REFS para evitar loops infinitos
  const isEnrichingRef = useRef(false);
  const lastBookingsHashRef = useRef<string>('');

  // ✅ DEBUG: Log para verificar dados recebidos (APENAS NO DEV)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && bookings.length > 0) {
      const currentHash = JSON.stringify(bookings.map(b => b.id).sort());
      if (lastBookingsHashRef.current !== currentHash) {
        console.log('📊 [BookingList] Dados das reservas recebidas:', {
          count: bookings.length,
          ids: bookings.map(b => b.id),
          hasPaymentStatus: bookings.filter(b => !!b.payment_status).length
        });
        lastBookingsHashRef.current = currentHash;
      }
    }
  }, [bookings]);

  // ✅ CORREÇÃO: Função para enriquecer bookings com informações do room type (usando useCallback)
  const enrichBookingsWithRoomTypeInfo = useCallback(async (
    bookingsToEnrich: HotelBooking[]
  ): Promise<HotelBookingWithRoomType[]> => {
    if (!bookingsToEnrich.length || !onFetchRoomTypes) {
      return bookingsToEnrich.map(booking => ({
        ...booking,
        roomTypeName: 'Não especificado',
        roomTypeCapacity: 2,
        roomTypeTotalUnits: 0,
        roomTypeBasePrice: '0.00',
      }));
    }

    try {
      // Extrair IDs únicos de room types
      const roomTypeIds = [...new Set(bookingsToEnrich
        .map(b => b.room_type_id)
        .filter(Boolean) as string[]
      )];

      if (roomTypeIds.length === 0) {
        console.log('⚠️ Nenhum room_type_id encontrado para enriquecimento');
        return bookingsToEnrich.map(booking => ({
          ...booking,
          roomTypeName: 'Não especificado',
          roomTypeCapacity: 2,
          roomTypeTotalUnits: 0,
          roomTypeBasePrice: '0.00',
        }));
      }

      console.log(`🔍 Enriquecendo ${bookingsToEnrich.length} reservas com ${roomTypeIds.length} tipos de quarto...`);
      
      // Buscar detalhes dos room types
      const roomTypeMap = await onFetchRoomTypes(roomTypeIds);
      
      // Enriquecer bookings
      return bookingsToEnrich.map(booking => {
        const roomTypeInfo = roomTypeMap.get(booking.room_type_id || '');
        
        return {
          ...booking,
          roomTypeName: roomTypeInfo?.name || 'Tipo de quarto não encontrado',
          roomTypeCapacity: roomTypeInfo?.capacity || 2,
          roomTypeTotalUnits: roomTypeInfo?.total_units || 0,
          roomTypeBasePrice: roomTypeInfo?.base_price || '0.00',
        };
      });
    } catch (error) {
      console.error('❌ Erro ao enriquecer bookings com room type info:', error);
      toast({
        title: 'Erro ao carregar detalhes',
        description: 'Não foi possível carregar informações dos tipos de quarto',
        variant: 'destructive',
        duration: 3000,
      });
      
      // Fallback: retornar bookings sem enriquecimento
      return bookingsToEnrich.map(booking => ({
        ...booking,
        roomTypeName: 'Erro ao carregar',
        roomTypeCapacity: 2,
        roomTypeTotalUnits: 0,
        roomTypeBasePrice: '0.00',
      }));
    }
  }, [onFetchRoomTypes, toast]);

  // ✅ CORREÇÃO: Efeito para enriquecer bookings - COM CONTROLE DE EXECUÇÃO
  useEffect(() => {
    const enrichData = async () => {
      // Evitar múltiplas execuções simultâneas
      if (isEnrichingRef.current) {
        console.log('⏸️ [BookingList] Enriquecimento já em andamento, ignorando...');
        return;
      }

      // Verificar se há bookings para enriquecer
      if (!bookings.length) {
        setEnrichedBookings([]);
        return;
      }

      // Calcular hash dos bookings atuais
      const currentHash = JSON.stringify(bookings.map(b => ({
        id: b.id,
        room_type_id: b.room_type_id
      })).sort((a, b) => a.id.localeCompare(b.id)));

      // Verificar se os bookings já foram enriquecidos
      const lastHash = localStorage.getItem('lastBookingsHash');
      if (lastHash === currentHash && enrichedBookings.length > 0) {
        console.log('🔄 [BookingList] Bookings já enriquecidos anteriormente');
        return;
      }

      isEnrichingRef.current = true;
      setIsEnriching(true);
      
      try {
        const enriched = await enrichBookingsWithRoomTypeInfo(bookings);
        
        // ✅ CORREÇÃO: Atualizar apenas se realmente mudou
        const enrichedChanged = JSON.stringify(enriched) !== JSON.stringify(enrichedBookings);
        if (enrichedChanged) {
          setEnrichedBookings(enriched);
          localStorage.setItem('lastBookingsHash', currentHash);
          console.log(`✅ ${enriched.length} reservas enriquecidas com informações do tipo de quarto`);
        }
      } catch (error) {
        console.error('Erro no enriquecimento:', error);
        // Fallback: usar bookings originais
        const fallbackEnriched = bookings.map(booking => ({
          ...booking,
          roomTypeName: 'Carregamento falhou',
          roomTypeCapacity: 2,
          roomTypeTotalUnits: 0,
          roomTypeBasePrice: '0.00',
        }));
        
        const fallbackChanged = JSON.stringify(fallbackEnriched) !== JSON.stringify(enrichedBookings);
        if (fallbackChanged) {
          setEnrichedBookings(fallbackEnriched);
        }
      } finally {
        setIsEnriching(false);
        isEnrichingRef.current = false;
      }
    };

    // Adicionar um pequeno delay para evitar execuções rápidas consecutivas
    const timer = setTimeout(() => {
      enrichData();
    }, 100);

    return () => clearTimeout(timer);
  }, [bookings, enrichBookingsWithRoomTypeInfo, enrichedBookings]); // ✅ Adicionado enrichedBookings para controle

  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  const formatDate = (dateString: string) => {
    try {
      // Tenta parse como ISO, depois como YYYY-MM-DD
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      return format(date, "dd 'de' MMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      // Tenta parse como ISO
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        // Se não tem timezone, adiciona um
        date = new Date(dateString + 'T00:00:00');
      }
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string) => {
    // Remove espaços e converte para número
    const cleanAmount = amount?.toString().replace(/\s/g, '') || '0';
    const num = parseFloat(cleanAmount);
    
    // Verifica se é um número válido
    if (isNaN(num)) {
      console.warn(`❌ Valor inválido para formatação: "${amount}"`);
      return '0,00 MZN';
    }
    
    return num.toLocaleString('pt-MZ', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }) + ' MZN';
  };

  // ✅ USAR FUNÇÕES DE UTILIDADE COMPARTILHADAS
  const canRegisterPayment = useCallback((booking: HotelBooking) => {
    const canRegister = canRegisterPaymentUtil(booking);
    
    // Debug logging (APENAS NO DEV e limitado)
    if (process.env.NODE_ENV === 'development') {
      // Limitar logs para evitar spam
      const shouldLog = Math.random() < 0.1; // Apenas 10% dos logs
      if (shouldLog) {
        console.log('🔍 [BookingList.canRegisterPayment] Verificação:', {
          bookingId: booking?.id,
          payment_status: booking?.payment_status,
          normalized: normalizePaymentStatus(booking?.payment_status),
          canRegister,
        });
      }
    }
    
    return canRegister;
  }, []);

  // ✅ NOVO: Determinar ações disponíveis
  const getBookingActions = useCallback((booking: HotelBooking) => {
    const availableActions = getAvailableActions(booking.status);
    return availableActions.map(action => BOOKING_ACTION_CONFIGS[action]);
  }, []);

  // ✅ CORREÇÃO: Indicador de carregamento combinado
  const isLoading = loading || isEnriching;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </Card>
        ))}
        {isEnriching && (
          <div className="flex items-center justify-center p-4 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Carregando detalhes dos tipos de quarto...
          </div>
        )}
      </div>
    );
  }

  if (enrichedBookings.length === 0) {
    return (
      <Card className="p-8 md:p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
        <p className="text-gray-600 mb-6">
          Não há reservas que correspondam aos seus filtros atuais.
        </p>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar página
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {enrichedBookings.map((booking) => {
        // ✅ USAR FUNÇÕES DE UTILIDADE COMPARTILHADAS
        const statusConfig = getStatusConfig(booking.status);
        const paymentConfig = getPaymentStatusConfig(booking.payment_status);
        const isExpanded = expandedBookingId === booking.id;
        
        // ✅ CORREÇÃO: Verificações de data melhoradas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let checkInDate: Date;
        try {
          if (booking.check_in.includes('T')) {
            checkInDate = parseISO(booking.check_in);
          } else {
            checkInDate = new Date(booking.check_in + 'T00:00:00');
          }
          checkInDate.setHours(0, 0, 0, 0);
        } catch {
          checkInDate = new Date();
        }
        
        const isUpcoming = checkInDate > today;
        const isToday = checkInDate.getTime() === today.getTime();

        // ✅ NOVO: Usar funções de utilidade para verificar ações
        const showConfirm = canConfirmUtil(booking);
        const showReject = canRejectUtil(booking);
        const showCheckIn = canCheckInUtil(booking);
        const showCheckOut = canCheckOutUtil(booking);
        const showCancel = canCancelUtil(booking);
        const showRegisterPayment = canRegisterPayment(booking);

        return (
          <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-all">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Informações principais */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {booking.guest_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={cn("border", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                        <Badge className={cn("border", paymentConfig.color)}>
                          {paymentConfig.label}
                        </Badge>
                        {isToday && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Hoje
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Futura
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(booking.total_price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.nights || 1} {booking.nights === 1 ? 'noite' : 'noites'}
                      </p>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Check-in:</span>
                        <span className="text-gray-900">{formatDate(booking.check_in)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Check-out:</span>
                        <span className="text-gray-900">{formatDate(booking.check_out)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UsersIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Hóspedes:</span>
                        <span className="text-gray-900">
                          {booking.adults} adulto{booking.adults !== 1 ? 's' : ''}
                          {booking.children > 0 && `, ${booking.children} criança${booking.children !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bed className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Quarto:</span>
                        <span className="text-gray-900 font-medium">
                          {booking.roomTypeName || `Quarto #${booking.room_type_id?.slice(0, 8) || '???'}`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">Email:</span>
                        <span className="text-gray-900 truncate">{booking.guest_email}</span>
                      </div>
                      {booking.guest_phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">Telefone:</span>
                          <span className="text-gray-900">{booking.guest_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botões de ação - AGORA DINÂMICOS */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(booking)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Detalhes
                    </Button>
                    
                    {/* ✅ CONFIRMAR (se disponível) */}
                    {showConfirm && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onConfirm(booking)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                        Confirmar
                      </Button>
                    )}
                    
                    {/* ✅ REJEITAR (se disponível) */}
                    {showReject && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReject(booking)}
                        className="flex items-center gap-2 border-amber-600 text-amber-600 hover:bg-amber-50"
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </Button>
                    )}
                    
                    {/* CHECK-IN (se disponível) */}
                    {showCheckIn && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onCheckIn(booking)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Check-in
                      </Button>
                    )}
                    
                    {/* CHECK-OUT (se disponível) */}
                    {showCheckOut && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onCheckOut(booking)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <DoorOpen className="w-4 h-4" />
                        Check-out
                      </Button>
                    )}
                    
                    {/* PAGAMENTO (se disponível) */}
                    {showRegisterPayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRegisterPayment(booking)}
                        className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagamento
                      </Button>
                    )}
                    
                    {/* CANCELAR (se disponível) */}
                    {showCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel(booking)}
                        className="flex items-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Menu dropdown para ações adicionais */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(booking)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalhes completos
                    </DropdownMenuItem>
                    
                    {/* ✅ AÇÕES DINÂMICAS NO DROPDOWN */}
                    {showConfirm && (
                      <DropdownMenuItem onClick={() => onConfirm(booking)}>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar reserva
                      </DropdownMenuItem>
                    )}
                    
                    {showReject && (
                      <DropdownMenuItem onClick={() => onReject(booking)}>
                        <X className="mr-2 h-4 w-4" />
                        Rejeitar reserva
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => {
                        navigator.clipboard.writeText(booking.id);
                        toast({
                          title: 'ID copiado',
                          description: 'O ID da reserva foi copiado para a área de transferência',
                          duration: 2000,
                        });
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Copiar ID da reserva
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => toggleExpand(booking.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => window.open(`mailto:${booking.guest_email}`, '_blank')}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar email
                    </DropdownMenuItem>
                    
                    {booking.guest_phone && (
                      <DropdownMenuItem 
                        onClick={() => window.open(`tel:${booking.guest_phone}`, '_blank')}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Ligar para hóspede
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Informações expandidas */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Informações Adicionais</h5>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">ID da Reserva:</span>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {booking.id}
                          </code>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Criada em:</span>{' '}
                          {formatDateTime(booking.created_at)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Atualizada em:</span>{' '}
                          {formatDateTime(booking.updated_at)}
                        </p>
                        {booking.special_requests && (
                          <p className="text-gray-600">
                            <span className="font-medium">Pedidos especiais:</span>{' '}
                            <span className="italic">{booking.special_requests}</span>
                          </p>
                        )}
                        {booking.promo_code && (
                          <p className="text-gray-600">
                            <span className="font-medium">Código promocional:</span>{' '}
                            <Badge variant="outline" className="ml-1">
                              {booking.promo_code}
                            </Badge>
                          </p>
                        )}
                        {booking.taxes && (
                          <p className="text-gray-600">
                            <span className="font-medium">Taxas:</span>{' '}
                            {formatCurrency(booking.taxes)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Detalhes do Quarto</h5>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Unidades reservadas:</span> {booking.units || 1}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Preço base:</span>{' '}
                          {formatCurrency(booking.base_price)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Preço total:</span>{' '}
                          {formatCurrency(booking.total_price)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Capacidade do quarto:</span>{' '}
                          {booking.roomTypeCapacity || 2} pessoa{booking.roomTypeCapacity !== 1 ? 's' : ''}
                        </p>
                        {booking.roomTypeTotalUnits && booking.roomTypeTotalUnits > 0 && (
                          <p className="text-gray-600">
                            <span className="font-medium">Total de unidades:</span>{' '}
                            {booking.roomTypeTotalUnits}
                          </p>
                        )}
                        {booking.roomTypeBasePrice && (
                          <p className="text-gray-600">
                            <span className="font-medium">Preço base/noite:</span>{' '}
                            {formatCurrency(booking.roomTypeBasePrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
      
      {/* ✅ CORREÇÃO: Indicador de enriquecimento concluído */}
      {!isLoading && enrichedBookings.length > 0 && (
        <div className="text-xs text-gray-500 text-center pt-2">
          <div className="flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Mostrando {enrichedBookings.length} reservas
            {onFetchRoomTypes && ' com informações enriquecidas do tipo de quarto'}
          </div>
        </div>
      )}
    </div>
  );
};