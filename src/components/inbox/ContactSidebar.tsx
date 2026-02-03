import { useState } from 'react';
import { Conversation } from '@/hooks/useConversations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { useUpdateLeadStatus, useDeleteLeadComplete } from '@/hooks/useLeads';
import { useAppointments } from '@/hooks/useAppointments';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { QuickScheduleDialog } from './QuickScheduleDialog';
import { ContactNotes } from './ContactNotes';
import { ConversationActions } from './ConversationActions';
import { TemperatureBadge } from '@/components/crm/TemperatureBadge';
import { HotSubstatusBadge } from '@/components/crm/HotSubstatusBadge';
import { TemperatureActions } from '@/components/crm/TemperatureActions';
import { ConfirmDeleteLeadDialog } from '@/components/crm/ConfirmDeleteLeadDialog';
import { Repeat, XCircle, Trash2 } from 'lucide-react';
import {
  ExternalLink,
  User,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  MessageCircle,
  Edit,
  AlertTriangle,
  Clock,
  Thermometer,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ContactSidebarProps {
  conversation: Conversation;
}

export function ContactSidebar({ conversation }: ContactSidebarProps) {
  const navigate = useNavigate();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showRetroScheduleDialog, setShowRetroScheduleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    temperature: true,
    actions: true,
    budget: true,
    conversation: true,
    notes: false,
    appointments: false,
  });

  const updateLeadStatus = useUpdateLeadStatus();
  const deleteLeadComplete = useDeleteLeadComplete();
  const { data: leadStatuses } = useLeadStatuses();
  const contact = conversation.contact_type === 'lead' ? conversation.leads : conversation.patients;

  // Fetch appointments for this contact
  const { data: appointments } = useAppointments({
    // Filter by contact in the component
  });

  const contactAppointments = appointments?.filter(
    (apt) =>
      (conversation.contact_type === 'lead' && apt.lead_id === conversation.lead_id) ||
      (conversation.contact_type === 'patient' && apt.patient_id === conversation.patient_id)
  ).slice(0, 3);

  const handleOpenContact = () => {
    if (conversation.contact_type === 'lead' && conversation.lead_id) {
      navigate(`/crm?lead=${conversation.lead_id}`);
    } else if (conversation.contact_type === 'patient' && conversation.patient_id) {
      navigate(`/pacientes?id=${conversation.patient_id}`);
    }
  };

  const handleWhatsAppClick = () => {
    const phone = conversation.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleCallClick = () => {
    window.open(`tel:${conversation.phone}`, '_blank');
  };

  const handleLeadStatusChange = async (newStatus: string) => {
    if (conversation.lead_id) {
      await updateLeadStatus.mutateAsync({
        id: conversation.lead_id,
        status: newStatus,
      });
      toast.success('Status do lead atualizado!');
    }
  };

  const handleDeactivateLead = async () => {
    if (!conversation.lead_id) return;

    const lostStatus =
      leadStatuses?.find((status) => status.name.toLowerCase().includes('perdido'))?.name || 'perdido';

    await handleLeadStatusChange(lostStatus);
    toast.success('Lead marcado como perdido.');
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const budgetPercentage =
    conversation.leads?.budget_total && conversation.leads?.budget_paid
      ? (conversation.leads.budget_paid / conversation.leads.budget_total) * 100
      : 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header do Contato */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(contact?.name || 'Sem nome')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{contact?.name || 'Sem nome'}</h3>
                <Badge variant={conversation.contact_type === 'lead' ? 'default' : 'secondary'}>
                  {conversation.contact_type === 'lead' ? 'Lead' : 'Paciente'}
                </Badge>
              </div>
              
              {/* Temperature Badges for Leads */}
              {conversation.contact_type === 'lead' && conversation.leads && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <TemperatureBadge 
                    temperature={conversation.leads.temperature} 
                    size="sm" 
                  />
                  {(conversation.leads.scheduled || (conversation.leads.temperature === 'quente' && conversation.leads.hot_substatus)) && (
                    <HotSubstatusBadge 
                      substatus={conversation.leads.hot_substatus} 
                      scheduled={conversation.leads.scheduled}
                      size="sm" 
                    />
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Phone className="w-3 h-3" />
                <span>{conversation.phone}</span>
              </div>
              {conversation.contact_type === 'patient' && conversation.patients?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{conversation.patients.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCallClick} className="flex-1">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsAppClick} className="flex-1">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenContact} className="flex-1">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenContact} className="flex-1">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Temperatura do Lead */}
        {conversation.contact_type === 'lead' && conversation.leads && (
          <Collapsible open={sectionsOpen.temperature} onOpenChange={() => toggleSection('temperature')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-medium text-sm">Temperatura do Lead</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.temperature ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 pt-0 space-y-3">
                  {/* Current Status Display */}
                  <div className="flex flex-wrap items-center gap-2">
                    <TemperatureBadge temperature={conversation.leads.temperature} size="md" />
                    {(conversation.leads.scheduled || conversation.leads.hot_substatus) && (
                      <HotSubstatusBadge substatus={conversation.leads.hot_substatus} scheduled={conversation.leads.scheduled} size="md" />
                    )}
                  </div>
                  
                  {/* Temperature Actions */}
                  <TemperatureActions
                    leadId={conversation.lead_id!}
                    currentTemperature={conversation.leads.temperature}
                  />
                  
                  {/* Follow-up and No-show Info */}
                  <div className="space-y-1.5 pt-2 border-t">
                    {(conversation.leads.follow_up_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Repeat className="w-3 h-3" />
                        <span>Follow-ups realizados: {conversation.leads.follow_up_count}</span>
                      </div>
                    )}
                    
                    {(conversation.leads.no_show_count ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-xs text-orange-600">
                        <XCircle className="w-3 h-3" />
                        <span>Faltas: {conversation.leads.no_show_count}</span>
                      </div>
                    )}
                    
                    {conversation.leads.lost_reason && (
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Motivo da perda: {conversation.leads.lost_reason}</span>
                      </div>
                    )}
                    
                    {conversation.leads.next_follow_up_date && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Calendar className="w-3 h-3" />
                        <span>Próximo follow-up: {format(new Date(conversation.leads.next_follow_up_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                    
                    {conversation.leads.last_interaction_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          Última interação: {format(new Date(conversation.leads.last_interaction_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Ações do Contato */}
        <Collapsible open={sectionsOpen.actions} onOpenChange={() => toggleSection('actions')}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">Ações do Contato</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.actions ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0 space-y-3">
                {conversation.contact_type === 'lead' && conversation.leads && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Status do Lead</label>
                      <Select value={conversation.leads.status} onValueChange={handleLeadStatusChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses?.map((status) => (
                            <SelectItem key={status.id} value={status.name}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                {status.title}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduleDialog(true)}
                      className="w-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Consulta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRetroScheduleDialog(true)}
                      className="w-full"
                    >
                      <Repeat className="w-4 h-4 mr-2" />
                      Agendar Retroativo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeactivateLead}
                      className="w-full"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Desativar Lead
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Lead
                    </Button>
                  </>
                )}
                {conversation.contact_type === 'patient' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScheduleDialog(true)}
                      className="w-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Novo Agendamento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRetroScheduleDialog(true)}
                      className="w-full"
                    >
                      <Repeat className="w-4 h-4 mr-2" />
                      Agendar Retroativo
                    </Button>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Orçamento (apenas leads) */}
        {conversation.contact_type === 'lead' && conversation.leads && (
          <Collapsible open={sectionsOpen.budget} onOpenChange={() => toggleSection('budget')}>
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                <span className="font-medium text-sm">Orçamento</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.budget ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 pt-0 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {conversation.leads.budget_total
                        ? `R$ ${conversation.leads.budget_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pago:</span>
                    <span className="font-medium text-green-600">
                      {conversation.leads.budget_paid
                        ? `R$ ${conversation.leads.budget_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : 'R$ 0,00'}
                    </span>
                  </div>
                  {conversation.leads.budget_total && conversation.leads.budget_total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span>{budgetPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Ações da Conversa */}
        <Collapsible open={sectionsOpen.conversation} onOpenChange={() => toggleSection('conversation')}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">Conversa</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.conversation ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0">
                <ConversationActions
                  conversationId={conversation.id}
                  currentStatus={conversation.status}
                  unreadCount={conversation.unread_count}
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Observações */}
        <Collapsible open={sectionsOpen.notes} onOpenChange={() => toggleSection('notes')}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">Observações</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.notes ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0">
                <ContactNotes
                  contactId={contact?.id || ''}
                  contactType={conversation.contact_type}
                  initialNotes={
                    conversation.contact_type === 'lead' ? conversation.leads?.notes || null : conversation.patients?.notes || null
                  }
                />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Agendamentos */}
        <Collapsible open={sectionsOpen.appointments} onOpenChange={() => toggleSection('appointments')}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">Agendamentos Recentes</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.appointments ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0 space-y-2">
                {contactAppointments && contactAppointments.length > 0 ? (
                  <>
                    {contactAppointments.map((apt) => (
                      <div key={apt.id} className="p-2 bg-muted/50 rounded-md text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {format(new Date(apt.appointment_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <Badge variant={apt.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs">
                            {apt.status === 'scheduled'
                              ? 'Agendado'
                              : apt.status === 'attended'
                              ? 'Atendido'
                              : apt.status === 'rescheduled'
                              ? 'Reagendado'
                              : apt.status === 'no_show'
                              ? 'Faltou'
                              : 'Cancelado'}
                          </Badge>
                        </div>
                        {apt.procedure && <p className="text-xs text-muted-foreground">{apt.procedure.name}</p>}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={handleOpenContact} className="w-full">
                      Ver Todos os Agendamentos
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum agendamento ainda</p>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Dialogs */}
      {conversation.contact_type === 'lead' && conversation.lead_id && (
        <>
          <QuickScheduleDialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
            leadId={conversation.lead_id}
            contactName={conversation.leads?.name || 'Lead'}
          />
          <QuickScheduleDialog
            open={showRetroScheduleDialog}
            onOpenChange={setShowRetroScheduleDialog}
            leadId={conversation.lead_id}
            contactName={conversation.leads?.name || 'Lead'}
            allowPastDates
          />
          <ConfirmDeleteLeadDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={() => {
              deleteLeadComplete.mutate(conversation.lead_id!, {
                onSuccess: () => {
                  setShowDeleteDialog(false);
                  navigate('/conversas');
                },
              });
            }}
            leadId={conversation.lead_id}
            leadName={conversation.leads?.name || 'Lead'}
            isDeleting={deleteLeadComplete.isPending}
          />
        </>
      )}
      {conversation.contact_type === 'patient' && conversation.patient_id && (
        <>
          <QuickScheduleDialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
            patientId={conversation.patient_id}
            contactName={conversation.patients?.name || 'Paciente'}
          />
          <QuickScheduleDialog
            open={showRetroScheduleDialog}
            onOpenChange={setShowRetroScheduleDialog}
            patientId={conversation.patient_id}
            contactName={conversation.patients?.name || 'Paciente'}
            allowPastDates
          />
        </>
      )}
    </ScrollArea>
  );
}
