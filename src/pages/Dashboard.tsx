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

export default function Dashboard() {
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
          value={142}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          variant="gold"
        />
        <StatCard
          title="Agendamentos Hoje"
          value={18}
          icon={Calendar}
          trend={{ value: 8, isPositive: true }}
          variant="info"
        />
        <StatCard
          title="Receita do Mês"
          value="R$ 42.580"
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Ticket Médio"
          value="R$ 1.240"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: false }}
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
                <p className="text-2xl font-bold text-success">15</p>
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
                <p className="text-2xl font-bold text-destructive">3</p>
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
                <p className="text-2xl font-bold">34</p>
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
                <p className="text-2xl font-bold">89</p>
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
            <div className="space-y-4">
              {[
                { patient: "João Silva", action: "Agendou implante", time: "10 min atrás", status: "success" },
                { patient: "Maria Santos", action: "Orçamento enviado", time: "25 min atrás", status: "info" },
                { patient: "Pedro Costa", action: "Confirmou consulta", time: "1h atrás", status: "success" },
                { patient: "Ana Paula", action: "Faltou à consulta", time: "2h atrás", status: "error" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 pb-4 last:pb-0 border-b last:border-0">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.status === "success" ? "bg-success" :
                    activity.status === "error" ? "bg-destructive" :
                    "bg-info"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.patient}</p>
                    <p className="text-xs text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <AlertsList />
    </div>
  );
}
