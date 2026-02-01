// src/apps/hotels-app/components/event-spaces/EventSpaceBookingsList.tsx
// Componente para listar reservas de um espaço de eventos - VERSÃO COMPLETA COM SERVIÇO REAL
// ✅ CORREÇÃO CRÍTICA: Adicionado refreshKey e onActionSuccess para atualizar UI
// ✅ CORREÇÃO: Problema de tipo ManualPaymentPayload corrigido
// ✅ CORREÇÃO DOM: Substituído <p> por <div> em vários lugares para evitar erro de validação

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import {
  Loader2,
  Calendar,
  Users,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  CreditCard,
  AlertTriangle,
  Ban,
  TrendingUp,
  Wallet,
  BarChart,
  FileSpreadsheet,
  Receipt,
  X,
  Building,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api';
import { eventSpaceService } from '@/services/eventSpaceService';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { 
  ManualPaymentPayload, 
  FullBookingDetails 
} from '@/shared/types/event-spaces';

// Importar componentes modulares
import BookingFilters, { type BookingFiltersState } from './BookingFilters';
import BookingStats from './BookingStats';
import BookingActions from './BookingActions';
import { PaymentRegisterModal } from './PaymentRegisterModal';

interface EventSpaceBookingsListProps {
  spaceId: string;
  spaceName: string;
  onClose: () => void;
}

interface Booking {
  id: string;
  event_title: string;
  organizer_name: string;
  organizer_email: string;
  start_date: string;
  end_date: string;
  expected_attendees: number;
  status: string;
  total_price: string;
  created_at: string;
  payment_status?: string;
  balance_due?: string;
  event_type?: string;
  organizer_phone?: string;
  eventSpaceId?: string;
}

interface BookingStatsData {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  pendingRevenue: number;
  averageBookingValue: number;
}

export const EventSpaceBookingsList: React.FC<EventSpaceBookingsListProps> = ({
  spaceId,
  spaceName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // ✅ CORREÇÃO: Estado para refresh key para forçar re-render
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ MELHORADO: Estado para nome real do espaço com fallback melhorado
  const [actualSpaceName, setActualSpaceName] = useState(spaceName);

  // ESTADOS ADICIONAIS
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<FullBookingDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // ✅ CORREÇÃO: paymentData atualizado para usar 'reference' em vez de 'referenceNumber'
  const [paymentData, setPaymentData] = useState<{
    amount: number;
    paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
    reference: string; // ✅ MUDADO: reference em vez de referenceNumber
    notes?: string;
  }>({
    amount: 0,
    paymentMethod: 'mpesa',
    reference: '',
    notes: '',
  });
  
  const [stats, setStats] = useState<BookingStatsData>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    pendingRevenue: 0,
    averageBookingValue: 0,
  });
  const [advancedFilters, setAdvancedFilters] = useState<BookingFiltersState>({
    status: 'all',
    dateRange: 'all',
    search: '',
    paymentStatus: 'all',
    eventType: 'all',
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [paymentOptions, setPaymentOptions] = useState<Array<{
    value: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
    label: string;
  }>>([
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank_transfer', label: 'Transferência Bancária' },
    { value: 'card', label: 'Cartão' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'mobile_money', label: 'Mobile Money' },
  ]);

  // Estados para loading de ações específicas
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Novos estados para o modal de pagamentos direto
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);

  // ✅ CORREÇÃO: Função para lidar com sucesso de ações usando useCallback
  const handleActionSuccess = useCallback(() => {
    console.log('🔄 Ação realizada com sucesso, recarregando dados...');
    setRefreshKey(prev => prev + 1); // Força re-render
    loadBookings(); // Recarrega dados do backend
  }, []); // loadBookings será definido com useCallback

  // ✅ CORREÇÃO: Atualizar useEffect para usar useCallback
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getEventSpaceBookings(spaceId, {
        limit: 100,
        offset: 0,
      });
      
      if (res.success && res.data) {
        // ✅ CORREÇÃO: Garantir que todos os campos necessários existem
        const updatedBookings = res.data.map((booking: any) => ({
          ...booking,
          payment_status: booking.payment_status || 'pending',
          balance_due: booking.balance_due || booking.total_price,
          event_type: booking.event_type || 'outro',
          organizer_phone: booking.organizer_phone || '',
          // ✅ GARANTIR que start_date e end_date existem
          start_date: booking.start_date || booking.startDate || '',
          end_date: booking.end_date || booking.endDate || '',
          // Campos extras para compatibilidade
          event_title: booking.event_title || booking.eventTitle || '',
          organizer_name: booking.organizer_name || booking.organizerName || '',
          organizer_email: booking.organizer_email || booking.organizerEmail || '',
          expected_attendees: booking.expected_attendees || booking.expectedAttendees || 0,
        }));
        setBookings(updatedBookings);
        calculateStats(updatedBookings);
      } else {
        setError(res.error || 'Falha ao carregar reservas');
      }
    } catch (err: any) {
      setError('Erro de conexão');
      console.error('Erro ao carregar reservas:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId]); // Adicionar dependência

  useEffect(() => {
    loadBookings();
    
    // ✅ MELHORADO: Carregar nome real do espaço com tratamento de erro melhorado
    if (spaceName === 'Espaço de Eventos' && spaceId) {
      loadSpaceName();
    }
  }, [spaceId, loadBookings]); // Adicionar loadBookings como dependência

  useEffect(() => {
    filterBookings();
    calculateStats(filteredBookings);
  }, [bookings, advancedFilters]);

  // ✅ MELHORADO: Carregar nome real do espaço com fallback robusto
  const loadSpaceName = async () => {
    try {
      const res = await eventSpaceService.getEventSpaceById(spaceId);
      if (res.success && res.data) {
        setActualSpaceName(res.data.name);
      } else {
        // Fallback: usar ID se não conseguir nome
        setActualSpaceName(`Espaço ${spaceId.slice(0, 8)}...`);
      }
    } catch (error) {
      console.error('Erro ao carregar nome do espaço:', error);
      // Fallback seguro
      setActualSpaceName(`Espaço ${spaceId.slice(0, 8)}...`);
    }
  };

  const loadPaymentDetails = async (bookingId: string) => {
    try {
      const res = await eventSpaceService.getFullBookingDetails(bookingId);
      if (res.success && res.data) {
        setPaymentDetails(res.data);
      } else {
        toast({
          title: '⚠️ Atenção',
          description: res.error || 'Erro ao carregar detalhes de pagamento',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      toast({
        title: '❌ Erro',
        description: 'Falha ao carregar detalhes de pagamento',
      });
    }
  };

  const handleRejectBooking = async (bookingId: string, reason: string) => {
    try {
      const res = await eventSpaceService.rejectBooking(bookingId, reason);
      if (res.success) {
        toast({
          title: '✅ Reserva rejeitada',
          description: res.message || 'A reserva foi rejeitada com sucesso',
        });
        handleActionSuccess(); // ✅ Usar a função de sucesso
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao rejeitar',
        description: err.message || 'Falha ao rejeitar reserva',
      });
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      const res = await eventSpaceService.cancelBooking(bookingId, reason);
      if (res.success) {
        toast({
          title: '✅ Reserva cancelada',
          description: res.data?.message || 'A reserva foi cancelada com sucesso',
        });
        handleActionSuccess(); // ✅ Usar a função de sucesso
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao cancelar',
        description: err.message || 'Falha ao cancelar reserva',
      });
    }
  };

  // ✅ CORREÇÃO: handleRegisterPayment atualizado para usar 'reference' correto
  const handleRegisterPayment = async () => {
    if (!selectedBooking) return;
    
    setIsPaying(true);
    try {
      const paymentPayload = {
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference, // ✅ CORREÇÃO: Usar 'reference' em vez de 'referenceNumber'
        notes: paymentData.notes,
      };

      const res = await eventSpaceService.registerManualPayment(selectedBooking.id, paymentPayload);
      
      if (res.success) {
        toast({
          title: '✅ Pagamento registrado',
          description: res.message || 'Pagamento registrado com sucesso',
        });
        handleActionSuccess(); // ✅ Usar a função de sucesso
        // Recarregar detalhes completos
        const fullDetails = await eventSpaceService.getFullBookingDetails(selectedBooking.id);
        if (fullDetails.success && fullDetails.data) {
          setPaymentDetails(fullDetails.data);
        }
        setShowPaymentDialog(false);
        setPaymentData({
          amount: 0,
          paymentMethod: 'mpesa',
          reference: '',
          notes: '',
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro no pagamento',
        description: err.message || 'Falha ao registrar pagamento',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!selectedBooking) return;
    
    setIsSubmitting(true);
    try {
      const res = await eventSpaceService.updatePaymentStatus(selectedBooking.id, 'paid', paymentId);
      if (res.success) {
        toast({
          title: '✅ Pagamento confirmado',
          description: res.message || 'Pagamento confirmado com sucesso',
        });
        loadPaymentDetails(selectedBooking.id);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao confirmar',
        description: err.message || 'Falha ao confirmar pagamento',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const receiptContent = `
        RECIBO DE PAGAMENTO
        ===================
        ID do Pagamento: ${paymentId}
        Reserva: ${selectedBooking?.event_title || 'N/A'}
        Organizador: ${selectedBooking?.organizer_name || 'N/A'}
        Valor: ${formatCurrency(selectedBooking?.total_price || '0')}
        Data: ${new Date().toLocaleDateString('pt-MZ')}
        Método: ${paymentData.paymentMethod}
        Referência: ${paymentData.reference}
        
        Este é um comprovante de pagamento.
      `;
      
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_${paymentId}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: '✅ Recibo baixado',
        description: 'Recibo disponível para download',
      });
    } catch (err: any) {
      toast({
        title: '❌ Erro ao baixar recibo',
        description: err.message || 'Falha ao baixar recibo',
      });
    }
  };

  const calculateStats = (bookingsList: Booking[]) => {
    const total = bookingsList.length;
    const pending = bookingsList.filter(b => b.status === 'pending_approval').length;
    const confirmed = bookingsList.filter(b => b.status === 'confirmed').length;
    const completed = bookingsList.filter(b => b.status === 'completed').length;
    const cancelled = bookingsList.filter(b => 
      b.status === 'cancelled' || b.status === 'rejected'
    ).length;
    
    const revenue = bookingsList.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const pendingRevenue = bookingsList
      .filter(b => b.payment_status === 'pending' || b.payment_status === 'partial')
      .reduce((sum, b) => sum + Number(b.balance_due || 0), 0);
    const averageBookingValue = total > 0 ? revenue / total : 0;
    
    setStats({
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      revenue,
      pendingRevenue,
      averageBookingValue,
    });
  };

  const handleExportBookings = (format: 'csv' | 'excel' | 'pdf') => {
    if (format !== 'csv') {
      toast({
        title: 'Em breve',
        description: 'Outros formatos em desenvolvimento',
      });
      return;
    }

    const headers = [
      'ID', 'Título', 'Organizador', 'Email', 'Início', 'Fim', 'Participantes', 
      'Valor Total', 'Saldo Pendente', 'Status', 'Pagamento', 'Criado em'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredBookings.map(b => [
        b.id,
        `"${b.event_title.replace(/"/g, '""')}"`,
        `"${b.organizer_name.replace(/"/g, '""')}"`,
        b.organizer_email,
        b.start_date,
        b.end_date,
        b.expected_attendees,
        b.total_price,
        b.balance_due || '0',
        b.status,
        b.payment_status || 'pending',
        b.created_at
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservas_${actualSpaceName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✅ Exportado',
      description: 'Arquivo CSV baixado',
    });
  };

  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    loadPaymentDetails(booking.id);
    setShowDetailsDialog(true);
  };

  const openPaymentDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setPaymentData({
      amount: Number(booking.balance_due || '0') || 0,
      paymentMethod: 'mpesa',
      reference: `PAY-${booking.id?.slice(0, 8)?.toUpperCase() || 'UNKNOWN'}-${Date.now().toString().slice(-6)}`, // ✅ CORREÇÃO: reference
      notes: `Pagamento para reserva ${booking.event_title}`,
    });
    loadPaymentDetails(booking.id);
    setShowPaymentDialog(true);
  };

  // Nova função para abrir o modal de pagamentos
  const openPaymentModal = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Status
    if (advancedFilters.status !== 'all') {
      filtered = filtered.filter(b => b.status === advancedFilters.status);
    }

    // Pagamento
    if (advancedFilters.paymentStatus !== 'all') {
      filtered = filtered.filter(b => b.payment_status === advancedFilters.paymentStatus);
    }

    // Tipo de evento
    if (advancedFilters.eventType !== 'all') {
      filtered = filtered.filter(b => b.event_type === advancedFilters.eventType);
    }

    // Valor mínimo/máximo - CORREÇÃO: Verificação de undefined
    if (advancedFilters.minAmount !== undefined) {
      filtered = filtered.filter(b => Number(b.total_price || 0) >= advancedFilters.minAmount!);
    }
    if (advancedFilters.maxAmount !== undefined) {
      filtered = filtered.filter(b => Number(b.total_price || 0) <= advancedFilters.maxAmount!);
    }

    // Data
    if (advancedFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (advancedFilters.dateRange === 'custom' && advancedFilters.startDate && advancedFilters.endDate) {
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.start_date);
          return bookingDate >= advancedFilters.startDate! && bookingDate <= advancedFilters.endDate!;
        });
      } else if (advancedFilters.dateRange === 'upcoming') {
        filtered = filtered.filter(b => new Date(b.start_date) >= today);
      } else if (advancedFilters.dateRange === 'past') {
        filtered = filtered.filter(b => new Date(b.start_date) < today);
      } else if (advancedFilters.dateRange === 'today') {
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.start_date);
          return bookingDate.toDateString() === today.toDateString();
        });
      } else if (advancedFilters.dateRange === 'week') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(b => new Date(b.start_date) >= oneWeekAgo);
      } else if (advancedFilters.dateRange === 'month') {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(b => new Date(b.start_date) >= oneMonthAgo);
      }
    }

    // Busca textual
    if (advancedFilters.search) {
      const term = advancedFilters.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.event_title?.toLowerCase().includes(term) ||
        b.organizer_name?.toLowerCase().includes(term) ||
        b.organizer_email?.toLowerCase().includes(term) ||
        b.organizer_phone?.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string; icon: React.ReactNode }> = {
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

  const getPaymentStatusBadge = (status?: string) => {
    const statusMap: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string }> = {
      'paid': { variant: 'default', label: 'Pago' },
      'confirmed': { variant: 'default', label: 'Confirmado' },
      'pending': { variant: 'default', label: 'Pendente' },
      'partial': { variant: 'secondary', label: 'Parcial' },
      'overdue': { variant: 'destructive', label: 'Atrasado' },
      'refunded': { variant: 'outline', label: 'Reembolsado' },
      'failed': { variant: 'destructive', label: 'Falhou' },
      'cancelled': { variant: 'destructive', label: 'Cancelado' },
    };

    const effectiveStatus = status || 'pending';
    const statusInfo = statusMap[effectiveStatus] || { variant: 'default', label: effectiveStatus };

    return (
      <Badge variant={statusInfo.variant} className="text-xs">
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | string) => {
    if (!amount && amount !== 0) return '—';
    const num = typeof amount === 'string' ? Number(amount) : amount;
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
    } catch {
      return dateString;
    }
  };

  // HANDLER PARA CONFIRMAR RESERVA
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const res = await eventSpaceService.confirmBooking(bookingId);
      if (res.success) {
        toast({
          title: '✅ Reserva confirmada',
          description: res.message || 'A reserva foi confirmada com sucesso',
        });
        handleActionSuccess(); // ✅ Usar a função de sucesso
        setShowDetailsDialog(false);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao confirmar',
        description: err.message || 'Falha ao confirmar reserva',
      });
    }
  };

  // Handler para ações do BookingActions
  const handleBookingAction = async (action: string, data?: { reason?: string; notes?: string }) => {
    if (!selectedBooking) return;

    switch (action) {
      case 'confirm':
        await handleConfirmBooking(selectedBooking.id);
        break;
      case 'reject':
        await handleRejectBooking(selectedBooking.id, data?.reason || '');
        break;
      case 'cancel':
        await handleCancelBooking(selectedBooking.id, data?.reason || 'Cancelado pelo gestor');
        break;
      case 'details':
        openBookingDetails(selectedBooking);
        break;
      case 'payments':
        openPaymentModal(selectedBooking);
        break;
      case 'edit':
        toast({
          title: '📝 Editar',
          description: 'Funcionalidade de edição em desenvolvimento',
        });
        break;
      case 'complete':
        toast({
          title: '✅ Concluir',
          description: 'Funcionalidade de conclusão em desenvolvimento',
        });
        break;
      case 'start':
        toast({
          title: '▶️ Iniciar',
          description: 'Funcionalidade de iniciar evento em desenvolvimento',
        });
        break;
      default:
        console.log('Ação não implementada:', action);
    }
  };

  // COMPONENTES DE DIÁLOGO
  const BookingDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Reserva
          </DialogTitle>
          <DialogDescription>
            Informações completas da reserva #{selectedBooking?.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        
        {selectedBooking && (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="logs">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações do Evento</h4>
                  <div className="space-y-2">
                    {/* ✅ CORREÇÃO: Substituído <p> por <div> para evitar erro DOM */}
                    <div className="text-gray-600"><span className="font-medium">Título:</span> {selectedBooking.event_title}</div>
                    <div className="text-gray-600"><span className="font-medium">Tipo:</span> {selectedBooking.event_type || 'Não especificado'}</div>
                    <div className="text-gray-600"><span className="font-medium">Data:</span> {formatDate(selectedBooking.start_date)} - {formatDate(selectedBooking.end_date)}</div>
                    <div className="text-gray-600"><span className="font-medium">Participantes:</span> {selectedBooking.expected_attendees}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Informações do Organizador</h4>
                  <div className="space-y-2">
                    {/* ✅ CORREÇÃO: Substituído <p> por <div> para evitar erro DOM */}
                    <div className="text-gray-600"><span className="font-medium">Nome:</span> {selectedBooking.organizer_name}</div>
                    <div className="text-gray-600"><span className="font-medium">Email:</span> {selectedBooking.organizer_email}</div>
                    <div className="text-gray-600"><span className="font-medium">Telefone:</span> {selectedBooking.organizer_phone || 'Não informado'}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informações Financeiras</h4>
                  <div className="space-y-2">
                    {/* ✅ CORREÇÃO: Substituído <p> por <div> para evitar erro DOM */}
                    <div className="text-gray-600"><span className="font-medium">Valor Total:</span> {formatCurrency(selectedBooking.total_price)}</div>
                    <div className="text-gray-600"><span className="font-medium">Saldo Pendente:</span> {formatCurrency(selectedBooking.balance_due || '0')}</div>
                    <div className="text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Status Pagamento:</span> {getPaymentStatusBadge(selectedBooking.payment_status)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status da Reserva</h4>
                  <div className="space-y-2">
                    {/* ✅ CORREÇÃO: Substituído <p> por <div> para evitar erro DOM */}
                    <div className="text-gray-600 flex items-center gap-2">
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedBooking.status)}
                    </div>
                    <div className="text-gray-600"><span className="font-medium">Criada em:</span> {formatDate(selectedBooking.created_at)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-4">
              {paymentDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(paymentDetails.booking.totalPrice || paymentDetails.booking.totalPrice || '0')}
                      </div>
                      <div className="text-sm text-gray-600">Total</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          paymentDetails.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Pago</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-lg font-bold text-amber-600">
                        {formatCurrency(
                          selectedBooking?.balance_due || 
                          (Number(selectedBooking?.total_price || 0) - 
                           paymentDetails.payments.reduce((s, p) => s + Number(p.amount || 0), 0)) || '0'
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Saldo</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(paymentDetails.booking.securityDeposit || '0')}
                      </div>
                      <div className="text-sm text-gray-600">Depósito</div>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Histórico de Pagamentos</h4>
                    {paymentDetails.payments.length > 0 ? (
                      <div className="space-y-3">
                        {paymentDetails.payments.map((payment) => (
                          <Card key={payment.id} className="p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                                  <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                  <Badge 
                                    variant={
                                      payment.status === 'paid' ? 'default' :
                                      payment.status === 'partial' ? 'secondary' :
                                      payment.status === 'pending' ? 'default' :
                                      payment.status === 'failed' || payment.status === 'cancelled' ? 'destructive' :
                                      payment.status === 'refunded' ? 'outline' : 'default'
                                    }
                                  >
                                    {payment.status === 'paid' ? 'Pago' :
                                     payment.status === 'pending' ? 'Pendente' :
                                     payment.status === 'failed' ? 'Falhou' :
                                     payment.status === 'refunded' ? 'Reembolsado' :
                                     payment.status === 'cancelled' ? 'Cancelado' : payment.status}
                                  </Badge>
                                </div>
                                {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                                <div className="text-sm text-gray-600">
                                  {payment.paymentMethod === 'mpesa' ? 'M-Pesa' :
                                   payment.paymentMethod === 'bank_transfer' ? 'Transferência' :
                                   payment.paymentMethod === 'card' ? 'Cartão' :
                                   payment.paymentMethod === 'cash' ? 'Dinheiro' : 'Mobile Money'} • {payment.referenceNumber}
                                </div>
                                {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                                <div className="text-xs text-gray-500">
                                  {payment.confirmedAt ? formatDate(payment.confirmedAt) : formatDate(payment.createdAt)}
                                </div>
                                {payment.notes && (
                                  <div className="text-xs text-gray-500 mt-1">Nota: {payment.notes}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadReceipt(payment.id)}
                                >
                                  <Receipt className="h-4 w-4 mr-1" />
                                  Recibo
                                </Button>
                                {payment.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmPayment(payment.id)}
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : null}
                                    Confirmar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">Nenhum pagamento registrado</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="services">
              {paymentDetails?.booking.additionalServices ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Serviços Adicionais</h4>
                  <Card className="p-4">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(paymentDetails.booking.additionalServices, null, 2)}
                    </pre>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">Nenhum serviço adicional para esta reserva</div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs">
              {paymentDetails?.logs && paymentDetails.logs.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Histórico de Alterações</h4>
                  <div className="space-y-3">
                    {paymentDetails.logs.map((log) => (
                      <Card key={log.id} className="p-3">
                        <div className="flex justify-between">
                          <div>
                            {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                            <div className="font-medium">{log.action}</div>
                            {log.performedBy && (
                              <div className="text-sm text-gray-600">Por: {log.performedBy}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">{formatDate(log.createdAt)}</div>
                          </div>
                          {log.details && (
                            <div className="text-sm text-gray-600">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">Nenhum histórico disponível</div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
            Fechar
          </Button>
          {selectedBooking && (
            <div className="flex gap-2">
              <BookingActions
                booking={{
                  id: selectedBooking.id,
                  status: selectedBooking.status as any,
                  payment_status: selectedBooking.payment_status as any,
                  balance_due: selectedBooking.balance_due,
                  event_title: selectedBooking.event_title,
                  start_date: selectedBooking.start_date, // ✅ ADICIONADO
                  end_date: selectedBooking.end_date,     // ✅ ADICIONADO
                }}
                onAction={handleBookingAction}
                onActionSuccess={handleActionSuccess} // ✅ PASSAR CALLBACK
                compact={false}
                showDetails={false}
              />
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const PaymentDialog = () => (
    <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gestão de Pagamentos
          </DialogTitle>
          <DialogDescription>
            Registrar e gerenciar pagamentos da reserva
          </DialogDescription>
        </DialogHeader>
        
        {selectedBooking && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedBooking.total_price)}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </Card>
              <Card className="p-4">
                <div className="text-lg font-bold text-amber-600">
                  {formatCurrency(selectedBooking.balance_due || '0')}
                </div>
                <div className="text-sm text-gray-600">Saldo Pendente</div>
              </Card>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Valor do Pagamento *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value) || 0})}
                  min="0"
                  max={Number(selectedBooking.balance_due || '0')}
                  placeholder="Digite o valor do pagamento"
                />
                {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                <div className="text-xs text-gray-500 mt-1">
                  Máximo: {formatCurrency(selectedBooking.balance_due || '0')}
                </div>
              </div>
              
              <div>
                <Label htmlFor="paymentMethod">Método de Pagamento *</Label>
                <Select
                  value={paymentData.paymentMethod}
                  onValueChange={(value: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money') => 
                    setPaymentData({...paymentData, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reference">Número de Referência</Label>
                <Input
                  id="reference"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                  placeholder={
                    paymentData.paymentMethod === 'mpesa' ? 'Ex: MP123456789' :
                    paymentData.paymentMethod === 'bank_transfer' ? 'Ex: TRF-2025-001' :
                    'Número da transação / comprovativo'
                  }
                  readOnly={paymentData.paymentMethod !== 'cash'}
                />
                {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                <div className="text-xs text-gray-500 mt-1">
                  {paymentData.paymentMethod === 'cash' ? 'Preencha com o número do comprovante' : 'Referência gerada automaticamente'}
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="Notas sobre o pagamento, informações adicionais..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRegisterPayment}
            disabled={isPaying || paymentData.amount <= 0 || paymentData.amount > Number(selectedBooking?.balance_due || '0')}
          >
            {isPaying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : 'Registrar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Paginação
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* ✅ HEADER MELHORADO */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Reservas do Espaço: <span className="text-blue-700">{actualSpaceName}</span>
              </h2>
              {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
              <div className="text-gray-600">
                Gerencie todas as reservas e pagamentos para este espaço específico
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* ✅ INFO DO ESPAÇO */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">ID: {spaceId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{bookings.length} reserva(s)</span>
              </div>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Espaço Específico
            </Badge>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <BookingFilters
        filters={advancedFilters}
        onFilterChange={setAdvancedFilters}
        onClearFilters={() => {
          setAdvancedFilters({
            status: 'all',
            dateRange: 'all',
            search: '',
            paymentStatus: 'all',
            eventType: 'all',
            minAmount: undefined,
            maxAmount: undefined,
            startDate: undefined,
            endDate: undefined,
          });
        }}
        onApplyFilters={filterBookings}
      />

      {/* Estatísticas */}
      <BookingStats stats={stats} />

      {/* Lista de reservas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <Button onClick={loadBookings} variant="outline">
            Tentar novamente
          </Button>
        </Card>
      ) : currentBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhuma reserva encontrada
          </h4>
          {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
          <div className="text-gray-600">
            {advancedFilters.search || advancedFilters.status !== 'all' || advancedFilters.dateRange !== 'all'
              ? 'Tente ajustar os filtros'
              : 'Este espaço ainda não tem reservas'}
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{booking.event_title}</h4>
                        {/* ✅ CORREÇÃO: Substituído <p> por <div> */}
                        <div className="text-sm text-gray-600">
                          {booking.organizer_name} • {booking.organizer_email}
                          {booking.organizer_phone && ` • ${booking.organizer_phone}`}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.payment_status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium ml-2">
                          {formatDateShort(booking.start_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Participantes:</span>
                        <span className="font-medium ml-2">
                          {booking.expected_attendees}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium ml-2 text-green-600">
                          {formatCurrency(booking.total_price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Saldo:</span>
                        <span className="font-medium ml-2 text-amber-600">
                          {formatCurrency(booking.balance_due || '0')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Criada:</span>
                        <span className="font-medium ml-2">
                          {formatDateShort(booking.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* ✅ CORREÇÃO: Botões de ação usando componente modular com onActionSuccess */}
                  <div className="flex gap-2">
                    <BookingActions
                      key={`actions-${booking.id}-${refreshKey}`} // ✅ Força re-render
                      booking={{
                        id: booking.id,
                        status: booking.status as any,
                        payment_status: booking.payment_status as any,
                        balance_due: booking.balance_due,
                        event_title: booking.event_title,
                        start_date: booking.start_date, // ✅ ADICIONADO
                        end_date: booking.end_date,     // ✅ ADICIONADO
                      }}
                      onAction={async (action, data) => {
                        setSelectedBooking(booking);
                        switch (action) {
                          case 'confirm':
                            await handleConfirmBooking(booking.id);
                            break;
                          case 'reject':
                            await handleRejectBooking(booking.id, data?.reason || '');
                            break;
                          case 'cancel':
                            await handleCancelBooking(booking.id, data?.reason || '');
                            break;
                          case 'details':
                            openBookingDetails(booking);
                            break;
                          case 'payments':
                            openPaymentModal(booking);
                            break;
                          case 'edit':
                            toast({
                              title: '📝 Editar',
                              description: 'Funcionalidade de edição em desenvolvimento',
                            });
                            break;
                          default:
                            console.log('Ação não implementada:', action);
                        }
                      }}
                      onActionSuccess={handleActionSuccess} // ✅ PASSAR CALLBACK
                      compact={true}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              {/* ✅ CORREÇÃO: Substituído <div> já estava correto */}
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} de {filteredBookings.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ✅ CORREÇÃO: Modal de Pagamentos atualizado para usar handleActionSuccess */}
      <PaymentRegisterModal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBookingForPayment(null);
        }}
        bookingId={selectedBookingForPayment?.id || ''}
        bookingTitle={selectedBookingForPayment?.event_title}
        balanceDue={Number(selectedBookingForPayment?.balance_due || 0)}
        onSuccess={handleActionSuccess} // ✅ Usar a mesma função
      />

      {/* Diálogos */}
      <BookingDetailsDialog />
      <PaymentDialog />
      
      {/* Diálogo de Exportação */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Exportar Reservas
            </DialogTitle>
            <DialogDescription>
              Selecione o formato para exportação
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => handleExportBookings('csv')}
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>CSV</span>
              <span className="text-xs text-gray-500">Dados estruturados</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => handleExportBookings('excel')}
            >
              <FileSpreadsheet className="h-8 w-8" />
              <span>Excel</span>
              <span className="text-xs text-gray-500">Planilha editável</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => handleExportBookings('pdf')}
            >
              <FileText className="h-8 w-8" />
              <span>PDF</span>
              <span className="text-xs text-gray-500">Relatório formatado</span>
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventSpaceBookingsList;