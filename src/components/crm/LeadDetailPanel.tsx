import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lead, useDeleteLeadComplete } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Calendar, DollarSign, FileText, Edit, UserCheck, Trash2, ThermometerSun, Clock, TrendingUp, CreditCard, Receipt, CheckCircle, XCircle, Loader2, Stethoscope, ShoppingCart, FileBarChart, AlertTriangle, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { LeadForm } from "./LeadForm";
import { ConvertToPatientDialog } from "@/components/pacientes/ConvertToPatientDialog";
import { ConfirmDeleteLeadDialog } from "./ConfirmDeleteLeadDialog";
import { TemperatureBadge } from "./TemperatureBadge";
import { HotSubstatusBadge } from "./HotSubstatusBadge";
import { TemperatureActions } from "./TemperatureActions";
import { HistoryDetailDialog } from "@/components/pacientes/HistoryDetailDialog";
import { HistoryType, AppointmentHistoryItem, AttendanceHistoryItem, QuoteHistoryItem, SaleHistoryItem, NonContractedQuoteItem } from "@/types/history";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeadStatuses } from "@/hooks/useLeadStatuses";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface LeadDetailPanelProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  novo_lead: "Novo Lead",
  triagem: "Triagem",
  primeira_tentativa: "1ª Tentativa",
  tentativa_1: "1ª Tentativa",
  segunda_tentativa: "2ª Tentativa",
  tentativa_2: "2ª Tentativa",
  terceira_tentativa: "3ª Tentativa",
  tentativa_3: "3ª Tentativa",
  agendado: "Agendado",
  compareceu: "Compareceu",
  avaliacao: "Avaliação",
  nao_compareceu: "Não Compareceu",
  orcamento_enviado: "Orçamento Enviado",
  pos_consulta: "Pós-consulta",
  fechado: "Fechado",
  perdido: "Perdido",
};

const appointmentStatusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Agendado", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
  attended: { label: "Atendido", color: "bg-emerald-100 text-emerald-800" },
  rescheduled: { label: "Reagendado", color: "bg-purple-100 text-purple-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  no_show: { label: "Não Compareceu", color: "bg-orange-100 text-orange-800" },
};

