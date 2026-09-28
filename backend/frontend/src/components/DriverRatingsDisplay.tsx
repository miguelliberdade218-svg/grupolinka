// src/components/DriverRatingsDisplay.tsx
// Componente para exibir ratings e reviews do motorista

import React, { useState, useEffect } from 'react';
import rideReviewService from '@/services/rideReviewService';
import './DriverRatingsDisplay.css';

interface DriverRatingsDisplayProps {
  driverId: string;
  driverName?: string;
  compact?: boolean;
}

interface DriverStats {
  totalReviews: number;
  averageRating: number;
  byRating: { [key: number]: number };
}

export const DriverRatingsDisplay: React.FC<DriverRatingsDisplayProps> = ({
  driverId,
  driverName = 'Motorista',
  compact = false,
}) => {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [driverId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, reviewsData] = await Promise.all([
        rideReviewService.getDriverStats(driverId),
        rideReviewService.getDriverReviews(driverId, 5),
      ]);

      setStats(statsData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let result = '★'.repeat(fullStars);
    if (hasHalf) result += '½';
    result += '☆'.repeat(5 - Math.ceil(rating));
    return result;
  };

  const getQualityClass = (rating: number) => {
    if (rating >= 4.8) return 'excellent';
    if (rating >= 4.0) return 'very-good';
    if (rating >= 3.0) return 'good';
    if (rating >= 2.0) return 'fair';
    return 'poor';
  };

  if (loading) {
    return <div className="driver-ratings loading">Carregando ratings...</div>;
  }

  if (error) {
    return <div className="driver-ratings error">{error}</div>;
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="driver-ratings no-reviews">
        <p>Ainda sem reviews</p>
      </div>
    );
  }

  if (compact) {
    // Display compacto para listagens
    return (
      <div className={`driver-ratings compact ${getQualityClass(stats.averageRating)}`}>
        <div className="rating-badge">
          <span className="stars">{renderStars(stats.averageRating)}</span>
          <span className="number">{stats.averageRating.toFixed(1)}</span>
          <span className="count">({stats.totalReviews})</span>
        </div>
      </div>
    );
  }

  // Display completo
  return (
    <div className={`driver-ratings detailed ${getQualityClass(stats.averageRating)}`}>
      <div className="rating-summary">
        <div className="rating-main">
          <div className="rating-badge-large">
            <span className="stars-large">{renderStars(stats.averageRating)}</span>
            <span className="number-large">{stats.averageRating.toFixed(1)}</span>
          </div>
          <div className="rating-info">
            <h4>{driverName}</h4>
            <p className="total-reviews">{stats.totalReviews} avaliações</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="distribution-row">
              <span className="star-label">{stars} ★</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${(((stats.byRating[stars] || 0) / stats.totalReviews) * 100) || 0}%`,
                  }}
                />
              </div>
              <span className="count">{stats.byRating[stars] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="recent-reviews">
          <h5>Avaliações Recentes</h5>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="review-stars">{renderStars(parseFloat(review.overall_rating))}</span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString('pt-PT')}
                  </span>
                </div>
                {review.title && <p className="review-title">{review.title}</p>}
                <p className="review-comment">{review.comment}</p>
                {review.is_verified && (
                  <span className="verified-badge">✓ Verificado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRatingsDisplay;
