import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SalesFunnelChartProps {
  totalLeads: number;
  leadsContacted: number;
  leadsScheduled: number;
  leadsAttended: number;
  leadsClosed: number;
}

export function SalesFunnelChart({
  totalLeads,
  leadsContacted,
  leadsScheduled,
  leadsAttended,
  leadsClosed,
}: SalesFunnelChartProps) {
  const stages = [
    { label: 'Total Leads', value: totalLeads, color: 'bg-info' },
    { label: 'Contatados', value: leadsContacted, color: 'bg-primary' },
    { label: 'Agendados', value: leadsScheduled, color: 'bg-warning' },
    { label: 'Compareceram', value: leadsAttended, color: 'bg-success' },
    { label: 'Fecharam', value: leadsClosed, color: 'bg-emerald-600' },
  ];

  const maxValue = Math.max(totalLeads, 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Funil de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => {
          const width = (stage.value / maxValue) * 100;
          const rate = index > 0 && stages[index - 1].value > 0
            ? ((stage.value / stages[index - 1].value) * 100).toFixed(0)
            : null;

          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stage.value}</span>
                  {rate && (
                    <span className="text-xs text-muted-foreground">
                      ({rate}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-6 w-full bg-muted rounded-md overflow-hidden">
                <div
                  className={cn('h-full rounded-md transition-all', stage.color)}
                  style={{ width: `${Math.max(width, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
