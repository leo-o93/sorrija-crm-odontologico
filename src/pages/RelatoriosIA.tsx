import { useState } from 'react';
import { useAIReports } from '@/hooks/useAIReports';
import { useAIReportStats } from '@/hooks/useAIReportStats';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, RefreshCw, Brain, Users, MessageSquare, Calendar as CalendarIconLucide, Flame, TrendingUp, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AITemperatureChart } from '@/components/relatorios-ia/AITemperatureChart';
import { AIFunnelChart } from '@/components/relatorios-ia/AIFunnelChart';
import { AIEngagementChart } from '@/components/relatorios-ia/AIEngagementChart';
import { AISubstatusChart } from '@/components/relatorios-ia/AISubstatusChart';
import { AIAlertsBanner } from '@/components/relatorios-ia/AIAlertsBanner';
import { AIInsightCard } from '@/components/relatorios-ia/AIInsightCard';
import { AIPriorityLeads } from '@/components/relatorios-ia/AIPriorityLeads';
import { AIReportDashboard } from '@/components/relatorios-ia/AIReportDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RelatoriosIA() {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, dataUpdatedAt } = useAIReportStats(dateRange);
  const { generateReport, isLoading: aiLoading, reportData } = useAIReports();

  const handleGenerateAIAnalysis = () => {
    generateReport('full_report', dateRange);
  };

  const handleExport = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ia-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  // Extract AI insights from report
  const aiInsights = reportData?.report || {};
  const priorityLeads = aiInsights.leads_prioritarios || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Relatórios Inteligentes
          </h1>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
              <span className="ml-2 text-success">● Auto-refresh 30s</span>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.start, "dd/MM", { locale: ptBR })} - {format(dateRange.end, "dd/MM", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.start, to: dateRange.end }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ 
                        start: range.from, 
                        end: range.to || range.from 
                      });
                    }
                  }}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
            </PopoverContent>
          </Popover>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw className={cn("h-4 w-4", statsLoading && "animate-spin")} />
          </Button>

          <Button 
            onClick={handleGenerateAIAnalysis}
            disabled={aiLoading}
            className="gap-2"
          >
            <Brain className={cn("h-4 w-4", aiLoading && "animate-pulse")} />
            {aiLoading ? 'Analisando...' : 'Análise IA'}
          </Button>

          {reportData && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Alerts Banner */}
      {stats && (
        <AIAlertsBanner 
          leadsWithoutResponse24h={stats.leads_without_response_24h}
          hotLeadsWithoutResponseToday={stats.hot_leads_without_response_today}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <AIInsightCard 
              title="Total Leads" 
              value={stats.total_leads} 
              icon={Users}
              color="default"
            />
            <AIInsightCard 
              title="Leads Quentes" 
              value={stats.leads_by_temperature.quente} 
              icon={Flame}
              color="destructive"
              subtitle={`${stats.total_leads > 0 ? ((stats.leads_by_temperature.quente / stats.total_leads) * 100).toFixed(1) : 0}%`}
            />
            <AIInsightCard 
              title="Conversas Abertas" 
              value={stats.open_conversations} 
              icon={MessageSquare}
              color="info"
            />
            <AIInsightCard 
              title="Agendamentos" 
              value={stats.appointments_scheduled} 
              icon={CalendarIconLucide}
              color="success"
            />
            <AIInsightCard 
              title="Realizados" 
              value={stats.appointments_completed} 
              icon={TrendingUp}
              color="success"
            />
            <AIInsightCard 
              title="Mensagens" 
              value={stats.total_messages} 
              icon={MessageSquare}
              color="default"
              subtitle={`${stats.messages_in} in / ${stats.messages_out} out`}
            />
          </>
        ) : null}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-[280px] w-full" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <AITemperatureChart 
              data={stats.leads_by_temperature}
              insight={aiInsights.diagnostico_funil?.observacao || aiInsights.resumo_executivo?.principais_pontos?.[0]}
            />
            <AISubstatusChart 
              data={stats.leads_by_substatus}
              insight={aiInsights.diagnostico_funil?.gargalo_principal}
            />
            <AIFunnelChart 
              data={{
                total_leads: stats.total_leads,
                contacted: stats.leads_by_temperature.quente + stats.leads_by_temperature.morno,
                scheduled: stats.appointments_scheduled + stats.appointments_completed,
                attended: stats.appointments_completed,
                closed: stats.leads_by_substatus.fechado,
              }}
              insight={aiInsights.diagnostico_funil?.taxa_conversao ? 
                `Taxa de conversão geral: ${aiInsights.diagnostico_funil.taxa_conversao}` : undefined}
            />
            <AIEngagementChart 
              messagesIn={stats.messages_in}
              messagesOut={stats.messages_out}
              insight={aiInsights.resumo_executivo?.principais_pontos?.[1]}
            />
          </>
        ) : null}
      </div>

      {/* AI Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {aiLoading ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 animate-pulse text-primary" />
                  Gerando análise inteligente...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-20 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          ) : reportData && stats ? (
            <AIReportDashboard report={reportData.report} stats={stats} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  Análise Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">
                    Clique em "Análise IA" para gerar insights detalhados baseados nos seus dados reais.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <AIPriorityLeads 
            leads={priorityLeads}
            isLoading={aiLoading}
          />
        </div>
      </div>
    </div>
  );
}
