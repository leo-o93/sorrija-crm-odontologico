import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Plus } from "lucide-react";
import { useLeads, useUpdateLeadStatus, Lead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";

type LeadStatus =
  | "novo_lead"
  | "primeira_tentativa"
  | "segunda_tentativa"
  | "terceira_tentativa"
  | "agendado"
  | "compareceu"
  | "nao_compareceu"
  | "orcamento_enviado"
  | "fechado"
  | "perdido";

const columns: {
  id: LeadStatus;
  title: string;
  color: string;
}[] = [
  { id: "novo_lead", title: "Novo Lead", color: "bg-blue-500" },
  { id: "primeira_tentativa", title: "1ª Tentativa", color: "bg-yellow-500" },
  { id: "segunda_tentativa", title: "2ª Tentativa", color: "bg-orange-500" },
  { id: "terceira_tentativa", title: "3ª Tentativa", color: "bg-red-500" },
  { id: "agendado", title: "Agendado", color: "bg-purple-500" },
  { id: "compareceu", title: "Compareceu", color: "bg-green-500" },
  { id: "orcamento_enviado", title: "Orçamento Enviado", color: "bg-indigo-500" },
  { id: "fechado", title: "Fechado", color: "bg-emerald-500" },
];

interface SortableLeadCardProps {
  lead: Lead;
  onClick: () => void;
}

function SortableLeadCard({ lead, onClick }: SortableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = lead.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${formattedPhone}`, "_blank");
  };

  const makeCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${lead.phone}`;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{lead.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{lead.phone}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {lead.procedures && (
          <Badge variant="secondary" className="text-xs">
            {lead.procedures.name}
          </Badge>
        )}
        {lead.sources && (
          <p className="text-xs text-muted-foreground">{lead.sources.name}</p>
        )}
        {lead.appointment_date && (
          <p className="text-xs text-muted-foreground">
            Consulta: {new Date(lead.appointment_date).toLocaleDateString("pt-BR")}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={makeCall}>
            <Phone className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={openWhatsApp}>
            <MessageCircle className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CRM() {
  const { data: leads, isLoading } = useLeads();
  const updateLeadStatus = useUpdateLeadStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    updateLeadStatus.mutate({ id: leadId, status: newStatus });
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailPanelOpen(true);
  };

  const activeLead = activeId ? leads?.find((lead) => lead.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const totalLeads = leads?.length || 0;
  const scheduledLeads = leads?.filter((l) => l.scheduled).length || 0;
  const closedLeads = leads?.filter((l) => l.status === "fechado").length || 0;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM - Funil de Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus leads e acompanhe o funil</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Lead</DialogTitle>
              </DialogHeader>
              <LeadForm onSuccess={() => setIsNewLeadDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnLeads = leads?.filter((lead) => lead.status === column.id) || [];

            return (
              <SortableContext key={column.id} items={columnLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h2 className="font-semibold">{column.title}</h2>
                    <Badge variant="secondary">{columnLeads.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]" id={column.id}>
                    {columnLeads.map((lead) => (
                      <SortableLeadCard key={lead.id} lead={lead} onClick={() => handleLeadClick(lead)} />
                    ))}
                  </div>
                </div>
              </SortableContext>
            );
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <Card className="cursor-grabbing opacity-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{activeLead.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{activeLead.phone}</p>
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailPanel lead={selectedLead} open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen} />
    </div>
  );
}
