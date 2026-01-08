import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AIEngagementChartProps {
  messagesIn: number;
  messagesOut: number;
  insight?: string;
}

export function AIEngagementChart({ messagesIn, messagesOut, insight }: AIEngagementChartProps) {
  const total = messagesIn + messagesOut;
  const ratio = messagesOut > 0 ? (messagesIn / messagesOut).toFixed(2) : '0';
  const isGoodRatio = messagesIn >= messagesOut;

  // Simple visualization data
  const data = [
    { name: 'Recebidas', value: messagesIn },
    { name: 'Enviadas', value: messagesOut },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Engajamento de Mensagens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-success">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-2xl font-bold">{messagesIn}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recebidas</p>
          </div>
          <div className="text-center p-3 bg-info/10 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-info">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-2xl font-bold">{messagesOut}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enviadas</p>
          </div>
        </div>

        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.2)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Proporção (in/out):</span>
          <span className={`font-medium ${isGoodRatio ? 'text-success' : 'text-warning'}`}>
            {ratio}:1
          </span>
        </div>

        {insight && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🧠 {insight}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
