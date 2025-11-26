import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useEvolution } from "@/contexts/EvolutionContext";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const setupSchema = z.object({
  evolution_base_url: z.string().url("URL inválida"),
  evolution_api_key: z.string().min(1, "API Key é obrigatória"),
  evolution_instance: z.string().min(1, "Nome da instância é obrigatório"),
  webhook_secret: z.string().optional(),
  n8n_outgoing_url: z.string().url("URL inválida").optional().or(z.literal("")),
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function EvolutionSetup() {
  const { saveConfig } = useEvolution();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      evolution_base_url: "",
      evolution_api_key: "",
      evolution_instance: "",
      webhook_secret: "",
      n8n_outgoing_url: "",
    },
  });

  const onSubmit = async (data: SetupFormValues) => {
    setIsLoading(true);
    try {
      await saveConfig({
        evolution_base_url: data.evolution_base_url,
        evolution_api_key: data.evolution_api_key,
        evolution_instance: data.evolution_instance,
        webhook_secret: data.webhook_secret || undefined,
        n8n_outgoing_url: data.n8n_outgoing_url || undefined,
      });
      toast.success("Configuração salva com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold text-center">
              Configuração Evolution API
            </CardTitle>
          </div>
          <CardDescription className="text-center">
            Configure sua Evolution API para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="evolution_base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Base da Evolution API</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://evolution.exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL completa da sua instância Evolution API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evolution_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Sua API Key" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Chave de autenticação da Evolution API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evolution_instance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Instância</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="minha-instancia" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Nome identificador da sua instância WhatsApp
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhook_secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Secret para validação de webhooks" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="n8n_outgoing_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL N8N Outgoing (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://n8n.exemplo.com/webhook" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL do webhook N8N para mensagens enviadas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar e Continuar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
