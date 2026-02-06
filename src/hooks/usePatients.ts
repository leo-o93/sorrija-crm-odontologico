import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePaginatedQuery, PaginationOptions, PaginatedResult } from "@/hooks/usePaginatedQuery";
import type { Json } from "@/integrations/supabase/types";
import type {
  AppointmentHistoryItem,
  AttendanceHistoryItem,
  QuoteHistoryItem,
  SaleHistoryItem,
  NonContractedQuoteItem,
} from "@/types/history";

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
  patient_origin?: string;
  notes?: string;
  active: boolean;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  // Financial metrics
  total_appointments?: number | null;
  total_attendances?: number | null;
  total_quotes?: number | null;
  total_sales?: number | null;
  total_revenue?: number | null;
  last_sale_date?: string | null;
  last_sale_amount?: number | null;
  last_sale_payment_method?: string | null;
  contracted_value?: number | null;
  non_contracted_value?: number | null;
  contract_date?: string | null;
  // Detailed history
  appointments_history?: AppointmentHistoryItem[] | Json | null;
  attendances_history?: AttendanceHistoryItem[] | Json | null;
  quotes_history?: QuoteHistoryItem[] | Json | null;
  sales_history?: SaleHistoryItem[] | Json | null;
  // Non-contracted quotes data
  total_non_contracted_quote_items?: number | null;
  total_non_contracted_quote_value?: number | null;
  top_non_contracted_procedures?: string | null;
  top_non_contracted_specialties?: string | null;
  non_contracted_quotes_history?: NonContractedQuoteItem[] | Json | null;
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
  patient_origin?: string;
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
        if (filters.active) {
          query = query.is("archived_at", null);
        } else {
          query = query.not("archived_at", "is", null);
        }
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
      const { patient_origin: _patientOrigin, ...patientInput } = input;

      const { data, error } = await supabase.from("patients").insert([{
        ...patientInput,
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
      const { patient_origin: _patientOrigin, ...patientInput } = input;
      const { data, error } = await supabase
        .from("patients")
        .update(patientInput)
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

// Paginated patients hook
export interface PatientPaginationOptions {
  page: number;
  pageSize: number;
  search?: string;
  active?: boolean;
}

export function usePatientsPaginated(options: PatientPaginationOptions) {
  const { currentOrganization } = useOrganization();

  return useQuery<PaginatedResult<Patient>>({
    queryKey: ["patients-paginated", currentOrganization?.id, options],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: options.page,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      let query = supabase
        .from("patients")
        .select("*", { count: "exact" })
        .eq("organization_id", currentOrganization.id);

      if (options.active !== undefined) {
        if (options.active) {
          query = query.is("archived_at", null);
        } else {
          query = query.not("archived_at", "is", null);
        }
      }

      if (options.search && options.search.trim()) {
        query = query.or(
          `name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`
        );
      }

      query = query.order("created_at", { ascending: false });

      const start = (options.page - 1) * options.pageSize;
      const end = start + options.pageSize - 1;

      const { data, count, error } = await query.range(start, end);

      if (error) throw error;

      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / options.pageSize) || 1;

      return {
        data: (data || []) as Patient[],
        totalCount,
        totalPages,
        currentPage: options.page,
        hasNextPage: options.page < totalPages,
        hasPreviousPage: options.page > 1,
      };
    },
  });
}

// Toggle patient active status
export function useTogglePatientActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const archivedAt = active ? null : new Date().toISOString();
      const { data, error } = await supabase
        .from("patients")
        .update({ active, archived_at: archivedAt })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success(active ? "Paciente desarquivado!" : "Paciente arquivado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao alterar status do paciente");
    },
  });
}
