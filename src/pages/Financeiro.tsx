import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FinancialDashboard } from "@/components/financeiro/FinancialDashboard";
import { TransactionForm } from "@/components/financeiro/TransactionForm";
import { TransactionList } from "@/components/financeiro/TransactionList";
import { AccountsReceivable } from "@/components/financeiro/AccountsReceivable";
import { AccountsPayable } from "@/components/financeiro/AccountsPayable";
import { CashFlowProjection } from "@/components/financeiro/CashFlowProjection";
import { FinancialReports } from "@/components/financeiro/FinancialReports";
import { SuppliersManager } from "@/components/financeiro/SuppliersManager";
import { RecurringPaymentsManager } from "@/components/financeiro/RecurringPaymentsManager";
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
          <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="p-6">
            <TransactionList />
          </Card>
        </TabsContent>

        <TabsContent value="receivable" className="space-y-4">
          <AccountsReceivable />
        </TabsContent>

        <TabsContent value="payable" className="space-y-4">
          <AccountsPayable />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowProjection />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SuppliersManager />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          <RecurringPaymentsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
