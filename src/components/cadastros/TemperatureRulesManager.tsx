import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TemperatureRuleForm } from "./TemperatureRuleForm";
import {
  useTemperatureRules,
  useCreateTemperatureRule,
  useUpdateTemperatureRule,
  useDeleteTemperatureRule,
  TemperatureTransitionRule,
  CreateRuleInput,
} from "@/hooks/useTemperatureRules";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Thermometer,
  ArrowRight,
  Timer,
  MessageCircle,
  AlertCircle,
} from "lucide-react";

const TRIGGER_LABELS: Record<string, { label: string; icon: typeof Timer }> = {
  inactivity_timer: { label: "Inatividade", icon: Timer },
  substatus_timeout: { label: "Timeout Substatus", icon: Clock },
  no_response: { label: "Sem Resposta", icon: MessageCircle },
};

const TEMPERATURE_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  quente: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  frio: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
};

export function TemperatureRulesManager() {
  const { data: rules, isLoading } = useTemperatureRules();
  const createRule = useCreateTemperatureRule();
  const updateRule = useUpdateTemperatureRule();
  const deleteRule = useDeleteTemperatureRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TemperatureTransitionRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<TemperatureTransitionRule | null>(null);

  const handleCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const handleEdit = (rule: TemperatureTransitionRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleSubmit = (data: CreateRuleInput) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...data }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createRule.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleToggleActive = (rule: TemperatureTransitionRule) => {
    updateRule.mutate({ id: rule.id, active: !rule.active });
  };

  const handleDelete = (rule: TemperatureTransitionRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRule.mutate(ruleToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setRuleToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" />
              <CardTitle>Regras de Transição de Temperatura</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          <CardDescription>
            Configure regras condicionais para transição automática de temperatura dos leads.
            As regras são processadas em ordem de prioridade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!rules || rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma regra configurada</p>
              <p className="text-sm">Crie regras para automatizar a transição de temperatura dos leads.</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Regra
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Regra</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Condição</TableHead>
                  <TableHead>Timer</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="w-20">Ativo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, index) => {
                  const TriggerIcon = TRIGGER_LABELS[rule.trigger_event]?.icon || Timer;
                  return (
                    <TableRow key={rule.id} className={!rule.active ? "opacity-50" : ""}>
                      <TableCell className="font-mono text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <TriggerIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {TRIGGER_LABELS[rule.trigger_event]?.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rule.from_temperature ? (
                            <Badge variant="outline" className={TEMPERATURE_COLORS[rule.from_temperature]}>
                              {rule.from_temperature.toUpperCase()}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Qualquer</span>
                          )}
                          {rule.from_substatus && (
                            <Badge variant="secondary" className="text-xs">
                              {rule.from_substatus === "em_conversa" ? "Em Conversa" : "Aguardando"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono text-sm">{formatTime(rule.timer_minutes)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {rule.action_set_temperature && (
                            <>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              <Badge className={TEMPERATURE_COLORS[rule.action_set_temperature]}>
                                {rule.action_set_temperature.toUpperCase()}
                              </Badge>
                            </>
                          )}
                          {rule.action_clear_substatus && (
                            <Badge variant="outline" className="text-xs">
                              Limpar substatus
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(rule)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TemperatureRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editingRule={editingRule}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Regra"
        itemName={ruleToDelete?.name}
      />
    </>
  );
}
