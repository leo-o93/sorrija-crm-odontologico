import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, CalendarClock } from "lucide-react";
import { appRoles, roleLabels, type AppRole } from "@/lib/roles";
import {
  useProfessionals,
  useCreateProfessional,
  useUpdateProfessional,
  useDeactivateProfessional,
  type Professional,
} from "@/hooks/useProfessionals";
import {
  useProfessionalAvailability,
  useCreateProfessionalAvailability,
  useUpdateProfessionalAvailability,
  useDeleteProfessionalAvailability,
  type ProfessionalAvailability,
} from "@/hooks/useProfessionalAvailability";

const weekdayOptions = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

type ProfessionalFormProps = {
  professional?: Professional;
  onSuccess: () => void;
};

function ProfessionalForm({ professional, onSuccess }: ProfessionalFormProps) {
  const [name, setName] = useState(professional?.name ?? "");
  const [role, setRole] = useState<AppRole>((professional?.role as AppRole) ?? "dentista");
  const [phone, setPhone] = useState(professional?.phone ?? "");
  const [email, setEmail] = useState(professional?.email ?? "");
  const [active, setActive] = useState(professional?.active ?? true);
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();

  const isSubmitting = createProfessional.isPending || updateProfessional.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    if (professional) {
      await updateProfessional.mutateAsync({
        id: professional.id,
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        email: email.trim() || null,
        active,
      });
    } else {
      await createProfessional.mutateAsync({
        name: name.trim(),
        role,
        phone: phone.trim() || null,
        email: email.trim() || null,
        active,
      });
    }

    onSuccess();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Nome</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Função</label>
        <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            {appRoles.map((roleOption) => (
              <SelectItem key={roleOption} value={roleOption}>
                {roleLabels[roleOption]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone</label>
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail</label>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">Ativo</p>
          <p className="text-xs text-muted-foreground">
            Exibir profissional nos agendamentos.
          </p>
        </div>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {professional ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

function AvailabilityRow({
  availability,
}: {
  availability: ProfessionalAvailability;
}) {
  const updateAvailability = useUpdateProfessionalAvailability();
  const deleteAvailability = useDeleteProfessionalAvailability();
  const [startTime, setStartTime] = useState(availability.start_time);
  const [endTime, setEndTime] = useState(availability.end_time);

  const handleUpdateTimes = async () => {
    if (toMinutes(startTime) >= toMinutes(endTime)) return;
    if (startTime === availability.start_time && endTime === availability.end_time) return;
    await updateAvailability.mutateAsync({
      id: availability.id,
      start_time: startTime,
      end_time: endTime,
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium">
          {weekdayOptions.find((item) => item.value === availability.weekday)?.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {availability.start_time} - {availability.end_time}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          onBlur={handleUpdateTimes}
        />
        <Input
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          onBlur={handleUpdateTimes}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ativo</span>
          <Switch
            checked={availability.is_active}
            onCheckedChange={(checked) =>
              updateAvailability.mutate({ id: availability.id, is_active: checked })
            }
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            deleteAvailability.mutate({
              id: availability.id,
              professionalId: availability.professional_id,
            })
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ProfessionalAvailabilityManager({
  professional,
}: {
  professional: Professional;
}) {
  const { data: availability, isLoading } = useProfessionalAvailability(professional.id);
  const createAvailability = useCreateProfessionalAvailability();
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [isActive, setIsActive] = useState(true);

  const handleAddAvailability = async () => {
    if (toMinutes(startTime) >= toMinutes(endTime)) return;
    await createAvailability.mutateAsync({
      professional_id: professional.id,
      weekday,
      start_time: startTime,
      end_time: endTime,
      is_active: isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-3">
        <h3 className="text-sm font-semibold">Nova Disponibilidade</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Dia da semana</label>
            <Select value={String(weekday)} onValueChange={(value) => setWeekday(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                {weekdayOptions.map((day) => (
                  <SelectItem key={day.value} value={String(day.value)}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Início</label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fim</label>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">Disponível</p>
            <p className="text-xs text-muted-foreground">Habilitar horário no agendamento.</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <Button onClick={handleAddAvailability} disabled={createAvailability.isPending}>
          Adicionar horário
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Horários cadastrados</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando disponibilidade...</p>
        ) : availability && availability.length > 0 ? (
          <div className="space-y-2">
            {availability.map((item) => (
              <AvailabilityRow key={item.id} availability={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum horário cadastrado.</p>
        )}
      </div>
    </div>
  );
}

export function ProfessionalsManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [availabilityProfessional, setAvailabilityProfessional] = useState<Professional | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<Professional | null>(null);

  const { data: professionals, isLoading } = useProfessionals(true);
  const deactivateProfessional = useDeactivateProfessional();

  const handleDeactivate = () => {
    if (!confirmDeactivate) return;
    deactivateProfessional.mutate(confirmDeactivate.id, {
      onSuccess: () => setConfirmDeactivate(null),
    });
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingProfessional(null);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profissionais</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Profissional
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {professionals?.map((professional) => (
          <Card key={professional.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{professional.name}</h3>
                <p className="text-sm text-muted-foreground">{roleLabels[professional.role]}</p>
                {professional.phone && (
                  <p className="text-xs text-muted-foreground">{professional.phone}</p>
                )}
                {professional.email && (
                  <p className="text-xs text-muted-foreground">{professional.email}</p>
                )}
              </div>
              <Badge variant={professional.active ? "default" : "secondary"}>
                {professional.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfessional(professional)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAvailabilityProfessional(professional)}
                className="flex-1"
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Disponibilidade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeactivate(professional)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Profissional</DialogTitle>
          </DialogHeader>
          <ProfessionalForm onSuccess={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProfessional} onOpenChange={() => setEditingProfessional(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Profissional</DialogTitle>
          </DialogHeader>
          {editingProfessional && (
            <ProfessionalForm professional={editingProfessional} onSuccess={handleCloseDialog} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!availabilityProfessional}
        onOpenChange={() => setAvailabilityProfessional(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Disponibilidade - {availabilityProfessional?.name}
            </DialogTitle>
          </DialogHeader>
          {availabilityProfessional && (
            <ProfessionalAvailabilityManager professional={availabilityProfessional} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeactivate} onOpenChange={() => setConfirmDeactivate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Profissional</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja desativar {confirmDeactivate?.name}?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Desativar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
