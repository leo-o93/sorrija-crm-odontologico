import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePaginatedQuery, PaginationOptions } from "@/hooks/usePaginatedQuery";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  registration_date: string;
  source_id: string | null;
  interest_id: string | null;
  first_contact_channel: string | null;
  first_contact_date: string | null;
  second_contact_channel: string | null;
  second_contact_date: string | null;
  third_contact_channel: string | null;
  third_contact_date: string | null;
  scheduled: boolean;
  scheduled_on_attempt: string | null;
  appointment_date: string | null;
  evaluation_result: string | null;
  status: string;
  budget_total: number | null;
  budget_paid: number | null;
  notes: string | null;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  temperature: string | null;
  hot_substatus: string | null;
  last_interaction_at: string | null;
  follow_up_count: number | null;
  no_show_count: number | null;
  lost_reason: string | null;
  triggered_by: string | null;
  // Financial metrics
  total_appointments: number | null;
  total_quotes: number | null;
  total_sales: number | null;
  total_revenue: number | null;
  last_sale_date: string | null;
  last_sale_amount: number | null;
  last_sale_payment_method: string | null;
  contracted_value: number | null;
  non_contracted_value: number | null;
  // Detailed history JSON
  appointments_history: unknown[] | null;
  attendances_history: unknown[] | null;
  quotes_history: unknown[] | null;
  sales_history: unknown[] | null;
  sources?: { name: string };
  procedures?: { name: string };
}

export function useLeads(filters?: {
  status?: string;
  source_id?: string;
  interest_id?: string;
  search?: string;
  temperature?: string;
  hot_substatus?: string;
}) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["leads", currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("leads")
        .select(`
          *,
          sources (name),
          procedures (name)
        `)
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.source_id) {
        query = query.eq("source_id", filters.source_id);
      }

      if (filters?.interest_id) {
        query = query.eq("interest_id", filters.interest_id);
      }

      if (filters?.temperature) {
        query = query.eq("temperature", filters.temperature);
      }

      if (filters?.hot_substatus) {
        query = query.eq("hot_substatus", filters.hot_substatus);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar leads");
        throw error;
      }

      return data as Lead[];
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("Status atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source_id?: string;
  interest_id?: string;
  notes?: string;
  status?: string;
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (lead: CreateLeadInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { error } = await supabase.from("leads").insert([{
        ...lead,
        organization_id: currentOrganization.id
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("Lead criado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar lead");
    },
  });
}

export interface UpdateLeadInput {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  source_id?: string;
  interest_id?: string;
  notes?: string;
  status?: string;
  first_contact_channel?: string;
  first_contact_date?: string;
  second_contact_channel?: string;
  second_contact_date?: string;
  third_contact_channel?: string;
  third_contact_date?: string;
  scheduled?: boolean;
  scheduled_on_attempt?: string;
  appointment_date?: string;
  evaluation_result?: string;
  budget_total?: number;
  budget_paid?: number;
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLeadInput) => {
      const { data, error } = await supabase
        .from("leads")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar lead");
    },
  });
}

export function useLeadsPaginated(options: PaginationOptions) {
  const { currentOrganization } = useOrganization();

  return usePaginatedQuery<Lead>({
    table: "leads",
    select: `
      *,
      sources (name),
      procedures (name)
    `,
    organizationId: currentOrganization?.id,
    options,
    queryKey: ["leads-paginated", currentOrganization?.id, options],
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir lead");
    },
  });
}

export function useDeleteLeadComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      // 1. Fetch conversations linked to this lead
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("lead_id", leadId);

      const conversationIds = conversations?.map((c) => c.id) || [];

      // 2. Delete messages from conversations
      if (conversationIds.length > 0) {
        const { error: messagesError } = await supabase
          .from("messages")
          .delete()
          .in("conversation_id", conversationIds);
        if (messagesError) throw messagesError;
      }

      // 3. Delete conversations
      const { error: conversationsError } = await supabase
        .from("conversations")
        .delete()
        .eq("lead_id", leadId);
      if (conversationsError) throw conversationsError;

      // 4. Delete lead interactions
      const { error: interactionsError } = await supabase
        .from("lead_interactions")
        .delete()
        .eq("lead_id", leadId);
      if (interactionsError) throw interactionsError;

      // 5. Delete appointments
      const { error: appointmentsError } = await supabase
        .from("appointments")
        .delete()
        .eq("lead_id", leadId);
      if (appointmentsError) throw appointmentsError;

      // 6. Delete AI suggestions
      const { error: aiSuggestionsError } = await supabase
        .from("ai_suggestions")
        .delete()
        .eq("lead_id", leadId);
      if (aiSuggestionsError) throw aiSuggestionsError;

      // 7. Fetch and delete quotes and related items
      const { data: quotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("lead_id", leadId);

      const quoteIds = quotes?.map((q) => q.id) || [];

      if (quoteIds.length > 0) {
        // Delete quote payments
        const { error: paymentsError } = await supabase
          .from("quote_payments")
          .delete()
          .in("quote_id", quoteIds);
        if (paymentsError) throw paymentsError;

        // Delete quote items
        const { error: itemsError } = await supabase
          .from("quote_items")
          .delete()
          .in("quote_id", quoteIds);
        if (itemsError) throw itemsError;

        // Delete quotes
        const { error: quotesError } = await supabase
          .from("quotes")
          .delete()
          .in("id", quoteIds);
        if (quotesError) throw quotesError;
      }

      // 8. Finally, delete the lead
      const { error: leadError } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId);
      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Lead e todos os dados relacionados excluídos com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir lead e dados relacionados");
    },
  });
}
