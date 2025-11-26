import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Source, useCreateSource, useUpdateSource } from "@/hooks/useSources";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  channel: z.string().min(1, "Canal é obrigatório"),
});

type FormData = z.infer<typeof formSchema>;

interface SourceFormProps {
  source?: Source;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SourceForm({ source, onSuccess, onCancel }: SourceFormProps) {
  const createSource = useCreateSource();
  const updateSource = useUpdateSource();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: source?.name || "",
      channel: source?.channel || "",
    },
  });

  const onSubmit = (data: FormData) => {
    if (source) {
      updateSource.mutate(
        { id: source.id, name: data.name, channel: data.channel },
        { onSuccess }
      );
    } else {
      createSource.mutate({ name: data.name, channel: data.channel }, { onSuccess });
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
                <Input placeholder="Ex: Instagram" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createSource.isPending || updateSource.isPending}>
            {source ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}