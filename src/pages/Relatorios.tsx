import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportFilters } from '@/components/relatorios/ReportFilters';
import { LeadsReport } from '@/components/relatorios/LeadsReport';
import { FinancialReport } from '@/components/relatorios/FinancialReport';
import { AppointmentsReport } from '@/components/relatorios/AppointmentsReport';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function Relatorios() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Relatórios detalhados e exportações</p>
      </div>

      <Card className="p-6">
        <ReportFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </Card>

      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads">📊 Leads & CRM</TabsTrigger>
          <TabsTrigger value="financial">💰 Financeiro</TabsTrigger>
          <TabsTrigger value="appointments">📅 Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadsReport startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialReport startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsReport startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
