import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ExcelRow {
  NOME?: string;
  TELEFONE?: string;
  DATA?: string;
  FONTE?: string;
  INTERESSE?: string;
  "1º CONTATO"?: string;
  "2º CONTATO"?: string;
  "3º CONTATO"?: string;
  "AGENDOU EM QUAL CONTATO"?: string;
  "DATA DA AGENDA"?: string;
  AVALIAÇÃO?: string;
  STATUS?: string;
  "ORÇAMENTO TOTAL"?: string;
  "ORÇAMENTO PAGO"?: string;
  OBSERVAÇÃO?: string;
}

export default function ExecuteImport() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("Preparando importação...");
  const [isComplete, setIsComplete] = useState(false);
  const [stats, setStats] = useState<{ inserted: number; errors: number } | null>(null);

  useEffect(() => {
    executeImport();
  }, []);

  const executeImport = async () => {
    try {
      setStatus("Carregando mapeamentos...");
      setProgress(5);

      // Buscar fontes e procedimentos
      const { data: sources } = await supabase.from('sources').select('id, name');
      const { data: procedures } = await supabase.from('procedures').select('id, name');

      const sourceMap = new Map(sources?.map(s => [s.name.toLowerCase(), s.id]) || []);
      const procedureMap = new Map(procedures?.map(p => [p.name.toLowerCase(), p.id]) || []);

      setStatus("Lendo arquivo Excel...");
      setProgress(10);

      // Ler arquivo Excel
      const response = await fetch('/src/data/leads-import.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      setStatus(`Processando ${rawData.length} linhas...`);
      setProgress(20);

      // Processar dados
      const leads = [];
      let processed = 0;

      for (const row of rawData) {
        // Pular linhas vazias ou cabeçalhos
        if (!row.TELEFONE || row.TELEFONE === 'TELEFONE') continue;

        try {
          // Normalizar nome
          let name = row.NOME?.trim() || "Lead sem nome";
          if (name.toUpperCase() === "SEM NOME") name = "Lead sem nome";

          // Normalizar telefone
          let phone = row.TELEFONE.toString().replace(/\D/g, '');
          if (!phone.startsWith('55') && phone.length >= 10) {
            phone = '55' + phone;
          }

          // Converter data
          let registrationDate = new Date().toISOString().split('T')[0];
          if (row.DATA) {
            const dateParts = row.DATA.toString().split('/');
            if (dateParts.length === 3) {
              registrationDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            }
          }

          // Mapear fonte
          let sourceId = null;
          if (row.FONTE) {
            const sourceName = row.FONTE.toLowerCase().trim();
            sourceId = sourceMap.get(sourceName) || 
                       sourceMap.get(sourceName.replace(' - ', ' ')) ||
                       sourceMap.get(sourceName.split(' - ')[0]) || null;
          }

          // Mapear interesse
          let interestId = null;
          if (row.INTERESSE) {
            const interestName = row.INTERESSE.toLowerCase().trim();
            interestId = procedureMap.get(interestName) ||
                         procedureMap.get(interestName.replace('prótese flexível', 'protese flexivel')) || null;
          }

          // Mapear status
          let status = 'novo_lead';
          const statusValue = row.STATUS?.toLowerCase().trim() || '';
          if (statusValue.includes('ag.data') || statusValue.includes('agendado')) {
            status = 'agendado';
          } else if (statusValue.includes('fechou') || statusValue.includes('pós-venda')) {
            status = 'convertido';
          } else if (statusValue.includes('faltam') || statusValue.includes('remarcar') || 
                     statusValue.includes('faltou') || statusValue.includes('cancelou') ||
                     statusValue.includes('fechou parte')) {
            status = 'em_negociacao';
          } else if (statusValue.includes('perdido') || statusValue.includes('mora longe') || 
                     statusValue.includes('resgatar') || statusValue.includes('não fechou')) {
            status = 'perdido';
          }

          // Converter orçamento
          let budgetTotal = null;
          if (row["ORÇAMENTO TOTAL"]) {
            const budgetStr = row["ORÇAMENTO TOTAL"].toString()
              .replace('R$', '')
              .replace(/\s/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            budgetTotal = parseFloat(budgetStr) || null;
          }

          let budgetPaid = null;
          if (row["ORÇAMENTO PAGO"]) {
            const paidStr = row["ORÇAMENTO PAGO"].toString()
              .replace('R$', '')
              .replace(/\s/g, '')
              .replace(/\./g, '')
              .replace(',', '.');
            budgetPaid = parseFloat(paidStr) || null;
          }

          // Data da agenda
          let appointmentDate = null;
          if (row["DATA DA AGENDA"]) {
            const dateParts = row["DATA DA AGENDA"].toString().split('/');
            if (dateParts.length === 3) {
              appointmentDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            }
          }

          const lead = {
            name,
            phone,
            registration_date: registrationDate,
            source_id: sourceId,
            interest_id: interestId,
            status,
            first_contact_channel: row["1º CONTATO"]?.toString() || null,
            second_contact_channel: row["2º CONTATO"]?.toString() || null,
            third_contact_channel: row["3º CONTATO"]?.toString() || null,
            scheduled: !!row["AGENDOU EM QUAL CONTATO"],
            scheduled_on_attempt: row["AGENDOU EM QUAL CONTATO"]?.toString() || null,
            appointment_date: appointmentDate,
            evaluation_result: row.AVALIAÇÃO?.toString() || null,
            budget_total: budgetTotal,
            budget_paid: budgetPaid,
            notes: row.OBSERVAÇÃO?.toString() || null,
          };

          leads.push(lead);
          processed++;
        } catch (error) {
          console.error(`Erro ao processar linha:`, error);
        }

        // Atualizar progresso
        if (processed % 100 === 0) {
          setProgress(20 + (processed / rawData.length) * 50);
          setStatus(`Processados ${processed} de ${rawData.length} leads...`);
        }
      }

      setStatus(`Enviando ${leads.length} leads para importação...`);
      setProgress(70);

      // Enviar para Edge Function
      const { data, error } = await supabase.functions.invoke('import-leads', {
        body: { leads }
      });

      if (error) throw error;

      setProgress(100);
      setStatus("Importação concluída!");
      setStats({ inserted: data.inserted, errors: data.errors });
      setIsComplete(true);

      toast.success(`${data.inserted} leads importados com sucesso!`);

    } catch (error) {
      console.error('Erro na importação:', error);
      setStatus("Erro na importação");
      toast.error("Erro ao importar leads");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Importação de Leads</CardTitle>
          <CardDescription>
            Importando dados da planilha para o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{status}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {stats && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Leads importados:</span>
                <span className="font-bold text-green-600">{stats.inserted}</span>
              </div>
              {stats.errors > 0 && (
                <div className="flex justify-between">
                  <span>Erros:</span>
                  <span className="font-bold text-red-600">{stats.errors}</span>
                </div>
              )}
            </div>
          )}

          {isComplete && (
            <Button onClick={() => navigate("/crm")} className="w-full">
              Ir para o CRM
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
