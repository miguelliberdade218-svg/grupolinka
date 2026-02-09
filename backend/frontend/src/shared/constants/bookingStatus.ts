// src/shared/constants/bookingStatus.ts

// ==================== STATUS DE RESERVA ====================

/**
 * ✅ ATUALIZADO: Status válidos para bookings conforme backend corrigido
 */
export const BOOKING_STATUS = {
  PENDING_CONFIRMATION: 'pending_confirmation',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
} as const;

export type BookingStatusType = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

/**
 * ✅ ATUALIZADO: Exibição em português para cada status
 */
export const BOOKING_STATUS_DISPLAY: Record<BookingStatusType, string> = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: 'Aguardando Confirmação',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmada',
  [BOOKING_STATUS.CHECKED_IN]: 'Check-in Realizado',
  [BOOKING_STATUS.CHECKED_OUT]: 'Check-out Realizado',
  [BOOKING_STATUS.CANCELLED]: 'Cancelada',
  [BOOKING_STATUS.NO_SHOW]: 'No Show'
};

/**
 * ✅ ATUALIZADO: Cores para exibição visual de cada status
 */
export const BOOKING_STATUS_COLORS: Record<BookingStatusType, { bg: string; text: string; border: string }> = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: { 
    bg: 'bg-amber-100', 
    text: 'text-amber-800', 
    border: 'border-amber-200' 
  },
  [BOOKING_STATUS.CONFIRMED]: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    border: 'border-green-200' 
  },
  [BOOKING_STATUS.CHECKED_IN]: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-200' 
  },
  [BOOKING_STATUS.CHECKED_OUT]: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-800', 
    border: 'border-purple-200' 
  },
  [BOOKING_STATUS.CANCELLED]: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-200' 
  },
  [BOOKING_STATUS.NO_SHOW]: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    border: 'border-gray-200' 
  },
};

/**
 * ✅ ATUALIZADO: Ícones para cada status
 */
export const BOOKING_STATUS_ICONS: Record<BookingStatusType, string> = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: '🕐',
  [BOOKING_STATUS.CONFIRMED]: '✅',
  [BOOKING_STATUS.CHECKED_IN]: '🏨',
  [BOOKING_STATUS.CHECKED_OUT]: '🚪',
  [BOOKING_STATUS.CANCELLED]: '❌',
  [BOOKING_STATUS.NO_SHOW]: '👤❌',
};

// ==================== AÇÕES DE RESERVA ====================

// ✅ CORREÇÃO: Tipo para ações de booking
export interface BookingAction {
  id: 'confirm' | 'reject' | 'cancel' | 'check-in' | 'check-out';
  label: string;
  color: 'success' | 'error' | 'warning' | 'primary' | 'info';
  endpoint: string;
  confirmMessage: string;
}

// ✅ CORREÇÃO: Usando arrays regulares em vez de readonly
const PENDING_CONFIRMATION_ACTIONS: BookingAction[] = [
  { 
    id: 'confirm', 
    label: 'Confirmar', 
    color: 'success', 
    endpoint: '/confirm',
    confirmMessage: 'Tem certeza que deseja confirmar esta reserva?',
  },
  { 
    id: 'reject', 
    label: 'Rejeitar', 
    color: 'error', 
    endpoint: '/reject',
    confirmMessage: 'Tem certeza que deseja rejeitar esta reserva?',
  },
  { 
    id: 'cancel', 
    label: 'Cancelar', 
    color: 'warning', 
    endpoint: '/cancel',
    confirmMessage: 'Tem certeza que deseja cancelar esta reserva?',
  },
];

const CONFIRMED_ACTIONS: BookingAction[] = [
  { 
    id: 'check-in', 
    label: 'Check-in', 
    color: 'primary', 
    endpoint: '/check-in',
    confirmMessage: 'Deseja realizar o check-in?',
  },
  { 
    id: 'cancel', 
    label: 'Cancelar', 
    color: 'warning', 
    endpoint: '/cancel',
    confirmMessage: 'Tem certeza que deseja cancelar esta reserva?',
  },
];

const CHECKED_IN_ACTIONS: BookingAction[] = [
  { 
    id: 'check-out', 
    label: 'Check-out', 
    color: 'info', 
    endpoint: '/check-out',
    confirmMessage: 'Deseja realizar o check-out?',
  }
];

const EMPTY_ACTIONS: BookingAction[] = [];

/**
 * ✅ CORRIGIDO: Ações disponíveis para cada status
 * Agora reflete corretamente o fluxo do backend
 */
export const BOOKING_ACTIONS: Record<BookingStatusType, BookingAction[]> = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: PENDING_CONFIRMATION_ACTIONS,
  [BOOKING_STATUS.CONFIRMED]: CONFIRMED_ACTIONS,
  [BOOKING_STATUS.CHECKED_IN]: CHECKED_IN_ACTIONS,
  [BOOKING_STATUS.CHECKED_OUT]: EMPTY_ACTIONS,
  [BOOKING_STATUS.CANCELLED]: EMPTY_ACTIONS,
  [BOOKING_STATUS.NO_SHOW]: EMPTY_ACTIONS
};

export type BookingActionType = BookingAction['id'];

// ==================== FLUXO DE STATUS ====================

/**
 * ✅ ATUALIZADO: Fluxo de transição de status corrigido
 * Agora reflete o fluxo real do backend
 */
