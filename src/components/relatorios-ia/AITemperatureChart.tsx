import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Thermometer } from 'lucide-react';

interface AITemperatureChartProps {
  data: {
    quente: number;
    morno: number;
    frio: number;
    novo: number;
  };
  insight?: string;
}

const TEMPERATURE_CONFIG = [
  { key: 'quente', label: 'Quente', color: 'hsl(0, 84%, 60%)' },
  { key: 'morno', label: 'Morno', color: 'hsl(38, 92%, 50%)' },
  { key: 'frio', label: 'Frio', color: 'hsl(210, 79%, 46%)' },
  { key: 'novo', label: 'Novo', color: 'hsl(262, 83%, 58%)' },
];

export function AITemperatureChart({ data, insight }: AITemperatureChartProps) {
  const total = data.quente + data.morno + data.frio + data.novo;
  
  const chartData = TEMPERATURE_CONFIG.map(config => ({
    name: config.label,
    value: data[config.key as keyof typeof data],
    percentage: total > 0 ? ((data[config.key as keyof typeof data] / total) * 100).toFixed(1) : '0',
    color: config.color,
  })).filter(item => item.value > 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-primary" />
          Distribuição por Temperatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          {total === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhum dado disponível
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
        
        {/* Center total */}
        {total > 0 && (
          <div className="text-center -mt-24 mb-16 pointer-events-none">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
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
