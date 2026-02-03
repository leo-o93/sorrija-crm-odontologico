import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface QuoteItem {
  id?: string;
  procedure_id?: string;
  procedure_name: string;
  description?: string;
  tooth?: string;
  specialty?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total_price: number;
}

export interface QuotePayment {
  id?: string;
  installment_number: number;
  due_date: string;
  amount: number;
  payment_method?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_at?: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  lead_id?: string;
  patient_id?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  payment_type?: "particular" | "convenio" | null;
  professional_id?: string | null;
  total_amount: number;
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  status:
    | "draft"
    | "sent"
    | "approved"
    | "rejected"
    | "expired"
    | "converted"
    | "not_closed"
    | "partially_closed"
    | "closed";
  valid_until?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  quote_items?: QuoteItem[];
  quote_payments?: QuotePayment[];
  leads?: { name: string; phone: string };
  patients?: { name: string; phone: string };
  professional?: { id: string; name: string } | null;
}

export function useQuotes(filters?: { status?: string; search?: string }) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ["quotes", currentOrganization?.id, filters],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      let query = supabase
        .from("quotes")
        .select(`
          *,
          leads(name, phone),
          patients(name, phone),
          professional:professionals(id, name),
          quote_items(*),
          quote_payments(*)
        `)
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(`contact_name.ilike.%${filters.search}%,quote_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Quote[];
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          leads(name, phone),
          patients(name, phone),
          professional:professionals(id, name),
          quote_items(*),
          quote_payments(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Quote;
    },
    enabled: !!id,
  });
}

interface CreateQuoteInput {
  lead_id?: string;
  patient_id?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  payment_type?: "particular" | "convenio" | null;
  professional_id?: string | null;
  valid_until?: string;
  notes?: string;
  items: QuoteItem[];
  payments?: QuotePayment[];
}

export function useCreateQuote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (input: CreateQuoteInput) => {
      if (!currentOrganization?.id) throw new Error("No organization selected");

      if (input.patient_id) {
        const activeStatuses = ["draft", "sent", "approved", "partially_closed"];
        const { data: activeQuote, error: activeError } = await supabase
          .from("quotes")
          .select("id, status")
          .eq("patient_id", input.patient_id)
          .eq("organization_id", currentOrganization.id)
          .in("status", activeStatuses)
          .limit(1)
          .maybeSingle();

        if (activeError) throw activeError;
        if (activeQuote) {
          throw new Error("Já existe um orçamento ativo para este paciente.");
        }
      }

      // Gerar número do orçamento
      const { data: quoteNumber, error: numberError } = await supabase
        .rpc("generate_quote_number");

      if (numberError) throw numberError;

      // Calcular totais
      const totalAmount = input.items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = 0;
      const finalAmount = totalAmount - discountAmount;

      // Criar orçamento
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          quote_number: quoteNumber,
          lead_id: input.lead_id,
          patient_id: input.patient_id,
          contact_name: input.contact_name,
          contact_phone: input.contact_phone,
          contact_email: input.contact_email,
          payment_type: input.payment_type ?? null,
          professional_id: input.professional_id ?? null,
          total_amount: totalAmount,
          discount_percentage: 0,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          status: 'draft',
          valid_until: input.valid_until,
          notes: input.notes,
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Criar itens
      const itemsToInsert = input.items.map((item) => ({
        quote_id: quote.id,
        procedure_id: item.procedure_id,
        procedure_name: item.procedure_name,
        description: item.description,
        tooth: item.tooth,
        specialty: item.specialty,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Criar pagamentos se fornecidos
      if (input.payments && input.payments.length > 0) {
        const paymentsToInsert = input.payments.map((payment) => ({
          quote_id: quote.id,
          installment_number: payment.installment_number,
          due_date: payment.due_date,
          amount: payment.amount,
          payment_method: payment.payment_method,
          status: payment.status,
        }));

        const { error: paymentsError } = await supabase
          .from("quote_payments")
          .insert(paymentsToInsert);

        if (paymentsError) throw paymentsError;
      }

      return quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      });
    },
    onError: (error) => {
      const description =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível criar o orçamento";
      toast({
        title: "Erro",
        description,
        variant: "destructive",
      });
      console.error("Error creating quote:", error);
    },
  });
}

interface UpdateQuoteInput {
  id: string;
  status?: string;
  discount_percentage?: number;
  discount_amount?: number;
  notes?: string;
}

export function useUpdateQuote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateQuoteInput) => {
      const { data, error } = await supabase
        .from("quotes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote"] });
      toast({
        title: "Sucesso",
        description: "Orçamento atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o orçamento",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteQuote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Sucesso",
        description: "Orçamento excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o orçamento",
        variant: "destructive",
      });
    },
  });
}
