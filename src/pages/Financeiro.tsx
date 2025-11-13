import { Card } from "@/components/ui/card";

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Controle de recebimentos e faturamento</p>
      </div>

      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Módulo financeiro em construção</p>
      </Card>
    </div>
  );
}
