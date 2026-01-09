import { MessageSquare, Users, MessageCircle, Webhook, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStats } from '@/hooks/useSystemMonitoring';

interface SystemStatusCardsProps {
  stats: SystemStats;
}

export function SystemStatusCards({ stats }: SystemStatusCardsProps) {
  const cards = [
    {
      title: 'WhatsApp Status',
      value: stats.whatsappStatus,
      icon: MessageSquare,
    },
    {
      title: 'Leads Ativos',
      value: stats.leadsCount.total,
      icon: Users,
    },
    {
      title: 'Conversas Abertas',
      value: stats.conversationsCount.open,
      icon: MessageCircle,
    },
    {
      title: 'Mensagens Hoje',
      value: stats.messagesToday,
      icon: Activity,
    },
    {
      title: 'Webhooks 24h',
      value: stats.webhooksLast24h,
      icon: Webhook,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
