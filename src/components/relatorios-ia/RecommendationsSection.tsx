import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar, DollarSign, Target } from 'lucide-react';

interface RecommendationsSectionProps {
  report: any;
}

export function RecommendationsSection({ report }: RecommendationsSectionProps) {
  const acoesImediatas = report.acoes_imediatas || [];
  const acoesCurtoPrazo = report.acoes_curto_prazo || [];
  const acoesMedioPrazo = report.acoes_medio_prazo || [];
  const oportunidades = report.oportunidades;
  const riscos = report.riscos || [];

  const hasData = acoesImediatas.length > 0 || acoesCurtoPrazo.length > 0 || 
                  acoesMedioPrazo.length > 0 || oportunidades || riscos.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recomendações Estratégicas</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(report, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Immediate Actions */}
      {acoesImediatas.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Ações Imediatas
            </CardTitle>
            <CardDescription>Fazer hoje ou amanhã</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {acoesImediatas.map((acao: any, i: number) => (
                <li key={i} className="p-3 bg-destructive/5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-destructive font-bold">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {typeof acao === 'string' ? acao : acao.acao}
                      </p>
                      {acao.impacto && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Impacto: {acao.impacto}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Short Term Actions */}
        {acoesCurtoPrazo.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Curto Prazo
              </CardTitle>
              <CardDescription>Próximos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {acoesCurtoPrazo.map((acao: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-2 bg-warning/5 rounded">
                    <span className="text-warning">•</span>
                    {typeof acao === 'string' ? acao : acao.acao || JSON.stringify(acao)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Medium Term Actions */}
        {acoesMedioPrazo.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-info" />
                Médio Prazo
              </CardTitle>
              <CardDescription>Próximos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {acoesMedioPrazo.map((acao: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm p-2 bg-info/5 rounded">
                    <span className="text-info">•</span>
                    {typeof acao === 'string' ? acao : acao.acao || JSON.stringify(acao)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Opportunities */}
      {oportunidades && (
        <Card className="border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-success">
              <DollarSign className="h-5 w-5" />
              Oportunidades Identificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof oportunidades === 'object' ? (
              <div className="space-y-2">
                {oportunidades.descricao && (
                  <p className="text-sm">{oportunidades.descricao}</p>
                )}
                {oportunidades.valor_estimado && (
                  <Badge variant="outline" className="text-success border-success">
                    Valor estimado: {oportunidades.valor_estimado}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm">{oportunidades}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Risks */}
      {riscos.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Target className="h-5 w-5" />
              Riscos Identificados
            </CardTitle>
            <CardDescription>Leads em risco de perda</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {riscos.map((risco: any, i: number) => (
                <li key={i} className="p-3 bg-destructive/5 rounded-lg">
                  {typeof risco === 'object' ? (
                    <div>
                      <p className="text-sm font-medium">{risco.lead}</p>
                      <p className="text-xs text-muted-foreground mt-1">{risco.risco}</p>
                    </div>
                  ) : (
                    <p className="text-sm">{risco}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
