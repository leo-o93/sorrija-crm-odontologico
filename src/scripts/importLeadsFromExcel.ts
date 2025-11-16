import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { formatPhone, parseDate, parseCurrency } from '@/lib/supabase';

interface ExcelRow {
  NOME?: string;
  TELEFONE?: string;
  DATA?: string;
  FONTE?: string;
  INTERESSE?: string;
  '1º CONTATO'?: string;
  '2º CONTATO'?: string;
  '3º CONTATO'?: string;
  'AGENDOU EM QUAL CONTATO'?: string;
  'DATA DA AGENDA'?: string;
  'AVALIAÇÃO'?: string;
  STATUS?: string;
  'ORÇAMENTO TOTAL'?: string;
  'ORÇAMENTO PAGO'?: string;
  'OBSERVAÇÃO'?: string;
}

// Mapeamento de fontes
const SOURCE_MAP: Record<string, string> = {
  'Facebook - Anúncios': 'facebook_ads',
  'Instagram - Anúncios': 'instagram_ads',
  'Retroativo': 'retroativo',
  'Facebook': 'd0302d62-78f8-4e7a-8d91-e8782fa51947',
  'Instagram': 'b6016ab4-4036-4220-a9fd-d709a7d5b39c',
  'Google': '4c59d932-f397-4c76-954f-0dba10e9e920',
  'Indicação': '1ef08c04-af55-41e8-9b6d-d6bc25611355',
  'WhatsApp': '49e6afaf-b1b4-446f-b290-4673d292c392',
  'Telefone': '4b4ed667-1dd7-46f0-a3b3-b4e28cc785df',
  'Site': 'fdfabf8f-0d1b-4fdb-9ac8-3a5167914bfb',
  'Campanha': 'c053d22e-9de1-4b54-82d0-8966aebcf90d',
  'Resgate': '72c78f44-e351-443c-9387-2e458268fdd8',
};

// Mapeamento de procedimentos
const PROCEDURE_MAP: Record<string, string> = {
  'PRÓTESE': '6d1bbbe2-c3e4-4b65-a3d4-8fc91ac721fc',
  'PRÓTESE FLEXÍVEL': '36e176a2-d21c-4c04-a5aa-bee35dea270f',
  'IMPLANTE': 'e68b46f3-26c9-43d0-afc4-e3f5a44bd57f',
  'LIMPEZA': 'a62d9063-b4f7-4131-a8a8-0644b7ffdd72',
  'CLAREAMENTO': '4c2ba170-187b-4bcc-81d2-24f6f2b665ab',
  'APARELHO': 'd06ddcf3-60aa-4760-a2ed-618b7ecd002b',
  'ORTODONTIA': '226c9d6d-a4b6-4aee-babc-239b55ec0ce3',
  'FACETA': '51795233-6bdc-4ea9-a2bd-50fb778f847a',
  'AVALIAÇÃO': '79fa7169-bf29-4bc8-9430-67d5ad8a05bd',
  'AVULSO': '3bcd478c-87b0-4462-9fda-560d28b1560b',
};

// Mapeamento de status
const STATUS_MAP: Record<string, string> = {
  'Ag.Data': 'agendado',
  'Agendar': 'novo_lead',
  'Não Agendou': 'novo_lead',
  'Pós-Venda': 'convertido',
  'Fechou': 'convertido',
  'Faltam-Procedimentos': 'em_negociacao',
  'Fechou Parte': 'em_negociacao',
  'Remarcar': 'em_negociacao',
  'Faltou': 'em_negociacao',
  'Cancelou': 'em_negociacao',
  'Perdido': 'perdido',
  'Mora longe': 'perdido',
  'Resgatar': 'perdido',
  'Não Fechou': 'perdido',
};

