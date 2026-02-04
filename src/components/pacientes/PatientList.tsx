import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Patient, useDeletePatient } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useState } from "react";

interface PatientListProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
}

export function PatientList({ patients, onPatientClick }: PatientListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const deletePatient = useDeletePatient();

  if (patients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum paciente encontrado</p>
      </Card>
    );
  }

  const handleDeleteClick = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (patientToDelete) {
      deletePatient.mutate(patientToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setPatientToDelete(null);
        },
      });
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => (
          <Card
            key={patient.id}
            className="p-4 hover:shadow-md transition-shadow"
          >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 cursor-pointer" onClick={() => onPatientClick(patient)}>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                {patient.cpf && (
                  <p className="text-sm text-muted-foreground">CPF: {patient.cpf}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={patient.archived_at ? "secondary" : "default"}>
                  {patient.archived_at ? "Arquivado" : "Ativo"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onPatientClick(patient)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleDeleteClick(patient, e)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2 cursor-pointer" onClick={() => onPatientClick(patient)}>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.birth_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

          </div>
        </Card>
      ))}
    </div>

    <ConfirmDeleteDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      onConfirm={handleDelete}
      itemName={patientToDelete?.name}
      title="Excluir Paciente"
    />
    </>
  );
}
