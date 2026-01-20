import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface ImportState {
  isImporting: boolean;
  progress: number;
  currentBatch: number;
  totalBatches: number;
  results: ImportResults | null;
  error: string | null;
}

interface ImportContextType {
  state: ImportState;
  startImport: (records: ImportRecord[], organizationId: string) => Promise<void>;
  reset: () => void;
}

const BATCH_SIZE = 50; // Smaller batch for better reliability

const initialState: ImportState = {
  isImporting: false,
  progress: 0,
  currentBatch: 0,
  totalBatches: 0,
  results: null,
  error: null,
};

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ImportState>(initialState);
  const abortRef = useRef(false);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    }
  };

  const importWithRetry = async (
    batch: ImportRecord[],
    organizationId: string,
    retries = 3
  ) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "import-spreadsheet",
          {
            body: {
              organization_id: organizationId,
              records: batch,
            },
          }
        );

        if (error) throw error;
        return data;
      } catch (error) {
        console.error(`Batch attempt ${attempt} failed:`, error);
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  };

  const startImport = useCallback(
    async (records: ImportRecord[], organizationId: string) => {
      if (state.isImporting) {
        toast.error("Uma importação já está em andamento");
        return;
      }

      abortRef.current = false;
      await requestNotificationPermission();

      const totalBatches = Math.ceil(records.length / BATCH_SIZE);
      const aggregatedResults: ImportResults = {
        leads_created: 0,
        leads_updated: 0,
        patients_created: 0,
        patients_updated: 0,
        sources_created: 0,
        errors: [],
      };

      setState({
        isImporting: true,
        progress: 0,
        currentBatch: 0,
        totalBatches,
        results: null,
        error: null,
      });

      try {
        for (let i = 0; i < totalBatches; i++) {
          if (abortRef.current) break;

          const batch = records.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

          try {
            const data = await importWithRetry(batch, organizationId);

            if (data?.results) {
              aggregatedResults.leads_created += data.results.leads_created || 0;
              aggregatedResults.leads_updated += data.results.leads_updated || 0;
              aggregatedResults.patients_created += data.results.patients_created || 0;
              aggregatedResults.patients_updated += data.results.patients_updated || 0;
              aggregatedResults.sources_created += data.results.sources_created || 0;
              aggregatedResults.errors.push(...(data.results.errors || []));
            }
          } catch (error: any) {
            console.error("Batch error:", error);
            aggregatedResults.errors.push(`Batch ${i + 1}: ${error.message}`);
          }

          const progress = Math.round(((i + 1) / totalBatches) * 100);
          setState((prev) => ({
            ...prev,
            progress,
            currentBatch: i + 1,
          }));

          // Save progress to localStorage for recovery
          localStorage.setItem(
            "import_progress",
            JSON.stringify({
              completed_batches: i + 1,
              total_batches: totalBatches,
              aggregated_results: aggregatedResults,
              timestamp: Date.now(),
            })
          );
        }

        setState((prev) => ({
          ...prev,
          isImporting: false,
          results: aggregatedResults,
        }));

        localStorage.removeItem("import_progress");

        // Send notifications
        const successMessage = `${aggregatedResults.patients_created} pacientes criados, ${aggregatedResults.patients_updated} atualizados, ${aggregatedResults.leads_created} leads criados, ${aggregatedResults.leads_updated} atualizados.`;

        if (aggregatedResults.errors.length === 0) {
          toast.success("Importação concluída!", {
            description: successMessage,
            duration: 10000,
          });
          sendNotification("Importação Concluída!", successMessage);
        } else {
          toast.warning(
            `Importação concluída com ${aggregatedResults.errors.length} erros.`,
            {
              description: successMessage,
              duration: 10000,
            }
          );
          sendNotification(
            "Importação Concluída com Erros",
            `${aggregatedResults.errors.length} erros encontrados`
          );
        }
      } catch (error: any) {
        console.error("Import error:", error);
        setState((prev) => ({
          ...prev,
          isImporting: false,
          error: error.message,
        }));
        toast.error("Erro crítico na importação");
        sendNotification("Erro na Importação", error.message);
      }
    },
    [state.isImporting]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(initialState);
    localStorage.removeItem("import_progress");
  }, []);

  return (
    <ImportContext.Provider value={{ state, startImport, reset }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImportContext() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error("useImportContext must be used within an ImportProvider");
  }
  return context;
}
