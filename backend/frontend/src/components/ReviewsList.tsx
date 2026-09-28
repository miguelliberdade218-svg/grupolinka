import React, { useState, useEffect } from 'react';
import rideReviewService from '@/services/rideReviewService';
import { formatDateOnly } from '@/utils/dateFormatter';
import './ReviewsList.css';

interface Review {
  id: string;
  from_user_id: string;
  to_user_id: string;
  driver_rating?: number;
  passenger_behavior_rating?: number;
  comment: string;
  created_at: string;
  type: 'passenger' | 'driver';
  reviewer_name: string;
  target_name: string;
}

interface ReviewsListProps {
  filterType?: 'driver' | 'passenger' | 'all';
  minRating?: number;
  maxResults?: number;
  userId?: string;
  onReviewSelect?: (review: Review) => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  filterType = 'all',
  minRating = 0,
  maxResults = 20,
  userId,
  onReviewSelect
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'rating-low'>('recent');

  useEffect(() => {
    loadReviews();
  }, [filterType, userId, page, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      let allReviews: Review[] = [];

      // Load from backend based on filter
      if (filterType === 'driver' || filterType === 'all') {
        if (userId) {
          const driverReviews = await rideReviewService.getDriverReviews(userId, maxResults);
          const mapped = (Array.isArray(driverReviews) ? driverReviews : []).map((r: any) => ({
            id: r.id || '',
            from_user_id: r.from_user_id || '',
            to_user_id: r.to_user_id || '',
            driver_rating: r.driver_rating || r.overall_rating || 0,
            passenger_behavior_rating: undefined,
            comment: r.comment || '',
            created_at: r.created_at || new Date().toISOString(),
            type: 'passenger' as const,
            reviewer_name: 'Passageiro',
            target_name: 'Motorista'
          }));
          allReviews = allReviews.concat(mapped);
        }
      }

      if (filterType === 'passenger' || filterType === 'all') {
        if (userId) {
          const passengerReviews = await rideReviewService.getPassengerReviews(userId, maxResults);
          const mapped = (Array.isArray(passengerReviews) ? passengerReviews : []).map((r: any) => ({
            id: r.id || '',
            from_user_id: r.from_user_id || '',
            to_user_id: r.to_user_id || '',
            driver_rating: undefined,
            passenger_behavior_rating: r.passenger_behavior_rating || 0,
            comment: r.comment || '',
            created_at: r.created_at || new Date().toISOString(),
            type: 'driver' as const,
            reviewer_name: 'Motorista',
            target_name: 'Passageiro'
          }));
          allReviews = allReviews.concat(mapped);
        }
      }

      // Sort
      if (sortBy === 'recent') {
        allReviews.sort((a: Review, b: Review) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'rating') {
        allReviews.sort((a: Review, b: Review) => {
          const ratingA = a.driver_rating || a.passenger_behavior_rating || 0;
          const ratingB = b.driver_rating || b.passenger_behavior_rating || 0;
          return ratingB - ratingA;
        });
      } else if (sortBy === 'rating-low') {
        allReviews.sort((a: Review, b: Review) => {
          const ratingA = a.driver_rating || a.passenger_behavior_rating || 0;
          const ratingB = b.driver_rating || b.passenger_behavior_rating || 0;
          return ratingA - ratingB;
        });
      }

      // Filter by minimum rating
      allReviews = allReviews.filter((r: Review) => {
        const rating = r.driver_rating || r.passenger_behavior_rating || 0;
        return rating >= minRating;
      });

      setReviews(allReviews.slice(0, maxResults));
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };
  };

  if (loading) {
    return <div className="reviews-list loading">Carregando avaliações...</div>;
  }

  if (error) {
    return <div className="reviews-list error">{error}</div>;
  }

  if (reviews.length === 0) {
    return <div className="reviews-list empty">Nenhuma avaliação encontrada</div>;
  }

  return (
    <div className="reviews-list">
      <div className="reviews-controls">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating' | 'rating-low')}
          className="sort-select"
        >
          <option value="recent">Mais recentes</option>
          <option value="rating">Melhor avaliadas</option>
          <option value="rating-low">Piores avaliadas</option>
        </select>

        {filterType === 'all' && (
          <div className="filter-info">
            Mostrando {reviews.length} de {reviews.length} avaliações
          </div>
        )}
      </div>

      <div className="reviews-grid">
        {reviews.map((review) => {
          const rating = review.driver_rating || review.passenger_behavior_rating || 0;
          const qualityClass = rating >= 4.5 ? 'excellent' : 
                              rating >= 4.0 ? 'very-good' :
                              rating >= 3.0 ? 'good' :
                              rating >= 2.0 ? 'fair' : 'poor';

          return (
            <div
              key={review.id}
              className={`review-card ${qualityClass}`}
              onClick={() => onReviewSelect?.(review)}
            >
              <div className="review-header">
                <div className="review-rating">
                  <span className="stars">{renderStars(rating)}</span>
                  <span className="rating-number">{rating.toFixed(1)}</span>
                </div>
                <div className="review-type-badge">{review.type === 'passenger' ? '👤 Passageiro' : '🚗 Motorista'}</div>
              </div>

              <div className="review-meta">
                <p className="reviewer-name">{review.reviewer_name} → {review.target_name}</p>
                <p className="review-date">{formatDate(review.created_at)}</p>
              </div>

              <p className="review-comment">{review.comment.substring(0, 150)}...</p>

              <div className="review-footer">
                <button className="review-action-btn">Ver Detalhes</button>
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length >= maxResults && (
        <div className="reviews-pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Anterior
          </button>
          <span>Página {page}</span>
          <button onClick={() => setPage(page + 1)}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
