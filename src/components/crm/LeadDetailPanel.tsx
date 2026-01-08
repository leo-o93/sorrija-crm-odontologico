import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lead, useDeleteLead } from "@/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Calendar, DollarSign, FileText, Edit, UserCheck, Trash2, ThermometerSun, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { LeadForm } from "./LeadForm";
import { ConvertToPatientDialog } from "@/components/pacientes/ConvertToPatientDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TemperatureBadge } from "./TemperatureBadge";
import { HotSubstatusBadge } from "./HotSubstatusBadge";
import { TemperatureActions } from "./TemperatureActions";

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

export function LeadDetailPanel({ lead, open, onOpenChange }: LeadDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteLead = useDeleteLead();

  if (!lead) return null;

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
    deleteLead.mutate(lead.id, {
      onSuccess: () => {
        onOpenChange(false);
        setIsDeleteDialogOpen(false);
      },
    });
  };

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
                  <Badge>{statusLabels[lead.status] || lead.status}</Badge>
                  <TemperatureBadge temperature={lead.temperature} />
                  {lead.temperature === "quente" && lead.hot_substatus && (
                    <HotSubstatusBadge substatus={lead.hot_substatus} size="md" />
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

              {/* Observações */}
              {lead.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Observações
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* Botões estão agora no topo, após as ações rápidas */}
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

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={lead.name}
        title="Excluir Lead"
      />
    </Sheet>
  );
}
