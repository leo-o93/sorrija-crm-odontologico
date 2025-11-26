import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Procedure, useCreateProcedure, useUpdateProcedure } from "@/hooks/useProcedures";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  default_price: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProcedureFormProps {
  procedure?: Procedure;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProcedureForm({ procedure, onSuccess, onCancel }: ProcedureFormProps) {
  const createProcedure = useCreateProcedure();
  const updateProcedure = useUpdateProcedure();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: procedure?.name || "",
      category: procedure?.category || "",
      default_price: procedure?.default_price?.toString() || "",
      description: procedure?.description || "",
    },
  });

  const onSubmit = (data: FormData) => {
    if (procedure) {
      updateProcedure.mutate(
        { 
          id: procedure.id, 
          name: data.name,
          category: data.category,
          default_price: data.default_price ? parseFloat(data.default_price) : undefined,
          description: data.description || undefined,
        },
        { onSuccess }
      );
    } else {
      createProcedure.mutate({
        name: data.name,
        category: data.category,
        default_price: data.default_price ? parseFloat(data.default_price) : undefined,
        description: data.description || undefined,
      }, { onSuccess });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Clareamento dental" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Estética" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Padrão (opcional)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição do procedimento..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createProcedure.isPending || updateProcedure.isPending}>
            {procedure ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}