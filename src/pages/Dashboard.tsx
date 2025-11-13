import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Clock,
  CheckCircle
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeadStats } from "@/hooks/useLeadStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useLeadStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua clínica</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leads do Mês"
          value={stats?.totalLeads || 0}
          icon={Users}
          variant="gold"
        />
        <StatCard
          title="Agendamentos Hoje"
          value={stats?.scheduledToday || 0}
          icon={Calendar}
          variant="info"
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${(stats?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${(stats?.averageTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comparecimentos</p>
                <p className="text-2xl font-bold text-success">{stats?.attended || 0}</p>
              </div>
              <UserCheck className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faltas</p>
                <p className="text-2xl font-bold text-destructive">{stats?.noShow || 0}</p>
              </div>
              <UserX className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Tratamento</p>
                <p className="text-2xl font-bold">{stats?.inTreatment || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Actions Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-sm text-muted-foreground">
              Atividades recentes aparecerão aqui
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <AlertsList />
    </div>
  );
}
