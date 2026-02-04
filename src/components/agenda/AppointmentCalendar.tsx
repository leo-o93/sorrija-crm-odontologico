import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/hooks/useAppointments";
import { TodayView } from "@/components/agenda/TodayView";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  view: "week" | "month" | "today";
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const statusColors = {
  scheduled: "bg-blue-500",
  confirmed: "bg-emerald-500",
  attended: "bg-black",
  rescheduled: "bg-yellow-500",
  no_show: "bg-red-500",
  cancelled: "bg-purple-500",
};

export function AppointmentCalendar({ 
  appointments, 
  onDateClick, 
  onAppointmentClick,
  view,
  currentDate,
  onDateChange
}: AppointmentCalendarProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const days = view === "week" 
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.appointment_date), day)
    ).sort((a, b) => 
      new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    );
  };

  const goToPrevious = () => {
    if (view === "week") {
      onDateChange(addDays(currentDate, -7));
    } else {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goToNext = () => {
    if (view === "week") {
      onDateChange(addDays(currentDate, 7));
    } else {
      onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const todayAppointments = getAppointmentsForDay(currentDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <h2 className="text-xl font-semibold">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
      </div>

      {view === "today" ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <p className="text-sm text-muted-foreground">Agendamentos de hoje</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onDateClick(currentDate)}>
              Novo agendamento
            </Button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Nenhum agendamento para hoje.
            </div>
          ) : (
            <TodayView
              appointments={todayAppointments}
              onAppointmentClick={onAppointmentClick}
            />
          )}
        </Card>
      ) : view === "week" ? (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "p-3 cursor-pointer hover:bg-muted/50 transition-colors min-h-[200px]",
                  isToday && "ring-2 ring-primary"
                )}
                onClick={() => onDateClick(day)}
              >
                <div className="space-y-2">
                  <div className="text-center pb-2 border-b">
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className={cn(
                      "text-2xl font-semibold",
                      isToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                        className={cn(
                          "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
                          "bg-primary/10 border-l-2",
                          statusColors[apt.status as keyof typeof statusColors]
                        )}
                      >
                        <div className="font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.appointment_date), "HH:mm")}
                        </div>
                        <div className="truncate">
                          {apt.patient?.name || apt.lead?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold p-2 text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "p-2 cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px]",
                  !isCurrentMonth && "opacity-40",
                  isToday && "ring-2 ring-primary"
                )}
                onClick={() => onDateClick(day)}
              >
                <div className="space-y-1">
                  <div className={cn(
                    "text-sm font-medium",
                    isToday && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "w-full h-1 rounded",
                            statusColors[apt.status as keyof typeof statusColors]
                          )}
                        />
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
