import { Card, CardContent } from '@/components/ui/card';
import { CalendarCheck, CalendarX } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SchedulingCardProps {
  scheduled: number;
  unscheduled: number;
  rate: number;
}

export function SchedulingCard({ scheduled, unscheduled, rate }: SchedulingCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Taxa de Agendamento</span>
            <span className="text-2xl font-bold">{rate.toFixed(0)}%</span>
          </div>
          
          <Progress value={rate} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-success" />
              <div>
                <p className="text-lg font-semibold">{scheduled}</p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarX className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-lg font-semibold">{unscheduled}</p>
                <p className="text-xs text-muted-foreground">Não agendados</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
