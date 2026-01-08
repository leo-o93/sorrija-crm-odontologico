import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Phone, MessageSquare, Calendar } from 'lucide-react';

interface PriorityLead {
  nome: string;
  telefone?: string;
  temperatura: string;
  substatus: string;
  urgencia: string;
  acao_sugerida: string;
  motivo: string;
}

interface AIPriorityLeadsProps {
  leads: PriorityLead[];
  isLoading?: boolean;
}

const URGENCY_COLORS: Record<string, string> = {
  'crítica': 'bg-destructive text-destructive-foreground',
  'alta': 'bg-warning text-warning-foreground',
  'média': 'bg-info text-info-foreground',
  'baixa': 'bg-muted text-muted-foreground',
};

const ACTION_ICONS: Record<string, any> = {
  'ligar': Phone,
  'mensagem': MessageSquare,
  'agendar': Calendar,
};

export function AIPriorityLeads({ leads, isLoading }: AIPriorityLeadsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Leads Prioritários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Leads Prioritários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            Gere uma análise de IA para ver os leads prioritários
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Leads Prioritários
          <Badge variant="secondary" className="ml-auto">{leads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.slice(0, 5).map((lead, index) => {
            const ActionIcon = ACTION_ICONS[lead.acao_sugerida?.toLowerCase()] || Target;
            
            return (
              <div 
                key={index}
                className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{lead.nome}</span>
                      <Badge 
                        variant="outline" 
                        className={URGENCY_COLORS[lead.urgencia?.toLowerCase()] || URGENCY_COLORS['média']}
                      >
                        {lead.urgencia}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{lead.temperatura}</span>
                      <span>•</span>
                      <span>{lead.substatus?.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {lead.motivo}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <ActionIcon className="h-3 w-3" />
                    <span className="capitalize">{lead.acao_sugerida}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
