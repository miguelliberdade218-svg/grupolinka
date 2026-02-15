// src/apps/main-app/pages/BookingConfirmationPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Loader2, CheckCircle, Calendar, Users, Mail, Phone, Home, Building, CreditCard, Printer, Download, AlertCircle, ChevronLeft, Hotel, PartyPopper } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { hotelService } from '@/services/hotelService';
import { eventSpaceService, ServiceResponse } from '@/services/eventSpaceService';
import type { HotelBooking } from '@/shared/types/bookings';
import type { EventBooking } from '@/shared/types/event-spaces';

// ✅ CORREÇÃO: Tipos para a página
type BookingType = 'hotel' | 'event';

// ✅ CORREÇÃO: Interface extendida para incluir weekend_surcharge
interface ExtendedEventBooking extends EventBooking {
  weekend_surcharge?: string;
}

interface HotelDetails {
  id: string;
  name: string;
  locality: string;
  province: string;
  contact_email?: string;
  contact_phone?: string;
  check_in_time?: string;
}

interface SpaceDetails {
  id: string;
  name: string;
  capacity_min: number;
  capacity_max: number;
}

interface HotelBookingResponse {
  success: boolean;
  data?: HotelBooking;
  error?: string;
  _hotelInfo?: HotelDetails;
}

interface BookingData {
  id: string;
  type: BookingType;
  booking: HotelBooking | ExtendedEventBooking;
  hotel?: HotelDetails;
  space?: SpaceDetails;
}

