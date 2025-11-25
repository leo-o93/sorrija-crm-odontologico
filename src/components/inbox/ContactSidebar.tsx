import { Conversation } from '@/hooks/useConversations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, User, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContactSidebarProps {
  conversation: Conversation;
}

export function ContactSidebar({ conversation }: ContactSidebarProps) {
  const navigate = useNavigate();

  const contact = conversation.contact_type === 'lead' ? conversation.leads : conversation.patients;

  const handleOpenContact = () => {
    if (conversation.contact_type === 'lead' && conversation.lead_id) {
      navigate(`/crm?lead=${conversation.lead_id}`);
    } else if (conversation.contact_type === 'patient' && conversation.patient_id) {
      navigate(`/pacientes?id=${conversation.patient_id}`);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Informações do Contato</h3>
          <Button variant="ghost" size="icon" onClick={handleOpenContact}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{contact?.name || 'Sem nome'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{conversation.phone}</span>
          </div>

          {conversation.contact_type === 'patient' && conversation.patients?.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{conversation.patients.email}</span>
            </div>
          )}
        </Card>

        {conversation.contact_type === 'lead' && conversation.leads && (
          <Card className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Informações do Lead</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className="font-medium">{conversation.leads.status}</span>
              </p>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleOpenContact}>
            Ver Ficha Completa
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
