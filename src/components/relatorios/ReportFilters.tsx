import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export function ReportFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ReportFiltersProps) {
  const presets = [
    {
      label: 'Este mês',
      action: () => {
        onStartDateChange(startOfMonth(new Date()));
        onEndDateChange(endOfMonth(new Date()));
      },
    },
    {
      label: 'Último mês',
      action: () => {
        const lastMonth = subMonths(new Date(), 1);
        onStartDateChange(startOfMonth(lastMonth));
        onEndDateChange(endOfMonth(lastMonth));
      },
    },
    {
      label: 'Últimos 3 meses',
      action: () => {
        onStartDateChange(subMonths(new Date(), 3));
        onEndDateChange(new Date());
      },
    },
    {
      label: 'Este ano',
      action: () => {
        onStartDateChange(startOfYear(new Date()));
        onEndDateChange(new Date());
      },
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={preset.action}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data início'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && onStartDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data fim'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => date && onEndDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