const BookingConfirmationPage = () => {
  const params = useParams<{ id?: string; type?: string; bookingId?: string }>();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORREÇÃO: Detectar qual rota está sendo usada baseado na URL
  const isEventRoute = location.includes('/event-spaces/') && location.includes('/booking-confirmation');
  
  // Para rota /event-spaces/:id/booking-confirmation
  let id = isEventRoute ? params.id : params.bookingId;
  let type = isEventRoute ? 'event' : (params.type || 'hotel');

  // Se não encontrar id pela rota, tentar extrair dos query params
  if (!id && location.includes('?')) {
    const queryString = location.split('?')[1];
    const queryParams = new URLSearchParams(queryString);
    id = queryParams.get('bookingId') || undefined;
  }

  // ✅ CORREÇÃO: Determinar o tipo de booking
  const bookingType = (type || '').toLowerCase() as BookingType;

  // ✅ CORREÇÃO: Buscar dados do booking
  const { data: hotelBookingResponse } = useQuery<HotelBookingResponse, Error>({
    queryKey: ['hotel-booking-details', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID da reserva não fornecido');
      }

      console.log('🔍 Buscando reserva de hotel:', id);
      
      // ✅ CORREÇÃO: Tentar várias abordagens para encontrar a reserva
      let response: HotelBookingResponse;
      
      // Primeiro tentar com a rota global
      try {
        console.log('🔄 Tentando rota global /api/hotels/bookings/:id');
        response = await hotelService.getBookingById(id);
        
        if (response.success && response.data) {
          console.log('✅ Reserva encontrada via rota global');
          return response;
        }
      } catch (err) {
        console.log('❌ Rota global falhou, tentando rota específica por hotel');
      }
      
      // Se falhar, buscar em todos os hotéis do usuário
      try {
        console.log('🔄 Buscando hotéis do usuário para encontrar a reserva');
        const myHotels = await hotelService.getMyHotels();
        
        if (myHotels.success && myHotels.data.length > 0) {
          for (const hotel of myHotels.data) {
            try {
              console.log(`🔍 Procurando no hotel: ${hotel.name} (${hotel.id})`);
              const hotelResponse = await hotelService.getBookingById(id, hotel.id);
              
              if (hotelResponse.success && hotelResponse.data) {
                console.log(`✅ Reserva encontrada no hotel ${hotel.name}`);
                
                // ✅ CORREÇÃO: Adicionar informações do hotel
                return {
                  ...hotelResponse,
                  _hotelInfo: {
                    id: hotel.id,
                    name: hotel.name || '',
                    locality: hotel.locality || '',
                    province: hotel.province || '',
                    contact_email: hotel.contact_email,
                    contact_phone: hotel.contact_phone,
                    check_in_time: hotel.check_in_time || undefined,
                  }
                };
              }
            } catch (err) {
              continue;
            }
          }
        }
      } catch (err) {
        console.error('❌ Erro ao buscar hotéis:', err);
      }
      
      throw new Error('Reserva não encontrada');
    },
    enabled: !bookingType || bookingType === 'hotel',
    retry: false,
  });

  // ✅ CORREÇÃO: Buscar dados do evento
  const { data: eventBookingResponse } = useQuery<ServiceResponse<ExtendedEventBooking>, Error>({
    queryKey: ['event-booking-details', id],
    queryFn: () => {
      if (!id) {
        throw new Error('ID da reserva não fornecido');
      }
      
      console.log('🔍 Buscando reserva de evento:', id);
      return eventSpaceService.getBookingById(id) as Promise<ServiceResponse<ExtendedEventBooking>>;
    },
    enabled: bookingType === 'event',
    retry: false,
  });

  // ✅ CORREÇÃO: Processar os dados quando chegarem
  useEffect(() => {
    const processBookingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let booking: BookingData | null = null;
        
        if (bookingType === 'event' && eventBookingResponse) {
          console.log('📥 Processando resposta de evento:', eventBookingResponse);
          
          if (eventBookingResponse.success && eventBookingResponse.data) {
            const eventBooking = eventBookingResponse.data;
            
            // ✅ CORREÇÃO: Buscar detalhes do espaço e hotel
            let spaceDetails: SpaceDetails | null = null;
            let hotelDetails: HotelDetails | null = null;
            
            if (eventBooking.eventSpaceId) {
              try {
                const spaceResponse = await eventSpaceService.getEventSpaceDetails(eventBooking.eventSpaceId);
                if (spaceResponse.success && spaceResponse.data) {
                  const space = spaceResponse.data.space;
                  const hotel = spaceResponse.data.hotel;
                  
                  spaceDetails = {
                    id: space?.id || '',
                    name: space?.name || 'Espaço não informado',
                    capacity_min: space?.capacityMin || 1,
                    capacity_max: space?.capacityMax || 1000,
                  };
                  
                  if (hotel) {
                    hotelDetails = {
                      id: hotel.id || '',
                      name: hotel.name || 'Hotel não informado',
                      locality: hotel.locality || '',
                      province: hotel.province || '',
                      contact_email: hotel.contact_email,
                      contact_phone: hotel.contact_phone,
                    };
                  }
                }
              } catch (err) {
                console.warn('Não foi possível carregar detalhes do espaço:', err);
              }
            }
            
            booking = {
              id: eventBooking.id,
              type: 'event',
              booking: eventBooking,
              space: spaceDetails || undefined,
              hotel: hotelDetails || undefined,
            };
            
            console.log('✅ Dados do evento processados:', booking);
          } else {
            throw new Error(eventBookingResponse.error || 'Erro ao carregar reserva de evento');
          }
        } 
        else if ((!bookingType || bookingType === 'hotel') && hotelBookingResponse) {
          console.log('📥 Processando resposta de hotel:', hotelBookingResponse);
          
          if (hotelBookingResponse.success && hotelBookingResponse.data) {
            const hotelBooking = hotelBookingResponse.data;
            
            // ✅ CORREÇÃO: Extrair informações do hotel
            let hotelDetails: HotelDetails | null = null;
            
            // Se veio com informações do hotel anexadas
            if (hotelBookingResponse._hotelInfo) {
              hotelDetails = hotelBookingResponse._hotelInfo;
            }
            // Se o booking tem informações do hotel
            else if ('hotel_id' in hotelBooking && hotelBooking.hotel_id) {
              try {
                const hotel = await hotelService.getHotelById(hotelBooking.hotel_id);
                hotelDetails = {
                  id: hotel.id,
                  name: hotel.name || '',
                  locality: hotel.locality || '',
                  province: hotel.province || '',
                  contact_email: hotel.contact_email,
                  contact_phone: hotel.contact_phone,
                  check_in_time: hotel.check_in_time || undefined,
                };
              } catch (err) {
                console.warn('Não foi possível carregar detalhes do hotel:', err);
              }
            }
            
            booking = {
              id: hotelBooking.id,
              type: 'hotel',
              booking: hotelBooking,
              hotel: hotelDetails || undefined,
            };
            
            console.log('✅ Dados do hotel processados:', booking);
          } else {
            throw new Error(hotelBookingResponse.error || 'Erro ao carregar reserva de hotel');
          }
        }
        
        if (booking) {
          setBookingData(booking);
        } else if (!hotelBookingResponse && !eventBookingResponse) {
          // Ainda carregando
          return;
        } else {
          throw new Error('Reserva não encontrada');
        }
      } catch (err: any) {
        console.error('❌ Erro ao processar dados da reserva:', err);
        setError(err.message || 'Erro ao carregar reserva');
        toast.error(err.message || 'Erro ao carregar reserva');
      } finally {
        setLoading(false);
      }
    };

    processBookingData();
  }, [hotelBookingResponse, eventBookingResponse, bookingType, id]);

  // ✅ CORREÇÃO: Funções auxiliares com validação
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não informada';
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'Data não informada';
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = parseISO(dateString);
      } else {
        date = new Date(dateString + 'T00:00:00');
      }
      return format(date, "dd/MM/yyyy HH:mm", { locale: pt });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '0,00 MTn';
    }
    
    const priceNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(priceNum) || !isFinite(priceNum)) {
      return '0,00 MTn';
    }
    
    return priceNum.toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' MTn';
  };

  // ✅ CORREÇÃO: Obter status display
  const getStatusDisplay = (status: string, type: BookingType) => {
    if (type === 'hotel') {
      const statusMap: Record<string, string> = {
        'pending': 'Pendente',
        'pending_confirmation': 'Aguardando Confirmação',
        'confirmed': 'Confirmada',
        'checked_in': 'Check-in Realizado',
        'checked_out': 'Check-out Realizado',
        'cancelled': 'Cancelada',
        'no_show': 'No-show',
      };
      return statusMap[status] || status.replace('_', ' ');
    } else {
      const statusMap: Record<string, string> = {
        'pending_approval': 'Aguardando Aprovação',
        'confirmed': 'Confirmado',
        'in_progress': 'Em Andamento',
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
        'rejected': 'Rejeitado',
      };
      return statusMap[status] || status.replace('_', ' ');
    }
  };

  // ✅ NOVA SEGURANÇA: Verificar se pode mostrar dados de contato (só após confirmação)
  const canShowContactInfo = (bookingStatus: string): boolean => {
    // Mostrar contato apenas quando a reserva está confirmada
    const visibleStatuses = ['confirmed', 'checked_in', 'checked_out', 'in_progress', 'completed'];
    return visibleStatuses.includes(bookingStatus.toLowerCase());
  };

  const getStatusColor = (status: string, type: BookingType) => {
    if (type === 'hotel') {
      if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800';
      if (status === 'confirmed') return 'bg-blue-100 text-blue-800';
      if (status.includes('checked')) return 'bg-green-100 text-green-800';
      if (status.includes('cancelled') || status === 'no_show') return 'bg-red-100 text-red-800';
    } else {
      if (status === 'pending_approval') return 'bg-yellow-100 text-yellow-800';
      if (status === 'confirmed') return 'bg-blue-100 text-blue-800';
      if (status === 'in_progress') return 'bg-purple-100 text-purple-800';
      if (status === 'completed') return 'bg-green-100 text-green-800';
      if (status.includes('cancelled') || status === 'rejected') return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handlePrint = () => {
    const printContent = document.getElementById('booking-confirmation-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Confirmação de Reserva - ${bookingData?.booking.id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .section-title { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 5px; }
                .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    toast.info('Funcionalidade de download de PDF em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Carregando confirmação...</h2>
        <p className="text-gray-600 text-center">
          Estamos a carregar os detalhes da sua reserva.
        </p>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Reserva não encontrada
            </CardTitle>
            <CardDescription>
              {error || 'A reserva solicitada não foi encontrada ou ocorreu um erro.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center text-muted-foreground">
                Verifique o ID da reserva ou volte para a página anterior.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setLocation('/')} 
                  className="mx-auto" 
                  variant="default"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar para início
                </Button>
                <Button 
                  onClick={() => {
                    if (bookingType === 'event') {
                      setLocation('/event-spaces/search');
                    } else {
                      setLocation('/hotels/search');
                    }
                  }} 
                  className="mx-auto" 
                  variant="outline"
                >
                  Buscar {bookingType === 'event' ? 'espaços' : 'hotéis'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { type: bookingTypeFinal, booking, hotel, space } = bookingData;
  const isEvent = bookingTypeFinal === 'event';
  const isHotel = bookingTypeFinal === 'hotel';

  // ✅ CORREÇÃO: Type assertions seguras
  const eventBooking = isEvent ? booking as ExtendedEventBooking : null;
  const hotelBooking = isHotel ? booking as HotelBooking : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (isEvent) {
              setLocation('/event-spaces/search');
            } else {
              setLocation('/hotels/search');
            }
          }}
          className="pl-0 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para {isEvent ? 'espaços de evento' : 'hotéis'}
        </Button>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reserva {isEvent ? 'Solicitada' : 'Confirmada'} com Sucesso!
          </h1>
          <p className="text-gray-600">
            {isEvent 
              ? 'A sua solicitação de reserva foi enviada. O hotel entrará em contacto consigo em breve.' 
              : 'A sua reserva foi confirmada. Enviamos um email com os detalhes.'
            }
          </p>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div id="booking-confirmation-content" className="space-y-6">
        {/* Cartão de resumo */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">
                {isEvent 
                  ? `Solicitação: ${eventBooking?.event_title || 'Evento'}`
                  : `Reserva: ${hotelBooking?.guest_name || 'Hóspede'}`
                }
              </span>
              <Badge className={cn("text-sm", getStatusColor(booking.status, bookingTypeFinal))}>
                {getStatusDisplay(booking.status, bookingTypeFinal)}
              </Badge>
            </CardTitle>
            <CardDescription>
              ID: {booking.id}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Informações específicas do tipo */}
            {isEvent && eventBooking ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <PartyPopper className="h-4 w-4" />
                    <span className="font-medium">Evento:</span>
                    <span className="text-gray-900">{eventBooking.event_title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Participantes:</span>
                    <span className="text-gray-900">
                      {eventBooking.expected_attendees} pessoa{eventBooking.expected_attendees !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">Espaço:</span>
                    <span className="text-gray-900">{space?.name || 'Espaço de evento'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Início:</span>
                    <span className="text-gray-900">{formatDate(eventBooking.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Término:</span>
                    <span className="text-gray-900">{formatDate(eventBooking.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Valor:</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(eventBooking.total_price)}</span>
                  </div>
                </div>
              </div>
            ) : hotelBooking ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Hóspede:</span>
                    <span className="text-gray-900">{hotelBooking.guest_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email:</span>
                    <span className="text-gray-900">{hotelBooking.guest_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">Hotel:</span>
                    <span className="text-gray-900">{hotel?.name || 'Hotel'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Check-in:</span>
                    <span className="text-gray-900">{formatDate(hotelBooking.check_in)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Check-out:</span>
                    <span className="text-gray-900">{formatDate(hotelBooking.check_out)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Valor:</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(hotelBooking.total_price)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Informações do hotel */}
            {hotel && (
              <>
                <Separator />
                <div className="bg-white p-4 rounded-md border">
                  <div className="flex items-center gap-3 mb-2">
                    <Hotel className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-lg">{hotel.name}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Localização:</span>{' '}
                      <span className="font-medium">
                        {hotel.locality}{hotel.province ? `, ${hotel.province}` : ''}
                      </span>
                    </div>
                    {/* ✅ SEGURANÇA: Mostrar contato apenas após confirmação */}
                    {canShowContactInfo(bookingData?.booking?.status || '') ? (
                      <>
                        {hotel.contact_phone && (
                          <div>
                            <span className="text-gray-500">Telefone:</span>{' '}
                            <span className="font-medium">{hotel.contact_phone}</span>
                          </div>
                        )}
                        {hotel.contact_email && (
                          <div>
                            <span className="text-gray-500">Email:</span>{' '}
                            <span className="font-medium">{hotel.contact_email}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="col-span-full">
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                          ⚠️ Os dados de contato estarão disponíveis após a confirmação da reserva.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              onClick={handlePrint} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir confirmação
            </Button>
            <Button 
              onClick={handleDownloadPDF} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            {isEvent && (
              <Button 
                onClick={() => setLocation('/bookings')}
                variant="default"
                className="ml-auto"
              >
                Ver minhas reservas
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Detalhes adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Detalhes do booking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes da {isEvent ? 'Solicitação' : 'Reserva'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID da reserva:</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {booking.id}
                </code>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Criada em:</span>
                <span className="font-medium">{formatDateTime(booking.created_at)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Última atualização:</span>
                <span className="font-medium">{formatDateTime(booking.updated_at)}</span>
              </div>
              
              {isEvent && eventBooking?.eventDescription && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-500 block mb-1">Descrição:</span>
                  <p className="text-gray-700">
                    {eventBooking.eventDescription}
                  </p>
                </div>
              )}
              
              {isHotel && hotelBooking?.special_requests && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-500 block mb-1">Pedidos especiais:</span>
                  <p className="text-gray-700">
                    {hotelBooking.special_requests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informações de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isEvent && eventBooking ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status de pagamento:</span>
                    <Badge variant="outline" className={
                      eventBooking.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {eventBooking.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preço base:</span>
                      <span>{formatCurrency(eventBooking.basePrice)}</span>
                    </div>
                    {eventBooking.securityDeposit && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Depósito de segurança:</span>
                        <span>{formatCurrency(eventBooking.securityDeposit)}</span>
                      </div>
                    )}
                    {eventBooking.weekend_surcharge && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Acréscimo fim de semana:</span>
                        <span>{formatCurrency(eventBooking.weekend_surcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-lg">{formatCurrency(eventBooking.total_price)}</span>
                    </div>
                  </div>
                </>
              ) : hotelBooking ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status de pagamento:</span>
                    <Badge variant="outline" className={
                      hotelBooking.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : hotelBooking.payment_status === 'partial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {hotelBooking.payment_status === 'paid' ? 'Pago' :
                       hotelBooking.payment_status === 'partial' ? 'Parcial' : 'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preço base:</span>
                      <span>{formatCurrency(hotelBooking.base_price)}</span>
                    </div>
                    {hotelBooking.taxes && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Taxas:</span>
                        <span>{formatCurrency(hotelBooking.taxes)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span className="text-gray-700">Total:</span>
                      <span className="text-lg">{formatCurrency(hotelBooking.total_price)}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Mensagem de instruções */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5" />
              Próximos passos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            {isEvent && eventBooking ? (
              <div className="space-y-2">
                <p>✅ A sua solicitação de reserva foi enviada com sucesso.</p>
                <p>📞 O hotel entrará em contacto consigo dentro de 24 horas para confirmar a disponibilidade e discutir os detalhes finais.</p>
                <p>📧 Enviamos um email de confirmação para <strong>{eventBooking.organizer_email}</strong>.</p>
                <p>💳 Após a confirmação do hotel, será solicitado um depósito para garantir a reserva.</p>
              </div>
            ) : hotelBooking ? (
              <div className="space-y-2">
                <p>✅ A sua reserva foi confirmada com sucesso.</p>
                <p>📧 Enviamos um email de confirmação para <strong>{hotelBooking.guest_email}</strong>.</p>
                <p>🏨 Chegue no horário de check-in: {hotel?.check_in_time || '14:00'}.</p>
                {/* ✅ SEGURANÇA: Mostrar contato apenas após confirmação */}
                {canShowContactInfo(hotelBooking?.status || '') ? (
                  <p>📞 Em caso de dúvidas, contacte o hotel: <strong>{hotel?.contact_phone || 'N/A'}</strong>.</p>
                ) : (
                  <p className="text-amber-700 text-sm">⚠️ Os dados de contato estarão disponíveis após a confirmação da sua reserva.</p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline"
            className="sm:min-w-[200px]"
          >
            Voltar para início
          </Button>
          
          {isEvent && eventBooking ? (
            <Button 
              onClick={() => setLocation(`/event-spaces/${eventBooking.eventSpaceId}`)}
              variant="default"
              className="sm:min-w-[200px]"
            >
              Ver detalhes do espaço
            </Button>
          ) : hotel && (
            <Button 
              onClick={() => setLocation(`/hotels/${hotel.id}`)}
              variant="default"
              className="sm:min-w-[200px]"
            >
              Ver detalhes do hotel
            </Button>
          )}
          
          <Button 
            onClick={() => setLocation('/bookings')}
            variant="secondary"
            className="sm:min-w-[200px]"
          >
            Ver minhas reservas
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;