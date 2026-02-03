import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Search } from "lucide-react";
import { useQuotes, useQuote } from "@/hooks/useQuotes";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { generateQuotePDF } from "./QuotePDFGenerator";
import { useOrganization } from "@/contexts/OrganizationContext";

interface QuoteListProps {
  onViewQuote?: (quoteId: string) => void;
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

export function QuoteList({ onViewQuote }: QuoteListProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pdfQuoteId, setPdfQuoteId] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();

  const { data: quotes, isLoading } = useQuotes({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery,
  });

  const { data: pdfQuote } = useQuote(pdfQuoteId || "");

  const handleGeneratePDF = (quoteId: string) => {
    const quote = quotes?.find(q => q.id === quoteId);
    if (quote) {
      // Fetch full quote data including items
      setPdfQuoteId(quoteId);
    }
  };

  // Effect to generate PDF when quote data is loaded
  if (pdfQuote && pdfQuoteId === pdfQuote.id) {
    generateQuotePDF(pdfQuote, {
      name: currentOrganization?.name || "Clínica Odontológica",
      phone: currentOrganization?.phone || undefined,
      email: currentOrganization?.email || undefined,
    });
    setPdfQuoteId(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="not_closed">Não fechou</SelectItem>
            <SelectItem value="partially_closed">Fechou parte</SelectItem>
            <SelectItem value="closed">Fechou tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos ({quotes?.length || 0})</TabsTrigger>
          <TabsTrigger value="draft">
            Rascunhos ({quotes?.filter((q) => q.status === "draft").length || 0})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Enviados ({quotes?.filter((q) => q.status === "sent").length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovados ({quotes?.filter((q) => q.status === "approved").length || 0})
          </TabsTrigger>
          <TabsTrigger value="partially_closed">
            Fechou parte ({quotes?.filter((q) => q.status === "partially_closed").length || 0})
          </TabsTrigger>
          <TabsTrigger value="closed">
            Fechou tudo ({quotes?.filter((q) => q.status === "closed").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {quotes && quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum orçamento encontrado
              </CardContent>
            </Card>
          ) : (
            quotes?.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                        <Badge className={statusColors[quote.status]}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliente: <span className="text-foreground">{quote.contact_name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        Telefone: <span className="text-foreground">{quote.contact_phone}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Data do orçamento:{" "}
                        <span className="text-foreground">
                          {format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </p>
                      {quote.professional?.name && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Profissional: <span className="text-foreground">{quote.professional.name}</span>
                        </p>
                      )}
                      {quote.payment_type && (
                        <p className="text-sm text-muted-foreground mb-3">
                          Convênio / Particular:{" "}
                          <span className="text-foreground">
                            {quote.payment_type === "convenio" ? "Convênio" : "Particular"}
                          </span>
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Itens</p>
                          <p className="text-sm font-medium">{quote.quote_items?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-bold">
                            R$ {quote.final_amount.toFixed(2)}
                          </p>
                        </div>
                        {quote.valid_until && (
                          <div>
                            <p className="text-xs text-muted-foreground">Válido até</p>
                            <p className="text-sm font-medium">
                              {format(new Date(quote.valid_until), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewQuote?.(quote.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGeneratePDF(quote.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          {quotes
            ?.filter((q) => q.status === "draft")
            .map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* ... mesmo conteúdo do card acima ... */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                        <Badge className={statusColors[quote.status]}>
                          {statusLabels[quote.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Cliente: <span className="text-foreground">{quote.contact_name}</span>
                      </p>
                      <p className="text-sm font-bold">R$ {quote.final_amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuote?.(quote.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-4">
          {quotes
            ?.filter((q) => q.status === "sent")
            .map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                      <p className="text-sm text-muted-foreground">{quote.contact_name}</p>
                      <p className="text-sm font-bold">R$ {quote.final_amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuote?.(quote.id)}
                    >
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {quotes
            ?.filter((q) => q.status === "approved")
            .map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                      <p className="text-sm text-muted-foreground">{quote.contact_name}</p>
                      <p className="text-sm font-bold">R$ {quote.final_amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuote?.(quote.id)}
                    >
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="partially_closed" className="space-y-4 mt-4">
          {quotes
            ?.filter((q) => q.status === "partially_closed")
            .map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                      <p className="text-sm text-muted-foreground">{quote.contact_name}</p>
                      <p className="text-sm font-bold">R$ {quote.final_amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuote?.(quote.id)}
                    >
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="closed" className="space-y-4 mt-4">
          {quotes
            ?.filter((q) => q.status === "closed")
            .map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">#{quote.quote_number}</h3>
                      <p className="text-sm text-muted-foreground">{quote.contact_name}</p>
                      <p className="text-sm font-bold">R$ {quote.final_amount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQuote?.(quote.id)}
                    >
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
