// src/apps/main-app/pages/EventSpaceBookingPage.tsx
// ✅ VERSÃO CORRIGIDA - Usa rota genérica de confirmação!

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { CalendarIcon, ChevronLeft, Loader2, AlertCircle, Info, CheckCircle, Hotel, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { eventSpaceService, ServiceResponse } from '@/services/eventSpaceService';
import type { EventSpaceDetailsResponse, EventBooking, EventSpaceData } from '@/shared/types/event-spaces';

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

// ✅ TODOS OS TIPOS DE EVENTO DISPONÍVEIS
const ALL_EVENT_TYPES = [
  { value: 'Casamento', label: 'Casamento' },
  { value: 'Conferência', label: 'Conferência' },
  { value: 'Cerimônia', label: 'Cerimônia' },
  { value: 'Lançamento', label: 'Lançamento' },
  { value: 'Festa Corporativa', label: 'Festa Corporativa' },
  { value: 'Festa', label: 'Festa' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Reunião', label: 'Reunião' },
  { value: 'Formação/Treinamento', label: 'Formação/Treinamento' },
  { value: 'Evento Corporativo', label: 'Evento Corporativo' },
  { value: 'Seminário', label: 'Seminário' },
  { value: 'Exposição', label: 'Exposição' },
  { value: 'Concerto', label: 'Concerto' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Team Building', label: 'Team Building' },
  { value: 'Aniversário', label: 'Aniversário' },
  { value: 'Show', label: 'Show' },
  { value: 'Outro', label: 'Outro' },
] as const;

const formatCurrency = (amount: string | number | undefined): string => {
  if (amount === undefined || amount === null) return 'Sob consulta';
  
  let num: number;
  if (typeof amount === 'string') {
    const cleanAmount = amount.replace(/\s/g, '').replace(',', '.');
    num = parseFloat(cleanAmount);
  } else {
    num = amount;
  }
  
  if (isNaN(num) || !isFinite(num) || num === 0) return 'Sob consulta';
  
  return num.toLocaleString('pt-MZ', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + ' MTn';
};

const EventSpaceBookingPage = () => {
  const { id } = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [attendees, setAttendees] = useState(50);
  const [bookingInfo, setBookingInfo] = useState({
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    eventTitle: '',
    eventDescription: '',
    eventType: '',
    specialRequests: '',
    cateringRequired: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: spaceDetailsResponse, isLoading } = useQuery<ServiceResponse<EventSpaceDetailsResponse>, Error>({
    queryKey: ['event-space-details', id],
    queryFn: () => eventSpaceService.getEventSpaceDetails(id!),
    enabled: !!id,
    retry: 2,
  });

  const spaceDetails = spaceDetailsResponse?.success ? spaceDetailsResponse.data : null;
  const space: EventSpaceData | null = spaceDetails?.space || null;
  const hotel: Hotel | null = spaceDetails?.hotel || null;
  const spaceAny = space as any;

  // ✅ AGORA: SEMPRE mostra TODOS os tipos de evento!
  const allowedEventTypes = useMemo(() => {
    console.log('🎯 Mostrando TODOS os tipos de evento (sem restrições)');
    return ALL_EVENT_TYPES;
  }, []);

  // ✅ Preço base por noite
  const basePrice = useMemo(() => {
    if (!space) return 0;
    
    if (space.basePricePerDay) {
      const price = parseFloat(space.basePricePerDay);
      if (!isNaN(price) && price > 0) return price;
    }
    
    if (spaceAny.pricePerDay) {
      const price = parseFloat(spaceAny.pricePerDay);
      if (!isNaN(price) && price > 0) return price;
    }
    
    return 0;
  }, [space, spaceAny]);

  // ✅ Calcular noites (check-out NÃO conta)
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(checkOut);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [checkIn, checkOut]);

  // ✅ Contar fins de semana nas noites de estadia
  const weekendNights = useMemo(() => {
    if (!checkIn || !checkOut || nights === 0) return 0;
    
    const start = new Date(checkIn);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(checkOut);
    end.setHours(0, 0, 0, 0);
    
    let weekendCount = 0;
    const currentDate = new Date(start);
    const lastNight = new Date(end);
    lastNight.setDate(lastNight.getDate() - 1);
    
    while (currentDate <= lastNight) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weekendCount;
  }, [checkIn, checkOut, nights]);

  // ✅ Calcular subtotal
  const subtotal = useMemo(() => {
    if (basePrice <= 0 || nights === 0) return 0;
    return basePrice * nights;
  }, [basePrice, nights]);

  // ✅ Calcular adicional de fim de semana
  const weekendSurchargeAmount = useMemo(() => {
    if (basePrice <= 0 || weekendNights === 0 || !space?.weekendSurchargePercent) return 0;
    return basePrice * (space.weekendSurchargePercent / 100) * weekendNights;
  }, [basePrice, weekendNights, space?.weekendSurchargePercent]);

  // ✅ Calcular preço total
  const totalPrice = useMemo(() => {
    return subtotal + weekendSurchargeAmount;
  }, [subtotal, weekendSurchargeAmount]);

  // ✅ Inicializar valores
  useEffect(() => {
    if (space?.capacityMin) {
      setAttendees(space.capacityMin);
    }
    
    // ✅ Selecionar o PRIMEIRO tipo por padrão
    if (!bookingInfo.eventType) {
      const primeiroTipo = ALL_EVENT_TYPES[0].value;
      console.log('🎯 Selecionando tipo padrão:', primeiroTipo);
      setBookingInfo(prev => ({
        ...prev,
        eventType: primeiroTipo
      }));
    }
  }, [space]);

  // ✅ Atualizar step
  useEffect(() => {
    if (params.get('step')) {
      const stepParam = parseInt(params.get('step')!);
      if (!isNaN(stepParam) && stepParam >= 1 && stepParam <= 2) {
        setStep(stepParam);
      }
    }
  }, [search, params]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!checkIn || !checkOut) {
        toast.error('Selecione as datas de check-in e check-out');
        return;
      }
      
      if (checkOut <= checkIn) {
        toast.error('A data de check-out deve ser após a data de check-in');
        return;
      }
      
      if (nights === 0) {
        toast.error('A estadia deve ter pelo menos 1 noite');
        return;
      }
      
      if (space?.capacityMin && attendees < space.capacityMin) {
        toast.error(`Número mínimo de participantes: ${space.capacityMin}`);
        return;
      }
      if (space?.capacityMax && attendees > space.capacityMax) {
        toast.error(`Número máximo de participantes: ${space.capacityMax}`);
        return;
      }
      
      setStep(2);
      
      const urlParams = new URLSearchParams(search);
      urlParams.set('step', '2');
      setLocation(`/event-spaces/${id}/book?${urlParams.toString()}`, { replace: true });
      
    } else if (step === 2) {
      handleSubmitBooking();
    }
  };

  const handleSubmitBooking = async () => {
    if (!id || !space || !checkIn || !checkOut) {
      toast.error('Dados incompletos');
      return;
    }

    if (!bookingInfo.organizerName?.trim()) {
      toast.error('Preencha o nome do organizador');
      return;
    }

    if (!bookingInfo.organizerEmail?.trim()) {
      toast.error('Preencha o email do organizador');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingInfo.organizerEmail)) {
      toast.error('Digite um email válido');
      return;
    }

    if (!bookingInfo.eventTitle?.trim()) {
      toast.error('Preencha o título do evento');
      return;
    }

    if (!bookingInfo.eventType?.trim()) {
      toast.error('Selecione um tipo de evento');
      return;
    }

    // ✅ SEM RESTRIÇÕES! Qualquer tipo é aceito
    console.log('📤 Enviando reserva com tipo:', bookingInfo.eventType);

    const bookingData = {
      event_space_id: id,
      organizer_name: bookingInfo.organizerName.trim(),
      organizer_email: bookingInfo.organizerEmail.trim(),
      organizer_phone: bookingInfo.organizerPhone?.trim() || undefined,
      event_title: bookingInfo.eventTitle.trim(),
      event_description: bookingInfo.eventDescription?.trim() || undefined,
      event_type: bookingInfo.eventType,
      start_date: format(checkIn, 'yyyy-MM-dd'),
      end_date: format(checkOut, 'yyyy-MM-dd'),
      expected_attendees: attendees,
      special_requests: bookingInfo.specialRequests?.trim() || undefined,
      catering_required: bookingInfo.cateringRequired || false,
    };

    setIsSubmitting(true);
    
    try {
      const result = await eventSpaceService.createEventBooking(id, bookingData);
      
      if (result.success && result.data) {
        toast.success('Solicitação de reserva enviada com sucesso!');
        
        const email = encodeURIComponent(bookingInfo.organizerEmail.trim());
        
        // ✅ CORREÇÃO CRÍTICA: Usar rota genérica de confirmação!
        // ANTES: /event-spaces/${id}/booking-confirmation?bookingId=${result.data.id}&email=${email}
        // AGORA: /booking-confirmation?bookingId=${result.data.id}&email=${email}&type=event&spaceId=${id}
        setLocation(`/booking-confirmation?bookingId=${result.data.id}&email=${email}&type=event&spaceId=${id}`);
        
      } else {
        toast.error(result.error || 'Erro ao enviar solicitação');
      }
    } catch (error: any) {
      console.error('Erro detalhado:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações do espaço...</p>
        </div>
      </div>
    );
  }

  if (!spaceDetailsResponse?.success || !space) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar espaço
            </CardTitle>
            <CardDescription>
              {spaceDetailsResponse?.error || 'O espaço não foi encontrado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button onClick={() => setLocation('/event-spaces/search')} variant="default">
              Voltar para busca
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setLocation(`/event-spaces/${id}`)} className="pl-0">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para detalhes
        </Button>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center max-w-md mx-auto mt-6 mb-8">
          <div className="flex items-center w-full">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                step >= 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                1
              </div>
              <span className="text-xs mt-2 text-center">Datas & Capacidade</span>
            </div>
            <div className={cn(
              "flex-1 h-1 mx-2",
              step >= 2 ? "bg-primary" : "bg-muted"
            )} />
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                step >= 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                2
              </div>
              <span className="text-xs mt-2 text-center">Dados do Evento</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 ? 'Datas e Capacidade' : 'Informações do Evento'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Quando pretende realizar o evento? (Check-in / Check-out)' 
                  : 'Conte-nos mais sobre seu evento'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 ? (
                <form id="step1-form" onSubmit={handleNextStep}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Hotel className="h-4 w-4" />
                          Check-in *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkIn ? format(checkIn, "dd/MM/yyyy") : "Selecione"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
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
                        <p className="text-xs text-muted-foreground">
                          Dia de entrada/ocupação
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Hotel className="h-4 w-4" />
                          Check-out *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkOut ? format(checkOut, "dd/MM/yyyy") : "Selecione"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={checkOut}
                              onSelect={setCheckOut}
                              disabled={(date) => {
                                if (date < new Date()) return true;
                                if (!checkIn) return false;
                                return date <= checkIn;
                              }}
                              initialFocus
                              locale={pt}
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          Dia de saída/desocupação (não é cobrado)
                        </p>
                      </div>
                    </div>
                    
                    {nights > 0 && (
                      <div className="bg-primary/5 p-4 rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total de noites:</span>
                          <span className="text-lg font-bold text-primary">{nights} noite{nights !== 1 ? 's' : ''}</span>
                        </div>
                        {weekendNights > 0 && space.weekendSurchargePercent > 0 && (
                          <div className="flex justify-between text-amber-600 text-sm font-medium">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Fim de semana:
                            </span>
                            <span>{weekendNights} noite{weekendNights !== 1 ? 's' : ''} (+{space.weekendSurchargePercent}%)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-6">
                    <Label>Participantes *</Label>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAttendees(Math.max(space.capacityMin || 1, attendees - 1))}
                        disabled={attendees <= (space.capacityMin || 1)}
                        className="h-12 w-12"
                      >
                        <span className="text-xl">-</span>
                      </Button>
                      <div className="flex-1 text-center">
                        <div className="text-4xl font-bold text-primary">{attendees}</div>
                        <div className="text-sm text-muted-foreground">pessoas</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setAttendees(Math.min(space.capacityMax || 1000, attendees + 1))}
                        disabled={attendees >= (space.capacityMax || 1000)}
                        className="h-12 w-12"
                      >
                        <span className="text-xl">+</span>
                      </Button>
                    </div>
                  </div>

                  {space.offersCatering && (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="catering"
                          checked={bookingInfo.cateringRequired}
                          onChange={(e) => setBookingInfo({...bookingInfo, cateringRequired: e.target.checked})}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="catering">Solicitar serviço de catering</Label>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <Button type="submit" className="min-w-[200px]" size="lg">
                      Continuar para detalhes
                    </Button>
                  </div>
                </form>
              ) : (
                <form id="step2-form" onSubmit={handleNextStep}>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Nome do Evento *</Label>
                      <Input
                        value={bookingInfo.eventTitle}
                        onChange={(e) => setBookingInfo({...bookingInfo, eventTitle: e.target.value})}
                        placeholder="Ex: Casamento Maria & João"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de Evento *</Label>
                      
                      {/* ✅ SEM RESTRIÇÕES! Mostra TODOS os tipos */}
                      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                        <p className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Este espaço aceita todos os tipos de evento
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Selecione o tipo que melhor descreve seu evento
                        </p>
                      </div>
                      
                      {/* ✅ BOTÕES - TODOS OS TIPOS DISPONÍVEIS */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {ALL_EVENT_TYPES.map((type) => {
                          const isSelected = bookingInfo.eventType === type.value;
                          
                          return (
                            <Button
                              key={type.value}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => setBookingInfo({...bookingInfo, eventType: type.value})}
                              className={cn(
                                "justify-start h-auto py-3",
                                isSelected && "ring-2 ring-primary ring-offset-2"
                              )}
                            >
                              {isSelected && <CheckCircle className="h-4 w-4 mr-2" />}
                              {type.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Descrição do Evento</Label>
                      <Textarea
                        value={bookingInfo.eventDescription}
                        onChange={(e) => setBookingInfo({...bookingInfo, eventDescription: e.target.value})}
                        placeholder="Descreva seu evento (opcional)"
                        rows={3}
                      />
                    </div>
                    
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Contacto do Organizador</h3>
                      <div className="space-y-4">
                        <Input
                          placeholder="Nome completo *"
                          value={bookingInfo.organizerName}
                          onChange={(e) => setBookingInfo({...bookingInfo, organizerName: e.target.value})}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            type="email"
                            placeholder="Email *"
                            value={bookingInfo.organizerEmail}
                            onChange={(e) => setBookingInfo({...bookingInfo, organizerEmail: e.target.value})}
                          />
                          <Input
                            placeholder="Telefone"
                            value={bookingInfo.organizerPhone}
                            onChange={(e) => setBookingInfo({...bookingInfo, organizerPhone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Pedidos Especiais</Label>
                      <Textarea
                        value={bookingInfo.specialRequests}
                        onChange={(e) => setBookingInfo({...bookingInfo, specialRequests: e.target.value})}
                        placeholder="Equipamento adicional, configurações especiais, restrições alimentares, etc."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end mt-6">
                      <Button 
                        type="submit"
                        className="min-w-[200px]"
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar Solicitação'
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo da Reserva */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="pb-4 border-b">
                <h3 className="font-bold text-lg">{space.name}</h3>
                {hotel && (
                  <p className="text-sm text-muted-foreground mt-1">{hotel.name}</p>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Preço por noite:</p>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {basePrice > 0 ? formatCurrency(basePrice) : 'Sob consulta'}
                    {basePrice > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">/noite</span>}
                  </div>
                  {space.weekendSurchargePercent > 0 && (
                    <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{space.weekendSurchargePercent}% em fins de semana
                    </p>
                  )}
                </div>
              </div>
              
              {checkIn && checkOut && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">{format(checkIn, "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{format(checkOut, "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-1">
                    <span className="text-muted-foreground">Noites:</span>
                    <span className="font-bold text-primary">{nights} noite{nights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participantes:</span>
                    <span className="font-medium">{attendees} pessoas</span>
                  </div>
                </div>
              )}
              
              {basePrice > 0 && nights > 0 && (
                <div className="pt-4 border-t">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({nights} noites)</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    {weekendNights > 0 && space.weekendSurchargePercent > 0 && (
                      <div className="flex flex-col gap-1 bg-amber-50 p-3 rounded-md">
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Adicional fim de semana
                          </span>
                          <span className="text-amber-700 font-bold">
                            +{formatCurrency(weekendSurchargeAmount)}
                          </span>
                        </div>
                        <div className="text-xs text-amber-600 flex justify-between">
                          <span>{weekendNights} noite{weekendNights !== 1 ? 's' : ''} × {space.weekendSurchargePercent}%</span>
                          <span>{formatCurrency(basePrice * (space.weekendSurchargePercent / 100))} por noite</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center font-bold text-lg pt-3 border-t mt-2">
                      <span>Total estimado</span>
                      <span className="text-primary text-xl">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceBookingPage;