// src/apps/main-app/pages/EventSpaceBookingPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { CalendarIcon, ChevronLeft, Users, Mail, Phone, Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { format, isWeekend } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { eventSpaceService, ServiceResponse } from '@/services/eventSpaceService';
import type { EventSpaceDetailsResponse, EventBooking, EventSpaceData } from '@/shared/types/event-spaces';

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

// ✅ CORREÇÃO: Tipos de eventos baseados nas consultas do banco de dados
const EVENT_TYPES = [
  // Valores da tabela eventBookings (já usados em reservas)
  { value: 'conference', label: 'Conferência' },
  { value: 'training', label: 'Formação/Treinamento' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'conferencia', label: 'Conferência (Esp)' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'Workshop', label: 'Workshop' },
  { value: 'Cerimônia', label: 'Cerimônia' },
  { value: 'Conferência', label: 'Conferência' },
  { value: 'Lançamento', label: 'Lançamento de Produto' },
  { value: 'Reunião', label: 'Reunião' },
  { value: 'Festa Corporativa', label: 'Festa Corporativa' },
  { value: 'Show', label: 'Show/Concerto' },
  { value: 'Casamento', label: 'Casamento' },
  { value: 'Outro', label: 'Outro' },
  { value: 'wedding', label: 'Casamento (Inglês)' },
  { value: 'party', label: 'Festa' },
  { value: 'corporate', label: 'Evento Corporativo' },
  { value: 'seminar', label: 'Seminário' },
  { value: 'exhibition', label: 'Exposição' },
  { value: 'concert', label: 'Concerto' },
  { value: 'product_launch', label: 'Lançamento de Produto (Inglês)' },
  { value: 'networking', label: 'Networking' },
  { value: 'team_building', label: 'Team Building' },
  { value: 'anniversary', label: 'Aniversário' },
];

// ✅ FUNÇÃO AUXILIAR: Remover duplicatas e ordenar por label
const getUniqueEventTypes = () => {
  const uniqueMap = new Map();
  
  EVENT_TYPES.forEach(type => {
    if (!uniqueMap.has(type.label)) {
      uniqueMap.set(type.label, type);
    }
  });
  
  return Array.from(uniqueMap.values()).sort((a, b) => 
    a.label.localeCompare(b.label, 'pt')
  );
};

