// src/apps/hotels-app/utils/bookingUtils.ts

/**
 * Normaliza status do booking
 * @param status Status do booking (pode ser undefined)
 * @returns Status normalizado em lowercase
 */
export const normalizeStatus = (status: string | undefined): string => {
  if (!status) return 'pending';
  return status.toLowerCase().trim();
};

/**
 * Normaliza status de pagamento conforme backend
 * @param status Status de pagamento (pode ser undefined)
 * @returns Status normalizado: 'pending', 'partial', 'paid', 'refunded', 'failed', 'cancelled'
 */
export const normalizePaymentStatus = (status: string | undefined): string => {
  if (!status) return 'pending';
  
  const normalized = status.toLowerCase().trim();
  const validStatuses = ['pending', 'partial', 'paid', 'refunded', 'failed', 'cancelled'];
  
  // Se for um status válido, retorna ele mesmo
  if (validStatuses.includes(normalized)) {
    return normalized;
  }
  
  // Mapear variações comuns
  const statusMap: Record<string, string> = {
    'pendente': 'pending',
    'parcial': 'partial',
    'pago': 'paid',
    'reembolsado': 'refunded',
    'falhou': 'failed',
    'cancelado': 'cancelled',
    'canceled': 'cancelled',
    'complete': 'paid',
    'completed': 'paid',
  };
  
  return statusMap[normalized] || 'pending';
};

/**
 * Verifica se pode fazer check-in
 * @param booking Booking a verificar
 * @returns boolean
 */
export const canCheckIn = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  return status === 'confirmed';
};

/**
 * Verifica se pode fazer check-out
 * @param booking Booking a verificar
 * @returns boolean
 */
export const canCheckOut = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  return status === 'checked_in';
};

/**
 * Verifica se pode cancelar
 * @param booking Booking a verificar
 * @returns boolean
 */
export const canCancel = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  const cancelableStatuses = ['pending', 'pending_confirmation', 'confirmed'];
  return cancelableStatuses.includes(status);
};

/**
 * Verifica se pode registrar pagamento
 * @param booking Booking a verificar
 * @returns boolean
 */
export const canRegisterPayment = (booking: { payment_status?: string }): boolean => {
  const paymentStatus = normalizePaymentStatus(booking?.payment_status);
  const registerableStatuses = ['pending', 'partial'];
  return registerableStatuses.includes(paymentStatus);
};

/**
 * Verifica se pode confirmar reserva
 */
export const canConfirm = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  return status === 'pending_confirmation';
};

/**
 * Verifica se pode rejeitar reserva
 */
export const canReject = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  return status === 'pending_confirmation';
};

/**
 * Verifica se pode marcar como no-show
 */
export const canMarkNoShow = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  return status === 'confirmed' || status === 'pending_confirmation';
};

/**
 * Verifica se pode alterar para qualquer estado manualmente
 * (para host/admin)
 */
export const canChangeStatus = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  const changeableStatuses = [
    'pending',
    'pending_confirmation', 
    'confirmed',
    'checked_in',
    'checked_out',
    'cancelled'
  ];
  return changeableStatuses.includes(status);
};

/**
 * Obtém configuração de status para exibição
 * @param status Status do booking
 * @returns Configuração com label e cor
 */
