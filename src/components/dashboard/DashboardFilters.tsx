import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DashboardFiltersProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export function DashboardFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DashboardFiltersProps) {
  const presets = [
    {
      label: 'Este mês',
      action: () => {
        onStartDateChange(startOfMonth(new Date()));
        onEndDateChange(endOfMonth(new Date()));
      },
    },
    {
      label: 'Mês passado',
      action: () => {
        const lastMonth = subMonths(new Date(), 1);
        onStartDateChange(startOfMonth(lastMonth));
        onEndDateChange(endOfMonth(lastMonth));
      },
    },
    {
      label: 'Últimos 3 meses',
      action: () => {
        onStartDateChange(startOfMonth(subMonths(new Date(), 2)));
        onEndDateChange(endOfMonth(new Date()));
      },
    },
    {
      label: 'Este ano',
      action: () => {
        onStartDateChange(startOfYear(new Date()));
        onEndDateChange(endOfMonth(new Date()));
      },
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={preset.action}
          className="text-xs"
        >
          {preset.label}
        </Button>
      ))}

      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {format(startDate, 'dd/MM/yy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={(date) => date && onStartDateChange(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        
        <span className="text-muted-foreground text-xs">a</span>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {format(endDate, 'dd/MM/yy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={(date) => date && onEndDateChange(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
