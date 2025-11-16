import { useState } from "react";
import { useWebhooks, Webhook } from "@/hooks/useWebhooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WebhookDetail } from "./WebhookDetail";
import { Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function WebhookList() {
  const { webhooks, isLoading, deleteWebhook, updateWebhookStatus } = useWebhooks();
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const filteredWebhooks = webhooks?.filter((webhook) => {
    const matchesSearch = searchTerm === "" || 
      JSON.stringify(webhook.payload).toLowerCase().includes(searchTerm.toLowerCase()) ||
      webhook.origin?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || webhook.status === statusFilter;
    const matchesMethod = methodFilter === "all" || webhook.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const openDetail = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      received: { variant: "secondary", label: "Recebido" },
      processed: { variant: "default", label: "Processado" },
      failed: { variant: "destructive", label: "Erro" },
    };
    const config = variants[status] || variants.received;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por conteúdo ou origem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="received">Recebido</SelectItem>
            <SelectItem value="processed">Processado</SelectItem>
            <SelectItem value="failed">Erro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os métodos</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredWebhooks && filteredWebhooks.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWebhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(webhook.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{webhook.method}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {webhook.origin || 'Desconhecida'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(webhook.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(webhook)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {webhooks?.length === 0 
            ? "Nenhum webhook recebido ainda. Use o endpoint acima para começar a receber webhooks."
            : "Nenhum webhook encontrado com os filtros aplicados."}
        </div>
      )}

      {/* Detail Sheet */}
      <WebhookDetail
        webhook={selectedWebhook}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={deleteWebhook}
        onUpdateStatus={updateWebhookStatus}
      />
    </div>
  );
}
