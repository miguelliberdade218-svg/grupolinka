import { useState } from 'react';
import { RideReviewForm } from '@/components/RideReviewForm';
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Clock, User, CreditCard, Star } from 'lucide-react';

interface RideCompletionPageProps {
  rideId?: string;
  driverId?: string;
  driverName?: string;
  passengerId?: string;
  from?: string;
  to?: string;
  distance?: number;
  duration?: number;
  price?: number;
  onClose?: () => void;
}

export default function RideCompletionPage({
  rideId = 'RIDE-12345',
  driverId = 'driver-789',
  driverName = 'João Silva',
  passengerId = 'user-456',
  from = 'Av. Paulista, São Paulo',
  to = 'Estação Luz, São Paulo',
  distance = 8.5,
  duration = 24,
  price = 35.50,
  onClose,
}: RideCompletionPageProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (reviewSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">Avaliação Enviada!</h2>
            <p className="text-gray-600">Obrigado por avaliar. Sua opinião nos ajuda a melhorar.</p>
            <Button onClick={onClose} className="w-full">
              Voltar ao App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Corrida Concluída!</h2>
        <p className="text-gray-600 mt-2">Avalie seu motorista e conclua sua viagem</p>
      </div>

      {/* Ride Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Corrida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-600">De:</p>
                <p className="font-semibold text-gray-900">{from}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Para:</p>
                <p className="font-semibold text-gray-900">{to}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Distância</p>
              <p className="font-bold text-gray-900">{distance} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duração</p>
              <p className="font-bold text-gray-900">{duration} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="font-bold text-gray-900">R$ {price.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Motorista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{driverName}</p>
              <DriverRatingsDisplay
                driverId={driverId}
                driverName={driverName}
                compact={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      {!showReviewForm ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">⭐ Avalie seu Motorista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-blue-900">Sua opinião nos ajuda a melhorar a qualidade do serviço e recompensar ótimos motoristas.</p>
            <Button
              onClick={() => setShowReviewForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enviar Avaliação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sua Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <RideReviewForm
              rideId={rideId}
              currentUserId={passengerId}
              targetUserId={driverId}
              reviewType="passenger"
              targetName={driverName}
              onSuccess={() => {
                setReviewSubmitted(true);
              }}
              onCancel={() => setShowReviewForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Payment Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Confirmação de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tarifa base:</span>
              <span className="font-semibold">R$ {(price * 0.8).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxa do serviço (20%):</span>
              <span className="font-semibold">R$ {(price * 0.2).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Total:</span>
              <span className="text-green-600">R$ {price.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Pagamento já processado em seu cartão</p>
        </CardContent>
      </Card>

      {/* Close Button */}
      <Button
        onClick={onClose}
        variant="outline"
        className="w-full"
      >
        Fechar
      </Button>
    </div>
  );
}
