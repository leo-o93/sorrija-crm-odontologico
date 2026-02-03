import { useMemo, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointments, useUpdateAppointment, type Appointment } from "@/hooks/useAppointments";

type QueueFilter = "waiting" | "in_progress" | "attended" | "no_show" | "all";

const statusLabel: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  rescheduled: "Reagendado",
  no_show: "Faltou",
  cancelled: "Cancelado",
};

const statusBadge: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  attended: "bg-green-100 text-green-800",
  rescheduled: "bg-purple-100 text-purple-800",
  no_show: "bg-orange-100 text-orange-800",
  cancelled: "bg-gray-200 text-gray-700",
};

const statusGroup = (status: string): QueueFilter => {
  if (["scheduled", "confirmed", "rescheduled"].includes(status)) return "waiting";
  if (status === "attended") return "attended";
  if (["no_show", "cancelled"].includes(status)) return "no_show";
  return "all";
};

export default function FilaAtendimento() {
  const [filter, setFilter] = useState<QueueFilter>("waiting");
  const [search, setSearch] = useState("");
  const updateAppointment = useUpdateAppointment();

  const startDate = format(startOfDay(new Date()), "yyyy-MM-dd");
  const endDate = format(endOfDay(new Date()), "yyyy-MM-dd");

  const { data: appointments, isLoading } = useAppointments({
    startDate,
    endDate,
  });

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (appointments || [])
      .filter((appointment) => {
        if (filter === "all") return true;
        return statusGroup(appointment.status) === filter;
      })
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
  }, [appointments, filter, search]);

  const counts = useMemo(() => {
    const base = {
      waiting: 0,
      attended: 0,
      no_show: 0,
      all: appointments?.length || 0,
      in_progress: 0,
    };
    (appointments || []).forEach((appointment) => {
      const group = statusGroup(appointment.status);
      if (group in base) {
        base[group as keyof typeof base] += 1;
      }
    });
    return base;
  }, [appointments]);

  const handleStatusChange = (appointment: Appointment, status: string) => {
    updateAppointment.mutate({ id: appointment.id, status });
  };

  if (isLoading) {
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

      <Tabs value={filter} onValueChange={(value) => setFilter(value as QueueFilter)}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="waiting">Aguardando ({counts.waiting})</TabsTrigger>
          <TabsTrigger value="attended">Atendidos ({counts.attended})</TabsTrigger>
          <TabsTrigger value="no_show">Faltas/Cancelados ({counts.no_show})</TabsTrigger>
          <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAppointments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum atendimento encontrado para o filtro selecionado.
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => {
            const name = appointment.patient?.name || appointment.lead?.name || "Sem nome";
            const phone = appointment.patient?.phone || appointment.lead?.phone || "";
            const badgeClass = statusBadge[appointment.status] || "bg-gray-100 text-gray-700";

            return (
              <Card key={appointment.id} className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{name}</h3>
                      <Badge className={badgeClass}>
                        {statusLabel[appointment.status] || appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(appointment.appointment_date), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                    {appointment.procedure?.name && (
                      <p className="text-sm text-muted-foreground">
                        Procedimento: {appointment.procedure.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {appointment.status === "scheduled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment, "confirmed")}
                      >
                        Confirmar
                      </Button>
                    )}
                    {appointment.status !== "attended" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(appointment, "attended")}
                      >
                        Marcar atendido
                      </Button>
                    )}
                    {appointment.status !== "no_show" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(appointment, "no_show")}
                      >
                        Marcar falta
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
