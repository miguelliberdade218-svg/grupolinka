// src/services/eventPaymentService.ts
// Serviço completo para gestão de pagamentos de eventos
// VERSÃO CORRIGIDA - TIPAGEM FORTE, SEM ERROS DE 'unknown'

import { apiService } from './api';
import type { ServiceResponse } from './eventSpaceService'; // Assumindo que já existe este tipo

// Tipos exportados
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference_number: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  notes?: string;
  payment_type?: string;
  registered_by?: string;
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

export interface PaymentDetails {
  booking_id: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  deposit_required: number;
  payments: Payment[];
  payment_summary: {
    total_payments: number;
    confirmed_payments: number;
    pending_payments: number;
    last_payment_date?: string;
  };
}

export interface ManualPaymentRequest {
  amount: number;
  payment_method: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  reference: string;
  notes?: string;
  payment_type?: string;
}

export interface PaymentReceipt {
  id: string;
  booking_id: string;
  payment_id: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  issued_at: string;
  issued_by: string;
  qr_code?: string;
  download_url?: string;
  receipt_number: string;
}

export interface FinancialSummary {
  hotel_id: string;
  period: {
    start_date: string;
    end_date: string;
  };
  total_revenue: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  average_booking_value: number;
  payment_methods_summary: Record<string, number>;
  monthly_breakdown?: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface PaymentOption {
  id: string;
  name: string;
  type: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
  is_active: boolean;
  requires_confirmation: boolean;
  min_amount?: number;
  max_amount?: number;
  instructions?: string;
  icon?: string;
}

class EventPaymentService {
  // ==================== DETALHES DE PAGAMENTO ====================
  async getPaymentDetails(bookingId: string): Promise<ServiceResponse<PaymentDetails>> {
    try {
      const res = await apiService.get(`/api/events/bookings/${bookingId}/payment`) as ServiceResponse<PaymentDetails>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar detalhes do pagamento' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getPaymentDetails]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar detalhes do pagamento' 
      };
    }
  }

