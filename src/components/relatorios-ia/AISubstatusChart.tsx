import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Flame } from 'lucide-react';

interface AISubstatusChartProps {
  data: {
    em_conversa: number;
    aguardando_resposta: number;
    agendado: number;
    negociacao: number;
    fechado: number;
  };
  insight?: string;
}

const SUBSTATUS_CONFIG = [
  { key: 'em_conversa', label: 'Em Conversa', color: 'hsl(38, 92%, 50%)' },
  { key: 'aguardando_resposta', label: 'Aguardando', color: 'hsl(210, 79%, 46%)' },
  { key: 'agendado', label: 'Agendado', color: 'hsl(142, 71%, 45%)' },
  { key: 'negociacao', label: 'Negociação', color: 'hsl(262, 83%, 58%)' },
  { key: 'fechado', label: 'Fechado', color: 'hsl(0, 84%, 60%)' },
];

export function AISubstatusChart({ data, insight }: AISubstatusChartProps) {
  const total = Object.values(data).reduce((acc, val) => acc + val, 0);
  
  const chartData = SUBSTATUS_CONFIG.map(config => ({
    name: config.label,
    value: data[config.key as keyof typeof data],
    percentage: total > 0 ? ((data[config.key as keyof typeof data] / total) * 100).toFixed(1) : '0',
    color: config.color,
  })).filter(item => item.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          Substatus Leads Quentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {total === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum lead quente no período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} leads (${props.payload.percentage}%)`,
                    name
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {total > 0 && (
          <div className="text-center -mt-24 mb-16 pointer-events-none">
            <div className="text-2xl font-bold text-destructive">{total}</div>
            <div className="text-xs text-muted-foreground">Quentes</div>
          </div>
        )}

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
