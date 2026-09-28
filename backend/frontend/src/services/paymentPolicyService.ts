// src/services/paymentPolicyService.ts
// Serviço para gerenciamento de políticas de pagamento
// ✅ NOVO: Integração com backend de payment policies
// ✅ Suporte para 3 provider types: hotels, drivers, events

import { apiService } from './api';

// ==================== TIPOS ====================

export interface HotelPaymentPolicy {
  id: string;
  hotel_id: string;
  advance_payment_enabled: boolean;
  advance_payment_percentage: number;
  deposit_enabled: boolean;
  deposit_percentage: number;
  deposit_required: boolean;
  final_payment_due_days: number;
  pay_at_location_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverPaymentPolicy {
  id: string;
  driver_id: string;
  advance_payment_enabled: boolean;
  advance_payment_percentage: number;
  pay_at_location_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventSpacePaymentPolicy {
  id: string;
  event_space_id: string;
  advance_payment_enabled: boolean;
  advance_payment_percentage: number;
  final_payment_due_days: number;
  full_refund_until_days: number;
  partial_refund_until_days: number;
  created_at: string;
  updated_at: string;
}

export type PaymentPolicyResponse =
  | HotelPaymentPolicy
  | DriverPaymentPolicy
  | EventSpacePaymentPolicy;

// ==================== DEFAULT POLICIES ====================

export const DEFAULT_POLICIES = {
  hotel: {
    advance_payment_enabled: false,
    advance_payment_percentage: 0.0,
    deposit_enabled: true,
    deposit_percentage: 30.0,
    deposit_required: true,
    final_payment_due_days: 7,
    pay_at_location_enabled: true,
  },
  driver: {
    advance_payment_enabled: false,
    advance_payment_percentage: 0.0,
    pay_at_location_enabled: true,
  },
  event_space: {
    advance_payment_enabled: true,
    advance_payment_percentage: 50.0,
    final_payment_due_days: 14,
    full_refund_until_days: 30,
    partial_refund_until_days: 14,
  },
};

// ==================== SERVICE ====================

export const paymentPolicyService = {
  /**
   * Obter política de pagamento de um hotel
   */
  async getHotelPolicy(hotelId: string): Promise<HotelPaymentPolicy> {
    try {
      const response = await apiService.get<HotelPaymentPolicy>(
        `/api/payment-policies/hotels/${hotelId}`
      );

      console.log('✅ Hotel payment policy loaded:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as HotelPaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao obter política de hotel:', error);
      // Retornar policy padrão em caso de erro
      return {
        id: '',
        hotel_id: hotelId,
        ...DEFAULT_POLICIES.hotel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as HotelPaymentPolicy;
    }
  },

  /**
   * Atualizar/criar política de pagamento de um hotel
   */
  async updateHotelPolicy(
    hotelId: string,
    policy: Partial<HotelPaymentPolicy>
  ): Promise<HotelPaymentPolicy> {
    try {
      const response = await apiService.post<HotelPaymentPolicy>(
        `/api/payment-policies/hotels/${hotelId}/update`,
        policy
      );

      console.log('✅ Hotel payment policy updated:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as HotelPaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao atualizar política de hotel:', error);
      throw error;
    }
  },

  /**
   * Obter política de pagamento de um motorista
   */
  async getDriverPolicy(driverId: string): Promise<DriverPaymentPolicy> {
    try {
      const response = await apiService.get<DriverPaymentPolicy>(
        `/api/payment-policies/drivers/${driverId}`
      );

      console.log('✅ Driver payment policy loaded:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as DriverPaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao obter política de motorista:', error);
      return {
        id: '',
        driver_id: driverId,
        ...DEFAULT_POLICIES.driver,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DriverPaymentPolicy;
    }
  },

  /**
   * Atualizar/criar política de pagamento de um motorista
   */
  async updateDriverPolicy(
    driverId: string,
    policy: Partial<DriverPaymentPolicy>
  ): Promise<DriverPaymentPolicy> {
    try {
      const response = await apiService.post<DriverPaymentPolicy>(
        `/api/payment-policies/drivers/${driverId}/update`,
        policy
      );

      console.log('✅ Driver payment policy updated:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as DriverPaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao atualizar política de motorista:', error);
      throw error;
    }
  },

  /**
   * Obter política de pagamento de um event space
   */
  async getEventSpacePolicy(
    eventSpaceId: string
  ): Promise<EventSpacePaymentPolicy> {
    try {
      const response = await apiService.get<EventSpacePaymentPolicy>(
        `/api/payment-policies/event-spaces/${eventSpaceId}`
      );

      console.log('✅ Event space payment policy loaded:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as EventSpacePaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao obter política de event space:', error);
      return {
        id: '',
        event_space_id: eventSpaceId,
        ...DEFAULT_POLICIES.event_space,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as EventSpacePaymentPolicy;
    }
  },

  /**
   * Atualizar/criar política de pagamento de um event space
   */
  async updateEventSpacePolicy(
    eventSpaceId: string,
    policy: Partial<EventSpacePaymentPolicy>
  ): Promise<EventSpacePaymentPolicy> {
    try {
      const response = await apiService.post<EventSpacePaymentPolicy>(
        `/api/payment-policies/event-spaces/${eventSpaceId}/update`,
        policy
      );

      console.log('✅ Event space payment policy updated:', response);
      const data = (response as any)?.data || response;
      return (data || {}) as EventSpacePaymentPolicy;
    } catch (error) {
      console.error('❌ Erro ao atualizar política de event space:', error);
      throw error;
    }
  },

  /**
   * Formatar valor percentual
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  },

  /**
   * Formatar política para display
   */
  formatPolicyDisplay(policy: PaymentPolicyResponse): string[] {
    const lines: string[] = [];

    if ('deposit_percentage' in policy) {
      // Hotel policy
      const h = policy as HotelPaymentPolicy;
      if (h.deposit_enabled) {
        lines.push(
          `💰 Depósito: ${this.formatPercentage(h.deposit_percentage)}`
        );
      }
      if (h.advance_payment_enabled) {
        lines.push(
          `📅 Pagamento antecipado: ${this.formatPercentage(h.advance_payment_percentage)}`
        );
      }
      lines.push(`⏳ Pagamento final: ${h.final_payment_due_days} dias`);
    } else if ('driver_id' in policy && !('event_space_id' in policy)) {
      // Driver policy
      const d = policy as DriverPaymentPolicy;
      if (d.pay_at_location_enabled) {
        lines.push('📍 Pagamento no local disponível');
      }
      if (d.advance_payment_enabled) {
        lines.push(
          `📅 Pagamento antecipado: ${this.formatPercentage(d.advance_payment_percentage)}`
        );
      }
    } else {
      // Event space policy
      const e = policy as EventSpacePaymentPolicy;
      lines.push(
        `🔖 Antecipado: ${this.formatPercentage(e.advance_payment_percentage)}`
      );
      lines.push(`⏳ Pagamento final: ${e.final_payment_due_days} dias`);
      lines.push(`↩️ Reembolso total: até ${e.full_refund_until_days} dias`);
      lines.push(
        `↩️ Reembolso parcial: até ${e.partial_refund_until_days} dias`
      );
    }

    return lines;
  },
};

export default paymentPolicyService;
