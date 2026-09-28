import { useState } from 'react';
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Clock, Users, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState as useState2 } from 'react';

interface RideDetailsPageProps {
  rideId?: string;
  driverId?: string;
  driverName?: string;
  fromLocation?: string;
  toLocation?: string;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: number;
  vehicleType?: string;
  vehicleInfo?: string;
  onBook?: () => void;
}

export default function RideDetailsPage({
  rideId = 'RIDE-12345',
  driverId = 'driver-789',
  driverName = 'João Silva',
  fromLocation = 'Av. Paulista, São Paulo',
  toLocation = 'Estação Luz, São Paulo',
  departureTime = '14:30',
  availableSeats = 3,
  pricePerSeat = 35.50,
  vehicleType = 'Compacto',
  vehicleInfo = 'Honda Fit Branco - PLV-2023',
  onBook,
}: RideDetailsPageProps) {
  const [expanded, setExpanded] = useState2(false);
  const totalPrice = pricePerSeat * availableSeats;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Detalhes da Corrida</h2>
        <p className="text-gray-600 mt-2">ID: {rideId}</p>
      </div>

      {/* Route */}
      <Card>
        <CardHeader>
          <CardTitle>Itinerário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saída</p>
                <p className="font-semibold text-gray-900">{fromLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Destino</p>
                <p className="font-semibold text-gray-900">{toLocation}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Saída
              </p>
              <p className="font-bold text-gray-900">{departureTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Vagas
              </p>
              <p className="font-bold text-gray-900">{availableSeats} lugares</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card>
        <CardHeader>
          <CardTitle>Motorista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold text-gray-900 mb-3">{driverName}</p>
            <DriverRatingsDisplay
              driverId={driverId}
              driverName={driverName}
              compact={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      <Card>
        <CardHeader onClick={() => setExpanded(!expanded)} className="cursor-pointer">
          <div className="flex justify-between items-center">
            <CardTitle>Veículo</CardTitle>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="font-semibold text-gray-900">{vehicleType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Informações</p>
              <p className="font-semibold text-gray-900">{vehicleInfo}</p>
            </div>
            <div className="pt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-900">✅ Veículo verificado e com documentação em dia</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Política de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentPolicyDisplay
            providerId={driverId}
            providerType="driver"
            providerName={driverName}
            compact={false}
          />
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Preço por vaga:</span>
              <span className="font-semibold">R$ {pricePerSeat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Número de vagas:</span>
              <span className="font-semibold">{availableSeats}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total da corrida:</span>
              <span className="text-green-600">R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Info */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Segurança e Confiança
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-900 space-y-2 text-sm">
          <p>✅ Motorista verificado</p>
          <p>✅ Rating positivo ({driverName})</p>
          <p>✅ Seguro e proteção do passageiro</p>
          <p>✅ Suporte 24/7 disponível</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={onBook}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
        >
          Reservar Agora - R$ {totalPrice.toFixed(2)}
        </Button>
        <Button
          variant="outline"
          className="w-full"
        >
          Mais Informações
        </Button>
      </div>
    </div>
  );
}
