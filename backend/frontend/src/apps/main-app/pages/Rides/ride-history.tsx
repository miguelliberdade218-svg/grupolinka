import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { MapPin, Clock, DollarSign, Star, Download, ChevronDown } from 'lucide-react';

interface Ride {
  id: string;
  driverName: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  time: string;
  duration: string;
  distance: string;
  price: number;
  rating: number;
  driverRating: number;
  status: 'completed' | 'cancelled' | 'no-show';
  hasReview: boolean;
}

interface RideHistoryPageProps {
  userId?: string;
  onReviewRide?: (rideId: string) => void;
  onContactSupport?: (rideId: string) => void;
}

export default function RideHistoryPage({
  userId = 'user-123',
  onReviewRide,
  onContactSupport,
}: RideHistoryPageProps) {
  const [rides, setRides] = useState<Ride[]>([
    {
      id: 'ride-001',
      driverName: 'João Silva',
      fromLocation: 'Av. Paulista, São Paulo',
      toLocation: 'Estação Luz, São Paulo',
      date: '25/01/2025',
      time: '14:30',
      duration: '25 min',
      distance: '8.5 km',
      price: 32.50,
      rating: 5,
      driverRating: 4.8,
      status: 'completed',
      hasReview: true,
    },
    {
      id: 'ride-002',
      driverName: 'Maria Santos',
      fromLocation: 'Shopping Pinheiros, São Paulo',
      toLocation: 'Aeroporto de Congonhas, São Paulo',
      date: '24/01/2025',
      time: '18:45',
      duration: '45 min',
      distance: '25.0 km',
      price: 78.90,
      rating: 4,
      driverRating: 4.9,
      status: 'completed',
      hasReview: true,
    },
    {
      id: 'ride-003',
      driverName: 'Carlos Pereira',
      fromLocation: 'Rua Consolidação, São Paulo',
      toLocation: 'Av. Brasil, São Paulo',
      date: '23/01/2025',
      time: '10:15',
      duration: '12 min',
      distance: '4.2 km',
      price: 15.50,
      rating: 0,
      driverRating: 4.6,
      status: 'completed',
      hasReview: false,
    },
    {
      id: 'ride-004',
      driverName: 'Ana Costa',
      fromLocation: 'Estação Luz, São Paulo',
      toLocation: 'Estação Bras, São Paulo',
      date: '22/01/2025',
      time: '08:30',
      duration: '8 min',
      distance: '2.1 km',
      price: 12.00,
      rating: 3,
      driverRating: 4.7,
      status: 'completed',
      hasReview: false,
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled' | 'no-show'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  const filteredRides = rides.filter((ride) => {
    const statusMatch = filterStatus === 'all' || ride.status === filterStatus;
    const searchMatch =
      ride.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.toLocation.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const totalRides = rides.length;
  const totalSpent = rides.reduce((sum, ride) => sum + ride.price, 0);
  const averageRating = (rides.reduce((sum, ride) => sum + ride.rating, 0) / rides.length).toFixed(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Histórico de Corridas</h2>
        <p className="text-gray-600 mt-2">Suas corridas e avaliações</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Total de Corridas</p>
              <p className="text-3xl font-bold text-gray-900">{totalRides}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Gasto Total</p>
              <p className="text-3xl font-bold text-green-600">
                R$ {totalSpent.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Avaliação Média</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Avaliações Feitas</p>
              <p className="text-3xl font-bold text-blue-600">
                {rides.filter((r) => r.hasReview).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Corridas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Procure por motorista ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'completed', 'cancelled', 'no-show'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all'
                  ? 'Todas'
                  : status === 'completed'
                    ? 'Concluídas'
                    : status === 'cancelled'
                      ? 'Canceladas'
                      : 'Não Apareceu'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rides List */}
      <div className="space-y-3">
        {filteredRides.length > 0 ? (
          filteredRides.map((ride) => (
            <Card
              key={ride.id}
              className={`cursor-pointer transition hover:shadow-lg ${
                expandedRide === ride.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div
                  onClick={() =>
                    setExpandedRide(expandedRide === ride.id ? null : ride.id)
                  }
                >
                  {/* Main Row */}
                  <div className="flex gap-4">
                    {/* Left: Location Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {ride.driverName}
                        </h3>
                        <div className="text-sm font-semibold text-green-600 flex-shrink-0">
                          R$ {ride.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-1 mb-2">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{ride.fromLocation}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 text-red-600" />
                          <span className="truncate">{ride.toLocation}</span>
                        </p>
                      </div>

                      <div className="flex gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ride.date} {ride.time}
                        </span>
                        <span>{ride.duration}</span>
                        <span>{ride.distance}</span>
                      </div>
                    </div>

                    {/* Right: Rating and Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {ride.hasReview && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-700">
                            {ride.rating}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition ${
                          expandedRide === ride.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRide === ride.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Duração</p>
                          <p className="font-semibold text-gray-900">{ride.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Distância</p>
                          <p className="font-semibold text-gray-900">{ride.distance}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avaliação do Motorista</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-900">
                              {ride.driverRating}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Seu Feedback</p>
                          <p className="font-semibold text-gray-900">
                            {ride.hasReview ? `${ride.rating}⭐` : 'Não avaliado'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!ride.hasReview ? (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReviewRide?.(ride.id);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            ✏️ Avaliar Corrida
                          </Button>
                        ) : (
                          <Button variant="outline" className="flex-1" disabled>
                            ✓ Corrida Avaliada
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onContactSupport?.(ride.id);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          💬 Contatar Suporte
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
                <p className="text-gray-600 mb-4">Nenhuma corrida encontrada</p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Procurar Corridas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Button */}
      {filteredRides.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <Button className="w-full bg-gray-700 hover:bg-gray-800">
              <Download className="w-4 h-4 mr-2" />
              Exportar Histórico (PDF)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Dicas</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p>• Avalie seus motoristas para ajudar a comunidade</p>
          <p>• Guarde seus comprovantes de corrida para referência</p>
          <p>• Você pode filtrar corridas por status e data</p>
          <p>• Entre em contato conosco se tiver problemas</p>
        </CardContent>
      </Card>
    </div>
  );
}
