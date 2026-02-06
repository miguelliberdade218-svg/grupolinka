// src/apps/hotels-app/pages/bookings/components/BookingFilters.tsx
import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/shared/lib/utils';

interface BookingFiltersProps {
  filters: {
    status?: string | string[];
    payment_status?: string;
    startDate?: string;
    endDate?: string;
    guest_name?: string;
    guest_email?: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

const statusOptions = [
  { value: 'confirmed', label: 'Confirmadas', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: 'Pendentes', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'checked_in', label: 'Check-in', color: 'bg-blue-100 text-blue-800' },
  { value: 'checked_out', label: 'Check-out', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Canceladas', color: 'bg-red-100 text-red-800' },
  { value: 'rejected', label: 'Rejeitadas', color: 'bg-gray-100 text-gray-800' },
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'partial', label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Pago', color: 'bg-green-100 text-green-800' },
];

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  const handleStatusChange = (value: string) => {
    onFilterChange({ status: value === 'all' ? undefined : value });
  };

  const handlePaymentStatusChange = (value: string) => {
    onFilterChange({ payment_status: value === 'all' ? undefined : value });
  };

  const handleDateChange = (type: 'startDate' | 'endDate', date?: Date) => {
    onFilterChange({ [type]: date ? format(date, 'yyyy-MM-dd') : undefined });
  };

  const handleGuestNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ guest_name: e.target.value || undefined });
  };

  const handleGuestEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ guest_email: e.target.value || undefined });
  };

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <Select value={filters.status as string || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status de Pagamento */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Pagamento</label>
          <Select value={filters.payment_status || 'all'} onValueChange={handlePaymentStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {paymentStatusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color.split(' ')[0]}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data de Check-in */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Check-in a partir de</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  format(parseDate(filters.startDate)!, "dd/MM/yyyy", { locale: pt })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(filters.startDate)}
                onSelect={(date) => handleDateChange('startDate', date)}
                initialFocus
                locale={pt}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data de Check-out */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Check-out até</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? (
                  format(parseDate(filters.endDate)!, "dd/MM/yyyy", { locale: pt })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseDate(filters.endDate)}
                onSelect={(date) => handleDateChange('endDate', date)}
                initialFocus
                locale={pt}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Nome do Hóspede */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nome do Hóspede</label>
          <Input
            placeholder="Buscar por nome..."
            value={filters.guest_name || ''}
            onChange={handleGuestNameChange}
            className="h-10"
          />
        </div>

        {/* Email do Hóspede */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email do Hóspede</label>
          <Input
            placeholder="Buscar por email..."
            value={filters.guest_email || ''}
            onChange={handleGuestEmailChange}
            type="email"
            className="h-10"
          />
        </div>
      </div>

      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.status && filters.status !== 'all' && (
              <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => onFilterChange({ status: undefined })}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.payment_status && filters.payment_status !== 'all' && (
              <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                Pagamento: {paymentStatusOptions.find(s => s.value === filters.payment_status)?.label}
                <button
                  onClick={() => onFilterChange({ payment_status: undefined })}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.startDate && (
              <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                Check-in: {format(parseDate(filters.startDate)!, "dd/MM/yyyy", { locale: pt })}
                <button
                  onClick={() => onFilterChange({ startDate: undefined })}
                  className="ml-1 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.endDate && (
              <div className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm">
                Check-out: {format(parseDate(filters.endDate)!, "dd/MM/yyyy", { locale: pt })}
                <button
                  onClick={() => onFilterChange({ endDate: undefined })}
                  className="ml-1 hover:text-orange-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.guest_name && (
              <div className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
                Nome: {filters.guest_name}
                <button
                  onClick={() => onFilterChange({ guest_name: undefined })}
                  className="ml-1 hover:text-gray-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.guest_email && (
              <div className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
                Email: {filters.guest_email}
                <button
                  onClick={() => onFilterChange({ guest_email: undefined })}
                  className="ml-1 hover:text-gray-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};