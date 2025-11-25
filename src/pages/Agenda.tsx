import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentCalendar } from "@/components/agenda/AppointmentCalendar";
import { AppointmentForm } from "@/components/agenda/AppointmentForm";
import { AppointmentDialog } from "@/components/agenda/AppointmentDialog";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  type Appointment,
} from "@/hooks/useAppointments";

export default function Agenda() {
  const [currentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const { data: appointments, isLoading } = useAppointments({
    startDate,
    endDate,
  });

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

  const handleCreateAppointment = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setSelectedDate(null);
      },
    });
  };

  const handleUpdateAppointment = (data: any) => {
    updateMutation.mutate(data);
  };

  const handleDeleteAppointment = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e consultas
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
            <TabsList>
              <TabsTrigger value="week" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="gap-2">
                <List className="h-4 w-4" />
                Mês
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <AppointmentCalendar
          appointments={appointments || []}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          view={view}
        />
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            defaultDate={selectedDate || undefined}
            onSubmit={handleCreateAppointment}
            onCancel={() => {
              setIsCreateDialogOpen(false);
              setSelectedDate(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AppointmentDialog
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdate={handleUpdateAppointment}
        onDelete={handleDeleteAppointment}
      />
    </div>
  );
}
