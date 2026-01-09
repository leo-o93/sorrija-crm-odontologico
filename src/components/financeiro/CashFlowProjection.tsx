import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCashFlow } from '@/hooks/useCashFlow';

export function CashFlowProjection() {
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const { data } = useCashFlow({ includeRecurring });

  const summary = {
    current: data?.[0]?.balance || 0,
    days30: data?.[29]?.balance || 0,
    days60: data?.[59]?.balance || 0,
    days90: data?.[89]?.balance || 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Projeção de Fluxo de Caixa</h3>
          <p className="text-sm text-muted-foreground">Projeção baseada em transações pendentes e recorrentes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={includeRecurring} onCheckedChange={setIncludeRecurring} id="include-recurring" />
          <Label htmlFor="include-recurring">Incluir recorrentes</Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Saldo atual</p>
          <p className="text-2xl font-semibold">R$ {summary.current.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Projeção 30d</p>
          <p className="text-2xl font-semibold">R$ {summary.days30.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Projeção 60d</p>
          <p className="text-2xl font-semibold">R$ {summary.days60.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Projeção 90d</p>
          <p className="text-2xl font-semibold">R$ {summary.days90.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => value?.slice(5)} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="balance" stroke="#2563eb" fill="url(#colorProjected)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
