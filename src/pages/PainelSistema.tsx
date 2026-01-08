import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarClock,
  Cpu,
  Database,
  FileText,
  ListChecks,
  MessageSquare,
  ServerCog,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const featureCards = [
  {
    title: "CRM & Leads",
    description: "Gestão completa do funil de vendas e qualificação de leads.",
    icon: Activity,
  },
  {
    title: "Atendimento WhatsApp",
    description: "Conversas em tempo real, distribuição automática e histórico.",
    icon: MessageSquare,
  },
  {
    title: "Agenda & Consultas",
    description: "Agendamentos inteligentes e confirmação automática.",
    icon: CalendarClock,
  },
  {
    title: "Pacientes",
    description: "Cadastro, evolução clínica e prontuário digital unificado.",
    icon: Users,
  },
  {
    title: "Financeiro",
    description: "Controle de recebíveis, repasses e previsões de caixa.",
    icon: Database,
  },
  {
    title: "Relatórios Inteligentes",
    description: "KPIs, gráficos e comparativos para decisões rápidas.",
    icon: FileText,
  },
];

const statusCards = [
  {
    title: "Disponibilidade do Sistema",
    value: "99,97%",
    description: "Últimas 24 horas",
    progress: 99.97,
    icon: ShieldCheck,
  },
  {
    title: "Filas de Atendimento",
    value: "18 atendimentos",
    description: "Em processamento",
    progress: 72,
    icon: ListChecks,
  },
  {
    title: "Integrações Ativas",
    value: "12/12",
    description: "APIs estáveis",
    progress: 100,
    icon: ServerCog,
  },
];

const reportHighlights = [
  {
    title: "Alertas críticos",
    value: 2,
    description: "Requerem ação imediata",
    badge: "destructive" as const,
  },
  {
    title: "Ações automatizadas",
    value: 46,
    description: "Fluxos executados hoje",
    badge: "secondary" as const,
  },
  {
    title: "Notificações enviadas",
    value: 128,
    description: "SMS e WhatsApp",
    badge: "default" as const,
  },
];

const logTemplates = [
  {
    level: "INFO",
    message: "Monitoramento identificou aumento no tráfego de leads.",
    source: "CRM",
    variant: "secondary" as const,
  },
  {
    level: "OK",
    message: "Backup incremental concluído com sucesso.",
    source: "Infra",
    variant: "default" as const,
  },
  {
    level: "ALERTA",
    message: "Fila de WhatsApp acima do normal, redistribuindo atendentes.",
    source: "Atendimento",
    variant: "destructive" as const,
  },
  {
    level: "INFO",
    message: "Relatório diário de performance gerado automaticamente.",
    source: "BI",
    variant: "secondary" as const,
  },
];

const formatTime = (date: Date) =>
  date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export default function PainelSistema() {
  const [logs, setLogs] = useState(() =>
    logTemplates.slice(0, 3).map((template, index) => ({
      ...template,
      timestamp: formatTime(new Date(Date.now() - index * 1000 * 14)),
    })),
  );

  const lastUpdate = useMemo(() => formatTime(new Date()), [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTemplate = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      setLogs((prev) => {
        const nextLogs = [
          {
            ...nextTemplate,
            timestamp: formatTime(new Date()),
          },
          ...prev,
        ];
        return nextLogs.slice(0, 6);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Sistema</h1>
          <p className="text-muted-foreground">
            Visão central das funcionalidades, logs em tempo real e relatórios operacionais.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Cpu className="h-4 w-4 text-primary" />
          Atualização contínua • {lastUpdate}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {statusCards.map((status) => (
          <Card key={status.title}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {status.title}
              </CardTitle>
              <status.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-foreground">{status.value}</p>
                <p className="text-xs text-muted-foreground">{status.description}</p>
              </div>
              <Progress value={status.progress} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Funcionalidades principais</h2>
        <p className="text-sm text-muted-foreground">
          Explore rapidamente todos os módulos disponíveis e seus objetivos.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.title} className="h-full">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <feature.icon className="h-5 w-5 text-primary" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Logs em tempo real</CardTitle>
            <p className="text-sm text-muted-foreground">
              Eventos monitorados automaticamente para auditoria e suporte.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="flex items-start gap-3">
                <Badge variant={log.variant} className="mt-1">
                  {log.level}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp} • {log.source}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório operacional</CardTitle>
              <p className="text-sm text-muted-foreground">
                Indicadores atualizados automaticamente.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportHighlights.map((highlight) => (
                <div key={highlight.title} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{highlight.title}</p>
                    <p className="text-xs text-muted-foreground">{highlight.description}</p>
                  </div>
                  <Badge variant={highlight.badge}>{highlight.value}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  SLA de resposta
                </div>
                <span className="font-semibold text-foreground">12 min</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Sessões simultâneas
                </div>
                <span className="font-semibold text-foreground">84</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Atendentes online
                </div>
                <span className="font-semibold text-foreground">21</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
