import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { GlobalStats } from '@/components/admin/GlobalStats';
import { OrganizationsTable } from '@/components/admin/OrganizationsTable';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';
import { GlobalUsersManager } from '@/components/admin/GlobalUsersManager';
import { AdminSettings } from '@/components/admin/AdminSettings';

export default function Admin() {
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  if (isLoading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  if (!isSuperAdmin) {
    return <div className="text-muted-foreground">Acesso negado.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerenciamento global do sistema</p>
      </div>

      <GlobalStats />

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationsTable />
        </TabsContent>

        <TabsContent value="users">
          <GlobalUsersManager />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
