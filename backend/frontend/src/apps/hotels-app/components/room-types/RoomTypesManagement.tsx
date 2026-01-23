// src/apps/hotels-app/components/room-types/RoomTypesManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Calendar, momentLocalizer, Views, NavigateAction } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Loader2, Plus, Edit, Trash, AlertCircle, Wifi, Users, Star, 
  DoorOpen, Calendar as CalendarIcon, Building2, X, RefreshCw, Info,
  ChevronRight
} from 'lucide-react';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';
import CreateRoomTypeFormModern from './CreateRoomTypeFormModern';
import {
  CalendarOptions,
  LoadedPeriod,
} from '@/shared/types/hotels';

interface RoomTypesManagementProps {
  hotelId: string;
}

// Configuração do localizador (moment para português)
const localizer = momentLocalizer(moment);

// Limite suave para evitar ir muito longe no futuro (5 anos = 60 meses)
const MAX_MONTHS_FUTURE = 60;

// Configuração padrão de lazy loading (90 dias = ~3 meses)
const DEFAULT_CHUNK_DAYS = 90;

// Interface para eventos do calendário
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    available?: boolean;
    price?: number;
    status?: 'available' | 'blocked' | 'occupied' | 'booked';
    date?: string;
    availableUnits?: number;
    stopSell?: boolean;
  };
}

/**
 * Componente para gerenciar room types (quartos) do hotel
 * VERSÃO FINAL 100% - COMPLETA E PROFISSIONAL COM LAZY LOADING
 * Calendário com lazy loading: carrega 3 meses sob demanda
 * Navegação "infinita": gestor pode ir até 5+ anos no futuro (com limite suave)
 * Edição em qualquer data futura (sem limites fixos)
 * Tooltip bonito, reservas em azul, edição individual
 * Botão "Recarregar" para atualizar dados em tempo real
 * UX perfeita: toasts, loading, validações, recarregamento automático
 * Sistema de promoções completo e profissional
 * CORREÇÕES APLICADAS: Lógica mais clara e cores distintas para preços relativos
 */
