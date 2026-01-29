// src/apps/hotels-app/components/event-spaces/BookingActions.tsx
import React, { useState } from 'react';
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
  Clock,
  CheckSquare,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import type { PaymentStatusType } from '@/shared/types/event-spaces';
import { PaymentRegisterModal } from './PaymentRegisterModal';

interface BookingActionsProps {
  booking: {
    id: string;
    status: 'pending_approval' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
    payment_status?: PaymentStatusType;
    balance_due?: string | number;
    event_title?: string;
    organizer_name?: string;
    start_date?: string;
    end_date?: string;
  };
  onAction: (action: string, data?: { reason?: string; notes?: string }) => Promise<void>;
  showDetails?: boolean;
  showPayments?: boolean;
  showEdit?: boolean;
  compact?: boolean;
  onActionSuccess?: () => void; // Novo prop para recarregar dados após ação
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onAction,
  showDetails = true,
  showPayments = true,
  showEdit = true,
  compact = false,
  onActionSuccess,
}) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Novo estado para o modal de pagamentos
  const [actionReason, setActionReason] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();

  const getActionSuccessMessage = (action: string) => {
    const messages: Record<string, string> = {
      confirm: 'Reserva confirmada com sucesso',
      reject: 'Reserva rejeitada',
      cancel: 'Reserva cancelada',
      complete: 'Evento concluído',
      start: 'Evento iniciado',
      pause: 'Evento pausado',
      payments: 'Abrindo gestão de pagamentos...',
      edit: 'Abrindo edição...',
      details: 'Detalhes carregados',
      review: 'Abrindo avaliação...',
    };
    return messages[action] || 'Ação realizada com sucesso';
  };

  const getActionErrorMessage = (action: string, errorMsg?: string) => {
    const messages: Record<string, string> = {
      confirm: 'Falha ao confirmar reserva',
      reject: 'Falha ao rejeitar reserva',
      cancel: 'Falha ao cancelar reserva',
      complete: 'Falha ao concluir evento',
      start: 'Falha ao iniciar evento',
      pause: 'Falha ao pausar evento',
      payments: 'Falha ao abrir pagamentos',
      edit: 'Falha ao abrir edição',
      details: 'Falha ao carregar detalhes',
      review: 'Falha ao abrir avaliação',
    };
    return errorMsg || messages[action] || 'Falha ao realizar ação';
  };

  const handleAction = async (action: string, data?: { reason?: string; notes?: string }) => {
    setLoadingAction(action);
    try {
      // Caso especial para a ação de pagamentos
      if (action === 'payments') {
        setShowPaymentModal(true);
        toast({
          title: '✅ Sucesso',
          description: getActionSuccessMessage(action),
          variant: 'success',
        });
        return; // Não chama onAction para pagamentos
      }

      // Para outras ações, chama a função onAction normalmente
      await onAction(action, data);
      toast({
        title: '✅ Sucesso',
        description: getActionSuccessMessage(action),
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erro',
        description: getActionErrorMessage(action, error.message),
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
      setActionReason('');
      // Fechar todos os diálogos (exceto o modal de pagamentos)
      setShowRejectDialog(false);
      setShowCancelDialog(false);
      setShowCompleteDialog(false);
      setShowStartDialog(false);
    }
  };

  const getStatusActions = () => {
    const actions = [];

    // Ações baseadas no status
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
        actions.push(
          <Button
            key="start"
            size={compact ? "sm" : "default"}
            onClick={() => setShowStartDialog(true)}
            disabled={loadingAction === 'start'}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label="Iniciar evento"
          >
            {loadingAction === 'start' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Iniciar Evento'}
          </Button>
        );
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

      case 'in_progress':
        actions.push(
          <Button
            key="complete"
            size={compact ? "sm" : "default"}
            onClick={() => setShowCompleteDialog(true)}
            disabled={loadingAction === 'complete'}
            className="bg-purple-600 hover:bg-purple-700"
            aria-label="Concluir evento"
          >
            {loadingAction === 'complete' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <CheckSquare className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Concluir'}
          </Button>
        );
        actions.push(
          <Button
            key="pause"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('pause')}
            disabled={loadingAction === 'pause'}
            aria-label="Pausar evento"
          >
            {loadingAction === 'pause' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <PauseCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {!compact && 'Pausar'}
          </Button>
        );
        break;

      case 'completed':
        actions.push(
          <Button
            key="review"
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => handleAction('review')}
            disabled={loadingAction === 'review'}
            aria-label="Avaliar evento"
          >
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            {!compact && 'Avaliar'}
          </Button>
        );
        break;
    }

    // Ações sempre disponíveis
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

    if (showPayments && Number(booking.balance_due || 0) > 0) {
      actions.push(
        <Button
          key="payments"
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => handleAction('payments')}
          aria-label="Gerenciar pagamentos"
        >
          <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
          {!compact && 'Pagamentos'}
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

    return actions;
  };

  return (
    <>
      <div className={`flex ${compact ? 'gap-1' : 'gap-2'} flex-wrap`}>
        {getStatusActions()}
      </div>

      {/* Modal de Pagamentos */}
      <PaymentRegisterModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bookingId={booking.id}
        bookingTitle={booking.event_title || `Reserva ${booking.id}`}
        balanceDue={Number(booking.balance_due || 0)}
        onSuccess={() => {
          // Recarregar dados da reserva ou lista
          if (onActionSuccess) onActionSuccess();
          // Fechar o modal
          setShowPaymentModal(false);
          // Mostrar mensagem de sucesso
          toast({
            title: '✅ Sucesso',
            description: 'Pagamento registrado com sucesso',
            variant: 'success',
          });
        }}
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
              placeholder="Descreva o motivo da rejeição (mínimo 10 caracteres)..."
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
              disabled={!actionReason.trim() || actionReason.trim().length < 10}
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

      {/* Diálogo de Conclusão */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-purple-600">
              <CheckSquare className="h-5 w-5" />
              Concluir Evento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Marcar o evento "{booking.event_title || booking.id}" como concluído?
              Esta ação finalizará o evento e permitirá avaliações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Label htmlFor="completeNotes">Observações (opcional)</Label>
            <Textarea
              id="completeNotes"
              placeholder="Observações sobre a conclusão do evento..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('complete', { notes: actionReason })}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Confirmar Conclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Início */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <PlayCircle className="h-5 w-5" />
              Iniciar Evento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Iniciar o evento "{booking.event_title || booking.id}"? 
              O status será alterado para "Em andamento".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Label htmlFor="startNotes">Observações (opcional)</Label>
            <Textarea
              id="startNotes"
              placeholder="Observações sobre o início do evento..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('start', { notes: actionReason })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Iniciar Evento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingActions;