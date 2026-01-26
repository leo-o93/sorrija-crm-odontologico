import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePatients } from "@/hooks/usePatients";
import { useLeads } from "@/hooks/useLeads";
import { useProcedures } from "@/hooks/useProcedures";
import type { Appointment } from "@/hooks/useAppointments";

const isWithinBusinessHours = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes;
  return total >= 8 * 60 && total <= 18 * 60;
};

const formSchema = z.object({
  appointment_date: z.date({
    required_error: "Data e hora são obrigatórias",
  }),
  appointment_time: z.string().min(1, "Horário é obrigatório"),
  status: z.string().optional(),
  patient_id: z.string().optional(),
  lead_id: z.string().optional(),
  procedure_id: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.patient_id || data.lead_id, {
  message: "Selecione um paciente ou lead",
  path: ["patient_id"],
}).refine((data) => isWithinBusinessHours(data.appointment_time), {
  message: "Horário deve estar dentro do expediente",
  path: ["appointment_time"],
});

interface AppointmentFormProps {
  appointment?: Appointment;
  defaultDate?: Date;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function AppointmentForm({ appointment, defaultDate, onSubmit, onCancel }: AppointmentFormProps) {
  const { data: patients } = usePatients();
  const { data: leads } = useLeads();
  const { data: procedures } = useProcedures();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointment_date: appointment?.appointment_date 
        ? new Date(appointment.appointment_date)
        : defaultDate || new Date(),
      appointment_time: appointment?.appointment_date
        ? format(new Date(appointment.appointment_date), "HH:mm")
        : "09:00",
      status: appointment?.status || "scheduled",
      patient_id: appointment?.patient_id || "",
      lead_id: appointment?.lead_id || "",
      procedure_id: appointment?.procedure_id || "",
      notes: appointment?.notes || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const appointmentDateTime = new Date(values.appointment_date);
    const [hours, minutes] = values.appointment_time.split(":");
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

    onSubmit({
      appointment_date: appointmentDateTime.toISOString(),
      status: values.status,
      patient_id: values.patient_id || null,
      lead_id: values.lead_id || null,
      procedure_id: values.procedure_id || null,
      notes: values.notes || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="appointment_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointment_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="patient_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paciente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lead_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead (Caso não seja paciente)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leads?.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="procedure_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Procedimento</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um procedimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {procedures?.map((procedure) => (
                    <SelectItem key={procedure.id} value={procedure.id}>
                      {procedure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="attended">Atendido</SelectItem>
                  <SelectItem value="rescheduled">Reagendado</SelectItem>
                  <SelectItem value="no_show">Faltou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {appointment ? "Atualizar" : "Criar"} Agendamento
          </Button>
        </div>
      </form>
    </Form>
  );
}