export const RoomTypesManagement: React.FC<RoomTypesManagementProps> = ({ hotelId }) => {
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Estados do calendário com LAZY LOADING
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loadedPeriods, setLoadedPeriods] = useState<LoadedPeriod[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'block' | 'unblock' | 'price' | 'units' | null>(null);
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkUnits, setBulkUnits] = useState<string>('');
  const [dayPrice, setDayPrice] = useState<string>('');
  const [dayUnits, setDayUnits] = useState<string>('');
  const [dayBlocked, setDayBlocked] = useState<boolean>(false);
  
  // NOVOS ESTADOS PARA RESET
  const [bulkReset, setBulkReset] = useState(false);
  const [dayReset, setDayReset] = useState(false);

  // Estado para forçar reload (para mostrar mensagem específica)
  const [forceReloading, setForceReloading] = useState(false);

  // Estados para promoções
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({
    name: '',
    code: '',
    description: '',
    discount_percent: '',
    start_date: '',
    end_date: '',
    max_uses: '',
    applicable_room_types: [] as string[],
    is_active: true,
  });

  // Variáveis para estatísticas da disponibilidade
  const [availabilityStats, setAvailabilityStats] = useState({
    totalDias: 0,
    comPrecoOverride: 0,
    bloqueados: 0,
  });

  // Lista completa de amenities (50+ opções)
  const amenitiesOptions = [
    'Wi-Fi Gratuito', 'Piscina Exterior', 'Piscina Interior', 'Estacionamento Gratuito', 'Estacionamento Privado',
    'Restaurante', 'Bar', 'Spa', 'Ginásio', 'Ar Condicionado', 'TV por Cabo', 'Serviço de Quarto 24h',
    'Lavandaria', 'Recepção 24h', 'Elevador', 'Acesso para Deficientes', 'Cofre no Quarto', 'Minibar',
    'Secador de Cabelo', 'Banheira', 'Chuveiro', 'Varanda', 'Vista para o Mar', 'Vista para a Piscina',
    'Kitchenette', 'Micro-ondas', 'Frigorífico', 'Cozinha Completa', 'Sala de Reuniões', 'Centro de Negócios',
    'Transfer Aeroporto', 'Aluguer de Carros', 'Aluguer de Bicicletas', 'Pequeno-Almoço Incluído', 'Meia Pensão',
    'Pensão Completa', 'Área para Crianças', 'Babysitting', 'Animais Permitidos', 'Quartos Não Fumadores',
    'Quartos Familiares', 'Quartos Comunicantes', 'Suite Nupcial', 'Jacuzzi', 'Sauna', 'Massagens',
    'Campo de Ténis', 'Campo de Golfe', 'Mergulho', 'Passeios a Cavalo', 'Ginásio 24h', 'Aulas de Ioga',
  ];

  // Carregar room types
  useEffect(() => {
    if (hotelId) {
      loadRoomTypes();
    }
  }, [hotelId]);

  // Carregar promoções quando abrir a aba
  useEffect(() => {
    if (hotelId && activeSubTab === 'promotions') {
      loadPromotions();
    }
  }, [hotelId, activeSubTab]);

  // Resetar estados do calendário quando mudar de room type ou aba
  useEffect(() => {
    if (activeSubTab === 'availability' && selectedRoomTypeId) {
      setAllEvents([]);
      setLoadedPeriods([]);
      setAvailabilityStats({
        totalDias: 0,
        comPrecoOverride: 0,
        bloqueados: 0,
      });
      loadCalendarData(new Date()); // Carrega o período atual
    }
  }, [selectedRoomTypeId, activeSubTab]);

  const loadRoomTypes = async () => {
    if (!hotelId) {
      setError('Nenhum hotel selecionado');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await hotelService.getRoomTypesByHotel(hotelId);
      if (response.success && response.data) {
        setRoomTypes(response.data);
        if (!selectedRoomTypeId && response.data.length > 0) {
          setSelectedRoomTypeId(response.data[0].id);
        }
      } else {
        setError(response.error || 'Erro ao carregar tipos de quarto');
      }
    } catch (err) {
      setError('Erro ao carregar tipos de quarto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar promoções
  const loadPromotions = async () => {
    setLoadingPromotions(true);
    try {
      const response = await hotelService.getPromotionsByHotel(hotelId);
      if (response.success) {
        setPromotions(response.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar promoções:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as promoções',
        variant: 'destructive',
      });
    } finally {
      setLoadingPromotions(false);
    }
  };

  // LAZY LOADING: Carregar disponibilidade + reservas por chunks
  const loadCalendarData = async (
    targetDate: Date = currentViewDate,
    options: CalendarOptions = { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false }
  ) => {
    if (!selectedRoomTypeId || !hotelId) return;
    
    // Calcula o chunk baseado no chunkSize (convertendo dias para meses)
    const chunkMonths = Math.ceil((options.chunkSize || DEFAULT_CHUNK_DAYS) / 30);
    const start = moment(targetDate).startOf('month').format('YYYY-MM-DD');
    const end = moment(targetDate).add(chunkMonths, 'months').endOf('month').format('YYYY-MM-DD');

    // Verifica limite suave de meses futuros (5 anos)
    const monthsFromNow = moment(end).diff(moment(), 'months');
    if (monthsFromNow > MAX_MONTHS_FUTURE) {
      toast({
        title: 'Limite atingido',
        description: `Não é possível carregar mais de ${MAX_MONTHS_FUTURE/12} anos no futuro`,
        variant: 'default',
      });
      return;
    }

    // Verifica se este período já foi carregado
    const isAlreadyLoaded = loadedPeriods.some(p => 
      moment(start).isSameOrAfter(p.start) && moment(end).isSameOrBefore(p.end)
    );

    if (isAlreadyLoaded) {
      console.log('Período já carregado:', start, 'até', end);
      return;
    }

    setLoadingCalendar(true);
    setForceReloading(options.forceReload || false);
    
    try {
      console.log('CALENDÁRIO (LAZY): Buscando disponibilidade de', start, 'até', end, 'com opções:', {
        chunkSize: options.chunkSize,
        forceReload: options.forceReload,
        chunkMonths
      });

      // Busca disponibilidade para o chunk
      const availResponse = await hotelService.getAvailabilityCalendar(
        hotelId,
        selectedRoomTypeId,
        start,
        end,
        options
      );
      const availability = availResponse?.data || [];
      
      // CONTAGEM CORRETA DE OVERRIDES E BLOQUEIOS
      let comPrecoOverride = 0;
      let bloqueados = 0;

      availability.forEach((item: any) => {
        // Detecta override de preço (mesmo que seja 0)
        if (item.price !== null && item.price !== undefined) {
          comPrecoOverride++;
        }
        // Detecta bloqueio real
        if (item.stopSell === true) {
          bloqueados++;
        }
      });

      console.log('Contagem real:', { 
        comPrecoOverride, 
        bloqueados, 
        totalDias: availability.length 
      });

      // Atualiza estatísticas
      setAvailabilityStats(prev => ({
        totalDias: prev.totalDias + availability.length,
        comPrecoOverride: prev.comPrecoOverride + comPrecoOverride,
        bloqueados: prev.bloqueados + bloqueados,
      }));

      // Tratamento para quando a API retorna array vazio
      if (availability.length === 0) {
        console.warn('API retornou array vazio de disponibilidade para o período', start, 'até', end);
        
        // MELHORIA: Aviso apenas para períodos muito futuros ou primeira carga
        const isFarFuture = moment(end).diff(moment(), 'months') > 12;
        if (loadedPeriods.length === 0 || isFarFuture) {
          toast({
            title: 'Datas futuras',
            description: 'Usando disponibilidade padrão (sem overrides cadastrados)',
            variant: 'default',
          });
        }
      } else {
        console.log('API retornou', availability.length, 'dias de disponibilidade');
      }

      // Busca reservas para este room type (não limitado por período)
      const bookingsResponse = await hotelService.getBookingsByRoomType(hotelId, selectedRoomTypeId);
      const bookings = bookingsResponse?.success ? bookingsResponse.data : [];

      // Filtra reservas que estão dentro do chunk atual
      const filteredBookings = bookings.filter((booking: any) => {
        const bookingStart = moment(booking.checkIn);
        const bookingEnd = moment(booking.checkOut);
        return (
          bookingStart.isBetween(start, end, 'day', '[]') ||
          bookingEnd.isBetween(start, end, 'day', '[]') ||
          (bookingStart.isBefore(start) && bookingEnd.isAfter(end))
        );
      });

      // Cria eventos de disponibilidade
      const availEvents: CalendarEvent[] = availability.map((item: any) => ({
        id: `avail-${item.date}`,
        title: item.availableUnits > 0 && !item.stopSell
          ? `Disponível - ${item.price || 'Padrão'} MZN`
          : 'Indisponível/Bloqueado',
        start: new Date(item.date),
        end: new Date(item.date),
        allDay: true,
        resource: {
          available: item.availableUnits > 0 && !item.stopSell,
          price: item.price,
          status: item.stopSell ? 'blocked' : item.availableUnits > 0 ? 'available' : 'occupied',
          date: item.date,
          availableUnits: item.availableUnits,
          stopSell: item.stopSell,
        },
      }));

      // Cria eventos de reservas (apenas para o chunk atual)
      const bookingEvents: CalendarEvent[] = filteredBookings.map((booking: any) => ({
        id: `booking-${booking.id}`,
        title: `Reserva: ${booking.guestName || 'Cliente'}`,
        start: new Date(booking.checkIn),
        end: new Date(booking.checkOut),
        allDay: false,
        resource: { status: 'booked' },
      }));

      // Adiciona novos eventos, evitando duplicações
      setAllEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id));
        const newEvents = [...availEvents, ...bookingEvents].filter(e => !existingIds.has(e.id));
        return [...prev, ...newEvents];
      });

      // Marca o período como carregado
      setLoadedPeriods(prev => [...prev, { start, end }]);
      
      console.log('Período carregado:', start, 'até', end, '| Total períodos:', loadedPeriods.length + 1);

    } catch (err) {
      console.error('Erro ao carregar calendário (lazy):', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar disponibilidade/reservas',
        variant: 'destructive',
      });
    } finally {
      setLoadingCalendar(false);
      setForceReloading(false);
    }
  };

  // Função para recarregar calendário manualmente (com reset)
  const reloadCalendarData = async () => {
    if (!selectedRoomTypeId || !hotelId) {
      toast({
        title: 'Aviso',
        description: 'Selecione um tipo de quarto primeiro',
        variant: 'default',
      });
      return;
    }
    
    toast({
      title: 'Recarregando...',
      description: 'Atualizando dados do calendário',
    });
    
    // Reseta e carrega o período atual com forceReload
    setAllEvents([]);
    setLoadedPeriods([]);
    setAvailabilityStats({
      totalDias: 0,
      comPrecoOverride: 0,
      bloqueados: 0,
    });
    await loadCalendarData(currentViewDate, { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: true });
  };

  // Função para carregar mais meses à frente
  const loadMoreMonths = async (additionalMonths: number = 6) => {
    if (!selectedRoomTypeId || !hotelId) return;
    
    const futureDate = moment(currentViewDate).add(additionalMonths, 'months').toDate();
    await loadCalendarData(futureDate, { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false });
    
    toast({
      title: 'Carregado',
      description: `Carregados mais ${additionalMonths} meses à frente`,
    });
  };

  // FUNÇÃO eventPropGetter ATUALIZADA COM LÓGICA MAIS CLARA E CORES DISTINTAS
  const eventPropGetter = (event: any) => {
    // Obtém o base_price do room type selecionado
    const basePrice = roomTypes.find(r => r.id === selectedRoomTypeId)?.base_price || 0;
    const currentPrice = event.resource?.price || basePrice; // Fallback para base se não override
    const availableUnits = event.resource?.availableUnits || 0; // Unidades disponíveis
    const stopSell = event.resource?.stopSell || false; // Bloqueio
    const status = event.resource?.status || ''; // Ex.: 'booked'
    
    // Calcular ratio relativo ao base_price (ex.: 1.2 = +20%)
    const priceRatio = basePrice > 0 ? currentPrice / basePrice : 1;
    
    let backgroundColor = '#e0f2fe'; // Disponível (azul claro)
    let color = '#000000'; // Texto padrão
    let title = `Disponível: ${availableUnits} unidades | Preço: ${currentPrice} MZN`; // Tooltip default
    
    // Lógica prioritária: Status primeiro, depois preço
    if (status === 'booked') {
      backgroundColor = '#3b82f6'; // Reserva (azul médio)
      color = '#ffffff';
      title = `Reserva: ${availableUnits} unidades reservadas | Preço: ${currentPrice} MZN`;
    } else if (stopSell || status === 'blocked') {
      backgroundColor = '#dc2626'; // Bloqueado (vermelho forte) — mais distinto
      color = '#ffffff';
      title = `Bloqueado: 0 unidades | Preço: ${currentPrice} MZN`;
    } else if (availableUnits === 0) {
      backgroundColor = '#f87171'; // Indisponível (vermelho médio) — distinto de bloqueado
      color = '#ffffff';
      title = `Indisponível: 0 unidades | Preço: ${currentPrice} MZN`;
    } else if (priceRatio > 1.5) { // Preço Muito Alto: +50% do base (ex.: alta temporada)
      backgroundColor = '#f59e0b'; // Laranja (aviso alto)
      color = '#000000';
      title = `Preço Muito Alto: ${currentPrice} MZN (+${Math.round((priceRatio - 1) * 100)}%)`;
    } else if (priceRatio > 1.2) { // Preço Especial: +20% do base (ex.: evento especial)
      backgroundColor = '#fef3c7'; // Amarelo claro
      color = '#000000';
      title = `Preço Especial: ${currentPrice} MZN (+${Math.round((priceRatio - 1) * 100)}%)`;
    }
    
    // Retorno com estilo e tooltip
    return {
      style: { 
        backgroundColor, 
        color,
        borderRadius: '4px',
        opacity: 0.9,
        border: '0px',
        display: 'block',
        padding: '2px 6px',
        fontSize: '12px',
      },
      title, // Tooltip mostrado ao hover (Big Calendar suporta via title prop)
    };
  };

  const handleDeleteRoomType = async (roomTypeId: string, roomName: string) => {
    if (!hotelId) {
      toast({ title: "Erro", description: "Nenhum hotel selecionado", variant: "destructive" });
      return;
    }
    if (!window.confirm(`Tem certeza que deseja deletar "${roomName}"?`)) return;

    try {
      const response = await hotelService.deleteRoomType(hotelId, roomTypeId);
      if (response.success) {
        setRoomTypes(roomTypes.filter(rt => rt.id !== roomTypeId));
        if (selectedRoomTypeId === roomTypeId) {
          setSelectedRoomTypeId(roomTypes.length > 1 ? roomTypes[1].id : null);
        }
        toast({ title: "Quarto deletado", description: `${roomName} removido com sucesso` });
      } else {
        toast({ title: "Erro", description: response.error || 'Falha ao deletar', variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao deletar quarto", variant: "destructive" });
    }
  };

  const handleAddRoom = () => {
    if (!hotelId) {
      toast({ title: "Selecione um hotel", description: "É preciso selecionar um hotel primeiro", variant: "default" });
      return;
    }
    setEditingId(null);
    setShowCreateForm(true);
  };

  const handleEditRoom = (roomId: string) => {
    setEditingId(roomId);
    setShowCreateForm(true);
  };

  const handleSelectSlot = (slotInfo: any) => {
    const { start, end } = slotInfo;
    setSelectedRange({ start, end });
    setShowBulkModal(true);
  };

  const handleSelectEvent = (event: any) => {
    if (event.id?.startsWith('avail-') && event.resource?.date) {
      setSelectedDay(new Date(event.resource.date));
      setDayPrice(event.resource?.price?.toString() || '');
      setDayUnits(event.resource?.availableUnits?.toString() || '');
      setDayBlocked(event.resource?.status === 'blocked' || !event.resource?.available);
      setShowDayModal(true);
    }
  };

  const handleApplyBulk = async () => {
    if (!selectedRoomTypeId || !selectedRange || !hotelId) {
      toast({ title: 'Erro', description: 'Selecione quarto e datas', variant: 'destructive' });
      return;
    }

    // Reset: Envia reset: true para backend deletar
    if (bulkReset) {
      if (!window.confirm('Resetar datas ao padrão? Remove overrides.')) return;
      const updates = [];
      let current = moment(selectedRange.start);
      while (current.isSameOrBefore(selectedRange.end)) {
        updates.push({ date: current.format('YYYY-MM-DD'), reset: true });
        current.add(1, 'day');
      }
      console.log('Bulk payload (reset):', JSON.stringify({ updates }, null, 2));
      await hotelService.bulkUpdateAvailability(hotelId, selectedRoomTypeId, updates);
      toast({ title: 'Sucesso', description: 'Resetado' });
      setShowBulkModal(false);
      // Recarrega afetados (mantenha código original)
      const affectedPeriods = loadedPeriods.filter(p => {
        const periodStart = moment(p.start);
        const periodEnd = moment(p.end);
        const updateStart = moment(selectedRange.start);
        const updateEnd = moment(selectedRange.end);
        
        return (
          (updateStart.isBetween(periodStart, periodEnd, 'day', '[]') ||
           updateEnd.isBetween(periodStart, periodEnd, 'day', '[]') ||
           (updateStart.isBefore(periodStart) && updateEnd.isAfter(periodEnd)))
        );
      });

      // Recarrega cada período afetado
      for (const period of affectedPeriods) {
        await loadCalendarData(moment(period.start).toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: true });
      }
      return;
    }

    // Validação normal
    if (!bulkAction && !bulkPrice && !bulkUnits) {
      toast({ title: 'Erro', description: 'Selecione ação/valores', variant: 'destructive' });
      return;
    }

    let validatedPrice: number | null = null;
    if (bulkPrice.trim() !== '') {
      const priceNum = parseFloat(bulkPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast({ title: 'Preço inválido', description: '> 0 MZN', variant: 'destructive' });
        return;
      }
      validatedPrice = priceNum;
    }

    let validatedUnits: number | null = null;
    if (bulkUnits.trim() !== '') {
      const unitsNum = parseInt(bulkUnits);
      const max = roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || 100;
      if (isNaN(unitsNum) || unitsNum < 0 || unitsNum > max) {
        toast({ title: 'Unidades inválidas', description: `0-${max}`, variant: 'destructive' });
        return;
      }
      validatedUnits = unitsNum;
    }

    const updates = [];
    let current = moment(selectedRange.start);
    while (current.isSameOrBefore(selectedRange.end)) {
      const dateStr = current.format('YYYY-MM-DD');
      const update: any = { date: dateStr };

      // Combinação de ações
      if (bulkAction === 'block') {
        update.stop_sell = true;
        update.available_units = 0;
        update.price_override = null;  // Reset preço em block
      } else if (bulkAction === 'unblock') {
        update.stop_sell = false;
        if (validatedPrice === null) update.price_override = null;  // Non-explicit: reset preço
        if (validatedUnits === null) update.available_units = null;  // Reset units to default
      } else if (bulkAction === 'units' && validatedUnits !== null) {
        update.available_units = validatedUnits;
        update.stop_sell = validatedUnits === 0;
      }

      // Preço: Explicit se valor, non-explicit null para reset
      if (validatedPrice !== null) {
        update.price_override = validatedPrice;
      } else if (bulkPrice.trim() === '' && bulkAction !== 'block') {
        update.price_override = null;  // Non-explicit reset
      }

      // Units: Similar
      if (validatedUnits !== null) {
        update.available_units = validatedUnits;
      } else if (bulkUnits.trim() === '' && bulkAction !== 'block') {
        update.available_units = null;  // Reset to default
      }

      if (Object.keys(update).length > 1) updates.push(update);
      current.add(1, 'day');
    }

    if (updates.length === 0) {
      toast({ title: 'Aviso', description: 'Sem alterações', variant: 'default' });
      return;
    }

    console.log('Bulk payload:', JSON.stringify({ updates }, null, 2));
    await hotelService.bulkUpdateAvailability(hotelId, selectedRoomTypeId, updates);
    toast({ title: 'Sucesso!', description: `Aplicado em ${updates.length} dias` });
    setShowBulkModal(false);
    setBulkReset(false);
    
    // Recarrega os períodos afetados
    const affectedPeriods = loadedPeriods.filter(p => {
      const periodStart = moment(p.start);
      const periodEnd = moment(p.end);
      const updateStart = moment(selectedRange.start);
      const updateEnd = moment(selectedRange.end);
      
      return (
        (updateStart.isBetween(periodStart, periodEnd, 'day', '[]') ||
         updateEnd.isBetween(periodStart, periodEnd, 'day', '[]') ||
         (updateStart.isBefore(periodStart) && updateEnd.isAfter(periodEnd)))
      );
    });

    // Recarrega cada período afetado
    for (const period of affectedPeriods) {
      await loadCalendarData(moment(period.start).toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: true });
    }
  };

  // Função para edição individual de dia
  const handleUpdateDay = async () => {
    if (!selectedRoomTypeId || !selectedDay || !hotelId) return;

    if (dayReset) {
      if (!window.confirm('Resetar dia ao padrão? Remove overrides.')) return;
      const updates = [{ date: moment(selectedDay).format('YYYY-MM-DD'), reset: true }];
      console.log('Day payload (reset):', JSON.stringify({ updates }, null, 2));
      await hotelService.bulkUpdateAvailability(hotelId, selectedRoomTypeId, updates);
      toast({ title: 'Sucesso', description: 'Dia resetado' });
      setShowDayModal(false);
      // Recarrega
      const dateStr = moment(selectedDay).format('YYYY-MM-DD');
      const affectedPeriod = loadedPeriods.find(p => 
        moment(dateStr).isBetween(p.start, p.end, 'day', '[]')
      );
      
      if (affectedPeriod) {
        await loadCalendarData(moment(affectedPeriod.start).toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: true });
      }
      return;
    }

    let validatedPrice: number | null = null;
    if (dayPrice.trim() !== '') {
      const priceNum = parseFloat(dayPrice);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast({ title: 'Preço inválido', description: '> 0 MZN', variant: 'destructive' });
        return;
      }
      validatedPrice = priceNum;
    }

    let validatedUnits: number | null = null;
    if (dayUnits.trim() !== '') {
      const unitsNum = parseInt(dayUnits);
      const max = roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || 100;
      if (isNaN(unitsNum) || unitsNum < 0 || unitsNum > max) {
        toast({ title: 'Unidades inválidas', description: `0-${max}`, variant: 'destructive' });
        return;
      }
      validatedUnits = unitsNum;
    }

    const dateStr = moment(selectedDay).format('YYYY-MM-DD');
    const update: any = { date: dateStr };

    update.stop_sell = dayBlocked;
    if (dayBlocked) {
      update.available_units = 0;
      update.price_override = null;
    }

    if (validatedPrice !== null) update.price_override = validatedPrice;
    else if (dayPrice.trim() === '' && !dayBlocked) update.price_override = null;  // Non-explicit reset

    if (validatedUnits !== null) update.available_units = validatedUnits;
    else if (dayUnits.trim() === '' && !dayBlocked) update.available_units = null;

    if (Object.keys(update).length <= 1) {
      toast({ title: 'Aviso', description: 'Sem alterações', variant: 'default' });
      return;
    }

    console.log('Day payload:', JSON.stringify({ updates: [update] }, null, 2));
    await hotelService.bulkUpdateAvailability(hotelId, selectedRoomTypeId, [update]);
    toast({ title: 'Sucesso!', description: 'Dia atualizado' });
    setShowDayModal(false);
    setDayReset(false);
    
    // Recarrega o período que contém este dia
    const affectedPeriod = loadedPeriods.find(p => 
      moment(dateStr).isBetween(p.start, p.end, 'day', '[]')
    );
    
    if (affectedPeriod) {
      await loadCalendarData(moment(affectedPeriod.start).toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: true });
    }
  };

  // Funções para promoções
  const handleSavePromo = async () => {
    if (!promoForm.name || !promoForm.code || !promoForm.discount_percent) {
      toast({ 
        title: 'Erro', 
        description: 'Preencha os campos obrigatórios (Nome, Código e Desconto)', 
        variant: 'destructive' 
      });
      return;
    }

    const discount = parseInt(promoForm.discount_percent);
    if (discount < 5 || discount > 70) {
      toast({ 
        title: 'Erro', 
        description: 'O desconto deve estar entre 5% e 70%', 
        variant: 'destructive' 
      });
      return;
    }

    if (!promoForm.start_date || !promoForm.end_date) {
      toast({ 
        title: 'Erro', 
        description: 'Selecione as datas de início e fim', 
        variant: 'destructive' 
      });
      return;
    }

    const startDate = moment(promoForm.start_date);
    const endDate = moment(promoForm.end_date);
    
    if (endDate.isBefore(startDate)) {
      toast({ 
        title: 'Erro', 
        description: 'A data final deve ser após a data inicial', 
        variant: 'destructive' 
      });
      return;
    }

    // Limitar a 5 quartos selecionados (máximo recomendado)
    if (promoForm.applicable_room_types.length > 5) {
      toast({ 
        title: 'Aviso', 
        description: 'Selecionou mais de 5 quartos. A promoção será limitada aos 5 primeiros.',
        variant: 'default',
      });
      promoForm.applicable_room_types = promoForm.applicable_room_types.slice(0, 5);
    }

    const data = {
      name: promoForm.name,
      promo_code: promoForm.code.toUpperCase(),
      description: promoForm.description || undefined,
      discount_percent: discount,
      start_date: promoForm.start_date,
      end_date: promoForm.end_date,
      max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : undefined,
      applicable_room_types: promoForm.applicable_room_types.length > 0 ? promoForm.applicable_room_types : undefined,
      is_active: promoForm.is_active,
    };

    try {
      let response;
      if (editingPromo) {
        response = await hotelService.updatePromotion(
          hotelId,
          editingPromo.id,
          data
        );
      } else {
        response = await hotelService.createPromotion(
          hotelId,
          data
        );
      }

      if (response.success) {
        toast({
          title: 'Sucesso!',
          description: editingPromo ? 'Promoção atualizada com sucesso' : 'Promoção criada com sucesso',
        });
        setShowPromoForm(false);
        setEditingPromo(null);
        resetPromoForm();
        loadPromotions();
      } else {
        toast({
          title: 'Erro',
          description: response.error || 'Falha ao salvar promoção',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: 'Falha ao salvar promoção', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    try {
      const response = await hotelService.deletePromotion(
        hotelId,
        promoId
      );
      if (response.success) {
        toast({ 
          title: 'Sucesso', 
          description: 'Promoção removida com sucesso' 
        });
        loadPromotions();
      } else {
        toast({ 
          title: 'Erro', 
          description: response.error || 'Falha ao remover promoção', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: 'Falha ao remover promoção', 
        variant: 'destructive' 
      });
    }
  };

  const handleTogglePromo = async (promoId: string, isActive: boolean) => {
    try {
      const response = await hotelService.updatePromotion(
        hotelId,
        promoId,
        { is_active: isActive }
      );
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: `Promoção ${isActive ? 'ativada' : 'desativada'} com sucesso`,
        });
        loadPromotions();
      } else {
        toast({ 
          title: 'Erro', 
          description: response.error || 'Falha ao alterar status', 
          variant: 'destructive' 
        });
      }
    } catch (err) {
      toast({ 
        title: 'Erro', 
        description: 'Falha ao alterar status', 
        variant: 'destructive' 
      });
    }
  };

  const resetPromoForm = () => {
    setPromoForm({
      name: '',
      code: '',
      description: '',
      discount_percent: '',
      start_date: '',
      end_date: '',
      max_uses: '',
      applicable_room_types: [] as string[],
      is_active: true,
    });
  };

  // Quando abrir o modal de edição de promoção, preencher o formulário
  useEffect(() => {
    if (editingPromo) {
      setPromoForm({
        name: editingPromo.name || '',
        code: editingPromo.promo_code || editingPromo.code || '',
        description: editingPromo.description || '',
        discount_percent: editingPromo.discount_percent?.toString() || '',
        start_date: editingPromo.start_date ? moment(editingPromo.start_date).format('YYYY-MM-DD') : '',
        end_date: editingPromo.end_date ? moment(editingPromo.end_date).format('YYYY-MM-DD') : '',
        max_uses: editingPromo.max_uses?.toString() || '',
        applicable_room_types: editingPromo.applicable_room_types || [],
        is_active: editingPromo.is_active !== false,
      });
    }
  }, [editingPromo]);

  // Estado: Nenhum hotel selecionado
  if (!hotelId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-dashed">
        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum hotel selecionado</h3>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          Selecione um hotel no dropdown acima para gerenciar os quartos.
        </p>
        <div className="animate-pulse">
          <Badge variant="outline" className="text-gray-400 border-gray-300">
            Aguardando seleção...
          </Badge>
        </div>
      </div>
    );
  }

  // Formulário de criação/edição de room type
  if (showCreateForm) {
    return (
      <CreateRoomTypeFormModern
        hotelId={hotelId}
        initialData={editingId ? roomTypes.find(r => r.id === editingId) : undefined}
        onSuccess={() => {
          setShowCreateForm(false);
          setEditingId(null);
          loadRoomTypes();
          toast({
            title: editingId ? 'Quarto atualizado!' : 'Quarto criado!',
            description: 'Operação realizada com sucesso',
          });
        }}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ID do hotel */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Building2 className="w-4 h-4" />
          <span>Hotel ID: </span>
          <Badge variant="outline" className="font-mono text-xs">
            {hotelId.substring(0, 8)}...
          </Badge>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50">
          <TabsTrigger value="list" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Lista</TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Disponibilidade</TabsTrigger>
          <TabsTrigger value="promotions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Promoções</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Reviews</TabsTrigger>
        </TabsList>

        {/* SUB-TAB: LISTA */}
        <TabsContent value="list" className="space-y-6">
          {/* Header com botão */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-dark">Tipos de Quartos</h2>
              <p className="text-gray-500 text-sm mt-1">
                {roomTypes.length} tipo(s) de quarto no hotel selecionado
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-12 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={handleAddRoom}
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Tipo de Quarto
            </Button>
          </div>

          {/* Mensagens de erro */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erro ao carregar</p>
                <p className="text-sm text-red-800">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadRoomTypes}
                  className="mt-2 text-xs"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Estado de carregamento */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-muted-foreground">Carregando tipos de quarto...</p>
              <p className="text-xs text-gray-400 mt-1">Hotel: {hotelId.substring(0, 8)}...</p>
            </div>
          )}

          {/* Lista vazia */}
          {!loading && roomTypes.length === 0 && (
            <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300">
              <DoorOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum tipo de quarto cadastrado</h3>
              <p className="text-gray-500 mb-6">
                Este hotel ainda não tem quartos cadastrados. Crie o primeiro!
              </p>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                onClick={handleAddRoom}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Quarto
              </Button>
            </Card>
          )}

          {/* Grid de quartos */}
          {!loading && roomTypes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roomTypes.map((room) => {
                const basePrice = parseFloat(room.base_price || '0');
                const occupancy = room.base_occupancy || room.capacity;

                return (
                  <Card
                    key={room.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 group"
                  >
                    {/* Imagem com overlay */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 h-48">
                      {room.images && room.images[0] ? (
                        <img
                          src={room.images[0]}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <DoorOpen className="w-16 h-16 text-gray-400" />
                        </div>
                      )}

                      {/* Badge de status e unidades */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <Badge className={`text-xs font-semibold ${
                          room.is_active
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white`}>
                          {room.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge className="bg-blue-600 text-white text-xs font-semibold">
                          {room.total_units} uni.
                        </Badge>
                      </div>

                      {/* Rating (se disponível) */}
                      {room.rating && (
                        <div className="absolute bottom-3 left-3 bg-white rounded-lg px-3 py-1 flex items-center gap-1 shadow-md">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-bold text-gray-800">{room.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-6 space-y-4">
                      {/* Nome e Capacidade */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>{room.capacity} hóspedes (base: {occupancy})</span>
                          </div>
                          {room.min_nights_default && (
                            <div className="text-xs text-gray-500">
                              Min. {room.min_nights_default} noite(s)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descrição */}
                      {room.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{room.description}</p>
                      )}

                      {/* Preço destacado */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">Preço por noite</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {basePrice.toLocaleString('pt-MZ', {
                            style: 'currency',
                            currency: 'MZN',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                        {room.extra_adult_price && (
                          <p className="text-xs text-gray-600 mt-2">
                            + {room.extra_adult_price} MZN por adulto extra
                          </p>
                        )}
                      </div>

                      {/* Amenidades */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="px-0 pb-0">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Amenidades:</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 8).map((amenity: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {room.amenities.length > 8 && (
                              <Badge variant="outline" className="text-xs font-semibold">
                                +{room.amenities.length - 8}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botões */}
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEditRoom(room.id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-200"
                          onClick={() => {
                            setSelectedRoomTypeId(room.id);
                            setActiveSubTab('availability');
                          }}
                        >
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Disponibilidade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteRoomType(room.id, room.name)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SUB-TAB: DISPONIBILIDADE COM LAZY LOADING PERFEITO */}
        <TabsContent value="availability" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Disponibilidade por Quarto</h3>
              <p className="text-sm text-gray-500 mt-1">
                Calendário com lazy loading: navegue para qualquer data futura (até {MAX_MONTHS_FUTURE/12} anos)
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Dropdown de seleção de room type */}
              <Select
                value={selectedRoomTypeId || undefined}
                onValueChange={(value) => {
                  setSelectedRoomTypeId(value);
                  setAllEvents([]);
                  setLoadedPeriods([]);
                  setAvailabilityStats({
                    totalDias: 0,
                    comPrecoOverride: 0,
                    bloqueados: 0,
                  });
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione o tipo de quarto" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.total_units} unid.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Botão recarregar */}
              <Button
                variant="outline"
                onClick={reloadCalendarData}
                disabled={loadingCalendar || !selectedRoomTypeId}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCalendar ? 'animate-spin' : ''}`} />
                Recarregar
              </Button>
            </div>
          </div>

          {/* Mostrar estatísticas de disponibilidade */}
          {selectedRoomTypeId && availabilityStats.totalDias > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total de Dias</p>
                    <p className="text-2xl font-bold text-blue-900">{availabilityStats.totalDias}</p>
                  </div>
                  <CalendarIcon className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Com Preço Override</p>
                    <p className="text-2xl font-bold text-green-900">{availabilityStats.comPrecoOverride}</p>
                  </div>
                  <Badge className="bg-green-500 text-white"></Badge>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Dias Bloqueados</p>
                    <p className="text-2xl font-bold text-red-900">{availabilityStats.bloqueados}</p>
                  </div>
                  <Badge className="bg-red-500 text-white"></Badge>
                </div>
              </Card>
            </div>
          )}

          {/* Aviso quando não há room types */}
          {roomTypes.length === 0 && (
            <Card className="p-8 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-dashed border-2 border-gray-300">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum tipo de quarto disponível</h3>
              <p className="text-gray-500 mb-6">
                Crie tipos de quarto primeiro para gerir a disponibilidade.
              </p>
              <Button
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                onClick={() => setActiveSubTab('list')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Quarto
              </Button>
            </Card>
          )}

          {/* Calendário com LAZY LOADING e proteção contra navegação rápida */}
          {roomTypes.length > 0 && (
            <Card className="p-4 md:p-6 shadow-sm relative">
              {/* Loader overlay durante navegação com mensagem específica */}
              {loadingCalendar && loadedPeriods.length > 0 && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      {forceReloading ? 'Forçando atualização dos dados...' : 'Carregando dados adicionais...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Loader inicial */}
              {loadingCalendar && loadedPeriods.length === 0 ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                  <p className="ml-3 text-muted-foreground">Carregando disponibilidade inicial...</p>
                </div>
              ) : selectedRoomTypeId ? (
                <>
                  <div style={{ height: 600 }} className="relative">
                    {loadingCalendar && (
                      <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando...
                      </div>
                    )}
                    
                    <Calendar
                      localizer={localizer}
                      events={allEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                      views={[Views.MONTH]}
                      selectable
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={handleSelectEvent}
                      date={currentViewDate}
                      onNavigate={async (newDate: Date, view: string, action: NavigateAction) => {
                        // Prevenção contra navegação rápida múltipla
                        if (isNavigating) return;
                        
                        setIsNavigating(true);
                        setCurrentViewDate(newDate);
                        await loadCalendarData(newDate, { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false });
                        setIsNavigating(false);
                      }}
                      eventPropGetter={eventPropGetter}
                      messages={{
                        month: 'Mês',
                        previous: 'Anterior',
                        next: 'Próximo',
                        today: 'Hoje',
                        noEventsInRange: 'Nenhum evento neste período',
                      }}
                      components={{
                        // Tooltip melhorado para eventos do calendário
                        event: ({ event }: any) => (
                          <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            title={
                              event.resource?.status === 'booked'
                                ? `RESERVA\nCliente: ${event.title.replace('Reserva: ', '')}\nCheck-in: ${moment(event.start).format('DD/MM/YYYY')}\nCheck-out: ${moment(event.end).format('DD/MM/YYYY')}`
                                : `${moment(event.start).format('DD/MM/YYYY')}\nPreço: ${event.resource?.price || 'Padrão'} MZN\nUnidades: ${event.resource?.availableUnits || 'Padrão'}\nStatus: ${event.resource?.status === 'available' ? 'Disponível' : event.resource?.status === 'blocked' ? 'Bloqueado' : 'Indisponível'}`
                            }
                          >
                            {event.title}
                          </div>
                        ),
                        toolbar: (props: any) => (
                          <div className="rbc-toolbar flex flex-wrap justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isNavigating) {
                                    props.onNavigate('PREV');
                                    // Carrega dados para o mês anterior se necessário
                                    loadCalendarData(moment(props.date).subtract(1, 'month').toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false });
                                  }
                                }}
                                className="rbc-btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded disabled:opacity-50"
                                disabled={isNavigating}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isNavigating) {
                                    props.onNavigate('TODAY');
                                    setCurrentViewDate(new Date());
                                    loadCalendarData(new Date(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false });
                                  }
                                }}
                                className="rbc-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
                                disabled={isNavigating}
                              >
                                Hoje
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isNavigating) {
                                    props.onNavigate('NEXT');
                                    // Carrega dados para o próximo mês se necessário
                                    loadCalendarData(moment(props.date).add(1, 'month').toDate(), { chunkSize: DEFAULT_CHUNK_DAYS, forceReload: false });
                                  }
                                }}
                                className="rbc-btn bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded disabled:opacity-50"
                                disabled={isNavigating}
                              >
                                ›
                              </button>
                            </div>
                            <div className="text-lg font-semibold mt-2 sm:mt-0">
                              {moment(props.date).format('MMMM YYYY')}
                              {process.env.NODE_ENV === 'development' && loadedPeriods.length > 0 && (
                                <span className="text-xs text-gray-500 block sm:inline sm:ml-2">
                                  ({loadedPeriods.length} períodos carregados)
                                </span>
                              )}
                            </div>
                            <div className="mt-2 sm:mt-0">
                              <span className="rbc-btn-group">
                                <button
                                  type="button"
                                  className="rbc-active bg-blue-600 text-white px-3 py-1 rounded"
                                >
                                  Mês
                                </button>
                              </span>
                            </div>
                          </div>
                        ),
                      }}
                    />
                  </div>
                  
                  {/* Botões para carregar mais meses à frente (desabilitados durante loading) */}
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMoreMonths(3)}
                      disabled={loadingCalendar || isNavigating}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Carregar +3 meses
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMoreMonths(6)}
                      disabled={loadingCalendar || isNavigating}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Carregar +6 meses
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadMoreMonths(12)}
                      disabled={loadingCalendar || isNavigating}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Carregar +1 ano
                    </Button>
                  </div>
                  
                  {/* Info sobre o lazy loading */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                      <Info className="w-4 h-4" />
                      <span>O calendário carrega automaticamente {Math.ceil(DEFAULT_CHUNK_DAYS/30)} meses conforme você navega</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg mb-2">Selecione um tipo de quarto</p>
                  <p className="text-sm text-center max-w-md">
                    Escolha um tipo de quarto no dropdown acima para visualizar e gerir a disponibilidade no calendário.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Legenda do calendário ATUALIZADA */}
          {selectedRoomTypeId && (
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#e0f2fe] rounded"></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#3b82f6] rounded"></div>
                <span>Reserva</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#f87171] rounded"></div>
                <span>Indisponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#dc2626] rounded"></div>
                <span>Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#fef3c7] rounded"></div>
                <span>Preço Especial (+20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#f59e0b] rounded"></div>
                <span>Preço Muito Alto (+50%)</span>
              </div>
            </div>
          )}

          {/* Modal de ações em bulk */}
          {showBulkModal && selectedRange && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Ação em intervalo: {moment(selectedRange.start).format('DD/MM')} a {moment(selectedRange.end).format('DD/MM')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBulkModal(false);
                      setSelectedRange(null);
                      setBulkAction(null);
                      setBulkPrice('');
                      setBulkUnits('');
                      setBulkReset(false);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Botões de ação */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        setBulkAction('block');
                        setBulkReset(false);
                      }}
                      className={`${
                        bulkAction === 'block' 
                          ? 'bg-red-700 hover:bg-red-800 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      Bloquear
                    </Button>
                    <Button
                      onClick={() => {
                        setBulkAction('unblock');
                        setBulkReset(false);
                      }}
                      className={`${
                        bulkAction === 'unblock' 
                          ? 'bg-green-700 hover:bg-green-800 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Desbloquear
                    </Button>
                  </div>

                  {/* Campo de Unidades Disponíveis */}
                  <div>
                    <Label htmlFor="bulkUnits">Definir Unidades Disponíveis</Label>
                    <Input
                      id="bulkUnits"
                      type="number"
                      value={bulkUnits}
                      onChange={(e) => {
                        setBulkUnits(e.target.value);
                        setBulkReset(false);
                        if (e.target.value && !bulkAction) {
                          setBulkAction('units');
                        }
                      }}
                      placeholder={`Ex: 1 (de ${roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || '?'} total)`}
                      className="mt-1"
                      min="0"
                      max={roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || 100}
                      disabled={bulkReset}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use para reservas externas. Ex: 3 unidades, 2 reservadas no Booking → defina 1 aqui.
                    </p>
                  </div>

                  {/* Campo de Preço */}
                  <div>
                    <Label htmlFor="bulkPrice">Definir Preço Especial (opcional)</Label>
                    <Input
                      id="bulkPrice"
                      type="number"
                      value={bulkPrice}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBulkPrice(value);
                        setBulkReset(false);
                        if (value && parseFloat(value) > 0 && !bulkAction) {
                          setBulkAction('price');
                        }
                      }}
                      placeholder="Ex: 8500"
                      className="mt-1"
                      min="1"
                      step="0.01"
                      disabled={bulkReset}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Deve ser maior que 0 MZN. Deixe vazio para não alterar.
                    </p>
                  </div>

                  {/* NOVO: Checkbox Reset */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="bulkReset"
                      checked={bulkReset}
                      onCheckedChange={(checked) => {
                        setBulkReset(!!checked);
                        if (checked) {  // Limpa outros ao resetar
                          setBulkAction(null);
                          setBulkPrice('');
                          setBulkUnits('');
                        }
                      }}
                    />
                    <Label htmlFor="bulkReset">Resetar ao padrão (remover overrides)</Label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowBulkModal(false);
                        setSelectedRange(null);
                        setBulkAction(null);
                        setBulkPrice('');
                        setBulkUnits('');
                        setBulkReset(false);
                      }} 
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleApplyBulk}
                      disabled={!bulkAction && !bulkPrice && !bulkUnits && !bulkReset}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modal para edição individual de dia */}
          {showDayModal && selectedDay && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Editar dia: {moment(selectedDay).format('DD/MM/YYYY')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDayModal(false);
                      setSelectedDay(null);
                      setDayPrice('');
                      setDayUnits('');
                      setDayBlocked(false);
                      setDayReset(false);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Checkbox de bloqueio */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Label htmlFor="dayBlocked" className="font-medium">Bloquear este dia</Label>
                    <input
                      id="dayBlocked"
                      type="checkbox"
                      checked={dayBlocked}
                      onChange={(e) => {
                        setDayBlocked(e.target.checked);
                        if (e.target.checked) {
                          setDayPrice('');
                          setDayUnits('');
                        }
                        setDayReset(false);
                      }}
                      className="h-5 w-5 text-blue-600 rounded"
                      disabled={dayReset}
                    />
                  </div>

                  {/* Campo de Unidades Disponíveis */}
                  {!dayBlocked && (
                    <div>
                      <Label htmlFor="dayUnits">Unidades Disponíveis</Label>
                      <Input
                        id="dayUnits"
                        type="number"
                        value={dayUnits}
                        onChange={(e) => {
                          setDayUnits(e.target.value);
                          // Se tiver unidades definidas, desmarca bloqueado
                          if (e.target.value) {
                            setDayBlocked(false);
                          }
                          setDayReset(false);
                        }}
                        placeholder={`Total padrão: ${roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || '?'} unidades`}
                        className="mt-1"
                        min="0"
                        max={roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || 100}
                        disabled={dayReset || dayBlocked}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe vazio para usar o total padrão ({roomTypes.find(r => r.id === selectedRoomTypeId)?.total_units || '?'} unidades)
                      </p>
                    </div>
                  )}

                  {/* Campo de Preço */}
                  {!dayBlocked && (
                    <div>
                      <Label htmlFor="dayPrice">Preço Especial (MZN)</Label>
                      <Input
                        id="dayPrice"
                        type="number"
                        value={dayPrice}
                        onChange={(e) => {
                          setDayPrice(e.target.value);
                          // Se tiver preço válido, desmarca bloqueado
                          if (e.target.value && parseFloat(e.target.value) > 0) {
                            setDayBlocked(false);
                          }
                          setDayReset(false);
                        }}
                        placeholder="Deixe vazio para usar preço padrão"
                        className="mt-1"
                        min="1"
                        step="0.01"
                        disabled={dayReset || dayBlocked}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deve ser maior que 0 MZN. Deixe vazio para preço padrão.
                      </p>
                    </div>
                  )}

                  {/* NOVO: Checkbox Reset */}
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox
                      id="dayReset"
                      checked={dayReset}
                      onCheckedChange={(checked) => {
                        setDayReset(!!checked);
                        if (checked) {  // Limpa outros ao resetar
                          setDayPrice('');
                          setDayUnits('');
                          setDayBlocked(false);
                        }
                      }}
                    />
                    <Label htmlFor="dayReset">Resetar ao padrão (remover overrides)</Label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDayModal(false);
                        setSelectedDay(null);
                        setDayPrice('');
                        setDayUnits('');
                        setDayBlocked(false);
                        setDayReset(false);
                      }} 
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateDay}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Atualizar Dia
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SUB-TAB: PROMOÇÕES (CORRIGIDA COM MELHORIAS) */}
        <TabsContent value="promotions" className="space-y-6">
          {/* Loading state */}
          {loadingPromotions && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-10 h-10 animate-spin text-green-600" />
            </div>
          )}

          {/* Quando não há promoções */}
          {!loadingPromotions && promotions.length === 0 && (
            <Card className="p-12 text-center bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <Star className="w-20 h-20 text-green-400 mx-auto mb-6 fill-green-400 opacity-50" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma promoção ativa ainda</h3>
              <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                Crie promoções para oferecer descontos sazonais, códigos exclusivos ou ofertas de última hora e aumente suas reservas!
              </p>
              <Button
                onClick={() => {
                  setEditingPromo(null);
                  resetPromoForm();
                  setShowPromoForm(true);
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold h-12 px-8"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Promoção
              </Button>
            </Card>
          )}

          {/* Quando há promoções */}
          {!loadingPromotions && promotions.length > 0 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">Promoções Ativas</h3>
                  <div className="relative group">
                    <Info 
                      className="w-5 h-5 text-gray-500 cursor-help" 
                      aria-label="Informação sobre promoções"
                    />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      Crie códigos promocionais para aumentar suas reservas!
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingPromo(null);
                    resetPromoForm();
                    setShowPromoForm(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Promoção
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promo) => (
                  <Card
                    key={promo.id}
                    className={`overflow-hidden hover:shadow-lg transition-all duration-300 border ${
                      promo.is_active ? 'border-green-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6 space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{promo.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge className="bg-green-100 text-green-800 font-medium">
                              {promo.promo_code || promo.code}
                            </Badge>
                            <Badge className={promo.is_active ? "bg-green-600 text-white" : "bg-gray-400 text-white"}>
                              {promo.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline">
                              {promo.discount_percent}% OFF
                            </Badge>
                          </div>
                          {promo.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {promo.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPromo(promo);
                              setShowPromoForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja remover a promoção "${promo.name}"?`)) {
                                handleDeletePromo(promo.id);
                              }
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Validade</p>
                          <p className="font-medium">
                            {moment(promo.start_date).format('DD/MM/YY')} - {moment(promo.end_date).format('DD/MM/YY')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Usos</p>
                          <p className="font-medium">
                            {promo.current_uses || 0} / {promo.max_uses || '∞'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Quartos</p>
                          <p className="font-medium">
                            {promo.applicable_room_types?.length || 'Todos'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-medium">
                            {moment(promo.end_date).isBefore(moment()) ? 'Expirada' : 'Válida'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Ativar/Desativar */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => handleTogglePromo(promo.id, !promo.is_active)}
                      >
                        {promo.is_active ? 'Desativar Promoção' : 'Ativar Promoção'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Modal de criação/edição de promoção */}
          {showPromoForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
                  <h3 className="text-xl font-bold">
                    {editingPromo ? 'Editar Promoção' : 'Criar Nova Promoção'}
                  </h3>
                  <button 
                    onClick={() => {
                      setShowPromoForm(false);
                      setEditingPromo(null);
                      resetPromoForm();
                    }}
                    aria-label="Fechar"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Nome da promoção */}
                  <div>
                    <Label htmlFor="name">Nome da Promoção *</Label>
                    <Input
                      id="name"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                      placeholder="ex: Black Friday 20% OFF"
                    />
                  </div>

                  {/* Código único */}
                  <div>
                    <Label htmlFor="code">Código Único *</Label>
                    <Input
                      id="code"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="ex: BLACK20"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Os hóspedes usarão este código para aplicar o desconto
                    </p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                      placeholder="ex: 20% OFF em reservas de 3+ noites durante o verão"
                      rows={3}
                    />
                  </div>

                  {/* Desconto e máximo de usos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount_percent">Desconto (%) *</Label>
                      <Input
                        id="discount_percent"
                        type="number"
                        value={promoForm.discount_percent}
                        onChange={(e) => setPromoForm({ ...promoForm, discount_percent: e.target.value })}
                        min="5"
                        max="70"
                        placeholder="5-70"
                      />
                      <p className="text-xs text-gray-500 mt-1">Entre 5% e 70%</p>
                    </div>
                    <div>
                      <Label htmlFor="max_uses">Máximo de Usos</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        value={promoForm.max_uses}
                        onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                        placeholder="Ilimitado (deixe vazio)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deixe vazio para ilimitado</p>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Data Início *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={promoForm.start_date}
                        onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                        min={moment().format('YYYY-MM-DD')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Data Fim *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={promoForm.end_date}
                        onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                        min={promoForm.start_date || moment().format('YYYY-MM-DD')}
                      />
                    </div>
                  </div>

                  {/* Quartos aplicáveis */}
                  <div>
                    <Label>Quartos aplicáveis (selecione até 5 ou deixe vazio para todos)</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      {promoForm.applicable_room_types.length}/5 selecionados
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {roomTypes.map((room) => (
                        <div key={room.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`room-${room.id}`}
                            checked={promoForm.applicable_room_types?.includes(room.id)}
                            onCheckedChange={(checked) => {
                              const current = promoForm.applicable_room_types || [];
                              if (checked && current.length >= 5) {
                                toast({
                                  title: 'Limite atingido',
                                  description: 'Você pode selecionar no máximo 5 quartos',
                                  variant: 'destructive',
                                });
                                return;
                              }
                              setPromoForm({
                                ...promoForm,
                                applicable_room_types: checked
                                  ? [...current, room.id]
                                  : current.filter(id => id !== room.id)
                              });
                            }}
                            disabled={!promoForm.applicable_room_types?.includes(room.id) && promoForm.applicable_room_types.length >= 5}
                          />
                          <Label htmlFor={`room-${room.id}`} className="text-sm cursor-pointer truncate">
                            {room.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {promoForm.applicable_room_types.length === 0 
                        ? 'A promoção será aplicada a todos os quartos do hotel'
                        : `Aplicável a ${promoForm.applicable_room_types.length} quarto(s)`}
                    </p>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPromoForm(false);
                        setEditingPromo(null);
                        resetPromoForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSavePromo}
                      disabled={loadingPromotions}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loadingPromotions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : editingPromo ? 'Atualizar Promoção' : 'Criar Promoção'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SUB-TAB: REVIEWS */}
        <TabsContent value="reviews">
          <Card className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Avaliações dos Hóspedes</h3>
              <div className="relative group">
                <Info 
                  className="w-5 h-5 text-gray-500 cursor-help" 
                  aria-label="Informação sobre avaliações"
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Veja e responda às avaliações dos hóspedes
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-8 border border-yellow-200 text-center">
              <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4 fill-yellow-400" />
              <p className="text-lg font-semibold text-gray-700 mb-2">Sistema de avaliações em desenvolvimento</p>
              <p className="text-gray-600 mb-4">
                Em breve você poderá visualizar e responder às avaliações dos hóspedes que se hospedaram no seu hotel.
              </p>
              <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border">
                <Badge variant="outline" className="font-mono text-xs">
                  Hotel: {hotelId.substring(0, 8)}...
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomTypesManagement;