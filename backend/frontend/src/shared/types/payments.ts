/**
 * src/shared/types/payments.ts
 * Tipos para gestão de pagamentos (hotéis e event spaces)
 * Alinhado com hotelPaymentService.ts e eventPaymentService.ts
 */

// ==================== PAYMENT METHODS ====================
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
export type PaymentType = 'partial' | 'full' | 'deposit' | 'manual_event_payment';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

// ==================== HOTEL PAYMENTS ====================
export interface HotelPayment {
  id: string;
  bookingId: string;
  hotelId: string;
  invoiceNumber?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentReference?: string | null;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  proofImageUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHotelPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes?: string;
  paymentType?: PaymentType;
  proofImageUrl?: string;
}

export interface HotelInvoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  hotelId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  basePrice: number;
  discountAmount?: number;
  totalPrice: number;
  depositRequired: number;
  depositPaid: number;
  balanceDue: number;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  issueDate: string;
  paidDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  invoice: HotelInvoice;
  payments: HotelPayment[];
  balance: {
    totalDue: number;
    totalPaid: number;
    balanceRemaining: number;
    depositRequired: number;
    depositPaid: number;
  };
}

export interface RequiredDeposit {
  bookingId: string;
  totalPrice: number;
  depositPercent: number;
  depositAmount: number;
  balanceDue: number;
  dueDate: string;
}

export interface PaymentOptions {
  id: string;
  hotelId: string;
  supportsMpesa: boolean;
  supportsBankTransfer: boolean;
  supportsCard: boolean;
  depositPercent: number;
  fullPaymentDaysAdvance: number;
  paymentTerms?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankBranch: string;
  };
  mpesaBusiness?: {
    businessName: string;
    businessCode: string;
    phone: string;
  };
  cardProcessor?: {
    provider: string;
    merchantId: string;
  };
}

// ==================== EVENT SPACE PAYMENTS ====================
export interface EventSpacePayment {
  id: string;
  bookingId: string;
  hotelId: string;
  eventSpaceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentReference?: string | null;
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventSpacePaymentRequest {
  amount: number;
  payment_method: PaymentMethod;
  reference: string;
  notes?: string;
  payment_type?: PaymentType;
}

export interface EventSpaceSecurityDeposit {
  bookingId: string;
  totalPrice: number;
  securityDepositPercent: number;
  depositAmount: number;
  balanceDue: number;
  refundableAfterEvent: boolean;
  refundDate?: string;
}

// ==================== PAGAMENTOS GERAIS ====================
export interface PaymentReceipt {
  id: string;
  paymentId: string;
  bookingId: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  guestName: string;
  eventTitle?: string;
  hotelName: string;
  generatedAt: string;
  generatedBy: string;
}

export interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  paymentsByMethod: Record<PaymentMethod, number>;
  bookingsByStatus: Record<string, number>;
  averagePaymentTime: number; // em dias
}

export interface ManualPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes?: string;
  paymentType?: PaymentType;
}

// ==================== RESPOSTAS API ====================
export interface PaymentResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaymentListResponse {
  success: boolean;
  data: HotelPayment[] | EventSpacePayment[];
  count: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ==================== FILTROS ====================
export interface PaymentFilters {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

export interface InvoiceFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
