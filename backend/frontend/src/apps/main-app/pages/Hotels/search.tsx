/**
 * src/apps/main-app/pages/Hotels/search.tsx (REDESIGN)
 * Página de resultados de hotéis com galeria de fotos profissional
 * Versão: 14/02/2026 - CORRIGIDO
 * 
 * Melhorias:
 * - Fotos dos hotéis em destaque
 * - Cards maiores com melhor espaçamento
 * - Galeria interativa com arrows
 * - Layout moderno e responsivo
 * - Fotos destacadas do gestor visíveis
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { MapPin, Star, Users, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';
import { photoGalleryService } from '@/services/photoGalleryService';
import { hotelService } from '@/services/hotelService';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';
import type { Hotel } from '@/services/hotelService'; // ✅ Import do tipo do service

interface HotelResultCard {
  hotel: Hotel;
  photos: RoomTypePhoto[];
  roomTypeCount: number;
  priceRange: { min: number; max: number };
}

export const HotelsSearchPage: React.FC = () => {
  const { locality } = useParams<{ locality?: string }>();
  const [, setLocation] = useLocation();
  
  const [hotels, setHotels] = useState<HotelResultCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);

  useEffect(() => {
    loadHotels();
  }, [locality]);

  const loadHotels = async () => {
    try {
      setLoading(true);
      setError(null);

      let hotelsData: Hotel[] = [];

      if (locality) {
        // Usar searchHotels em vez de getHotelsByLocality (que pode não existir)
        const response = await hotelService.searchHotels({ locality });
        if (response.success && response.data) {
          hotelsData = response.data;
        } else {
          throw new Error(response.error || 'Erro ao carregar hotéis');
        }
      } else {
        // Usar getHotels do hotelService (existe?)
        const response = await hotelService.getHotelsByHost('all'); // Ajuste conforme necessário
        if (response.success && response.data) {
          hotelsData = response.data;
        } else {
          throw new Error(response.error || 'Erro ao carregar hotéis');
        }
      }

      // Para cada hotel, carregar fotos destacadas
      const hotelsWithPhotos = await Promise.all(
        hotelsData.map(async (hotel) => {
          try {
            // Obter fotos destacadas do hotel
            const photosResponse = await photoGalleryService.getHotelFeaturedPhotos(hotel.id);
            const photos = photosResponse || [];
            
            // Obter room types para contar e calcular preços
            const roomTypesResponse = await hotelService.getRoomTypesByHotel(hotel.id);
            const roomTypes = roomTypesResponse.success ? roomTypesResponse.data || [] : [];
            
            // Calcular faixa de preço
            let minPrice = 0;
            let maxPrice = 0;
            if (roomTypes.length > 0) {
              const prices = roomTypes
                .map(rt => parseFloat(rt.base_price))
                .filter(p => !isNaN(p) && p > 0);
              if (prices.length > 0) {
                minPrice = Math.min(...prices);
                maxPrice = Math.max(...prices);
              }
            }
            
            return {
              hotel,
              photos,
              roomTypeCount: roomTypes.length,
              priceRange: { min: minPrice, max: maxPrice },
            };
          } catch (err) {
            console.error(`Erro ao carregar fotos do hotel ${hotel.id}:`, err);
            return {
              hotel,
              photos: [],
              roomTypeCount: 0,
              priceRange: { min: 0, max: 0 },
            };
          }
        })
      );

      setHotels(hotelsWithPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar hotéis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 text-orange-600 animate-spin" size={48} />
          <p className="text-gray-600">Carregando hotéis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Erro ao carregar hotéis</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number): string => {
    if (price <= 0) return 'Consulte';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleViewDetails = (hotelId: string) => {
    setLocation(`/hotels/${hotelId}`);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hotéis em {locality || 'Moçambique'}
          </h1>
          <p className="text-gray-600">
            Encontramos <span className="font-semibold text-orange-600">{hotels.length}</span> hotéis disponíveis
          </p>
        </div>

        {hotels.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">
              Nenhum hotel encontrado em {locality || 'sua região'}
            </p>
          </div>
        ) : (
          /* Lista de Hotéis */
          <div className="space-y-6">
            {hotels.map((result) => (
              <div
                key={result.hotel.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Container */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Coluna de Fotos - Destaque Principal */}
                  <div className="lg:col-span-2">
                    <HotelPhotoGallery
                      photos={result.photos}
                      title={result.hotel.name}
                      mode="preview"
                      className="w-full rounded-xl overflow-hidden shadow-md"
                    />
                  </div>

                  {/* Coluna de Informações - Sidebar */}
                  <div className="flex flex-col justify-between">
                    {/* Nome e Localização */}
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {result.hotel.name}
                      </h2>
                      
                      {/* Rating - usando campos opcionais */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={i < Math.floor(result.hotel.rating || 0) ? 'fill-orange-400 text-orange-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-700">
                          {(result.hotel.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({result.hotel.total_reviews || 0} avaliações)
                        </span>
                      </div>

                      {/* Localização */}
                      <div className="flex items-start gap-2 text-gray-600 mb-4">
                        <MapPin size={18} className="flex-shrink-0 mt-1 text-orange-600" />
                        <div className="text-sm">
                          <p>{result.hotel.address}</p>
                          <p className="text-gray-500">
                            {result.hotel.locality}, {result.hotel.province}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-orange-700 font-semibold mb-1">
                          <Users size={16} />
                          <span className="text-sm">Quartos</span>
                        </div>
                        <p className="text-lg font-bold text-orange-600">
                          {result.roomTypeCount || '-'}
                        </p>
                      </div>

                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-1">
                          <DollarSign size={16} />
                          <span className="text-sm">Preço</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {result.priceRange.min > 0 ? (
                            <>
                              {formatPrice(result.priceRange.min)}
                              {result.priceRange.max > result.priceRange.min && (
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  - {formatPrice(result.priceRange.max)}
                                </span>
                              )}
                            </>
                          ) : (
                            'Consulte'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Descrição */}
                    {result.hotel.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {result.hotel.description}
                      </p>
                    )}

                    {/* Amenities Preview */}
                    {result.hotel.amenities && result.hotel.amenities.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                          Comodidades
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.hotel.amenities.slice(0, 4).map((amenity, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs"
                            >
                              {amenity}
                            </span>
                          ))}
                          {result.hotel.amenities.length > 4 && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              +{result.hotel.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetails(result.hotel.id)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition"
                      >
                        Ver Detalhes
                      </button>
                      <button
                        onClick={() => setSelectedHotel(selectedHotel === result.hotel.id ? null : result.hotel.id)}
                        className="flex-1 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-lg transition"
                      >
                        {selectedHotel === result.hotel.id ? 'Ocultar Fotos' : 'Ver Fotos'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Galeria Expandida (quando selecionado) */}
                {selectedHotel === result.hotel.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Todas as fotos do hotel
                    </h3>
                    <HotelPhotoGallery
                      photos={result.photos}
                      mode="grid"
                      className="grid-cols-2 md:grid-cols-3"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelsSearchPage;