import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCRMSettings, useUpdateCRMSettings } from "@/hooks/useCRMSettings";
import { Settings, Clock, Bot, Bell, Thermometer, RotateCcw, Sparkles, MessageCircle, Timer } from "lucide-react";
import { useEffect } from "react";

const settingsSchema = z.object({
  // Timers de transição
  new_to_cold_hours: z.coerce.number().min(1).max(720),
  hot_to_cold_days: z.coerce.number().min(0).max(365),
  hot_to_cold_hours: z.coerce.number().min(0).max(23),
  enable_auto_temperature: z.boolean(),
  
  // Substatus
  awaiting_response_minutes: z.coerce.number().min(1).max(10080),
  enable_auto_substatus: z.boolean(),
  em_conversa_timeout_minutes: z.coerce.number().min(1).max(1440),
  enable_substatus_timeout: z.boolean(),
  aguardando_to_cold_hours: z.coerce.number().min(1).max(720),
  
  // Follow-up
  max_follow_up_attempts: z.coerce.number().min(1).max(50),
  default_follow_up_interval: z.coerce.number().min(1).max(365),
  
  // Automação
  enable_automation: z.boolean(),
  automation_mode: z.enum(['manual', 'semi_auto', 'full_auto']),
  use_ai_for_unmatched: z.boolean(),
  
  // Notificações
  enable_follow_up_alerts: z.boolean(),
  enable_cold_lead_alerts: z.boolean(),
  enable_no_show_alerts: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function CRMSettingsManager() {
  const { data: settings, isLoading } = useCRMSettings();
  const updateSettings = useUpdateCRMSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      new_to_cold_hours: 24,
      hot_to_cold_days: 3,
      hot_to_cold_hours: 0,
      enable_auto_temperature: true,
      awaiting_response_minutes: 60,
      enable_auto_substatus: true,
      em_conversa_timeout_minutes: 60,
      enable_substatus_timeout: true,
      aguardando_to_cold_hours: 48,
      max_follow_up_attempts: 5,
      default_follow_up_interval: 3,
      enable_automation: false,
      automation_mode: 'manual',
      use_ai_for_unmatched: false,
      enable_follow_up_alerts: true,
      enable_cold_lead_alerts: true,
      enable_no_show_alerts: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        new_to_cold_hours: settings.new_to_cold_hours,
        hot_to_cold_days: settings.hot_to_cold_days,
        hot_to_cold_hours: settings.hot_to_cold_hours,
        enable_auto_temperature: settings.enable_auto_temperature,
        awaiting_response_minutes: settings.awaiting_response_minutes,
        enable_auto_substatus: settings.enable_auto_substatus,
        em_conversa_timeout_minutes: settings.em_conversa_timeout_minutes,
        enable_substatus_timeout: settings.enable_substatus_timeout,
        aguardando_to_cold_hours: settings.aguardando_to_cold_hours,
        max_follow_up_attempts: settings.max_follow_up_attempts,
        default_follow_up_interval: settings.default_follow_up_interval,
        enable_automation: settings.enable_automation,
        automation_mode: settings.automation_mode,
        use_ai_for_unmatched: settings.use_ai_for_unmatched,
        enable_follow_up_alerts: settings.enable_follow_up_alerts,
        enable_cold_lead_alerts: settings.enable_cold_lead_alerts,
        enable_no_show_alerts: settings.enable_no_show_alerts,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Diagrama de Fluxo Visual */}
        <Card className="bg-muted/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Fluxo Automático de Status</CardTitle>
            </div>
            <CardDescription>
              Visão geral de como os leads transitam automaticamente entre os estados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono bg-background rounded-lg p-4 overflow-x-auto">
              <pre className="text-muted-foreground">
{`LEAD CHEGA ──► NOVO ──┬──► (cliente responde) ──► QUENTE + "em_conversa"
                      │                              │
                      │                         ┌────┴────┐
                      │                    timeout    você envia msg
                      │                    ${form.watch('em_conversa_timeout_minutes')}min        │
                      │                         │         ▼
                      │                    limpa    "aguardando_resposta"
                      │                   substatus       │
                      │                                   │
                ${form.watch('new_to_cold_hours')}h sem interação             ${form.watch('aguardando_to_cold_hours')}h sem resposta
                      │                                   │
                      ▼                                   ▼
                    FRIO ◄──── ${form.watch('hot_to_cold_days')}d ${form.watch('hot_to_cold_hours')}h sem interação ────┘`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Transição de Lead NOVO */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <CardTitle>Transição de Lead NOVO</CardTitle>
            </div>
            <CardDescription>
              Configure quanto tempo um lead novo tem para interagir antes de esfriar automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="new_to_cold_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horas como lead novo antes de esfriar</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="number" min={1} max={720} className="w-24" {...field} />
                      <span className="text-muted-foreground">horas</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Após {field.value} horas sem interação, o lead NOVO será movido para FRIO automaticamente.
                    {field.value >= 24 && ` (${Math.floor(field.value / 24)} dias e ${field.value % 24} horas)`}
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Transição de Lead QUENTE */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              <CardTitle>Transição de Lead QUENTE</CardTitle>
            </div>
            <CardDescription>
              Configure quando um lead quente deve virar frio por falta de interação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enable_auto_temperature"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar transição automática QUENTE → FRIO</FormLabel>
                    <FormDescription>
                      Leads quentes sem interação serão movidos automaticamente para frio
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hot_to_cold_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias sem resposta</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={365} {...field} />
                    </FormControl>
                    <FormDescription>Número de dias</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hot_to_cold_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas adicionais</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={23} {...field} />
                    </FormControl>
                    <FormDescription>Horas extras (0-23)</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <strong>Resumo:</strong> Lead QUENTE virará FRIO após{" "}
              <span className="font-mono text-primary">
                {form.watch('hot_to_cold_days')} dias e {form.watch('hot_to_cold_hours')} horas
              </span>{" "}
              sem interação do cliente.
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Substatus */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Gerenciamento de Substatus</CardTitle>
            </div>
            <CardDescription>
              Configure como os substatus "em conversa" e "aguardando resposta" são gerenciados automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enable_auto_substatus"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar detecção automática de substatus</FormLabel>
                    <FormDescription>
                      "Em conversa" quando cliente responde, "Aguardando resposta" quando você envia mensagem
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Timer className="h-4 w-4 text-muted-foreground" />
                Timeout do "Em Conversa"
              </div>
              
              <FormField
                control={form.control}
                name="enable_substatus_timeout"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativar timeout automático</FormLabel>
                      <FormDescription>
                        Limpar substatus "em conversa" após período sem resposta do cliente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="em_conversa_timeout_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutos para limpar "em conversa"</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} max={1440} className="w-24" {...field} />
                        <span className="text-muted-foreground">minutos</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Após {field.value} minutos sem resposta do cliente, o substatus será removido (lead continua QUENTE).
                      {field.value >= 60 && ` (${Math.floor(field.value / 60)}h ${field.value % 60}min)`}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                "Aguardando Resposta" → FRIO
              </div>
              
              <FormField
                control={form.control}
                name="aguardando_to_cold_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas aguardando antes de esfriar</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input type="number" min={1} max={720} className="w-24" {...field} />
                        <span className="text-muted-foreground">horas</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Se o cliente não responder em {field.value} horas após você enviar mensagem, lead vai para FRIO.
                      {field.value >= 24 && ` (${Math.floor(field.value / 24)} dias e ${field.value % 24} horas)`}
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Follow-up */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              <CardTitle>Configurações de Follow-up</CardTitle>
            </div>
            <CardDescription>
              Defina os parâmetros para acompanhamento de leads frios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_follow_up_attempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de tentativas</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={50} {...field} />
                    </FormControl>
                    <FormDescription>Antes de sugerir descarte</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_follow_up_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intervalo padrão (dias)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={365} {...field} />
                    </FormControl>
                    <FormDescription>Entre follow-ups</FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Automação */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>Automação via IA</CardTitle>
            </div>
            <CardDescription>
              Configure o modo de operação da automação inteligente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enable_automation"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativar automação</FormLabel>
                    <FormDescription>
                      Permite que o sistema execute ou sugira ações automaticamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="automation_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de operação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">
                        Manual - Todas as ações são feitas pelo atendente
                      </SelectItem>
                      <SelectItem value="semi_auto">
                        Semi-automático - IA sugere, atendente aprova
                      </SelectItem>
                      <SelectItem value="full_auto">
                        Automático - IA executa, atendente monitora
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="use_ai_for_unmatched"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usar IA para classificar leads sem gatilho</FormLabel>
                    <FormDescription>
                      Quando nenhum gatilho de interesse corresponder, usar IA para classificar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Configurações de Notificações */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notificações e Alertas</CardTitle>
            </div>
            <CardDescription>
              Configure quais alertas devem aparecer no dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="enable_follow_up_alerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Alertas de follow-up</FormLabel>
                    <FormDescription>Exibir leads com follow-up pendente ou atrasado</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enable_cold_lead_alerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Alertas de leads frios</FormLabel>
                    <FormDescription>Exibir quantidade de leads frios sem contato recente</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enable_no_show_alerts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Alertas de faltosos</FormLabel>
                    <FormDescription>Exibir leads que faltaram a agendamentos</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            <Settings className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
