import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  X, 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Users, 
  Calendar,
  Check,
  Phone,
  Mail,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  CreditCard,
  Baby
} from 'lucide-react';
import { hotelService, Hotel, RoomType } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';
import ModalOverlay from '@/shared/components/ModalOverlay';

interface HotelDetailModalProps {
  hotelId: string;
  isOpen: boolean;
  onClose: () => void;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export default function HotelDetailModal({
  hotelId,
  isOpen,
  onClose,
  checkIn,
  checkOut,
  guests = 2
}: HotelDetailModalProps) {
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Buscar detalhes do hotel
  const { data: hotelData, isLoading, error } = useQuery({
    queryKey: ['hotelDetails', hotelId],
    queryFn: () => hotelService.getHotelById(hotelId),
    enabled: isOpen && !!hotelId,
  });

  const hotel: Hotel | undefined = hotelData?.data;

  // Buscar tipos de quarto
  const { data: roomTypesData } = useQuery({
    queryKey: ['hotelRoomTypes', hotelId],
    queryFn: () => hotelService.getRoomTypesByHotel(hotelId),
    enabled: isOpen && !!hotelId,
  });

  const roomTypes: RoomType[] = roomTypesData?.data || [];

  // Manipuladores
  const handleBookNow = () => {
    toast({
      title: "Redirecionando para reserva",
      description: "Você será redirecionado para a página de reserva",
    });
    // Fechar modal e navegar para página de reserva
    onClose();
    // Navegação será feita pelo componente pai
  };

  const nextImage = () => {
    if (hotel?.images && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }
  };

  const prevImage = () => {
    if (hotel?.images && hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
    }
  };

  // Resetar índice da imagem quando hotel muda
  useEffect(() => {
    if (hotel?.images && hotel.images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [hotel?.images]);

  if (!isOpen) return null;

  const renderStars = (rating: number = 0) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return <Star key={index} className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <Star className="w-4 h-4 text-gray-300" />
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            );
          } else {
            return <Star key={index} className="w-4 h-4 text-gray-300" />;
          }
        })}
      </div>
    );
  };

  return (
    <ModalOverlay 
      isOpen={isOpen} 
      onClose={onClose}
      title="Detalhes do Hotel"
      maxWidth="6xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">Erro ao carregar hotel</h3>
            <p className="text-gray-600 mb-6">
              Não foi possível carregar as informações do hotel.
            </p>
            <Button onClick={onClose}>Voltar para busca</Button>
          </div>
        ) : hotel ? (
          <div className="space-y-6">
            {/* Galeria de imagens */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              {hotel.images && hotel.images.length > 0 ? (
                <>
                  <img
                    src={hotel.images[currentImageIndex]}
                    alt={hotel.name}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  {hotel.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {hotel.images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gradient-to-r from-orange-100 to-red-100">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🏨</div>
                    <p className="text-gray-600">Sem imagens disponíveis</p>
                  </div>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hotel.rating && hotel.rating > 4 && (
                  <Badge className="bg-green-500 text-white">
                    ⭐ Excelente {hotel.rating?.toFixed(1)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Informações principais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{hotel.name}</h2>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {hotel.locality && hotel.province 
                        ? `${hotel.locality}, ${hotel.province}`
                        : 'Localização não especificada'
                      }
                    </span>
                  </div>
                  {hotel.rating && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium ml-1">{hotel.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        ({hotel.total_reviews || 0} avaliações)
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  {hotel.description || 'Sem descrição disponível.'}
                </p>

                {/* Amenidades */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Amenidades</h3>
                  {hotel.amenities && hotel.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {hotel.amenities.slice(0, 8).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                      {hotel.amenities.length > 8 && (
                        <div className="col-span-2 md:col-span-4 pt-2">
                          <p className="text-sm text-gray-500">
                            +{hotel.amenities.length - 8} mais amenidades
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Nenhuma amenidade listada</p>
                  )}
                </div>
              </div>

              {/* Sidebar - Informações de reserva */}
              <div>
                <Card className="sticky top-4 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Sua estadia</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Check-in</span>
                        </div>
                        <span className="font-medium">
                          {checkIn ? new Date(checkIn).toLocaleDateString('pt-MZ') : 'Selecionar data'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Check-out</span>
                        </div>
                        <span className="font-medium">
                          {checkOut ? new Date(checkOut).toLocaleDateString('pt-MZ') : 'Selecionar data'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Hóspedes</span>
                        </div>
                        <span className="font-medium">{guests} {guests === 1 ? 'pessoa' : 'pessoas'}</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Tipos de quarto */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Tipos de quarto disponíveis</h4>
                      {roomTypes.length > 0 ? (
                        <div className="space-y-3">
                          {roomTypes.slice(0, 3).map((roomType) => (
                            <div key={roomType.id} className="border rounded-lg p-3 hover:border-orange-300 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="font-medium">{roomType.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    {roomType.capacity} {roomType.capacity === 1 ? 'pessoa' : 'pessoas'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-orange-600">
                                    {(parseInt(roomType.base_price) || 0).toLocaleString('pt-MZ')} MZN
                                  </p>
                                  <p className="text-sm text-gray-500">por noite</p>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={handleBookNow}
                              >
                                Selecionar este quarto
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">Nenhum tipo de quarto disponível</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" 
                      size="lg" 
                      onClick={handleBookNow}
                    >
                      Reservar Agora
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Você será redirecionado para a página de reserva completa
                    </p>
                  </CardContent>
                </Card>

                {/* Informações de contato (SEM detalhes de contato) */}
                <Card className="mt-4 border-orange-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Informações importantes
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Detalhes de contato disponíveis após confirmação da reserva</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-600">
                        <CreditCard className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Pagamento seguro através da plataforma</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Cancelamento gratuito até 48h antes do check-in</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs para mais informações */}
            <Tabs defaultValue="location" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="location" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Localização
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliações
                </TabsTrigger>
                <TabsTrigger 
                  value="policies" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Políticas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="location" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Navigation className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">Como chegar</h4>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-48 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📍</div>
                        <p className="text-gray-600">Mapa disponível após confirmação da reserva</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Endereço completo e coordenadas fornecidos após reserva confirmada
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 flex items-start gap-2">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Por segurança, informações detalhadas de localização são fornecidas apenas após confirmação da reserva.</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Avaliações dos hóspedes</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(hotel.rating || 0)}
                          <span className="text-xl font-bold">{hotel.rating?.toFixed(1) || 'N/A'}</span>
                          <span className="text-gray-500">({hotel.total_reviews || 0} avaliações)</span>
                        </div>
                      </div>
                    </div>
                    
                    {hotel.total_reviews && hotel.total_reviews > 0 ? (
                      <div className="space-y-4">
                        {/* Mock de avaliações */}
                        <div className="border-b pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                                <span className="font-medium text-sm">JS</span>
                              </div>
                              <span className="font-medium">João S.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">
                            "Excelente localização e atendimento. Quartos limpos e confortáveis."
                          </p>
                          <p className="text-sm text-gray-500 mt-2">Há 2 semanas</p>
                        </div>
                        
                        <div className="border-b pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                <span className="font-medium text-sm">ML</span>
                              </div>
                              <span className="font-medium">Maria L.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                              <Star className="w-4 h-4 text-gray-300" />
                            </div>
                          </div>
                          <p className="text-gray-700">
                            "Café da manhã muito bom. Equipe atenciosa e prestativa."
                          </p>
                          <p className="text-sm text-gray-500 mt-2">Há 1 mês</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">⭐</div>
                        <p className="text-gray-600">Este hotel ainda não tem avaliações</p>
                        <p className="text-sm text-gray-500 mt-1">Seja o primeiro a avaliar!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="policies" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          Check-in / Check-out
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Check-in</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <p className="font-medium">{hotel.check_in_time || '14:00'}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500">Check-out</p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <p className="font-medium">{hotel.check_out_time || '12:00'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-orange-600" />
                          Política de cancelamento
                        </h4>
                        <ul className="space-y-2 text-gray-700">
                          <li className="flex items-start gap-2 p-2 bg-green-50 rounded">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Cancelamento gratuito até 48 horas antes do check-in</span>
                          </li>
                          <li className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                            <Check className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>Taxa de 50% para cancelamentos dentro de 48 horas</span>
                          </li>
                          <li className="flex items-start gap-2 p-2 bg-red-50 rounded">
                            <Check className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>Sem reembolso para no-shows</span>
                          </li>
                        </ul>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Baby className="w-5 h-5 text-orange-600" />
                          Política de crianças
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700">
                            Crianças de todas as idades são bem-vindas. Crianças até 12 anos ficam gratuitamente quando usam camas existentes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-semibold mb-2">Hotel não encontrado</h3>
            <p className="text-gray-600 mb-6">
              O hotel que você está procurando não está disponível no momento.
            </p>
            <Button onClick={onClose}>Voltar para busca</Button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}