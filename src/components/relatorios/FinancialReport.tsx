import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { useFinancialReport } from '@/hooks/useReportData';
import { ExportButton } from './ExportButton';
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface FinancialReportProps {
  startDate: Date;
  endDate: Date;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function FinancialReport({ startDate, endDate }: FinancialReportProps) {
  const { data, isLoading } = useFinancialReport(startDate, endDate);

  if (isLoading) {
    return <div className="text-center p-8">Carregando relatório...</div>;
  }

  if (!data) return null;

  const categoryData = Object.entries(data.byCategory).map(([name, values]) => ({
    categoria: name,
    receitas: values.receitas,
    despesas: values.despesas,
  }));

  const monthlyData = Object.entries(data.byMonth).map(([month, values]) => ({
    mes: month,
    receitas: values.receitas,
    despesas: values.despesas,
    lucro: values.receitas - values.despesas,
  }));

  const paymentMethodData = Object.entries(data.byPaymentMethod).map(([name, value]) => ({
    name,
    value,
  }));

  const exportData = data.rawData.map((t: any) => ({
    Tipo: t.type === 'receita' ? 'Receita' : 'Despesa',
    Descrição: t.description || '',
    Categoria: t.expense_categories?.name || '',
    Valor: t.amount,
    Status: t.status,
    'Método de Pagamento': t.payment_methods?.name || '',
    'Data da Transação': t.transaction_date,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
        <ExportButton data={exportData} filename="relatorio_financeiro" sheetName="Financeiro" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receitas"
          value={`R$ ${data.receitas.toFixed(2)}`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Despesas"
          value={`R$ ${data.despesas.toFixed(2)}`}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${data.lucro.toFixed(2)}`}
          icon={DollarSign}
          variant={data.lucro > 0 ? 'success' : 'warning'}
        />
        <StatCard
          title="Margem"
          value={data.receitas > 0 ? `${((data.lucro / data.receitas) * 100).toFixed(1)}%` : '0%'}
          icon={Wallet}
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" className="text-xs" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" name="Receitas" />
            <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" name="Despesas" />
            <Line type="monotone" dataKey="lucro" stroke="hsl(var(--accent))" name="Lucro" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Receitas x Despesas por Categoria</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-right p-2">Receitas</th>
                  <th className="text-right p-2">Despesas</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((cat, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{cat.categoria}</td>
                    <td className="text-right p-2 text-green-600">
                      R$ {cat.receitas.toFixed(2)}
                    </td>
                    <td className="text-right p-2 text-red-600">
                      R$ {cat.despesas.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Por Método de Pagamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
