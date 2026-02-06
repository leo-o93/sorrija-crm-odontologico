import { useEffect, useMemo, useState } from "react";
import { endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppointments } from "@/hooks/useAppointments";
import {
  useAttendanceQueue,
  useCreateAttendanceQueue,
  useUpdateAttendanceQueue,
  type AttendanceQueueEntry,
} from "@/hooks/useAttendanceQueue";

const appointmentStatusLabel: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  rescheduled: "Atenção",
  no_show: "Faltou",
  cancelled: "Cancelado",
};

const appointmentStatusBadge: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  attended: "bg-black text-white",
  rescheduled: "bg-yellow-100 text-yellow-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-purple-100 text-purple-800",
};

const normalizeAppointmentStatus = (status: string | null | undefined) => {
  if (!status) return "scheduled";
  const normalized = status.toLowerCase();
  const map: Record<string, string> = {
    agendado: "scheduled",
    confirmado: "confirmed",
    remarcado: "rescheduled",
    reagendado: "rescheduled",
    reprogramado: "rescheduled",
    falta: "no_show",
    faltou: "no_show",
    cancelado: "cancelled",
    atendido: "attended",
  };
  return map[normalized] || normalized;
};

const getQueueContact = (entry: AttendanceQueueEntry) =>
  entry.appointment?.patient ||
  entry.appointment?.lead ||
  entry.patient ||
  entry.lead ||
  null;

