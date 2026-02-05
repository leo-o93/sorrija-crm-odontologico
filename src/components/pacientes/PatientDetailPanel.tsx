import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone, 
  MessageCircle, 
  Calendar, 
  Edit, 
  Trash2,
  Mail,
  MapPin,
  AlertTriangle,
  FileText,
  Power,
  BarChart3,
  Receipt,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Patient, useDeletePatient, useTogglePatientActive } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuickScheduleDialog } from "@/components/inbox/QuickScheduleDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PatientForm } from "./PatientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentDialog } from "@/components/agenda/AppointmentDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HistoryDetailDialog } from "./HistoryDetailDialog";
import { useLeadStatuses } from "@/hooks/useLeadStatuses";
import { useDeleteAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { QuoteForm } from "@/components/orcamentos/QuoteForm";
import { QuoteDetailDialog } from "@/components/orcamentos/QuoteDetailDialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { 
  HistoryType,
  AppointmentHistoryItem, 
  AttendanceHistoryItem, 
  QuoteHistoryItem, 
  SaleHistoryItem,
  NonContractedQuoteItem 
} from "@/types/history";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface PatientDetailPanelProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PatientNote {
  id: string;
  note: string;
  created_at: string;
  author_id: string | null;
  profiles?: { full_name: string | null } | null;
}

const appointmentStatusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
  attended: { label: "Atendido", color: "bg-black text-white" },
  rescheduled: { label: "Atenção", color: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Cancelado", color: "bg-purple-100 text-purple-800" },
  no_show: { label: "Não Compareceu", color: "bg-red-100 text-red-800" },
};

