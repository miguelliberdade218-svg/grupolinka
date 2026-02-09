// src/apps/main-app/pages/HotelDetailsPage.tsx - VERSÃO CORRIGIDA COM IMPORT CORRETO
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { MapPin, Phone, Mail, Star, Users, Calendar, Home, Shield, Coffee, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { hotelService } from '@/services/hotelService'; // ✅ CORREÇÃO: Importação nomeada
import type { Hotel, RoomType, ListResponse } from '@/services/hotelService';

const HotelDetailsPage = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ CORREÇÃO: hotelService.getHotelById retorna Hotel diretamente
  const { 
    data: hotel, 
    isLoading: isLoadingHotel, 
    error: hotelError,
    isError: isHotelError
  } = useQuery<Hotel, Error>({
    queryKey: ['hotel', id],
    queryFn: () => hotelService.getHotelById(id!),
    enabled: !!id,
    retry: 1,
  });

  // ✅ CORREÇÃO: hotelService.getRoomTypesByHotel retorna ListResponse<RoomType>
  const { 
    data: roomTypesResponse, 
    isLoading: isLoadingRoomTypes,
    error: roomTypesError,
    isError: isRoomTypesError
  } = useQuery<ListResponse<RoomType>, Error>({
    queryKey: ['hotel-room-types', id],
    queryFn: () => hotelService.getRoomTypesByHotel(id!),
    enabled: !!id,
    retry: 1,
  });

  // ✅ CORREÇÃO CRÍTICA: Extrair dados corretamente da resposta
  const roomTypes = roomTypesResponse?.success 
    ? roomTypesResponse.data || [] 
    : [];

  const isLoading = isLoadingHotel || isLoadingRoomTypes;
  const loadingRoomTypes = isLoadingRoomTypes;

  useEffect(() => {
    if (isHotelError && hotelError) {
      console.error('Erro ao carregar hotel:', hotelError);
      toast.error('Erro ao carregar detalhes do hotel');
      setLocation('/hotels/search');
    }
    
    if (isRoomTypesError && roomTypesError) {
      console.error('Erro ao carregar tipos de quarto:', roomTypesError);
      
      // Mostrar erro apenas se não for um hotel inválido
      if (!isHotelError) {
        toast.error('Erro ao carregar tipos de quarto');
      }
    }
  }, [isHotelError, hotelError, isRoomTypesError, roomTypesError, setLocation]);

  // ✅ Funções de auxílio
  const handleBookNow = () => {
    if (!hotel) return;
    
    // Navegar para página de reserva
    setLocation(`/hotels/${id}/book?step=1`);
  };

  const handleContactHotel = () => {
    if (!hotel?.contact_phone && !hotel?.contact_email) {
      toast.error('Informações de contacto não disponíveis');
      return;
    }
    
    toast.info(
      <div className="space-y-2">
        <p className="font-semibold">Contacte o hotel:</p>
        {hotel.contact_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <a href={`tel:${hotel.contact_phone}`} className="text-blue-600 hover:underline">
              {hotel.contact_phone}
            </a>
          </div>
        )}
        {hotel.contact_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <a href={`mailto:${hotel.contact_email}`} className="text-blue-600 hover:underline">
              {hotel.contact_email}
            </a>
          </div>
        )}
      </div>,
      { duration: 10000 }
    );
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (lowerAmenity.includes('café') || lowerAmenity.includes('coffee')) return <Coffee className="h-4 w-4" />;
    if (lowerAmenity.includes('segurança') || lowerAmenity.includes('security')) return <Shield className="h-4 w-4" />;
    return <Home className="h-4 w-4" />;
  };

  // ✅ Função auxiliar para formatação de preço
  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  // ✅ Função para fallback de imagem (CORRIGIDA)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, index: number, hotelName: string) => {
    const target = e.target as HTMLImageElement;
    
    // Fallback para imagem local
    target.src = `/placeholder-hotel-${(index % 3) + 1}.jpg`;
    
    // Se fallback local falhar, usa SVG inline
    target.onerror = () => {
      const safeHotelName = hotelName.substring(0, 20).replace(/[^\w\s]/gi, '');
      target.src = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
          <rect width="400" height="300" fill="#f3f4f6"/>
          <text x="200" y="150" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">
            ${safeHotelName}
          </text>
        </svg>
      `)}`;
    };
  };

  // ✅ Estado de loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Cabeçalho loading */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Galeria loading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>

          {/* Conteúdo loading */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // ✅ Hotel não encontrado
  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Hotel não encontrado</CardTitle>
            <CardDescription>
              O hotel que procura não existe ou foi removido.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center text-muted-foreground">
                Verifique o ID do hotel ou volte para a página de busca.
              </p>
              <Button 
                onClick={() => setLocation('/hotels/search')} 
                className="mx-auto"
                variant="outline"
              >
                Voltar para busca
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{hotel.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {hotel.address ? `${hotel.address}, ` : ''}
                {hotel.locality ? `${hotel.locality}, ` : ''}
                {hotel.province || 'Localização não especificada'}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {/* ✅ CORREÇÃO 1: Verificação robusta de hotel.rating antes de usar .toFixed() */}
              {hotel.rating !== null && hotel.rating !== undefined && hotel.rating > 0 && (
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">
                    {typeof hotel.rating === 'number' ? hotel.rating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({hotel.total_reviews || 0} avaliações)
                  </span>
                </div>
              )}
              
              {hotel.is_active !== false && (
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Ativo
                </Badge>
              )}
              
              {/* ✅ CORREÇÃO 3: Verificação robusta para badge recomendado */}
              {hotel.rating !== null && hotel.rating !== undefined && hotel.rating >= 4 && (
                <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                  Recomendado
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleContactHotel} className="sm:w-auto">
              <Phone className="h-4 w-4 mr-2" />
              Contactar
            </Button>
            <Button onClick={handleBookNow} className="sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Reservar Agora
            </Button>
          </div>
        </div>
      </div>

      {/* Galeria de Imagens */}
      {hotel.images && hotel.images.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotel.images.slice(0, 3).map((img: string, index: number) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={img}
                  alt={`${hotel.name} - Imagem ${index + 1}`}
                  className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                  // ✅ CORREÇÃO 2: Fallback robusto para imagens
                  onError={(e) => handleImageError(e, index, hotel.name)}
                />
              </div>
            ))}
          </div>
          {hotel.images.length > 3 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              + {hotel.images.length - 3} mais imagens disponíveis
            </p>
          )}
        </div>
      )}

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">
            <Home className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <Users className="h-4 w-4 mr-2" />
            Quartos
          </TabsTrigger>
          <TabsTrigger value="amenities">
            <Wifi className="h-4 w-4 mr-2" />
            Comodidades
          </TabsTrigger>
          <TabsTrigger value="policies">
            <Shield className="h-4 w-4 mr-2" />
            Políticas
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Hotel</CardTitle>
              <CardDescription>
                Informações detalhadas sobre o estabelecimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {hotel.description || 'Sem descrição disponível.'}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações de Contacto</h3>
                  <div className="space-y-3">
                    {hotel.contact_email && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <a 
                            href={`mailto:${hotel.contact_email}`} 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {hotel.contact_email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {hotel.contact_phone && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Telefone</p>
                          <a 
                            href={`tel:${hotel.contact_phone}`} 
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {hotel.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Horários e Localização</h3>
                  <div className="space-y-3">
                    {hotel.check_in_time && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Check-in</p>
                          <p className="text-sm">{hotel.check_in_time}</p>
                        </div>
                      </div>
                    )}
                    
                    {hotel.check_out_time && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Check-out</p>
                          <p className="text-sm">{hotel.check_out_time}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Localização</p>
                        <p className="text-sm">
                          {hotel.locality || 'N/A'}, {hotel.province || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quartos */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Quarto Disponíveis</CardTitle>
              <CardDescription>
                {loadingRoomTypes 
                  ? 'Carregando tipos de quarto...' 
                  : `${roomTypes.length} tipo${roomTypes.length !== 1 ? 's' : ''} disponível${roomTypes.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRoomTypes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex gap-4 mt-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : roomTypes.length > 0 ? (
                <div className="space-y-4">
                  {roomTypes.map((room: RoomType) => (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{room.name || 'Quarto sem nome'}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {room.description || 'Sem descrição disponível'}
                                </p>
                              </div>
                              <Badge 
                                variant={room.is_active ? "default" : "secondary"}
                                className={room.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                              >
                                {room.is_active ? 'Disponível' : 'Indisponível'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Capacidade</p>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">{room.capacity || 'N/A'} pessoas</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Unidades</p>
                                <span className="font-medium">{room.total_units || 'N/A'}</span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Noites Mínimas</p>
                                <span className="font-medium">{room.min_nights || 'N/A'}</span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Preço Base</p>
                                <span className="font-medium text-primary">
                                  {formatPrice(room.base_price || '0')}/noite
                                </span>
                              </div>
                            </div>
                            
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs text-muted-foreground mb-1">Comodidades do Quarto</p>
                                <div className="flex flex-wrap gap-2">
                                  {room.amenities.slice(0, 4).map((amenity: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {amenity}
                                    </Badge>
                                  ))}
                                  {room.amenities.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{room.amenities.length - 4} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Button 
                              onClick={() => setLocation(`/hotels/${id}/book?roomTypeId=${room.id}`)}
                              disabled={!room.is_active}
                              className="w-full md:w-auto"
                            >
                              Selecionar Quarto
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toast.info(`Preço detalhado para ${room.name}: ${formatPrice(room.base_price || '0')} por noite`)}
                              className="w-full md:w-auto"
                            >
                              Ver Preços
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum quarto disponível</h3>
                  <p className="text-muted-foreground mb-6">
                    Não há tipos de quarto cadastrados para este hotel no momento.
                  </p>
                  <Button variant="outline" onClick={() => setLocation('/hotels/search')}>
                    Voltar para Hotéis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comodidades */}
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Comodidades do Hotel</CardTitle>
              <CardDescription>
                Serviços e facilidades disponíveis para sua estadia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hotel.amenities && hotel.amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {hotel.amenities.map((amenity: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wifi className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma comodidade listada</h3>
                  <p className="text-muted-foreground">
                    Este hotel ainda não cadastrou suas comodidades.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Políticas */}
        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Políticas do Hotel</CardTitle>
              <CardDescription>
                Regras e condições importantes para sua estadia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hotel.policies ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line p-4 bg-muted/30 rounded-lg">
                    {hotel.policies}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Informações Adicionais</h3>
                      <ul className="space-y-2">
                        {hotel.check_in_time && (
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Check-in:</span>
                            <span className="font-medium">{hotel.check_in_time}</span>
                          </li>
                        )}
                        {hotel.check_out_time && (
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span className="font-medium">{hotel.check_out_time}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Contacto</h3>
                      <ul className="space-y-2">
                        {hotel.contact_email && (
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <a 
                              href={`mailto:${hotel.contact_email}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {hotel.contact_email}
                            </a>
                          </li>
                        )}
                        {hotel.contact_phone && (
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Telefone:</span>
                            <a 
                              href={`tel:${hotel.contact_phone}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {hotel.contact_phone}
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Políticas não disponíveis</h3>
                  <p className="text-muted-foreground mb-6">
                    Este hotel ainda não cadastrou suas políticas.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Entre em contacto diretamente com o hotel para mais informações.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Reserva Fixo no Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 md:hidden z-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{hotel.name}</p>
              <p className="text-xs text-muted-foreground">
                {roomTypes.length > 0 && roomTypes[0]?.base_price
                  ? `A partir de ${formatPrice(roomTypes[0].base_price)}`
                  : 'Preços não disponíveis'
                }
              </p>
            </div>
            <Button 
              onClick={handleBookNow} 
              size="sm" 
              className="px-6"
              disabled={roomTypes.length === 0}
            >
              {roomTypes.length === 0 ? 'Sem quartos' : 'Reservar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailsPage;