import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Webhook } from "@/hooks/useWebhooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface WebhookDetailProps {
  webhook: Webhook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (params: { id: string; status: 'received' | 'processed' | 'failed'; errorMessage?: string }) => void;
}

export function WebhookDetail({ webhook, open, onOpenChange, onDelete, onUpdateStatus }: WebhookDetailProps) {
  if (!webhook) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      received: { variant: "secondary", label: "Recebido" },
      processed: { variant: "default", label: "Processado" },
      failed: { variant: "destructive", label: "Erro" },
    };
    const config = variants[status] || variants.received;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Webhook</SheetTitle>
          <SheetDescription>
            {format(new Date(webhook.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{webhook.method}</Badge>
              {getStatusBadge(webhook.status)}
            </div>
            <div className="flex gap-2">
              {webhook.status !== 'processed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdateStatus({ id: webhook.id, status: 'processed' })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar como Processado
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onDelete(webhook.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Deletar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Origem</p>
              <p className="text-sm">{webhook.origin || 'Desconhecida'}</p>
            </div>
            {webhook.path && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Caminho</p>
                <p className="text-sm font-mono">{webhook.path}</p>
              </div>
            )}
            {webhook.ip_address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endereço IP</p>
                <p className="text-sm font-mono">{webhook.ip_address}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Payload */}
          <div>
            <p className="text-sm font-medium mb-2">Payload (Body)</p>
            <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
              {JSON.stringify(webhook.payload, null, 2)}
            </pre>
          </div>

          {/* Accordion for optional data */}
          <Accordion type="single" collapsible className="w-full">
            {webhook.headers && (
              <AccordionItem value="headers">
                <AccordionTrigger>Headers</AccordionTrigger>
                <AccordionContent>
                  <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(webhook.headers, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}

            {webhook.query_params && (
              <AccordionItem value="query">
                <AccordionTrigger>Query Parameters</AccordionTrigger>
                <AccordionContent>
                  <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(webhook.query_params, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}

            {webhook.user_agent && (
              <AccordionItem value="user-agent">
                <AccordionTrigger>User Agent</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm font-mono">{webhook.user_agent}</p>
                </AccordionContent>
              </AccordionItem>
            )}

            {webhook.error_message && (
              <AccordionItem value="error">
                <AccordionTrigger className="text-destructive">
                  Mensagem de Erro
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-destructive">{webhook.error_message}</p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
