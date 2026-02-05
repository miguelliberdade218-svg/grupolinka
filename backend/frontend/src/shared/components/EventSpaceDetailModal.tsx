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
  Users, 
  Calendar,
  Check,
  Building,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Coffee,
  Car,
  Volume2,
  Video,
  Shield,
  Clock,
  Music,
  PartyPopper,
  Briefcase,
  Sparkles,
  AlertCircle,
  Package,
  Phone
} from 'lucide-react';
import { eventSpaceService } from '@/services/eventSpaceService';
import { useToast } from '@/shared/hooks/use-toast';
import ModalOverlay from '@/shared/components/ModalOverlay';
import { EventSpace } from '@/shared/types/event-spaces';

interface EventSpaceDetailModalProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  date?: string;
  capacity?: number;
}

export default function EventSpaceDetailModal({
  spaceId,
  isOpen,
  onClose,
  date,
  capacity = 50
}: EventSpaceDetailModalProps) {
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Buscar detalhes do espaço
  const { data: spaceData, isLoading, error } = useQuery({
    queryKey: ['eventSpaceDetails', spaceId],
    queryFn: () => eventSpaceService.getEventSpaceById(spaceId),
    enabled: isOpen && !!spaceId,
  });

  const space: EventSpace | undefined = spaceData?.data;

  // Manipuladores
  const handleBookNow = () => {
    toast({
      title: "Redirecionando para reserva",
      description: "Você será redirecionado para a página de reserva do evento",
    });
    onClose();
  };

  const nextImage = () => {
    if (space?.images && space.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % space.images.length);
    }
  };

  const prevImage = () => {
    if (space?.images && space.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + space.images.length) % space.images.length);
    }
  };

  // Resetar índice da imagem quando espaço muda
  useEffect(() => {
    if (space?.images && space.images.length > 0) {
      setCurrentImageIndex(0);
    }
  }, [space?.images]);

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

  // Helper functions para valores seguros
  const getImages = () => space?.images || [];
  const getDescription = () => space?.description || 'Sem descrição disponível.';
  const getRating = () => space?.rating || 0;
  const getTotalReviews = () => space?.totalReviews || 0;
  const getEquipment = () => space?.equipment || {};
  const getEquipmentAmenities = () => space?.equipment?.amenities || [];
  const getAllowedEventTypes = () => space?.allowedEventTypes || [];
  const getProhibitedEventTypes = () => space?.prohibitedEventTypes || [];
  const getCateringMenuUrls = () => space?.cateringMenuUrls || [];

  return (
    <ModalOverlay 
      isOpen={isOpen} 
      onClose={onClose}
      title="Detalhes do Espaço para Eventos"
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
            <h3 className="text-xl font-semibold mb-2">Erro ao carregar espaço</h3>
            <p className="text-gray-600 mb-6">
              Não foi possível carregar as informações do espaço.
            </p>
            <Button onClick={onClose}>Voltar para busca</Button>
          </div>
        ) : space ? (
          <div className="space-y-6">
            {/* Galeria de imagens */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              {getImages().length > 0 ? (
                <>
                  <img
                    src={getImages()[currentImageIndex]}
                    alt={space.name}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  {getImages().length > 1 && (
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
                        {getImages().map((_, index) => (
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
                <div className="w-full h-64 md:h-80 flex items-center justify-center bg-gradient-to-r from-purple-100 to-violet-100">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎪</div>
                    <p className="text-gray-600">Sem imagens disponíveis</p>
                  </div>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {space.isFeatured && (
                  <Badge className="bg-purple-500 text-white">🔥 Destaque</Badge>
                )}
                {space.rating && space.rating > 4 && (
                  <Badge className="bg-green-500 text-white">
                    ⭐ Excelente {space.rating?.toFixed(1)}
                  </Badge>
                )}
                {space.spaceType && (
                  <Badge variant="outline" className="bg-white/90 text-gray-800 border-purple-300">
                    {space.spaceType}
                  </Badge>
                )}
              </div>
            </div>

            {/* Informações principais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{space.name}</h2>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {space.hotel && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{space.hotel.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {space.locality || space.hotel?.locality}, {space.province || space.hotel?.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      Capacidade: {space.capacityMin || 0}-{space.capacityMax || 0} pessoas
                    </span>
                  </div>
                  {space.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{space.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">
                        ({space.totalReviews || 0} avaliações)
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  {getDescription()}
                </p>

                {/* Características principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border">
                    <div className="text-2xl mb-1">📏</div>
                    <p className="text-sm text-gray-600">Área</p>
                    <p className="font-semibold text-gray-900">{space.areaSqm || 'N/A'} m²</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border">
                    <div className="text-2xl mb-1">💰</div>
                    <p className="text-sm text-gray-600">Preço/dia</p>
                    <p className="font-semibold text-purple-700">
                      {(parseInt(space.basePricePerDay || '0') || 0).toLocaleString('pt-MZ')} MZN
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border">
                    <div className="text-2xl mb-1">🎭</div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-semibold text-gray-900">{space.spaceType || 'Flexível'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg text-center border">
                    <div className="text-2xl mb-1">⚡</div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${space.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {space.isActive ? 'Disponível' : 'Indisponível'}
                    </p>
                  </div>
                </div>

                {/* Equipamentos */}
                {Object.keys(getEquipment()).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Equipamentos incluídos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(getEquipment())
                        .filter(([key]) => key !== 'amenities')
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Informações de reserva */}
              <div>
                <Card className="sticky top-4 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Sua reserva</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Data do evento</span>
                        </div>
                        <span className="font-medium">
                          {date ? new Date(date).toLocaleDateString('pt-MZ') : 'Selecionar data'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Convidados</span>
                        </div>
                        <span className="font-medium">{capacity} pessoas</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Duração estimada</span>
                        </div>
                        <span className="font-medium">1 dia</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Preço */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Preço estimado</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Preço base (1 dia)</span>
                          <span className="font-medium">
                            {(parseInt(space.basePricePerDay || '0') || 0).toLocaleString('pt-MZ')} MZN
                          </span>
                        </div>
                        {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Acréscimo fim de semana</span>
                            <span className="font-medium text-amber-600">
                              +{space.weekendSurchargePercent}%
                            </span>
                          </div>
                        )}
                        {space.offersCatering && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Catering (opcional)</span>
                            <span className="font-medium">Sob consulta</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total estimado</span>
                          <span className="text-purple-600">
                            {(parseInt(space.basePricePerDay || '0') || 0).toLocaleString('pt-MZ')} MZN
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700" 
                      size="lg" 
                      onClick={handleBookNow}
                    >
                      Solicitar Reserva
                    </Button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Você será redirecionado para o formulário de solicitação
                    </p>
                  </CardContent>
                </Card>

                {/* Informações importantes */}
                <Card className="mt-4 border-purple-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Informações importantes
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Detalhes de contato disponíveis após aprovação da reserva</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-600">
                        <Package className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>Depósito de segurança: {space.securityDeposit || 'Sob consulta'}</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-600">
                        <Shield className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>Aprovação necessária: {space.approvalRequired ? 'Sim' : 'Não'}</span>
                      </li>
                      {space.alcoholAllowed !== undefined && (
                        <li className="flex items-start gap-2 text-gray-600">
                          <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span>Álcool permitido: {space.alcoholAllowed ? 'Sim' : 'Não'}</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs para mais informações */}
            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="setup" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Configurações
                </TabsTrigger>
                <TabsTrigger 
                  value="amenities" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Amenidades
                </TabsTrigger>
                <TabsTrigger 
                  value="restrictions" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Restrições
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Avaliações
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="setup" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          Capacidades por configuração
                        </h4>
                        <div className="space-y-3">
                          {space.capacityTheater && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">Teatro</span>
                              <span className="font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {space.capacityTheater} pessoas
                              </span>
                            </div>
                          )}
                          {space.capacityClassroom && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">Sala de aula</span>
                              <span className="font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {space.capacityClassroom} pessoas
                              </span>
                            </div>
                          )}
                          {space.capacityBanquet && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">Banquete</span>
                              <span className="font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {space.capacityBanquet} pessoas
                              </span>
                            </div>
                          )}
                          {space.capacityStanding && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">Cocktail</span>
                              <span className="font-medium bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                                {space.capacityStanding} pessoas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Building className="w-5 h-5 text-purple-600" />
                          Características físicas
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-600">Luz natural</span>
                            <Badge variant={space.naturalLight ? "default" : "secondary"} className={space.naturalLight ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {space.naturalLight ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-600">Palco</span>
                            <Badge variant={space.hasStage ? "default" : "secondary"} className={space.hasStage ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}>
                              {space.hasStage ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                            <span className="text-gray-600">Acesso para carga</span>
                            <Badge variant={space.loadingAccess ? "default" : "secondary"} className={space.loadingAccess ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                              {space.loadingAccess ? 'Sim' : 'Não'}
                            </Badge>
                          </div>
                          {space.dressingRooms && (
                            <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                              <span className="text-gray-600">Camarins</span>
                              <Badge className="bg-amber-100 text-amber-800">
                                {space.dressingRooms} unidades
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="amenities" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {getEquipmentAmenities().map((amenity: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                      {getEquipmentAmenities().length === 0 && (
                        <p className="text-gray-500 col-span-full text-center py-4">
                          Nenhuma amenidade listada
                        </p>
                      )}
                    </div>
                    
                    {/* Catering */}
                    {space.offersCatering && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Coffee className="w-5 h-5 text-amber-600" />
                          Serviço de Catering
                        </h4>
                        <p className="text-gray-700 mb-3">
                          Este espaço oferece serviço de catering com desconto de {space.cateringDiscountPercent || 0}%.
                        </p>
                        {getCateringMenuUrls().length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Menus disponíveis:</p>
                            <div className="flex flex-wrap gap-2">
                              {getCateringMenuUrls().map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-600 hover:text-purple-800 underline px-3 py-1 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
                                >
                                  Menu {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="restrictions" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          Eventos permitidos
                        </h4>
                        {getAllowedEventTypes().length > 0 ? (
                          <div className="space-y-2">
                            {getAllowedEventTypes().map((type, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">Todos os tipos de eventos são permitidos</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <X className="w-5 h-5 text-red-600" />
                          Eventos proibidos
                        </h4>
                        {getProhibitedEventTypes().length > 0 ? (
                          <div className="space-y-2">
                            {getProhibitedEventTypes().map((type, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                                <X className="w-4 h-4 text-red-500" />
                                <span>{type}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">Nenhuma restrição específica</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Restrições adicionais */}
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-3">Outras restrições</h4>
                      <div className="space-y-4">
                        {space.insuranceRequired && (
                          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-amber-800">Seguro obrigatório</p>
                              <p className="text-sm text-amber-700">
                                É necessário contratar seguro para o evento
                              </p>
                            </div>
                          </div>
                        )}
                        {space.noiseRestriction && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-blue-800">Restrição de ruído</p>
                              <p className="text-sm text-blue-700">{space.noiseRestriction}</p>
                            </div>
                          </div>
                        )}
                        {space.approvalRequired && (
                          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <Shield className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-purple-800">Aprovação prévia</p>
                              <p className="text-sm text-purple-700">
                                Reserva sujeita à aprovação do estabelecimento
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-4 animate-in fade-in duration-300">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Avaliações</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(getRating())}
                          <span className="text-xl font-bold">{getRating().toFixed(1)}</span>
                          <span className="text-gray-500">({getTotalReviews()} avaliações)</span>
                        </div>
                      </div>
                    </div>
                    
                    {getTotalReviews() > 0 ? (
                      <div className="space-y-4">
                        {/* Mock de avaliações */}
                        <div className="border-b pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center">
                                <span className="font-medium text-sm">ET</span>
                              </div>
                              <span className="font-medium">Empresa Tech</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">
                            "Espaço perfeito para nosso evento corporativo. Equipamentos de alta qualidade e equipe muito profissional."
                          </p>
                          <p className="text-sm text-gray-500 mt-2">Há 1 mês</p>
                        </div>
                        
                        <div className="border-b pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                                <span className="font-medium text-sm">CS</span>
                              </div>
                              <span className="font-medium">Casamento Silva</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700">
                            "Localização incrível e equipe muito prestativa. Nosso casamento foi perfeito! Espaço amplo e bem decorado."
                          </p>
                          <p className="text-sm text-gray-500 mt-2">Há 2 meses</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">⭐</div>
                        <p className="text-gray-600">Este espaço ainda não tem avaliações</p>
                        <p className="text-sm text-gray-500 mt-1">Seja o primeiro a avaliar!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-xl font-semibold mb-2">Espaço não encontrado</h3>
            <p className="text-gray-600 mb-6">
              O espaço que você está procurando não está disponível no momento.
            </p>
            <Button onClick={onClose}>Voltar para busca</Button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}