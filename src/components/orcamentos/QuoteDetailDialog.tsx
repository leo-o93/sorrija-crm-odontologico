import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuote, useUpdateQuote } from "@/hooks/useQuotes";
import { Loader2, Send, CheckCircle, XCircle, FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface QuoteDetailDialogProps {
  quoteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGeneratePDF?: (quoteId: string) => void;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  expired: "bg-orange-500",
  converted: "bg-purple-500",
  not_closed: "bg-red-500",
  partially_closed: "bg-yellow-500",
  closed: "bg-emerald-500",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
  converted: "Convertido",
  not_closed: "Não fechou",
  partially_closed: "Fechou parte",
  closed: "Fechou tudo",
};

const paymentMethodLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "Pix",
  transferencia: "Transferência",
  boleto: "Boleto",
};

export function QuoteDetailDialog({ quoteId, open, onOpenChange, onGeneratePDF }: QuoteDetailDialogProps) {
  const { data: quote, isLoading } = useQuote(quoteId || "");
  const updateQuote = useUpdateQuote();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!quoteId) return;

    if (["partially_closed", "closed"].includes(newStatus)) {
      if (!quote?.quote_payments || quote.quote_payments.length === 0) {
        toast.error("Adicione um pagamento antes de fechar o orçamento.");
        return;
      }
    }
    
    setIsUpdating(true);
    try {
      await updateQuote.mutateAsync({ id: quoteId, status: newStatus });
      toast.success(`Status alterado para ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!quoteId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Detalhes do Orçamento
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : quote ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">#{quote.quote_number}</h2>
                  <Badge className={statusColors[quote.status]}>
                    {statusLabels[quote.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Data do orçamento: {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-2">
                {onGeneratePDF && (
                  <Button variant="outline" onClick={() => onGeneratePDF(quoteId)}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Client Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{quote.contact_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{quote.contact_phone}</p>
                </div>
                {quote.contact_email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{quote.contact_email}</p>
                  </div>
                )}
                {quote.valid_until && (
                  <div>
                    <p className="text-muted-foreground">Válido até</p>
                    <p className="font-medium">
                      {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {quote.payment_type && (
                  <div>
                    <p className="text-muted-foreground">Convênio / Particular</p>
                    <p className="font-medium">
                      {quote.payment_type === "convenio" ? "Convênio" : "Particular"}
                    </p>
                  </div>
                )}
                {quote.professional?.name && (
                  <div>
                    <p className="text-muted-foreground">Profissional responsável</p>
                    <p className="font-medium">{quote.professional.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Procedimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Dentes</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.quote_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.procedure_name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </TableCell>
                        <TableCell>{item.tooth || "-"}</TableCell>
                        <TableCell>{item.specialty || "-"}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {(item.subtotal ?? item.total_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2 text-right">
                  <div className="flex justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {quote.total_amount.toFixed(2)}</span>
                  </div>
                  {(quote.discount_percentage || quote.discount_amount) && (
                    <div className="flex justify-end gap-4 text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>
                        {quote.discount_percentage
                          ? `${quote.discount_percentage}%`
                          : `R$ ${quote.discount_amount?.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-end gap-4 text-lg font-bold">
                    <span>Total:</span>
                    <span>R$ {quote.final_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments */}
            {quote.quote_payments && quote.quote_payments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Parcelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quote.quote_payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.installment_number}ª</TableCell>
                          <TableCell>
                            {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {payment.payment_method
                              ? paymentMethodLabels[payment.payment_method] || payment.payment_method
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                              {payment.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">R$ {payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 justify-end">
              {quote.status === "draft" && (
                <Button
                  onClick={() => handleStatusChange("sent")}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Marcar como Enviado
                </Button>
              )}
              {!["not_closed", "partially_closed", "closed"].includes(quote.status) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("not_closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Não fechou
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("partially_closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Fechou parte
                  </Button>
                  <Button
                    onClick={() => handleStatusChange("closed")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Fechou tudo
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Orçamento não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
