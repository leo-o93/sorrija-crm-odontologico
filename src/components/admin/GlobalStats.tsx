import { Card } from '@/components/ui/card';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export function GlobalStats() {
  const { globalStats } = useSuperAdmin();

  const stats = [
    { label: 'Organizações', value: globalStats.organizations },
    { label: 'Usuários', value: globalStats.users },
    { label: 'Leads', value: globalStats.leads },
    { label: 'Mensagens', value: globalStats.messages },
    { label: 'Ativas', value: globalStats.activeOrganizations },
    { label: 'Inativas', value: globalStats.inactiveOrganizations },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="text-sm text-muted-foreground">{stat.label}</p>
          <p className="text-2xl font-semibold">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
