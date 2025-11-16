import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function WebhookEndpointInfo() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-receiver`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL copiada para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endpoint do Webhook</CardTitle>
        <CardDescription>
          Use este URL para receber webhooks de fontes externas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
            {webhookUrl}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Exemplo de uso com cURL:</p>
          <code className="block rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
            {`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"evento": "teste", "dados": "exemplo"}'`}
          </code>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Exemplo com JavaScript/Fetch:</p>
          <code className="block rounded bg-muted p-3 text-xs font-mono overflow-x-auto">
            {`fetch('${webhookUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ evento: 'teste', dados: 'exemplo' })
})`}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
