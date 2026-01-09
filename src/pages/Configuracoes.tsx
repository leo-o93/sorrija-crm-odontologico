import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppConfig } from "@/components/settings/WhatsAppConfig";
import { UsersManager } from "@/components/settings/UsersManager";
import { GeneralSettings } from "@/components/settings/GeneralSettings";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações da organização e integrações</p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettings />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <WhatsAppConfig />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UsersManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
