// src/components/RideReviewForm.tsx
// Componente para submeter reviews de rides (Passageiro → Motorista ou Motorista → Passageiro)

import React, { useState } from 'react';
import rideReviewService, { PassengerReviewData, DriverReviewData } from '@/services/rideReviewService';
import './RideReviewForm.css';

interface RideReviewFormProps {
  rideId: string;
  currentUserId: string;
  targetUserId: string;
  reviewType: 'passenger' | 'driver'; // passenger = customer reviewing driver, driver = driver reviewing passenger
  targetName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RideReviewForm: React.FC<RideReviewFormProps> = ({
  rideId,
  currentUserId,
  targetUserId,
  reviewType,
  targetName,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mainRating: 0,
    driverRating: 0,
    cleanlinessRating: 0,
    communicationRating: 0,
    vehicleConditionRating: 0,
    routeQualityRating: 0,
    safetyRating: 0,
    passengerBehaviorRating: 0,
    paymentBehaviorRating: 0,
    punctualityRating: 0,
    title: '',
    comment: '',
    pros: '',
    cons: '',
  });

  const handleRatingChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (reviewType === 'passenger') {
        const reviewData: PassengerReviewData = {
          ride_id: rideId,
          from_user_id: currentUserId,
          to_user_id: targetUserId,
          driver_rating: formData.driverRating || formData.mainRating,
          cleanliness_rating: formData.cleanlinessRating,
          communication_rating: formData.communicationRating,
          vehicle_condition_rating: formData.vehicleConditionRating,
          route_quality_rating: formData.routeQualityRating,
          safety_rating: formData.safetyRating,
          title: formData.title,
          comment: formData.comment,
          pros: formData.pros,
          cons: formData.cons,
        };
        await rideReviewService.createPassengerReview(reviewData);
      } else {
        const reviewData: DriverReviewData = {
          ride_id: rideId,
          from_driver_id: currentUserId,
          to_passenger_id: targetUserId,
          passenger_behavior_rating: formData.passengerBehaviorRating || formData.mainRating,
          cleanliness_rating: formData.cleanlinessRating,
          communication_rating: formData.communicationRating,
          payment_behavior_rating: formData.paymentBehaviorRating,
          punctuality_rating: formData.punctualityRating,
          title: formData.title,
          comment: formData.comment,
        };
        await rideReviewService.createDriverReview(reviewData);
      }

      alert('✅ Review submetido com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter review');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (label: string, field: string, max = 5) => (
    <div className="rating-group">
      <label>{label}</label>
      <div className="stars">
        {Array.from({ length: max }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`star ${(formData[field as keyof typeof formData] as number) > i ? 'active' : ''}`}
            onClick={() => handleRatingChange(field, i + 1)}
            aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rating-value">
        {formData[field as keyof typeof formData]}/5
      </span>
    </div>
  );

  return (
    <div className="ride-review-form">
      <div className="form-header">
        <h3>Avaliar {targetName}</h3>
        <p>{reviewType === 'passenger' ? 'Compartilhe sua experiência com o motorista' : 'Avalie este passageiro'}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Passenger Review (customer rating driver) */}
        {reviewType === 'passenger' && (
          <>
            {renderStarRating('Avaliação geral do motorista', 'driverRating')}
            {renderStarRating('Limpeza do veículo', 'cleanlinessRating')}
            {renderStarRating('Comunicação', 'communicationRating')}
            {renderStarRating('Condição do veículo', 'vehicleConditionRating')}
            {renderStarRating('Qualidade da rota', 'routeQualityRating')}
            {renderStarRating('Segurança', 'safetyRating')}
          </>
        )}

        {/* Driver Review (driver rating passenger) */}
        {reviewType === 'driver' && (
          <>
            {renderStarRating('Comportamento do passageiro', 'passengerBehaviorRating')}
            {renderStarRating('Limpeza', 'cleanlinessRating')}
            {renderStarRating('Comunicação', 'communicationRating')}
            {renderStarRating('Pagamento', 'paymentBehaviorRating')}
            {renderStarRating('Pontualidade', 'punctualityRating')}
          </>
        )}

        <div className="form-group">
          <label htmlFor="title">Título (opcional)</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Ex: Motorista excelente!"
            value={formData.title}
            onChange={handleTextChange}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comentário *</label>
          <textarea
            id="comment"
            name="comment"
            placeholder="Compartilhe detalhes sobre sua experiência..."
            value={formData.comment}
            onChange={handleTextChange}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
          />
          <small>{formData.comment.length}/1000</small>
        </div>

        {reviewType === 'passenger' && (
          <>
            <div className="form-group">
              <label htmlFor="pros">O que você gostou (opcional)</label>
              <textarea
                id="pros"
                name="pros"
                placeholder="Ex: Motorista amável e pontual"
                value={formData.pros}
                onChange={handleTextChange}
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cons">Pontos de melhoria (opcional)</label>
              <textarea
                id="cons"
                name="cons"
                placeholder="Ex: Veículo poderia estar mais limpo"
                value={formData.cons}
                onChange={handleTextChange}
                maxLength={500}
                rows={2}
              />
            </div>
          </>
        )}

        <div className="form-buttons">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !formData.comment}
          >
            {loading ? 'Enviando...' : 'Enviar Review'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default RideReviewForm;
