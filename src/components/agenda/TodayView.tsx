import { useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/hooks/useAppointments";

interface TodayViewProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  rescheduled: "Atenção",
  no_show: "Faltou",
  cancelled: "Cancelado",
};

const statusBadgeClasses: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  attended: "bg-black text-white",
  rescheduled: "bg-yellow-100 text-yellow-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-purple-100 text-purple-800",
};

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 20;

export function TodayView({ appointments, onAppointmentClick }: TodayViewProps) {
  const professionals = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    let hasUnassigned = false;
    appointments.forEach((appointment) => {
      if (appointment.professional?.id) {
        map.set(appointment.professional.id, appointment.professional);
      } else {
        hasUnassigned = true;
      }
    });
    const list = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    if (hasUnassigned) {
      list.push({ id: "unassigned", name: "Sem profissional" });
    }
    return list.length > 0
      ? list
      : [{ id: "unassigned", name: "Sem profissional" }];
  }, [appointments]);

  const { startHour, endHour } = useMemo(() => {
    if (appointments.length === 0) {
      return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
    }
    const hours = appointments.map((appointment) => new Date(appointment.appointment_date).getHours());
    const minHour = Math.min(...hours, DEFAULT_START_HOUR);
    const maxHour = Math.max(...hours, DEFAULT_END_HOUR);
    return { startHour: minHour, endHour: maxHour };
  }, [appointments]);

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index),
    [startHour, endHour]
  );

  const appointmentsByProfessional = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      const key = appointment.professional?.id ?? "unassigned";
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    });
    map.forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      )
    );
    if (!map.has("unassigned")) {
      map.set("unassigned", []);
    }
    return map;
  }, [appointments]);

  const gridTemplateColumns = `120px repeat(${professionals.length}, minmax(200px, 1fr))`;

  return (
    <div className="overflow-auto">
      <div className="min-w-[720px]">
        <div
          className="grid gap-2 pb-2 border-b text-sm font-medium text-muted-foreground"
          style={{ gridTemplateColumns }}
        >
          <div>Horário</div>
          {professionals.map((professional) => (
            <div key={professional.id} className="px-2">
              {professional.name}
            </div>
          ))}
        </div>

        <div className="divide-y">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid gap-2 py-3"
              style={{ gridTemplateColumns }}
            >
              <div className="text-sm font-medium text-muted-foreground">
                {String(hour).padStart(2, "0")}:00
              </div>
              {professionals.map((professional) => {
                const items = (appointmentsByProfessional.get(professional.id) ?? []).filter(
                  (appointment) =>
                    new Date(appointment.appointment_date).getHours() === hour
                );
                return (
                  <div key={professional.id} className="space-y-2 px-2">
                    {items.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Sem agendamentos</div>
                    ) : (
                      items.map((appointment) => (
                        <button
                          key={appointment.id}
                          onClick={() => onAppointmentClick(appointment)}
                          className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {format(new Date(appointment.appointment_date), "HH:mm")} •{" "}
                                {appointment.patient?.name || appointment.lead?.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {appointment.procedure?.name || "Consulta"}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                statusBadgeClasses[appointment.status] ?? "bg-muted text-foreground"
                              )}
                            >
                              {statusLabels[appointment.status] ?? appointment.status}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
