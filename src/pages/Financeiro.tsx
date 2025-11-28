import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FinancialDashboard } from "@/components/financeiro/FinancialDashboard";
import { TransactionForm } from "@/components/financeiro/TransactionForm";
import { TransactionList } from "@/components/financeiro/TransactionList";
import { Plus } from "lucide-react";

export default function Financeiro() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle de recebimentos e faturamento</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <TransactionForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-6">
            <TransactionList />
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contas a Receber</h3>
              <p className="text-muted-foreground">Em construção</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contas a Pagar</h3>
              <p className="text-muted-foreground">Em construção</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
