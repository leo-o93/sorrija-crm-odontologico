import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle, AlertCircle, Download, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, formatPhone, parseDate, parseDateTime, parseCurrency } from "@/lib/supabase";
import { toast } from "sonner";
import { useSources } from "@/hooks/useSources";
import { useProcedures } from "@/hooks/useProcedures";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LeadImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  
  const { data: sources } = useSources();
  const { data: procedures } = useProcedures();

  const downloadTemplate = () => {
    // Criar dados de exemplo
    const templateData = [
      {
        "NOME": "João Silva",
        "TELEFONE": "(11) 98765-4321",
        "DATA": "15/01/2024",
        "FONTE": sources?.[0]?.name || "Instagram",
        "INTERESSE": procedures?.[0]?.name || "Clareamento",
        "1º CONTATO": "WhatsApp",
        "DATA 1º CONTATO": "15/01/2024",
        "2º CONTATO": "",
        "DATA 2º CONTATO": "",
        "3º CONTATO": "",
        "DATA 3º CONTATO": "",
        "AGENDOU?": "Sim",
        "AGENDOU EM QUAL TENTATIVA?": "1ª tentativa",
        "DATA CONSULTA": "20/01/2024",
        "RESULTADO AVALIAÇÃO": "Aprovado",
        "STATUS": "agendado",
        "ORÇAMENTO": "R$ 1.500,00",
        "OBS": "Cliente interessado em clareamento"
      },
      {
        "NOME": "Maria Santos",
        "TELEFONE": "11987654321",
        "DATA": "16/01/2024",
        "FONTE": sources?.[1]?.name || "Google",
        "INTERESSE": procedures?.[1]?.name || "Implante",
        "1º CONTATO": "Telefone",
        "DATA 1º CONTATO": "16/01/2024",
        "2º CONTATO": "",
        "DATA 2º CONTATO": "",
        "3º CONTATO": "",
        "DATA 3º CONTATO": "",
        "AGENDOU?": "Não",
        "AGENDOU EM QUAL TENTATIVA?": "",
        "DATA CONSULTA": "",
        "RESULTADO AVALIAÇÃO": "",
        "STATUS": "1ª tentativa",
        "ORÇAMENTO": "",
        "OBS": ""
      }
    ];

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 20 }, // NOME
      { wch: 18 }, // TELEFONE
      { wch: 12 }, // DATA
      { wch: 15 }, // FONTE
      { wch: 15 }, // INTERESSE
      { wch: 12 }, // 1º CONTATO
      { wch: 18 }, // DATA 1º CONTATO
      { wch: 12 }, // 2º CONTATO
      { wch: 18 }, // DATA 2º CONTATO
      { wch: 12 }, // 3º CONTATO
      { wch: 18 }, // DATA 3º CONTATO
      { wch: 12 }, // AGENDOU?
      { wch: 25 }, // AGENDOU EM QUAL TENTATIVA?
      { wch: 15 }, // DATA CONSULTA
      { wch: 20 }, // RESULTADO AVALIAÇÃO
      { wch: 15 }, // STATUS
      { wch: 15 }, // ORÇAMENTO
      { wch: 30 }  // OBS
    ];
    ws['!cols'] = colWidths;

    // Fazer download
    XLSX.writeFile(wb, "modelo_importacao_leads.xlsx");
    toast.success("Modelo Excel baixado com sucesso!");
  };

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
            registration_date: parseDate(row["DATA"]) || new Date().toISOString().split('T')[0],
            source_id: source?.id || null,
            interest_id: interest?.id || null,
            first_contact_channel: row["1º CONTATO"]?.toString() || null,
            first_contact_date: parseDateTime(row["DATA 1º CONTATO"]) || null,
            second_contact_channel: row["2º CONTATO"]?.toString() || null,
            second_contact_date: parseDateTime(row["DATA 2º CONTATO"]) || null,
            third_contact_channel: row["3º CONTATO"]?.toString() || null,
            third_contact_date: parseDateTime(row["DATA 3º CONTATO"]) || null,
            scheduled: row["AGENDOU?"]?.toString().toLowerCase() === "sim",
            scheduled_on_attempt: row["AGENDOU EM QUAL TENTATIVA?"]?.toString() || null,
            appointment_date: parseDate(row["DATA CONSULTA"]) || null,
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
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
            disabled={!sources || !procedures}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Modelo Excel
          </Button>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-2">
              <p className="font-medium">Colunas obrigatórias:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>NOME</strong>: Nome completo do lead</li>
                <li><strong>TELEFONE</strong>: Número com DDD (formato livre)</li>
              </ul>
              
              <p className="font-medium mt-3">Formato de datas:</p>
              <p className="ml-2">DD/MM/AAAA (ex: 15/01/2024)</p>
              
              <p className="font-medium mt-3">Valores válidos para STATUS:</p>
              <p className="ml-2 text-xs">
                novo lead, 1ª tentativa, 2ª tentativa, 3ª tentativa, agendado, 
                compareceu, não compareceu, orçamento enviado, fechado, perdido
              </p>
              
              <p className="font-medium mt-3">Fontes disponíveis:</p>
              <p className="ml-2 text-xs">
                {sources?.map(s => s.name).join(", ") || "Carregando..."}
              </p>
            </AlertDescription>
          </Alert>
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
