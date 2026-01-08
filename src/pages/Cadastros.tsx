import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourcesManager } from "@/components/cadastros/SourcesManager";
import { ProceduresManager } from "@/components/cadastros/ProceduresManager";
import { LeadStatusesManager } from "@/components/cadastros/LeadStatusesManager";
import { InterestTriggersManager } from "@/components/cadastros/InterestTriggersManager";
import { MessageTemplatesManager } from "@/components/cadastros/MessageTemplatesManager";
import { CRMSettingsManager } from "@/components/cadastros/CRMSettingsManager";
import { TemperatureRulesManager } from "@/components/cadastros/TemperatureRulesManager";

export default function Cadastros() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastros</h1>
        <p className="text-muted-foreground">Gerencie fontes, procedimentos, gatilhos e configurações do CRM</p>
      </div>

      <Tabs defaultValue="sources" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="lead-statuses">Status de Leads</TabsTrigger>
          <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
          <TabsTrigger value="temperature-rules">Regras de Transição</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="crm-settings">Config. CRM</TabsTrigger>
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

        <TabsContent value="triggers" className="space-y-4">
          <InterestTriggersManager />
        </TabsContent>

        <TabsContent value="temperature-rules" className="space-y-4">
          <TemperatureRulesManager />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <MessageTemplatesManager />
        </TabsContent>

        <TabsContent value="crm-settings" className="space-y-4">
          <CRMSettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
