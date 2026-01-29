// src/apps/hotels-app/components/event-spaces/BookingFilters.tsx
import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Search, X } from 'lucide-react'; // ← Troquei Calendar por Search
import { DatePicker } from '@/shared/components/ui/date-picker';

// Tipo completo para evitar 'any'
export interface BookingFiltersState {
  status: string;
  dateRange: string;
  search: string;
  paymentStatus: string;
  eventType: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

interface BookingFiltersProps {
  filters: BookingFiltersState;
  onFilterChange: (filters: BookingFiltersState) => void;
  onClearFilters: () => void;
  onApplyFilters?: () => void; // Opcional: callback para aplicar (ex: recarregar lista)
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
}) => {
  const handleChange = <K extends keyof BookingFiltersState>(
    field: K,
    value: BookingFiltersState[K]
  ) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    handleChange(field, date);
  };

  const handleClear = () => {
    onClearFilters();
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  return (
    <Card className="p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900">Filtros Avançados</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar tudo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Status da Reserva */}
        <div>
          <Label htmlFor="status">Status da Reserva</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending_approval">Aguardando aprovação</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status de Pagamento */}
        <div>
          <Label htmlFor="paymentStatus">Status de Pagamento</Label>
          <Select
            value={filters.paymentStatus}
            onValueChange={(value) => handleChange('paymentStatus', value)}
          >
            <SelectTrigger id="paymentStatus">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Evento */}
        <div>
          <Label htmlFor="eventType">Tipo de Evento</Label>
          <Select
            value={filters.eventType}
            onValueChange={(value) => handleChange('eventType', value)}
          >
            <SelectTrigger id="eventType">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="conference">Conferência</SelectItem>
              <SelectItem value="wedding">Casamento</SelectItem>
              <SelectItem value="corporate">Corporativo</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="religious">Religioso</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Intervalo de Datas */}
        <div>
          <Label htmlFor="dateRange">Intervalo de Datas</Label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => {
              handleChange('dateRange', value);
              // Resetar datas customizadas ao mudar de opção
              if (value !== 'custom') {
                handleChange('startDate', undefined);
                handleChange('endDate', undefined);
              }
            }}
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Datas Personalizadas */}
        {filters.dateRange === 'custom' && (
          <>
            <div>
              <Label>Data Inicial</Label>
              <DatePicker
                date={filters.startDate}
                onSelect={(date) => handleDateChange('startDate', date)}
                placeholder="Selecione início"
              />
            </div>
            <div>
              <Label>Data Final</Label>
              <DatePicker
                date={filters.endDate}
                onSelect={(date) => handleDateChange('endDate', date)}
                placeholder="Selecione fim"
                minDate={filters.startDate} // Evita data final antes da inicial
              />
            </div>
          </>
        )}

        {/* Intervalo de Valores */}
        <div className="md:col-span-2 lg:col-span-2">
          <Label>Intervalo de Valores (MZN)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Mínimo"
              type="number"
              value={filters.minAmount ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                handleChange('minAmount', val);
              }}
              min={0}
              className="flex-1"
            />
            <Input
              placeholder="Máximo"
              type="number"
              value={filters.maxAmount ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                handleChange('maxAmount', val);
              }}
              min={filters.minAmount ?? 0}
              className="flex-1"
            />
          </div>
        </div>

        {/* Busca por Texto */}
        <div className="md:col-span-3 lg:col-span-4">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Título, organizador, email, telefone..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleClear}
        >
          Limpar
        </Button>
        <Button
          onClick={handleApply}
          className="bg-primary hover:bg-primary/90"
        >
          Aplicar Filtros
        </Button>
      </div>
    </Card>
  );
};

export default BookingFilters;