import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesManager } from "@/components/cadastros/SourcesManager";
import { ProceduresManager } from "@/components/cadastros/ProceduresManager";
import { LeadStatusesManager } from "@/components/cadastros/LeadStatusesManager";

export default function Cadastros() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground">Gerencie fontes, procedimentos e configurações do sistema</p>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="lead-statuses">Status de Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <SourcesManager />
        </TabsContent>

        <TabsContent value="procedures" className="space-y-4">
          <ProceduresManager />
        </TabsContent>

        <TabsContent value="lead-statuses" className="space-y-4">
          <LeadStatusesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
