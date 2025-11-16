import { useState } from "react";
import { UserPlus, Calendar, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/LeadForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const actions = [
  { icon: UserPlus, label: "Novo Lead", variant: "default" as const },
  { icon: Calendar, label: "Novo Agendamento", variant: "secondary" as const },
  { icon: FileText, label: "Novo Orçamento", variant: "outline" as const },
  { icon: MessageSquare, label: "Enviar Campanha", variant: "outline" as const },
];

export function QuickActions() {
  const navigate = useNavigate();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  const handleAction = (label: string) => {
    switch (label) {
      case "Novo Lead":
        setIsNewLeadOpen(true);
        break;
      case "Novo Agendamento":
        navigate("/agenda");
        toast.info("Módulo de agenda em desenvolvimento");
        break;
      case "Novo Orçamento":
        navigate("/orcamentos");
        toast.info("Módulo de orçamentos em desenvolvimento");
        break;
      case "Enviar Campanha":
        navigate("/marketing");
        toast.info("Módulo de marketing em desenvolvimento");
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            action.label === "Novo Lead" ? (
              <Dialog 
                key={action.label}
                open={isNewLeadOpen}
                onOpenChange={setIsNewLeadOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant={action.variant}
                    className="h-auto flex-col gap-2 py-4"
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Lead</DialogTitle>
                  </DialogHeader>
                  <LeadForm onSuccess={() => setIsNewLeadOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => handleAction(action.label)}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
