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
import { Settings, Bot, Bell, RotateCcw, Play, Loader2, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useAutoLeadTransitions } from "@/hooks/useAutoLeadTransitions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const settingsSchema = z.object({
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

interface CRMSettingsManagerProps {
  onNavigateToRules?: () => void;
}

export function CRMSettingsManager({ onNavigateToRules }: CRMSettingsManagerProps) {
  const { data: settings, isLoading } = useCRMSettings();
  const updateSettings = useUpdateCRMSettings();
  const { runTransitions, lastResult, isRunning, lastRunAt } = useAutoLeadTransitions({ showToasts: true });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
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
        {[1, 2, 3, 4].map((i) => (
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

        {/* Execução Automática de Transições */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <CardTitle>Execução Automática de Transições</CardTitle>
            </div>
            <CardDescription>
              O sistema executa transições a cada 5 minutos automaticamente. Você pode executar manualmente abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {lastResult?.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    Status: {isRunning ? 'Executando...' : lastResult?.success ? 'Última execução bem sucedida' : 'Aguardando'}
                  </span>
                </div>
                {lastRunAt && (
                  <p className="text-sm text-muted-foreground">
                    Última execução: {format(lastRunAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
                {lastResult?.success && (lastResult.transitions_made > 0 || lastResult.substatuses_cleared > 0) && (
                  <p className="text-sm text-muted-foreground">
                    Resultado: {lastResult.transitions_made} transições, {lastResult.substatuses_cleared} substatus limpos
                  </p>
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => runTransitions()}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Agora
                  </>
                )}
              </Button>
            </div>

            {/* Link para Regras de Transição */}
            <div className="rounded-lg bg-muted/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowRight className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Regras de Transição</p>
                  <p className="text-sm text-muted-foreground">
                    As regras de transição de temperatura são configuradas na aba "Regras de Transição"
                  </p>
                </div>
              </div>
              {onNavigateToRules && (
                <Button type="button" variant="outline" onClick={onNavigateToRules}>
                  Ir para Regras
                </Button>
              )}
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
