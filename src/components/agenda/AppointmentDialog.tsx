import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Phone, FileText, Trash2, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "./AppointmentForm";
import type { Appointment } from "@/hooks/useAppointments";
import { useNavigate } from "react-router-dom";

interface AppointmentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: any) => void;
  onDelete: (id: string) => void;
}

const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  rescheduled: "Atenção",
  no_show: "Faltou",
  cancelled: "Cancelado",
};

const statusClasses = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  attended: "bg-black text-white",
  rescheduled: "bg-yellow-100 text-yellow-800",
  no_show: "bg-red-100 text-red-800",
  cancelled: "bg-purple-100 text-purple-800",
} as const;

export function AppointmentDialog({
  appointment,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: AppointmentDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const navigate = useNavigate();

  if (!appointment && !isEditing) return null;

  const handleUpdate = (data: any) => {
    onUpdate({ id: appointment!.id, ...data });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(appointment!.id);
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Agendamento" : "Detalhes do Agendamento"}
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <AppointmentForm
              appointment={appointment!}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            appointment && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(appointment.appointment_date), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      statusClasses[appointment.status as keyof typeof statusClasses] ??
                      "bg-muted text-foreground"
                    }
                  >
                    {statusLabels[appointment.status as keyof typeof statusLabels] ?? appointment.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {appointment.patient?.name || appointment.lead?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.patient ? "Paciente" : "Lead"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {appointment.patient?.phone || appointment.lead?.phone}
                    </span>
                  </div>

                  {appointment.procedure && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{appointment.procedure.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.procedure.category}
                        </div>
                      </div>
                    </div>
                  )}

                  {appointment.professional && (
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{appointment.professional.name}</div>
                        <div className="text-sm text-muted-foreground">Profissional</div>
                      </div>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="pt-2">
                      <div className="text-sm font-medium mb-1">Observações:</div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.notes}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2 justify-end">
                  {appointment.patient?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/pacientes?id=${appointment.patient?.id}`)}
                    >
                      Abrir Paciente
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
