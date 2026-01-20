import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { formatPhone, parseDate, parseCurrency } from "@/lib/supabase";

interface ImportRecord {
  phone: string;
  name: string | null;
  email: string | null;
  source_name: string | null;
  registration_date: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  budget_paid: number | null;
  total_atendimentos: number;
  total_agendamentos: number;
  medical_history: string | null;
  // New financial metrics
  total_orcamentos: number;
  total_vendas: number;
  soma_valor_vendas: number | null;
  soma_valor_atendimentos: number | null;
  ultima_venda_data: string | null;
  ultima_venda_valor: number | null;
  ultima_venda_forma_pagamento: string | null;
  valor_contratado: number | null;
  valor_nao_contratado: number | null;
  data_contratacao: string | null;
  // Detailed history JSON
  agendamentos_json: unknown[] | null;
  atendimentos_json: unknown[] | null;
  orcamentos_json: unknown[] | null;
  vendas_json: unknown[] | null;
}

interface ImportResults {
  leads_created: number;
  leads_updated: number;
  patients_created: number;
  patients_updated: number;
  sources_created: number;
  errors: string[];
}

interface PreviewData {
  totalRecords: number;
  leadsCount: number;
  patientsCount: number;
  sampleRecords: ImportRecord[];
}

const BATCH_SIZE = 100;

