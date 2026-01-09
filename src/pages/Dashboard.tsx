import { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { MultiOrgComparison } from "@/components/dashboard/MultiOrgComparison";
import { TemperatureCards } from "@/components/dashboard/TemperatureCards";
import { HotSubstatusChart } from "@/components/dashboard/HotSubstatusChart";
import { LeadsByInterestChart } from "@/components/dashboard/LeadsByInterestChart";
import { SalesFunnelChart } from "@/components/dashboard/SalesFunnelChart";
import { SchedulingCard } from "@/components/dashboard/SchedulingCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { SourcesChart } from "@/components/indicadores/SourcesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesDashboard } from "@/hooks/useSalesDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const { data: stats, isLoading } = useSalesDashboard(startDate, endDate);
  const { userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">Acompanhe seus leads e conversões</p>
        </div>
        <DashboardFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          variant="gold"
          trend={stats?.leadsGrowth ? {
            value: Math.abs(stats.leadsGrowth),
            isPositive: stats.leadsGrowth >= 0,
          } : undefined}
        />
        <SchedulingCard
          scheduled={stats?.scheduledLeads || 0}
          unscheduled={stats?.unscheduledLeads || 0}
          rate={stats?.schedulingRate || 0}
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${(stats?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="success"
          trend={stats?.revenueGrowth ? {
            value: Math.abs(stats.revenueGrowth),
            isPositive: stats.revenueGrowth >= 0,
          } : undefined}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${(stats?.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          variant="info"
        />
      </div>

      {/* Temperature Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Leads por Temperatura</h2>
        <TemperatureCards
          novo={stats?.leadsByTemperature.novo || 0}
          quente={stats?.leadsByTemperature.quente || 0}
          frio={stats?.leadsByTemperature.frio || 0}
          perdido={stats?.leadsByTemperature.perdido || 0}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SalesFunnelChart
          totalLeads={stats?.totalLeads || 0}
          leadsContacted={stats?.leadsContacted || 0}
          leadsScheduled={stats?.leadsScheduled || 0}
          leadsAttended={stats?.leadsAttended || 0}
          leadsClosed={stats?.leadsClosed || 0}
        />
        <HotSubstatusChart data={stats?.hotSubstatus || { em_conversa: 0, aguardando_resposta: 0, em_negociacao: 0, follow_up_agendado: 0 }} />
        <QuickActions />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <LeadsByInterestChart data={stats?.leadsByInterest || []} />
        <SourcesChart data={stats?.leadsBySource || []} />
      </div>

      {/* Multi-Organization Comparison (só para admins) */}
      {userRole?.role === 'admin' && (
        <MultiOrgComparison />
      )}

      {/* Alerts */}
      <AlertsList />
    </div>
  );
}
