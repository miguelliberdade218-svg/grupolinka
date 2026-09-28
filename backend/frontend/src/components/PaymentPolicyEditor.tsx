import React, { useState, useEffect } from 'react';
import { paymentPolicyService } from '@/services/paymentPolicyService';
import './PaymentPolicyEditor.css';

interface PolicyEditorProps {
  providerId: string;
  providerType: 'hotel' | 'driver' | 'event_space';
  providerName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentPolicyEditor: React.FC<PolicyEditorProps> = ({
  providerId,
  providerType,
  providerName = 'Fornecedor',
  onSuccess,
  onCancel
}) => {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPolicy();
  }, [providerId, providerType]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      let currentPolicy = null;

      if (providerType === 'hotel') {
        currentPolicy = await paymentPolicyService.getHotelPolicy(providerId);
      } else if (providerType === 'driver') {
        currentPolicy = await paymentPolicyService.getDriverPolicy(providerId);
      } else if (providerType === 'event_space') {
        currentPolicy = await paymentPolicyService.getEventSpacePolicy(providerId);
      }

      setPolicy(currentPolicy);
    } catch (err) {
      console.error('Error loading policy:', err);
      setError('Erro ao carregar política de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setPolicy((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (providerType === 'hotel') {
        await paymentPolicyService.updateHotelPolicy(providerId, policy);
      } else if (providerType === 'driver') {
        await paymentPolicyService.updateDriverPolicy(providerId, policy);
      } else if (providerType === 'event_space') {
        await paymentPolicyService.updateEventSpacePolicy(providerId, policy);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      console.error('Error saving policy:', err);
      setError('Erro ao salvar política de pagamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="policy-editor loading">Carregando política...</div>;
  }

  if (!policy) {
    return <div className="policy-editor error">Erro ao carregar política</div>;
  }

  return (
    <div className="policy-editor">
      <div className="editor-header">
        <h3>Editar Política de Pagamento</h3>
        <p className="provider-name">{providerName}</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Política salva com sucesso!</div>}

      <form onSubmit={handleSubmit}>
        {providerType === 'hotel' && (
          <div className="form-sections">
            <div className="form-section">
              <h4>Configurações de Depósito</h4>
              
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={policy.deposit_enabled || false}
                  onChange={(e) => handleChange('deposit_enabled', e.target.checked)}
                />
                Habilitar Depósito
              </label>

              {policy.deposit_enabled && (
                <div className="form-group indent">
                  <label htmlFor="deposit-pct">Percentual de Depósito (%)</label>
                  <input
                    id="deposit-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={policy.deposit_percentage || 30}
                    onChange={(e) => handleChange('deposit_percentage', parseInt(e.target.value))}
                    className="input-number"
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Configurações de Pagamento Antecipado</h4>
              
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={policy.advance_payment_enabled || false}
                  onChange={(e) => handleChange('advance_payment_enabled', e.target.checked)}
                />
                Habilitar Pagamento Antecipado
              </label>

              {policy.advance_payment_enabled && (
                <div className="form-group indent">
                  <label htmlFor="advance-pct">Percentual Antecipado (%)</label>
                  <input
                    id="advance-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={policy.advance_payment_percentage || 0}
                    onChange={(e) => handleChange('advance_payment_percentage', parseInt(e.target.value))}
                    className="input-number"
                  />
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Configurações de Pagamento Final</h4>
              
              <div className="form-group">
                <label htmlFor="final-days">Dias para Pagamento Final</label>
                <input
                  id="final-days"
                  type="number"
                  min="1"
                  max="90"
                  value={policy.final_payment_due_days || 7}
                  onChange={(e) => handleChange('final_payment_due_days', parseInt(e.target.value))}
                  className="input-number"
                />
              </div>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={policy.pay_at_location_enabled || false}
                  onChange={(e) => handleChange('pay_at_location_enabled', e.target.checked)}
                />
                Permitir Pagamento no Local
              </label>
            </div>
          </div>
        )}

        {providerType === 'driver' && (
          <div className="form-sections">
            <div className="form-section">
              <h4>Métodos de Pagamento</h4>

              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={policy.pay_at_location_enabled || false}
                  onChange={(e) => handleChange('pay_at_location_enabled', e.target.checked)}
                />
                Permitir Pagamento no Local
              </label>

              <label className="form-checkbox indent-checkbox">
                <input
                  type="checkbox"
                  checked={policy.advance_payment_enabled || false}
                  onChange={(e) => handleChange('advance_payment_enabled', e.target.checked)}
                />
                Permitir Pagamento Antecipado
              </label>

              {policy.advance_payment_enabled && (
                <div className="form-group indent">
                  <label htmlFor="driver-advance-pct">Percentual Antecipado (%)</label>
                  <input
                    id="driver-advance-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={policy.advance_payment_percentage || 0}
                    onChange={(e) => handleChange('advance_payment_percentage', parseInt(e.target.value))}
                    className="input-number"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {providerType === 'event_space' && (
          <div className="form-sections">
            <div className="form-section">
              <h4>Pagamento Antecipado</h4>
              
              <div className="form-group">
                <label htmlFor="event-advance-pct">Percentual Antecipado (%)</label>
                <input
                  id="event-advance-pct"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={policy.advance_payment_percentage || 50}
                  onChange={(e) => handleChange('advance_payment_percentage', parseInt(e.target.value))}
                  className="input-number"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Pagamento Final</h4>

              <div className="form-group">
                <label htmlFor="event-final-days">Dias para Pagamento Final</label>
                <input
                  id="event-final-days"
                  type="number"
                  min="1"
                  max="60"
                  value={policy.final_payment_due_days || 14}
                  onChange={(e) => handleChange('final_payment_due_days', parseInt(e.target.value))}
                  className="input-number"
                />
              </div>
            </div>

            <div className="form-section">
              <h4>Política de Reembolso</h4>

              <div className="form-group">
                <label htmlFor="full-refund-days">Reembolso 100% até (dias antes)</label>
                <input
                  id="full-refund-days"
                  type="number"
                  min="1"
                  max="90"
                  value={policy.full_refund_until_days || 30}
                  onChange={(e) => handleChange('full_refund_until_days', parseInt(e.target.value))}
                  className="input-number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="partial-refund-days">Reembolso 50% até (dias antes)</label>
                <input
                  id="partial-refund-days"
                  type="number"
                  min="1"
                  max="60"
                  value={policy.partial_refund_until_days || 14}
                  onChange={(e) => handleChange('partial_refund_until_days', parseInt(e.target.value))}
                  className="input-number"
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentPolicyEditor;
