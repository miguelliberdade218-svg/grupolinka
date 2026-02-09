// src/apps/main-app/pages/HotelBookingPage.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useParams, useSearch, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { CalendarIcon, ChevronLeft, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { hotelService, Hotel, RoomType, ApiResponse, Booking, ListResponse } from '@/services/hotelService';
import { Badge } from '@/shared/components/ui/badge';

const HotelBookingPage = () => {
  const { id } = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(2);
  const [roomTypeId, setRoomTypeId] = useState(params.get('roomTypeId') || '');
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CORREÇÃO: getHotelById agora retorna Hotel diretamente
  const { data: hotel, isLoading, error: hotelError } = useQuery<Hotel, Error>({
    queryKey: ['hotel', id],
    queryFn: () => hotelService.getHotelById(id!),
    enabled: !!id,
  });

  // ✅ CORREÇÃO: getRoomTypesByHotel retorna ListResponse<RoomType>
  const { data: roomTypesResponse, isLoading: loadingRoomTypes, error: roomTypesError } = useQuery<ListResponse<RoomType>, Error>({
    queryKey: ['hotel-room-types', id],
    queryFn: () => hotelService.getRoomTypesByHotel(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (hotelError) {
      console.error('Erro ao carregar hotel:', hotelError);
      toast.error('Erro ao carregar informações do hotel');
    }
    
    if (roomTypesError) {
      console.error('Erro ao carregar tipos de quarto:', roomTypesError);
      toast.error('Erro ao carregar tipos de quarto');
    }
  }, [hotelError, roomTypesError]);

  // ✅ CORREÇÃO: Extrair dados da resposta
  const roomTypes = roomTypesResponse?.success ? roomTypesResponse.data || [] : [];
  const selectedRoomType = roomTypes.find((rt: RoomType) => rt.id === roomTypeId);

  // ✅ CORREÇÃO: Calcular número de noites
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ✅ CORREÇÃO: Calcular preço total
  const calculateTotalPrice = () => {
    if (!selectedRoomType) return 0;
    const nights = calculateNights();
    const basePrice = parseFloat(selectedRoomType.base_price || '0');
    return basePrice * nights;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!checkIn || !checkOut) {
        toast.error('Selecione as datas de check-in e check-out');
        return;
      }
      
      // ✅ CORREÇÃO: Verificar se check-out é após check-in
      if (checkOut <= checkIn) {
        toast.error('A data de check-out deve ser após a data de check-in');
        return;
      }
      
      if (!roomTypeId) {
        toast.error('Selecione um tipo de quarto');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!guestInfo.name.trim()) {
        toast.error('Preencha seu nome completo');
        return;
      }
      if (!guestInfo.email.trim()) {
        toast.error('Preencha seu email');
        return;
      }
      // ✅ CORREÇÃO: Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestInfo.email)) {
        toast.error('Digite um email válido');
        return;
      }
      handleSubmitBooking();
    }
  };

  const handleSubmitBooking = async () => {
    if (!id || !selectedRoomType || !checkIn || !checkOut) {
      toast.error('Informações incompletas');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        roomTypeId,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone || undefined,
        checkIn: format(checkIn!, 'yyyy-MM-dd'),
        checkOut: format(checkOut!, 'yyyy-MM-dd'),
        adults: guests,
        children: 0,
        units: 1,
        specialRequests: guestInfo.specialRequests || undefined,
      };

      // ✅ CORREÇÃO: createBooking retorna ApiResponse<Booking>
      const result: ApiResponse<Booking> = await hotelService.createBooking(id, bookingData);
      
      // ✅✅✅ CORREÇÃO APLICADA: createBooking retorna ApiResponse<Booking>, não Booking diretamente
      // ✅ ANTES: navigate(`/bookings/hotel/${result.id}/confirmation`);
      // ✅ DEPOIS: navigate(`/bookings/hotel/${result.data.id}/confirmation`);
      if (result.success && result.data) {
        toast.success('Reserva criada com sucesso!');
        // ✅ CORREÇÃO: Redirecionar usando result.data.id (Booking) em vez de result.id (ApiResponse)
        setLocation(`/bookings/hotel/${result.data.id}/confirmation`);
      } else {
        // ✅ CORREÇÃO: Mostrar mensagem de erro do ApiResponse
        toast.error(result.error || 'Erro ao criar reserva');
      }
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      toast.error(error.message || 'Erro ao criar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CORREÇÃO: Efeito para atualizar step com base na query param
  useEffect(() => {
    if (params.get('step')) {
      const stepParam = parseInt(params.get('step')!);
      if (!isNaN(stepParam) && stepParam >= 1 && stepParam <= 2) {
        setStep(stepParam);
      }
    }
  }, [search]);

  // ✅ Função auxiliar para formatação de preço
  const formatPrice = (price: string | number): string => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    return priceNum.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações do hotel...</p>
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
              <Button onClick={() => setLocation('/hotels/search')} className="mx-auto" variant="outline">
                Voltar para busca
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/hotels/${id}`)}
          className="pl-0"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para detalhes do hotel
        </Button>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center max-w-md mx-auto mt-6 mb-8">
          <div className="flex items-center w-full">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                1
              </div>
              <span className="text-xs mt-2">Datas & Quarto</span>
            </div>
            <div className={cn(
              "flex-1 h-1 mx-2",
              step >= 2 ? "bg-primary" : "bg-muted"
            )} />
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className="text-xs mt-2">Dados Pessoais</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 1 ? 'Selecione Datas e Quarto' : 'Informações do Hóspede'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Escolha quando e onde ficar' 
                  : 'Preencha seus dados para completar a reserva'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 ? (
                <>
                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="check-in">Check-in *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkIn && "text-muted-foreground"
                            )}
                            id="check-in"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkIn ? format(checkIn, "PPP", { locale: pt }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={setCheckIn}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            locale={pt}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="check-out">Check-out *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkOut && "text-muted-foreground"
                            )}
                            id="check-out"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOut ? format(checkOut, "PPP", { locale: pt }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={setCheckOut}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              
                              // Datas passadas são desabilitadas
                              if (date < today) return true;
                              
                              // Se não há check-in selecionado, permite todas as datas futuras
                              if (!checkIn) return false;
                              
                              // Desabilita datas iguais ou anteriores ao check-in
                              const checkInDate = new Date(checkIn);
                              checkInDate.setHours(0, 0, 0, 0);
                              const selectedDate = new Date(date);
                              selectedDate.setHours(0, 0, 0, 0);
                              
                              return selectedDate <= checkInDate;
                            }}
                            initialFocus
                            locale={pt}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Número de noites */}
                  {checkIn && checkOut && checkOut > checkIn && (
                    <div className="text-sm bg-primary/5 p-3 rounded-md">
                      <span className="font-medium">
                        {calculateNights()} noite{calculateNights() !== 1 ? 's' : ''} selecionada{calculateNights() !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({format(checkIn, 'dd/MM')} a {format(checkOut, 'dd/MM')})
                      </span>
                    </div>
                  )}

                  {/* Hóspedes */}
                  <div className="space-y-2">
                    <Label>Número de Hóspedes *</Label>
                    <div className="flex items-center gap-4 p-3 border rounded-md">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                      >
                        -
                      </Button>
                      <div className="flex items-center gap-2 flex-1">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <span className="text-lg font-semibold">{guests}</span>
                          <span className="text-muted-foreground ml-2">
                            adulto{guests !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setGuests(guests + 1)}
                        disabled={selectedRoomType && guests >= selectedRoomType.capacity}
                      >
                        +
                      </Button>
                    </div>
                    {selectedRoomType && guests > selectedRoomType.capacity && (
                      <p className="text-sm text-destructive">
                        Este quarto suporta no máximo {selectedRoomType.capacity} hóspedes
                      </p>
                    )}
                  </div>

                  {/* Tipos de Quarto */}
                  <div className="space-y-4">
                    <Label>Selecione o Tipo de Quarto *</Label>
                    
                    {loadingRoomTypes ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span className="text-muted-foreground">Carregando tipos de quarto...</span>
                      </div>
                    ) : roomTypes.length > 0 ? (
                      <div className="space-y-3">
                        {roomTypes.map((room: RoomType) => (
                          <div
                            key={room.id}
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all duration-200",
                              "hover:border-primary hover:shadow-sm",
                              roomTypeId === room.id
                                ? "border-primary border-2 bg-primary/5"
                                : room.is_active === false
                                ? "opacity-60 cursor-not-allowed"
                                : ""
                            )}
                            onClick={() => {
                              if (room.is_active !== false) {
                                setRoomTypeId(room.id);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-lg">{room.name}</h4>
                                  {room.is_active === false && (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                      Indisponível
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-2">
                                  {room.description || 'Sem descrição disponível'}
                                </p>
                                
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>Até {room.capacity} pessoa{room.capacity !== 1 ? 's' : ''}</span>
                                  </div>
                                  {room.min_nights && room.min_nights > 0 && (
                                    <div className="text-amber-600">
                                      Mínimo {room.min_nights} noite{room.min_nights !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-bold text-lg text-primary">
                                  {formatPrice(room.base_price || '0')}
                                  <span className="text-sm font-normal text-muted-foreground">/noite</span>
                                </div>
                                {checkIn && checkOut && roomTypeId === room.id && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Total: {formatPrice(calculateTotalPrice())}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum tipo de quarto disponível para este hotel.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Step 2: Informações do Hóspede */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                      placeholder="Seu nome completo (como no documento)"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                        placeholder="+258 84 123 4567"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="requests">Pedidos Especiais ou Observações</Label>
                    <textarea
                      id="requests"
                      className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      value={guestInfo.specialRequests}
                      onChange={(e) => setGuestInfo({...guestInfo, specialRequests: e.target.value})}
                      placeholder="Alergias, necessidades especiais, horários especiais, requisições para o hotel..."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navegação */}
          <div className="flex justify-between items-center">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                Voltar para seleção
              </Button>
            )}
            <Button 
              onClick={handleNextStep} 
              className="ml-auto min-w-[160px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : step === 1 ? (
                'Continuar para dados'
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          </div>
        </div>

        {/* Resumo Lateral */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Resumo da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-lg">{hotel.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hotel.locality}, {hotel.province}
                </p>
                {hotel.contact_phone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📞 {hotel.contact_phone}
                  </p>
                )}
              </div>
              
              {selectedRoomType && (
                <div className="pb-4 border-b">
                  <h4 className="font-medium mb-2">Quarto Selecionado</h4>
                  <div className="text-sm">
                    <p className="font-medium">{selectedRoomType.name}</p>
                    <p className="text-muted-foreground mt-1">
                      Capacidade: {selectedRoomType.capacity} pessoa{selectedRoomType.capacity !== 1 ? 's' : ''}
                    </p>
                    {selectedRoomType.description && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">
                        {selectedRoomType.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {checkIn && checkOut && (
                <div className="pb-4 border-b">
                  <h4 className="font-medium mb-2">Datas e Hóspedes</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Check-in:</span>
                      <span className="font-medium">{format(checkIn, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Check-out:</span>
                      <span className="font-medium">{format(checkOut, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>Noites:</span>
                      <span className="font-medium">{calculateNights()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hóspedes:</span>
                      <span className="font-medium">{guests} adulto{guests !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Preços */}
              {selectedRoomType && checkIn && checkOut && checkOut > checkIn && (
                <div className="pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {formatPrice(selectedRoomType.base_price || '0')} × {calculateNights()} noite{calculateNights() !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">
                      {formatPrice(calculateTotalPrice())}
                    </span>
                  </div>
                  
                  {/* Impostos e taxas (placeholder) */}
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-muted-foreground">Taxas e impostos</span>
                    <span className="text-muted-foreground">Incluídos</span>
                  </div>
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(calculateTotalPrice())}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Preço final em MZN (Meticais)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Importantes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações Importantes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 pt-0">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                <span>Esta é uma solicitação de reserva sujeita à confirmação</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                <span>O hotel entrará em contacto para confirmar disponibilidade</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                <span>Política de cancelamento conforme regras do hotel</span>
              </div>
              {hotel.check_in_time && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                  <span>Check-in a partir das {hotel.check_in_time}</span>
                </div>
              )}
              {hotel.check_out_time && (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                  <span>Check-out até às {hotel.check_out_time}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 flex-shrink-0 mt-0.5">•</div>
                <span>É necessário documento de identificação válido no check-in</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HotelBookingPage;