import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMultiOrgDashboard } from "@/hooks/useMultiOrgDashboard";
import { Building2, TrendingUp, Users, DollarSign, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function MultiOrgComparison() {
  const { data: metrics, isLoading } = useMultiOrgDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparativo entre Organizações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Só mostrar se houver múltiplas organizações
  if (metrics.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Comparativo entre Organizações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.organizationId}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{metric.organizationName}</h4>
                  <p className="text-xs text-muted-foreground">
                    {metric.evolutionInstance}
                  </p>
                </div>
                <Badge variant="outline">
                  {metric.conversionRate.toFixed(1)}% conversão
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Leads</p>
                    <p className="text-lg font-semibold">{metric.totalLeads}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fechados</p>
                    <p className="text-lg font-semibold">{metric.closedLeads}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Receita</p>
                    <p className="text-lg font-semibold">
                      R$ {metric.revenue.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conversas</p>
                    <p className="text-lg font-semibold">{metric.activeConversations}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}