import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar } from "lucide-react";
import { Patient } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientListProps {
  patients: Patient[];
  onPatientClick: (patient: Patient) => void;
}

export function PatientList({ patients, onPatientClick }: PatientListProps) {
  if (patients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum paciente encontrado</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onPatientClick(patient)}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                {patient.cpf && (
                  <p className="text-sm text-muted-foreground">CPF: {patient.cpf}</p>
                )}
              </div>
              <Badge variant={patient.active ? "default" : "secondary"}>
                {patient.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="space-y-2">
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

            {patient.medical_history && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {patient.medical_history}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
