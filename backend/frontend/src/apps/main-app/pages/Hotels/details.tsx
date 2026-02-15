/**
 * src/apps/main-app/pages/Hotels/details.tsx
 * Página de detalhes do hotel com galeria profissional de fotos de room types
 * Versão: 15/02/2026 - CORRIGIDO (min_nights)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import {
  MapPin,
  Star,
  Users,
  DollarSign,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  ChevronLeft,
} from 'lucide-react';
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { photoGalleryService } from '@/services/photoGalleryService';
import { hotelService } from '@/services/hotelService';
import type { Hotel } from '@/services/hotelService';
import type { RoomType } from '@/services/hotelService';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

interface RoomTypeWithPhotos {
  roomType: RoomType;
  photos: RoomTypePhoto[];
}

export const HotelDetailsPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [, setLocation] = useLocation();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithPhotos[]>([]);
  const [hotelPhotos, setHotelPhotos] = useState<RoomTypePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);

  useEffect(() => {
    loadHotelDetails();
  }, [hotelId]);

  const loadHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar hotel
      const hotelData = await hotelService.getHotelById(hotelId!);
      setHotel(hotelData);

      // Carregar fotos destacadas do hotel (para a hero section)
      try {
        const featuredPhotos = await photoGalleryService.getHotelFeaturedPhotos(hotelId!);
        setHotelPhotos(featuredPhotos || []);
      } catch (err) {
        console.error('Erro ao carregar fotos do hotel:', err);
        setHotelPhotos([]);
      }

      // Carregar room types
      const roomTypesResponse = await hotelService.getRoomTypesByHotel(hotelId!);
      const roomTypesData = roomTypesResponse.success ? roomTypesResponse.data || [] : [];

      // Para cada room type, carregar todas as suas fotos
      const roomTypesWithPhotos = await Promise.all(
        roomTypesData.map(async (rt) => {
          try {
            const photos = await photoGalleryService.getRoomTypePhotos(rt.id);
            return { roomType: rt, photos: photos || [] };
          } catch (err) {
            console.error(`Erro ao carregar fotos do room type ${rt.id}:`, err);
            return { roomType: rt, photos: [] };
          }
        })
      );

      setRoomTypes(roomTypesWithPhotos);
      if (roomTypesWithPhotos.length > 0) {
        setSelectedRoomType(roomTypesWithPhotos[0].roomType.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setLocation('/hotels/search');
  };

  const handleBooking = (roomTypeId: string) => {
    // Aqui você pode implementar a lógica de reserva
    console.log('Reservar quarto:', roomTypeId);
    // setLocation(`/booking/${roomTypeId}`);
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice <= 0) return 'Consulte';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 text-orange-600 animate-spin" size={48} />
          <p className="text-gray-600">Carregando detalhes do hotel...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="w-full min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleGoBack}
            className="mb-4 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <ChevronLeft size={20} />
            Voltar aos resultados
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Erro ao carregar hotel</h3>
              <p className="text-red-700">{error || 'Hotel não encontrado'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
          >
            <ChevronLeft size={20} />
            Voltar aos resultados
          </button>
        </div>
      </div>

      {/* Hero Section - Galeria do Hotel */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações Principais */}
            <div className="lg:col-span-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.floor(hotel.rating || 0) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-700">
                  {(hotel.rating || 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({hotel.total_reviews || 0} avaliações)
                </span>
              </div>

              {/* Localização */}
              <div className="flex items-start gap-3 mb-6">
                <MapPin size={20} className="text-orange-600 flex-shrink-0 mt-1" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{hotel.address}</p>
                  <p>{hotel.locality}, {hotel.province}</p>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                {hotel.contact_email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={18} className="text-orange-600" />
                    <a href={`mailto:${hotel.contact_email}`} className="hover:text-orange-600">
                      {hotel.contact_email}
                    </a>
                  </div>
                )}
                {hotel.contact_phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={18} className="text-orange-600" />
                    <a href={`tel:${hotel.contact_phone}`} className="hover:text-orange-600">
                      {hotel.contact_phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Check-in/Check-out */}
              {(hotel.check_in_time || hotel.check_out_time) && (
                <div className="space-y-2 border-t border-gray-200 mt-4 pt-4 text-sm">
                  {hotel.check_in_time && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock size={18} className="text-orange-600" />
                      <span>Check-in: {hotel.check_in_time}</span>
                    </div>
                  )}
                  {hotel.check_out_time && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock size={18} className="text-orange-600" />
                      <span>Check-out: {hotel.check_out_time}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Galeria de Fotos do Hotel - usando as fotos reais */}
            <div className="lg:col-span-2">
              {hotelPhotos.length > 0 ? (
                <HotelPhotoGallery
                  photos={hotelPhotos}
                  title={hotel.name}
                  mode="full"
                  className="w-full rounded-xl overflow-hidden shadow-md"
                />
              ) : hotel.images && hotel.images.length > 0 ? (
                // Fallback para images antigas
                <div className="bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={hotel.images[0]}
                    alt={hotel.name}
                    className="w-full h-96 object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
                  <p className="text-gray-600">Sem fotos do hotel</p>
                </div>
              )}
            </div>
          </div>

          {/* Descrição do Hotel */}
          {hotel.description && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre o hotel</h2>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>
          )}

          {/* Amenities do Hotel */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Comodidades</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-orange-50 rounded-lg p-3">
                    <CheckCircle size={18} className="text-orange-600" />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tipos de Quarto com suas Galerias */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Tipos de Quarto</h2>

        {roomTypes.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Nenhum tipo de quarto disponível</p>
          </div>
        ) : (
          <div className="space-y-12">
            {roomTypes.map((roomData, index) => {
              const { roomType, photos } = roomData;
              const isSelected = selectedRoomType === roomType.id;

              return (
                <div
                  key={roomType.id}
                  id={`room-${roomType.id}`}
                  className={`bg-white rounded-xl border-2 overflow-hidden transition-all scroll-mt-24 ${
                    isSelected ? 'border-orange-600 shadow-lg' : 'border-gray-200'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Galeria de Fotos do Room Type */}
                    <div className="lg:col-span-2">
                      {photos.length > 0 ? (
                        <HotelPhotoGallery
                          photos={photos}
                          title={roomType.name}
                          mode="full"
                          className="w-full rounded-xl overflow-hidden shadow-md"
                        />
                      ) : (
                        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                          <p className="text-gray-500">Sem fotos deste quarto</p>
                        </div>
                      )}
                    </div>

                    {/* Informações do Room Type */}
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{roomType.name}</h3>

                      {roomType.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                          {roomType.description}
                        </p>
                      )}

                      {/* Características */}
                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center gap-2">
                          <Users size={18} className="text-orange-600" />
                          <span className="text-gray-700">
                            Até <strong>{roomType.capacity} hóspedes</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign size={18} className="text-orange-600" />
                          <span className="text-gray-700">
                            <strong>{formatPrice(roomType.base_price)}</strong> por noite
                          </span>
                        </div>

                        {/* ✅ CORRIGIDO: min_nights em vez de min_nights_default */}
                        {roomType.min_nights && (
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-orange-600" />
                            <span className="text-gray-700">
                              Mín. <strong>{roomType.min_nights} noites</strong>
                            </span>
                          </div>
                        )}

                        {photos.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">{photos.length}</span>
                            {photos.length === 1 ? 'foto' : 'fotos'} disponíveis
                          </div>
                        )}
                      </div>

                      {/* Amenities do Room Type */}
                      {roomType.amenities && roomType.amenities.length > 0 && (
                        <div className="mb-6 pb-6 border-t border-gray-200 pt-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Incluso neste quarto
                          </h4>
                          <div className="space-y-2">
                            {roomType.amenities.slice(0, 5).map((amenity, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-orange-600" />
                                <span className="text-sm text-gray-600">{amenity}</span>
                              </div>
                            ))}
                            {roomType.amenities.length > 5 && (
                              <p className="text-sm text-orange-600 font-medium">
                                +{roomType.amenities.length - 5} comodidades
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => handleBooking(roomType.id)}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition"
                      >
                        Reservar Agora
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailsPage;