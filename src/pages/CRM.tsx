import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MessageCircle, Plus, Search, Eye, GripVertical, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLeads, useUpdateLeadStatus, Lead } from "@/hooks/useLeads";
import { useLeadStatuses } from "@/hooks/useLeadStatuses";
import { useSources } from "@/hooks/useSources";
import { useProcedures } from "@/hooks/useProcedures";
import { usePatients, type Patient } from "@/hooks/usePatients";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetailPanel } from "@/components/crm/LeadDetailPanel";
import { LeadImport } from "@/components/crm/LeadImport";
import { TemperatureBadge } from "@/components/crm/TemperatureBadge";
import { HotSubstatusBadge } from "@/components/crm/HotSubstatusBadge";
import { TemperatureFilter } from "@/components/crm/TemperatureFilter";
import { LeadTimer } from "@/components/crm/LeadTimer";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSendMessage } from "@/hooks/useMessages";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const LEADS_PER_PAGE = 100;
const MODAL_LEADS_PER_PAGE = 20;

type OrganizationMember = {
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

type LeadCardKind = "total" | "unscheduled" | "scheduled" | "lost";

interface LeadCardModalProps {
  title: string;
  kind: LeadCardKind;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableLeadCardProps {
  lead: Lead;
  onViewDetails: () => void;
  onOpenConversation: () => void;
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails: () => void;
  onMakeCall: () => void;
}

function PatientCard({ patient, onViewDetails, onMakeCall }: PatientCardProps) {
  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm font-medium truncate">{patient.name}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">{patient.phone}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={onMakeCall} title="Ligar">
            <Phone className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 flex-1" onClick={onViewDetails} title="Ver detalhes">
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const patientFunnelColumns = [
  { id: "closed_all", name: "fechou_tudo", title: "Fechou tudo", color: "bg-emerald-500" },
  { id: "closed_partial", name: "fechou_parte", title: "Fechou parte", color: "bg-yellow-500" },
  { id: "not_closed", name: "nao_fechou", title: "Não fechou", color: "bg-red-500" },
  { id: "post_sale", name: "pos_venda", title: "Pós-venda", color: "bg-blue-500" },
];

const resolvePatientFunnelStatus = (patient: Patient) => {
  const contractedValue = Number(patient.contracted_value || 0);
  const nonContractedValue = Number(patient.non_contracted_value || 0);
  const totalSales = Number(patient.total_sales || 0);

  if (totalSales > 0) {
    return "pos_venda";
  }

  if (contractedValue > 0 && nonContractedValue > 0) {
    return "fechou_parte";
  }

  if (contractedValue > 0) {
    return "fechou_tudo";
  }

  return "nao_fechou";
};
function SortableLeadCard({
  lead,
  onViewDetails,
  onOpenConversation
}: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: lead.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
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
  return <Card ref={setNodeRef} style={style} className={cn("hover:shadow-md transition-all", isDragging ? "ring-2 ring-primary shadow-lg" : "", (lead.temperature === "quente" || lead.temperature === "faltou_cancelou") && "border-l-4 border-l-yellow-400", lead.temperature === "frio" && "border-l-4 border-l-slate-400", lead.temperature === "perdido" && "border-l-4 border-l-red-400", lead.temperature === "novo" && "border-l-4 border-l-blue-400")}>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start gap-2">
          <button ref={setActivatorNodeRef} className="cursor-grab hover:bg-muted p-1 rounded touch-none flex-shrink-0 mt-0.5" {...attributes} {...listeners}>
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
        <div className="flex flex-wrap gap-1 items-center">
          {lead.procedures && <Badge variant="secondary" className="text-xs py-0 px-2">
              {lead.procedures.name}
            </Badge>}
          {(lead.scheduled || (lead.temperature === "quente" && lead.hot_substatus) || (lead.temperature === "faltou_cancelou" && lead.hot_substatus)) && (
            <HotSubstatusBadge substatus={lead.hot_substatus} scheduled={lead.scheduled} size="sm" />
          )}
          <LeadTimer lastInteractionAt={lead.last_interaction_at} createdAt={lead.created_at} showIcon={true} />
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={makeCall} title="Ligar">
            <Phone className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleOpenConversation} title="Abrir conversa no WhatsApp">
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 flex-1" onClick={handleViewDetails} title="Ver detalhes">
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>;
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
function DroppableColumn({
  column,
  leads,
  onLeadClick,
  onOpenConversation
}: DroppableColumnProps) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id: column.name
  });
  const [showAll, setShowAll] = useState(false);
  const visibleLeads = showAll ? leads : leads.slice(0, 5);
  const hasMore = leads.length > 5;
  return <div ref={setNodeRef} className={`space-y-3 p-2 rounded-lg min-h-[200px] transition-colors ${isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/30'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${column.color}`} />
        <h2 className="font-semibold text-sm">{column.title}</h2>
        <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
      </div>
      <SortableContext items={visibleLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {visibleLeads.map(lead => <SortableLeadCard key={lead.id} lead={lead} onViewDetails={() => onLeadClick(lead)} onOpenConversation={() => onOpenConversation(lead)} />)}
          {hasMore && !showAll && <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => setShowAll(true)}>
              Ver mais {leads.length - 5} lead{leads.length - 5 !== 1 ? 's' : ''}
            </Button>}
          {showAll && hasMore && <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => setShowAll(false)}>
              Ver menos
            </Button>}
        </div>
      </SortableContext>
    </div>;
}

