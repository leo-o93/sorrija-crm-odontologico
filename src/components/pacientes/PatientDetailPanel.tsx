import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  MessageCircle, 
  Calendar, 
  Edit, 
  History, 
  Trash2,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Pill,
  User,
  FileText,
  Power
} from "lucide-react";
import { Patient, useDeletePatient, useTogglePatientActive } from "@/hooks/usePatients";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuickScheduleDialog } from "@/components/inbox/QuickScheduleDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { PatientForm } from "./PatientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface PatientDetailPanelProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PatientDetailPanel({ patient, open, onOpenChange }: PatientDetailPanelProps) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletePatient = useDeletePatient();
  const toggleActive = useTogglePatientActive();
  const navigate = useNavigate();

  if (!patient) return null;

  const handleCall = () => {
    window.open(`tel:${patient.phone}`, "_blank");
  };

  const handleWhatsApp = () => {
    const phone = patient.phone.replace(/\D/g, "");
    const formattedPhone = phone.startsWith("55") ? phone : `55${phone}`;
    window.open(`https://wa.me/${formattedPhone}`, "_blank");
  };

  const handleViewHistory = () => {
    navigate(`/agenda?patient=${patient.id}`);
    onOpenChange(false);
  };

  const handleToggleActive = () => {
    toggleActive.mutate({ id: patient.id, active: !patient.active });
  };

  const handleDelete = () => {
    deletePatient.mutate(patient.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        onOpenChange(false);
      },
    });
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-xl">{patient.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={patient.active ? "default" : "secondary"}>
                    {patient.active ? "Ativo" : "Inativo"}
                  </Badge>
                  {patient.cpf && (
                    <span className="text-sm text-muted-foreground">
                      CPF: {patient.cpf}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button variant="outline" className="w-full" onClick={handleCall}>
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
            <Button variant="outline" className="w-full" onClick={handleWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <Button 
            className="w-full mb-4" 
            onClick={() => setScheduleOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Consulta
          </Button>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <History className="h-4 w-4 mr-1" />
              Histórico
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mb-4"
            onClick={handleToggleActive}
          >
            <Power className="h-4 w-4 mr-2" />
            {patient.active ? "Inativar Paciente" : "Ativar Paciente"}
          </Button>

          <Separator className="my-4" />

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Informações de Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.email}</span>
                </div>
              )}
              {patient.birth_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Nascimento: {format(new Date(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {(patient.address || patient.city || patient.state || patient.zip_code) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Endereço</h4>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm space-y-1">
                    {patient.address && <p>{patient.address}</p>}
                    {(patient.city || patient.state) && (
                      <p>{[patient.city, patient.state].filter(Boolean).join(" / ")}</p>
                    )}
                    {patient.zip_code && <p>CEP: {patient.zip_code}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Medical Information */}
          {(patient.medical_history || patient.allergies || patient.medications) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Informações Médicas</h4>
                <div className="space-y-3">
                  {patient.medical_history && (
                    <div className="flex items-start gap-3">
                      <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Histórico Médico</p>
                        <p className="text-sm">{patient.medical_history}</p>
                      </div>
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Alergias</p>
                        <p className="text-sm">{patient.allergies}</p>
                      </div>
                    </div>
                  )}
                  {patient.medications && (
                    <div className="flex items-start gap-3">
                      <Pill className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Medicamentos</p>
                        <p className="text-sm">{patient.medications}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Emergency Contact */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Contato de Emergência</h4>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm space-y-1">
                    {patient.emergency_contact_name && <p>{patient.emergency_contact_name}</p>}
                    {patient.emergency_contact_phone && <p>{patient.emergency_contact_phone}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {patient.notes && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{patient.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator className="my-4" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Criado em: {format(new Date(patient.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p>Atualizado em: {format(new Date(patient.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Schedule Dialog */}
      <QuickScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        patientId={patient.id}
        contactName={patient.name}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={patient}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        itemName={patient.name}
        title="Excluir Paciente"
      />
    </>
  );
}
