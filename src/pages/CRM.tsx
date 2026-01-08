import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Phone, MessageCircle, Plus, Search, Eye, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeads, useUpdateLeadStatus, Lead } from "@/hooks/useLeads";
import { useLeadStatuses } from "@/hooks/useLeadStatuses";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { LeadImport } from "@/components/crm/LeadImport";
import { TemperatureBadge, getTemperatureColor } from "@/components/crm/TemperatureBadge";
import { HotSubstatusBadge } from "@/components/crm/HotSubstatusBadge";
import { TemperatureFilter } from "@/components/crm/TemperatureFilter";
import { cn } from "@/lib/utils";
import { useAutoLeadTransitions } from "@/hooks/useAutoLeadTransitions";

interface SortableLeadCardProps {
  lead: Lead;
  onViewDetails: () => void;
  onOpenConversation: () => void;
}

function SortableLeadCard({ lead, onViewDetails, onOpenConversation }: SortableLeadCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
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
      className={cn(
        "hover:shadow-md transition-all",
        isDragging ? "ring-2 ring-primary shadow-lg" : "",
        lead.temperature === "quente" && "border-l-4 border-l-orange-400",
        lead.temperature === "frio" && "border-l-4 border-l-slate-400",
        lead.temperature === "perdido" && "border-l-4 border-l-red-400",
        lead.temperature === "novo" && "border-l-4 border-l-blue-400"
      )}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start gap-2">
          <button
            ref={setActivatorNodeRef}
            className="cursor-grab hover:bg-muted p-1 rounded touch-none flex-shrink-0 mt-0.5"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-medium truncate">{lead.name}</CardTitle>
              <TemperatureBadge temperature={lead.temperature} size="sm" showLabel={false} />
            </div>
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        <div className="flex flex-wrap gap-1">
          {lead.procedures && (
            <Badge variant="secondary" className="text-xs py-0 px-2">
              {lead.procedures.name}
            </Badge>
          )}
          {lead.temperature === "quente" && lead.hot_substatus && (
            <HotSubstatusBadge substatus={lead.hot_substatus} size="sm" />
          )}
        </div>
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
    id: string;
    name: string;
    title: string;
    color: string;
  };
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onOpenConversation: (lead: Lead) => void;
}

function DroppableColumn({ column, leads, onLeadClick, onOpenConversation }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.name,
  });

  const [showAll, setShowAll] = useState(false);
  const visibleLeads = showAll ? leads : leads.slice(0, 5);
  const hasMore = leads.length > 5;

  return (
    <div 
      ref={setNodeRef} 
      className={`space-y-3 p-2 rounded-lg min-h-[200px] transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/30'
      }`}
    >
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
  const { data: leads, isLoading: isLoadingLeads } = useLeads();
  const { data: statuses, isLoading: isLoadingStatuses } = useLeadStatuses();
  const updateLeadStatus = useUpdateLeadStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [temperatureFilter, setTemperatureFilter] = useState<string | null>(null);
  const { runTransitions } = useAutoLeadTransitions();

  // Run transitions when CRM page mounts
  useEffect(() => {
    runTransitions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Convert statuses to columns format
  const columns = useMemo(() => {
    if (!statuses) return [];
    return statuses.map((status) => ({
      id: status.id,
      name: status.name,
      title: status.title,
      color: status.color,
    }));
  }, [statuses]);

  const validStatusNames = useMemo(() => columns.map((c) => c.name), [columns]);

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a valid column (status name)
    if (validStatusNames.includes(overId)) {
      const currentLead = leads?.find((l) => l.id === leadId);
      if (currentLead?.status !== overId) {
        updateLeadStatus.mutate({ id: leadId, status: overId });
      }
      return;
    }

    // If not a valid status, it's a drop on another lead
    // Find the column (status) of the lead it was dropped on
    const targetLead = leads?.find((l) => l.id === overId);
    if (targetLead) {
      const newStatus = targetLead.status;
      const currentLead = leads?.find((l) => l.id === leadId);
      
      // Only update if status is different
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

  // Filter leads by search and temperature
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    if (temperatureFilter) {
      if (temperatureFilter === "em_conversa") {
        // Filtro especial: leads quentes com substatus "em_conversa"
        result = result?.filter(
          (lead) => lead.temperature === "quente" && lead.hot_substatus === "em_conversa"
        );
      } else {
        result = result?.filter((lead) => lead.temperature === temperatureFilter);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result?.filter((lead) => {
        const matchName = lead.name.toLowerCase().includes(query);
        const matchPhone = lead.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        return matchName || matchPhone;
      });
    }
    
    return result;
  }, [leads, searchQuery, temperatureFilter]);

  const activeLead = activeId ? leads?.find((lead) => lead.id === activeId) : null;

  const isLoading = isLoadingLeads || isLoadingStatuses;

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

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <TemperatureFilter value={temperatureFilter} onChange={setTemperatureFilter} />
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

      {columns.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {columns.map((column) => {
              const columnLeads = filteredLeads?.filter((lead) => lead.status === column.name) || [];
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
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Nenhum status configurado.</p>
            <p className="text-sm mt-2">
              Vá em <strong>Cadastros → Status de Leads</strong> para configurar as colunas do Kanban.
            </p>
          </div>
        </Card>
      )}

      <LeadDetailPanel lead={selectedLead} open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen} />
    </div>
  );
}
