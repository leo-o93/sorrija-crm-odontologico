import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface Patient {
  id: string;
  lead_id?: string;
  name: string;
  email?: string;
  phone: string;
  birth_date?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientInput {
  lead_id?: string;
  name: string;
  email?: string;
  phone: string;
  birth_date?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
  id: string;
}

export function usePatients(filters?: { search?: string; active?: boolean }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["patients", currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("patients")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (filters?.active !== undefined) {
        query = query.eq("active", filters.active);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreatePatientInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");
      
      const { data, error } = await supabase.from("patients").insert([{
        ...input,
        organization_id: currentOrganization.id
      }]).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar paciente");
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePatientInput) => {
      const { data, error } = await supabase
        .from("patients")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar paciente");
    },
  });
}

export function useConvertLeadToPatient() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");

      // Get lead data
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (leadError) throw leadError;

      // Create patient from lead
      const patientData: CreatePatientInput = {
        lead_id: lead.id,
        name: lead.name,
        phone: lead.phone,
        notes: lead.notes || undefined,
      };

      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert([{
          ...patientData,
          organization_id: currentOrganization.id
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // Update lead status
      const { error: updateError } = await supabase
        .from("leads")
        .update({ status: "em_tratamento" })
        .eq("id", leadId);

      if (updateError) throw updateError;

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead convertido em paciente com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao converter lead em paciente");
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir paciente");
    },
  });
}
