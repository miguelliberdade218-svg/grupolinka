// src/apps/main-app/pages/HotelDetailsPage.tsx - VERSÃO COM FOTOS DOS QUARTOS
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { 
  MapPin, Phone, Mail, Star, Users, Calendar, Home, Shield, 
  Coffee, Wifi, Image as ImageIcon, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';

// ✅ IMPORTAÇÃO DA GALERIA PROFISSIONAL
import { HotelPhotoGallery } from '@/apps/main-app/components/HotelPhotoGallery';

// Serviços e tipos
import { hotelService } from '@/services/hotelService';
import { photoGalleryService } from '@/services/photoGalleryService';
import type { Hotel, RoomType, ListResponse } from '@/services/hotelService';
import type { HotelPhoto, RoomTypePhoto } from '@/shared/types/hotel-photos';

// ✅ Interface para RoomType com fotos
interface RoomTypeWithPhotos extends RoomType {
  photos?: RoomTypePhoto[];
  loadingPhotos?: boolean;
}

const HotelDetailsPage = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // ✅ Estado para fotos do hotel
  const [hotelPhotos, setHotelPhotos] = useState<HotelPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  // ✅ Estado para fotos dos quartos
  const [roomTypesWithPhotos, setRoomTypesWithPhotos] = useState<RoomTypeWithPhotos[]>([]);
  const [loadingRoomPhotos, setLoadingRoomPhotos] = useState<Record<string, boolean>>({});

  // ✅ Buscar dados do hotel
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

  // ✅ Buscar tipos de quarto
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

  // ✅ FUNÇÃO AUXILIAR: Converter RoomTypePhoto para HotelPhoto
  const convertRoomTypePhotoToHotelPhoto = (photo: RoomTypePhoto, hotelId: string): HotelPhoto => {
    return {
      id: photo.id,
      hotel_id: hotelId,
      url: photo.url,
      alt_text: photo.alt_text,
      is_primary: photo.is_primary,
      is_featured: photo.is_featured,
      order: photo.order,
      created_at: photo.created_at,
      updated_at: photo.updated_at,
    };
  };

  // ✅ BUSCAR FOTOS DO HOTEL
  useEffect(() => {
    const loadHotelPhotos = async () => {
      if (!id || !hotel) return;
      
      setLoadingPhotos(true);
      
      try {
        console.log(`📸 [HotelDetails] Carregando fotos para hotel ${id}`);
        const photos = await photoGalleryService.getHotelPhotos(id);
        
        if (photos && photos.length > 0) {
          console.log(`✅ [HotelDetails] ${photos.length} fotos carregadas do serviço`);
          const convertedPhotos: HotelPhoto[] = photos.map(photo => 
            convertRoomTypePhotoToHotelPhoto(photo, id)
          );
          setHotelPhotos(convertedPhotos);
        } else if (hotel?.images && hotel.images.length > 0) {
          console.log(`📸 [HotelDetails] Usando ${hotel.images.length} imagens de fallback`);
          const fallbackPhotos: HotelPhoto[] = hotel.images.map((url, index) => ({
            id: `hotel-fallback-${index}`,
            hotel_id: id,
            url: url,
            alt_text: `${hotel.name} - Foto ${index + 1}`,
            is_primary: index === 0,
            is_featured: index < 3,
            order: index,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
          setHotelPhotos(fallbackPhotos);
        }
      } catch (error) {
        console.error('❌ [HotelDetails] Erro ao carregar fotos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    if (hotel) {
      loadHotelPhotos();
    }
  }, [id, hotel]);

  // ✅ BUSCAR FOTOS DOS QUARTOS QUANDO OS ROOM TYPES CARREGAREM
  useEffect(() => {
    const loadRoomTypePhotos = async () => {
      if (!roomTypesResponse?.success || !roomTypesResponse.data) return;
      
      const roomTypes = roomTypesResponse.data;
      console.log(`📸 [HotelDetails] Carregando fotos para ${roomTypes.length} quartos`);
      
      // Inicializar roomTypesWithPhotos com os dados básicos
      setRoomTypesWithPhotos(roomTypes.map(rt => ({ ...rt, photos: [], loadingPhotos: true })));
      
      // Carregar fotos para cada room type
      for (const roomType of roomTypes) {
        setLoadingRoomPhotos(prev => ({ ...prev, [roomType.id]: true }));
        
        try {
          console.log(`📸 [HotelDetails] Carregando fotos do quarto ${roomType.id} - ${roomType.name}`);
          const photos = await photoGalleryService.getRoomTypePhotos(roomType.id);
          
          setRoomTypesWithPhotos(prev => 
            prev.map(rt => 
              rt.id === roomType.id 
                ? { ...rt, photos: photos || [], loadingPhotos: false }
                : rt
            )
          );
          
          console.log(`✅ [HotelDetails] ${photos?.length || 0} fotos carregadas para ${roomType.name}`);
        } catch (error) {
          console.error(`❌ [HotelDetails] Erro ao carregar fotos do quarto ${roomType.id}:`, error);
          setRoomTypesWithPhotos(prev => 
            prev.map(rt => 
              rt.id === roomType.id 
                ? { ...rt, photos: [], loadingPhotos: false }
                : rt
            )
          );
        } finally {
          setLoadingRoomPhotos(prev => ({ ...prev, [roomType.id]: false }));
        }
      }
    };

    loadRoomTypePhotos();
  }, [roomTypesResponse]);

  const roomTypes = roomTypesWithPhotos;
  const isLoading = isLoadingHotel || isLoadingRoomTypes;
  const loadingRoomTypes = isLoadingRoomTypes;

  // ✅ Efeito para erros
  useEffect(() => {
    if (isHotelError && hotelError) {
      console.error('Erro ao carregar hotel:', hotelError);
      toast.error('Erro ao carregar detalhes do hotel');
      setLocation('/hotels/search');
    }
    
    if (isRoomTypesError && roomTypesError) {
      console.error('Erro ao carregar tipos de quarto:', roomTypesError);
      if (!isHotelError) {
        toast.error('Erro ao carregar tipos de quarto');
      }
    }
  }, [isHotelError, hotelError, isRoomTypesError, roomTypesError, setLocation]);

  // ✅ Funções de auxílio
  const handleBookNow = () => {
    if (!hotel) return;
    setLocation(`/hotels/${id}/book?step=1`);
  };

  const handleBookRoom = (roomTypeId: string) => {
    setLocation(`/hotels/${id}/book?roomTypeId=${roomTypeId}`);
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

  const formatPrice = (price: string | number) => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  // ✅ Componente para minigaleria do quarto
  const RoomPhotoGallery: React.FC<{ room: RoomTypeWithPhotos }> = ({ room }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    
    const photos = room.photos || [];
    const loading = loadingRoomPhotos[room.id];
    
    if (loading) {
      return (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    
    if (!photos.length) {
      return (
        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Sem fotos</p>
          </div>
        </div>
      );
    }
    
    const goToPrevious = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
    };
    
    const goToNext = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
    };
    
    const getImageUrl = (photo: RoomTypePhoto, index: number): string => {
      if (imageErrors[index]) {
        return `https://via.placeholder.com/400x300?text=${encodeURIComponent(room.name)}`;
      }
      if (photo.url.startsWith('/')) {
        return `http://localhost:8000${photo.url}`;
      }
      return photo.url;
    };
    
    return (
      <div className="relative h-32 rounded-lg overflow-hidden group">
        <img
          src={getImageUrl(photos[currentIndex], currentIndex)}
          alt={photos[currentIndex].alt_text || room.name}
          className="w-full h-full object-cover"
          onError={() => setImageErrors(prev => ({ ...prev, [currentIndex]: true }))}
        />
        
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {currentIndex + 1}/{photos.length}
            </div>
          </>
        )}
        
        {photos[currentIndex]?.is_primary && (
          <div className="absolute top-1 left-1 bg-orange-600 text-white text-xs px-1.5 py-0.5 rounded">
            Principal
          </div>
        )}
      </div>
    );
  };

  // ✅ Estado de loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-[500px] w-full rounded-xl" />
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
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
      {/* Galeria do Hotel */}
      <div className="mb-8">
        {loadingPhotos ? (
          <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Carregando fotos do hotel...</p>
              </div>
            </div>
          </div>
        ) : hotelPhotos.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <HotelPhotoGallery
              photos={hotelPhotos}
              title={hotel.name}
              mode="full"
              className="w-full"
            />
          </div>
        ) : (
          <div className="relative w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Galeria não disponível</h3>
              <p className="text-gray-500">
                Este hotel ainda não possui fotos cadastradas.
              </p>
            </div>
          </div>
        )}
      </div>

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

        {/* Visão Geral - mantido igual */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Hotel</CardTitle>
              <CardDescription>
                Informações detalhadas sobre o estabelecimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ... conteúdo mantido ... */}
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {hotel.description || 'Sem descrição disponível.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quartos - AGORA COM FOTOS */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Quarto Disponíveis</CardTitle>
              <CardDescription>
                {loadingRoomTypes 
                  ? 'Carregando tipos de quarto...' 
                  : `${roomTypes.length} tipo${roomTypes.length !== 1 ? 's' : ''} disponível${roomTypes.length !== 1 ? 'is' : ''}`
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
                  {roomTypes.map((room: RoomTypeWithPhotos) => (
                    <Card key={room.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* ✅ FOTOS DO QUARTO */}
                          <div className="lg:w-1/3">
                            <RoomPhotoGallery room={room} />
                          </div>
                          
                          {/* Informações do Quarto */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                              <div className="mb-4">
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
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleBookRoom(room.id)}
                                disabled={!room.is_active}
                                className="flex-1"
                              >
                                Selecionar Quarto
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  const photoCount = room.photos?.length || 0;
                                  toast.info(
                                    <div>
                                      <p className="font-semibold">{room.name}</p>
                                      <p className="text-sm">{photoCount} foto{photoCount !== 1 ? 's' : ''} disponível{photoCount !== 1 ? 'is' : ''}</p>
                                    </div>
                                  );
                                }}
                              >
                                Ver Preços
                              </Button>
                            </div>
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

        {/* Comodidades - mantido igual */}
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

        {/* Políticas - mantido igual */}
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