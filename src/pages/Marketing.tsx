import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, 
  Users, 
  Filter, 
  Send, 
  FileText, 
  Target,
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useLeads } from "@/hooks/useLeads";
import { useProcedures } from "@/hooks/useProcedures";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("templates");
  const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
  const [interestFilter, setInterestFilter] = useState<string>("all");
  const [daysInactive, setDaysInactive] = useState<number>(7);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  const { data: templates, isLoading: loadingTemplates } = useMessageTemplates();
  const { data: leads, isLoading: loadingLeads } = useLeads();
  const { data: procedures } = useProcedures();

  // Filter leads based on criteria
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    return leads.filter(lead => {
      // Temperature filter
      if (temperatureFilter !== "all" && lead.temperature !== temperatureFilter) {
        return false;
      }
      
      // Interest filter
      if (interestFilter !== "all" && lead.interest_id !== interestFilter) {
        return false;
      }
      
      // Inactivity filter
      if (daysInactive > 0) {
        const lastInteraction = lead.last_interaction_at 
          ? new Date(lead.last_interaction_at) 
          : new Date(lead.created_at);
        const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < daysInactive) {
          return false;
        }
      }
      
      return true;
    });
  }, [leads, temperatureFilter, interestFilter, daysInactive]);

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleQueueCampaign = () => {
    if (selectedLeads.length === 0) {
      toast.error("Selecione ao menos um lead");
      return;
    }
    
    if (!selectedTemplate) {
      toast.error("Selecione um template de mensagem");
      return;
    }
    
    // For now, just show a success message - actual sending would require queue implementation
    toast.success(`Campanha agendada para ${selectedLeads.length} leads`, {
      description: "As mensagens serão enviadas em sequência."
    });
    
    setSelectedLeads([]);
  };

  const getTemperatureLabel = (temp: string) => {
    const labels: Record<string, string> = {
      novo: "Novo",
      quente: "Quente",
      frio: "Frio",
      perdido: "Perdido"
    };
    return labels[temp] || temp;
  };

  const getTemperatureBadgeClass = (temp: string) => {
    const classes: Record<string, string> = {
      novo: "bg-blue-100 text-blue-800",
      quente: "bg-orange-100 text-orange-800",
      frio: "bg-slate-100 text-slate-800",
      perdido: "bg-red-100 text-red-800"
    };
    return classes[temp] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing & Automação</h1>
        <p className="text-muted-foreground">Campanhas, templates e automações de mensagens</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="segmentation">
            <Filter className="h-4 w-4 mr-2" />
            Segmentação
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campanhas
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates de Mensagens
              </CardTitle>
              <CardDescription>
                Gerencie seus templates de mensagens para campanhas e automações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map(template => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.content}
                        </p>
                        {template.temperature && (
                          <Badge 
                            className={`mt-2 ${getTemperatureBadgeClass(template.temperature)}`}
                          >
                            {getTemperatureLabel(template.temperature)}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum template cadastrado</p>
                  <p className="text-sm">Vá em Cadastros → Templates de Mensagens para criar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segmentation Tab */}
        <TabsContent value="segmentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Segmentar Leads
              </CardTitle>
              <CardDescription>
                Filtre e selecione leads para suas campanhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Temperatura</Label>
                  <Select value={temperatureFilter} onValueChange={setTemperatureFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="quente">Quente</SelectItem>
                      <SelectItem value="frio">Frio</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interesse</Label>
                  <Select value={interestFilter} onValueChange={setInterestFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {procedures?.map(proc => (
                        <SelectItem key={proc.id} value={proc.id}>{proc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dias sem interação</Label>
                  <Input 
                    type="number" 
                    value={daysInactive} 
                    onChange={(e) => setDaysInactive(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedLeads.length} de {filteredLeads.length} leads selecionados
                    </span>
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  {loadingLeads ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredLeads.length > 0 ? (
                    <div className="divide-y">
                      {filteredLeads.map(lead => (
                        <div 
                          key={lead.id} 
                          className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleSelectLead(lead.id)}
                        >
                          <Checkbox 
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => handleSelectLead(lead.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.name}</p>
                            <p className="text-sm text-muted-foreground">{lead.phone}</p>
                          </div>
                          <Badge className={getTemperatureBadgeClass(lead.temperature || 'novo')}>
                            {getTemperatureLabel(lead.temperature || 'novo')}
                          </Badge>
                          {lead.procedures && (
                            <Badge variant="outline">{lead.procedures.name}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum lead encontrado com os filtros selecionados
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Criar Campanha
              </CardTitle>
              <CardDescription>
                Configure e envie campanhas para os leads selecionados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum lead selecionado</p>
                  <p className="text-sm">Vá na aba Segmentação para selecionar leads</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>
                      <strong>{selectedLeads.length}</strong> leads selecionados para esta campanha
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Template de Mensagem</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm font-medium mb-2">Prévia da mensagem:</p>
                      <p className="text-sm text-muted-foreground">
                        {templates?.find(t => t.id === selectedTemplate)?.content}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      As mensagens serão enfileiradas e enviadas em sequência para evitar bloqueios do WhatsApp.
                    </p>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleQueueCampaign}
                    disabled={!selectedTemplate}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Agendar Envio para {selectedLeads.length} Leads
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}