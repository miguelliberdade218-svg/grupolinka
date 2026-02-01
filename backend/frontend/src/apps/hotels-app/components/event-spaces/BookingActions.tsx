// src/apps/hotels-app/components/event-spaces/BookingActions.tsx
// ✅ VERSÃO CORRIGIDA - 26/01/2026 - COM STATUS REAIS DO BACKEND

import React, { useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  CreditCard,
  Edit,
  FileText,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import type { PaymentStatusType } from '@/shared/types/event-spaces';
import { PaymentRegisterModal } from './PaymentRegisterModal';
import { eventSpaceService } from '@/services/eventSpaceService';

// ✅ CORREÇÃO: Interface atualizada apenas com status reais do backend
interface BookingActionsProps {
  booking: {
    id: string;
    status: 'pending_approval' | 'confirmed' | 'cancelled' | 'rejected'; // ✅ APENAS ESTES
    payment_status?: PaymentStatusType;
    balance_due?: string | number;
    deposit_paid?: string | number;
    total_price?: string | number;
    event_title?: string;
    organizer_name?: string;
    start_date?: string;
    end_date?: string;
  };
  onAction?: (action: string, data?: { reason?: string; notes?: string }) => Promise<void>;
  showDetails?: boolean;
  showPayments?: boolean;
  showEdit?: boolean;
  compact?: boolean;
  onActionSuccess?: () => void; // ✅ ADICIONADO para atualização de UI
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onAction,
  showDetails = true,
  showPayments = true,
  showEdit = true,
  compact = false,
  onActionSuccess, // ✅ CORREÇÃO: Receber callback de sucesso
}) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ CORREÇÃO: Calcular balance corretamente
  const calculateBalance = useCallback(() => {
    const balance = Number(booking.balance_due || 0);
    return balance > 0 ? balance : 0;
  }, [booking.balance_due]);

  // ✅ CORREÇÃO: Usar useCallback para evitar re-renders desnecessários
  const handlePaymentSuccess = useCallback(() => {
    if (onActionSuccess) {
      onActionSuccess();
    }
    setShowPaymentModal(false);
    toast({
      title: '✅ Sucesso',
      description: 'Pagamento registrado com sucesso',
      variant: 'success',
    });
  }, [onActionSuccess]);

  const hasBalance = calculateBalance() > 0;
  const isPendingPayment = booking.payment_status === 'pending' || booking.payment_status === 'partial';

  // ✅ CORREÇÃO: Apenas ações suportadas pelo backend
  const getActionSuccessMessage = (action: string) => {
    const messages: Record<string, string> = {
      confirm: 'Reserva confirmada com sucesso',
      reject: 'Reserva rejeitada',
      cancel: 'Reserva cancelada',
      payments: 'Abrindo gestão de pagamentos...',
      edit: 'Abrindo edição...',
      details: 'Detalhes carregados',
      review: 'Abrindo avaliação...',
    };
    return messages[action] || 'Ação realizada com sucesso';
  };

  // ✅ CORREÇÃO: Apenas ações suportadas pelo backend
  const getActionErrorMessage = (action: string, errorMsg?: string) => {
    const messages: Record<string, string> = {
      confirm: 'Falha ao confirmar reserva',
      reject: 'Falha ao rejeitar reserva',
      cancel: 'Falha ao cancelar reserva',
      payments: 'Falha ao abrir pagamentos',
      edit: 'Falha ao abrir edição',
      details: 'Falha ao carregar detalhes',
      review: 'Falha ao abrir avaliação',
    };
    return errorMsg || messages[action] || 'Falha ao realizar ação';
  };

  // ✅ CORREÇÃO: HandleAction simplificado apenas para ações suportadas
  const handleAction = async (action: string, data?: { reason?: string; notes?: string }) => {
    setLoadingAction(action);
    
    try {
      if (action === 'payments') {
        setShowPaymentModal(true);
        toast({
          title: '✅ Sucesso',
          description: getActionSuccessMessage(action),
          variant: 'success',
        });
        return;
      }
      
      let result;
      
      switch (action) {
        case 'confirm':
          result = await eventSpaceService.confirmBooking(booking.id);
          break;
        
        case 'reject':
          if (!data?.reason || data.reason.trim().length < 5) {
            throw new Error('Motivo obrigatório (mínimo 5 caracteres)');
          }
          result = await eventSpaceService.rejectBooking(booking.id, data.reason);
          break;
        
        case 'cancel':
          result = await eventSpaceService.cancelBooking(
            booking.id, 
            data?.reason || 'Cancelado pelo gestor'
          );
          break;
        
        case 'edit':
        case 'details':
        case 'review':
          if (onAction) {
            await onAction(action, data);
          }
          break;
        
        default:
          if (onAction) {
            await onAction(action, data);
          } else {
            throw new Error(`Ação não suportada: ${action}`);
          }
      }

      if (result && !result.success) {
        throw new Error(result.error || `Falha na ação ${action}`);
      }

      toast({
        title: '✅ Sucesso',
        description: getActionSuccessMessage(action),
        variant: 'success',
      });

      // ✅ CORREÇÃO CRÍTICA: Chamar onActionSuccess para atualizar UI
      if (onActionSuccess) {
        console.log('📞 Chamando onActionSuccess para ação:', action);
        onActionSuccess();
      } else {
        console.warn('⚠️ onActionSuccess não definido! UI não atualizará.');
      }

      if (onAction && !['payments', 'edit', 'details', 'review'].includes(action)) {
        await onAction(action, data);
      }

    } catch (error: any) {
      console.error(`Erro na ação ${action}:`, error);
      toast({
        title: '❌ Erro',
        description: getActionErrorMessage(action, error.message),
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
      setActionReason('');
      setShowRejectDialog(false);
      setShowCancelDialog(false);
    }
  };

  // ✅ CORREÇÃO: getStatusActions simplificado para status reais
  const getStatusActions = () => {
    const actions = [];

    switch (booking.status) {
      case 'pending_approval':
        actions.push(
          <Button
            key="confirm"
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('confirm')}
            disabled={loadingAction === 'confirm'}
            className="bg-green-600 hover:bg-green-700"
            aria-label="Confirmar reserva"
          >
            {loadingAction === 'confirm' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Confirmar'}
          </Button>
        );
        actions.push(
          <Button
            key="reject"
            variant="destructive"
            size={compact ? "sm" : "default"}
            onClick={() => setShowRejectDialog(true)}
            disabled={loadingAction === 'reject'}
            aria-label="Rejeitar reserva"
          >
            {loadingAction === 'reject' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Rejeitar'}
          </Button>
        );
        break;

      case 'confirmed':
        // ✅ APENAS cancelar para confirmed (backend não suporta in_progress/completed)
        actions.push(
          <Button
            key="cancel"
            variant="destructive"
            size={compact ? "sm" : "default"}
            onClick={() => setShowCancelDialog(true)}
            disabled={loadingAction === 'cancel'}
            aria-label="Cancelar reserva"
          >
            {loadingAction === 'cancel' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Ban className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Cancelar'}
          </Button>
        );
        break;
    }

    // Botões comuns a todos os status (exceto finais)
    if (!['cancelled', 'rejected'].includes(booking.status)) {
      if (showDetails) {
        actions.push(
          <Button
            key="details"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('details')}
            aria-label="Ver detalhes"
          >
            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            {!compact && 'Detalhes'}
          </Button>
        );
      }
      
      if (showPayments && (hasBalance || isPendingPayment)) {
        const balance = calculateBalance();
        actions.push(
          <Button
            key="payments"
            variant={hasBalance ? "default" : "outline"}
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('payments')}
            aria-label="Gerenciar pagamentos"
            className={hasBalance ? "bg-amber-600 hover:bg-amber-700" : ""}
            title={hasBalance ? `Saldo pendente: ${balance.toFixed(2)} MTn` : 'Gerenciar pagamentos'}
          >
            <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
            {!compact && (hasBalance ? `Pagar (${balance.toFixed(2)} MTn)` : 'Pagamentos')}
          </Button>
        );
      }
      
      if (showEdit && ['pending_approval', 'confirmed'].includes(booking.status)) {
        actions.push(
          <Button
            key="edit"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('edit')}
            aria-label="Editar reserva"
          >
            <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
            {!compact && 'Editar'}
          </Button>
        );
      }
    }

    return actions;
  };

  return (
    <>
      <div className={`flex ${compact ? 'gap-1' : 'gap-2'} flex-wrap`}>
        {getStatusActions()}
      </div>

      {/* ✅ CORREÇÃO: No retorno do componente */}
      <PaymentRegisterModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={booking.id}
        bookingTitle={booking.event_title || `Reserva ${booking.id}`}
        balanceDue={calculateBalance()} // ✅ Usar função calculada
        onSuccess={handlePaymentSuccess} // ✅ Usar callback otimizado
      />

      {/* Diálogo de Rejeição */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Rejeitar Reserva
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar a reserva "{booking.event_title || booking.id}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Label htmlFor="rejectReason">Motivo da Rejeição *</Label>
            <Textarea
              id="rejectReason"
              placeholder="Descreva o motivo da rejeição (mínimo 5 caracteres)..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('reject', { reason: actionReason })}
              disabled={!actionReason.trim() || actionReason.trim().length < 5}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar Rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <Ban className="h-5 w-5" />
              Cancelar Reserva
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancelará a reserva "{booking.event_title || booking.id}". 
              O organizador será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Label htmlFor="cancelReason">Motivo do Cancelamento (opcional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Descreva o motivo do cancelamento..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('cancel', { reason: actionReason || 'Cancelado pelo gestor' })}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingActions;