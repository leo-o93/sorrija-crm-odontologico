import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { useLeadsReport } from '@/hooks/useReportData';
import { ExportButton } from './ExportButton';
import { Users, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface LeadsReportProps {
  startDate: Date;
  endDate: Date;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export function LeadsReport({ startDate, endDate }: LeadsReportProps) {
  const { data, isLoading } = useLeadsReport(startDate, endDate);

  if (isLoading) {
    return <div className="text-center p-8">Carregando relatório...</div>;
  }

  if (!data) return null;

  const sourceData = Object.entries(data.bySource).map(([name, value]) => ({
    name,
    value,
  }));

  const statusData = Object.entries(data.byStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const exportData = data.rawData.map((lead: any) => ({
    Nome: lead.name,
    Telefone: lead.phone,
    Status: lead.status,
    Fonte: lead.sources?.name || 'Sem fonte',
    'Data de Registro': lead.registration_date,
    Agendado: lead.scheduled ? 'Sim' : 'Não',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatório de Leads & CRM</h2>
        <ExportButton data={exportData} filename="relatorio_leads" sheetName="Leads" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={data.total}
          icon={Users}
        />
        <StatCard
          title="Agendados"
          value={`${data.scheduled} (${data.schedulingRate.toFixed(1)}%)`}
          icon={Calendar}
        />
        <StatCard
          title="Fechados"
          value={`${data.closed} (${data.conversionRate.toFixed(1)}%)`}
          icon={CheckCircle}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${data.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Leads por Fonte</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Leads por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detalhamento por Fonte</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Fonte</th>
                <th className="text-right p-2">Total de Leads</th>
                <th className="text-right p-2">% do Total</th>
              </tr>
            </thead>
            <tbody>
              {sourceData.map((source, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{source.name}</td>
                  <td className="text-right p-2">{source.value}</td>
                  <td className="text-right p-2">
                    {((source.value / data.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