  // ==================== DEPÓSITO REQUERIDO ====================
  async calculateDeposit(bookingId: string): Promise<ServiceResponse<{ deposit_required: number }>> {
    try {
      const res = await apiService.get(`/api/events/bookings/${bookingId}/deposit`) as ServiceResponse<{ deposit_required: number }>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao calcular depósito' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[calculateDeposit]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao calcular depósito' 
      };
    }
  }

  // ==================== REGISTRAR PAGAMENTO MANUAL ====================
  async registerManualPayment(
    bookingId: string, 
    data: ManualPaymentRequest
  ): Promise<ServiceResponse<Payment>> {
    try {
      const res = await apiService.post(`/api/events/bookings/${bookingId}/payments`, data) as ServiceResponse<Payment>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao registrar pagamento' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[registerManualPayment]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao registrar pagamento' 
      };
    }
  }

  // ==================== CONFIRMAR PAGAMENTO ====================
  async confirmPayment(
    bookingId: string, 
    paymentId: string
  ): Promise<ServiceResponse<Payment>> {
    try {
      const res = await apiService.post(`/api/events/bookings/${bookingId}/payments/confirm`, {
        paymentId
      }) as ServiceResponse<Payment>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao confirmar pagamento' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[confirmPayment]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao confirmar pagamento' 
      };
    }
  }

  // ==================== GERAR RECIBO ====================
  async generateReceipt(bookingId: string): Promise<ServiceResponse<PaymentReceipt>> {
    try {
      const res = await apiService.get(`/api/events/bookings/${bookingId}/receipt`) as ServiceResponse<PaymentReceipt>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao gerar recibo' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[generateReceipt]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao gerar recibo' 
      };
    }
  }

  // ==================== RESUMO FINANCEIRO ====================
  async getFinancialSummary(
    hotelId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ServiceResponse<FinancialSummary>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await apiService.get(
        `/api/events/hotel/${hotelId}/financial-summary?${params.toString()}`
      ) as ServiceResponse<FinancialSummary>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar resumo financeiro' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getFinancialSummary]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar resumo financeiro' 
      };
    }
  }

  // ==================== OPÇÕES DE PAGAMENTO ====================
  async getPaymentOptionsForSpace(spaceId: string): Promise<ServiceResponse<PaymentOption[]>> {
    try {
      const res = await apiService.get(`/api/events/spaces/${spaceId}/payment-options`) as ServiceResponse<PaymentOption[]>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar opções de pagamento' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getPaymentOptionsForSpace]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar opções de pagamento' 
      };
    }
  }

  // ==================== PAGAMENTOS DISPONÍVEIS ====================
  async getAvailablePaymentOptions(
    spaceId: string, 
    eventDate: string, 
    totalAmount: number
  ): Promise<ServiceResponse<PaymentOption[]>> {
    try {
      const res = await apiService.get(`/api/events/spaces/${spaceId}/available-payment-options`, {
        params: { eventDate, totalAmount }
      }) as ServiceResponse<PaymentOption[]>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar opções disponíveis' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getAvailablePaymentOptions]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar opções disponíveis' 
      };
    }
  }

  // ==================== HISTÓRICO DE PAGAMENTOS ====================
  async getPaymentHistory(
    bookingId: string,
    limit = 50,
    offset = 0
  ): Promise<ServiceResponse<Payment[]>> {
    try {
      const res = await apiService.get(`/api/events/bookings/${bookingId}/payments/history`, {
        params: { limit, offset }
      }) as ServiceResponse<Payment[]>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar histórico' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getPaymentHistory]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar histórico de pagamentos' 
      };
    }
  }

  // ==================== ESTATÍSTICAS DE PAGAMENTOS ====================
  async getPaymentStats(
    hotelId: string,
    period: 'today' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ServiceResponse<{
    total_revenue: number;
    pending_payments: number;
    confirmed_payments: number;
    average_payment: number;
    payment_method_distribution: Record<string, number>;
  }>> {
    try {
      const res = await apiService.get(`/api/events/hotel/${hotelId}/payment-stats`, {
        params: { period }
      }) as ServiceResponse<{
        total_revenue: number;
        pending_payments: number;
        confirmed_payments: number;
        average_payment: number;
        payment_method_distribution: Record<string, number>;
      }>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao buscar estatísticas' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[getPaymentStats]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao buscar estatísticas de pagamentos' 
      };
    }
  }

  // ==================== DOWNLOAD RECIBO ====================
  async downloadReceipt(paymentId: string): Promise<ServiceResponse<{ download_url: string }>> {
    try {
      const res = await apiService.get(`/api/events/payments/${paymentId}/receipt/download`) as ServiceResponse<{ download_url: string }>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao baixar recibo' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[downloadReceipt]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao baixar recibo' 
      };
    }
  }

  // ==================== REEMBOLSO ====================
  async refundPayment(
    paymentId: string,
    reason: string,
    amount?: number
  ): Promise<ServiceResponse<Payment>> {
    try {
      const res = await apiService.post(`/api/events/payments/${paymentId}/refund`, {
        reason,
        amount
      }) as ServiceResponse<Payment>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao processar reembolso' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[refundPayment]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao processar reembolso' 
      };
    }
  }

  // ==================== VALIDAR REFERÊNCIA ====================
  async validatePaymentReference(
    reference: string,
    bookingId?: string
  ): Promise<ServiceResponse<{ valid: boolean; message?: string }>> {
    try {
      const res = await apiService.post('/api/events/payments/validate-reference', {
        reference,
        bookingId
      }) as ServiceResponse<{ valid: boolean; message?: string }>;

      if (!res.success) {
        return { 
          success: false, 
          error: res.error || 'Erro ao validar referência' 
        };
      }

      return res;
    } catch (err: any) {
      console.error('[validatePaymentReference]', err);
      return { 
        success: false, 
        error: err.message || 'Falha ao validar referência' 
      };
    }
  }
}

export const eventPaymentService = new EventPaymentService();
export default eventPaymentService;