// ✅ CORREÇÃO: Função formatCurrency melhorada
const formatCurrency = (amount: string | number | undefined): string => {
  if (amount === undefined || amount === null) {
    return '0,00 MTn';
  }
  
  let num: number;
  if (typeof amount === 'string') {
    // Remove espaços e converte vírgulas para pontos
    const cleanAmount = amount.replace(/\s/g, '').replace(',', '.');
    num = parseFloat(cleanAmount);
  } else {
    num = amount;
  }
  
  if (isNaN(num) || !isFinite(num)) {
    return '0,00 MTn';
  }
  
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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
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
  
  const uniqueEventTypes = getUniqueEventTypes();

  // ✅ CORREÇÃO: Log detalhado da chamada da API
  const { data: spaceDetailsResponse, isLoading, error: queryError } = useQuery<ServiceResponse<EventSpaceDetailsResponse>, Error>({
    queryKey: ['event-space-details', id],
    queryFn: () => {
      console.log('🔍 Chamando API para obter detalhes do espaço:', id);
      return eventSpaceService.getEventSpaceDetails(id!);
    },
    enabled: !!id,
    retry: 2,
  });

  // ✅ CORREÇÃO: Log detalhado da resposta
  useEffect(() => {
    if (spaceDetailsResponse) {
      console.log('📥 RESPOSTA DA API (Event Space Details):', {
        success: spaceDetailsResponse.success,
        error: spaceDetailsResponse.error,
        data: spaceDetailsResponse.data,
        hasSpace: !!spaceDetailsResponse.data?.space,
        space: spaceDetailsResponse.data?.space ? {
          id: spaceDetailsResponse.data.space.id,
          name: spaceDetailsResponse.data.space.name,
          basePricePerDay: spaceDetailsResponse.data.space.basePricePerDay,
          capacityMin: spaceDetailsResponse.data.space.capacityMin,
          capacityMax: spaceDetailsResponse.data.space.capacityMax,
          weekendSurchargePercent: spaceDetailsResponse.data.space.weekendSurchargePercent,
        } : null
      });
    }
    
    if (queryError) {
      console.error('❌ ERRO na query:', queryError);
    }
  }, [spaceDetailsResponse, queryError]);

  // ✅ CORREÇÃO: Extrair dados da resposta corretamente
  const spaceDetails = spaceDetailsResponse?.success 
    ? spaceDetailsResponse.data 
    : null;
  
  const space: EventSpaceData | null = spaceDetails?.space || null;
  const hotel: Hotel | null = spaceDetails?.hotel || null;

  // ✅ CORREÇÃO: Log dos dados extraídos
  useEffect(() => {
    if (space) {
      console.log('📊 DADOS DO ESPAÇO EXTRAÍDOS:', {
        name: space.name,
        basePricePerDay: space.basePricePerDay,
        typeofBasePricePerDay: typeof space.basePricePerDay,
        capacityMin: space.capacityMin,
        capacityMax: space.capacityMax,
        weekendSurchargePercent: space.weekendSurchargePercent,
        areaSqm: space.areaSqm,
        spaceType: space.spaceType,
        allowedEventTypes: space.allowedEventTypes,
      });
    }
  }, [space]);

  // ✅ CORREÇÃO: Efeito para inicializar com valores mínimos
  useEffect(() => {
    if (space?.capacityMin) {
      setAttendees(space.capacityMin);
    }
    
    if (space?.allowedEventTypes && space.allowedEventTypes.length > 0 && !bookingInfo.eventType) {
      const firstAllowedType = space.allowedEventTypes[0];
      const matchingType = uniqueEventTypes.find(type => 
        type.value === firstAllowedType || 
        type.label.toLowerCase() === firstAllowedType.toLowerCase()
      );
      
      if (matchingType) {
        setBookingInfo(prev => ({
          ...prev,
          eventType: matchingType.value
        }));
        console.log('🎯 Tipo de evento sugerido do espaço:', matchingType.value);
      }
    }
  }, [space]);

  // ✅ CORREÇÃO: Efeito para atualizar step com base na query param
  useEffect(() => {
    if (params.get('step')) {
      const stepParam = parseInt(params.get('step')!);
      if (!isNaN(stepParam) && stepParam >= 1 && stepParam <= 2) {
        setStep(stepParam);
      }
    }
  }, [search, params]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!startDate || !endDate) {
        toast.error('Selecione as datas de início e fim do evento');
        return;
      }
      
      if (endDate <= startDate) {
        toast.error('A data de término deve ser após a data de início');
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
    } else if (step === 2) {
      if (!bookingInfo.organizerName.trim()) {
        toast.error('Preencha o nome do organizador');
        return;
      }
      if (!bookingInfo.organizerEmail.trim()) {
        toast.error('Preencha o email do organizador');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(bookingInfo.organizerEmail)) {
        toast.error('Digite um email válido');
        return;
      }
      if (!bookingInfo.eventTitle.trim()) {
        toast.error('Preencha o título do evento');
        return;
      }
      if (!bookingInfo.eventType || bookingInfo.eventType.trim() === '') {
        toast.error('Selecione um tipo de evento');
        return;
      }
      if (bookingInfo.eventType.trim().length < 2) {
        toast.error('Tipo de evento deve ter pelo menos 2 caracteres');
        return;
      }
      handleSubmitBooking();
    }
  };

  const handleSubmitBooking = async () => {
    if (!id || !space || !startDate || !endDate) {
      toast.error('Informações incompletas');
      return;
    }

    const bookingData = {
      event_space_id: id,
      organizer_name: bookingInfo.organizerName,
      organizer_email: bookingInfo.organizerEmail,
      organizer_phone: bookingInfo.organizerPhone || undefined,
      event_title: bookingInfo.eventTitle,
      event_description: bookingInfo.eventDescription || undefined,
      event_type: bookingInfo.eventType,
      start_date: format(startDate!, 'yyyy-MM-dd'),
      end_date: format(endDate!, 'yyyy-MM-dd'),
      expected_attendees: attendees,
      special_requests: bookingInfo.specialRequests || undefined,
      catering_required: bookingInfo.cateringRequired,
    };

    console.log('📤 DADOS ENVIANDO PARA O BACKEND:', bookingData);

    if (!bookingData.event_type || bookingData.event_type.trim().length < 2) {
      toast.error('Tipo de evento inválido. Selecione uma opção válida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await eventSpaceService.createEventBooking(id, bookingData);
      
      console.log('📥 RESPOSTA DO BACKEND:', result);
      
      if (result.success && result.data) {
        toast.success('Solicitação de reserva enviada com sucesso!');
        setLocation(`/bookings/event/${result.data.id}/confirmation`);
      } else {
        const errorMsg = result.error || 'Erro ao enviar solicitação de reserva';
        
        if (errorMsg.includes('event_type') || errorMsg.includes('event type')) {
          toast.error(`Erro no tipo de evento: ${bookingInfo.eventType}. Por favor, selecione outra opção.`);
        } else {
          toast.error(errorMsg);
        }
      }
    } catch (error: any) {
      console.error('❌ ERRO NA CRIAÇÃO DA RESERVA:', error);
      
      if (error.message?.includes('event_type') || error.message?.includes('Required')) {
        toast.error(`Erro de validação: Tipo de evento "${bookingInfo.eventType}" não é válido.`);
      } else {
        toast.error(error.message || 'Erro ao enviar solicitação de reserva');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ✅ CORREÇÃO: Obter preço base do espaço - CORRIGIDA
  const getBasePrice = (): number => {
    if (!space?.basePricePerDay) {
      console.warn('⚠️ Preço base não encontrado no espaço:', {
        spaceName: space?.name,
        basePricePerDay: space?.basePricePerDay,
        type: typeof space?.basePricePerDay
      });
      return 0;
    }
    
    // Tenta converter para número
    const price = space.basePricePerDay;
    let numericPrice: number;
    
    if (typeof price === 'string') {
      // Remove espaços e converte vírgulas para pontos
      const cleanPrice = price.replace(/\s/g, '').replace(',', '.');
      numericPrice = parseFloat(cleanPrice);
      
      if (isNaN(numericPrice)) {
        console.warn('⚠️ Não foi possível converter preço para número:', price);
        return 0;
      }
    } else if (typeof price === 'number') {
      numericPrice = price;
    } else {
      console.warn('⚠️ Tipo de preço desconhecido:', typeof price, price);
      return 0;
    }
    
    return numericPrice;
  };

  // ✅ CORREÇÃO: Calcular preço total
  const calculateTotalPrice = (): number => {
    const basePricePerDay = getBasePrice();
    if (basePricePerDay <= 0) return 0;
    
    const days = calculateDays();
    let basePrice = basePricePerDay * days;
    
    // Verificar fins de semana
    let hasWeekend = false;
    if (space?.weekendSurchargePercent && space.weekendSurchargePercent > 0 && startDate) {
      const tempDate = new Date(startDate);
      for (let i = 0; i < days; i++) {
        if (isWeekend(tempDate)) {
          hasWeekend = true;
          break;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }
    
    let total = basePrice;
    if (hasWeekend && space?.weekendSurchargePercent) {
      const surcharge = basePrice * (space.weekendSurchargePercent / 100);
      total = basePrice + surcharge;
    }
    
    return total;
  };

  const isWeekendDay = (date: Date | undefined): boolean => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const calculateWeekendDays = (): number => {
    if (!startDate || !endDate) return 0;
    
    let weekendDays = 0;
    const tempDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (tempDate < endDateObj) {
      const day = tempDate.getDay();
      if (day === 0 || day === 6) {
        weekendDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    return weekendDays;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando informações do espaço de evento...</p>
        </div>
      </div>
    );
  }

  if (!spaceDetailsResponse?.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar espaço
            </CardTitle>
            <CardDescription>
              {spaceDetailsResponse?.error || 'O espaço não foi encontrado ou ocorreu um erro'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center text-muted-foreground">
                Verifique o ID do espaço ou volte para a página de busca.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setLocation('/event-spaces/search')} className="mx-auto" variant="default">
                  Voltar para busca
                </Button>
                <Button onClick={() => window.location.reload()} className="mx-auto" variant="outline">
                  Tentar novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Espaço de evento não encontrado</CardTitle>
            <CardDescription>
              O espaço que procura não existe ou foi removido.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center text-muted-foreground">
                Verifique o ID do espaço ou volte para a página de busca.
              </p>
              <Button onClick={() => setLocation('/event-spaces/search')} className="mx-auto" variant="outline">
                Voltar para busca
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ CORREÇÃO: Obter preço base para display
  const basePrice = getBasePrice();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/event-spaces/${id}`)}
          className="pl-0"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para detalhes do espaço
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
                {step === 1 ? 'Datas e Capacidade do Evento' : 'Informações do Evento'}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? 'Quando e para quantas pessoas?' 
                  : 'Conte-nos mais sobre seu evento'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 ? (
                <>
                  {/* Datas */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Data de Início *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                              id="start-date"
                            >
                              {startDate ? format(startDate, "PPP", { locale: pt }) : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              locale={pt}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end-date" className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          Data de Término *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                              id="end-date"
                            >
                              {endDate ? format(endDate, "PPP", { locale: pt }) : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                
                                if (date < today) return true;
                                
                                if (!startDate) return false;
                                
                                const startDateObj = new Date(startDate);
                                startDateObj.setHours(0, 0, 0, 0);
                                const selectedDate = new Date(date);
                                selectedDate.setHours(0, 0, 0, 0);
                                
                                return selectedDate <= startDateObj;
                              }}
                              initialFocus
                              locale={pt}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* Resumo de dias */}
                    {startDate && endDate && endDate > startDate && (
                      <div className="bg-primary/5 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {calculateDays()} dia{calculateDays() !== 1 ? 's' : ''} selecionado{calculateDays() !== 1 ? 's' : ''}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ({format(startDate, 'dd/MM')} a {format(endDate, 'dd/MM')})
                          </span>
                        </div>
                        {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && calculateWeekendDays() > 0 && (
                          <p className="text-amber-600 mt-1 text-sm">
                            {calculateWeekendDays()} dia{calculateWeekendDays() !== 1 ? 's' : ''} de fim de semana 
                            (+{space.weekendSurchargePercent}%)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Participantes */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Número Esperado de Participantes *
                    </Label>
                    
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
                        <div className="text-4xl font-bold text-primary">
                          {attendees}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          participantes
                        </div>
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
                    
                    <div className="text-sm text-muted-foreground">
                      Capacidade: mínimo {space.capacityMin || 1}, máximo {space.capacityMax || 1000} pessoas
                    </div>
                    
                    {space && (attendees < space.capacityMin || attendees > space.capacityMax) && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {attendees < space.capacityMin
                          ? `Mínimo de ${space.capacityMin} participantes`
                          : `Máximo de ${space.capacityMax} participantes`}
                      </div>
                    )}
                  </div>

                  {/* Catering */}
                  {space.offersCatering && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="catering"
                          checked={bookingInfo.cateringRequired}
                          onChange={(e) => setBookingInfo({
                            ...bookingInfo,
                            cateringRequired: e.target.checked
                          })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="catering" className="font-medium cursor-pointer">
                          Solicitar serviço de catering
                        </Label>
                      </div>
                      {space.cateringDiscountPercent && space.cateringDiscountPercent > 0 && (
                        <p className="text-sm text-green-600">
                          Desconto de {space.cateringDiscountPercent}% disponível para catering!
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Step 2: Informações do Evento */
                <div className="space-y-6">
                  {/* Nome do Evento */}
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Nome do Evento *</Label>
                    <Input
                      id="event-name"
                      value={bookingInfo.eventTitle}
                      onChange={(e) => setBookingInfo({...bookingInfo, eventTitle: e.target.value})}
                      placeholder="Ex: Casamento Maria & João, Conferência Tech 2024, etc."
                      required
                    />
                  </div>
                  
                  {/* Tipo de Evento */}
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Tipo de Evento *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {uniqueEventTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={bookingInfo.eventType === type.value ? "default" : "outline"}
                          onClick={() => {
                            console.log('🔘 Event type selecionado:', type.value);
                            setBookingInfo({...bookingInfo, eventType: type.value});
                          }}
                          className="justify-start h-auto py-3"
                        >
                          {bookingInfo.eventType === type.value && <CheckCircle className="h-4 w-4 mr-2" />}
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição do Evento</Label>
                    <Textarea
                      id="description"
                      value={bookingInfo.eventDescription}
                      onChange={(e) => setBookingInfo({...bookingInfo, eventDescription: e.target.value})}
                      placeholder="Descreva seu evento, objetivos, público-alvo, etc."
                      rows={4}
                    />
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Informações de Contacto</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="organizerName">Nome Completo *</Label>
                        <Input
                          id="organizerName"
                          value={bookingInfo.organizerName}
                          onChange={(e) => setBookingInfo({...bookingInfo, organizerName: e.target.value})}
                          placeholder="Nome da pessoa responsável"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizerEmail">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="organizerEmail"
                              type="email"
                              className="pl-10"
                              value={bookingInfo.organizerEmail}
                              onChange={(e) => setBookingInfo({...bookingInfo, organizerEmail: e.target.value})}
                              placeholder="seu@email.com"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="organizerPhone">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="organizerPhone"
                              className="pl-10"
                              value={bookingInfo.organizerPhone}
                              onChange={(e) => setBookingInfo({...bookingInfo, organizerPhone: e.target.value})}
                              placeholder="+258 84 123 4567"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pedidos Especiais */}
                  <div className="space-y-2">
                    <Label htmlFor="special-requests">Pedidos Especiais ou Requisitos</Label>
                    <Textarea
                      id="special-requests"
                      value={bookingInfo.specialRequests}
                      onChange={(e) => setBookingInfo({...bookingInfo, specialRequests: e.target.value})}
                      placeholder="Equipamento adicional (projetor, som), configurações especiais (layout sala), horários específicos, necessidades de acesso..."
                      rows={3}
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
                Voltar para datas
              </Button>
            )}
            <Button 
              onClick={handleNextStep} 
              className="ml-auto min-w-[200px]"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : step === 1 ? (
                'Continuar para detalhes'
              ) : (
                '📤 Enviar Solicitação'
              )}
            </Button>
          </div>
        </div>

        {/* ✅ CORREÇÃO: Resumo Lateral - com preços corretos */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Resumo da Solicitação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hotel e Espaço */}
              <div className="pb-4 border-b">
                <h3 className="font-bold text-lg">{space.name}</h3>
                {hotel && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {hotel.name} • {hotel.locality || 'Localização'}
                    </span>
                  </div>
                )}
                
                {/* Detalhes do Espaço */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Capacidade:</span>
                    <span className="font-medium">
                      {space.capacityMin || 1} - {space.capacityMax || 1000} pessoas
                    </span>
                  </div>
                  
                  {/* ✅ CORREÇÃO: MOSTRAR PREÇO BASE */}
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground block mb-1">Preço base:</span>
                    <div className={cn(
                      "text-2xl font-bold",
                      basePrice > 0 ? "text-primary" : "text-amber-600"
                    )}>
                      {basePrice > 0 
                        ? formatCurrency(basePrice)
                        : "Preço não disponível"
                      }
                      <span className="text-sm font-normal text-muted-foreground ml-1">/dia</span>
                    </div>
                    {basePrice <= 0 && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Contacte o hotel para obter o preço</span>
                      </div>
                    )}
                    {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && (
                      <p className="text-amber-600 text-sm mt-1">
                        +{space.weekendSurchargePercent}% aos fins de semana
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Datas do Evento */}
              {startDate && endDate && (
                <div className="pb-4 border-b">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Datas do Evento
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Início:</span>
                      <span className="font-medium">{format(startDate, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Término:</span>
                      <span className="font-medium">{format(endDate, "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duração:</span>
                      <span className="font-medium">
                        {calculateDays()} dia{calculateDays() !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Participantes:</span>
                      <span className="font-medium">{attendees} pessoas</span>
                    </div>
                    {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && calculateWeekendDays() > 0 && (
                      <div className="flex justify-between mt-2 pt-2 border-t">
                        <span className="text-amber-600">Dias fim de semana:</span>
                        <span className="text-amber-600 font-medium">{calculateWeekendDays()} dia{calculateWeekendDays() !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {bookingInfo.eventType && step === 2 && (
                <div className="pb-4 border-b">
                  <h4 className="font-medium mb-2">Tipo de Evento</h4>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-700">
                        {uniqueEventTypes.find(type => type.value === bookingInfo.eventType)?.label || bookingInfo.eventType}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ✅ CORREÇÃO: Preços com basePrice > 0 */}
              {basePrice > 0 && startDate && endDate && endDate > startDate && (
                <div className="pt-2">
                  <div className="flex justify-between items-center text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">
                        {formatCurrency(basePrice)} × {calculateDays()} dia{calculateDays() !== 1 ? 's' : ''}
                      </span>
                      {calculateWeekendDays() > 0 && (
                        <span className="text-xs text-muted-foreground block">
                          ({calculateDays() - calculateWeekendDays()} dias úteis + {calculateWeekendDays()} fins de semana)
                        </span>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(basePrice * calculateDays())}
                    </span>
                  </div>
                  
                  {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && calculateWeekendDays() > 0 && (
                    <div className="flex justify-between items-center text-sm mt-2 mb-3">
                      <span className="text-muted-foreground">
                        Acréscimo fim de semana ({space.weekendSurchargePercent}%)
                      </span>
                      <span className="text-amber-600">
                        +{formatCurrency((basePrice * calculateWeekendDays()) * (space.weekendSurchargePercent / 100))}
                      </span>
                    </div>
                  )}
                  
                  {bookingInfo.cateringRequired && space.offersCatering && (
                    <div className="flex justify-between items-center text-sm mt-2 mb-3">
                      <span className="text-muted-foreground">Serviço de catering</span>
                      <span className="text-green-600">
                        {space.cateringDiscountPercent && space.cateringDiscountPercent > 0 
                          ? `${space.cateringDiscountPercent}% desc.`
                          : 'Sob consulta'
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center font-bold text-2xl">
                      <span>Total estimado</span>
                      <span className="text-primary">
                        {formatCurrency(calculateTotalPrice())}
                      </span>
                    </div>
                    {calculateWeekendDays() > 0 && space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Inclui {calculateWeekendDays()} dia{calculateWeekendDays() !== 1 ? 's' : ''} de fim de semana
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Preço final sujeito à confirmação do hotel
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ ADICIONADO: Mensagem se não há preço */}
              {basePrice <= 0 && startDate && endDate && endDate > startDate && (
                <div className="pt-4 border-t">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800">Preço não disponível</p>
                        <p className="text-sm text-amber-700 mt-1">
                          O preço deste espaço não está disponível online. 
                          O hotel entrará em contacto consigo para fornecer um orçamento personalizado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 pt-4 border-t">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium mb-2">🔍 Debug: Dados do Espaço</summary>
                    <div className="mt-2 space-y-1">
                      <p>ID: {space.id}</p>
                      <p>Nome: {space.name}</p>
                      <p>Preço base: ({space.basePricePerDay})</p>
                      <p>Preço calculado: {formatCurrency(calculateTotalPrice())}</p>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(space, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Processo de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3 pt-0">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Envio da Solicitação</p>
                  <p className="text-muted-foreground">Esta é uma solicitação preliminar</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 text-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Análise do Hotel</p>
                  <p className="text-muted-foreground">O hotel analisará em até 24h</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 text-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirmação</p>
                  <p className="text-muted-foreground">Receberá contacto para detalhes finais</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/20 text-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">Pagamento</p>
                  <p className="text-muted-foreground">Depósito para confirmar reserva</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceBookingPage;