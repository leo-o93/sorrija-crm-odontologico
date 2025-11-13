import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, Calendar, MoreVertical } from "lucide-react";

type LeadStatus = 
  | "novo_lead" 
  | "1_contato" 
  | "2_contato" 
  | "3_contato" 
  | "agendado" 
  | "nao_respondeu"
  | "sem_interesse";

interface Lead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  source: string;
  status: LeadStatus;
  responsible: string;
  nextContact?: string;
}

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Carlos Mendes",
    phone: "(11) 98765-4321",
    interest: "Implante",
    source: "Facebook Ads",
    status: "novo_lead",
    responsible: "Recepção",
    nextContact: "Hoje, 15:00"
  },
  {
    id: "2",
    name: "Juliana Oliveira",
    phone: "(11) 91234-5678",
    interest: "Clareamento",
    source: "Instagram",
    status: "1_contato",
    responsible: "Recepção",
    nextContact: "Amanhã, 10:00"
  },
  {
    id: "3",
    name: "Roberto Alves",
    phone: "(11) 99876-5432",
    interest: "Prótese Flexível",
    source: "Indicação",
    status: "agendado",
    responsible: "Recepção",
    nextContact: "15/11 às 14:00"
  },
];

const columns = [
  { id: "novo_lead", title: "Novo Lead", color: "bg-blue-500" },
  { id: "1_contato", title: "1º Contato", color: "bg-purple-500" },
  { id: "2_contato", title: "2º Contato", color: "bg-orange-500" },
  { id: "3_contato", title: "3º Contato", color: "bg-yellow-500" },
  { id: "agendado", title: "Agendado", color: "bg-green-500" },
  { id: "nao_respondeu", title: "Não Respondeu", color: "bg-gray-500" },
  { id: "sem_interesse", title: "Sem Interesse", color: "bg-red-500" },
];

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{lead.name}</h4>
              <p className="text-xs text-muted-foreground">{lead.phone}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {lead.interest}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {lead.source}
            </Badge>
          </div>

          {lead.nextContact && (
            <p className="text-xs text-muted-foreground">
              Próximo contato: {lead.nextContact}
            </p>
          )}

          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-8 flex-1">
              <Phone className="h-3 w-3 mr-1" />
              Ligar
            </Button>
            <Button size="sm" variant="outline" className="h-8 flex-1">
              <MessageSquare className="h-3 w-3 mr-1" />
              WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CRM() {
  const [leads] = useState<Lead[]>(mockLeads);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM / Leads</h1>
          <p className="text-muted-foreground">Funil de vendas e acompanhamento de leads</p>
        </div>
        <Button className="bg-gold hover:bg-gold/90 text-gold-foreground">
          <Phone className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">Leads Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {leads.filter(l => l.status === "agendado").length}
            </div>
            <p className="text-xs text-muted-foreground">Agendados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">Taxa de Contato</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">42%</div>
            <p className="text-xs text-muted-foreground">Taxa de Agendamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-w-full">
          {columns.map((column) => {
            const columnLeads = leads.filter(lead => lead.status === column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      {column.title}
                      <Badge variant="secondary" className="ml-auto">
                        {columnLeads.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {columnLeads.length > 0 ? (
                      columnLeads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhum lead nesta etapa
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
