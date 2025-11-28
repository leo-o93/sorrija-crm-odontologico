import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

function KPICard({ title, value, trend, icon: Icon, variant = 'default' }: KPICardProps) {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(1)}% vs mês anterior
              </div>
            )}
          </div>
          <div className={cn(
            'h-12 w-12 rounded-lg flex items-center justify-center',
            variants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KPIGridProps {
  totalLeads: number;
  conversionRate: number;
  monthlyRevenue: number;
  averageTicket: number;
  leadsGrowth: number;
  revenueGrowth: number;
}

export function KPIGrid({ 
  totalLeads, 
  conversionRate, 
  monthlyRevenue, 
  averageTicket,
  leadsGrowth,
  revenueGrowth 
}: KPIGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total de Leads"
        value={totalLeads}
        trend={leadsGrowth}
        icon={Users}
        variant="info"
      />
      <KPICard
        title="Taxa de Conversão"
        value={`${conversionRate.toFixed(1)}%`}
        icon={Target}
        variant="success"
      />
      <KPICard
        title="Receita do Mês"
        value={new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(monthlyRevenue)}
        trend={revenueGrowth}
        icon={DollarSign}
        variant="default"
      />
      <KPICard
        title="Ticket Médio"
        value={new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(averageTicket)}
        icon={Ticket}
        variant="warning"
      />
    </div>
  );
}
