import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  current: number;
  previous: number;
  format?: 'number' | 'currency' | 'percentage';
}

interface ComparisonCardProps {
  metrics: Metric[];
}

export function ComparisonCard({ metrics }: ComparisonCardProps) {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativo de Períodos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const growth = calculateGrowth(metric.current, metric.previous);
            const isPositive = growth >= 0;

            return (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-semibold',
                    isPositive ? 'text-success' : 'text-destructive'
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(growth).toFixed(1)}%
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Atual:</span>
                      <span className="font-semibold">
                        {formatValue(metric.current, metric.format)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Anterior:</span>
                      <span className="text-muted-foreground">
                        {formatValue(metric.previous, metric.format)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      isPositive ? 'bg-success' : 'bg-destructive'
                    )}
                    style={{ 
                      width: `${Math.min(Math.abs(growth), 100)}%` 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
