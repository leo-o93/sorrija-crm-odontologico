import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, formatPhone, parseDate, parseCurrency } from "@/lib/supabase";
import { toast } from "sonner";
import { useSources } from "@/hooks/useSources";
import { useProcedures } from "@/hooks/useProcedures";

export function LeadImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  
  const { data: sources } = useSources();
  const { data: procedures } = useProcedures();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensão
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Arquivo deve ser .xlsx ou .xls");
      return;
    }

    // Validar que sources e procedures foram carregados
    if (!sources || sources.length === 0) {
      toast.error("Aguarde o carregamento das fontes...");
      return;
    }

    if (!procedures || procedures.length === 0) {
      toast.error("Aguarde o carregamento dos procedimentos...");
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Planilha está vazia");
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const leadsToInsert: any[] = [];

      setProgress({ current: 0, total: jsonData.length });

      // Processar todas as linhas primeiro (sem await)
      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        
        try {
          // Mapear fonte
          const sourceName = row["FONTE"]?.toString().trim();
          const source = sources?.find(s => 
            s.name.toLowerCase() === sourceName?.toLowerCase()
          );

          // Mapear interesse
          const interestName = row["INTERESSE"]?.toString().trim();
          const interest = procedures?.find(p => 
            p.name.toLowerCase().includes(interestName?.toLowerCase() || "")
          );

          // Mapear status
          const statusMap: Record<string, string> = {
            "novo lead": "novo_lead",
            "1ª tentativa": "primeira_tentativa",
            "2ª tentativa": "segunda_tentativa",
            "3ª tentativa": "terceira_tentativa",
            "agendado": "agendado",
            "compareceu": "compareceu",
            "não compareceu": "nao_compareceu",
            "orçamento enviado": "orcamento_enviado",
            "fechado": "fechado",
            "perdido": "perdido",
          };

          const statusKey = row["STATUS"]?.toString().toLowerCase().trim();
          const status = statusMap[statusKey] || "novo_lead";

          const leadData = {
            name: row["NOME"]?.toString().trim(),
            phone: formatPhone(row["TELEFONE"]?.toString() || ""),
            registration_date: parseDate(row["DATA"]?.toString()) || new Date().toISOString().split('T')[0],
            source_id: source?.id || null,
            interest_id: interest?.id || null,
            first_contact_channel: row["1º CONTATO"]?.toString() || null,
            first_contact_date: parseDate(row["DATA 1º CONTATO"]?.toString()) || null,
            second_contact_channel: row["2º CONTATO"]?.toString() || null,
            second_contact_date: parseDate(row["DATA 2º CONTATO"]?.toString()) || null,
            third_contact_channel: row["3º CONTATO"]?.toString() || null,
            third_contact_date: parseDate(row["DATA 3º CONTATO"]?.toString()) || null,
            scheduled: row["AGENDOU?"]?.toString().toLowerCase() === "sim",
            scheduled_on_attempt: row["AGENDOU EM QUAL TENTATIVA?"]?.toString() || null,
            appointment_date: parseDate(row["DATA CONSULTA"]?.toString()) || null,
            evaluation_result: row["RESULTADO AVALIAÇÃO"]?.toString() || null,
            status: status,
            budget_total: parseCurrency(row["ORÇAMENTO"]?.toString() || ""),
            notes: row["OBS"]?.toString() || null,
          };

          // Validação básica
          if (!leadData.name || !leadData.phone) {
            errorCount++;
            errors.push(`Linha ${i + 2}: Nome ou telefone ausente`);
            continue;
          }

          leadsToInsert.push(leadData);
          setProgress({ current: i + 1, total: jsonData.length });
        } catch (error: any) {
          errorCount++;
          errors.push(`Linha ${i + 2}: ${error.message}`);
        }
      }

      // Inserir tudo de uma vez (batch insert)
      if (leadsToInsert.length > 0) {
        const { error } = await supabase.from("leads").insert(leadsToInsert);

        if (error) {
          console.error("Error inserting leads:", error);
          toast.error(`Erro ao inserir leads: ${error.message}`);
          setResult({ success: 0, errors: jsonData.length });
        } else {
          successCount = leadsToInsert.length;
          setResult({ success: successCount, errors: errorCount });
          toast.success(`${successCount} leads importados com sucesso!`);
          
          // Limpar input e fechar diálogo após 2s
          event.target.value = "";
          setTimeout(() => {
            setIsOpen(false);
            setResult(null);
          }, 2000);
        }
      } else {
        toast.error("Nenhum lead válido para importar");
        setResult({ success: 0, errors: errorCount });
      }

      // Mostrar erros se houver
      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach(err => toast.error(err));
      } else if (errors.length > 5) {
        toast.error(`${errorCount} linhas com erro. Verifique o console.`);
        console.error("Erros de importação:", errors);
      }

    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Erro ao ler arquivo Excel");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads do Excel</DialogTitle>
          <DialogDescription>
            Selecione o arquivo Excel com os leads para importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isImporting || !sources || !procedures}
          />

          {(!sources || !procedures) && (
            <p className="text-sm text-yellow-600">
              Aguardando carregamento de fontes e procedimentos...
            </p>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  Importando... {progress.current} de {progress.total}
                </span>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {result.success} leads importados com sucesso
                </span>
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {result.errors} linhas com erro
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
