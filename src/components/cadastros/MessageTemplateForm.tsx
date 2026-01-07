import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useProcedures } from "@/hooks/useProcedures";
import { useCreateMessageTemplate, useUpdateMessageTemplate, MessageTemplate, TEMPLATE_CATEGORIES, TEMPLATE_VARIABLES, TemplateCategory } from "@/hooks/useMessageTemplates";

const TEMPERATURES = [
  { value: 'novo', label: 'Novo' },
  { value: 'quente', label: 'Quente' },
  { value: 'frio', label: 'Frio' },
];

const templateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.enum(['welcome', 'follow_up', 'reminder', 'no_show', 'reactivation', 'quote']),
  interest_id: z.string().nullable().optional(),
  temperature: z.string().nullable().optional(),
  attempt_number: z.coerce.number().nullable().optional(),
  content: z.string().min(1, "Conteúdo é obrigatório"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface MessageTemplateFormProps {
  template?: MessageTemplate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MessageTemplateForm({ template, onSuccess, onCancel }: MessageTemplateFormProps) {
  const { data: procedures } = useProcedures();
  
  const createTemplate = useCreateMessageTemplate();
  const updateTemplate = useUpdateMessageTemplate();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || "",
      category: (template?.category as TemplateCategory) || "welcome",
      interest_id: template?.interest_id || null,
      temperature: template?.temperature || null,
      attempt_number: template?.attempt_number || null,
      content: template?.content || "",
    },
  });

  const watchCategory = form.watch("category");
  const watchContent = form.watch("content");

  const onSubmit = async (values: TemplateFormValues) => {
    try {
      const data = {
        ...values,
        interest_id: values.interest_id === "_none" ? null : values.interest_id,
        temperature: values.temperature === "_none" ? null : values.temperature,
        attempt_number: values.attempt_number || null,
      };

      if (template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          ...data,
        });
      } else {
        await createTemplate.mutateAsync({
          name: values.name,
          category: values.category,
          content: values.content,
          interest_id: data.interest_id,
          temperature: data.temperature,
          attempt_number: data.attempt_number,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const insertVariable = (variable: string) => {
    const currentContent = form.getValues("content");
    form.setValue("content", currentContent + variable);
  };

  const isLoading = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do template</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Boas-vindas Facetas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchCategory === 'follow_up' && (
            <FormField
              control={form.control}
              name="attempt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da tentativa</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={10} 
                      placeholder="Ex: 1, 2, 3..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Opcional: para templates específicos por tentativa</FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interest_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procedimento específico</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer procedimento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Qualquer procedimento</SelectItem>
                    {procedures?.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id}>
                        {proc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Opcional: usar apenas para este procedimento</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura específica</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer temperatura" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Qualquer temperatura</SelectItem>
                    {TEMPERATURES.map((temp) => (
                      <SelectItem key={temp.value} value={temp.value}>
                        {temp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Opcional: usar apenas para esta temperatura</FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo da mensagem</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite o texto da mensagem..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                <div className="space-y-2">
                  <p>Clique nas variáveis abaixo para inserir:</p>
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <Badge
                        key={v.variable}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => insertVariable(v.variable)}
                      >
                        {v.variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchContent && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
            <p className="text-sm whitespace-pre-wrap">
              {watchContent
                .replace(/{{nome}}/g, 'Maria')
                .replace(/{{procedimento}}/g, 'Facetas')
                .replace(/{{data_agendamento}}/g, '15/01/2025')
                .replace(/{{hora_agendamento}}/g, '14:00')
                .replace(/{{clinica}}/g, 'Sorri Já')
                .replace(/{{valor}}/g, 'R$ 5.000,00')
              }
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : template ? "Atualizar" : "Criar Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
