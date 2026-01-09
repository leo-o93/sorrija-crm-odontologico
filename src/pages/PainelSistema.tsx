import { useMemo } from "react";
import { format } from "date-fns";
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";
import { SystemStatusCards } from "@/components/painel-sistema/SystemStatusCards";
import { WhatsAppStatusCard } from "@/components/painel-sistema/WhatsAppStatusCard";
import { RealtimeLogs } from "@/components/painel-sistema/RealtimeLogs";
import { SystemAlerts } from "@/components/painel-sistema/SystemAlerts";
import { OperationalMetrics } from "@/components/painel-sistema/OperationalMetrics";
import { IntegrationHealth } from "@/components/painel-sistema/IntegrationHealth";
import { useEvolutionAPI } from "@/hooks/useEvolutionAPI";

export default function PainelSistema() {
  const { data } = useSystemMonitoring();
  const { testConnection } = useEvolutionAPI();

  const stats = data || {
    whatsappStatus: "not_configured",
    whatsappInstance: null,
    leadsCount: { total: 0, hot: 0, warm: 0, cold: 0, new: 0 },
    conversationsCount: { total: 0, open: 0, closed: 0 },
    messagesToday: 0,
    webhooksLast24h: 0,
    lastAutoTransition: null,
    recentWebhooks: [],
    systemAlerts: [],
  };

  const lastUpdate = format(new Date(), "HH:mm:ss");

  const logs = useMemo(() => {
    return (stats.recentWebhooks || []).map((webhook: any) => ({
      id: webhook.id,
      level: webhook.status === "failed" ? "error" : webhook.status === "processed" ? "info" : "warning",
      message: webhook.path || webhook.origin || "Webhook recebido",
      source: webhook.origin || "Webhook",
      timestamp: format(new Date(webhook.created_at), "HH:mm:ss"),
    }));
  }, [stats.recentWebhooks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Sistema</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real</p>
        </div>
        <div className="text-sm text-muted-foreground">Última atualização: {lastUpdate}</div>
      </div>

      <SystemStatusCards stats={stats} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <RealtimeLogs logs={logs} />
        <div className="space-y-4">
          <WhatsAppStatusCard
            stats={stats}
            onReconnect={() => testConnection.mutate()}
            onShowQr={() => testConnection.mutate()}
          />
          <SystemAlerts alerts={stats.systemAlerts} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OperationalMetrics stats={stats} />
        <IntegrationHealth stats={stats} />
      </div>
    </div>
  );
}
