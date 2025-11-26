import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Lead {
  id: string;
  name: string;
  phone: string;
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
  sources?: { name: string };
  procedures?: { name: string };
}

export function useLeads(filters?: {
  status?: string;
  source_id?: string;
  interest_id?: string;
  search?: string;
}) {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ["leads", filters, currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return [];
      }

      let query = supabase
        .from("leads")
        .select(`
          *,
          sources (name),
          procedures (name)
        `)
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.source_id) {
        query = query.eq("source_id", filters.source_id);
      }

      if (filters?.interest_id) {
        query = query.eq("interest_id", filters.interest_id);
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
      const { error } = await supabase.from("leads").insert([{
        ...lead,
        organization_id: currentOrganization?.id,
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
    mutationFn: async ({ id, ...updates }: UpdateLeadInput) => {
      const { error } = await supabase
        .from("leads")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.success("Lead atualizado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao atualizar lead");
    },
  });
}
