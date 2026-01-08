import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface AIFunnelChartProps {
  data: {
    total_leads: number;
    contacted: number;
    scheduled: number;
    attended: number;
    closed: number;
  };
  insight?: string;
}

const FUNNEL_STAGES = [
  { key: 'total_leads', label: 'Total Leads', color: 'bg-primary' },
  { key: 'contacted', label: 'Contatados', color: 'bg-info' },
  { key: 'scheduled', label: 'Agendados', color: 'bg-warning' },
  { key: 'attended', label: 'Compareceram', color: 'bg-success' },
  { key: 'closed', label: 'Fechados', color: 'bg-destructive' },
];

export function AIFunnelChart({ data, insight }: AIFunnelChartProps) {
  const maxValue = data.total_leads || 1;

  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return '0%';
    return `${((current / previous) * 100).toFixed(1)}%`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {FUNNEL_STAGES.map((stage, index) => {
            const value = data[stage.key as keyof typeof data];
            const width = (value / maxValue) * 100;
            const prevValue = index > 0 ? data[FUNNEL_STAGES[index - 1].key as keyof typeof data] : value;
            const conversionRate = index > 0 ? getConversionRate(value, prevValue) : null;

            return (
              <div key={stage.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{value}</span>
                    {conversionRate && (
                      <span className="text-xs text-muted-foreground">
                        ({conversionRate})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(width, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {insight && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🧠 {insight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
