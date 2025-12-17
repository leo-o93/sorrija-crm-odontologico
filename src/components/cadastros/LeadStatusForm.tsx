import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStatus, useCreateLeadStatus, useUpdateLeadStatus } from "@/hooks/useLeadStatuses";

const colorOptions = [
  { value: "bg-blue-500", label: "Azul" },
  { value: "bg-green-500", label: "Verde" },
  { value: "bg-yellow-500", label: "Amarelo" },
  { value: "bg-orange-500", label: "Laranja" },
  { value: "bg-red-500", label: "Vermelho" },
  { value: "bg-purple-500", label: "Roxo" },
  { value: "bg-pink-500", label: "Rosa" },
  { value: "bg-indigo-500", label: "Índigo" },
  { value: "bg-teal-500", label: "Teal" },
  { value: "bg-emerald-500", label: "Esmeralda" },
  { value: "bg-cyan-500", label: "Ciano" },
  { value: "bg-gray-500", label: "Cinza" },
  { value: "bg-red-400", label: "Vermelho Claro" },
  { value: "bg-red-600", label: "Vermelho Escuro" },
];

const formSchema = z.object({
  name: z.string().min(1, "Identificador é obrigatório").regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e underscores"),
  title: z.string().min(1, "Título é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadStatusFormProps {
  status?: LeadStatus;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadStatusForm({ status, onSuccess, onCancel }: LeadStatusFormProps) {
  const createStatus = useCreateLeadStatus();
  const updateStatus = useUpdateLeadStatus();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: status?.name || "",
      title: status?.title || "",
      color: status?.color || "bg-blue-500",
    },
  });

  const isLoading = createStatus.isPending || updateStatus.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      if (status) {
        await updateStatus.mutateAsync({
          id: status.id,
          name: values.name,
          title: values.title,
          color: values.color,
        });
      } else {
        await createStatus.mutateAsync({
          name: values.name,
          title: values.title,
          color: values.color,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving status:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título de Exibição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Novo Lead" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identificador (interno)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: novo_lead" 
                  {...field} 
                  disabled={!!status}
                />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                Use apenas letras minúsculas, números e underscores
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.value}`} />
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : status ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