export const BOOKING_STATUS_FLOW: Record<BookingStatusType, BookingStatusType[]> = {
  [BOOKING_STATUS.PENDING_CONFIRMATION]: [
    BOOKING_STATUS.CONFIRMED, 
    BOOKING_STATUS.CANCELLED
  ],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CHECKED_IN, 
    BOOKING_STATUS.CANCELLED
  ],
  [BOOKING_STATUS.CHECKED_IN]: [
    BOOKING_STATUS.CHECKED_OUT
  ],
  [BOOKING_STATUS.CHECKED_OUT]: [],
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.NO_SHOW]: []
};

/**
 * ✅ NOVO: Mapeamento de ações para próximo status
 */
export const BOOKING_ACTION_TRANSITIONS: Record<BookingActionType, BookingStatusType> = {
  'confirm': BOOKING_STATUS.CONFIRMED,
  'reject': BOOKING_STATUS.CANCELLED,
  'cancel': BOOKING_STATUS.CANCELLED,
  'check-in': BOOKING_STATUS.CHECKED_IN,
  'check-out': BOOKING_STATUS.CHECKED_OUT,
};

// ==================== STATUS DE PAGAMENTO ====================

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_DISPLAY: Record<PaymentStatusType, string> = {
  [PAYMENT_STATUS.PENDING]: 'Pendente',
  [PAYMENT_STATUS.PARTIAL]: 'Parcial',
  [PAYMENT_STATUS.PAID]: 'Pago',
  [PAYMENT_STATUS.REFUNDED]: 'Reembolsado',
  [PAYMENT_STATUS.FAILED]: 'Falhou',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelado',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatusType, { bg: string; text: string; border: string }> = {
  [PAYMENT_STATUS.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  [PAYMENT_STATUS.PARTIAL]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  [PAYMENT_STATUS.PAID]: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  [PAYMENT_STATUS.REFUNDED]: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  [PAYMENT_STATUS.FAILED]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  [PAYMENT_STATUS.CANCELLED]: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

// ==================== FUNÇÕES ÚTEIS ====================

/**
 * ✅ NOVO: Verifica se uma ação é válida para um status
 */
export const isValidActionForStatus = (
  status: BookingStatusType, 
  action: BookingActionType
): boolean => {
  const actions = BOOKING_ACTIONS[status] || [];
  return actions.some(a => a.id === action);
};

/**
 * ✅ NOVO: Obtém ações disponíveis para um status
 */
export const getActionsForStatus = (
  status: BookingStatusType
): BookingAction[] => {
  return BOOKING_ACTIONS[status] || [];
};

/**
 * ✅ NOVO: Obtém próximo status possível após uma ação
 */
export const getNextStatusAfterAction = (
  currentStatus: BookingStatusType,
  action: BookingActionType
): BookingStatusType | null => {
  if (!isValidActionForStatus(currentStatus, action)) {
    return null;
  }
  
  return BOOKING_ACTION_TRANSITIONS[action];
};

/**
 * ✅ NOVO: Verifica se uma reserva está ativa
 * (não finalizada - não checked_out, cancelled ou no_show)
 */
export const isActiveBooking = (status: BookingStatusType): boolean => {
  const activeStatuses: BookingStatusType[] = [
    BOOKING_STATUS.PENDING_CONFIRMATION,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.CHECKED_IN,
  ];
  return activeStatuses.includes(status);
};

/**
 * ✅ NOVO: Verifica se uma reserva está finalizada
 */
export const isFinalizedBooking = (status: BookingStatusType): boolean => {
  const finalizedStatuses: BookingStatusType[] = [
    BOOKING_STATUS.CHECKED_OUT,
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.NO_SHOW,
  ];
  return finalizedStatuses.includes(status);
};

/**
 * ✅ NOVO: Obtém configuração completa para exibição de status
 */
export const getStatusDisplayConfig = (status: BookingStatusType) => {
  return {
    label: BOOKING_STATUS_DISPLAY[status],
    color: BOOKING_STATUS_COLORS[status],
    icon: BOOKING_STATUS_ICONS[status],
  };
};

/**
 * ✅ NOVO: Normaliza string de status para BookingStatusType
 */
export const normalizeBookingStatus = (status: string | undefined): BookingStatusType => {
  if (!status) return BOOKING_STATUS.PENDING_CONFIRMATION;
  
  const normalized = status.toLowerCase().trim();
  
  // Mapeamento para compatibilidade
  const statusMap: Record<string, BookingStatusType> = {
    'pending': BOOKING_STATUS.PENDING_CONFIRMATION,
    'pending_confirmation': BOOKING_STATUS.PENDING_CONFIRMATION,
    'confirmed': BOOKING_STATUS.CONFIRMED,
    'checked_in': BOOKING_STATUS.CHECKED_IN,
    'checked_out': BOOKING_STATUS.CHECKED_OUT,
    'cancelled': BOOKING_STATUS.CANCELLED,
    'canceled': BOOKING_STATUS.CANCELLED,
    'no_show': BOOKING_STATUS.NO_SHOW,
    'no-show': BOOKING_STATUS.NO_SHOW,
  };
  
  return statusMap[normalized] || BOOKING_STATUS.PENDING_CONFIRMATION;
};

/**
 * ✅ NOVO: Obtém a configuração de uma ação específica
 */
export const getBookingActionConfig = (actionId: BookingActionType): BookingAction | undefined => {
  // Procura em todas as listas de ações
  const allStatuses = Object.values(BOOKING_STATUS);
  
  for (const status of allStatuses) {
    const action = BOOKING_ACTIONS[status].find(a => a.id === actionId);
    if (action) return action;
  }
  
  return undefined;
};