import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useProcedures } from '@/hooks/useProcedures';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuickScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string | null;
  patientId?: string | null;
  contactName: string;
}

export function QuickScheduleDialog({ 
  open, 
  onOpenChange, 
  leadId, 
  patientId,
  contactName 
}: QuickScheduleDialogProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>('09:00');
  const [procedureId, setProcedureId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const createAppointment = useCreateAppointment();
  const { data: procedures } = useProcedures();

  const handleSubmit = async () => {
    if (!date) return;

    const appointmentDate = new Date(date);
    const [hours, minutes] = time.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));

    await createAppointment.mutateAsync({
      appointment_date: appointmentDate.toISOString(),
      lead_id: leadId || undefined,
      patient_id: patientId || undefined,
      procedure_id: procedureId || undefined,
      notes: notes || undefined,
      status: 'scheduled',
    });

    onOpenChange(false);
    setDate(undefined);
    setTime('09:00');
    setProcedureId('');
    setNotes('');
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
    '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', 
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Consulta - {contactName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className={cn("rounded-md border pointer-events-auto")}
              locale={ptBR}
            />
          </div>

          <div>
            <Label>Horário</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Procedimento</Label>
            <Select value={procedureId} onValueChange={setProcedureId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures?.map((proc) => (
                  <SelectItem key={proc.id} value={proc.id}>
                    {proc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o agendamento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!date || createAppointment.isPending}
          >
            {createAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
