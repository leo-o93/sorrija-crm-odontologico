import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain, RefreshCw, Calendar as CalendarIcon, Download, AlertTriangle, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAIReports, ReportType } from '@/hooks/useAIReports';
import { AIReportDashboard } from '@/components/relatorios-ia/AIReportDashboard';
import { LeadsAnalysisCard } from '@/components/relatorios-ia/LeadsAnalysisCard';
import { RecommendationsSection } from '@/components/relatorios-ia/RecommendationsSection';
import { StatsOverview } from '@/components/relatorios-ia/StatsOverview';

export default function RelatoriosIA() {
  const { generateReport, isLoading, reportData, clearReport } = useAIReports();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [activeTab, setActiveTab] = useState<ReportType>('full_report');

  const handleGenerateReport = async () => {
    await generateReport(activeTab, { start: dateRange.from, end: dateRange.to });
  };

  const handleExport = () => {
    if (!reportData) return;
    
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-ia-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Relatórios Inteligentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises geradas por IA com base em dados reais do seu CRM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>

          {reportData && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for report types */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="full_report" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Completo</span>
          </TabsTrigger>
          <TabsTrigger value="leads_analysis" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="conversations_analysis" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Conversas</span>
          </TabsTrigger>
          <TabsTrigger value="performance_analysis" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Ações</span>
          </TabsTrigger>
        </TabsList>

        {/* Content area */}
        <div className="mt-6">
          {!reportData && !isLoading && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório gerado</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Clique em "Gerar Relatório" para que a IA analise seus dados de leads, conversas e performance.
                </p>
                <Button onClick={handleGenerateReport}>
                  <Brain className="mr-2 h-4 w-4" />
                  Gerar Primeiro Relatório
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Analisando dados...</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  A IA está processando seus dados de leads, conversas e agendamentos para gerar insights personalizados.
                </p>
              </CardContent>
            </Card>
          )}

          {reportData && !isLoading && (
            <div className="space-y-6">
              {/* Stats Overview */}
              <StatsOverview stats={reportData.stats} />

              {/* Main Report Content */}
              <TabsContent value="full_report" className="mt-0">
                <AIReportDashboard report={reportData.report} stats={reportData.stats} />
              </TabsContent>

              <TabsContent value="leads_analysis" className="mt-0">
                <LeadsAnalysisCard report={reportData.report} stats={reportData.stats} />
              </TabsContent>

              <TabsContent value="conversations_analysis" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Análise de Conversas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.report.engajamento ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Engajamento</h4>
                          <p className="text-sm text-muted-foreground">
                            {reportData.report.engajamento.analise || JSON.stringify(reportData.report.engajamento)}
                          </p>
                        </div>
                        {reportData.report.melhorias && (
                          <div>
                            <h4 className="font-medium mb-2">Sugestões de Melhoria</h4>
                            <ul className="space-y-2">
                              {reportData.report.melhorias.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">
                        {JSON.stringify(reportData.report, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance_analysis" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Análise de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reportData.report.produtividade ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Produtividade</h4>
                            <p className="text-sm text-muted-foreground">
                              {typeof reportData.report.produtividade === 'string' 
                                ? reportData.report.produtividade 
                                : JSON.stringify(reportData.report.produtividade)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Efetividade</h4>
                            <p className="text-sm text-muted-foreground">
                              {reportData.report.efetividade?.analise || JSON.stringify(reportData.report.efetividade)}
                            </p>
                          </div>
                        </div>
                        {reportData.report.metas_sugeridas && (
                          <div>
                            <h4 className="font-medium mb-2">Metas Sugeridas</h4>
                            <ul className="space-y-2">
                              {reportData.report.metas_sugeridas.map((meta: any, i: number) => (
                                <li key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <span className="text-sm">{meta.meta || meta}</span>
                                  {meta.valor && <span className="text-sm font-medium">{meta.valor}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">
                        {JSON.stringify(reportData.report, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="mt-0">
                <RecommendationsSection report={reportData.report} />
              </TabsContent>

              {/* Generation info */}
              <p className="text-xs text-muted-foreground text-center">
                Relatório gerado em {format(new Date(reportData.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} 
                {' '}• Período: {format(new Date(reportData.date_range.start), 'dd/MM/yy')} - {format(new Date(reportData.date_range.end), 'dd/MM/yy')}
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
