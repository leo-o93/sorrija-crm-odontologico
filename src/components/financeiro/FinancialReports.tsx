import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export function FinancialReports() {
  return (
    <Tabs defaultValue="dre" className="space-y-4">
      <TabsList>
        <TabsTrigger value="dre">DRE Simplificado</TabsTrigger>
        <TabsTrigger value="procedures">Por Procedimento</TabsTrigger>
        <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        <TabsTrigger value="comparative">Comparativo</TabsTrigger>
      </TabsList>

      <TabsContent value="dre">
        <Card className="p-4 space-y-2">
          <h3 className="text-lg font-semibold">Demonstrativo de Resultado (DRE)</h3>
          <p className="text-sm text-muted-foreground">
            Visualize receitas, despesas e resultado líquido por período.
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="procedures">
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Ranking por Procedimento</h3>
          <p className="text-sm text-muted-foreground">Em construção: ranking dos procedimentos por faturamento.</p>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Despesas por Categoria</h3>
          <p className="text-sm text-muted-foreground">Em construção: gráfico de pizza por categoria.</p>
        </Card>
      </TabsContent>

      <TabsContent value="comparative">
        <Card className="p-4">
          <h3 className="text-lg font-semibold">Comparativos</h3>
          <p className="text-sm text-muted-foreground">
            Comparativo mês atual vs anterior e ano atual vs anterior.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
