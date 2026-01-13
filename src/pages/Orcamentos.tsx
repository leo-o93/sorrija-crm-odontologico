import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { QuoteForm } from "@/components/orcamentos/QuoteForm";
import { QuoteList } from "@/components/orcamentos/QuoteList";
import { QuoteDetailDialog } from "@/components/orcamentos/QuoteDetailDialog";
import { generateQuotePDF } from "@/components/orcamentos/QuotePDFGenerator";
import { useQuote } from "@/hooks/useQuotes";
import { useOrganization } from "@/contexts/OrganizationContext";

export default function Orcamentos() {
  const [isNewQuoteDialogOpen, setIsNewQuoteDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { currentOrganization } = useOrganization();
  
  const { data: selectedQuote } = useQuote(selectedQuoteId || "");

  const handleViewQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setIsDetailOpen(true);
  };

  const handleGeneratePDF = (quoteId: string) => {
    if (selectedQuote && selectedQuote.id === quoteId) {
      generateQuotePDF(selectedQuote, {
        name: currentOrganization?.name || "Clínica Odontológica",
        phone: currentOrganization?.phone || undefined,
        email: currentOrganization?.email || undefined,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie orçamentos para seus pacientes
          </p>
        </div>
        <Dialog open={isNewQuoteDialogOpen} onOpenChange={setIsNewQuoteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Orçamento</DialogTitle>
            </DialogHeader>
            <QuoteForm onSuccess={() => setIsNewQuoteDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <QuoteList onViewQuote={handleViewQuote} />
      
      <QuoteDetailDialog
        quoteId={selectedQuoteId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
}
