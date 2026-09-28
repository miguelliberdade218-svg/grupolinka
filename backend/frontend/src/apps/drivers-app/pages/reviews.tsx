import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Star,
  MessageCircle,
  Flag,
  Trash2,
  Filter,
  ChevronDown,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface Review {
  id: string;
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
  rideType: 'shared' | 'private';
  response?: string;
  flagged: boolean;
}

interface DriverReviewsPageProps {
  driverId?: string;
  driverName?: string;
}

export default function DriverReviewsPage({
  driverId: _driverId = 'driver-123',
  driverName: _driverName = 'João Silva',
}: DriverReviewsPageProps) {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-001',
      passengerName: 'Maria Santos',
      rating: 5,
      comment: 'Motorista excelente! Carro limpo e seguro. Recomendo!',
      date: '25/01/2025',
      rideType: 'shared',
      flagged: false,
    },
    {
      id: 'rev-002',
      passengerName: 'Carlos Pereira',
      rating: 4,
      comment: 'Muito bom, mas poderia ter conversado menos 😄',
      date: '24/01/2025',
      rideType: 'private',
      flagged: false,
      response: 'Obrigado pelo feedback! Entendo, próximas vezes serei mais discreto! 😊',
    },
    {
      id: 'rev-003',
      passengerName: 'Ana Costa',
      rating: 5,
      comment: 'Perfeito! Chegou no horário, foi seguro e acelerador suave.',
      date: '23/01/2025',
      rideType: 'shared',
      flagged: false,
    },
    {
      id: 'rev-004',
      passengerName: 'Lucas Silva',
      rating: 3,
      comment: 'Levou um caminho mais longo. Precisa de GPS novo?',
      date: '22/01/2025',
      rideType: 'private',
      flagged: false,
    },
    {
      id: 'rev-005',
      passengerName: 'Julia Martins',
      rating: 2,
      comment: 'Dirigiu rápido demais e conversou muito. Não voltaria.',
      date: '20/01/2025',
      rideType: 'shared',
      flagged: true,
    },
  ]);

  const [filterRating, setFilterRating] = useState<'all' | number>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const filteredReviews = reviews.filter((rev) => {
    const ratingMatch = filterRating === 'all' || rev.rating === filterRating;
    const searchMatch =
      rev.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchTerm.toLowerCase());
    return ratingMatch && searchMatch;
  });

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const handleAddResponse = (id: string) => {
    if (responseText.trim()) {
      setReviews(
        reviews.map((r) =>
          r.id === id ? { ...r, response: responseText.trim() } : r
        )
      );
      setResponseText('');
      setRespondingTo(null);
    }
  };

  const handleDeleteReview = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
  };

  const handleFlagReview = (id: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === id ? { ...r, flagged: !r.flagged } : r
      )
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">⭐ Avaliações Recebidas</h2>
        <p className="text-gray-600 mt-2">Gerencie e responda às avaliações dos passageiros</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-1">
              {averageRating}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(parseFloat(averageRating))
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 text-sm">Nota Média</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {reviews.length}
            </p>
            <p className="text-gray-600 text-sm">Total de Avaliações</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">
              {reviews.filter((r) => r.rating >= 4).length}
            </p>
            <p className="text-gray-600 text-sm">Avaliações Positivas (4-5⭐)</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{rating}⭐</span>
                <span className="text-sm text-gray-600">
                  {ratingDistribution[rating as keyof typeof ratingDistribution]} ({Math.round((ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all"
                  style={{
                    width: `${
                      (ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Procure por nome ou comentário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterRating('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterRating === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterRating === rating
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}⭐
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card
              key={review.id}
              className={`cursor-pointer transition hover:shadow-lg ${
                review.flagged ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div
                  onClick={() =>
                    setExpandedId(expandedId === review.id ? null : review.id)
                  }
                >
                  {/* Main Row */}
                  <div className="flex gap-4">
                    {/* Left: Review Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">
                          {review.passengerName}
                        </h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {review.comment}
                      </p>

                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>{review.date}</span>
                        <span>•</span>
                        <span>
                          {review.rideType === 'shared'
                            ? '🚗 Carona Compartilhada'
                            : '🚘 Carona Privada'}
                        </span>
                        {review.flagged && (
                          <>
                            <span>•</span>
                            <span className="text-red-600">⚠️ Sinalizada</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Arrow */}
                    <div className="flex items-center flex-shrink-0">
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition ${
                          expandedId === review.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === review.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Response Section */}
                      {review.response ? (
                        <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            Sua Resposta:
                          </p>
                          <p className="text-sm text-green-800">{review.response}</p>
                        </div>
                      ) : respondingTo === review.id ? (
                        <div className="space-y-2 p-3 bg-blue-50 rounded">
                          <p className="text-sm font-semibold text-blue-900">
                            Responder a esta avaliação:
                          </p>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Digite sua resposta..."
                            className="w-full p-2 border rounded text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAddResponse(review.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Enviar Resposta
                            </Button>
                            <Button
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                              }}
                              size="sm"
                              variant="outline"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setRespondingTo(review.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Responder
                        </Button>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleFlagReview(review.id)}
                          variant="outline"
                          size="sm"
                          className={
                            review.flagged ? 'text-red-600 border-red-200' : ''
                          }
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          {review.flagged ? 'Sinalizada' : 'Sinalizar'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteReview(review.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhuma avaliação encontrada</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">💡 Dicas para Melhorar</CardTitle>
        </CardHeader>
        <CardContent className="text-green-900 space-y-2 text-sm">
          <p>✓ Responda sempre às avaliações (boas e ruins)</p>
          <p>✓ Agradeça feedback positivos</p>
          <p>✓ Ofereça solução para críticas construtivas</p>
          <p>✓ Mantenha seu carro limpo e bem mantido</p>
          <p>✓ Dirija com segurança e respeito pelas regras</p>
        </CardContent>
      </Card>
    </div>
  );
}
