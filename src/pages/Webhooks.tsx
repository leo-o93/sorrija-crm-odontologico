import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WebhookEndpointInfo } from "@/components/webhooks/WebhookEndpointInfo";
import { WebhookList } from "@/components/webhooks/WebhookList";
import { useWebhooks } from "@/hooks/useWebhooks";

export default function Webhooks() {
  const { webhooks } = useWebhooks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">
          Gerencie e visualize todos os webhooks recebidos
        </p>
      </div>

      <WebhookEndpointInfo />

      <Card>
        <CardHeader>
          <CardTitle>Webhooks Recebidos ({webhooks?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <WebhookList />
        </CardContent>
      </Card>
    </div>
  );
}
