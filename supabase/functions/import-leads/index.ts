import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Iniciando importação de leads...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Criar novas fontes necessárias
    console.log("Criando novas fontes...");
    const newSources = [
      { name: "Facebook - Anúncios", channel: "online" },
      { name: "Instagram - Anúncios", channel: "online" },
      { name: "Retroativo", channel: "outros" }
    ];

    for (const source of newSources) {
      const { error } = await supabase
        .from('sources')
        .upsert({ name: source.name, channel: source.channel }, { onConflict: 'name' });
      if (error) console.error(`Erro ao criar fonte ${source.name}:`, error);
    }

    // 2. Buscar mapeamento de fontes e procedimentos
    console.log("Buscando fontes e procedimentos...");
    const { data: sources } = await supabase.from('sources').select('id, name');
    const { data: procedures } = await supabase.from('procedures').select('id, name');

    const sourceMap = new Map(sources?.map(s => [s.name.toLowerCase(), s.id]) || []);
    const procedureMap = new Map(procedures?.map(p => [p.name.toLowerCase(), p.id]) || []);

    console.log(`Fontes carregadas: ${sourceMap.size}, Procedimentos: ${procedureMap.size}`);

    // 3. Ler arquivo Excel
    console.log("Lendo arquivo Excel...");
    const excelPath = new URL('./leads-data.xlsx', import.meta.url).pathname;
    const fileData = await Deno.readFile(excelPath);
    const workbook = XLSX.read(fileData, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Total de linhas no Excel: ${rawData.length}`);

    // 4. Processar e normalizar dados
    const leads = [];
    let processed = 0;
    let skipped = 0;

    for (const row of rawData) {
      // Pular linhas vazias ou cabeçalhos repetidos
      if (!row.TELEFONE || row.TELEFONE === 'TELEFONE') {
        skipped++;
        continue;
      }

      try {
        // Normalizar nome
        let name = row.NOME?.trim() || "Lead sem nome";
        if (name.toUpperCase() === "SEM NOME") {
          name = "Lead sem nome";
        }

        // Normalizar telefone (remover caracteres especiais e adicionar código do país)
        let phone = row.TELEFONE.toString().replace(/\D/g, '');
        if (!phone.startsWith('55') && phone.length >= 10) {
          phone = '55' + phone;
        }

        // Converter data (DD/MM/YYYY -> YYYY-MM-DD)
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

        // Mapear interesse/procedimento
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
        } else if (statusValue.includes('não agendou') || statusValue.includes('agendar')) {
          status = 'novo_lead';
        }

        // Converter orçamento (remover R$, pontos e vírgulas)
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

        // Agendamento
        const scheduled = !!row["AGENDOU EM QUAL CONTATO"];
        const scheduledOnAttempt = row["AGENDOU EM QUAL CONTATO"]?.toString() || null;

        // Construir objeto lead
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
          scheduled,
          scheduled_on_attempt: scheduledOnAttempt,
          appointment_date: appointmentDate,
          evaluation_result: row.AVALIAÇÃO?.toString() || null,
          budget_total: budgetTotal,
          budget_paid: budgetPaid,
          notes: row.OBSERVAÇÃO?.toString() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        leads.push(lead);
        processed++;
      } catch (error) {
        console.error(`Erro ao processar linha ${processed + skipped}:`, error);
        skipped++;
      }
    }

    console.log(`Leads processados: ${processed}, Pulados: ${skipped}`);

    // 5. Inserir leads em lotes
    const BATCH_SIZE = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      console.log(`Inserindo lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leads.length / BATCH_SIZE)}...`);
      
      const { error } = await supabase.from('leads').insert(batch);
      
      if (error) {
        console.error(`Erro ao inserir lote:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Importação concluída! Inseridos: ${inserted}, Erros: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        total_rows: rawData.length,
        processed,
        skipped,
        inserted,
        errors,
        message: `Importação concluída com sucesso! ${inserted} leads inseridos.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
