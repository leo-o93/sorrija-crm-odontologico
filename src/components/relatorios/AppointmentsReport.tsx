import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAppointmentsReport } from '@/hooks/useReportData';
import { ExportButton } from './ExportButton';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface AppointmentsReportProps {
  startDate: Date;
  endDate: Date;
}

export function AppointmentsReport({ startDate, endDate }: AppointmentsReportProps) {
  const { data, isLoading } = useAppointmentsReport(startDate, endDate);

  if (isLoading) {
    return <div className="text-center p-8">Carregando relatório...</div>;
  }

  if (!data) return null;

  const procedureData = Object.entries(data.byProcedure)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const hourData = Object.entries(data.byHour)
    .map(([hour, value]) => ({ hour, value }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const exportData = data.rawData.map((apt: any) => ({
    Paciente: apt.patients?.name || apt.leads?.name || 'Não informado',
    Procedimento: apt.procedures?.name || 'Sem procedimento',
    Data: apt.appointment_date,
    Status: apt.status,
    Observações: apt.notes || '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatório de Agendamentos</h2>
        <ExportButton data={exportData} filename="relatorio_agendamentos" sheetName="Agendamentos" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Agendamentos"
          value={data.total}
          icon={Calendar}
        />
        <StatCard
          title="Concluídos"
          value={`${data.completed} (${data.completionRate.toFixed(1)}%)`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Cancelados"
          value={`${data.cancelled} (${data.total > 0 ? ((data.cancelled / data.total) * 100).toFixed(1) : 0}%)`}
          icon={XCircle}
          variant="warning"
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${data.completionRate.toFixed(1)}%`}
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Procedimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={procedureData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Agendamentos por Horário</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Procedimentos Mais Populares</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Procedimento</th>
                <th className="text-right p-2">Total de Agendamentos</th>
                <th className="text-right p-2">% do Total</th>
              </tr>
            </thead>
            <tbody>
              {procedureData.map((proc, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{proc.name}</td>
                  <td className="text-right p-2">{proc.value}</td>
                  <td className="text-right p-2">
                    {((proc.value / data.total) * 100).toFixed(1)}%
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
