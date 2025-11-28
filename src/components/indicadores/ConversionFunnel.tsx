import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface ConversionFunnelProps {
  totalLeads: number;
  leadsContacted: number;
  leadsScheduled: number;
  leadsAttended: number;
  leadsClosed: number;
}

export function ConversionFunnel({
  totalLeads,
  leadsContacted,
  leadsScheduled,
  leadsAttended,
  leadsClosed
}: ConversionFunnelProps) {
  const stages: FunnelStage[] = [
    {
      label: 'Novos Leads',
      value: totalLeads,
      percentage: 100,
      color: 'bg-blue-500'
    },
    {
      label: 'Contatados',
      value: leadsContacted,
      percentage: totalLeads > 0 ? (leadsContacted / totalLeads) * 100 : 0,
      color: 'bg-cyan-500'
    },
    {
      label: 'Agendados',
      value: leadsScheduled,
      percentage: totalLeads > 0 ? (leadsScheduled / totalLeads) * 100 : 0,
      color: 'bg-teal-500'
    },
    {
      label: 'Compareceram',
      value: leadsAttended,
      percentage: totalLeads > 0 ? (leadsAttended / totalLeads) * 100 : 0,
      color: 'bg-green-500'
    },
    {
      label: 'Fechados',
      value: leadsClosed,
      percentage: totalLeads > 0 ? (leadsClosed / totalLeads) * 100 : 0,
      color: 'bg-emerald-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{stage.value} leads</span>
                  <span className="font-semibold min-w-[60px] text-right">
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500 flex items-center justify-start px-3', stage.color)}
                  style={{ width: `${stage.percentage}%` }}
                >
                  {stage.percentage > 15 && (
                    <span className="text-white text-xs font-semibold">
                      {stage.value}
                    </span>
                  )}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                  <span>↓</span>
                  <span>
                    {stages[index + 1].value > 0 && stage.value > 0
                      ? `${((stages[index + 1].value / stage.value) * 100).toFixed(1)}% converteu`
                      : 'Sem conversão'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
