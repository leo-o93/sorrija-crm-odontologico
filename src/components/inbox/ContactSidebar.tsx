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
import { useUpdateLeadStatus } from '@/hooks/useLeads';
import { useAppointments } from '@/hooks/useAppointments';
import { ConvertToPatientDialog } from '@/components/pacientes/ConvertToPatientDialog';
import { QuickScheduleDialog } from './QuickScheduleDialog';
import { ContactNotes } from './ContactNotes';
import { ConversationActions } from './ConversationActions';
import { TemperatureBadge } from '@/components/crm/TemperatureBadge';
import { HotSubstatusBadge } from '@/components/crm/HotSubstatusBadge';
import { TemperatureActions } from '@/components/crm/TemperatureActions';
import {
  ExternalLink,
  User,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  DollarSign,
  ChevronDown,
  MessageCircle,
  Edit,
  UserPlus,
  AlertTriangle,
  FileText,
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
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    temperature: true,
    actions: true,
    info: true,
    budget: true,
    conversation: true,
    notes: false,
    appointments: false,
  });

  const updateLeadStatus = useUpdateLeadStatus();
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
                  {conversation.leads.temperature === 'quente' && conversation.leads.hot_substatus && (
                    <HotSubstatusBadge 
                      substatus={conversation.leads.hot_substatus} 
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
                    {conversation.leads.hot_substatus && (
                      <HotSubstatusBadge substatus={conversation.leads.hot_substatus} size="md" />
                    )}
                  </div>
                  
                  {/* Temperature Actions */}
                  <TemperatureActions
                    leadId={conversation.lead_id!}
                    currentTemperature={conversation.leads.temperature}
                  />
                  
                  {/* Last Interaction Info */}
                  {conversation.leads.last_interaction_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <Clock className="w-3 h-3" />
                      <span>
                        Última interação: {format(new Date(conversation.leads.last_interaction_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
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
                          <SelectItem value="novo_lead">Novo Lead</SelectItem>
                          <SelectItem value="primeira_tentativa">1ª Tentativa</SelectItem>
                          <SelectItem value="segunda_tentativa">2ª Tentativa</SelectItem>
                          <SelectItem value="terceira_tentativa">3ª Tentativa</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="compareceu">Compareceu</SelectItem>
                          <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                          <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
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
                      onClick={() => setShowConvertDialog(true)}
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Converter para Paciente
                    </Button>
                  </>
                )}
                {conversation.contact_type === 'patient' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowScheduleDialog(true)}
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Informações Odontológicas */}
        <Collapsible open={sectionsOpen.info} onOpenChange={() => toggleSection('info')}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm">Informações Odontológicas</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionsOpen.info ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-3 pt-0 space-y-2 text-sm">
                {conversation.contact_type === 'lead' && conversation.leads && (
                  <>
                    {conversation.leads.procedures && (
                      <div className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Interesse:</span>
                          <p className="font-medium">{conversation.leads.procedures.name}</p>
                          <p className="text-xs text-muted-foreground">{conversation.leads.procedures.category}</p>
                        </div>
                      </div>
                    )}
                    {conversation.leads.sources && (
                      <div className="flex items-start gap-2">
                        <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Fonte:</span>
                          <p className="font-medium">{conversation.leads.sources.name}</p>
                          <p className="text-xs text-muted-foreground">{conversation.leads.sources.channel}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Registro:</span>
                      <span className="font-medium">
                        {format(new Date(conversation.leads.registration_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </>
                )}
                {conversation.contact_type === 'patient' && conversation.patients && (
                  <>
                    {conversation.patients.medical_history && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">Histórico Médico:</span>
                          <p className="text-xs mt-1">{conversation.patients.medical_history}</p>
                        </div>
                      </div>
                    )}
                    {conversation.patients.allergies && (
                      <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
                        <div className="flex-1">
                          <span className="text-destructive font-medium">Alergias:</span>
                          <p className="text-xs mt-1">{conversation.patients.allergies}</p>
                        </div>
                      </div>
                    )}
                    {conversation.patients.medications && (
                      <div className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">Medicamentos:</span>
                          <p className="text-xs mt-1">{conversation.patients.medications}</p>
                        </div>
                      </div>
                    )}
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
                            {apt.status === 'scheduled' ? 'Agendado' : apt.status === 'completed' ? 'Realizado' : 'Cancelado'}
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
          <ConvertToPatientDialog
            open={showConvertDialog}
            onOpenChange={setShowConvertDialog}
            leadId={conversation.lead_id}
            leadName={conversation.leads?.name || 'Lead'}
          />
          <QuickScheduleDialog
            open={showScheduleDialog}
            onOpenChange={setShowScheduleDialog}
            leadId={conversation.lead_id}
            contactName={conversation.leads?.name || 'Lead'}
          />
        </>
      )}
      {conversation.contact_type === 'patient' && conversation.patient_id && (
        <QuickScheduleDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          patientId={conversation.patient_id}
          contactName={conversation.patients?.name || 'Paciente'}
        />
      )}
    </ScrollArea>
  );
}