function LeadCardModal({ title, kind, isOpen, onOpenChange }: LeadCardModalProps) {
  const { currentOrganization } = useOrganization();
  const { data: statuses } = useLeadStatuses();
  const { data: sources } = useSources();
  const { data: procedures } = useProcedures();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [procedureFilter, setProcedureFilter] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [arrivalTo, setArrivalTo] = useState("");
  const [appointmentFrom, setAppointmentFrom] = useState("");
  const [appointmentTo, setAppointmentTo] = useState("");
  const [page, setPage] = useState(1);

  const { data: members } = useQuery({
    queryKey: ["organization-members", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      // First get org members
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", currentOrganization.id);
      if (memberError) throw memberError;
      
      if (!memberData?.length) return [];
      
      // Then get profiles for those users
      const userIds = memberData.map(m => m.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      if (profileError) throw profileError;
      
      // Map them together
      const profileMap = new Map((profileData || []).map(p => [p.id, p.full_name]));
      return memberData.map((member) => ({
        user_id: member.user_id,
        profiles: {
          full_name: profileMap.get(member.user_id) ?? null,
        },
      })) as OrganizationMember[];
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: modalLeads, isLoading } = useQuery({
    queryKey: [
      "lead-card-modal",
      currentOrganization?.id,
      kind,
      search,
      statusFilter,
      sourceFilter,
      procedureFilter,
      responsibleFilter,
      arrivalFrom,
      arrivalTo,
      appointmentFrom,
      appointmentTo,
      page,
    ],
    queryFn: async () => {
      if (!currentOrganization?.id) return { data: [], count: 0 };

      let query = supabase
        .from("leads")
        .select("id, name, phone, status, scheduled, appointment_date, created_at", { count: "exact" })
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (kind === "unscheduled") {
        query = query.eq("scheduled", false);
      }

      if (kind === "scheduled") {
        query = query.eq("scheduled", true);
      }

      if (kind === "lost") {
        query = query.ilike("status", "%perdido%");
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (sourceFilter) {
        query = query.eq("source_id", sourceFilter);
      }

      if (procedureFilter) {
        query = query.eq("interest_id", procedureFilter);
      }

      if (responsibleFilter) {
        query = query.eq("responsible_user_id", responsibleFilter);
      }

      if (arrivalFrom) {
        query = query.gte("created_at", arrivalFrom);
      }

      if (arrivalTo) {
        query = query.lte("created_at", `${arrivalTo}T23:59:59`);
      }

      if (kind === "scheduled") {
        if (appointmentFrom) {
          query = query.gte("appointment_date", appointmentFrom);
        }

        if (appointmentTo) {
          query = query.lte("appointment_date", `${appointmentTo}T23:59:59`);
        }
      }

      if (search.trim()) {
        const phoneQuery = search.replace(/\D/g, "");
        const searchFilter = phoneQuery.length > 0
          ? `name.ilike.%${search}%,phone.ilike.%${phoneQuery}%`
          : `name.ilike.%${search}%`;
        query = query.or(searchFilter);
      }

      const start = (page - 1) * MODAL_LEADS_PER_PAGE;
      const end = start + MODAL_LEADS_PER_PAGE - 1;
      const { data, count, error } = await query.range(start, end);
      if (error) throw error;
      return { data: data as Lead[], count: count || 0 };
    },
    enabled: isOpen && !!currentOrganization?.id,
  });

  const totalPages = modalLeads ? Math.ceil((modalLeads.count || 0) / MODAL_LEADS_PER_PAGE) : 1;
  const resolveStatusMeta = (status: string) => statuses?.find((item) => item.name === status);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <Input
              placeholder="Pesquisar por nome ou telefone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {statuses?.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    {status.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={procedureFilter} onValueChange={setProcedureFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Interesse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {procedures?.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {sources?.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profiles?.full_name || member.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={arrivalFrom}
              onChange={(event) => setArrivalFrom(event.target.value)}
              placeholder="Data de chegada (de)"
            />
            <Input
              type="date"
              value={arrivalTo}
              onChange={(event) => setArrivalTo(event.target.value)}
              placeholder="Data de chegada (até)"
            />
            {kind === "scheduled" && (
              <>
                <Input
                  type="date"
                  value={appointmentFrom}
                  onChange={(event) => setAppointmentFrom(event.target.value)}
                  placeholder="Data de agendamento (de)"
                />
                <Input
                  type="date"
                  value={appointmentTo}
                  onChange={(event) => setAppointmentTo(event.target.value)}
                  placeholder="Data de agendamento (até)"
                />
              </>
            )}
          </div>

          <div className="border rounded-md">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando leads...
              </div>
            ) : modalLeads?.data.length ? (
              <div className="divide-y">
                {modalLeads.data.map((lead) => {
                  const statusMeta = resolveStatusMeta(lead.status);
                  const statusLabel = statusMeta?.title || lead.status;
                  return (
                    <div key={lead.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.phone}</div>
                      </div>
                      <Badge className={statusMeta?.color ? `${statusMeta.color} text-white` : undefined}>
                        {statusLabel}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">Nenhum lead encontrado.</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default function CRM() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const sendMessage = useSendMessage();
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCard, setActiveCard] = useState<LeadCardKind | null>(null);
  const [activeFunnel, setActiveFunnel] = useState<"leads" | "patients">("leads");
  
  const {
    data: statuses,
    isLoading: isLoadingStatuses
  } = useLeadStatuses();

  // Paginated leads query
  const { data: paginatedLeads, isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads-paginated", currentOrganization?.id, page, debouncedSearch],
    queryFn: async () => {
      if (!currentOrganization?.id) return { data: [], totalCount: 0 };

      let query = supabase
        .from("leads")
        .select(
          `
          *,
          sources:source_id(id, name, channel),
          procedures:interest_id(id, name, category)
        `,
          { count: "exact" }
        )
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (debouncedSearch.trim()) {
        const phoneQuery = debouncedSearch.replace(/\D/g, '');
        const searchFilter = phoneQuery.length > 0
          ? `name.ilike.%${debouncedSearch}%,phone.ilike.%${phoneQuery}%`
          : `name.ilike.%${debouncedSearch}%`;
        query = query.or(searchFilter);
      }

      const start = (page - 1) * LEADS_PER_PAGE;
      const end = start + LEADS_PER_PAGE - 1;

      const { data, count, error } = await query.range(start, end);

      if (error) throw error;

      return {
        data: data as Lead[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / LEADS_PER_PAGE),
        currentPage: page,
        hasNextPage: page < Math.ceil((count || 0) / LEADS_PER_PAGE),
        hasPreviousPage: page > 1,
      };
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: patients, isLoading: isLoadingPatients } = usePatients({
    search: debouncedSearch,
    active: true,
  });
  
  const leads = paginatedLeads?.data;
  
  // Get accurate total count from database
  const { data: leadsCount } = useQuery({
    queryKey: ["leads-count", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return 0;
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: scheduledCount } = useQuery({
    queryKey: ["leads-scheduled-count", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return 0;
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .eq("scheduled", true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: unscheduledCount } = useQuery({
    queryKey: ["leads-unscheduled-count", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return 0;
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .eq("scheduled", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganization?.id,
  });

  const { data: lostCount } = useQuery({
    queryKey: ["leads-lost-count", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return 0;
      const { count, error } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", currentOrganization.id)
        .ilike("status", "%perdido%");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganization?.id,
  });
  
  const updateLeadStatus = useUpdateLeadStatus();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const [isInitialMessageOpen, setIsInitialMessageOpen] = useState(false);
  const [initialMessageLead, setInitialMessageLead] = useState<Lead | null>(null);
  const [initialMessageText, setInitialMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [temperatureFilter, setTemperatureFilter] = useState<string | null>(null);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Debounce search and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialMessageOpen) {
      setInitialMessageText("");
      setInitialMessageLead(null);
    }
  }, [isInitialMessageOpen]);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));

  // Convert statuses to columns format
  const columns = useMemo(() => {
    if (!statuses) return [];
    return statuses.map(status => ({
      id: status.id,
      name: status.name,
      title: status.title,
      color: status.color
    }));
  }, [statuses]);
  const validStatusNames = useMemo(() => columns.map(c => c.name), [columns]);
  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    setActiveId(null);
    if (!over) return;
    const leadId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a valid column (status name)
    if (validStatusNames.includes(overId)) {
      const currentLead = leads?.find(l => l.id === leadId);
      if (currentLead?.status !== overId) {
        updateLeadStatus.mutate({
          id: leadId,
          status: overId
        });
      }
      return;
    }

    // If not a valid status, it's a drop on another lead
    // Find the column (status) of the lead it was dropped on
    const targetLead = leads?.find(l => l.id === overId);
    if (targetLead) {
      const newStatus = targetLead.status;
      const currentLead = leads?.find(l => l.id === leadId);

      // Only update if status is different
      if (currentLead?.status !== newStatus) {
        updateLeadStatus.mutate({
          id: leadId,
          status: newStatus
        });
      }
    }
  };
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailPanelOpen(true);
  };
  const handleOpenConversation = async (lead: Lead) => {
    if (!currentOrganization?.id) return;
    const cleanedPhone = lead.phone.replace(/\D/g, "");
    const phoneWithCountry = cleanedPhone.startsWith("55") ? cleanedPhone : `55${cleanedPhone}`;

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, phone")
      .eq("organization_id", currentOrganization.id)
      .or(`lead_id.eq.${lead.id},phone.eq.${phoneWithCountry}`)
      .limit(1)
      .maybeSingle();

    if (conversation?.id) {
      navigate(`/conversas?phone=${encodeURIComponent(conversation.phone || phoneWithCountry)}`);
      return;
    }

    setInitialMessageLead(lead);
    setIsInitialMessageOpen(true);
  };

  const handleSendInitialMessage = async () => {
    if (!initialMessageLead || !initialMessageText.trim()) return;

    await sendMessage.mutateAsync({
      phone: initialMessageLead.phone,
      leadId: initialMessageLead.id,
      type: "text",
      text: initialMessageText.trim(),
    });

    setIsInitialMessageOpen(false);
    navigate(`/conversas?phone=${encodeURIComponent(initialMessageLead.phone)}`);
  };

  // Filter leads by search and temperature
  const filteredLeads = useMemo(() => {
    let result = leads;
    if (temperatureFilter) {
      if (temperatureFilter === "em_conversa") {
        // Filtro especial: leads com substatus "em_conversa"
        result = result?.filter(lead => lead.hot_substatus === "em_conversa");
      } else if (temperatureFilter === "faltou_cancelou") {
        result = result?.filter((lead) => {
          const normalizedStatus = lead.status?.toLowerCase() || "";
          return normalizedStatus.includes("faltou") || normalizedStatus.includes("no_show") || normalizedStatus.includes("cancel");
        });
      } else if (temperatureFilter === "agendado") {
        result = result?.filter(lead => lead.scheduled);
      } else {
        result = result?.filter(lead => lead.temperature === temperatureFilter);
      }
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result?.filter(lead => {
        const matchName = lead.name.toLowerCase().includes(query);
        const matchPhone = lead.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
        return matchName || matchPhone;
      });
    }
    return result;
  }, [leads, searchQuery, temperatureFilter]);
  const activeLead = activeId ? leads?.find(lead => lead.id === activeId) : null;
  const isLoading = activeFunnel === "patients"
    ? isLoadingPatients
    : isLoadingLeads || isLoadingStatuses;
  const patientsByStatus = useMemo(() => {
    const buckets = new Map<string, Patient[]>();
    patientFunnelColumns.forEach((column) => buckets.set(column.name, []));
    (patients || []).forEach((patient) => {
      const status = resolvePatientFunnelStatus(patient);
      const bucket = buckets.get(status) ?? [];
      bucket.push(patient);
      buckets.set(status, bucket);
    });
    return buckets;
  }, [patients]);
  if (isLoading) {
    return <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>;
  }
  // Use accurate database counts for stats, fallback to filtered if filters are active
  const hasFilters = temperatureFilter || searchQuery.trim();
  const totalLeads = hasFilters ? (filteredLeads?.length || 0) : (leadsCount || 0);
  const scheduledLeads = hasFilters ? (filteredLeads?.filter(l => l.scheduled).length || 0) : (scheduledCount || 0);
  const unscheduledLeads = hasFilters
    ? (filteredLeads?.filter((lead) => !lead.scheduled).length || 0)
    : (unscheduledCount || 0);
  const lostLeads = hasFilters
    ? (filteredLeads?.filter((lead) => (lead.status || "").toLowerCase().includes("perdido")).length || 0)
    : (lostCount || 0);
  const scheduledRate = totalLeads > 0 ? (scheduledLeads / totalLeads) * 100 : 0;

  const totalPatients = patients?.length || 0;
  const closedAllPatients = patientsByStatus.get("fechou_tudo")?.length || 0;
  const closedPartialPatients = patientsByStatus.get("fechou_parte")?.length || 0;
  const notClosedPatients = patientsByStatus.get("nao_fechou")?.length || 0;
  const postSalePatients = patientsByStatus.get("pos_venda")?.length || 0;

  return <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">Gerencie seus leads e pacientes e acompanhe os funis</p>
          </div>
          {activeFunnel === "leads" && (
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
          )}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Buscar por nome ou telefone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        
        {activeFunnel === "leads" && (
          <TemperatureFilter value={temperatureFilter} onChange={setTemperatureFilter} />
        )}
      </div>

      <Tabs value={activeFunnel} onValueChange={(value) => setActiveFunnel(value as "leads" | "patients")}>
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card onClick={() => setActiveCard("total")} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeads}</div>
              </CardContent>
            </Card>
            <Card onClick={() => setActiveCard("unscheduled")} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Não Agendado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unscheduledLeads}</div>
              </CardContent>
            </Card>
            <Card onClick={() => setActiveCard("scheduled")} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Agendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledLeads}</div>
                <div className="text-xs text-muted-foreground">
                  {scheduledRate.toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>
            <Card onClick={() => setActiveCard("lost")} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Perdidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lostLeads}</div>
              </CardContent>
            </Card>
          </div>

          {activeCard && (
            <LeadCardModal
              title={
                activeCard === "total"
                  ? "Total de Leads"
                  : activeCard === "unscheduled"
                  ? "Leads Não Agendados"
                  : activeCard === "scheduled"
                  ? "Leads Agendados"
                  : "Leads Perdidos"
              }
              kind={activeCard}
              isOpen={!!activeCard}
              onOpenChange={(open) => {
                if (!open) setActiveCard(null);
              }}
            />
          )}

          {columns.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {columns.map(column => {
                  const columnLeads = filteredLeads?.filter(lead => lead.status === column.name) || [];
                  return <DroppableColumn key={column.id} column={column} leads={columnLeads} onLeadClick={handleLeadClick} onOpenConversation={handleOpenConversation} />;
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

          {/* Pagination */}
          {paginatedLeads && paginatedLeads.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * LEADS_PER_PAGE) + 1} a {Math.min(page * LEADS_PER_PAGE, paginatedLeads.totalCount)} de {paginatedLeads.totalCount} leads
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={!paginatedLeads.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  </PaginationItem>

                  <PaginationItem>
                    <span className="px-4 text-sm">
                      Página {page} de {paginatedLeads.totalPages}
                    </span>
                  </PaginationItem>

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={!paginatedLeads.hasNextPage}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fechou Tudo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{closedAllPatients}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fechou Parte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{closedPartialPatients}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pós-venda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{postSalePatients}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {patientFunnelColumns.map((column) => {
              const columnPatients = patientsByStatus.get(column.name) ?? [];
              return (
                <div key={column.id} className="space-y-3 p-2 rounded-lg min-h-[200px] bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <h2 className="font-semibold text-sm">{column.title}</h2>
                    <Badge variant="secondary" className="text-xs">{columnPatients.length}</Badge>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {columnPatients.map((patient) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        onMakeCall={() => {
                          window.location.href = `tel:${patient.phone}`;
                        }}
                        onViewDetails={() => navigate(`/pacientes?id=${patient.id}`)}
                      />
                    ))}
                    {columnPatients.length === 0 && (
                      <div className="text-xs text-muted-foreground">Sem pacientes</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {notClosedPatients > 0 && (
            <div className="text-sm text-muted-foreground">
              Não fechou: {notClosedPatients} paciente{notClosedPatients !== 1 ? "s" : ""}.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LeadDetailPanel lead={selectedLead} open={isDetailPanelOpen} onOpenChange={setIsDetailPanelOpen} />

      <Dialog open={isInitialMessageOpen} onOpenChange={setIsInitialMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar primeira mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Nenhuma conversa encontrada para {initialMessageLead?.name}. Envie a primeira mensagem para iniciar a conversa.
            </p>
            <Textarea
              value={initialMessageText}
              onChange={(e) => setInitialMessageText(e.target.value)}
              placeholder="Digite a primeira mensagem..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInitialMessageOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendInitialMessage}
              disabled={!initialMessageText.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar mensagem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
