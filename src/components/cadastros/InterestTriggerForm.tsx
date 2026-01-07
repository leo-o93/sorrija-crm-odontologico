import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProcedures } from "@/hooks/useProcedures";
import { useSources } from "@/hooks/useSources";
import { useLeadStatuses } from "@/hooks/useLeadStatuses";
import { useCreateInterestTrigger, useUpdateInterestTrigger, InterestTrigger, ConditionField, ConditionOperator } from "@/hooks/useInterestTriggers";

const CONDITION_FIELDS: { value: ConditionField; label: string; description: string }[] = [
  { value: 'first_message', label: 'Primeira mensagem', description: 'Apenas a primeira mensagem do lead' },
  { value: 'any_message', label: 'Qualquer mensagem', description: 'Qualquer mensagem recebida' },
  { value: 'push_name', label: 'Nome do contato', description: 'Nome do contato no WhatsApp' },
  { value: 'source_name', label: 'Nome da fonte', description: 'Nome da fonte/origem do lead' },
];

const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'equals', label: 'É igual a' },
  { value: 'not_equals', label: 'É diferente de' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'regex', label: 'Expressão regular' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
];

const TEMPERATURES = [
  { value: 'novo', label: 'Novo' },
  { value: 'quente', label: 'Quente' },
  { value: 'frio', label: 'Frio' },
];

const triggerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  condition_field: z.enum(['first_message', 'any_message', 'push_name', 'source_name']),
  condition_operator: z.enum(['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'regex', 'is_empty', 'is_not_empty']),
  condition_value: z.string(),
  case_sensitive: z.boolean(),
  action_set_interest_id: z.string().nullable().optional(),
  action_set_source_id: z.string().nullable().optional(),
  action_set_temperature: z.string().nullable().optional(),
  action_set_status: z.string().nullable().optional(),
});

type TriggerFormValues = z.infer<typeof triggerSchema>;

interface InterestTriggerFormProps {
  trigger?: InterestTrigger | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InterestTriggerForm({ trigger, onSuccess, onCancel }: InterestTriggerFormProps) {
  const { data: procedures } = useProcedures();
  const { data: sources } = useSources();
  const { data: statuses } = useLeadStatuses();
  
  const createTrigger = useCreateInterestTrigger();
  const updateTrigger = useUpdateInterestTrigger();

  const form = useForm<TriggerFormValues>({
    resolver: zodResolver(triggerSchema),
    defaultValues: {
      name: trigger?.name || "",
      condition_field: trigger?.condition_field || "first_message",
      condition_operator: trigger?.condition_operator || "contains",
      condition_value: trigger?.condition_value || "",
      case_sensitive: trigger?.case_sensitive || false,
      action_set_interest_id: trigger?.action_set_interest_id || null,
      action_set_source_id: trigger?.action_set_source_id || null,
      action_set_temperature: trigger?.action_set_temperature || null,
      action_set_status: trigger?.action_set_status || null,
    },
  });

  const watchOperator = form.watch("condition_operator");
  const needsValue = !['is_empty', 'is_not_empty'].includes(watchOperator);

  const onSubmit = async (values: TriggerFormValues) => {
    try {
      if (trigger) {
        await updateTrigger.mutateAsync({
          id: trigger.id,
          ...values,
        });
      } else {
        await createTrigger.mutateAsync({
          name: values.name,
          condition_field: values.condition_field,
          condition_operator: values.condition_operator,
          condition_value: values.condition_value,
          case_sensitive: values.case_sensitive,
          action_set_interest_id: values.action_set_interest_id,
          action_set_source_id: values.action_set_source_id,
          action_set_temperature: values.action_set_temperature,
          action_set_status: values.action_set_status,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving trigger:", error);
    }
  };

  const isLoading = createTrigger.isPending || updateTrigger.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do gatilho</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Detectar interesse em Facetas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium">Condição</h4>
          
          <FormField
            control={form.control}
            name="condition_field"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campo a avaliar</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONDITION_FIELDS.map((cf) => (
                      <SelectItem key={cf.value} value={cf.value}>
                        <div>
                          <span>{cf.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({cf.description})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition_operator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operador</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {needsValue && (
            <FormField
              control={form.control}
              name="condition_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor para comparar</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: faceta, facetas, lente" {...field} />
                  </FormControl>
                  <FormDescription>
                    {watchOperator === 'regex' 
                      ? 'Expressão regular (ex: facet(a|as)|lente)'
                      : 'Texto para buscar na mensagem'
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="case_sensitive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Diferenciar maiúsculas/minúsculas</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium">Ações (quando condição for verdadeira)</h4>
          
          <FormField
            control={form.control}
            name="action_set_interest_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definir interesse (procedimento)</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um procedimento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não definir</SelectItem>
                    {procedures?.map((proc) => (
                      <SelectItem key={proc.id} value={proc.id}>
                        {proc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action_set_source_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definir fonte/origem</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma fonte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não definir</SelectItem>
                    {sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action_set_temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definir temperatura</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma temperatura" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não definir (padrão: Novo)</SelectItem>
                    {TEMPERATURES.map((temp) => (
                      <SelectItem key={temp.value} value={temp.value}>
                        {temp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="action_set_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definir status (kanban)</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                  value={field.value || "_none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">Não definir (usar padrão)</SelectItem>
                    {statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : trigger ? "Atualizar" : "Criar Gatilho"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
