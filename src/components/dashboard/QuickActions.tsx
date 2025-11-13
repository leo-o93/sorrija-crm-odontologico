import { UserPlus, Calendar, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { icon: UserPlus, label: "Novo Lead", variant: "default" as const },
  { icon: Calendar, label: "Novo Agendamento", variant: "secondary" as const },
  { icon: FileText, label: "Novo Orçamento", variant: "outline" as const },
  { icon: MessageSquare, label: "Enviar Campanha", variant: "outline" as const },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-auto flex-col gap-2 py-4"
            >
              <action.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
