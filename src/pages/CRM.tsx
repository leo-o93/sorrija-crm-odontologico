import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Phone, MessageCircle, Plus, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads, useUpdateLeadStatus, Lead } from "@/hooks/useLeads";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { LeadImport } from "@/components/crm/LeadImport";

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
  { id: "nao_compareceu", title: "Não Compareceu", color: "bg-red-600" },
  { id: "orcamento_enviado", title: "Orçamento Enviado", color: "bg-indigo-500" },
  { id: "fechado", title: "Fechado", color: "bg-emerald-500" },
  { id: "perdido", title: "Perdido", color: "bg-gray-500" },
];

interface SortableLeadCardProps {
  lead: Lead;
  onViewDetails: () => void;
  onOpenConversation: () => void;
}

function SortableLeadCard({ lead, onViewDetails, onOpenConversation }: SortableLeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const makeCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${lead.phone}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails();
  };

  const handleOpenConversation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenConversation();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{lead.phone}</p>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        {lead.procedures && (
          <Badge variant="secondary" className="text-xs py-0 px-2">
            {lead.procedures.name}
          </Badge>
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={makeCall} title="Ligar">
            <Phone className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 px-2" 
            onClick={handleOpenConversation}
            title="Abrir conversa no WhatsApp"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 flex-1" 
            onClick={handleViewDetails}
            title="Ver detalhes"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface DroppableColumnProps {
  column: {
    id: LeadStatus;
    title: string;
    color: string;
  };
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onOpenConversation: (lead: Lead) => void;
}

function DroppableColumn({ column, leads, onLeadClick, onOpenConversation }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const [showAll, setShowAll] = useState(false);
  const visibleLeads = showAll ? leads : leads.slice(0, 5);
  const hasMore = leads.length > 5;

  return (
    <div ref={setNodeRef} className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${column.color}`} />
        <h2 className="font-semibold text-sm">{column.title}</h2>
        <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
      </div>
      <SortableContext items={visibleLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {visibleLeads.map((lead) => (
            <SortableLeadCard 
              key={lead.id} 
              lead={lead} 
              onViewDetails={() => onLeadClick(lead)}
              onOpenConversation={() => onOpenConversation(lead)}
            />
          ))}
          {hasMore && !showAll && (
            <Button 
              variant="ghost" 
              className="w-full h-8 text-xs" 
              onClick={() => setShowAll(true)}
            >
              Ver mais {leads.length - 5} lead{leads.length - 5 !== 1 ? 's' : ''}
            </Button>
          )}
          {showAll && hasMore && (
            <Button 
              variant="ghost" 
              className="w-full h-8 text-xs" 
              onClick={() => setShowAll(false)}
            >
              Ver menos
            </Button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function CRM() {
  const navigate = useNavigate();
  const { data: leads, isLoading } = useLeads();
  const updateLeadStatus = useUpdateLeadStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const validStatuses = columns.map(c => c.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Verifica se o drop foi sobre uma coluna válida
    if (validStatuses.includes(overId as LeadStatus)) {
      const currentLead = leads?.find(l => l.id === leadId);
      if (currentLead?.status !== overId) {
        updateLeadStatus.mutate({ id: leadId, status: overId as LeadStatus });
      }
      return;
    }

    // Se não for um status válido, é um drop sobre outro lead
    // Encontrar a coluna (status) do lead sobre o qual foi dropado
    const targetLead = leads?.find(l => l.id === overId);
    if (targetLead) {
      const newStatus = targetLead.status as LeadStatus;
      const currentLead = leads?.find(l => l.id === leadId);
      
      // Só atualiza se o status for diferente
      if (currentLead?.status !== newStatus) {
        updateLeadStatus.mutate({ id: leadId, status: newStatus });
      }
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailPanelOpen(true);
  };

  const handleOpenConversation = (lead: Lead) => {
    navigate('/conversas');
  };

  // Filtrar leads pela busca
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads?.filter((lead) => {
      const matchName = lead.name.toLowerCase().includes(query);
      const matchPhone = lead.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
      return matchName || matchPhone;
    });
  }, [leads, searchQuery]);

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

  const totalLeads = filteredLeads?.length || 0;
  const scheduledLeads = filteredLeads?.filter((l) => l.scheduled).length || 0;
  const closedLeads = filteredLeads?.filter((l) => l.status === "fechado").length || 0;
  const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CRM - Funil de Vendas</h1>
            <p className="text-muted-foreground">Gerencie seus leads e acompanhe o funil</p>
          </div>
          <div className="flex gap-2">
            <LeadImport />
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {columns.map((column) => {
            const columnLeads = filteredLeads?.filter((lead) => lead.status === column.id) || [];
            return (
              <DroppableColumn
                key={column.id}
                column={column}
                leads={columnLeads}
                onLeadClick={handleLeadClick}
                onOpenConversation={handleOpenConversation}
              />
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