export default function FilaAtendimento() {
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const createQueue = useCreateAttendanceQueue();
  const updateQueue = useUpdateAttendanceQueue();

  const startDate = format(startOfDay(new Date()), "yyyy-MM-dd");
  const endDate = format(endOfDay(new Date()), "yyyy-MM-dd");

  const { data: appointments, isLoading: appointmentsLoading } = useAppointments({
    startDate,
    endDate,
  });
  const { data: queueEntries, isLoading: queueLoading } = useAttendanceQueue({
    startDate,
    endDate,
  });

  const normalizedSearch = search.trim().toLowerCase();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (from?: string | null, to?: string | null) => {
    if (!from) return "-";
    const start = new Date(from).getTime();
    const end = to ? new Date(to).getTime() : now.getTime();
    const diffMs = Math.max(end - start, 0);
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const appointmentQueueIds = useMemo(() => {
    return new Set(
      (queueEntries || [])
        .map((entry) => entry.appointment_id)
        .filter((id): id is string => Boolean(id))
    );
  }, [queueEntries]);

  const pendingCheckInAppointments = useMemo(() => {
    const queueEligibleStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);
    return (appointments || [])
      .filter((appointment) => queueEligibleStatuses.has(normalizeAppointmentStatus(appointment.status)))
      .filter((appointment) => !appointmentQueueIds.has(appointment.id))
      .filter((appointment) => {
        if (!normalizedSearch) return true;
        const name = appointment.patient?.name || appointment.lead?.name || "";
        const phone = appointment.patient?.phone || appointment.lead?.phone || "";
        return (
          name.toLowerCase().includes(normalizedSearch) ||
          phone.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime()
      );
  }, [appointments, appointmentQueueIds, normalizedSearch]);

  const { waitingEntries, inProgressEntries } = useMemo(() => {
    const filtered = (queueEntries || []).filter((entry) => {
      if (!normalizedSearch) return true;
      const contact = getQueueContact(entry);
      const name = contact?.name || "";
      const phone = contact?.phone || "";
      return (
        name.toLowerCase().includes(normalizedSearch) ||
        phone.toLowerCase().includes(normalizedSearch)
      );
    });
    return {
      waitingEntries: filtered.filter((entry) => entry.status === "waiting"),
      inProgressEntries: filtered.filter((entry) => entry.status === "in_progress"),
    };
  }, [queueEntries, normalizedSearch]);

  const handleCheckIn = (appointmentId: string, patientId?: string | null, leadId?: string | null) => {
    createQueue.mutate({
      appointment_id: appointmentId,
      patient_id: patientId ?? null,
      lead_id: leadId ?? null,
    });
  };

  const handleStart = (entryId: string) => {
    updateQueue.mutate({
      id: entryId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    });
  };

  const handleFinish = (entryId: string) => {
    updateQueue.mutate({
      id: entryId,
      status: "completed",
      finished_at: new Date().toISOString(),
    });
  };

  if (appointmentsLoading || queueLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fila de Atendimento</h1>
          <p className="text-muted-foreground">Carregando fila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fila de Atendimento</h1>
          <p className="text-muted-foreground">
            Atendimento do dia {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input
            placeholder="Buscar paciente ou telefone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Check-in do dia</h2>
          <Badge variant="secondary">{pendingCheckInAppointments.length}</Badge>
        </div>
        {pendingCheckInAppointments.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">
            Nenhum agendamento disponível para check-in.
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {pendingCheckInAppointments.map((appointment) => {
              const contact = appointment.patient || appointment.lead;
              const professionalName = appointment.professional?.name;
              const normalizedStatus = normalizeAppointmentStatus(appointment.status);
              const badgeClass =
                appointmentStatusBadge[normalizedStatus] || "bg-gray-100 text-gray-700";

              return (
                <Card key={appointment.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">{contact?.name || "Sem nome"}</h3>
                        <Badge className={badgeClass}>
                          {appointmentStatusLabel[normalizedStatus] || appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{contact?.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                      {professionalName && (
                        <p className="text-sm font-medium text-primary">
                          Profissional: {professionalName}
                        </p>
                      )}
                      {appointment.procedure?.name && (
                        <p className="text-sm text-muted-foreground">
                          Procedimento: {appointment.procedure.name}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleCheckIn(appointment.id, appointment.patient?.id, appointment.lead?.id)
                      }
                      disabled={createQueue.isPending}
                    >
                      Check-in
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Em espera</h2>
            <Badge variant="secondary">{waitingEntries.length}</Badge>
          </div>
          {waitingEntries.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              Nenhum paciente aguardando atendimento.
            </Card>
          ) : (
            waitingEntries.map((entry) => {
              const contact = getQueueContact(entry);
              const professionalName = entry.appointment?.professional?.name;
              return (
                <Card key={entry.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{contact?.name || "Sem nome"}</h3>
                      <p className="text-sm text-muted-foreground">{contact?.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        Check-in às {format(new Date(entry.checked_in_at), "HH:mm")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tempo em espera: {formatDuration(entry.checked_in_at)}
                      </p>
                      {professionalName && (
                        <p className="text-sm font-medium text-primary">
                          Profissional: {professionalName}
                        </p>
                      )}
                      {entry.appointment?.procedure?.name && (
                        <p className="text-sm text-muted-foreground">
                          Procedimento: {entry.appointment.procedure.name}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStart(entry.id)}
                      disabled={updateQueue.isPending}
                    >
                      Iniciar atendimento
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Em atendimento</h2>
            <Badge variant="secondary">{inProgressEntries.length}</Badge>
          </div>
          {inProgressEntries.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              Nenhum atendimento em andamento.
            </Card>
          ) : (
            inProgressEntries.map((entry) => {
              const contact = getQueueContact(entry);
              const professionalName = entry.appointment?.professional?.name;
              return (
                <Card key={entry.id} className="p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{contact?.name || "Sem nome"}</h3>
                      <p className="text-sm text-muted-foreground">{contact?.phone}</p>
                      {entry.started_at && (
                        <p className="text-sm text-muted-foreground">
                          Iniciado às {format(new Date(entry.started_at), "HH:mm")}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Tempo em atendimento: {formatDuration(entry.started_at)}
                      </p>
                      {professionalName && (
                        <p className="text-sm font-medium text-primary">
                          Profissional: {professionalName}
                        </p>
                      )}
                      {entry.appointment?.procedure?.name && (
                        <p className="text-sm text-muted-foreground">
                          Procedimento: {entry.appointment.procedure.name}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleFinish(entry.id)}
                      disabled={updateQueue.isPending}
                    >
                      Finalizar
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
