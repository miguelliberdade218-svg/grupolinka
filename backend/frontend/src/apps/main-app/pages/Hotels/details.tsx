/**
 * src/apps/main-app/pages/Hotels/details.tsx
 * Página de detalhes do hotel com galeria profissional de fotos
 * Versão: 16/02/2026 - VERSÃO DEFINITIVA SEM ERROS
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
  Building,
  Bed,
  Wifi,
  Coffee,
  Tv,
  Wind,
  Bath,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Sparkles,
  Heart,
  Info,
  Lock,
} from 'lucide-react';
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { photoGalleryService } from '@/services/photoGalleryService';
import { hotelService } from '@/services/hotelService';
import type { Hotel } from '@/services/hotelService';
import type { RoomType as ServiceRoomType } from '@/services/hotelService';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

// LOG PARA VERIFICAR SE O ARQUIVO ESTÁ SENDO CARREGADO
console.log('🔥🔥🔥 [Hotels/details.tsx] ARQUIVO CARREGADO!', import.meta.url);

interface RoomTypeWithPhotos {
  roomType: ServiceRoomType;
  photos: RoomTypePhoto[];
}

// Mapeamento de ícones para amenities
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  'wi-fi': <Wifi className="w-4 h-4" />,
  'ar condicionado': <Wind className="w-4 h-4" />,
  'tv': <Tv className="w-4 h-4" />,
  'tv-cabo': <Tv className="w-4 h-4" />,
  'frigobar': <Coffee className="w-4 h-4" />,
  'café': <Coffee className="w-4 h-4" />,
  'banheira': <Bath className="w-4 h-4" />,
  'chuveiro': <Bath className="w-4 h-4" />,
  'estacionamento': <Car className="w-4 h-4" />,
  'cama-extra': <Bed className="w-4 h-4" />,
  'restaurante': <Utensils className="w-4 h-4" />,
  'academia': <Dumbbell className="w-4 h-4" />,
  'piscina': <Waves className="w-4 h-4" />,
  'spa': <Sparkles className="w-4 h-4" />,
  'cofre': <Lock className="w-4 h-4" />,
};

export const HotelDetailsPage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const [, setLocation] = useLocation();

  // LOG PARA VERIFICAR SE O COMPONENTE ESTÁ SENDO RENDERIZADO
  console.log('🔥🔥🔥 [Hotels/details.tsx] COMPONENTE RENDERIZADO!', { hotelId });

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomTypeWithPhotos[]>([]);
  const [hotelPhotos, setHotelPhotos] = useState<RoomTypePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'amenities' | 'policies'>('overview');

  useEffect(() => {
    loadHotelDetails();
  }, [hotelId]);

  const loadHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar hotel
      console.log('🏨 [Hotels/details] Carregando hotel:', hotelId);
      const hotelData = await hotelService.getHotelById(hotelId!);
      setHotel(hotelData);

      // ✅ Carregar TODAS as fotos do hotel
      try {
        console.log('📸 [Hotels/details] Carregando fotos do hotel:', hotelId);
        const photos = await photoGalleryService.getHotelPhotos(hotelId!);
        console.log(`📸 [Hotels/details] ${photos.length} fotos carregadas para o hotel`);
        setHotelPhotos(photos || []);
      } catch (err) {
        console.error('❌ [Hotels/details] Erro ao carregar fotos do hotel:', err);
        setHotelPhotos([]);
      }

      // Carregar room types
      console.log('🏨 [Hotels/details] Carregando room types do hotel:', hotelId);
      const roomTypesResponse = await hotelService.getRoomTypesByHotel(hotelId!);
      const roomTypesData = roomTypesResponse.success ? roomTypesResponse.data || [] : [];
      console.log(`🏨 [Hotels/details] ${roomTypesData.length} room types encontrados`);

      // Para cada room type, carregar todas as suas fotos
      const roomTypesWithPhotos = await Promise.all(
        roomTypesData.map(async (rt) => {
          try {
            console.log(`📸 [Hotels/details] Carregando fotos do room type ${rt.id} - ${rt.name}`);
            const photos = await photoGalleryService.getRoomTypePhotos(rt.id);
            console.log(`📸 [Hotels/details] ${photos.length} fotos carregadas para ${rt.name}`);
            return { roomType: rt, photos: photos || [] };
          } catch (err) {
            console.error(`❌ [Hotels/details] Erro ao carregar fotos do room type ${rt.id}:`, err);
            return { roomType: rt, photos: [] };
          }
        })
      );

      setRoomTypes(roomTypesWithPhotos);
      if (roomTypesWithPhotos.length > 0) {
        setSelectedRoomType(roomTypesWithPhotos[0].roomType.id);
      }
    } catch (err) {
      console.error('❌ [Hotels/details] Erro ao carregar hotel:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setLocation('/hotels/search');
  };

  const handleBooking = (roomTypeId: string) => {
    console.log('Reservar quarto:', roomTypeId);
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice <= 0) return 'Consulte';
    return numPrice.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
    });
  };

  const getAmenityIcon = (amenity: string): React.ReactNode => {
    const lowerAmenity = amenity.toLowerCase();
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (lowerAmenity.includes(key)) {
        return icon;
      }
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 text-orange-600 animate-spin" size={48} />
          <p className="text-gray-600">Carregando detalhes do hotel...</p>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <ChevronLeft size={20} />
              Voltar aos resultados
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Ativo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ GALERIA DO HOTEL - USANDO HotelPhotoGallery */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {hotelPhotos.length > 0 ? (
            <HotelPhotoGallery
              photos={hotelPhotos}
              title={hotel.name}
              mode="full"
              className="w-full"
            />
          ) : hotel.images && hotel.images.length > 0 ? (
            <div className="relative h-96 bg-gray-900">
              <img
                src={hotel.images[0].startsWith('/') ? `http://localhost:8000${hotel.images[0]}` : hotel.images[0]}
                alt={hotel.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('❌ Erro na imagem de fallback:', hotel.images?.[0]);
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Hotel';
                }}
              />
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                1/{hotel.images.length}
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gray-200 flex items-center justify-center">
              <p className="text-gray-500">Sem fotos do hotel</p>
            </div>
          )}
        </div>
      </div>

      {/* Informações do Hotel */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
              
              {/* Localização */}
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin size={18} className="text-orange-600" />
                <span>{hotel.address || `${hotel.locality || ''}, ${hotel.province || ''}`}</span>
              </div>

              {/* Rating */}
              {hotel.rating && hotel.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.floor(hotel.rating || 0) 
                          ? 'fill-orange-400 text-orange-400' 
                          : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({hotel.total_reviews || 0} avaliações)</span>
                </div>
              )}
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-3">
              {hotel.contact_phone && (
                <a
                  href={`tel:${hotel.contact_phone}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Phone size={18} className="text-orange-600" />
                  <span>Contactar</span>
                </a>
              )}
              <button
                onClick={() => setActiveTab('rooms')}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
              >
                Reservar Agora
              </button>
            </div>
          </div>

          {/* Contato rápido */}
          {hotel.contact_email && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a
                href={`mailto:${hotel.contact_email}`}
                className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition"
              >
                <Mail size={16} />
                {hotel.contact_email}
              </a>
            </div>
          )}
        </div>

        {/* Tabs de navegação */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'rooms'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Quartos ({roomTypes.length})
              </button>
              <button
                onClick={() => setActiveTab('amenities')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'amenities'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Comodidades
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={`py-4 px-4 font-medium text-sm border-b-2 transition ${
                  activeTab === 'policies'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Políticas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sobre o Hotel</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {hotel.description || 'Sem descrição disponível.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <Building className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-semibold">{hotel.check_in_time || '14:00'}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <Building className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-semibold">{hotel.check_out_time || '12:00'}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <Bed className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Quartos</p>
                    <p className="font-semibold">{roomTypes.length}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <MapPin className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Localização</p>
                    <p className="font-semibold truncate">{hotel.locality || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quartos */}
            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Tipos de Quarto Disponíveis</h3>
                
                {roomTypes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum quarto disponível no momento</p>
                ) : (
                  <div className="space-y-8">
                    {roomTypes.map((roomData) => {
                      const { roomType, photos } = roomData;
                      
                      // ✅ Garantir que amenities seja array
                      const amenities = Array.isArray(roomType.amenities) ? roomType.amenities : [];
                      
                      return (
                        <div key={roomType.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          {/* ✅ GALERIA DO ROOM TYPE */}
                          {photos.length > 0 ? (
                            <HotelPhotoGallery
                              photos={photos}
                              title={roomType.name}
                              mode="full"
                              className="w-full"
                            />
                          ) : roomType.images && roomType.images.length > 0 ? (
                            <div className="relative h-64 bg-gray-900">
                              <img
                                src={roomType.images[0].startsWith('/') ? `http://localhost:8000${roomType.images[0]}` : roomType.images[0]}
                                alt={roomType.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('❌ Erro na imagem de fallback do quarto:', roomType.images?.[0]);
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Quarto';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-64 bg-gray-200 flex items-center justify-center">
                              <p className="text-gray-500">Sem fotos deste quarto</p>
                            </div>
                          )}

                          <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                              <div className="flex-1">
                                <h4 className="text-xl font-bold mb-2">{roomType.name}</h4>
                                {roomType.description && (
                                  <p className="text-gray-600 text-sm mb-4">{roomType.description}</p>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users size={16} className="text-orange-600" />
                                    <span>{roomType.capacity || 2} pessoas</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Bed size={16} className="text-orange-600" />
                                    <span>{roomType.total_units || 1} unidades</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock size={16} className="text-orange-600" />
                                    <span>Mín. {roomType.min_nights || 1} noite(s)</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <DollarSign size={16} className="text-orange-600" />
                                    <span className="font-semibold">{formatPrice(roomType.base_price || 0)}</span>
                                  </div>
                                </div>

                                {amenities.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-2">Comodidades do quarto:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {amenities.slice(0, 5).map((amenity, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                                        >
                                          {getAmenityIcon(amenity)}
                                          <span>{amenity}</span>
                                        </div>
                                      ))}
                                      {amenities.length > 5 && (
                                        <div className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center gap-1">
                                          <Info size={12} />
                                          +{amenities.length - 5}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 min-w-[120px]">
                                <button
                                  onClick={() => handleBooking(roomType.id)}
                                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
                                >
                                  Reservar
                                </button>
                                <button
                                  onClick={() => window.open(`/booking/${roomType.id}`, '_blank')}
                                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
                                >
                                  Ver Preços
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Comodidades */}
            {activeTab === 'amenities' && hotel.amenities && hotel.amenities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Comodidades do Hotel</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {hotel.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      {getAmenityIcon(amenity)}
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Políticas */}
            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Horários</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-semibold">{hotel.check_in_time || '14:00'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-semibold">{hotel.check_out_time || '12:00'}</p>
                    </div>
                  </div>
                </div>
                
                {hotel.policies && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Políticas do Hotel</h3>
                    <p className="text-gray-600 whitespace-pre-line">{hotel.policies}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;