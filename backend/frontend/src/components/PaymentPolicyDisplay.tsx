// src/components/PaymentPolicyDisplay.tsx
// Componente para exibir políticas de pagamento

import React, { useState, useEffect } from 'react';
import paymentPolicyService, { PaymentPolicyResponse } from '@/services/paymentPolicyService';
import './PaymentPolicyDisplay.css';

interface PaymentPolicyDisplayProps {
  providerId: string;
  providerType: 'hotel' | 'driver' | 'event_space';
  providerName?: string;
  compact?: boolean;
}

export const PaymentPolicyDisplay: React.FC<PaymentPolicyDisplayProps> = ({
  providerId,
  providerType,
  providerName = 'Fornecedor',
  compact = false,
}) => {
  const [policy, setPolicy] = useState<PaymentPolicyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPolicy();
  }, [providerId, providerType]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      let policyData;

      switch (providerType) {
        case 'hotel':
          policyData = await paymentPolicyService.getHotelPolicy(providerId);
          break;
        case 'driver':
          policyData = await paymentPolicyService.getDriverPolicy(providerId);
          break;
        case 'event_space':
          policyData = await paymentPolicyService.getEventSpacePolicy(providerId);
          break;
        default:
          throw new Error('Invalid provider type');
      }

      setPolicy(policyData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar política de pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="payment-policy loading">Carregando política de pagamento...</div>;
  }

  if (error) {
    return <div className="payment-policy error">{error}</div>;
  }

  if (!policy) {
    return <div className="payment-policy no-policy">Sem política definida</div>;
  }

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  if (compact) {
    return (
      <div className="payment-policy compact">
        <div className="policy-badges">
          {providerType === 'hotel' && 'deposit_percentage' in policy && (
            <>
              {policy.deposit_enabled && (
                <span className="badge deposit">💰 Depósito {formatPercentage(policy.deposit_percentage)}</span>
              )}
              {policy.advance_payment_enabled && (
                <span className="badge advance">📅 Antecipado {formatPercentage(policy.advance_payment_percentage)}</span>
              )}
              {policy.pay_at_location_enabled && (
                <span className="badge location">📍 No Local</span>
              )}
            </>
          )}

          {providerType === 'driver' && 'driver_id' in policy && !('event_space_id' in policy) && (
            <>
              {policy.pay_at_location_enabled && (
                <span className="badge location">📍 No Local</span>
              )}
              {policy.advance_payment_enabled && (
                <span className="badge advance">📅 Antecipado {formatPercentage(policy.advance_payment_percentage)}</span>
              )}
            </>
          )}

          {providerType === 'event_space' && 'event_space_id' in policy && (
            <>
              <span className="badge advance">🔖 {formatPercentage(policy.advance_payment_percentage)} Antecipado</span>
              <span className="badge refund">↩️ Reembolso até {policy.full_refund_until_days}d</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="payment-policy detailed">
      <div className="policy-header">
        <h4>Política de Pagamento</h4>
        <p>{providerName}</p>
      </div>

      <div className="policy-content">
        {providerType === 'hotel' && 'deposit_percentage' in policy && (
          <div className="policy-section">
            <div className="policy-item">
              <span className="label">Depósito:</span>
              <span className="value">
                {policy.deposit_enabled
                  ? `${formatPercentage(policy.deposit_percentage)} (obrigatório)`
                  : 'Não utilizado'}
              </span>
            </div>

            {policy.advance_payment_enabled && (
              <div className="policy-item">
                <span className="label">Pagamento Antecipado:</span>
                <span className="value">{formatPercentage(policy.advance_payment_percentage)}</span>
              </div>
            )}

            <div className="policy-item">
              <span className="label">Pagamento Final:</span>
              <span className="value">{policy.final_payment_due_days} dias antes do check-in</span>
            </div>

            <div className="policy-item">
              <span className="label">Pagamento no Local:</span>
              <span className="value">{policy.pay_at_location_enabled ? 'Aceito' : 'Não aceito'}</span>
            </div>
          </div>
        )}

        {providerType === 'driver' && 'driver_id' in policy && !('event_space_id' in policy) && (
          <div className="policy-section">
            <div className="policy-item">
              <span className="label">Pagamento no Local:</span>
              <span className="value">{policy.pay_at_location_enabled ? 'Aceito' : 'Não aceito'}</span>
            </div>

            {policy.advance_payment_enabled && (
              <div className="policy-item">
                <span className="label">Pagamento Antecipado:</span>
                <span className="value">{formatPercentage(policy.advance_payment_percentage)}</span>
              </div>
            )}
          </div>
        )}

        {providerType === 'event_space' && 'event_space_id' in policy && (
          <div className="policy-section">
            <div className="policy-item">
              <span className="label">Depósito Obrigatório:</span>
              <span className="value">{formatPercentage(policy.advance_payment_percentage)}</span>
            </div>

            <div className="policy-item">
              <span className="label">Pagamento Final:</span>
              <span className="value">{policy.final_payment_due_days} dias antes do evento</span>
            </div>

            <div className="policy-subsection">
              <p className="subsection-title">Política de Reembolso:</p>
              <ul className="refund-terms">
                <li>
                  <strong>100% reembolso</strong> até {policy.full_refund_until_days} dias antes
                </li>
                <li>
                  <strong>50% reembolso</strong> até {policy.partial_refund_until_days} dias antes
                </li>
                <li>
                  <strong>Sem reembolso</strong> menos de {policy.partial_refund_until_days} dias antes
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="policy-footer">
        <p className="disclaimer">
          ℹ️ Verifique com o {providerType === 'event_space' ? 'local' : providerType === 'hotel' ? 'hotel' : 'motorista'} os termos exatos de pagamento
        </p>
      </div>
    </div>
  );
};

export default PaymentPolicyDisplay;
