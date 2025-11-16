import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Search } from "lucide-react";
import { usePatients, Patient } from "@/hooks/usePatients";
import { PatientList } from "@/components/pacientes/PatientList";
import { PatientForm } from "@/components/pacientes/PatientForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function Pacientes() {
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const { data: patients, isLoading } = usePatients({ search, active: true });

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setSelectedPatient(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestão de pacientes cadastrados</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      <PatientList patients={patients || []} onPatientClick={handlePatientClick} />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={handleCloseDialog} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm
              patient={selectedPatient}
              onSuccess={handleCloseDialog}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
