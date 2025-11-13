import { AlertCircle, Calendar, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const alerts = [
  {
    id: 1,
    type: "warning",
    icon: Calendar,
    title: "3 pacientes faltaram hoje",
    description: "Agendar follow-up",
    time: "Hoje",
  },
  {
    id: 2,
    type: "info",
    icon: Users,
    title: "5 aniversariantes hoje",
    description: "Enviar mensagem",
    time: "Hoje",
  },
  {
    id: 3,
    type: "error",
    icon: Clock,
    title: "12 retornos pendentes",
    description: "Pacientes sem retorno há 6+ meses",
    time: "Esta semana",
  },
];

export function AlertsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Alertas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
            >
              <div className={`mt-0.5 p-2 rounded-lg ${
                alert.type === "error" ? "bg-destructive/10 text-destructive" :
                alert.type === "warning" ? "bg-warning/10 text-warning" :
                "bg-info/10 text-info"
              }`}>
                <alert.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {alert.time}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
