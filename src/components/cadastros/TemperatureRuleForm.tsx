import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TemperatureTransitionRule, CreateRuleInput } from "@/hooks/useTemperatureRules";
import { useEffect } from "react";

const ruleSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  trigger_event: z.enum(["inactivity_timer", "substatus_timeout", "no_response"]),
  from_temperature: z.string().nullable(),
  from_substatus: z.string().nullable(),
  timer_minutes: z.coerce.number().min(1, "Mínimo 1 minuto"),
  action_set_temperature: z.string().nullable(),
  action_clear_substatus: z.boolean(),
  action_set_substatus: z.string().nullable(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface TemperatureRuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRuleInput) => void;
  editingRule?: TemperatureTransitionRule | null;
  isSubmitting?: boolean;
}

const TRIGGER_EVENTS = [
  { value: "inactivity_timer", label: "Timer de Inatividade", description: "Sem interação do cliente" },
  { value: "substatus_timeout", label: "Timeout de Substatus", description: "Tempo limite de um substatus" },
  { value: "no_response", label: "Sem Resposta", description: "Cliente não respondeu após mensagem enviada" },
];

const TEMPERATURES = [
  { value: "novo", label: "NOVO" },
  { value: "quente", label: "QUENTE" },
  { value: "frio", label: "FRIO" },
];

const SUBSTATUSES = [
  { value: "em_conversa", label: "Em Conversa" },
  { value: "aguardando_resposta", label: "Aguardando Resposta" },
];

export function TemperatureRuleForm({
  open,
  onOpenChange,
  onSubmit,
  editingRule,
  isSubmitting,
}: TemperatureRuleFormProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      trigger_event: "inactivity_timer",
      from_temperature: null,
      from_substatus: null,
      timer_minutes: 60,
      action_set_temperature: null,
      action_clear_substatus: false,
      action_set_substatus: null,
    },
  });

  useEffect(() => {
    if (editingRule) {
      form.reset({
        name: editingRule.name,
        trigger_event: editingRule.trigger_event,
        from_temperature: editingRule.from_temperature,
        from_substatus: editingRule.from_substatus,
        timer_minutes: editingRule.timer_minutes,
        action_set_temperature: editingRule.action_set_temperature,
        action_clear_substatus: editingRule.action_clear_substatus,
        action_set_substatus: editingRule.action_set_substatus,
      });
    } else {
      form.reset({
        name: "",
        trigger_event: "inactivity_timer",
        from_temperature: null,
        from_substatus: null,
        timer_minutes: 60,
        action_set_temperature: null,
        action_clear_substatus: false,
        action_set_substatus: null,
      });
    }
  }, [editingRule, form, open]);

  const handleSubmit = (values: RuleFormValues) => {
    onSubmit({
      name: values.name,
      trigger_event: values.trigger_event,
      from_temperature: values.from_temperature || null,
      from_substatus: values.from_substatus || null,
      timer_minutes: values.timer_minutes,
      action_set_temperature: values.action_set_temperature || null,
      action_clear_substatus: values.action_clear_substatus,
      action_set_substatus: values.action_set_substatus || null,
    });
  };

  const timerMinutes = form.watch("timer_minutes");
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d ${hours}h`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? "Editar Regra de Transição" : "Nova Regra de Transição"}
          </DialogTitle>
          <DialogDescription>
            Configure quando e como os leads devem mudar de temperatura automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Regra</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: NOVO para FRIO após 24h" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trigger_event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRIGGER_EVENTS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          <div className="flex flex-col">
                            <span>{event.label}</span>
                            <span className="text-xs text-muted-foreground">{event.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura Atual</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "_any" ? null : v)} 
                      value={field.value || "_any"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_any">Qualquer</SelectItem>
                        {TEMPERATURES.map((temp) => (
                          <SelectItem key={temp.value} value={temp.value}>
                            {temp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Filtrar por temperatura</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="from_substatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substatus Atual</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "_any" ? null : v)} 
                      value={field.value || "_any"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_any">Qualquer</SelectItem>
                        {SUBSTATUSES.map((sub) => (
                          <SelectItem key={sub.value} value={sub.value}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Filtrar por substatus</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timer_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo (minutos)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} className="w-32" {...field} />
                      <span className="text-sm text-muted-foreground">
                        = {formatTime(timerMinutes)}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Tempo de inatividade antes de aplicar a ação
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h4 className="font-medium text-sm">Ações a Executar</h4>

              <FormField
                control={form.control}
                name="action_set_temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Temperatura</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Não alterar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Não alterar</SelectItem>
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
                name="action_clear_substatus"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Limpar Substatus</FormLabel>
                      <FormDescription>Remover o substatus atual</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="action_set_substatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo Substatus</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(v === "_none" ? null : v)} 
                      value={field.value || "_none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Não definir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Não definir</SelectItem>
                        {SUBSTATUSES.map((sub) => (
                          <SelectItem key={sub.value} value={sub.value}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingRule ? "Salvar" : "Criar Regra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
