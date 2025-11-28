import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useIndicators } from "@/hooks/useIndicators";
import { KPIGrid } from "@/components/indicadores/KPIGrid";
import { ConversionFunnel } from "@/components/indicadores/ConversionFunnel";
import { SourcesChart } from "@/components/indicadores/SourcesChart";
import { MonthlyEvolutionChart } from "@/components/indicadores/MonthlyEvolutionChart";
import { ComparisonCard } from "@/components/indicadores/ComparisonCard";
import { startOfMonth, endOfMonth } from 'date-fns';

export default function Indicadores() {
  const [startDate] = useState(startOfMonth(new Date()));
  const [endDate] = useState(endOfMonth(new Date()));

  const { data: indicators, isLoading } = useIndicators(startDate, endDate);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Indicadores & Gráficos</h1>
          <p className="text-muted-foreground">KPIs e análises visuais</p>
        </div>
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Indicadores & Gráficos</h1>
          <p className="text-muted-foreground">KPIs e análises visuais</p>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Erro ao carregar indicadores</p>
        </Card>
      </div>
    );
  }

  const comparisonMetrics = [
    {
      label: 'Total de Leads',
      current: indicators.totalLeads,
      previous: indicators.previousTotalLeads,
      format: 'number' as const
    },
    {
      label: 'Receita Mensal',
      current: indicators.monthlyRevenue,
      previous: indicators.previousRevenue,
      format: 'currency' as const
    },
    {
      label: 'Taxa de Conversão',
      current: indicators.conversionRate,
      previous: indicators.previousTotalLeads > 0 
        ? (indicators.leadsClosed / indicators.previousTotalLeads) * 100 
        : 0,
      format: 'percentage' as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Indicadores & Gráficos</h1>
          <p className="text-muted-foreground">KPIs e análises visuais de performance</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Mês Atual
        </Button>
      </div>

      <KPIGrid
        totalLeads={indicators.totalLeads}
        conversionRate={indicators.conversionRate}
        monthlyRevenue={indicators.monthlyRevenue}
        averageTicket={indicators.averageTicket}
        leadsGrowth={indicators.leadsGrowth}
        revenueGrowth={indicators.revenueGrowth}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConversionFunnel
          totalLeads={indicators.totalLeads}
          leadsContacted={indicators.leadsContacted}
          leadsScheduled={indicators.leadsScheduled}
          leadsAttended={indicators.leadsAttended}
          leadsClosed={indicators.leadsClosed}
        />

        <ComparisonCard metrics={comparisonMetrics} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SourcesChart data={indicators.leadsBySource} />
        <MonthlyEvolutionChart data={indicators.monthlyEvolution} />
      </div>
    </div>
  );
}