export function useSpreadsheetImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ImportRecord[]>([]);

  const cleanCPF = (cpf: string | null): string | null => {
    if (!cpf) return null;
    return cpf.replace(/\D/g, "");
  };

  const parseExcelFile = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Get the first sheet (PACIENTES/LEADS PRINCIPAIS)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const records: ImportRecord[] = [];
      let leadsCount = 0;
      let patientsCount = 0;

      for (const row of jsonData as Record<string, unknown>[]) {
        // Get phone number
        const rawPhone = String(row["pk_celular"] || "").replace(/\D/g, "");
        if (!rawPhone || rawPhone.length < 10) continue;

        // Skip marketing records
        const name = row["NOME"] as string;
        if (name && /^\(\w+\)\s*MARKETING$/i.test(name)) continue;

        // Format phone with country code
        const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;

        // Parse data
        const totalAtendimentos = Number(row["total_atendimentos"]) || 0;
        const totalAgendamentos = Number(row["total_agendamentos"]) || 0;
        const cpf = cleanCPF(row["CPF"] as string);
        const birthDate = parseDate(row["DATA NASCIMENTO"] as string | number);
        const address = row["ENDEREÇO"] as string | null;

        // Determine if patient
        const isPatient = totalAtendimentos > 0 || (cpf && birthDate && address);

        if (isPatient) {
          patientsCount++;
        } else {
          leadsCount++;
        }

        // Build notes from various fields
        const noteParts: string[] = [];
        if (row["PROFISSÃO"]) noteParts.push(`Profissão: ${row["PROFISSÃO"]}`);
        if (row["RG"]) noteParts.push(`RG: ${row["RG"]}`);

        // Parse budget
        let budgetPaid: number | null = null;
        const somaVendas = row["soma_valor_vendas"];
        if (typeof somaVendas === "number") {
          budgetPaid = somaVendas;
        } else if (typeof somaVendas === "string") {
          budgetPaid = parseCurrency(somaVendas);
        }

        // Parse new financial fields
        const totalOrcamentos = Number(row["total_orcamentos"]) || 0;
        const totalVendas = Number(row["total_vendas"]) || 0;
        let somaValorVendas: number | null = null;
        const vendas = row["soma_valor_vendas"];
        if (typeof vendas === "number") {
          somaValorVendas = vendas;
        } else if (typeof vendas === "string") {
          somaValorVendas = parseCurrency(vendas);
        }

        let somaValorAtendimentos: number | null = null;
        const atendimentos = row["soma_valor_atendimentos"];
        if (typeof atendimentos === "number") {
          somaValorAtendimentos = atendimentos;
        } else if (typeof atendimentos === "string") {
          somaValorAtendimentos = parseCurrency(atendimentos);
        }

        const ultimaVendaData = parseDate(row["ultima_venda__data"] as string | number);
        let ultimaVendaValor: number | null = null;
        const vendaValor = row["ultima_venda__valor"];
        if (typeof vendaValor === "number") {
          ultimaVendaValor = vendaValor;
        } else if (typeof vendaValor === "string") {
          ultimaVendaValor = parseCurrency(vendaValor);
        }
        const ultimaVendaFormaPagamento = (row["ultima_venda__forma pagamento"] as string) || null;

        let valorContratado: number | null = null;
        const contratado = row["ultimo_orcamento__valor contratado"];
        if (typeof contratado === "number") {
          valorContratado = contratado;
        } else if (typeof contratado === "string") {
          valorContratado = parseCurrency(contratado);
        }

        let valorNaoContratado: number | null = null;
        const naoContratado = row["ultimo_orcamento__valor não contratado"];
        if (typeof naoContratado === "number") {
          valorNaoContratado = naoContratado;
        } else if (typeof naoContratado === "string") {
          valorNaoContratado = parseCurrency(naoContratado);
        }

        const dataContratacao = parseDate(row["ultimo_orcamento__data contração"] as string | number);

        // Parse detailed history JSON columns
        const parseJsonColumn = (value: unknown): unknown[] | null => {
          if (!value) return null;
          if (Array.isArray(value)) return value;
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              return Array.isArray(parsed) ? parsed : null;
            } catch {
              return null;
            }
          }
          return null;
        };

        const agendamentosJson = parseJsonColumn(row["agendamentos_json"]);
        const atendimentosJson = parseJsonColumn(row["atendimentos_json"]);
        const orcamentosJson = parseJsonColumn(row["orcamentos_json"]);
        const vendasJson = parseJsonColumn(row["vendas_json"]);

        records.push({
          phone,
          name: name || null,
          email: (row["EMAIL"] as string) || null,
          source_name: (row["ORIGEM"] as string) || null,
          registration_date: parseDate(row["DATA CADASTRO"] as string | number),
          cpf,
          birth_date: birthDate,
          address,
          city: (row["CIDADE"] as string) || null,
          state: (row["ESTADO"] as string) || null,
          zip_code: (row["CEP"] as string)?.replace(/\D/g, "") || null,
          emergency_contact_name: (row["NOME RESPONSÁVEL"] as string) || null,
          emergency_contact_phone: row["TEL RESPONSÁVEL"]
            ? formatPhone(String(row["TEL RESPONSÁVEL"]))
            : null,
          notes: noteParts.length > 0 ? noteParts.join(" | ") : null,
          budget_paid: budgetPaid,
          total_atendimentos: totalAtendimentos,
          total_agendamentos: totalAgendamentos,
          medical_history: null,
          // New financial metrics
          total_orcamentos: totalOrcamentos,
          total_vendas: totalVendas,
          soma_valor_vendas: somaValorVendas,
          soma_valor_atendimentos: somaValorAtendimentos,
          ultima_venda_data: ultimaVendaData,
          ultima_venda_valor: ultimaVendaValor,
          ultima_venda_forma_pagamento: ultimaVendaFormaPagamento,
          valor_contratado: valorContratado,
          valor_nao_contratado: valorNaoContratado,
          data_contratacao: dataContratacao,
          // Detailed history JSON
          agendamentos_json: agendamentosJson,
          atendimentos_json: atendimentosJson,
          orcamentos_json: orcamentosJson,
          vendas_json: vendasJson,
        });
      }

      setParsedRecords(records);
      setPreviewData({
        totalRecords: records.length,
        leadsCount,
        patientsCount,
        sampleRecords: records.slice(0, 5),
      });
      setProgress(100);
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast.error("Erro ao processar arquivo Excel");
    } finally {
      setIsProcessing(false);
    }
  };

  const importRecords = async (organizationId: string): Promise<void> => {
    if (parsedRecords.length === 0) {
      toast.error("Nenhum registro para importar");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    const totalBatches = Math.ceil(parsedRecords.length / BATCH_SIZE);
    const aggregatedResults: ImportResults = {
      leads_created: 0,
      leads_updated: 0,
      patients_created: 0,
      patients_updated: 0,
      sources_created: 0,
      errors: [],
    };

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = parsedRecords.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

        const { data, error } = await supabase.functions.invoke(
          "import-spreadsheet",
          {
            body: {
              organization_id: organizationId,
              records: batch,
            },
          }
        );

        if (error) {
          console.error("Batch error:", error);
          aggregatedResults.errors.push(`Batch ${i + 1}: ${error.message}`);
        } else if (data?.results) {
          aggregatedResults.leads_created += data.results.leads_created || 0;
          aggregatedResults.leads_updated += data.results.leads_updated || 0;
          aggregatedResults.patients_created +=
            data.results.patients_created || 0;
          aggregatedResults.patients_updated +=
            data.results.patients_updated || 0;
          aggregatedResults.sources_created +=
            data.results.sources_created || 0;
          aggregatedResults.errors.push(...(data.results.errors || []));
        }

        setProgress(Math.round(((i + 1) / totalBatches) * 100));
      }

      setResults(aggregatedResults);

      if (aggregatedResults.errors.length === 0) {
        toast.success(
          `Importação concluída! ${aggregatedResults.leads_created} leads criados, ${aggregatedResults.leads_updated} leads atualizados, ${aggregatedResults.patients_created} pacientes criados, ${aggregatedResults.patients_updated} pacientes atualizados.`
        );
      } else {
        toast.warning(
          `Importação concluída com ${aggregatedResults.errors.length} erros.`
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erro ao importar registros");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPreviewData(null);
    setResults(null);
    setParsedRecords([]);
    setProgress(0);
  };

  return {
    isProcessing,
    progress,
    previewData,
    results,
    parsedRecords,
    parseExcelFile,
    importRecords,
    reset,
  };
}
