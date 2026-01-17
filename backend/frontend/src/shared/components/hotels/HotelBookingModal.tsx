/**
 * src/shared/components/hotels/HotelBookingModal.tsx
 * Modal de criação de booking de hotel
 * Com validação, cálculo de preço e integração com payment
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertCircle, Loader } from 'lucide-react';
import { useCalculateHotelPrice, useCreateHotelBooking } from '@/apps/main-app/features/hotels/hooks/useHotelsComplete';
import type { RoomType } from '@/shared/types/hotels';
import type { CreateHotelBookingRequest } from '@/shared/types/bookings';

interface HotelBookingModalProps {
  hotelId: string;
  roomTypes: RoomType[];
  onSuccess?: (bookingId: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function HotelBookingModal({
  hotelId,
  roomTypes,
  onSuccess,
  onClose,
}: HotelBookingModalProps) {
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [units, setUnits] = useState<number>(1);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const calculatePrice = useCalculateHotelPrice();
  const createBooking = useCreateHotelBooking();

  // Calcular preço automaticamente
  const pricing = useMemo(() => {
    if (selectedRoomType && checkIn && checkOut) {
      calculatePrice.mutate(
        {
          hotelId,
          roomTypeId: selectedRoomType,
          checkIn,
          checkOut,
          units,
          promoCode: promoCode || undefined,
        },
        {
          onError: (err) => setError((err as Error).message),
        }
      );
    }
  }, [selectedRoomType, checkIn, checkOut, units, promoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!guestName.trim() || !guestEmail.trim() || !selectedRoomType) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!agreedTerms) {
      setError('Você deve aceitar os termos e condições');
      return;
    }

    const bookingData: CreateHotelBookingRequest = {
      roomTypeId: selectedRoomType,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone || undefined,
      checkIn,
      checkOut,
      adults,
      children,
      units,
      specialRequests: specialRequests || undefined,
      promoCode: promoCode || undefined,
      status: 'confirmed',
      paymentStatus: 'pending',
    };

    createBooking.mutate(
      { hotelId, booking: bookingData },
      {
        onSuccess: (booking) => {
          onSuccess?.(booking.id);
          onClose?.();
        },
        onError: (err) => setError((err as Error).message),
      }
    );
  };

  const selectedRoom = roomTypes.find((rt) => rt.id === selectedRoomType);
  const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Reservar Quarto</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do Hóspede */}
            <div>
              <h3 className="font-semibold mb-4">Dados do Hóspede</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Hóspede *"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="João Silva"
                />
                <Input
                  label="Email *"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="joao@example.com"
                />
                <Input
                  label="Telefone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+258 84 123 4567"
                />
              </div>
            </div>

            {/* Datas e Hóspedes */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Datas e Hóspedes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Check-in *"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
                <Input
                  label="Check-out *"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Noites: <span className="text-primary-500 font-semibold">{nights}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tipo de Quarto */}
            <div>
              <h3 className="font-semibold mb-4">Tipo de Quarto *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roomTypes.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRoomType === room.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRoomType(room.id)}
                  >
                    <h4 className="font-semibold text-sm">{room.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">Capacidade: {room.capacity} pessoas</p>
                    <p className="text-primary-600 font-semibold text-sm">
                      {parseFloat(room.basePrice).toFixed(2)} MZN/noite
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ocupação */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> Ocupação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Adultos</label>
                  <Select
                    value={adults.toString()}
                    onChange={(e) => setAdults(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Adulto' : 'Adultos'}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Crianças</label>
                  <Select
                    value={children.toString()}
                    onChange={(e) => setChildren(parseInt(e.target.value))}
                  >
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Criança' : 'Crianças'}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unidades</label>
                  <Select
                    value={units.toString()}
                    onChange={(e) => setUnits(parseInt(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Quarto' : 'Quartos'}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* Promo e Pedidos Especiais */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Código Promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ex: PROMO2024"
                />
              </div>
              <Input
                label="Pedidos Especiais"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Ex: Berço de bebé, alergias alimentares, etc."
                className="mt-4"
              />
            </div>

            {/* Resumo de Preço */}
            {pricing.isPending ? (
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Calculando preço...</span>
              </div>
            ) : calculatePrice.data ? (
              <Card className="bg-primary-50 border-primary-200 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Preço por noite:</span>
                    <span>{parseFloat(calculatePrice.data.pricePerNight).toFixed(2)} MZN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Noites ({nights}):</span>
                    <span>{parseFloat(calculatePrice.data.subtotal).toFixed(2)} MZN</span>
                  </div>
                  {calculatePrice.data.discount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({calculatePrice.data.discountPercent}%):</span>
                      <span>-{parseFloat(calculatePrice.data.discount).toFixed(2)} MZN</span>
                    </div>
                  )}
                  <div className="border-t border-primary-200 pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary-600">{parseFloat(calculatePrice.data.totalPrice).toFixed(2)} MZN</span>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Termos */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Concordo com os{' '}
                <a href="#" className="text-primary-600 hover:underline">
                  termos e condições
                </a>{' '}
                e{' '}
                <a href="#" className="text-primary-600 hover:underline">
                  política de cancelamento
                </a>
              </label>
            </div>

            {/* Ações */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createBooking.isPending}
                disabled={!selectedRoomType || !checkIn || !checkOut || !agreedTerms}
              >
                Reservar Agora
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
