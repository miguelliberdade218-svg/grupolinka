import React, { useState, useMemo } from 'react';
import { useParams } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { HotelGallery } from '@/shared/components/hotels/HotelGallery';
import { RoomTypeCard } from '@/shared/components/hotels/RoomTypeCard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPinIcon, CheckCircle2Icon, StarIcon } from 'lucide-react';
import { useHotelCompleteData } from '../hooks/useHotelCompleteData';
import { Card } from '@/shared/components/ui/card';

/**
 * Página de detalhes do hotel com galeria completa
 * Mostra: fotos, quartos, comodidades, mapa, reviews
 * Contato apenas após reserva confirmada
 */
export const HotelDetailPage: React.FC = () => {
  const { id: hotelId } = useParams<{ id: string }>();
  const { data, isLoading, error } = useHotelCompleteData(hotelId);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark mb-2">Hotel não encontrado</h1>
          <p className="text-muted-foreground">O hotel que você procura não existe ou foi removido</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-96 mb-8 rounded-lg" />
          <Skeleton className="h-12 mb-4 w-1/3" />
          <Skeleton className="h-6 mb-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { hotel, roomTypes, reviews } = data;

  // Calcular o preço mínimo dos quartos disponíveis
  const minPrice = useMemo(() => {
    if (!roomTypes || roomTypes.length === 0) return null;
    const prices = roomTypes.map(room => parseFloat(room.basePrice));
    return Math.min(...prices);
  }, [roomTypes]);

  // Parse das políticas do hotel (string JSON)
  const parsedPolicies = useMemo(() => {
    if (!hotel?.policies) return null;
    try {
      return JSON.parse(hotel.policies);
    } catch (e) {
      console.warn('Failed to parse hotel policies:', e);
      return null;
    }
  }, [hotel?.policies]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Galeria Hero */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <HotelGallery
          images={hotel.images}
          roomTypes={roomTypes}
          hotelName={hotel.name}
        />
      </div>

      {/* Informações Principais */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            {/* Título e Rating */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold text-dark mb-2">{hotel.name}</h1>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <StarIcon className="w-5 h-5 fill-primary text-primary" />
                      <span className="font-semibold text-dark">{hotel.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({hotel.totalReviews} avaliações)
                      </span>
                    </div>
                    <Badge className="bg-secondary text-dark">Localização excelente</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPinIcon className="w-5 h-5" />
                <span>{hotel.locality || hotel.city}, {hotel.province}</span>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-secondary" />
                  <span>Verificado pelo Link-A</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-secondary" />
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2Icon className="w-5 h-5 text-secondary" />
                  <span>Suporte 24h</span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-dark mb-3">Sobre o hotel</h2>
              <p className="text-muted-foreground leading-relaxed">{hotel.description}</p>
            </div>

            {/* Tabs de Conteúdo */}
            <Tabs defaultValue="rooms" className="mb-8">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
                <TabsTrigger value="rooms">Quartos</TabsTrigger>
                <TabsTrigger value="amenities">Comodidades</TabsTrigger>
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>

              {/* Quartos */}
              <TabsContent value="rooms" className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Tipos de quartos</h3>
                  {roomTypes && roomTypes.length > 0 ? (
                    <div className="space-y-4">
                      {roomTypes.map((room) => (
                        <RoomTypeCard
                          key={room.id}
                          room={room}
                          pricePerNight={room.basePrice}
                          isSelected={selectedRoomId === room.id}
                          onSelect={setSelectedRoomId}
                          available={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum quarto disponível</p>
                  )}
                </div>
              </TabsContent>

              {/* Comodidades */}
              <TabsContent value="amenities">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Comodidades do hotel</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {hotel.amenities && hotel.amenities.length > 0 ? (
                      hotel.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <CheckCircle2Icon className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhuma comodidade listada</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">
                    Avaliações de hóspedes
                  </h3>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-dark">{review.guestName}</p>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.round(review.averageRating) }).map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className="w-4 h-4 fill-primary text-primary"
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{review.comment}</p>
                          {review.managerResponse && (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-secondary">
                              <p className="font-semibold text-dark mb-1">Resposta do hotel</p>
                              <p className="text-muted-foreground">{review.managerResponse}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
                  )}
                </div>
              </TabsContent>

              {/* Informações */}
              <TabsContent value="info">
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-dark mb-2">Check-in / Check-out</h4>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {hotel.checkInTime || '14:00'} | Check-out: {hotel.checkOutTime || '12:00'}
                    </p>
                  </div>

                  {parsedPolicies && (
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-dark mb-2">Políticas</h4>
                      {parsedPolicies.cancellationPolicy && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Cancelamento:</strong> {parsedPolicies.cancellationPolicy}
                        </p>
                      )}
                      {parsedPolicies.childrenPolicy && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Crianças:</strong> {parsedPolicies.childrenPolicy}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        <strong>Animais:</strong> {parsedPolicies.petsAllowed ? 'Permitidos' : 'Não permitidos'}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Sticky Booking Widget */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Preço a partir de</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-primary">
                    {minPrice ? minPrice.toLocaleString('pt-PT') : '--'}
                  </span>
                  <span className="text-muted-foreground">MZN/noite</span>
                </div>
              </div>

              {selectedRoomId && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm border border-blue-200">
                  <p className="text-blue-900">Quarto selecionado: {roomTypes?.find(r => r.id === selectedRoomId)?.name}</p>
                </div>
              )}

              <Button className="w-full bg-primary hover:bg-primary/90 text-dark mb-3 h-12 text-lg font-semibold">
                Reservar Agora
              </Button>

              <Button variant="outline" className="w-full h-10">
                Favoritar Hotel
              </Button>

              {/* Info de contato após reserva */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-900">
                  <strong>Contacto disponível após reserva confirmada</strong>
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  Depois de confirmar sua reserva, você receberá o telefone e email do hotel
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;
