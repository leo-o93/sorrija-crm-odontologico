import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  // Financial metrics
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
}

interface ImportRequest {
  organization_id: string;
  records: ImportRecord[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organization_id, records }: ImportRequest = await req.json();

    if (!organization_id || !records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: "Missing organization_id or records" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    const { data: isSuperAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!membership && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Access denied to organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing sources for this organization
    const { data: existingSources } = await supabase
      .from("sources")
      .select("id, name")
      .eq("organization_id", organization_id);

    const sourceMap = new Map<string, string>();
    existingSources?.forEach(s => {
      sourceMap.set(s.name.toUpperCase().trim(), s.id);
    });

    // Fetch default lead status
    const { data: defaultStatus } = await supabase
      .from("lead_statuses")
      .select("name")
      .eq("organization_id", organization_id)
      .eq("is_default", true)
      .single();

    const defaultStatusName = defaultStatus?.name || "novo_lead";

    // Process records
    const results = {
      leads_created: 0,
      leads_updated: 0,
      patients_created: 0,
      patients_updated: 0,
      sources_created: 0,
      errors: [] as string[],
      skipped: 0,
    };

    console.log(`Starting import of ${records.length} records for org ${organization_id}`);
    let processedCount = 0;

    for (const record of records) {
      processedCount++;
      
      try {
        // Skip invalid records
        if (!record.phone || record.phone.length < 10) {
          results.errors.push(`[${processedCount}] Invalid phone: ${record.phone}`);
          results.skipped++;
          continue;
        }

        // Skip marketing/test records
        if (record.name && /^\(\w+\)\s*MARKETING$/i.test(record.name)) {
          results.skipped++;
          console.log(`[${processedCount}] Skipping marketing record: ${record.name}`);
          continue;
        }

        // Get or create source
        let sourceId: string | null = null;
        if (record.source_name) {
          const sourceKey = record.source_name.toUpperCase().trim();
          if (sourceMap.has(sourceKey)) {
            sourceId = sourceMap.get(sourceKey)!;
          } else {
            // Create new source
            const { data: newSource, error: sourceError } = await supabase
              .from("sources")
              .insert({
                name: record.source_name.trim(),
                channel: "other",
                organization_id,
                active: true,
              })
              .select("id")
              .single();

            if (newSource && !sourceError) {
              sourceMap.set(sourceKey, newSource.id);
              sourceId = newSource.id;
              results.sources_created++;
            }
          }
        }

        // Determine if this is a patient (has atendimentos or complete patient data)
        const isPatient = record.total_atendimentos > 0 || 
          (record.cpf && record.birth_date && record.address);

        // Determine lead status and temperature
        let status = defaultStatusName;
        let temperature = "novo";

        if (isPatient) {
          status = "fechado";
          temperature = "quente";
        } else if (record.total_agendamentos > 0) {
          status = "agendado";
          temperature = "quente";
        }

        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("phone", record.phone)
          .eq("organization_id", organization_id)
          .single();

        let leadId: string;

        if (existingLead) {
          // Update existing lead
          const { error: updateError } = await supabase
            .from("leads")
            .update({
              name: record.name || undefined,
              email: record.email || undefined,
              source_id: sourceId || undefined,
              notes: record.notes || undefined,
              budget_paid: record.budget_paid || undefined,
              // Financial metrics
              total_appointments: record.total_agendamentos || 0,
              total_quotes: record.total_orcamentos || 0,
              total_sales: record.total_vendas || 0,
              total_revenue: record.soma_valor_vendas || 0,
              last_sale_date: record.ultima_venda_data,
              last_sale_amount: record.ultima_venda_valor,
              last_sale_payment_method: record.ultima_venda_forma_pagamento,
              contracted_value: record.valor_contratado || 0,
              non_contracted_value: record.valor_nao_contratado || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingLead.id);

          if (updateError) {
            results.errors.push(`Error updating lead ${record.phone}: ${updateError.message}`);
            continue;
          }

          leadId = existingLead.id;
          results.leads_updated++;
        } else {
          const { data: newLead, error: insertError } = await supabase
            .from("leads")
            .insert({
              phone: record.phone,
              name: record.name || "Sem nome",
              email: record.email,
              source_id: sourceId,
              organization_id,
              status,
              temperature,
              registration_date: record.registration_date || new Date().toISOString().split("T")[0],
              notes: record.notes,
              budget_paid: record.budget_paid,
              // Financial metrics
              total_appointments: record.total_agendamentos || 0,
              total_quotes: record.total_orcamentos || 0,
              total_sales: record.total_vendas || 0,
              total_revenue: record.soma_valor_vendas || 0,
              last_sale_date: record.ultima_venda_data,
              last_sale_amount: record.ultima_venda_valor,
              last_sale_payment_method: record.ultima_venda_forma_pagamento,
              contracted_value: record.valor_contratado || 0,
              non_contracted_value: record.valor_nao_contratado || 0,
            })
            .select("id")
            .single();

          if (insertError || !newLead) {
            results.errors.push(`Error creating lead ${record.phone}: ${insertError?.message}`);
            continue;
          }

          leadId = newLead.id;
          results.leads_created++;
        }

        // Create or update patient if applicable
        if (isPatient) {
          // Check if patient already exists
          const { data: existingPatient } = await supabase
            .from("patients")
            .select("id")
            .eq("phone", record.phone)
            .eq("organization_id", organization_id)
            .single();

          if (existingPatient) {
            // UPDATE existing patient with financial metrics
            const { error: updateError } = await supabase
              .from("patients")
              .update({
                name: record.name || undefined,
                email: record.email || undefined,
                cpf: record.cpf || undefined,
                birth_date: record.birth_date || undefined,
                address: record.address || undefined,
                city: record.city || undefined,
                state: record.state || undefined,
                zip_code: record.zip_code || undefined,
                emergency_contact_name: record.emergency_contact_name || undefined,
                emergency_contact_phone: record.emergency_contact_phone || undefined,
                medical_history: record.medical_history || undefined,
                notes: record.notes || undefined,
                lead_id: leadId,
                // Financial metrics
                total_appointments: record.total_agendamentos || 0,
                total_attendances: record.total_atendimentos || 0,
                total_quotes: record.total_orcamentos || 0,
                total_sales: record.total_vendas || 0,
                total_revenue: record.soma_valor_vendas || 0,
                last_sale_date: record.ultima_venda_data,
                last_sale_amount: record.ultima_venda_valor,
                last_sale_payment_method: record.ultima_venda_forma_pagamento,
                contracted_value: record.valor_contratado || 0,
                non_contracted_value: record.valor_nao_contratado || 0,
                contract_date: record.data_contratacao,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingPatient.id);

            if (updateError) {
              results.errors.push(`Error updating patient ${record.phone}: ${updateError.message}`);
            } else {
              results.patients_updated++;
            }
          } else {
            const { error: patientError } = await supabase
              .from("patients")
              .insert({
                phone: record.phone,
                name: record.name || "Sem nome",
                email: record.email,
                cpf: record.cpf,
                birth_date: record.birth_date,
                address: record.address,
                city: record.city,
                state: record.state,
                zip_code: record.zip_code,
                emergency_contact_name: record.emergency_contact_name,
                emergency_contact_phone: record.emergency_contact_phone,
                medical_history: record.medical_history,
                notes: record.notes,
                lead_id: leadId,
                organization_id,
                active: true,
                // Financial metrics
                total_appointments: record.total_agendamentos || 0,
                total_attendances: record.total_atendimentos || 0,
                total_quotes: record.total_orcamentos || 0,
                total_sales: record.total_vendas || 0,
                total_revenue: record.soma_valor_vendas || 0,
                last_sale_date: record.ultima_venda_data,
                last_sale_amount: record.ultima_venda_valor,
                last_sale_payment_method: record.ultima_venda_forma_pagamento,
                contracted_value: record.valor_contratado || 0,
                non_contracted_value: record.valor_nao_contratado || 0,
                contract_date: record.data_contratacao,
              });

            if (patientError) {
              results.errors.push(`Error creating patient ${record.phone}: ${patientError.message}`);
            } else {
              results.patients_created++;
            }
          }
        }
      } catch (recordError: unknown) {
        const errMsg = recordError instanceof Error ? recordError.message : String(recordError);
        console.error(`[${processedCount}] Error processing ${record.phone}:`, errMsg);
        results.errors.push(`[${processedCount}] Error processing ${record.phone}: ${errMsg}`);
      }
      
      // Log progress every 100 records
      if (processedCount % 100 === 0) {
        console.log(`Progress: ${processedCount}/${records.length} records processed`);
      }
    }

    console.log(`Import complete. Leads Created: ${results.leads_created}, Leads Updated: ${results.leads_updated}, Patients Created: ${results.patients_created}, Patients Updated: ${results.patients_updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        processed: records.length,
        summary: {
          total_processed: processedCount,
          leads_created: results.leads_created,
          leads_updated: results.leads_updated,
          patients_created: results.patients_created,
          patients_updated: results.patients_updated,
          sources_created: results.sources_created,
          skipped: results.skipped,
          errors_count: results.errors.length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Import error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
