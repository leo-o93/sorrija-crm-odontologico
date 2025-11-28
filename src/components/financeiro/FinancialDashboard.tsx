import { Card } from "@/components/ui/card";
import { useFinancialStats } from "@/hooks/useFinancialStats";
import { TrendingUp, TrendingDown, Wallet, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

export function FinancialDashboard() {
  const { data: stats, isLoading } = useFinancialStats();

  if (isLoading) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receitas do Mês"
          value={`R$ ${stats?.receitas.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          variant="success"
        />
        
        <StatCard
          title="Despesas do Mês"
          value={`R$ ${stats?.despesas.toFixed(2) || '0.00'}`}
          icon={TrendingDown}
          variant="warning"
        />
        
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${stats?.lucro.toFixed(2) || '0.00'}`}
          icon={Wallet}
          variant={(stats?.lucro || 0) >= 0 ? "success" : "warning"}
        />
        
        <StatCard
          title="A Receber"
          value={`R$ ${stats?.receitasPendentes.toFixed(2) || '0.00'}`}
          icon={Clock}
          variant="info"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Receitas Pendentes</span>
            <span className="font-semibold text-green-600">
              R$ {stats?.receitasPendentes.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Despesas Pendentes</span>
            <span className="font-semibold text-red-600">
              R$ {stats?.despesasPendentes.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-semibold">Lucro Projetado</span>
            <span className={`font-bold text-lg ${
              (stats?.lucroProjetado || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {stats?.lucroProjetado.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
