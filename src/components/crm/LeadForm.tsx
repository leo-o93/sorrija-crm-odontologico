import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useSources } from "@/hooks/useSources";
import { useProcedures } from "@/hooks/useProcedures";
import { useCreateLead, useUpdateLead, Lead } from "@/hooks/useLeads";
import { Loader2 } from "lucide-react";

const leadFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(20),
  source_id: z.string().optional(),
  interest_id: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("novo_lead"),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadForm({ lead, onSuccess, onCancel }: LeadFormProps) {
  const { data: sources, isLoading: loadingSources } = useSources();
  const { data: procedures, isLoading: loadingProcedures } = useProcedures();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name || "",
      phone: lead?.phone || "",
      source_id: lead?.source_id || undefined,
      interest_id: lead?.interest_id || undefined,
      notes: lead?.notes || "",
      status: lead?.status || "novo_lead",
    },
  });

  const onSubmit = async (data: LeadFormValues) => {
    if (lead) {
      await updateLead.mutateAsync({ id: lead.id, ...data });
    } else {
      await createLead.mutateAsync({
        name: data.name,
        phone: data.phone,
        source_id: data.source_id,
        interest_id: data.interest_id,
        notes: data.notes,
        status: data.status,
      });
    }
    onSuccess?.();
  };

  const isLoading = createLead.isPending || updateLead.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input placeholder="Nome do lead" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone *</FormLabel>
              <FormControl>
                <Input placeholder="(31) 9 8280-8133" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fonte</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingSources ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interest_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interesse</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingProcedures ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : (
                    procedures?.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id}>
                        {procedure.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas sobre o lead..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {lead ? "Atualizar" : "Criar"} Lead
          </Button>
        </div>
      </form>
    </Form>
  );
}
