// src/apps/hotels-app/components/event-spaces/StatsPeriodSelector.tsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Calendar, TrendingUp, CalendarDays, CalendarRange } from 'lucide-react';

export type StatsPeriod = 'all' | 'year' | 'month' | 'week' | 'today' | 'custom';

interface StatsPeriodSelectorProps {
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
  showCustom?: boolean;
  className?: string;
}

export const StatsPeriodSelector: React.FC<StatsPeriodSelectorProps> = ({
  period,
  onPeriodChange,
  showCustom = false,
  className = '',
}) => {
  const periodOptions = [
    { value: 'today', label: 'Hoje', icon: <Calendar className="h-4 w-4" /> },
    { value: 'week', label: 'Esta semana', icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'month', label: 'Este mês', icon: <CalendarRange className="h-4 w-4" /> },
    { value: 'year', label: 'Este ano', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'all', label: 'Todo o período', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  if (showCustom) {
    periodOptions.push({ value: 'custom', label: 'Personalizado', icon: <Calendar className="h-4 w-4" /> });
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 ${className}`}>
      <Label htmlFor="stats-period" className="flex items-center gap-2 whitespace-nowrap">
        <TrendingUp className="h-4 w-4" />
        Período das estatísticas:
      </Label>
      <Select value={period} onValueChange={(value: StatsPeriod) => onPeriodChange(value)}>
        <SelectTrigger id="stats-period" className="w-full sm:w-[200px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
              <span className="text-gray-500">{option.icon}</span>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatsPeriodSelector;