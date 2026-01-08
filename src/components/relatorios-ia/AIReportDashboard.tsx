import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Target, TrendingUp, Users, Lightbulb } from 'lucide-react';
import { AIReportStats } from '@/hooks/useAIReports';

interface AIReportDashboardProps {
  report: any;
  stats: AIReportStats;
}

export function AIReportDashboard({ report, stats }: AIReportDashboardProps) {
  // Handle different response formats
  const resumo = report.resumo_executivo || report.raw_analysis?.slice(0, 500);
  const diagnostico = report.diagnostico_funil || report.diagnostico;
  const leadsPrioritarios = report.leads_prioritarios || [];
  const problemas = report.problemas_criticos || report.pontos_atencao || [];
  const recomendacoes = report.recomendacoes || [];
  const previsao = report.previsao;

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {resumo && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Resumo Executivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {typeof resumo === 'string' ? resumo : JSON.stringify(resumo)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel Diagnosis */}
        {diagnostico && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Diagnóstico do Funil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {diagnostico.saude && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saúde do Funil</span>
                  <Badge variant={diagnostico.saude >= 7 ? 'default' : diagnostico.saude >= 5 ? 'secondary' : 'destructive'}>
                    {diagnostico.saude}/10
                  </Badge>
                </div>
              )}
              {diagnostico.taxa_conversao && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <span className="text-sm font-medium">
                    {typeof diagnostico.taxa_conversao === 'object' 
                      ? diagnostico.taxa_conversao.valor || diagnostico.taxa_conversao.estimada
                      : diagnostico.taxa_conversao}
                  </span>
                </div>
              )}
              {diagnostico.gargalos && diagnostico.gargalos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Gargalos:</p>
                  <ul className="space-y-1">
                    {diagnostico.gargalos.map((g: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {typeof diagnostico === 'string' && (
                <p className="text-sm">{diagnostico}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Priority Leads */}
        {leadsPrioritarios.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads Prioritários
              </CardTitle>
              <CardDescription>Contatar primeiro</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {leadsPrioritarios.slice(0, 5).map((lead: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {typeof lead === 'string' ? lead : lead.nome || lead.name}
                      </p>
                      {lead.motivo && (
                        <p className="text-xs text-muted-foreground truncate">{lead.motivo}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Critical Problems */}
      {problemas.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Problemas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {problemas.map((problema: any, i: number) => (
                <li key={i} className="flex items-start gap-2 p-2 bg-destructive/5 rounded-lg text-sm">
                  <span className="text-destructive">⚠️</span>
                  {typeof problema === 'string' ? problema : problema.descricao || JSON.stringify(problema)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recomendacoes.length > 0 && (
        <Card className="border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-success">
              <Lightbulb className="h-5 w-5" />
              Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recomendacoes.map((rec: any, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {typeof rec === 'string' ? rec : rec.acao}
                    </p>
                    {rec.impacto && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Impacto: {rec.impacto}
                      </p>
                    )}
                    {rec.prazo && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {rec.prazo}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Forecast */}
      {previsao && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Previsão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {typeof previsao === 'string' ? previsao : JSON.stringify(previsao, null, 2)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fallback for raw analysis */}
      {report.raw_analysis && !resumo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Análise Completa</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {report.raw_analysis}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
