import { Card, CardContent } from '@/components/ui/card';
import { Users, MessageSquare, Calendar, Flame, Thermometer, Snowflake, UserPlus } from 'lucide-react';
import { AIReportStats } from '@/hooks/useAIReports';

interface StatsOverviewProps {
  stats: AIReportStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'Total de Leads',
      value: stats.total_leads,
      icon: Users,
      color: 'text-primary'
    },
    {
      label: 'Leads Quentes',
      value: stats.leads_by_temperature.quente,
      icon: Flame,
      color: 'text-destructive',
      percentage: stats.total_leads > 0 
        ? ((stats.leads_by_temperature.quente / stats.total_leads) * 100).toFixed(1) + '%'
        : '0%'
    },
    {
      label: 'Leads Mornos',
      value: stats.leads_by_temperature.morno,
      icon: Thermometer,
      color: 'text-warning'
    },
    {
      label: 'Leads Novos',
      value: stats.leads_by_temperature.novo,
      icon: UserPlus,
      color: 'text-info'
    },
    {
      label: 'Conversas Abertas',
      value: stats.open_conversations,
      icon: MessageSquare,
      color: 'text-success'
    },
    {
      label: 'Agendamentos',
      value: stats.appointments_scheduled,
      icon: Calendar,
      color: 'text-primary'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              {stat.percentage && (
                <span className="text-xs text-muted-foreground">{stat.percentage}</span>
              )}
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