export const getStatusConfig = (status: string | undefined) => {
  const normalizedStatus = normalizeStatus(status);
  
  const statusMap: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'pending_confirmation': { label: 'Aguardando Confirmação', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'confirmed': { label: 'Confirmada', color: 'bg-green-100 text-green-800 border-green-200' },
    'checked_in': { label: 'Check-in Realizado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'checked_out': { label: 'Check-out Realizado', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'cancelled': { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-200' },
    'no_show': { label: 'No-show', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  
  const finalStatus = normalizedStatus.replace(/\s+/g, '_');
  return statusMap[finalStatus] || statusMap.pending;
};

/**
 * Obtém configuração de status de pagamento para exibição
 * @param status Status de pagamento
 * @returns Configuração com label e cor
 */
export const getPaymentStatusConfig = (status: string | undefined) => {
  const normalizedStatus = normalizePaymentStatus(status);
  
  const configs: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'partial': { label: 'Parcial', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'paid': { label: 'Pago', color: 'bg-green-100 text-green-800 border-green-200' },
    'refunded': { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    'failed': { label: 'Falhou', color: 'bg-red-100 text-red-800 border-red-200' },
    'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
  };
  
  return configs[normalizedStatus] || configs.pending;
};

/**
 * ✅ NOVO: Mapeamento de ações de booking com configurações completas
 */
export const BOOKING_ACTION_CONFIGS = {
  confirm: {
    endpoint: '/confirm',
    method: 'POST',
    label: 'Confirmar',
    color: 'success',
    confirmMessage: 'Tem certeza que deseja confirmar esta reserva?',
  },
  reject: {
    endpoint: '/reject',
    method: 'POST',
    label: 'Rejeitar',
    color: 'error',
    confirmMessage: 'Tem certeza que deseja rejeitar esta reserva?',
  },
  cancel: {
    endpoint: '/cancel',
    method: 'POST',
    label: 'Cancelar',
    color: 'warning',
    confirmMessage: 'Tem certeza que deseja cancelar esta reserva?',
  },
  'check-in': {
    endpoint: '/check-in',
    method: 'POST',
    label: 'Check-in',
    color: 'primary',
    confirmMessage: 'Deseja realizar o check-in?',
  },
  'check-out': {
    endpoint: '/check-out',
    method: 'POST',
    label: 'Check-out',
    color: 'info',
    confirmMessage: 'Deseja realizar o check-out?',
  }
} as const;

/**
 * ✅ NOVO: Obtém ações disponíveis para um status específico
 * @param bookingStatus Status da reserva
 * @returns Array de chaves de ações disponíveis
 */
export const getAvailableActions = (bookingStatus: string | undefined): Array<keyof typeof BOOKING_ACTION_CONFIGS> => {
  const status = normalizeStatus(bookingStatus);
  
  const actionsByStatus: Record<string, Array<keyof typeof BOOKING_ACTION_CONFIGS>> = {
    'pending': ['confirm', 'reject', 'cancel'],
    'pending_confirmation': ['confirm', 'reject', 'cancel'],
    'confirmed': ['check-in', 'cancel'],
    'checked_in': ['check-out'],
    'checked_out': [],
    'cancelled': [],
    'no_show': [],
  };
  
  return actionsByStatus[status] || [];
};

/**
 * ✅ NOVO: Verifica se pode executar uma ação específica
 * @param bookingStatus Status da reserva
 * @param action Ação a verificar
 * @returns boolean
 */
export const canExecuteAction = (bookingStatus: string | undefined, action: keyof typeof BOOKING_ACTION_CONFIGS): boolean => {
  const availableActions = getAvailableActions(bookingStatus);
  return availableActions.includes(action);
};

/**
 * ✅ NOVO: Obtém o próximo status possível após uma ação
 * @param currentStatus Status atual
 * @param action Ação executada
 * @returns Próximo status ou null se inválido
 */
export const getNextStatus = (currentStatus: string | undefined, action: keyof typeof BOOKING_ACTION_CONFIGS): string | null => {
  const status = normalizeStatus(currentStatus);
  
  const statusTransitionMap: Record<string, Record<keyof typeof BOOKING_ACTION_CONFIGS, string>> = {
    'pending': {
      'confirm': 'confirmed',
      'reject': 'cancelled',
      'cancel': 'cancelled',
      'check-in': 'checked_in',
      'check-out': 'checked_out',
    },
    'pending_confirmation': {
      'confirm': 'confirmed',
      'reject': 'cancelled',
      'cancel': 'cancelled',
      'check-in': 'checked_in',
      'check-out': 'checked_out',
    },
    'confirmed': {
      'check-in': 'checked_in',
      'cancel': 'cancelled',
      'confirm': 'confirmed',
      'reject': 'cancelled',
      'check-out': 'checked_out',
    },
    'checked_in': {
      'check-out': 'checked_out',
      'confirm': 'checked_in',
      'reject': 'checked_in',
      'cancel': 'cancelled',
      'check-in': 'checked_in',
    },
  };
  
  return statusTransitionMap[status]?.[action] || null;
};

/**
 * ✅ NOVO: Verifica se uma reserva está em um status "ativo"
 * (ainda não finalizado - check-out, cancelado ou no-show)
 */
export const isActiveBooking = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  const activeStatuses = ['pending', 'pending_confirmation', 'confirmed', 'checked_in'];
  return activeStatuses.includes(status);
};

/**
 * ✅ NOVO: Verifica se uma reserva está finalizada
 * (já terminou - check-out, cancelado ou no-show)
 */
export const isFinalizedBooking = (booking: { status?: string }): boolean => {
  const status = normalizeStatus(booking?.status);
  const finalizedStatuses = ['checked_out', 'cancelled', 'no_show'];
  return finalizedStatuses.includes(status);
};

/**
 * ✅ NOVO: Obtém ícone correspondente ao status
 */
export const getStatusIcon = (status: string | undefined): string => {
  const normalizedStatus = normalizeStatus(status);
  
  const iconMap: Record<string, string> = {
    'pending': '⏳',
    'pending_confirmation': '🕐',
    'confirmed': '✅',
    'checked_in': '🏨',
    'checked_out': '🚪',
    'cancelled': '❌',
    'no_show': '👤❌',
  };
  
  const finalStatus = normalizedStatus.replace(/\s+/g, '_');
  return iconMap[finalStatus] || '📋';
};