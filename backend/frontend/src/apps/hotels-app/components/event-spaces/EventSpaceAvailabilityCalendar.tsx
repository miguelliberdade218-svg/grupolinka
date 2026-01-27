/**
 * src/apps/hotels-app/components/event-spaces/EventSpaceAvailabilityCalendar.tsx
 * Calendário de disponibilidade para espaços de eventos - VERSÃO REAL SEM MOCKS 27/01/2026
 * Com funcionalidade para bloquear/destacar datas e gerir ocupação
 * COMPLETAMENTE ALINHADO COM O BACKEND (eventController.ts)
 * CORRIGIDO: Modal grande - usando divs e estilos forçados
 * ✅ CORRIGIDO: Problema de atualização de estado após mudanças no backend
 * ✅ Adicionado recarregamento automático após operações bem-sucedidas
 * ✅ CORRIGIDO: Problema de processamento dos dados do backend
 * ✅ CORRIGIDO: Erro 'date is specified more than once'
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import {
  Calendar as CalendarIcon,
  X,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  CalendarDays,
  Lock,
  Unlock,
  Filter,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api';
import type { EventSpace } from '@/shared/types/event-spaces';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';

interface EventSpaceAvailabilityCalendarProps {
  hotelId: string;
  spaceId: string;
  spaceData: EventSpace;
  onClose?: () => void;
}

interface DayAvailability {
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  stopSell: boolean;
  priceOverride?: number;
}

interface EventBookingSlot {
  id: string;
  eventTitle: string;
  organizerName: string;
  startDate: string;
  endDate: string;
  status: 'pending_approval' | 'confirmed' | 'cancelled';
  expectedAttendees: number;
  totalPrice?: number;
}

export const EventSpaceAvailabilityCalendar: React.FC<EventSpaceAvailabilityCalendarProps> = ({
  hotelId,
  spaceId,
  spaceData,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [bookings, setBookings] = useState<EventBookingSlot[]>([]);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showDayEditModal, setShowDayEditModal] = useState(false);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<'block' | 'unblock' | 'price'>('block');
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [dayEditData, setDayEditData] = useState<DayAvailability>({
    date: '',
    isAvailable: true,
    stopSell: false,
    priceOverride: undefined,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (spaceId) {
      loadAvailability();
      loadBookings();
    }
  }, [spaceId, currentMonth]);

  useEffect(() => {
    if (selectedDate && !showDayEditModal) {
      const dayData = availability[selectedDate] || {
        date: selectedDate,
        isAvailable: true,
        stopSell: false,
      };
      setDayEditData(dayData);
      setShowDayEditModal(true);
    }
  }, [selectedDate, showDayEditModal]);

  const loadAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // ✅ DEBUG: Verificar se a função está sendo chamada
      console.log('📥 Carregando disponibilidade do backend:', { spaceId, start, end });

      // Buscar disponibilidade real do backend
      const res = await apiService.getEventSpaceCalendar(spaceId, start, end);
      
      // ✅ DEBUG: Verificar o que está chegando do backend
      console.log('📥 Dados do backend (RAW):', res);
      console.log('📥 Dados do backend (data):', res.data);
      
      if (res.success && res.data) {
        // ✅ CORREÇÃO: Usar Map para evitar duplicações
        const availObj: Record<string, DayAvailability> = {};

        res.data.forEach((item: any) => {
          // Extrair data de forma segura
          let dateStr: string;
          
          if (typeof item.date === 'string') {
            // Se for string, pegar apenas a parte da data (YYYY-MM-DD)
            dateStr = item.date.split('T')[0];
          } else if (item.date) {
            // Se for Date ou outro formato, converter
            dateStr = format(new Date(item.date), 'yyyy-MM-dd');
          } else {
            console.warn('Item sem data:', item);
            return;
          }

          // ✅ CORREÇÃO: Criar objeto SEM duplicação
          availObj[dateStr] = {
            date: dateStr, // Apenas UMA vez
            isAvailable: item.is_available ?? item.isAvailable ?? true,
            stopSell: item.stop_sell ?? item.stopSell ?? false,
            priceOverride: item.price_override ?? item.priceOverride 
              ? Number(item.price_override ?? item.priceOverride) 
              : undefined,
          };
        });
        
        // ✅ DEBUG: Verificar objeto processado
        console.log('📥 Objeto processado (primeiras 5 entradas):', 
          Object.entries(availObj).slice(0, 5).map(([date, data]) => ({ date, data }))
        );
        
        // Preencher dias que não têm registro com disponibilidade padrão
        const startDate = parseISO(start);
        const endDate = parseISO(end);
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });
        
        allDays.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          if (!availObj[dateStr]) {
            availObj[dateStr] = {
              date: dateStr, // Apenas UMA vez
              isAvailable: true,
              stopSell: false,
              priceOverride: undefined,
            };
          }
        });
        
        // ✅ DEBUG: Verificar estado final
        console.log('📥 Estado final (todos os dias):', availObj);
        console.log('📊 Total de dias processados:', Object.keys(availObj).length);
        
        // Verificar dias específicos que devem ter preço especial ou bloqueio
        const specialDates = Object.entries(availObj)
          .filter(([_, data]) => data.priceOverride || data.stopSell || !data.isAvailable)
          .map(([date, data]) => ({ date: date, isAvailable: data.isAvailable, stopSell: data.stopSell, priceOverride: data.priceOverride }));
        
        console.log('📌 Dias com configurações especiais:', specialDates);
        
        setAvailability(availObj);
      } else {
        throw new Error(res.error || 'Falha ao carregar disponibilidade');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar calendário');
      console.error('❌ Erro load availability:', err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a disponibilidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      // Buscar bookings reais do espaço usando o método correto do apiService
      const today = format(new Date(), 'yyyy-MM-dd');
      const nextMonth = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0), 'yyyy-MM-dd');
      
      // Usar o endpoint correto para buscar eventos futuros do espaço
      const res = await apiService.getEventSpaceBookings(spaceId, {
        startDate: today,
        endDate: nextMonth,
        status: 'confirmed,pending_approval'
      });
      
      if (res.success && res.data) {
        // Transformar dados para o formato do componente
        const formattedBookings = res.data.map((booking: any) => ({
          id: booking.id,
          eventTitle: booking.eventTitle || booking.event_title || 'Evento sem título',
          organizerName: booking.organizerName || booking.organizer_name || 'Anónimo',
          startDate: booking.startDate || booking.start_date,
          endDate: booking.endDate || booking.end_date,
          status: booking.status || 'pending_approval',
          expectedAttendees: booking.expectedAttendees || booking.expected_attendees || 0,
          totalPrice: booking.totalPrice || booking.total_price ? Number(booking.totalPrice || booking.total_price) : undefined,
        }));
        
        setBookings(formattedBookings);
      }
    } catch (err: any) {
      console.error('Erro load bookings:', err);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar as reservas",
        variant: "warning",
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  // ✅ Função para forçar recarregamento completo do calendário
  const refreshCalendar = async () => {
    console.log('🔄 Forçando recarregamento do calendário...');
    await loadAvailability();
    await loadBookings();
  };

  const getDateString = (day: number): string => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Dias da semana (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    return { firstDayOfWeek, daysInMonth, year, month };
  };

  const handleDateClick = (date: string) => {
    if (isSelectingRange) {
      if (!rangeStart) {
        setRangeStart(date);
        setSelectedDates([date]);
      } else {
        const start = parseISO(rangeStart);
        const end = parseISO(date);
        const dates: string[] = [];
        
        // Ordenar datas (start pode ser maior que end)
        const sortedStart = start < end ? start : end;
        const sortedEnd = start < end ? end : start;
        
        const current = new Date(sortedStart);
        while (current <= sortedEnd) {
          dates.push(format(current, 'yyyy-MM-dd'));
          current.setDate(current.getDate() + 1);
        }
        
        setSelectedDates(dates);
        setIsSelectingRange(false);
        setRangeStart(null);
        setShowBulkActionModal(true);
      }
    } else {
      setSelectedDate(date);
    }
  };

  const handleBulkAction = async () => {
    if (selectedDates.length === 0) return;
    
    setSaving(true);
    try {
      const updates = selectedDates.map(date => ({
        date,
        isAvailable: bulkAction === 'unblock',
        stopSell: bulkAction === 'block',
        priceOverride: bulkAction === 'price' && bulkPrice ? parseFloat(bulkPrice) : undefined,
      }));

      console.log('🔄 Aplicando ação em massa:', { 
        action: bulkAction, 
        days: selectedDates.length,
        updates: updates.slice(0, 3) // Log apenas os primeiros 3 para debug
      });

      // Chamada REAL ao backend - bulkUpdateEventSpaceAvailability
      const res = await apiService.bulkUpdateEventSpaceAvailability(spaceId, updates);
      
      if (res.success) {
        // ✅ 1. Atualizar estado local imediatamente (para UI responsiva)
        const newAvailability = { ...availability };
        updates.forEach(update => {
          newAvailability[update.date] = {
            ...newAvailability[update.date],
            isAvailable: update.isAvailable,
            stopSell: update.stopSell,
            priceOverride: update.priceOverride,
          };
        });
        setAvailability(newAvailability);
        
        // ✅ 2. Forçar recarregamento do backend (para garantir sincronização)
        setTimeout(() => {
          refreshCalendar();
        }, 300);
        
        toast({
          title: "✅ Ação aplicada com sucesso!",
          description: `Ação "${bulkAction}" aplicada a ${selectedDates.length} dia(s)`,
          variant: "success",
          duration: 3000,
        });
      } else {
        throw new Error(res.error || 'Falha ao aplicar ação');
      }
      
      setShowBulkActionModal(false);
      setSelectedDates([]);
      setBulkPrice('');
    } catch (err: any) {
      console.error('❌ Erro em handleBulkAction:', err);
      toast({
        title: "❌ Erro ao aplicar ação",
        description: err.message || "Falha ao aplicar ação em massa",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDaySave = async () => {
    if (!dayEditData.date) return;
    
    setSaving(true);
    try {
      // Preparar dados para o backend
      const updateData = {
        date: dayEditData.date,
        isAvailable: dayEditData.isAvailable,
        stopSell: dayEditData.stopSell || !dayEditData.isAvailable,
        priceOverride: dayEditData.priceOverride,
      };

      console.log('🔄 Salvando dia:', { 
        date: dayEditData.date,
        data: updateData 
      });

      // Chamada REAL ao backend - updateEventSpaceDayAvailability (usa bulk com 1 item)
      const res = await apiService.updateEventSpaceDayAvailability(spaceId, updateData);
      
      if (res.success) {
        // ✅ 1. Atualizar estado local imediatamente (para UI responsiva)
        setAvailability(prev => ({
          ...prev,
          [dayEditData.date]: dayEditData,
        }));
        
        // ✅ 2. Forçar recarregamento do backend (para garantir sincronização)
        setTimeout(() => {
          refreshCalendar();
        }, 300);
        
        toast({
          title: "✅ Dia atualizado com sucesso!",
          description: `Disponibilidade para ${dayEditData.date} foi atualizada`,
          variant: "success",
          duration: 3000,
        });
      } else {
        throw new Error(res.error || 'Falha ao atualizar dia');
      }
      
      setShowDayEditModal(false);
      setSelectedDate(null);
    } catch (err: any) {
      console.error('❌ Erro em handleDaySave:', err);
      toast({
        title: "❌ Erro ao atualizar dia",
        description: err.message || "Falha ao atualizar disponibilidade do dia",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasBookingOnDate = (date: string): boolean => {
    const dateObj = parseISO(date);
    return bookings.some(booking => {
      const start = parseISO(booking.startDate);
      const end = parseISO(booking.endDate);
      return dateObj >= start && dateObj <= end && booking.status === 'confirmed';
    });
  };

  const getBookingOnDate = (date: string): EventBookingSlot | undefined => {
    const dateObj = parseISO(date);
    return bookings.find(booking => {
      const start = parseISO(booking.startDate);
      const end = parseISO(booking.endDate);
      return dateObj >= start && dateObj <= end && booking.status === 'confirmed';
    });
  };

  const getDayClass = (date: string) => {
    const dayData = availability[date];
    const hasConfirmedBooking = hasBookingOnDate(date);
    
    if (!dayData) return 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200';
    
    // PRIORIDADE: Bloqueado (não disponível ou stop sell)
    if (!dayData.isAvailable || dayData.stopSell) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    
    if (hasConfirmedBooking) return 'bg-green-100 text-green-800 border-green-300';
    if (dayData.priceOverride) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (selectedDates.includes(date)) return 'bg-blue-100 text-blue-800 border-blue-300';
    
    return 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200';
  };

  const getDayPrice = (date: string): number => {
    const dayData = availability[date];
    
    // 1. Preço override do dia específico
    if (dayData?.priceOverride) return dayData.priceOverride;
    
    const dateObj = parseISO(date);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    const basePrice = parseFloat(spaceData.basePricePerDay || '0');
    
    // 2. Preço com sobretaxa de fim de semana
    return isWeekend ? basePrice * (1 + (spaceData.weekendSurchargePercent || 0) / 100) : basePrice;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const calculateMonthStats = () => {
    const days = Object.values(availability);
    const bookedDays = days.filter(day => hasBookingOnDate(day.date)).length;
    const blockedDays = days.filter(day => !day.isAvailable || day.stopSell).length;
    const availableDays = days.length - bookedDays - blockedDays;
    
    const estimatedRevenue = days.reduce((total, day) => {
      if (hasBookingOnDate(day.date)) {
        return total + getDayPrice(day.date);
      }
      return total;
    }, 0);
    
    return {
      totalDays: days.length,
      bookedDays,
      blockedDays,
      availableDays,
      estimatedRevenue,
    };
  };

  const { firstDayOfWeek, daysInMonth, year, month } = getDaysInMonth();
  const monthName = format(currentMonth, "MMMM 'de' yyyy", { locale: pt });
  const monthStats = calculateMonthStats();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-0 m-0">
      {/* Modal principal - usando div em vez de Card para evitar estilos padrão */}
      <div 
        className="bg-white flex flex-col shadow-2xl rounded-2xl border-0 overflow-hidden"
        style={{
          width: '98vw',
          height: '98vh',
          maxWidth: 'none',
          maxHeight: 'none',
          margin: 0,
          padding: 0
        }}
      >
        {/* Header - mantém sticky */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white p-6 flex justify-between items-center z-10 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Calendário de Disponibilidade</h2>
              <p className="text-violet-100 text-sm mt-1">
                {spaceData.name} • {monthName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-all"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo principal com scroll */}
        <div className="flex-grow overflow-y-auto p-4">
          {/* Controles */}
          <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b rounded-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevMonth}
                    className="border-violet-200"
                    disabled={loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="text-xl font-semibold text-gray-900">{monthName}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextMonth}
                    className="border-violet-200"
                    disabled={loading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectingRange(!isSelectingRange)}
                  className={isSelectingRange ? 'bg-blue-100 border-blue-300 text-blue-700' : ''}
                  disabled={loading}
                >
                  {isSelectingRange ? (
                    <>
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Selecionando intervalo...
                    </>
                  ) : (
                    <>
                      <Filter className="w-4 h-4 mr-2" />
                      Selecionar intervalo
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActionModal(true)}
                  disabled={selectedDates.length === 0 || loading}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Ação em massa ({selectedDates.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCalendar}
                  disabled={loading || saving}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Reservado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-600">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Bloqueado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Preço especial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Selecionado</span>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {saving && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div className="text-blue-800 text-sm">Salvando alterações...</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Calendário - ocupa 2/3 */}
              <div className="lg:col-span-2">
                <div className="bg-white border rounded-xl overflow-hidden">
                  {/* Cabeçalho dos dias da semana */}
                  <div className="grid grid-cols-7 border-b">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                      <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Dias do mês */}
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-7">
                      {/* Espaços vazios para alinhar o primeiro dia */}
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-3 border-r border-b bg-gray-50"></div>
                      ))}

                      {/* Dias do mês */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = getDateString(day);
                        const dayData = availability[dateStr];
                        const hasBooking = hasBookingOnDate(dateStr);
                        const booking = hasBooking ? getBookingOnDate(dateStr) : undefined;
                        const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                        const isSelected = selectedDates.includes(dateStr);
                        const dayPrice = getDayPrice(dateStr);
                        
                        return (
                          <button
                            key={day}
                            onClick={() => handleDateClick(dateStr)}
                            className={`
                              p-3 border-r border-b min-h-24 flex flex-col items-start justify-start
                              hover:bg-opacity-80 transition-all relative
                              ${getDayClass(dateStr)}
                              ${isToday ? 'ring-2 ring-violet-500 ring-offset-1' : ''}
                              ${isSelected ? 'ring-2 ring-blue-500' : ''}
                            `}
                            disabled={loading || saving}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className={`font-medium ${isToday ? 'text-violet-700' : ''}`}>
                                {day}
                              </span>
                              
                              {dayData && (!dayData.isAvailable || dayData.stopSell) && (
                                <Lock className="w-3 h-3 text-red-600" />
                              )}
                              {dayData?.priceOverride && (
                                <DollarSign className="w-3 h-3 text-yellow-600" />
                              )}
                              {hasBooking && (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            
                            {/* Informações do dia */}
                            <div className="mt-2 text-left w-full">
                              <div className="text-xs font-medium truncate">
                                {formatCurrency(dayPrice)}
                                {dayData?.priceOverride && (
                                  <span className="text-yellow-600 ml-1">(especial)</span>
                                )}
                              </div>
                              
                              {hasBooking && booking && (
                                <div className="mt-1">
                                  <div className="text-xs text-green-600 font-medium truncate">
                                    {booking.eventTitle}
                                  </div>
                                  <div className="text-xs text-gray-600 truncate">
                                    {booking.organizerName}
                                  </div>
                                </div>
                              )}
                              
                              {dayData && (!dayData.isAvailable || dayData.stopSell) && (
                                <div className="text-xs text-red-600 mt-1 truncate">
                                  {dayData.stopSell ? 'Stop sell' : 'Indisponível'}
                                </div>
                              )}
                              
                              {isToday && (
                                <div className="text-xs text-violet-600 mt-1 font-medium">
                                  Hoje
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ações rápidas */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setBulkAction('block');
                      setShowBulkActionModal(true);
                    }}
                    disabled={loading || saving || selectedDates.length === 0}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bloquear seleção
                  </Button>
                  <Button
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setBulkAction('unblock');
                      setShowBulkActionModal(true);
                    }}
                    disabled={loading || saving || selectedDates.length === 0}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Liberar seleção
                  </Button>
                  <Button
                    variant="outline"
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => {
                      setBulkAction('price');
                      setShowBulkActionModal(true);
                    }}
                    disabled={loading || saving || selectedDates.length === 0}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Preço especial
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDates([])}
                    disabled={selectedDates.length === 0}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar seleção
                  </Button>
                </div>
              </div>

              {/* Painel lateral - ocupa 1/3 */}
              <div className="space-y-4">
                {/* Informações do espaço */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-violet-600" />
                    Informações do Espaço
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço base/dia:</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(spaceData.basePricePerDay || '0'))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sobretaxa fim de semana:</span>
                      <span className="font-medium">
                        {spaceData.weekendSurchargePercent || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacidade:</span>
                      <span className="font-medium">
                        {spaceData.capacityMin || 0} - {spaceData.capacityMax || 0} pessoas
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={spaceData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {spaceData.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Estatísticas do mês */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Estatísticas do Mês</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-700">
                        {monthStats.bookedDays}
                      </div>
                      <div className="text-xs text-gray-600">Dias reservados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {monthStats.availableDays}
                      </div>
                      <div className="text-xs text-gray-600">Dias disponíveis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {monthStats.blockedDays}
                      </div>
                      <div className="text-xs text-gray-600">Dias bloqueados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-700">
                        {formatCurrency(monthStats.estimatedRevenue)}
                      </div>
                      <div className="text-xs text-gray-600">Receita estimada</div>
                    </div>
                  </div>
                </div>

                {/* Próximas reservas */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-violet-600" />
                      Próximas Reservas
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {bookings.length}
                    </Badge>
                  </div>
                  
                  {loadingBookings ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma reserva agendada
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {bookings.slice(0, 5).map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                {booking.eventTitle}
                              </p>
                              <p className="text-xs text-gray-600">
                                {booking.organizerName}
                              </p>
                            </div>
                            <Badge
                              className={`text-xs ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'pending_approval'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {booking.status === 'confirmed' ? 'Confirmado' : 
                              booking.status === 'pending_approval' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-2">
                            <span>{format(parseISO(booking.startDate), 'dd/MM')} - {format(parseISO(booking.endDate), 'dd/MM')}</span>
                            <span>{booking.expectedAttendees} pessoas</span>
                          </div>
                          {booking.totalPrice && (
                            <div className="text-xs font-medium text-violet-700 mt-1">
                              {formatCurrency(booking.totalPrice)}
                            </div>
                          )}
                        </div>
                      ))}
                      {bookings.length > 5 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-gray-500">
                            +{bookings.length - 5} mais reservas
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modais internos (bulk action e day edit) */}
      {showBulkActionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ação em Massa ({selectedDates.length} dias)
                </h3>
                <button
                  onClick={() => {
                    setShowBulkActionModal(false);
                    setBulkPrice('');
                  }}
                  disabled={saving}
                  className="hover:bg-gray-100 p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">Ação</Label>
                  <Select
                    value={bulkAction}
                    onValueChange={(value: 'block' | 'unblock' | 'price') => setBulkAction(value)}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Bloquear datas (stop_sell)</SelectItem>
                      <SelectItem value="unblock">Liberar datas</SelectItem>
                      <SelectItem value="price">Definir preço especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkAction === 'price' && (
                  <div>
                    <Label className="block mb-2">Preço por dia (MZN)</Label>
                    <Input
                      type="number"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      placeholder="Ex: 3500"
                      min="0"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Preço base: {formatCurrency(parseFloat(spaceData.basePricePerDay || '0'))}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    Aplicar a estas datas:
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {selectedDates.slice(0, 20).map(date => (
                        <Badge key={date} variant="outline" className="text-xs">
                          {format(parseISO(date), 'dd/MM')}
                        </Badge>
                      ))}
                      {selectedDates.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedDates.length - 20} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkActionModal(false);
                      setBulkPrice('');
                    }}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleBulkAction}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDayEditModal && dayEditData.date && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Editar {format(parseISO(dayEditData.date), 'dd/MM/yyyy')}
                </h3>
                <button
                  onClick={() => {
                    setShowDayEditModal(false);
                    setSelectedDate(null);
                  }}
                  className="hover:bg-gray-100 p-1 rounded"
                  disabled={saving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Disponível para reserva</Label>
                  <Switch
                    checked={dayEditData.isAvailable}
                    onCheckedChange={(checked) =>
                      setDayEditData(prev => ({
                        ...prev,
                        isAvailable: checked,
                        stopSell: !checked,
                      }))
                    }
                    disabled={saving}
                  />
                </div>

                <div>
                  <Label className="block mb-2">Preço especial (opcional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      value={dayEditData.priceOverride || ''}
                      onChange={(e) =>
                        setDayEditData(prev => ({
                          ...prev,
                          priceOverride: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      placeholder={`Padrão: ${formatCurrency(getDayPrice(dayEditData.date))}`}
                      className="pl-10"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe vazio para usar o preço padrão do espaço
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDayEditModal(false);
                      setSelectedDate(null);
                    }}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDaySave}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventSpaceAvailabilityCalendar;