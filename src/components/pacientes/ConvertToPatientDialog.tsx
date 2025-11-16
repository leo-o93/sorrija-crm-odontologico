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
import { useConvertLeadToPatient } from "@/hooks/usePatients";
import { Loader2 } from "lucide-react";

interface ConvertToPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

export function ConvertToPatientDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: ConvertToPatientDialogProps) {
  const convertToPatient = useConvertLeadToPatient();

  const handleConvert = async () => {
    await convertToPatient.mutateAsync(leadId);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Converter para Paciente</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja converter <strong>{leadName}</strong> em paciente? 
            <br />
            O status do lead será atualizado para "Em Tratamento" e um novo registro de paciente será criado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={convertToPatient.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConvert} disabled={convertToPatient.isPending}>
            {convertToPatient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Converter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
