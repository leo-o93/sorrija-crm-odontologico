import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface HotSubstatusChartProps {
  data: {
    em_conversa: number;
    aguardando_resposta: number;
    em_negociacao: number;
    follow_up_agendado: number;
  };
}

const SUBSTATUS_CONFIG = [
  { key: 'em_conversa', label: 'Em Conversa', color: 'hsl(var(--success))' },
  { key: 'aguardando_resposta', label: 'Aguardando', color: 'hsl(var(--warning))' },
  { key: 'em_negociacao', label: 'Negociação', color: 'hsl(var(--info))' },
  { key: 'follow_up_agendado', label: 'Follow-up', color: 'hsl(var(--primary))' },
];

export function HotSubstatusChart({ data }: HotSubstatusChartProps) {
  const chartData = SUBSTATUS_CONFIG
    .map(config => ({
      name: config.label,
      value: data[config.key as keyof typeof data],
      color: config.color,
    }))
    .filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leads Quentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            Nenhum lead quente no período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leads Quentes por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
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
              formatter={(value: number) => [`${value} leads`, '']}
            />
            <Legend 
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
