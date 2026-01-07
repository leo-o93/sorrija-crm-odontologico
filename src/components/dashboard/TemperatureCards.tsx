import { Card, CardContent } from '@/components/ui/card';
import { Flame, Snowflake, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemperatureCardsProps {
  novo: number;
  quente: number;
  frio: number;
  perdido: number;
}

export function TemperatureCards({ novo, quente, frio, perdido }: TemperatureCardsProps) {
  const cards = [
    {
      label: 'Novos',
      value: novo,
      icon: Sparkles,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Quentes',
      value: quente,
      icon: Flame,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Frios',
      value: frio,
      icon: Snowflake,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Perdidos',
      value: perdido,
      icon: XCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