export function PatientDetailPanel({ patient, open, onOpenChange }: PatientDetailPanelProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyDialogType, setHistoryDialogType] = useState<HistoryType>("appointments");
  const [historyDialogTitle, setHistoryDialogTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const deletePatient = useDeletePatient();
  const toggleActive = useTogglePatientActive();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const { data: leadStatuses } = useLeadStatuses();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setNewNote("");
    }
  }, [open]);

  // Real-time calculated metrics
  const { data: calculatedMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["patient-calculated-metrics", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return null;

      // Total appointments
      const { count: totalAppointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      // Total completed (attendances)
      const { count: totalAttendances } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id)
        .eq("status", "attended");

      // Total quotes
      const { count: totalQuotes } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patient.id);

      // Sum approved quotes as revenue
      const { data: approvedQuotes } = await supabase
        .from("quotes")
        .select("final_amount")
        .eq("patient_id", patient.id)
        .eq("status", "approved");

      const totalRevenue = approvedQuotes?.reduce(
        (sum, q) => sum + Number(q.final_amount || 0), 0
      ) || 0;

      return { 
        totalAppointments: totalAppointments || 0, 
        totalAttendances: totalAttendances || 0, 
        totalQuotes: totalQuotes || 0, 
        totalRevenue 
      };
    },
    enabled: !!patient?.id && open,
  });

  // Recent appointments
  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-recent-appointments", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];

      const { data } = await supabase
        .from("appointments")
        .select("*, procedures(name), professionals(name)")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!patient?.id && open,
  });

  const { data: allAppointments, isLoading: allAppointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, procedures(name), professionals(name)")
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patient?.id && open,
  });

  const { data: patientQuotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["patient-quotes", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const { data, error } = await supabase
        .from("quotes")
        .select("id, status, final_amount, created_at, quote_number")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patient?.id && open,
  });

  const { data: patientLead } = useQuery({
    queryKey: ["patient-lead", patient?.lead_id],
    queryFn: async () => {
      if (!patient?.lead_id) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("id, status")
        .eq("id", patient.lead_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patient?.lead_id && open,
  });

  if (!patient) return null;

  const handleCall = () => {
    window.open(`tel:${patient.phone}`, "_blank");
  };

  const handleWhatsApp = () => {
    const phone = patient.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${formattedPhone}`, "_blank");
  };

  const handleToggleActive = () => {
    const isArchived = Boolean(patient.archived_at);
    toggleActive.mutate({ id: patient.id, active: isArchived });
  };

  const handleOpenAgenda = (appointmentId: string, date: string) => {
    const appointmentDate = format(new Date(date), "yyyy-MM-dd");
    navigate(`/agenda?date=${appointmentDate}&appointment=${appointmentId}`);
  };

  const handleUpdateAppointment = (data: any) => {
    updateAppointment.mutate(data);
  };

  const handleDeleteAppointment = (id: string) => {
    deleteAppointment.mutate(id);
  };

  const handleDelete = () => {
    deletePatient.mutate(patient.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        onOpenChange(false);
      },
    });
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
  };

  const { data: patientNotes, isLoading: patientNotesLoading } = useQuery({
    queryKey: ["patient-notes", patient.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from("patient_notes" as any)
        .select("id, note, created_at, author_id, profiles(full_name)")
        .eq("organization_id", currentOrganization.id)
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[] ?? []) as PatientNote[];
    },
    enabled: open && !!patient?.id,
  });

  const createNote = useMutation({
    mutationFn: async (note: string) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error("Usuário não identificado");
      }
      const { error } = await supabase
        .from("patient_notes" as any)
        .insert({
          organization_id: currentOrganization.id,
          patient_id: patient.id,
          author_id: user.id,
          note,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patient.id] });
      setNewNote("");
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("patient_notes" as any)
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-notes", patient.id] });
    },
  });

  // PRIORITIZE stored values (from import) over calculated
  // Use whichever is higher to ensure we show the best data available
  const displayMetrics = {
    totalAppointments: Math.max(patient.total_appointments ?? 0, calculatedMetrics?.totalAppointments ?? 0),
    totalAttendances: Math.max(patient.total_attendances ?? 0, calculatedMetrics?.totalAttendances ?? 0),
    totalQuotes: Math.max(patient.total_quotes ?? 0, calculatedMetrics?.totalQuotes ?? 0),
    totalRevenue: Math.max(patient.total_revenue ?? 0, calculatedMetrics?.totalRevenue ?? 0),
  };

  // Check if we have stored historical data (from import) but no linked records
  const hasStoredHistoryOnly = (patient.total_appointments ?? 0) > 0 && 
    (!recentAppointments || recentAppointments.length === 0);

  // Helper to safely get history arrays
  const getHistoryArray = <T,>(data: T[] | unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    return [];
  };

  const appointmentsHistory = getHistoryArray<AppointmentHistoryItem>(patient.appointments_history);
  const attendancesHistory = getHistoryArray<AttendanceHistoryItem>(patient.attendances_history);
  const quotesHistory = getHistoryArray<QuoteHistoryItem>(patient.quotes_history);
  const salesHistory = getHistoryArray<SaleHistoryItem>(patient.sales_history);
  const nonContractedQuotesHistory = getHistoryArray<NonContractedQuoteItem>(patient.non_contracted_quotes_history);

  const hasAnyHistory = appointmentsHistory.length > 0 || attendancesHistory.length > 0 || 
    quotesHistory.length > 0 || salesHistory.length > 0 || nonContractedQuotesHistory.length > 0;

  const openHistoryDialog = (type: HistoryType, title: string) => {
    setHistoryDialogType(type);
    setHistoryDialogTitle(title);
    setHistoryDialogOpen(true);
  };

  const getHistoryData = (type: HistoryType) => {
    switch (type) {
      case "appointments": return appointmentsHistory;
      case "attendances": return attendancesHistory;
      case "quotes": return quotesHistory;
      case "sales": return salesHistory;
      case "non_contracted_quotes": return nonContractedQuotesHistory;
    }
  };

  const leadStatusMeta = patientLead?.status
    ? leadStatuses?.find((status) => status.name === patientLead.status)
    : null;
  const leadStatusLabel = leadStatusMeta?.title || patientLead?.status;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{patient.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={patient.archived_at ? "secondary" : "default"}>
                    {patient.archived_at ? "Arquivado" : "Ativo"}
                  </Badge>
                  {leadStatusLabel && (
                    <Badge className={leadStatusMeta?.color ? `${leadStatusMeta.color} text-white` : undefined}>
                      Funil: {leadStatusLabel}
                    </Badge>
                  )}
                  {patient.cpf && (
                    <span className="text-sm text-muted-foreground">
                      CPF: {patient.cpf}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button variant="outline" className="w-full" onClick={handleCall}>
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
            <Button variant="outline" className="w-full" onClick={handleWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <Button 
            className="w-full mb-4" 
            onClick={() => setScheduleOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Consulta
          </Button>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mb-4"
            onClick={handleToggleActive}
          >
            <Power className="h-4 w-4 mr-2" />
            {patient.archived_at ? "Desarquivar Paciente" : "Arquivar Paciente"}
          </Button>

          <Separator className="my-4" />

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumo</TabsTrigger>
              <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
              <TabsTrigger value="quotes">Orçamentos</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Patient Metrics - Clickable cards */}
              <div className="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Métricas do Paciente
                  {metricsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                </h4>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <button
                    onClick={() => openHistoryDialog("appointments", "Agendamentos")}
                    className="text-center p-2 bg-background rounded border transition-colors hover:bg-muted cursor-pointer"
                  >
                    <p className="text-xl font-bold text-blue-600">{displayMetrics.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Agendamentos
                      {appointmentsHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                    </p>
                  </button>
                  <button
                    onClick={() => openHistoryDialog("attendances", "Atendimentos")}
                    className="text-center p-2 bg-background rounded border transition-colors hover:bg-muted cursor-pointer"
                  >
                    <p className="text-xl font-bold text-green-600">{displayMetrics.totalAttendances}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Atendimentos
                      {attendancesHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                    </p>
                  </button>
                  <button
                    onClick={() => openHistoryDialog("quotes", "Orçamentos")}
                    className="text-center p-2 bg-background rounded border transition-colors hover:bg-muted cursor-pointer"
                  >
                    <p className="text-xl font-bold text-purple-600">{displayMetrics.totalQuotes}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      Orçamentos
                      {quotesHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                    </p>
                  </button>
                </div>
                
                <button
                  onClick={() => openHistoryDialog("sales", "Vendas / Receita")}
                  className="w-full text-center p-3 bg-background rounded border transition-colors hover:bg-muted cursor-pointer"
                >
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(displayMetrics.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    Pagamentos
                    {salesHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                  </p>
                </button>
              </div>

              {/* Non-Contracted Quotes Section */}
              {((patient.total_non_contracted_quote_items ?? 0) > 0 || nonContractedQuotesHistory.length > 0) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
                    <h4 className="font-medium text-sm flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      Orçamentos Não Contratados
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-background rounded border">
                        <p className="text-xl font-bold text-orange-600">
                          {patient.total_non_contracted_quote_items ?? nonContractedQuotesHistory.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Itens</p>
                      </div>
                      <button
                        onClick={() => nonContractedQuotesHistory.length > 0 && openHistoryDialog("non_contracted_quotes", "Orçamentos Não Contratados")}
                        className={`text-center p-2 bg-background rounded border transition-colors ${
                          nonContractedQuotesHistory.length > 0 ? "hover:bg-muted cursor-pointer" : "cursor-default"
                        }`}
                        disabled={nonContractedQuotesHistory.length === 0}
                      >
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(patient.total_non_contracted_quote_value ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          Valor Total
                          {nonContractedQuotesHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                        </p>
                      </button>
                    </div>
                    
                    {patient.top_non_contracted_procedures && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Top Procedimentos: </span>
                        <span className="font-medium">{patient.top_non_contracted_procedures}</span>
                      </div>
                    )}
                    {patient.top_non_contracted_specialties && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Top Especialidades: </span>
                        <span className="font-medium">{patient.top_non_contracted_specialties}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Last Sale Info */}
              {patient.last_sale_date && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Última Venda
                    </h4>
                    <div className="text-sm space-y-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">{format(new Date(patient.last_sale_date), "dd/MM/yyyy")}</span>
                      </p>
                      {patient.last_sale_amount && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-green-600">{formatCurrency(patient.last_sale_amount)}</span>
                        </p>
                      )}
                      {patient.last_sale_payment_method && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Pagamento:</span>
                          <span className="font-medium">{patient.last_sale_payment_method}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Contracted Values */}
              {((patient.contracted_value && patient.contracted_value > 0) || (patient.non_contracted_value && patient.non_contracted_value > 0)) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Valores de Contrato
                    </h4>
                    <div className="flex gap-3">
                      {patient.contracted_value && patient.contracted_value > 0 && (
                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Contratado</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(patient.contracted_value)}
                          </p>
                        </div>
                      )}
                      {patient.non_contracted_value && patient.non_contracted_value > 0 && (
                        <div className="flex-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Não Contratado</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(patient.non_contracted_value)}
                          </p>
                        </div>
                      )}
                    </div>
                    {patient.contract_date && (
                      <p className="text-xs text-muted-foreground text-center">
                        Data de contratação: {format(new Date(patient.contract_date), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Contact Information */}
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Informações de Contato</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{patient.email}</span>
                    </div>
                  )}
                  {patient.birth_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Nascimento: {format(new Date(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {(patient.address || patient.city || patient.state || patient.zip_code) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm space-y-1">
                        {patient.address && <p>{patient.address}</p>}
                        {(patient.city || patient.state) && (
                          <p>{[patient.city, patient.state].filter(Boolean).join(" / ")}</p>
                        )}
                        {patient.zip_code && <p>CEP: {patient.zip_code}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {patient.patient_origin && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Origem do Paciente</h4>
                    <p className="text-sm">{patient.patient_origin}</p>
                  </div>
                </>
              )}


              {/* Metadata */}
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Criado em: {format(new Date(patient.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                <p>Atualizado em: {format(new Date(patient.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendamentos do paciente
                </h4>
                <Button size="sm" onClick={() => setScheduleOpen(true)}>
                  Novo agendamento
                </Button>
              </div>

              {allAppointmentsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
              ) : allAppointments && allAppointments.length > 0 ? (
                <div className="space-y-2">
                  {allAppointments.map((appointment) => {
                    const statusInfo = appointmentStatusLabels[appointment.status] || { 
                      label: appointment.status, 
                      color: "bg-gray-100 text-gray-800" 
                    };
                    const StatusIcon = appointment.status === "attended" ? CheckCircle :
                      appointment.status === "cancelled" || appointment.status === "no_show" ? XCircle :
                      Clock;

                    return (
                      <div 
                        key={appointment.id} 
                        className="flex flex-col gap-3 p-3 bg-muted/50 rounded-lg md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-4 w-4 ${
                            appointment.status === "attended" ? "text-green-600" :
                            appointment.status === "cancelled" || appointment.status === "no_show" ? "text-red-600" :
                            "text-blue-600"
                          }`} />
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(appointment as any).procedures?.name || "Consulta"}
                              {(appointment as any).professionals?.name ? ` • ${(appointment as any).professionals.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 justify-end">
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAgenda(appointment.id, appointment.appointment_date)}
                          >
                            Abrir na agenda
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateAppointment({ id: appointment.id, status: "confirmed" })}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateAppointment({ id: appointment.id, status: "cancelled" })}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum agendamento encontrado
                </p>
              )}

              {appointmentsLoading && (
                <p className="text-xs text-muted-foreground">Atualizando histórico recente...</p>
              )}
            </TabsContent>

            <TabsContent value="quotes" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Orçamentos do paciente
                </h4>
                <Button size="sm" onClick={() => setCreateQuoteOpen(true)}>
                  Criar orçamento
                </Button>
              </div>

              {quotesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando orçamentos...</p>
              ) : patientQuotes && patientQuotes.length > 0 ? (
                <div className="space-y-2">
                  {patientQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Orçamento #{quote.quote_number || quote.id.slice(0, 6)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {quote.status}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatCurrency(Number(quote.final_amount || 0))}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setSelectedQuote(quote)}>
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum orçamento encontrado
                </p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </h4>
              <div className="space-y-2">
                <Textarea
                  rows={4}
                  placeholder="Adicionar nova observação..."
                  value={newNote}
                  onChange={(event) => setNewNote(event.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => createNote.mutate(newNote.trim())}
                    disabled={!newNote.trim() || createNote.isPending}
                  >
                    {createNote.isPending ? "Salvando..." : "Adicionar nota"}
                  </Button>
                </div>
              </div>

              {patientNotesLoading ? (
                <p className="text-sm text-muted-foreground">Carregando notas...</p>
              ) : patientNotes && patientNotes.length > 0 ? (
                <div className="space-y-3">
                  {patientNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {note.profiles?.full_name || "Usuário"} •{" "}
                          {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteNote.mutate(note.id)}
                          disabled={deleteNote.isPending}
                        >
                          Excluir
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma nota registrada.</p>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Schedule Dialog */}
      <QuickScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        patientId={patient.id}
        contactName={patient.name}
      />

      <AppointmentDialog
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdate={handleUpdateAppointment}
        onDelete={handleDeleteAppointment}
      />

      <Dialog open={createQuoteOpen} onOpenChange={setCreateQuoteOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Orçamento</DialogTitle>
          </DialogHeader>
          <QuoteForm
            initialContact={{
              id: patient.id,
              name: patient.name,
              phone: patient.phone,
              type: "patient",
              email: patient.email,
            }}
            onSuccess={() => setCreateQuoteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <QuoteDetailDialog
        quoteId={selectedQuote?.id || null}
        open={!!selectedQuote}
        onOpenChange={(open) => !open && setSelectedQuote(null)}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={patient}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        itemName={patient.name}
        title="Excluir Paciente"
      />

      {/* History Detail Dialog */}
      <HistoryDetailDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        title={historyDialogTitle}
        type={historyDialogType}
        data={getHistoryData(historyDialogType)}
      />
    </>
  );
}