export function LeadDetailPanel({ lead, open, onOpenChange }: LeadDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyDialogType, setHistoryDialogType] = useState<HistoryType>("appointments");
  const [historyDialogTitle, setHistoryDialogTitle] = useState("");
  const deleteLeadComplete = useDeleteLeadComplete();
  const { data: leadStatuses } = useLeadStatuses();

  // Helper to safely extract arrays from JSON
  const getHistoryArray = <T,>(data: unknown): T[] => {
    if (Array.isArray(data)) return data as T[];
    return [];
  };

  // Extract history arrays from lead
  const appointmentsHistory = getHistoryArray<AppointmentHistoryItem>(lead?.appointments_history);
  const attendancesHistory = getHistoryArray<AttendanceHistoryItem>(lead?.attendances_history);
  const quotesHistory = getHistoryArray<QuoteHistoryItem>(lead?.quotes_history);
  const salesHistory = getHistoryArray<SaleHistoryItem>(lead?.sales_history);
  const nonContractedQuotesHistory = getHistoryArray<NonContractedQuoteItem>(lead?.non_contracted_quotes_history);

  const openHistoryDialog = (type: HistoryType, title: string) => {
    setHistoryDialogType(type);
    setHistoryDialogTitle(title);
    setHistoryDialogOpen(true);
  };

  // Real-time calculated metrics
  const { data: calculatedMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["lead-calculated-metrics", lead?.id],
    queryFn: async () => {
      if (!lead?.id) return null;

      // Total appointments
      const { count: totalAppointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", lead.id);

      // Total quotes
      const { count: totalQuotes } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", lead.id);

      // Sum approved quotes as revenue
      const { data: approvedQuotes } = await supabase
        .from("quotes")
        .select("final_amount")
        .eq("lead_id", lead.id)
        .eq("status", "approved");

      const totalRevenue = approvedQuotes?.reduce(
        (sum, q) => sum + Number(q.final_amount || 0), 0
      ) || 0;

      // Count sales (approved quotes)
      const totalSales = approvedQuotes?.length || 0;

      return { 
        totalAppointments: totalAppointments || 0, 
        totalQuotes: totalQuotes || 0, 
        totalSales,
        totalRevenue 
      };
    },
    enabled: !!lead?.id && open,
  });

  // Recent appointments
  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["lead-recent-appointments", lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];

      const { data } = await supabase
        .from("appointments")
        .select("*, procedures(name)")
        .eq("lead_id", lead.id)
        .order("appointment_date", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!lead?.id && open,
  });

  if (!lead) return null;

  const statusMeta = leadStatuses?.find((status) => status.name === lead.status);
  const statusLabel = statusMeta?.title || statusLabels[lead.status] || lead.status;

  const openWhatsApp = () => {
    const phone = lead.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${formattedPhone}`, "_blank");
  };

  const makeCall = () => {
    window.location.href = `tel:${lead.phone}`;
  };

  const handleFormSuccess = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteLeadComplete.mutate(lead.id, {
      onSuccess: () => {
        onOpenChange(false);
        setIsDeleteDialogOpen(false);
      },
    });
  };

  // PRIORITIZE stored values (from import) over calculated
  // Use whichever is higher to ensure we show the best data available
  const displayMetrics = {
    totalAppointments: Math.max(lead.total_appointments ?? 0, calculatedMetrics?.totalAppointments ?? 0),
    totalQuotes: Math.max(lead.total_quotes ?? 0, calculatedMetrics?.totalQuotes ?? 0),
    totalSales: Math.max(lead.total_sales ?? 0, calculatedMetrics?.totalSales ?? 0),
    totalRevenue: Math.max(lead.total_revenue ?? 0, calculatedMetrics?.totalRevenue ?? 0),
  };

  // Check if we have stored historical data (from import) but no linked records
  const hasStoredHistoryOnly = (lead.total_appointments ?? 0) > 0 && 
    (!recentAppointments || recentAppointments.length === 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isEditing ? (
            <LeadForm 
              lead={lead} 
              onSuccess={handleFormSuccess}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Header com nome e status */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{lead.name}</h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={statusMeta?.color ? `${statusMeta.color} text-white` : undefined}>
                    {statusLabel}
                  </Badge>
                  <TemperatureBadge temperature={lead.temperature} />
                  {(lead.scheduled || (lead.temperature === "quente" && lead.hot_substatus)) && (
                    <HotSubstatusBadge substatus={lead.hot_substatus} scheduled={lead.scheduled} size="md" />
                  )}
                </div>
              </div>

              {/* Seção de Temperatura */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4" />
                  Temperatura do Lead
                </h3>
                
                {lead.last_interaction_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Última interação: {formatDistanceToNow(new Date(lead.last_interaction_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                )}

                {lead.follow_up_count !== null && lead.follow_up_count > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Follow-ups realizados: {lead.follow_up_count}
                  </p>
                )}

                {lead.no_show_count !== null && lead.no_show_count > 0 && (
                  <p className="text-sm text-orange-600">
                    Faltas: {lead.no_show_count}
                  </p>
                )}

                {lead.lost_reason && (
                  <p className="text-sm text-red-600">
                    Motivo da perda: {lead.lost_reason}
                  </p>
                )}

                <TemperatureActions 
                  leadId={lead.id} 
                  currentTemperature={lead.temperature}
                />
              </div>

              {/* Métricas do Lead - Always visible */}
              <Separator />
              <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Métricas
                  {metricsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <button 
                    onClick={() => openHistoryDialog("appointments", "Histórico de Agendamentos")}
                    className="text-center p-2 bg-background rounded border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <p className="text-2xl font-bold text-blue-600">{displayMetrics.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">Agendamentos</p>
                  </button>
                  <button 
                    onClick={() => openHistoryDialog("sales", "Histórico de Vendas")}
                    className="text-center p-2 bg-background rounded border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <p className="text-2xl font-bold text-green-600">{displayMetrics.totalSales}</p>
                    <p className="text-xs text-muted-foreground">Vendas</p>
                  </button>
                  <button 
                    onClick={() => openHistoryDialog("quotes", "Histórico de Orçamentos")}
                    className="text-center p-2 bg-background rounded border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <p className="text-2xl font-bold text-purple-600">{displayMetrics.totalQuotes}</p>
                    <p className="text-xs text-muted-foreground">Orçamentos</p>
                  </button>
                  <button 
                    onClick={() => openHistoryDialog("sales", "Histórico de Receita")}
                    className="text-center p-2 bg-background rounded border hover:bg-accent transition-colors cursor-pointer"
                  >
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(displayMetrics.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Receita Total</p>
                  </button>
                </div>
              </div>

              {/* Appointment History - Always visible */}
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Histórico de Agendamentos
                  {appointmentsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                </h3>
                
                {recentAppointments && recentAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {recentAppointments.map((appointment) => {
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
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
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
                                {appointment.procedures?.name || "Consulta"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : hasStoredHistoryOnly ? (
                  <div className="text-center py-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground">
                      Dados históricos importados
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.total_appointments} agendamentos
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum agendamento encontrado
                  </p>
                )}
              </div>

              {/* Última Venda */}
              {lead.last_sale_date && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Última Venda
                    </h3>
                    <div className="text-sm space-y-1 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">{format(new Date(lead.last_sale_date), "dd/MM/yyyy")}</span>
                      </p>
                      {lead.last_sale_amount && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-green-600">{formatCurrency(lead.last_sale_amount)}</span>
                        </p>
                      )}
                      {lead.last_sale_payment_method && (
                        <p className="flex justify-between">
                          <span className="text-muted-foreground">Pagamento:</span>
                          <span className="font-medium">{lead.last_sale_payment_method}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Valores de Orçamento */}
              {((lead.contracted_value && lead.contracted_value > 0) || (lead.non_contracted_value && lead.non_contracted_value > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Valores de Contrato
                    </h3>
                    <div className="flex gap-3">
                      {lead.contracted_value && lead.contracted_value > 0 && (
                        <div className="flex-1 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Contratado</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(lead.contracted_value)}
                          </p>
                        </div>
                      )}
                      {lead.non_contracted_value && lead.non_contracted_value > 0 && (
                        <div className="flex-1 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">Não Contratado</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(lead.non_contracted_value)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Non-Contracted Quotes Detail */}
              {((lead.total_non_contracted_quote_items && lead.total_non_contracted_quote_items > 0) || nonContractedQuotesHistory.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200">
                    <h3 className="font-semibold flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      Orçamentos Não Contratados
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-background rounded border">
                        <p className="text-xl font-bold text-orange-600">
                          {lead.total_non_contracted_quote_items ?? nonContractedQuotesHistory.length}
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
                          {formatCurrency(lead.total_non_contracted_quote_value ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          Valor Total
                          {nonContractedQuotesHistory.length > 0 && <ChevronRight className="h-3 w-3" />}
                        </p>
                      </button>
                    </div>
                    
                    {lead.top_non_contracted_procedures && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Top Procedimentos: </span>
                        <span className="font-medium">{lead.top_non_contracted_procedures}</span>
                      </div>
                    )}
                    {lead.top_non_contracted_specialties && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Top Especialidades: </span>
                        <span className="font-medium">{lead.top_non_contracted_specialties}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* Ações rápidas */}
              <div className="flex gap-2">
                <Button onClick={makeCall} variant="outline" className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </Button>
                <Button onClick={openWhatsApp} variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsConvertDialogOpen(true)}
                  disabled={lead.status === "em_tratamento" || lead.status === "concluido"}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Converter em Paciente
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>

              <Separator />

              {/* Informações de contato */}
              <div className="space-y-3">
                <h3 className="font-semibold">Informações de Contato</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{lead.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Registro:</span>
                    <p className="font-medium">
                      {format(new Date(lead.registration_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  {lead.sources && (
                    <div>
                      <span className="text-muted-foreground">Fonte:</span>
                      <p className="font-medium">{lead.sources.name}</p>
                    </div>
                  )}
                  {lead.procedures && (
                    <div>
                      <span className="text-muted-foreground">Interesse:</span>
                      <p className="font-medium">{lead.procedures.name}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Histórico de contatos */}
              <div className="space-y-3">
                <h3 className="font-semibold">Histórico de Contatos</h3>
                <div className="space-y-2 text-sm">
                  {lead.first_contact_date && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">1º</Badge>
                      <div>
                        <p className="font-medium">{lead.first_contact_channel}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(lead.first_contact_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.second_contact_date && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">2º</Badge>
                      <div>
                        <p className="font-medium">{lead.second_contact_channel}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(lead.second_contact_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.third_contact_date && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">3º</Badge>
                      <div>
                        <p className="font-medium">{lead.third_contact_channel}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(lead.third_contact_date), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agendamento */}
              {lead.appointment_date && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Agendamento
                    </h3>
                    <div className="text-sm">
                      <p className="font-medium">
                        {format(new Date(lead.appointment_date), "dd/MM/yyyy")}
                      </p>
                      {lead.scheduled_on_attempt && (
                        <p className="text-muted-foreground">
                          Agendado na {lead.scheduled_on_attempt}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Orçamento */}
              {(lead.budget_total || lead.budget_paid) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Orçamento
                    </h3>
                    <div className="space-y-2 text-sm">
                      {lead.budget_total && (
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <p className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(lead.budget_total))}
                          </p>
                        </div>
                      )}
                      {lead.budget_paid && (
                        <div>
                          <span className="text-muted-foreground">Pago:</span>
                          <p className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(lead.budget_paid))}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Notas */}
              {lead.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>

      <ConvertToPatientDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        leadId={lead.id}
        leadName={lead.name}
      />

      <ConfirmDeleteLeadDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        leadId={lead.id}
        leadName={lead.name}
        isDeleting={deleteLeadComplete.isPending}
      />

      <HistoryDetailDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        title={historyDialogTitle}
        type={historyDialogType}
        data={
          historyDialogType === "appointments" ? appointmentsHistory :
          historyDialogType === "attendances" ? attendancesHistory :
          historyDialogType === "quotes" ? quotesHistory :
          historyDialogType === "non_contracted_quotes" ? nonContractedQuotesHistory :
          salesHistory
        }
      />
    </Sheet>
  );
}