export async function importLeadsFromExcel() {
  console.log('Starting import process...');
  
  // Ler o arquivo Excel
  const response = await fetch('/src/data/leads-import.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

  console.log(`Found ${data.length} rows in Excel`);

  // Primeiro, adicionar as novas fontes se não existirem
  const newSources = [
    { name: 'Facebook - Anúncios', channel: 'paid' },
    { name: 'Instagram - Anúncios', channel: 'paid' },
    { name: 'Retroativo', channel: 'reactivation' },
  ];

  for (const source of newSources) {
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('name', source.name)
      .single();

    if (!existing) {
      const { data: newSource, error } = await supabase
        .from('sources')
        .insert([source])
        .select('id')
        .single();

      if (newSource) {
        SOURCE_MAP[source.name] = newSource.id;
        console.log(`Created source: ${source.name}`);
      }
    }
  }

  // Processar leads em lotes
  const BATCH_SIZE = 100;
  let processedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const leadsToInsert = [];

    for (const row of batch) {
      try {
        // Validação básica
        if (!row.NOME || !row.TELEFONE) {
          errorCount++;
          continue;
        }

        // Normalizar nome
        const name = row.NOME === 'SEM NOME' ? 'Lead sem nome' : row.NOME.trim();

        // Formatar telefone
        const phone = formatPhone(row.TELEFONE || '');
        if (!phone || phone.length < 10) {
          errorCount++;
          continue;
        }

        // Data de registro
        const registrationDate = parseDate(row.DATA || '') || new Date().toISOString().split('T')[0];

        // Mapear fonte
        let sourceId = null;
        if (row.FONTE) {
          sourceId = SOURCE_MAP[row.FONTE] || null;
        }

        // Mapear interesse/procedimento
        let interestId = null;
        if (row.INTERESSE) {
          const interesse = row.INTERESSE.toUpperCase().trim();
          interestId = PROCEDURE_MAP[interesse] || null;
        }

        // Contatos
        const firstContactChannel = row['1º CONTATO'] || null;
        const secondContactChannel = row['2º CONTATO'] || null;
        const thirdContactChannel = row['3º CONTATO'] || null;

        // Agendamento
        const scheduled = !!row['AGENDOU EM QUAL CONTATO'];
        const scheduledOnAttempt = row['AGENDOU EM QUAL CONTATO'] || null;
        const appointmentDate = parseDate(row['DATA DA AGENDA'] || '') || null;

        // Avaliação
        const evaluationResult = row['AVALIAÇÃO'] || null;

        // Status
        let status = 'novo_lead';
        if (row.STATUS) {
          status = STATUS_MAP[row.STATUS] || 'novo_lead';
        }

        // Orçamento
        const budgetTotal = parseCurrency(row['ORÇAMENTO TOTAL'] || '');
        const budgetPaid = parseCurrency(row['ORÇAMENTO PAGO'] || '');

        // Observações
        const notes = row['OBSERVAÇÃO'] || null;

        leadsToInsert.push({
          name,
          phone,
          registration_date: registrationDate,
          source_id: sourceId,
          interest_id: interestId,
          first_contact_channel: firstContactChannel,
          second_contact_channel: secondContactChannel,
          third_contact_channel: thirdContactChannel,
          scheduled,
          scheduled_on_attempt: scheduledOnAttempt,
          appointment_date: appointmentDate,
          evaluation_result: evaluationResult,
          status,
          budget_total: budgetTotal,
          budget_paid: budgetPaid,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        processedCount++;
      } catch (error) {
        console.error('Error processing row:', error);
        errorCount++;
      }
    }

    // Inserir lote no banco
    if (leadsToInsert.length > 0) {
      const { error } = await supabase.from('leads').insert(leadsToInsert);

      if (error) {
        console.error('Error inserting batch:', error);
        errorCount += leadsToInsert.length;
      } else {
        console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${leadsToInsert.length} leads`);
      }
    }
  }

  console.log('Import completed!');
  console.log(`Total processed: ${processedCount}`);
  console.log(`Total errors: ${errorCount}`);

  return {
    processed: processedCount,
    errors: errorCount,
  };
}
