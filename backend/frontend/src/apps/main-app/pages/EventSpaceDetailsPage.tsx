import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { MapPin, Phone, Mail, Star, Users, Calendar, Ruler, Building, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { eventSpaceService, ServiceResponse } from '@/services/eventSpaceService';
import type { 
  EventSpaceDetailsResponse, 
  EventSpaceData,
  EventSpace 
} from '@/shared/types/event-spaces';

// ✅ CORREÇÃO: Criar interface Hotel baseada no que existe no EventSpace
interface Hotel {
  id?: string;
  name: string;
  address?: string;
  locality: string;
  province: string;
  contact_phone?: string;
  contact_email?: string;
  lat?: string | null;
  lng?: string | null;
  location_id?: string | null;
}

const EventSpaceDetailsPage = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // ✅ CORREÇÃO: Adicionar estado para dados do formulário de reserva
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [participants, setParticipants] = useState<number>(50);

  // ✅ CORREÇÃO: eventSpaceService.getEventSpaceDetails retorna ServiceResponse<EventSpaceDetailsResponse>
  const { 
    data: spaceDetailsResponse, 
    isLoading, 
    error 
  } = useQuery<ServiceResponse<EventSpaceDetailsResponse>, Error>({
    queryKey: ['event-space', id],
    queryFn: () => eventSpaceService.getEventSpaceDetails(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      console.error('Erro ao carregar detalhes do espaço:', error);
      toast.error('Erro ao carregar detalhes do espaço');
      setLocation('/event-spaces/search');
    }
    
    // ✅ Tratar erro na resposta do service
    if (spaceDetailsResponse?.success === false && spaceDetailsResponse?.error) {
      console.error('Erro na resposta do service:', spaceDetailsResponse.error);
      toast.error(spaceDetailsResponse.error || 'Erro ao carregar detalhes do espaço');
      setLocation('/event-spaces/search');
    }
  }, [error, spaceDetailsResponse, setLocation]);

  // ✅ CORREÇÃO: Extrair dados corretamente da resposta
  // spaceDetailsResponse é ServiceResponse<EventSpaceDetailsResponse>
  const spaceDetails: EventSpaceDetailsResponse | null = 
    spaceDetailsResponse?.success && spaceDetailsResponse.data 
      ? spaceDetailsResponse.data
      : null;

  // ✅ CORREÇÃO: Acessar os dados corretamente
  const space: EventSpaceData | EventSpace | null = spaceDetails?.space || null;
  const hotel: Hotel | null = spaceDetails?.hotel || null;

  // ✅ FUNÇÃO ADICIONADA: Manipular clique no botão "Continuar para detalhes"
  const handleContinueToDetails = () => {
    if (!selectedDates.start || !selectedDates.end) {
      toast.error('Por favor, selecione as datas do evento');
      return;
    }

    if (!participants || participants < 1) {
      toast.error('Por favor, informe o número de participantes');
      return;
    }

    // ✅ CORREÇÃO: Construir URL com parâmetros de reserva
    const params = new URLSearchParams({
      startDate: selectedDates.start.toISOString(),
      endDate: selectedDates.end.toISOString(),
      participants: participants.toString(),
    });

    // ✅ Navegar para página de reserva com parâmetros
    setLocation(`/event-spaces/${id}/book?${params.toString()}`);
  };

  // ✅ FUNÇÃO ADICIONADA: Manipular solicitação de reserva imediata
  const handleBookNow = () => {
    if (!space) return;
    
    // Navegar para página de reserva com dados pré-preenchidos
    setLocation(`/event-spaces/${id}/book?step=1`);
  };

  // ✅ Tratar estado de loading
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Cabeçalho loading */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Galeria loading */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>

          {/* Cards de informações loading */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-8 w-8 mb-2 rounded-full" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
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

  // ✅ Tratar erro ou dados não encontrados
  if (!spaceDetailsResponse?.success || !space || !hotel) {
    const errorMessage = spaceDetailsResponse?.error || 'Espaço de evento não encontrado';
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Erro ao carregar espaço
            </CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center text-muted-foreground">
                O espaço que procura não existe ou ocorreu um erro ao carregar os dados.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setLocation('/event-spaces/search')} 
                  className="mx-auto"
                  variant="default"
                >
                  Voltar para busca
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mx-auto"
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ SECÇÃO ADICIONADA: Formulário para reserva rápida (antes do conteúdo principal)
  const renderQuickBookingForm = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return (
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Data de Início
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-md"
                min={today}
                value={selectedDates.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => setSelectedDates({
                  ...selectedDates,
                  start: e.target.value ? new Date(e.target.value) : null,
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Data de Término
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-md"
                min={selectedDates.start?.toISOString().split('T')[0] || today}
                value={selectedDates.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => setSelectedDates({
                  ...selectedDates,
                  end: e.target.value ? new Date(e.target.value) : null,
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Número de Participantes
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setParticipants(Math.max(1, participants - 1))}
                  disabled={participants <= 1}
                >
                  -
                </Button>
                <input
                  type="number"
                  min="1"
                  max={space.capacityMax || 500}
                  value={participants}
                  onChange={(e) => setParticipants(parseInt(e.target.value) || 1)}
                  className="flex-1 text-center p-2 border rounded-md"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setParticipants(Math.min(space.capacityMax || 500, participants + 1))}
                  disabled={participants >= (space.capacityMax || 500)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Capacidade máxima: {space.capacityMax} pessoas
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleContinueToDetails}
              size="lg"
              className="px-8"
            >
              Continuar para detalhes
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ou <Button variant="link" className="p-0 h-auto" onClick={handleBookNow}>solicite uma cotação personalizada</Button>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Função para extrair amenities com fallback seguro
  const getAmenities = (): string[] => {
    if (!space) return [];
    
    // ✅ CORREÇÃO: Garantir que amenities sempre seja um array
    if (Array.isArray((space as EventSpaceData).amenities)) {
      return (space as EventSpaceData).amenities;
    }
    
    // Fallback para campo alternativo se existir
    if (Array.isArray((space as any).amenitiesList)) {
      return (space as any).amenitiesList;
    }
    
    // Fallback para amenities do response
    if (spaceDetails && Array.isArray(spaceDetails.amenities)) {
      return spaceDetails.amenities;
    }
    
    return [];
  };

  // Função para extrair campos de rating com fallback
  const getRatingInfo = () => {
    if (!space) return { rating: 0, reviewCount: 0, bookingCount: 0 };
    
    const spaceData = space as EventSpaceData;
    
    return {
      rating: spaceData.rating || spaceData.average_rating || 0,
      reviewCount: spaceData.totalReviews || spaceData.review_count || 0,
      bookingCount: spaceData.total_bookings || 0
    };
  };

  // Função para extrair informações de localização
  const getLocationInfo = () => {
    if (!hotel) return { address: '', locality: '', province: '' };
    
    return {
      address: hotel.address || '',
      locality: hotel.locality || '',
      province: hotel.province || ''
    };
  };

  // Função para extrair campos de catering
  const getCateringInfo = () => {
    if (!space) return { offersCatering: false, discountPercent: 0, menuUrls: [] };
    
    return {
      offersCatering: space.offersCatering || false,
      discountPercent: space.cateringDiscountPercent || 0,
      menuUrls: space.cateringMenuUrls || []
    };
  };

  // Função para extrair campos de preço
  const getPriceInfo = () => {
    if (!space) return { basePrice: '0', weekendSurcharge: 0, securityDeposit: '0' };
    
    const spaceData = space as EventSpaceData;
    
    return {
      basePrice: spaceData.basePricePerDay || '0',
      weekendSurcharge: spaceData.weekendSurchargePercent || 0,
      securityDeposit: spaceData.securityDeposit || spaceDetails?.security_deposit || '0'
    };
  };

  // Função para extrair outras informações úteis
  const getOtherInfo = () => {
    if (!space) return { 
      facilities: [] as string[], 
      accessibilityFeatures: [] as string[], 
      nearbyAttractions: [] as string[] 
    };
    
    const spaceData = space as EventSpaceData;
    
    return {
      facilities: Array.isArray(spaceData.facilities) ? spaceData.facilities : [],
      accessibilityFeatures: Array.isArray(spaceData.accessibility_features) ? spaceData.accessibility_features : [],
      nearbyAttractions: Array.isArray(spaceData.nearby_attractions) ? spaceData.nearby_attractions : [],
      parkingInfo: spaceData.parking_info || null,
      publicTransportInfo: spaceData.public_transport_info || null
    };
  };

  // Extrair dados para renderização
  const amenities = getAmenities();
  const ratingInfo = getRatingInfo();
  const locationInfo = getLocationInfo();
  const cateringInfo = getCateringInfo();
  const priceInfo = getPriceInfo();
  const otherInfo = getOtherInfo();

  // ✅ Função de formatação de preço
  const formatPrice = (price: string | number): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{space.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{hotel.name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {locationInfo.address ? `${locationInfo.address}, ` : ''}
                {locationInfo.locality ? `${locationInfo.locality}, ` : ''}
                {locationInfo.province || 'Localização não especificada'}
              </span>
            </div>
            {ratingInfo.rating && ratingInfo.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{ratingInfo.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({ratingInfo.bookingCount} eventos)</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBookNow}>Solicitar Reserva</Button>
          </div>
        </div>
      </div>

      {/* ✅ FORMULÁRIO DE RESERVA RÁPIDA ADICIONADO */}
      {renderQuickBookingForm()}

      {/* Galeria de Imagens */}
      {space.images && space.images.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {space.images.slice(0, 3).map((img: string, index: number) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={img}
                  alt={`${space.name} - Imagem ${index + 1}`}
                  className="w-full h-48 md:h-64 object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(space.name)}`;
                  }}
                />
              </div>
            ))}
          </div>
          {space.images.length > 3 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              + {space.images.length - 3} mais imagens disponíveis
            </p>
          )}
        </div>
      )}

      {/* Informações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Users className="h-8 w-8 mb-2 text-primary" />
              <span className="text-2xl font-bold">{space.capacityMax || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">Capacidade Máxima</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Ruler className="h-8 w-8 mb-2 text-primary" />
              <span className="text-2xl font-bold">{space.areaSqm || 'N/A'}</span>
              <span className="text-sm text-muted-foreground">Área (m²)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-8 w-8 mb-2 flex items-center justify-center">
                <span className="text-lg font-bold">MZN</span>
              </div>
              <span className="text-2xl font-bold">
                {formatPrice(priceInfo.basePrice).split(',')[0]}
              </span>
              <span className="text-sm text-muted-foreground">Preço por dia</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <span className="text-2xl font-bold">{ratingInfo.bookingCount || 0}</span>
              <span className="text-sm text-muted-foreground">Eventos Realizados</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="amenities">Comodidades</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Espaço</CardTitle>
              <CardDescription>
                Informações detalhadas sobre este espaço para eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">
                {space.description || 'Sem descrição disponível.'}
              </p>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Informações do Local</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Hotel</p>
                        <p className="font-medium">{hotel.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Endereço</p>
                        <p className="font-medium">
                          {locationInfo.address || 'Endereço não especificado'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg mt-2">
                      <p className="text-sm text-muted-foreground">
                        Contactos disponíveis apenas após solicitação de reserva aprovada.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Especificações Técnicas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Capacidade:</span>
                      <span className="font-medium">
                        {space.capacityMin} - {space.capacityMax} pessoas
                      </span>
                    </div>
                    {space.areaSqm && (
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground">Área:</span>
                        <span className="font-medium">{space.areaSqm} m²</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Tipo de Espaço:</span>
                      <span className="font-medium">{space.spaceType || 'Flexível'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalhes */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Características do Espaço</CardTitle>
              <CardDescription>
                Configurações, equipamento e regras específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Configurações Disponíveis</h4>
                    {space.setupOptions && space.setupOptions.length > 0 ? (
                      <div className="space-y-2">
                        {space.setupOptions.map((setup: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span>{setup}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">Configurações padrão disponíveis</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Equipamento Incluído</h4>
                    {space.equipment && Object.keys(space.equipment).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(space.equipment).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium">{key}:</span>
                            <span className="text-sm">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">Equipamento básico disponível</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Restrições e Regras</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>Álcool Permitido:</span>
                        <Badge variant={space.alcoholAllowed ? "default" : "destructive"}>
                          {space.alcoholAllowed ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>Seguro Obrigatório:</span>
                        <Badge variant={space.insuranceRequired ? "default" : "secondary"}>
                          {space.insuranceRequired ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span>Aprovação Necessária:</span>
                        <Badge variant={space.approvalRequired ? "default" : "secondary"}>
                          {space.approvalRequired ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mostrar informações adicionais se disponíveis */}
                  {otherInfo.facilities.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Instalações</h4>
                      <div className="space-y-2">
                        {otherInfo.facilities.map((facility: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm">{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {otherInfo.accessibilityFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Acessibilidade</h4>
                      <div className="space-y-2">
                        {otherInfo.accessibilityFeatures.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comodidades */}
        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Comodidades e Serviços</CardTitle>
              <CardDescription>
                Serviços e facilidades disponíveis para seu evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {amenities.map((amenity: string, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhuma comodidade listada</h3>
                  <p className="text-muted-foreground">
                    Este espaço ainda não cadastrou suas comodidades específicas.
                  </p>
                </div>
              )}
              
              {cateringInfo.offersCatering && (
                <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-3 text-lg">Serviço de Catering Disponível</h4>
                  <p className="text-muted-foreground mb-4">
                    Este espaço oferece serviço de catering com qualidade garantida.
                  </p>
                  
                  {cateringInfo.discountPercent > 0 && (
                    <div className="mb-4">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-2">
                        {cateringInfo.discountPercent}% de desconto em catering
                      </Badge>
                    </div>
                  )}
                  
                  {cateringInfo.menuUrls && cateringInfo.menuUrls.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Menus disponíveis para consulta:</p>
                      <div className="flex flex-wrap gap-3">
                        {cateringInfo.menuUrls.map((url: string, index: number) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-background border rounded-lg hover:bg-accent transition-colors"
                          >
                            Menu {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Mostrar informações de estacionamento e transporte se disponíveis */}
              {(otherInfo.parkingInfo || otherInfo.publicTransportInfo) && (
                <div className="mt-8 p-6 bg-muted/50 border rounded-lg">
                  <h4 className="font-semibold mb-3">Informações de Acesso</h4>
                  {otherInfo.parkingInfo && (
                    <div className="mb-3">
                      <p className="font-medium mb-1">Estacionamento:</p>
                      <p className="text-sm text-muted-foreground">{otherInfo.parkingInfo}</p>
                    </div>
                  )}
                  {otherInfo.publicTransportInfo && (
                    <div>
                      <p className="font-medium mb-1">Transporte Público:</p>
                      <p className="text-sm text-muted-foreground">{otherInfo.publicTransportInfo}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preços */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Preços</CardTitle>
              <CardDescription>
                Detalhes sobre custos e processo de reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Preço Base</h4>
                      <div className="text-4xl font-bold text-primary">
                        {formatPrice(priceInfo.basePrice)}
                        <span className="text-lg font-normal text-muted-foreground"> / dia</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Preço para reserva em dias úteis
                      </p>
                    </div>
                    
                    {priceInfo.weekendSurcharge && priceInfo.weekendSurcharge > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Acréscimo de fim de semana:</span>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            +{priceInfo.weekendSurcharge}%
                          </Badge>
                        </div>
                        <p className="text-sm text-amber-700">
                          Aplicado em reservas aos sábados e domingos
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Depósito de Segurança</h4>
                      <div className="text-3xl font-bold">
                        {formatPrice(priceInfo.securityDeposit)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Reembolsável após o evento, sujeito às condições do espaço
                      </p>
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          O depósito é devolvido em até 7 dias úteis após o evento, desde que não haja danos ao espaço.
                        </p>
                      </div>
                    </div>
                    
                    {cateringInfo.offersCatering && cateringInfo.discountPercent > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Desconto em catering:</span>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {cateringInfo.discountPercent}% OFF
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700">
                          Desconto exclusivo para clientes que reservam este espaço
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-4 text-lg">Processo de Reserva</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Solicitação</p>
                        <p className="text-sm text-muted-foreground">
                          Preencha o formulário de reserva com os detalhes do seu evento
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Aprovação</p>
                        <p className="text-sm text-muted-foreground">
                          O hotel analisará sua solicitação e entrará em contacto em até 24h
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Pagamento</p>
                        <p className="text-sm text-muted-foreground">
                          Após aprovação, será solicitado o depósito para confirmar a reserva
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Confirmação</p>
                        <p className="text-sm text-muted-foreground">
                          Receba a confirmação final e todos os detalhes do seu evento
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Reserva Fixo no Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 md:hidden z-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{space.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(priceInfo.basePrice)} / dia
              </p>
            </div>
            <Button onClick={handleBookNow} size="sm" className="px-6">
              Solicitar Reserva
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceDetailsPage;