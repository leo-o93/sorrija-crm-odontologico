import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Target, AlertCircle, TrendingUp } from 'lucide-react';
import { AIReportStats } from '@/hooks/useAIReports';

interface LeadsAnalysisCardProps {
  report: any;
  stats: AIReportStats;
}

export function LeadsAnalysisCard({ report, stats }: LeadsAnalysisCardProps) {
  const diagnostico = report.diagnostico || report.diagnostico_funil;
  const pontosAtencao = report.pontos_atencao || [];
  const leadsPrioritarios = report.leads_prioritarios || [];
  const taxaConversao = report.taxa_conversao;
  const recomendacoes = report.recomendacoes || [];

  // Calculate percentages
  const tempPercentages = {
    quente: stats.total_leads > 0 ? (stats.leads_by_temperature.quente / stats.total_leads) * 100 : 0,
    morno: stats.total_leads > 0 ? (stats.leads_by_temperature.morno / stats.total_leads) * 100 : 0,
    frio: stats.total_leads > 0 ? (stats.leads_by_temperature.frio / stats.total_leads) * 100 : 0,
    novo: stats.total_leads > 0 ? (stats.leads_by_temperature.novo / stats.total_leads) * 100 : 0,
  };

  return (
    <div className="space-y-6">
      {/* Temperature Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Distribuição por Temperatura
          </CardTitle>
          <CardDescription>
            {stats.total_leads} leads no período
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  🔥 Quentes
                </span>
                <span>{stats.leads_by_temperature.quente} ({tempPercentages.quente.toFixed(1)}%)</span>
              </div>
              <Progress value={tempPercentages.quente} className="h-2 bg-muted" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  🌡️ Mornos
                </span>
                <span>{stats.leads_by_temperature.morno} ({tempPercentages.morno.toFixed(1)}%)</span>
              </div>
              <Progress value={tempPercentages.morno} className="h-2 bg-muted" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  ❄️ Frios
                </span>
                <span>{stats.leads_by_temperature.frio} ({tempPercentages.frio.toFixed(1)}%)</span>
              </div>
              <Progress value={tempPercentages.frio} className="h-2 bg-muted" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  ✨ Novos
                </span>
                <span>{stats.leads_by_temperature.novo} ({tempPercentages.novo.toFixed(1)}%)</span>
              </div>
              <Progress value={tempPercentages.novo} className="h-2 bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Diagnosis */}
        {diagnostico && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5" />
                Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {typeof diagnostico === 'string' ? diagnostico : diagnostico.analise || JSON.stringify(diagnostico)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conversion Rate */}
        {taxaConversao && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taxa de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typeof taxaConversao === 'object' ? (
                <div className="space-y-2">
                  {taxaConversao.valor && (
                    <p className="text-2xl font-bold">{taxaConversao.valor}</p>
                  )}
                  {taxaConversao.analise && (
                    <p className="text-sm text-muted-foreground">{taxaConversao.analise}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm">{taxaConversao}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Attention Points */}
      {pontosAtencao.length > 0 && (
        <Card className="border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {pontosAtencao.map((ponto: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-warning">⚠️</span>
                  {ponto}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Priority Leads */}
      {leadsPrioritarios.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads Prioritários</CardTitle>
            <CardDescription>Ordenados por urgência de contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadsPrioritarios.map((lead: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {typeof lead === 'string' ? lead : lead.nome || lead.name}
                    </p>
                    {lead.motivo && (
                      <p className="text-xs text-muted-foreground truncate">{lead.motivo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recomendacoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recomendacoes.map((rec: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm p-2 bg-success/5 rounded">
                  <span>✅</span>
                  {typeof rec === 'string' ? rec : rec.acao || JSON.stringify(rec)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Fallback */}
      {!diagnostico && !taxaConversao && pontosAtencao.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise Completa</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(report, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
