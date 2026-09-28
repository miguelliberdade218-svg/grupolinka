import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Navigation, Clock, Users, DollarSign, Star, AlertCircle } from 'lucide-react';

interface RideLocation {
  id: string;
  driverName: string;
  rating: number;
  reviews: number;
  location: string;
  distance: string;
  eta: string;
  pricePerSeat: number;
  availableSeats: number;
  vehicleType: string;
  departureTime: string;
  passengers: number;
}

interface RideMapPageProps {
  fromLocation?: string;
  toLocation?: string;
  passengers?: number;
  onSelectRide?: (rideId: string) => void;
}

export default function RideMapPage({
  fromLocation = 'Av. Paulista, São Paulo',
  toLocation = 'Estação Luz, São Paulo',
  passengers = 1,
  onSelectRide,
}: RideMapPageProps) {
  const [rides, setRides] = useState<RideLocation[]>([]);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'nearest' | 'cheapest' | 'highest-rated'>('nearest');

  // Simulate loading rides
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockRides: RideLocation[] = [
        {
          id: 'ride-001',
          driverName: 'João Silva',
          rating: 4.8,
          reviews: 234,
          location: 'Rua Oscar Freire, 500m',
          distance: '0.5 km',
          eta: '5 min',
          pricePerSeat: 32.50,
          availableSeats: 3,
          vehicleType: 'Honda Fit',
          departureTime: '14:30',
          passengers: 2,
        },
        {
          id: 'ride-002',
          driverName: 'Maria Santos',
          rating: 4.9,
          reviews: 456,
          location: 'Av. Brasil, 800m',
          distance: '0.8 km',
          eta: '8 min',
          pricePerSeat: 28.00,
          availableSeats: 2,
          vehicleType: 'Toyota Corolla',
          departureTime: '14:35',
          passengers: 1,
        },
        {
          id: 'ride-003',
          driverName: 'Carlos Pereira',
          rating: 4.6,
          reviews: 189,
          location: 'Rua Consolidação, 1.2km',
          distance: '1.2 km',
          eta: '12 min',
          pricePerSeat: 25.00,
          availableSeats: 4,
          vehicleType: 'Volkswagen Up',
          departureTime: '14:40',
          passengers: 3,
        },
        {
          id: 'ride-004',
          driverName: 'Ana Costa',
          rating: 4.7,
          reviews: 312,
          location: 'Av. Rebouças, 600m',
          distance: '0.6 km',
          eta: '7 min',
          pricePerSeat: 35.00,
          availableSeats: 2,
          vehicleType: 'Hyundai HB20',
          departureTime: '14:32',
          passengers: 1,
        },
      ];

      // Sort based on selection
      let sorted = [...mockRides];
      if (sortBy === 'nearest') {
        sorted.sort((a, b) => {
          const distA = parseFloat(a.distance);
          const distB = parseFloat(b.distance);
          return distA - distB;
        });
      } else if (sortBy === 'cheapest') {
        sorted.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
      } else if (sortBy === 'highest-rated') {
        sorted.sort((a, b) => b.rating - a.rating);
      }

      setRides(sorted);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sortBy]);

  const handleSelectRide = (rideId: string) => {
    setSelectedRide(rideId);
    onSelectRide?.(rideId);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Corridas Disponíveis</h2>
        <p className="text-gray-600 mt-2">
          De: <strong>{fromLocation}</strong> → <strong>{toLocation}</strong> ({passengers}{' '}
          {passengers === 1 ? 'passageiro' : 'passageiros'})
        </p>
      </div>

      {/* Sort Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setSortBy('nearest')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                sortBy === 'nearest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📍 Mais Próximo
            </button>
            <button
              onClick={() => setSortBy('cheapest')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                sortBy === 'cheapest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 Mais Barato
            </button>
            <button
              onClick={() => setSortBy('highest-rated')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                sortBy === 'highest-rated'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⭐ Melhor Avaliação
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              <p className="text-gray-600">Procurando corridas próximas...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rides List */}
      {!loading && rides.length > 0 && (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card
              key={ride.id}
              className={`cursor-pointer transition hover:shadow-lg ${
                selectedRide === ride.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleSelectRide(ride.id)}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Driver Avatar Placeholder */}
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-gray-700 font-bold">
                      {ride.driverName.charAt(0)}
                    </span>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {ride.driverName}
                      </h3>
                      <div className="text-sm font-semibold text-green-600 flex-shrink-0">
                        R$ {(ride.pricePerSeat * passengers).toFixed(2)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{ride.rating.toFixed(1)}</span>
                        <span className="text-gray-600">({ride.reviews} avaliações)</span>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <p className="text-sm text-gray-600 mb-2">
                      {ride.vehicleType} • {ride.passengers > 1 ? `${ride.passengers} passageiros` : '1 passageiro'} já viajando
                    </p>

                    {/* Location and ETA */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Navigation className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{ride.location}</span>
                      <span className="text-gray-600">•</span>
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-700">{ride.eta}</span>
                    </div>

                    {/* Seats Available */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        {ride.availableSeats} vagas disponíveis
                      </span>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <div className="flex items-center flex-shrink-0">
                    <span className="text-2xl text-gray-400">›</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && rides.length === 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Nenhuma corrida encontrada
                </h3>
                <p className="text-gray-600">
                  Tente alterar seu horário, data ou endereços
                </p>
              </div>
              <Button className="bg-amber-600 hover:bg-amber-700">
                Voltar para Busca
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Ride Details */}
      {selectedRide && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Corrida Selecionada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rides
                .filter((r) => r.id === selectedRide)
                .map((ride) => (
                  <div key={ride.id} className="space-y-2">
                    <p>
                      <strong>{ride.driverName}</strong> - {ride.vehicleType}
                    </p>
                    <p>Saída: {ride.departureTime}</p>
                    <p className="font-bold text-green-700">
                      Total: R$ {(ride.pricePerSeat * passengers).toFixed(2)}
                    </p>
                  </div>
                ))}
              <div className="pt-3 flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Confirmar Reserva
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedRide(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🛡️ Segurança</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p>✅ Todos os motoristas foram verificados</p>
          <p>✅ Compartilhamento de localização em tempo real</p>
          <p>✅ Suporte 24/7 disponível</p>
          <p>✅ Seguro de proteção do passageiro</p>
        </CardContent>
      </Card>
    </div>
  );
}
