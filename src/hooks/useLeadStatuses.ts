import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface LeadStatus {
  id: string;
  organization_id: string;
  name: string;
  title: string;
  color: string;
  position: number;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

export interface CreateLeadStatusInput {
  name: string;
  title: string;
  color: string;
  position?: number;
  is_default?: boolean;
}

export interface UpdateLeadStatusInput {
  id: string;
  name?: string;
  title?: string;
  color?: string;
  position?: number;
  is_default?: boolean;
  active?: boolean;
}

export function useLeadStatuses(includeInactive = false) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["lead_statuses", currentOrganization?.id, includeInactive],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("lead_statuses")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("position", { ascending: true });

      if (!includeInactive) {
        query = query.eq("active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LeadStatus[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useCreateLeadStatus() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateLeadStatusInput) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      // Get max position if not provided
      let position = input.position;
      if (position === undefined) {
        const { data: existingStatuses } = await supabase
          .from("lead_statuses")
          .select("position")
          .eq("organization_id", currentOrganization.id)
          .eq("active", true)
          .order("position", { ascending: false })
          .limit(1);

        position = existingStatuses && existingStatuses.length > 0 
          ? existingStatuses[0].position + 1 
          : 0;
      }

      const { data, error } = await supabase
        .from("lead_statuses")
        .insert({
          organization_id: currentOrganization.id,
          name: input.name,
          title: input.title,
          color: input.color,
          position,
          is_default: input.is_default ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_statuses"] });
      toast.success("Status criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating lead status:", error);
      toast.error("Erro ao criar status");
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLeadStatusInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("lead_statuses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_statuses"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating lead status:", error);
      toast.error("Erro ao atualizar status");
    },
  });
}

export function useDeleteLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Check if there are leads using this status
      const { data: statusData } = await supabase
        .from("lead_statuses")
        .select("name")
        .eq("id", id)
        .single();

      if (statusData) {
        const { data: leadsUsingStatus, error: leadsError } = await supabase
          .from("leads")
          .select("id")
          .eq("status", statusData.name)
          .limit(1);

        if (leadsError) throw leadsError;

        if (leadsUsingStatus && leadsUsingStatus.length > 0) {
          throw new Error("Existem leads usando este status. Mova-os para outro status antes de excluir.");
        }
      }

      // Soft delete by setting active to false
      const { error } = await supabase
        .from("lead_statuses")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_statuses"] });
      toast.success("Status excluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting lead status:", error);
      toast.error(error.message || "Erro ao excluir status");
    },
  });
}

export function useReorderLeadStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (statuses: { id: string; position: number }[]) => {
      // Update all positions in parallel
      const updates = statuses.map(({ id, position }) =>
        supabase
          .from("lead_statuses")
          .update({ position })
          .eq("id", id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error("Erro ao reordenar status");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_statuses"] });
      toast.success("Ordem atualizada!");
    },
    onError: (error) => {
      console.error("Error reordering lead statuses:", error);
      toast.error("Erro ao reordenar status");
    },
  });
}

export function useSetDefaultStatus() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (statusId: string) => {
      if (!currentOrganization?.id) {
        throw new Error("Organização não selecionada");
      }

      // First, remove default from all statuses
      await supabase
        .from("lead_statuses")
        .update({ is_default: false })
        .eq("organization_id", currentOrganization.id);

      // Then set the new default
      const { error } = await supabase
        .from("lead_statuses")
        .update({ is_default: true })
        .eq("id", statusId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead_statuses"] });
      toast.success("Status padrão definido!");
    },
    onError: (error) => {
      console.error("Error setting default status:", error);
      toast.error("Erro ao definir status padrão");
    },
  });
}
